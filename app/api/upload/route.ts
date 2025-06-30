// /app/api/upload/route.ts - Vercel-compatible version
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Upload API called - Vercel compatible version');
    
    // Check environment variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary environment variables');
      return NextResponse.json(
        { success: false, error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;

    console.log('📝 Upload details:', {
      fileName: file?.name,
      fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'No file',
      title,
      categoryId
    });

    // Validate inputs
    if (!file || !title || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Get category
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { 
        id: true, 
        key: true, 
        name: true, 
        parent: { 
          select: { key: true, name: true } 
        } 
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 400 }
      );
    }

    console.log('✅ Category found:', category.name);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create folder path
    let folderPath = "peysphotos";
    if (category.parent) {
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      folderPath = `peysphotos/${category.key}`;
    }

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log('☁️ Uploading to Cloudinary (Vercel-compatible method)...');

    // FIXED: Use cloudinary.uploader.upload with base64 instead of upload_stream
    // This method is more compatible with Vercel's serverless environment
    let uploadResponse;
    try {
      // Convert buffer to base64 data URL
      const base64 = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64}`;

      console.log('📤 Using base64 upload method...');

      uploadResponse = await cloudinary.uploader.upload(dataURI, {
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

      console.log('✅ Cloudinary upload successful:', {
        public_id: uploadResponse.public_id,
        secure_url: uploadResponse.secure_url,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        bytes: uploadResponse.bytes
      });

    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary upload failed:', {
        name: cloudinaryError.name,
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        error: cloudinaryError.error
      });
      
      // More specific error handling
      let errorMessage = "Cloudinary upload failed";
      if (cloudinaryError.http_code === 401) {
        errorMessage = "Cloudinary authentication failed";
      } else if (cloudinaryError.http_code === 400) {
        errorMessage = "Invalid file or parameters";
      } else if (cloudinaryError.message) {
        errorMessage = cloudinaryError.message;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: cloudinaryError.message
        },
        { status: 500 }
      );
    }

    // Save to database
    console.log('💾 Saving to database...');
    const savedImage = await db.image.create({
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

    console.log('✅ Saved to database:', savedImage.id);

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

  } catch (error: any) {
    console.error('💥 Upload error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Upload failed",
        details: error.message
      },
      { status: 500 }
    );
  }
}