// app/api/upload/video/route.ts - Video upload endpoint
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadVideoToCloudinary } from '@/lib/cloudinary';
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for video uploads

export async function POST(req: NextRequest) {
  try {
    console.log('🎥 Video Upload API called');
    
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

    console.log('📝 Video upload details:', {
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

    // Validate file type
    const supportedVideoTypes = [
      'video/mp4', 'video/quicktime', 'video/mov', 'video/avi', 
      'video/webm', 'video/mkv', 'video/x-msvideo'
    ];
    
    if (!supportedVideoTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Only video files are allowed (MP4, MOV, AVI, WebM, MKV)" },
        { status: 400 }
      );
    }

    // Check file size (100MB limit)
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return NextResponse.json(
        { success: false, error: `File size ${sizeMB}MB exceeds 100MB limit` },
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

    // Create folder path - same as images, NO video subfolder
    let folderPath = "peysphotos";
    if (category.parent) {
      folderPath = `peysphotos/${category.parent.key}/${category.key}`;
    } else {
      folderPath = `peysphotos/${category.key}`;
    }

    // DON'T add /videos subfolder - keep videos in same folder as images
    // if (mediaType === 'video') {
    //   folderPath += '/videos';
    // }

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log('☁️ Uploading video to Cloudinary...');

    let uploadResponse;
    try {
      uploadResponse = await uploadVideoToCloudinary(buffer, {
        folder: folderPath,
        public_id: `${Date.now()}_${sanitizedTitle}`,
        tags: ['peyton-portfolio', 'video', category.key],
        // Video optimization settings
        quality: "auto:good",
        video_codec: "h264",
        audio_codec: "aac",
        // Generate thumbnail
        eager: [
          {
            width: 800,
            height: 600,
            crop: "fill",
            gravity: "center",
            format: "jpg",
            start_offset: "1"
          }
        ]
      });

      console.log('✅ Cloudinary video upload successful:', {
        public_id: uploadResponse.public_id,
        secure_url: uploadResponse.secure_url,
        width: uploadResponse.width,
        height: uploadResponse.height,
        format: uploadResponse.format,
        bytes: uploadResponse.bytes,
        duration: uploadResponse.duration,
        thumbnail_url: uploadResponse.thumbnail_url
      });

    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary video upload failed:', {
        name: cloudinaryError.name,
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        error: cloudinaryError.error
      });
      
      let errorMessage = "Cloudinary video upload failed";
      if (cloudinaryError.http_code === 401) {
        errorMessage = "Cloudinary authentication failed";
      } else if (cloudinaryError.http_code === 400) {
        errorMessage = "Invalid video file or parameters";
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

    // Get next order value for video sorting
    const lastVideo = await db.video.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = (lastVideo?.order || 0) + 1;

    // Save video to database
    console.log('💾 Saving video to database...');
    const savedVideo = await db.video.create({
      data: {
        title: title,
        description: description || null,
        cloudinaryId: uploadResponse.public_id,
        url: uploadResponse.secure_url,
        thumbnailUrl: uploadResponse.thumbnail_url || null,
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

    console.log('✅ Saved video to database:', savedVideo.id);

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        id: savedVideo.id,
        cloudinaryId: uploadResponse.public_id,
        url: uploadResponse.secure_url,
        thumbnailUrl: uploadResponse.thumbnail_url,
        title,
        categoryId,
        width: uploadResponse.width,
        height: uploadResponse.height,
        duration: uploadResponse.duration,
        format: uploadResponse.format,
        size: uploadResponse.bytes
      }
    });

  } catch (error: any) {
    console.error('💥 Video upload error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Video upload failed",
        details: error.message
      },
      { status: 500 }
    );
  }
}