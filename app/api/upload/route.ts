// api/upload/route.ts - Production-ready with better error handling
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    console.log('🚀 Upload API called - Environment:', process.env.NODE_ENV);
    
    // Check environment variables first (common deployment issue)
    const requiredEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET',
      'DATABASE_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars);
      return NextResponse.json(
        { 
          success: false, 
          error: "Server configuration error - missing environment variables",
          details: `Missing: ${missingEnvVars.join(', ')}`
        },
        { status: 500 }
      );
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const sizeMB = parseInt(contentLength) / 1024 / 1024;
      console.log(`📊 Request size: ${sizeMB.toFixed(2)}MB`);
      
      if (sizeMB > 10) {
        return NextResponse.json(
          { success: false, error: "File too large. Maximum size is 10MB." },
          { status: 413 }
        );
      }
    }

    // Parse form data with error handling
    let formData;
    try {
      formData = await req.formData();
    } catch (formError) {
      console.error('❌ Failed to parse form data:', formError);
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;

    console.log('📝 Upload details:', {
      fileName: file?.name,
      fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'No file',
      fileType: file?.type,
      title,
      categoryId,
      hasFile: !!file
    });

    // Validate required fields
    if (!file) {
      console.error('❌ No file uploaded');
      return NextResponse.json(
        { success: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!title) {
      console.error('❌ No title provided');
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      console.error('❌ No categoryId provided');
      return NextResponse.json(
        { success: false, error: "Category is required." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { success: false, error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    // Test database connection first
    console.log('🔍 Testing database connection...');
    let category;
    try {
      category = await db.category.findUnique({
        where: { id: categoryId },
        select: { id: true, key: true, name: true, parent: { select: { key: true, name: true } } }
      });
      
      if (!category) {
        console.error('❌ Category not found in database:', categoryId);
        return NextResponse.json(
          { success: false, error: "Category not found." },
          { status: 400 }
        );
      }
      
      console.log('✅ Database connection successful, category found:', category);
      
    } catch (dbTestError: any) {
      console.error('❌ Database connection failed:', dbTestError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database connection failed", 
          details: dbTestError.message 
        },
        { status: 500 }
      );
    }

    // File processing with better error handling
    console.log('📁 Processing file...');
    let bytes;
    try {
      bytes = await file.arrayBuffer();
    } catch (fileError) {
      console.error('❌ Failed to read file:', fileError);
      return NextResponse.json(
        { success: false, error: "Failed to process uploaded file" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(bytes);
    const fileExtension = path.extname(file.name) || '.jpg';
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFilename = `${Date.now()}_${sanitizedTitle}${fileExtension}`;
    
    // Create temp file with error handling
    try {
      tempFilePath = path.join(os.tmpdir(), uniqueFilename);
      await writeFile(tempFilePath, buffer);
      console.log("✅ Temp file created:", tempFilePath);
    } catch (tempFileError) {
      console.error('❌ Failed to create temp file:', tempFileError);
      return NextResponse.json(
        { success: false, error: "Failed to process file for upload" },
        { status: 500 }
      );
    }

    // Create folder path
    let folderPath = "peysphotos";
    if (category.parent) {
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      folderPath = `peysphotos/${category.key}`;
    }

    console.log(`📁 Cloudinary folder: ${folderPath}`);

    // Upload to Cloudinary with detailed error handling
    console.log('☁️ Uploading to Cloudinary...');
    let uploadResponse;
    try {
      uploadResponse = await cloudinary.uploader.upload(tempFilePath, {
        folder: folderPath,
        public_id: `${Date.now()}_${sanitizedTitle}`,
        resource_type: "image",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ],
        context: {
          title: title,
          category: category.name,
          category_key: category.key,
          uploaded_at: new Date().toISOString()
        }
      });

      console.log("✅ Cloudinary upload successful:", {
        public_id: uploadResponse.public_id,
        secure_url: uploadResponse.secure_url,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        bytes: uploadResponse.bytes
      });

    } catch (cloudinaryError: any) {
      console.error("❌ Cloudinary upload failed:", cloudinaryError);
      
      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch {}
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to upload image to cloud storage",
          details: cloudinaryError.message || "Cloudinary upload failed"
        },
        { status: 500 }
      );
    }

    // Save to database with detailed error handling
    console.log("💾 Saving to database...");
    let savedImage;
    try {
      savedImage = await db.image.create({
        data: {
          title: title,
          description: null,
          cloudinaryId: uploadResponse.public_id,
          url: uploadResponse.secure_url,
          width: uploadResponse.width,
          height: uploadResponse.height,
          format: uploadResponse.format,
          bytes: uploadResponse.bytes,
          isHeader: false,
          order: 0,
          categoryId: categoryId,
        }
      });
      
      console.log("✅ Image saved to database with ID:", savedImage.id);
      
    } catch (dbError: any) {
      console.error("❌ Database save failed:", dbError);
      
      // Clean up Cloudinary upload since database save failed
      try {
        await cloudinary.uploader.destroy(uploadResponse.public_id);
        console.log("🧹 Cleaned up Cloudinary upload due to database error");
      } catch (cleanupError) {
        console.error("⚠️ Failed to cleanup Cloudinary upload:", cleanupError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to save image to database",
          details: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }

    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log("🧹 Temp file cleaned up");
      } catch (cleanupError) {
        console.warn("⚠️ Failed to cleanup temp file:", cleanupError);
      }
    }

    // Success response
    const response = {
      success: true,
      message: "Image uploaded successfully",
      data: {
        id: savedImage.id,
        cloudinaryId: uploadResponse.public_id,
        url: uploadResponse.secure_url,
        title,
        categoryId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        size: uploadResponse.bytes
      }
    };

    console.log("🎉 Upload completed successfully");
    return NextResponse.json(response);

  } catch (error: any) {
    console.error("💥 Unexpected upload error:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });

    // Clean up temp file in case of error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log("🧹 Temp file cleaned up after error");
      } catch (cleanupError) {
        console.warn("⚠️ Failed to cleanup temp file after error:", cleanupError);
      }
    }

    // Return a proper JSON error response
    return NextResponse.json(
      { 
        success: false, 
        error: "Upload failed due to server error",
        details: error?.message || "Unknown error occurred",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}