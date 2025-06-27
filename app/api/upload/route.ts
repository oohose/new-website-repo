// api/upload/route.ts - Matching your exact Prisma schema
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma"; // Make sure you have this import

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

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category is required." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    console.log('📝 Upload details:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      title,
      categoryId
    });

    // Convert file to buffer and write to temp file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(file.name);
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFilename = `${Date.now()}_${sanitizedTitle}${fileExtension}`;
    tempFilePath = path.join(os.tmpdir(), uniqueFilename);
    
    await writeFile(tempFilePath, buffer);
    console.log("[DEBUG] Temp file written to:", tempFilePath);

    // Get category info to create proper folder structure
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { key: true, name: true, parent: { select: { key: true, name: true } } }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 400 }
      );
    }

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

    console.log("[DEBUG] Cloudinary upload result:", {
      public_id: uploadResponse.public_id,
      secure_url: uploadResponse.secure_url,
      width: uploadResponse.width,
      height: uploadResponse.height,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes
    });

    // ✅ Save to database using your exact schema fields
    console.log("💾 Saving to database...");
    
    try {
      const savedImage = await prisma.image.create({
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
      
      console.log("✅ Image saved to database:", savedImage.id);
      
    } catch (dbError: any) {
      console.error("❌ Database save failed:", dbError);
      
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
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log("[DEBUG] Temp file cleaned up");
      } catch (cleanupError) {
        console.warn("[WARN] Failed to cleanup temp file:", cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        id: uploadResponse.public_id,
        url: uploadResponse.secure_url,
        title,
        categoryId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        size: uploadResponse.bytes
      }
    });

  } catch (error: any) {
    console.error("❌ Upload error:", error?.message || error);
    console.error("Stack:", error?.stack || "none");

    // Clean up temp file in case of error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log("[DEBUG] Temp file cleaned up after error");
      } catch (cleanupError) {
        console.warn("[WARN] Failed to cleanup temp file after error:", cleanupError);
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
        error: error?.message || "Failed to upload image. Please try again." 
      },
      { status: 500 }
    );
  }
}