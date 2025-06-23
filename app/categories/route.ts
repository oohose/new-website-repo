import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getThumbnailUrl } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get('includePrivate') === 'true';

    const categories = await db.category.findMany({
      where: includePrivate ? {} : { isPrivate: false },
      include: {
        subcategories: {
          where: includePrivate ? {} : { isPrivate: false },
          include: {
            images: {
              take: 1, // Get first image for thumbnail
              orderBy: { order: 'asc' }
            },
            _count: {
              select: { images: true }
            }
          }
        },
        images: {
          take: 1, // Get first image for thumbnail
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Add thumbnail URLs
    const categoriesWithThumbnails = categories.map(category => ({
      ...category,
      thumbnailUrl: category.images[0] 
        ? getThumbnailUrl(category.images[0].publicId, 400, 300)
        : null,
      subcategories: category.subcategories.map(sub => ({
        ...sub,
        thumbnailUrl: sub.images[0]
          ? getThumbnailUrl(sub.images[0].publicId, 400, 300)
          : null
      }))
    }));

    return NextResponse.json(categoriesWithThumbnails);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}