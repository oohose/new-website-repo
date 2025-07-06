// app/api/videos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await db.video.findUnique({
      where: { id: params.id },
      include: {
        category: true
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, categoryId, order } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if video exists
    const existingVideo = await db.video.findUnique({
      where: { id: params.id },
      include: { category: true }
    })

    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Validate category if provided
    if (categoryId && categoryId !== existingVideo.categoryId) {
      const categoryExists = await db.category.findUnique({
        where: { id: categoryId }
      })
      if (!categoryExists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      categoryId: categoryId || existingVideo.categoryId,
      updatedAt: new Date()
    }

    // Only include optional fields if they exist
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (order !== undefined && order !== null) {
      updateData.order = parseInt(order)
    }

    // Update video
    const updatedVideo = await db.video.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true
      }
    })

    return NextResponse.json({ 
      message: 'Video updated successfully',
      video: updatedVideo 
    })
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get video details
    const video = await db.video.findUnique({
      where: { id: params.id }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    try {
      // Delete from Cloudinary
      if (video.cloudinaryId) {
        await deleteFromCloudinary(video.cloudinaryId, 'video')
      }
    } catch (cloudinaryError) {
      console.error('Error deleting video from Cloudinary:', cloudinaryError)
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await db.video.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Video deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}