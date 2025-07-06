// app/api/media/route.ts - Combined images and videos endpoint
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const categoryKey = searchParams.get('categoryKey')
    const includePrivate = searchParams.get('includePrivate') === 'true'

    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // Build the where clause for categories
    let categoryWhere: any = {}
    
    if (!isAdmin && !includePrivate) {
      categoryWhere.isPrivate = false
    }

    if (categoryId) {
      categoryWhere.id = categoryId
    } else if (categoryKey) {
      categoryWhere.key = categoryKey
    }

    // Get category with both images and videos
    const category = await db.category.findFirst({
      where: categoryWhere,
      include: {
        images: {
          orderBy: { order: 'asc' }
        },
        videos: {
          orderBy: { order: 'asc' }
        },
        subcategories: {
          where: !isAdmin && !includePrivate ? { isPrivate: false } : {},
          include: {
            images: {
              orderBy: { order: 'asc' }
            },
            videos: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!category) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Category not found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Combine images and videos from main category
    const media = [
      ...category.images.map(img => ({ ...img, mediaType: 'image' as const })),
      ...category.videos.map(vid => ({ ...vid, mediaType: 'video' as const }))
    ]

    // Add media from subcategories if they exist
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        media.push(
          ...subcategory.images.map(img => ({ ...img, mediaType: 'image' as const, subcategory: subcategory.name })),
          ...subcategory.videos.map(vid => ({ ...vid, mediaType: 'video' as const, subcategory: subcategory.name }))
        )
      }
    }

    // Sort by order
    media.sort((a, b) => a.order - b.order)

    return new Response(JSON.stringify({ 
      success: true, 
      category: {
        id: category.id,
        name: category.name,
        key: category.key,
        description: category.description,
        isPrivate: category.isPrivate
      },
      media,
      counts: {
        images: category.images.length,
        videos: category.videos.length,
        total: media.length
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching combined media:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch media' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}