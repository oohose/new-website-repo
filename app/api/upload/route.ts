// api/upload/route.ts - Fixed to use your db import
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { db } from "@/lib/db"; // ✅ Use the same db import as your other files

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    console.log('🚀 Upload API called');
    
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;

    console.log('📝 Upload details:', {
      fileName: file.name,
      fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'No file',
      fileType: file?.type,
      title,
      categoryId
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
    try {
      const dbTest = await db.category.findUnique({
        where: { id: categoryId },
        select: { id: true, key: true, name: true, parent: { select: { key: true, name: true } } }
      });
      console.log('✅ Database connection successful, category found:', dbTest);
      
      if (!dbTest) {
        console.error('❌ Category not found in database:', categoryId);
        return NextResponse.json(
          { success: false, error: "Category not found." },
          { status: 400 }
        );
      }
    } catch (dbTestError) {
      console.error('❌ Database connection failed:', dbTestError);
      return NextResponse.json(
        { success: false, error: "Database connection failed.", details: dbTestError instanceof Error ? dbTestError.message : String(dbTestError) },
        { status: 500 }
      );
    }

    // Convert file to buffer and write to temp file
    console.log('📁 Creating temp file...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(file.name);
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFilename = `${Date.now()}_${sanitizedTitle}${fileExtension}`;
    tempFilePath = path.join(os.tmpdir(), uniqueFilename);
    
    await writeFile(tempFilePath, buffer);
    console.log("✅ Temp file written to:", tempFilePath);

    // Get category info to create proper folder structure
    console.log('🔍 Fetching category details...');
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { key: true, name: true, parent: { select: { key: true, name: true } } }
    });

    if (!category) {
      console.error('❌ Category not found:', categoryId);
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 400 }
      );
    }

    console.log('✅ Category details:', category);

    // Create folder path: peysphotos/parent-category/sub-category OR peysphotos/category
    let folderPath = "peysphotos";
    if (category.parent) {
      // This is a subcategory
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      // This is a top-level category
      folderPath = `peysphotos/${category.key}`;
    }

    console.log(`📁 Creating folder structure: ${folderPath}`);

    // Upload to Cloudinary with dynamic folder structure
    console.log('☁️ Uploading to Cloudinary...');
    const uploadResponse = await cloudinary.uploader.upload(tempFilePath, {
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

    // Save to database using your exact schema fields
    console.log("💾 Saving to database...");
    
    try {
      const savedImage = await db.image.create({
        data: {
          title: title,
          description: null, // Optional field in your schema
          cloudinaryId: uploadResponse.public_id, // This matches your schema field name
          url: uploadResponse.secure_url,
          width: uploadResponse.width,
          height: uploadResponse.height,
          format: uploadResponse.format,
          bytes: uploadResponse.bytes, // This matches your schema field name
          isHeader: false, // Default value for your existing field
          order: 0, // Default value for your existing field
          categoryId: categoryId,
        }
      });
      
      console.log("✅ Image saved to database with ID:", savedImage.id);
      
      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
          console.log("🧹 Temp file cleaned up");
        } catch (cleanupError) {
          console.warn("⚠️ Failed to cleanup temp file:", cleanupError);
        }
      }

      return NextResponse.json({
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
      });
      
    } catch (dbError: any) {
      console.error("❌ Database save failed:", dbError);
      console.error("❌ Database error details:", {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      
      // If database save fails, we should clean up the Cloudinary upload
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

  } catch (error: any) {
    console.error("❌ Upload error:", error?.message || error);
    console.error("❌ Error details:", {
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

    if (error?.message?.includes('File size too large')) {
      return NextResponse.json(
        { success: false, error: "File too large for Cloudinary. Please compress the image." },
        { status: 413 }
      );
    }

    if (error?.http_code === 400) {
      return NextResponse.json(
        { success: false, error: "Invalid file format or corrupted file." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to upload image. Please try again.",
        details: error?.stack || "No stack trace available"
      },
      { status: 500 }
    );
  }
}