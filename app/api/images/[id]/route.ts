import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const imageId = params.id

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    // Find the image to get cloudinary ID
    const image = await db.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        cloudinaryId: true,
        title: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Delete from Cloudinary first
    try {
      await deleteFromCloudinary(image.cloudinaryId)
      console.log(`✅ Deleted image from Cloudinary: ${image.cloudinaryId}`)
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError)
      // Continue with database deletion even if Cloudinary fails
      // This prevents orphaned database records
    }

    // Delete from database
    await db.image.delete({
      where: { id: imageId }
    })

    console.log(`✅ Deleted image from database: ${image.title}`)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}