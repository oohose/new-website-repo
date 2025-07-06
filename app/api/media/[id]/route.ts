// app/api/media/[id]/route.ts - Delete media endpoint with revalidation
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Delete media API called for ID:', params.id)
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mediaId = params.id
    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    // First, try to find the media in images table
    let imageItem = await db.image.findUnique({
      where: { id: mediaId },
      include: {
        category: {
          select: { 
            key: true, 
            name: true,
            parent: { select: { key: true } }
          }
        }
      }
    })

    let videoItem = null
    let mediaType: 'image' | 'video' = 'image'
    let cloudinaryId: string | null = null
    let mediaItem: any = null

    if (imageItem) {
      mediaItem = imageItem
      mediaType = 'image'
    } else {
      // If not found in images, try videos table
      videoItem = await db.video.findUnique({
        where: { id: mediaId },
        include: {
          category: {
            select: { 
              key: true, 
              name: true,
              parent: { select: { key: true } }
            }
          }
        }
      })
      
      if (videoItem) {
        mediaItem = videoItem
        mediaType = 'video'
      }
    }

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    cloudinaryId = mediaItem.cloudinaryId
    const categoryKey = mediaItem.category.key
    const categoryName = mediaItem.category.name

    console.log('📋 Media details:', {
      id: mediaId,
      type: mediaType,
      title: mediaItem.title,
      cloudinaryId,
      categoryKey,
      categoryName
    })

    // Delete from Cloudinary first
    if (cloudinaryId) {
      try {
        console.log(`☁️ Deleting ${mediaType} from Cloudinary:`, cloudinaryId)
        await deleteFromCloudinary(cloudinaryId, mediaType)
        console.log('✅ Cloudinary deletion successful')
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary deletion failed:', cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
        // This prevents orphaned database records
      }
    }

    // Delete from database
    try {
      if (mediaType === 'image') {
        await db.image.delete({
          where: { id: mediaId }
        })
      } else {
        await db.video.delete({
          where: { id: mediaId }
        })
      }
      console.log(`✅ ${mediaType} deleted from database`)
    } catch (dbError) {
      console.error('❌ Database deletion failed:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete from database' },
        { status: 500 }
      )
    }

    // 🚨 COMPREHENSIVE CACHE INVALIDATION - This is the key fix!
    try {
      console.log('🔄 Starting comprehensive cache invalidation...')
      
      // STEP 1: Revalidate specific tags
      revalidateTag(`gallery-${categoryKey}`)
      revalidateTag('media')
      revalidateTag('categories')
      revalidateTag('images')
      revalidateTag('videos')
      
      // STEP 2: Revalidate specific gallery pages
      revalidatePath(`/gallery/${categoryKey}`, 'page')
      revalidatePath('/gallery/[key]', 'page') // Dynamic route pattern
      
      // STEP 3: If this is a subcategory, also revalidate parent
      if (mediaItem.category.parent) {
        revalidateTag(`gallery-${mediaItem.category.parent.key}`)
        revalidatePath(`/gallery/${mediaItem.category.parent.key}`, 'page')
      }
      
      // STEP 4: Revalidate API routes
      revalidatePath('/api/media')
      revalidatePath('/api/categories')
      
      // STEP 5: Revalidate home page (portfolio section)
      revalidatePath('/', 'page')
      
      // STEP 6: Force a cache-busting timestamp for debugging
      const timestamp = Date.now()
      console.log('✅ Cache invalidation complete at:', new Date(timestamp).toISOString())
      
      // STEP 7: Optional delay to ensure cache clearing propagates
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (revalidateError) {
      console.error('❌ Cache revalidation failed:', revalidateError)
      // Don't fail the deletion if cache revalidation fails
    }

    return NextResponse.json({
      success: true,
      message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} deleted successfully`,
      data: {
        id: mediaId,
        type: mediaType,
        categoryKey,
        categoryName,
        cloudinaryDeleted: !!cloudinaryId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('💥 Delete media error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete media",
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Also handle GET for fetching single media item (optional)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    
    const mediaId = params.id
    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    // Try to find in images first
    let imageItem = await db.image.findUnique({
      where: { id: mediaId },
      include: {
        category: {
          select: { 
            key: true, 
            name: true, 
            isPrivate: true,
            parent: { select: { key: true, isPrivate: true } }
          }
        }
      }
    })

    let videoItem = null
    let mediaType: 'image' | 'video' = 'image'
    let mediaItem: any = null

    if (imageItem) {
      mediaItem = imageItem
      mediaType = 'image'
    } else {
      // If not found in images, try videos
      videoItem = await db.video.findUnique({
        where: { id: mediaId },
        include: {
          category: {
            select: { 
              key: true, 
              name: true, 
              isPrivate: true,
              parent: { select: { key: true, isPrivate: true } }
            }
          }
        }
      })
      
      if (videoItem) {
        mediaItem = videoItem
        mediaType = 'video'
      }
    }

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Check privacy permissions
    const isPrivateCategory = mediaItem.category.isPrivate || 
                             (mediaItem.category.parent?.isPrivate ?? false)
    
    if (isPrivateCategory && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...mediaItem,
        mediaType
      }
    })

  } catch (error: any) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}