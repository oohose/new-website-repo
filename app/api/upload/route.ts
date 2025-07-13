// app/api/upload/route.ts - Clean version for both images and videos
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary';
import { db } from "@/lib/db";
import { revalidatePath } from 'next/cache';
import { MediaCompressor } from '@/utils/mediaCompression'

export const dynamic = 'force-dynamic'

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
    console.log('🚀 Metadata-only Upload API called');

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content type',
          details: 'Expected application/json',
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      url,
      cloudinaryId,
      title,
      categoryId,
      width,
      height,
      format,
      bytes,
      duration,
      mediaType,
      thumbnailUrl,
    } = body;

    if (!url || !cloudinaryId || !title || !mediaType || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, key: true, name: true, parent: { select: { key: true } } },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      );
    }

    const nextOrder = await getNextOrderValue(categoryId, mediaType);

    let savedMedia;

    if (mediaType === 'image') {
      savedMedia = await db.image.create({
        data: {
          title,
          url,
          cloudinaryId,
          width,
          height,
          format,
          bytes,
          order: nextOrder,
          categoryId,
        },
        include: { category: true },
      });
    } else {
      savedMedia = await db.video.create({
        data: {
          title,
          url,
          cloudinaryId,
          width,
          height,
          format,
          bytes,
          duration,
          thumbnailUrl,
          order: nextOrder,
          categoryId,
        },
        include: { category: true },
      });
    }

    console.log(`✅ Saved ${mediaType} to DB with ID:`, savedMedia.id);

    // Revalidate cache here if needed
    // ...

    return NextResponse.json({
      success: true,
      message: `${mediaType} metadata saved`,
      data: {
        id: savedMedia.id,
        url,
        cloudinaryId,
        mediaType,
        width,
        height,
        duration,
        format,
        thumbnailUrl,
        categoryKey: category.key,
      },
    });
  } catch (err: any) {
    console.error('❌ Upload metadata error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
