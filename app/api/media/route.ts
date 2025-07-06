// app/api/media/route.ts - Modified to include videos from "videos" subfolder
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true
})

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
        parent: {
          select: {
            key: true,
            name: true
          }
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

    // Get videos from the Cloudinary "videos" subfolder if it exists
    let cloudinaryVideos: any[] = []
    try {
      const folderPath = category.parent 
        ? `peysphotos/${category.parent.key}/${category.key}/videos`
        : `peysphotos/${category.key}/videos`

      console.log('🔍 Searching for videos in Cloudinary folder:', folderPath)

      const cloudinaryResult = await cloudinary.search
        .expression(`folder:"${folderPath}" AND resource_type:video`)
        .sort_by('created_at', 'desc')
        .max_results(500)
        .execute()

      if (cloudinaryResult.resources && cloudinaryResult.resources.length > 0) {
        console.log(`✅ Found ${cloudinaryResult.resources.length} videos in Cloudinary subfolder`)
        
        cloudinaryVideos = cloudinaryResult.resources.map((video: any, index: number) => {
          // Generate thumbnail URL more reliably
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME
          const thumbnailUrl = cloudName 
            ? `https://res.cloudinary.com/${cloudName}/video/upload/so_1,f_jpg,q_auto/${video.public_id}`
            : null

          return {
            id: `cloudinary_${video.public_id}`,
            title: video.display_name || video.public_id.split('/').pop() || 'Untitled Video',
            description: null,
            cloudinaryId: video.public_id,
            url: video.secure_url,
            thumbnailUrl,
            width: video.width || 1920,
            height: video.height || 1080,
            duration: video.duration || null,
            format: video.format || 'mp4',
            bytes: video.bytes || 0,
            bitrate: video.bit_rate || null,
            frameRate: video.frame_rate || null,
            order: 1000 + index, // Put cloudinary videos after DB videos
            categoryId: category.id,
            mediaType: 'video' as const,
            isCloudinaryOnly: true // Flag to identify these videos
          }
        })
      }
    } catch (cloudinaryError: any) {
      console.log('ℹ️ No videos subfolder found in Cloudinary or error accessing:', cloudinaryError.message || cloudinaryError)
      // This is fine - just means no videos subfolder exists
    }

    // Combine images and videos from main category
    const media = [
      ...category.images.map(img => ({ ...img, mediaType: 'image' as const })),
      ...category.videos.map(vid => ({ ...vid, mediaType: 'video' as const })),
      ...cloudinaryVideos // Add videos from Cloudinary subfolder
    ]

    // Add media from subcategories (but filter out any "videos" subcategory)
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        // Skip any subcategory named "videos" to hide the auto-created folder
        if (subcategory.name.toLowerCase() === 'videos' || subcategory.key.toLowerCase() === 'videos') {
          console.log('🙈 Hiding videos subcategory from display')
          continue
        }
        
        media.push(
          ...subcategory.images.map(img => ({ ...img, mediaType: 'image' as const, subcategory: subcategory.name })),
          ...subcategory.videos.map(vid => ({ ...vid, mediaType: 'video' as const, subcategory: subcategory.name }))
        )
      }
    }

    // Sort by order
    media.sort((a, b) => a.order - b.order)

    // Filter subcategories to hide the "videos" folder from the UI
    const visibleSubcategories = category.subcategories?.filter(sub => 
      sub.name.toLowerCase() !== 'videos' && sub.key.toLowerCase() !== 'videos'
    ) || []

    return new Response(JSON.stringify({ 
  success: true, 
  category: {
    id: category.id,
    name: category.name,
    key: category.key,
    description: category.description,
    isPrivate: category.isPrivate,
    subcategories: visibleSubcategories
  },
  media,
  counts: {
    images: category.images.length,
    videos: category.videos.length + cloudinaryVideos.length,
    total: media.length,
    cloudinaryVideos: cloudinaryVideos.length
  },
  timestamp: new Date().toISOString(), // Add timestamp for cache debugging
  cacheInfo: {
    revalidated: true,
    categoryKey: category.key
  }
}), { 
  status: 200,
  headers: { 
    'Content-Type': 'application/json',
    // Aggressive cache control to prevent stale data
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Timestamp': Date.now().toString() // Debug header
  }
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