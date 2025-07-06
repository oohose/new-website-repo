// app/api/upload/route.ts - Clean version for both images and videos
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary';
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for video uploads

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true
});

// Helper function to determine media type
function getMediaType(file: File): 'image' | 'video' {
  const fileType = file.type.toLowerCase();
  console.log('🔍 Checking file type:', fileType, 'for file:', file.name);
  
  const imageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ];
  const videoTypes = [
    'video/mp4', 'video/quicktime', 'video/mov', 'video/avi', 
    'video/webm', 'video/mkv', 'video/x-msvideo', 'video/x-quicktime'
  ];
  
  if (imageTypes.includes(fileType)) {
    console.log('✅ Detected as image');
    return 'image';
  } else if (videoTypes.includes(fileType)) {
    console.log('✅ Detected as video');
    return 'video';
  } else {
    console.error('❌ Unsupported file type:', fileType);
    throw new Error(`Unsupported file type: ${fileType}. Supported types: Images (${imageTypes.join(', ')}) and Videos (${videoTypes.join(', ')})`);
  }
}

// Helper function to get next order value
async function getNextOrderValue(categoryId: string, mediaType: 'image' | 'video'): Promise<number> {
  if (mediaType === 'image') {
    const lastImage = await db.image.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' }
    });
    return (lastImage?.order || 0) + 1;
  } else {
    const lastVideo = await db.video.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' }
    });
    return (lastVideo?.order || 0) + 1;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Upload API called - Clean version');
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const description = formData.get("description") as string;

    console.log('📝 Upload details:', {
      fileName: file?.name,
      fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'No file',
      fileType: file?.type,
      title,
      categoryId,
      description
    });

    // Validate inputs
    if (!file || !title || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine media type and validate
    let mediaType: 'image' | 'video';
    try {
      mediaType = getMediaType(file);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Check file size limits
    const maxImageSize = 50 * 1024 * 1024; // 50MB for images
    const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    const maxSize = mediaType === 'video' ? maxVideoSize : maxImageSize;
    
    if (file.size > maxSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const limitMB = mediaType === 'video' ? '100' : '50';
      return NextResponse.json(
        { success: false, error: `${mediaType} size ${sizeMB}MB exceeds ${limitMB}MB limit` },
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

    // Create folder path
    let folderPath = "peysphotos";
    if (category.parent) {
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      folderPath = `peysphotos/${category.key}`;
    }

    // Add media type subfolder for videos
    if (mediaType === 'video') {
      folderPath += '/videos';
    }

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');

    // Convert file to buffer and upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    console.log(`☁️ Uploading ${mediaType} to Cloudinary...`);

    let uploadResponse;
    let thumbnailUrl: string | undefined; // Declare outside try block
    
    try {
      if (mediaType === 'video') {
        console.log('📤 Using base64 upload method for video...');

        uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: folderPath,
          public_id: `${Date.now()}_${sanitizedTitle}`,
          resource_type: "video",
          quality: "auto",
          eager: [
            {
              width: 400,
              height: 300,
              crop: "fill",
              gravity: "center",
              format: "jpg",
              start_offset: "1"
            }
          ],
          eager_async: false,
          tags: ['peyton-portfolio', 'video', category.key]
        });
      } else {
        console.log('📤 Using base64 upload method for image...');

        uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: folderPath,
          public_id: `${Date.now()}_${sanitizedTitle}`,
          resource_type: "image",
          transformation: [
            { quality: "auto:good" },
            { fetch_format: "auto" }
          ],
          tags: ['peyton-portfolio', 'image', category.key]
        });
      }

      console.log(`✅ Cloudinary ${mediaType} upload successful:`, {
        public_id: uploadResponse.public_id,
        secure_url: uploadResponse.secure_url,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        bytes: uploadResponse.bytes,
        duration: uploadResponse.duration,
        eager: uploadResponse.eager ? uploadResponse.eager.length : 0
      });

      // For videos, get the thumbnail URL from eager transformations
      if (mediaType === 'video' && uploadResponse.eager && uploadResponse.eager.length > 0) {
        thumbnailUrl = uploadResponse.eager[0].secure_url;
        console.log('📸 Video thumbnail generated:', thumbnailUrl);
      }

    } catch (cloudinaryError: any) {
      console.error(`❌ Cloudinary ${mediaType} upload failed:`, {
        name: cloudinaryError.name,
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        error: cloudinaryError.error
      });
      
      let errorMessage = `Cloudinary ${mediaType} upload failed`;
      if (cloudinaryError.http_code === 401) {
        errorMessage = "Cloudinary authentication failed";
      } else if (cloudinaryError.http_code === 400) {
        errorMessage = `Invalid ${mediaType} file or parameters`;
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

    // Save to appropriate database table
    console.log(`💾 Saving ${mediaType} to database...`);
    
    const nextOrder = await getNextOrderValue(categoryId, mediaType);
    
    let savedMedia;
    
    if (mediaType === 'image') {
      savedMedia = await db.image.create({
        data: {
          title: title,
          description: description || null,
          cloudinaryId: uploadResponse.public_id,
          url: uploadResponse.secure_url,
          width: uploadResponse.width,
          height: uploadResponse.height,
          format: uploadResponse.format,
          bytes: uploadResponse.bytes,
          isHeader: false,
          order: nextOrder,
          categoryId: categoryId,
        },
        include: {
          category: true
        }
      });
    } else {
      savedMedia = await db.video.create({
        data: {
          title: title,
          description: description || null,
          cloudinaryId: uploadResponse.public_id,
          url: uploadResponse.secure_url,
          thumbnailUrl: thumbnailUrl || null,
          width: uploadResponse.width,
          height: uploadResponse.height,
          duration: uploadResponse.duration || null,
          format: uploadResponse.format,
          bytes: uploadResponse.bytes,
          bitrate: uploadResponse.bit_rate || null,
          frameRate: uploadResponse.frame_rate || null,
          order: nextOrder,
          categoryId: categoryId,
        },
        include: {
          category: true
        }
      });
    }

    console.log(`✅ Saved ${mediaType} to database:`, savedMedia.id);

    return NextResponse.json({
      success: true,
      message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
      data: {
        id: savedMedia.id,
        cloudinaryId: uploadResponse.public_id,
        url: uploadResponse.secure_url,
        thumbnailUrl: thumbnailUrl,
        title,
        categoryId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        duration: uploadResponse.duration,
        format: uploadResponse.format,
        size: uploadResponse.bytes,
        mediaType
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