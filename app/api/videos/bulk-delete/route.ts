// app/api/videos/bulk-delete/route.ts

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  return handleBulkDelete(req)
}

export async function POST(req: NextRequest) {
  return handleBulkDelete(req)
}

async function handleBulkDelete(req: NextRequest) {
  try {
    console.log('🗑️ Video bulk delete API called')
    
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      console.error('❌ Unauthorized video bulk delete attempt')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    console.log('📝 Video bulk delete request body:', body)

    // Support both data formats
    let videoIds: string[]
    let videos: { id: string; cloudinaryId: string }[] = []

    if (body.videoIds && Array.isArray(body.videoIds)) {
      // New format: { videoIds: ["id1", "id2", ...] }
      videoIds = body.videoIds
      console.log(`📊 Received ${videoIds.length} video IDs to delete`)
      
      // Fetch the videos with their Cloudinary IDs
      const fetchedVideos = await db.video.findMany({
        where: {
          id: { in: videoIds }
        },
        select: {
          id: true,
          cloudinaryId: true,
          title: true
        }
      })
      
      videos = fetchedVideos
      console.log(`🔍 Found ${fetchedVideos.length} videos in database`)
      
    } else if (body.videos && Array.isArray(body.videos)) {
      // Old format: { videos: [{ id: "...", cloudinaryId: "..." }, ...] }
      videos = body.videos
      videoIds = videos.map(video => video.id)
      console.log(`📊 Received ${videos.length} videos to delete (old format)`)
      
    } else {
      console.error('❌ Invalid request format')
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Expected videoIds array or videos array.' }),
        { status: 400 }
      )
    }

    if (videos.length === 0) {
      console.warn('⚠️ No videos found to delete')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No videos found with provided IDs',
          deletedCount: 0 
        }),
        { status: 404 }
      )
    }

    // Limit bulk operations
    if (videos.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete more than 50 videos at once' }),
        { status: 400 }
      )
    }

    console.log('☁️ Starting Cloudinary video deletions...')
    
    // Delete from Cloudinary (with error handling for each video)
    const cloudinaryResults = await Promise.allSettled(
      videos.map(async (video) => {
        try {
          if (video.cloudinaryId) {
            await deleteFromCloudinary(video.cloudinaryId, 'video')
            console.log(`✅ Deleted video from Cloudinary: ${video.cloudinaryId}`)
            return { success: true, id: video.id }
          } else {
            console.warn(`⚠️ No Cloudinary ID for video: ${video.id}`)
            return { success: false, id: video.id, reason: 'No Cloudinary ID' }
          }
        } catch (error: unknown) {
          console.error(`❌ Failed to delete video from Cloudinary: ${video.cloudinaryId}`, error)
          return { success: false, id: video.id, reason: 'Cloudinary deletion failed' }
        }
      })
    )

    const cloudinarySuccesses = cloudinaryResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    console.log(`☁️ Cloudinary video results: ${cloudinarySuccesses}/${videos.length} successful`)

    // Delete from database
    console.log('💾 Deleting videos from database...')
    const deleteResult = await db.video.deleteMany({
      where: {
        id: {
          in: videoIds
        }
      }
    })

    console.log(`✅ Deleted ${deleteResult.count} videos from database`)

    const response = {
      success: true,
      deletedCount: deleteResult.count,
      cloudinaryDeleted: cloudinarySuccesses,
      message: `Successfully deleted ${deleteResult.count} videos`
    }

    console.log('📊 Video bulk delete completed:', response)

    return new Response(JSON.stringify(response), { status: 200 })

  } catch (error: unknown) {
    console.error('💥 Video bulk delete error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Video bulk delete operation failed',
        details: errorMessage
      }),
      { status: 500 }
    )
  }
}