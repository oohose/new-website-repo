// app/api/images/bulk-delete/route.ts

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// FIXED: Support both POST and DELETE methods
export async function DELETE(req: NextRequest) {
  return handleBulkDelete(req)
}

export async function POST(req: NextRequest) {
  return handleBulkDelete(req)
}

async function handleBulkDelete(req: NextRequest) {
  try {
    console.log('🗑️ Bulk delete API called')
    
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      console.error('❌ Unauthorized bulk delete attempt')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    console.log('📝 Bulk delete request body:', body)

    // FIXED: Support both data formats
    let imageIds: string[]
    let images: { id: string; cloudinaryId: string }[] = []

    if (body.imageIds && Array.isArray(body.imageIds)) {
      // New format from ImageManager: { imageIds: ["id1", "id2", ...] }
      imageIds = body.imageIds
      console.log(`📊 Received ${imageIds.length} image IDs to delete`)
      
      // Fetch the images with their Cloudinary IDs
      const fetchedImages = await db.image.findMany({
        where: {
          id: { in: imageIds }
        },
        select: {
          id: true,
          cloudinaryId: true,
          title: true
        }
      })
      
      images = fetchedImages
      console.log(`🔍 Found ${fetchedImages.length} images in database`)
      
    } else if (body.images && Array.isArray(body.images)) {
      // Old format: { images: [{ id: "...", cloudinaryId: "..." }, ...] }
      images = body.images
      imageIds = images.map(img => img.id)
      console.log(`📊 Received ${images.length} images to delete (old format)`)
      
    } else {
      console.error('❌ Invalid request format')
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Expected imageIds array or images array.' }),
        { status: 400 }
      )
    }

    if (images.length === 0) {
      console.warn('⚠️ No images found to delete')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No images found with provided IDs',
          deletedCount: 0 
        }),
        { status: 404 }
      )
    }

    // Limit bulk operations
    if (images.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete more than 50 images at once' }),
        { status: 400 }
      )
    }

    console.log('☁️ Starting Cloudinary deletions...')
    
    // Delete from Cloudinary (with error handling for each image)
    const cloudinaryResults = await Promise.allSettled(
      images.map(async (image) => {
        try {
          if (image.cloudinaryId) {
            await deleteFromCloudinary(image.cloudinaryId)
            console.log(`✅ Deleted from Cloudinary: ${image.cloudinaryId}`)
            return { success: true, id: image.id }
          } else {
            console.warn(`⚠️ No Cloudinary ID for image: ${image.id}`)
            return { success: false, id: image.id, reason: 'No Cloudinary ID' }
          }
        } catch (error: unknown) {
          console.error(`❌ Failed to delete from Cloudinary: ${image.cloudinaryId}`, error)
          return { success: false, id: image.id, reason: 'Cloudinary deletion failed' }
        }
      })
    )

    const cloudinarySuccesses = cloudinaryResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    console.log(`☁️ Cloudinary results: ${cloudinarySuccesses}/${images.length} successful`)

    // Delete from database
    console.log('💾 Deleting from database...')
    const deleteResult = await db.image.deleteMany({
      where: {
        id: {
          in: imageIds
        }
      }
    })

    console.log(`✅ Deleted ${deleteResult.count} images from database`)

    const response = {
      success: true,
      deletedCount: deleteResult.count,
      cloudinaryDeleted: cloudinarySuccesses,
      message: `Successfully deleted ${deleteResult.count} images`
    }

    console.log('📊 Bulk delete completed:', response)

    return new Response(JSON.stringify(response), { status: 200 })

  } catch (error: unknown) {
    console.error('💥 Bulk delete error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Bulk delete operation failed',
        details: errorMessage
      }),
      { status: 500 }
    )
  }
}