// api/upload/route.ts - Debug Cloudinary credentials
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Upload API called');
    
    // Extract and validate environment variables with type safety
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Debug environment variables
    console.log('🔍 Environment variables check:', {
      NODE_ENV: process.env.NODE_ENV,
      CLOUDINARY_CLOUD_NAME: cloudName ? `SET (${cloudName})` : 'MISSING',
      CLOUDINARY_API_KEY: apiKey ? `SET (${apiKey.substring(0, 5)}...)` : 'MISSING',
      CLOUDINARY_API_SECRET: apiSecret ? 'SET (hidden)' : 'MISSING'
    });

    // Strict validation with detailed error messages
    if (!cloudName) {
      console.error('❌ CLOUDINARY_CLOUD_NAME is missing');
      return NextResponse.json(
        { success: false, error: "CLOUDINARY_CLOUD_NAME environment variable is missing" },
        { status: 500 }
      );
    }

    if (!apiKey) {
      console.error('❌ CLOUDINARY_API_KEY is missing');
      return NextResponse.json(
        { success: false, error: "CLOUDINARY_API_KEY environment variable is missing" },
        { status: 500 }
      );
    }

    if (!apiSecret) {
      console.error('❌ CLOUDINARY_API_SECRET is missing');
      return NextResponse.json(
        { success: false, error: "CLOUDINARY_API_SECRET environment variable is missing" },
        { status: 500 }
      );
    }

    // Configure Cloudinary with validated variables
    console.log('⚙️ Configuring Cloudinary with validated credentials...');
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    // Test Cloudinary connection BEFORE upload
    console.log('🔍 Testing Cloudinary connection...');
    try {
      const pingResult = await cloudinary.api.ping();
      console.log('✅ Cloudinary ping successful:', pingResult);
    } catch (pingError: any) {
      console.error('❌ Cloudinary ping failed:', {
        message: pingError.message,
        http_code: pingError.http_code,
        error: pingError.error
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Cloudinary authentication failed",
          details: `Ping failed: ${pingError.message}`,
          http_code: pingError.http_code
        },
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
    console.log(`📦 Buffer created: ${buffer.length} bytes`);

    // Create folder path
    let folderPath = "peysphotos";
    if (category.parent) {
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      folderPath = `peysphotos/${category.key}`;
    }

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const publicId = `${Date.now()}_${sanitizedTitle}`;
    
    console.log('☁️ Cloudinary upload parameters:', {
      folder: folderPath,
      public_id: publicId,
      buffer_size: buffer.length
    });

    // Upload to Cloudinary with detailed error logging
    let uploadResponse: any;
    try {
      uploadResponse = await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: folderPath,
          public_id: publicId,
          resource_type: "image" as const,
          transformation: [
            { quality: "auto:good" },
            { fetch_format: "auto" }
          ]
        };

        console.log('📤 Starting Cloudinary upload with options:', uploadOptions);

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload_stream error:', {
                message: error.message,
                http_code: error.http_code,
                error_code: error.error?.code,
                error_message: error.error?.message,
                full_error: error
              });
              reject(error);
            } else if (result) {
              console.log('✅ Cloudinary upload successful:', {
                public_id: result.public_id,
                secure_url: result.secure_url,
                width: result.width,
                height: result.height,
                bytes: result.bytes
              });
              resolve(result);
            } else {
              console.error('❌ No result from Cloudinary upload');
              reject(new Error('No result from Cloudinary'));
            }
          }
        );

        console.log('📤 Writing buffer to upload stream...');
        uploadStream.end(buffer);
      });

    } catch (cloudinaryError: any) {
      console.error('💥 Cloudinary upload failed:', cloudinaryError);
      
      let errorMessage = "Cloudinary upload failed";
      let details = cloudinaryError.message || "Unknown Cloudinary error";
      
      if (cloudinaryError.http_code === 401) {
        errorMessage = "Cloudinary authentication failed - invalid credentials";
        details = "Check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET";
      } else if (cloudinaryError.http_code === 400) {
        errorMessage = "Invalid upload parameters";
      } else if (cloudinaryError.http_code === 420) {
        errorMessage = "Cloudinary rate limit exceeded";
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: details,
          http_code: cloudinaryError.http_code,
          cloudinary_error: cloudinaryError.error
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
    console.error('💥 Unexpected upload error:', error);
    
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