// api/upload/route.ts - Clean and simple version
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
    console.log('🚀 Upload API called');
    
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
    
    console.log('☁️ Uploading to Cloudinary...');

    // Upload to Cloudinary using upload_stream
    const uploadResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: `${Date.now()}_${sanitizedTitle}`,
          resource_type: "image",
          transformation: [
            { quality: "auto:good" },
            { fetch_format: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error);
            reject(error);
          } else if (result) {
            console.log('✅ Cloudinary success:', result.public_id);
            resolve(result);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );

      uploadStream.end(buffer);
    });

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
    
    // Handle specific Cloudinary errors
    if (error.http_code) {
      let errorMessage = "Cloudinary upload failed";
      if (error.http_code === 401) {
        errorMessage = "Cloudinary authentication failed";
      } else if (error.http_code === 400) {
        errorMessage = "Invalid file or parameters";
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: error.message
        },
        { status: 500 }
      );
    }

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