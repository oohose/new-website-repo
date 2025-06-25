import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageIds } = body

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid image IDs provided' },
        { status: 400 }
      )
    }

    // Validate that all IDs are strings
    if (!imageIds.every(id => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All image IDs must be strings' },
        { status: 400 }
      )
    }

    // Fetch images to delete (to get cloudinary IDs)
    const imagesToDelete = await db.image.findMany({
      where: {
        id: {
          in: imageIds
        }
      },
      select: {
        id: true,
        cloudinaryId: true,
        title: true
      }
    })

    if (imagesToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No images found to delete' },
        { status: 404 }
      )
    }

    let deletedCount = 0
    let cloudinaryErrors: string[] = []
    let databaseErrors: string[] = []

    // Delete images in batches to avoid overwhelming Cloudinary
    const batchSize = 10
    const batches = []
    for (let i = 0; i < imagesToDelete.length; i += batchSize) {
      batches.push(imagesToDelete.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      // Delete from Cloudinary first
      const cloudinaryPromises = batch.map(async (image) => {
        try {
          await deleteFromCloudinary(image.cloudinaryId)
          return { success: true, imageId: image.id }
        } catch (error) {
          console.error(`Failed to delete image ${image.title} from Cloudinary:`, error)
          cloudinaryErrors.push(`${image.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return { success: false, imageId: image.id }
        }
      })

      const cloudinaryResults = await Promise.all(cloudinaryPromises)
      const successfulCloudinaryDeletes = cloudinaryResults
        .filter(result => result.success)
        .map(result => result.imageId)

      // Delete from database (only those successfully deleted from Cloudinary)
      if (successfulCloudinaryDeletes.length > 0) {
        try {
          const deleteResult = await db.image.deleteMany({
            where: {
              id: {
                in: successfulCloudinaryDeletes
              }
            }
          })
          deletedCount += deleteResult.count
        } catch (error) {
          console.error('Database delete error:', error)
          databaseErrors.push(`Failed to delete ${successfulCloudinaryDeletes.length} images from database`)
        }
      }
    }

    // Prepare response
    const totalRequested = imageIds.length
    const response: any = {
      success: true,
      deletedCount,
      totalRequested,
      message: `Successfully deleted ${deletedCount} of ${totalRequested} images`
    }

    // Add error details if any
    if (cloudinaryErrors.length > 0 || databaseErrors.length > 0) {
      response.warnings = {
        cloudinaryErrors,
        databaseErrors
      }
      
      if (deletedCount === 0) {
        response.success = false
        response.message = 'Failed to delete any images'
      } else if (deletedCount < totalRequested) {
        response.message += ` (${totalRequested - deletedCount} failed)`
      }
    }

    console.log(`✅ Bulk delete completed: ${deletedCount}/${totalRequested} images deleted`)

    return NextResponse.json(response, { 
      status: response.success ? 200 : 207 // 207 = Multi-Status for partial success
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}