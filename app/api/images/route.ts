import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getThumbnailUrl, getDisplayUrl } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includePrivate = searchParams.get('includePrivate') === 'true';

    let images;
    
    if (category) {
      images = await db.image.findMany({
        where: {
          category: {
            key: category,
            ...(includePrivate ? {} : { isPrivate: false })
          }
        },
        include: {
          category: true
        },
        orderBy: {
          order: 'asc'
        }
      });
    } else {
      images = await db.image.findMany({
        where: includePrivate ? {} : {
          category: {
            isPrivate: false
          }
        },
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Add Cloudinary URLs to each image
    const imagesWithUrls = images.map(image => ({
      ...image,
      thumbnailUrl: getThumbnailUrl(image.publicId, 400, 300),
      displayUrl: getDisplayUrl(image.publicId, 1920),
      fullUrl: getDisplayUrl(image.publicId)
    }));

    return NextResponse.json(imagesWithUrls);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}