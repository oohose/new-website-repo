// app/api/images/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'
import cloudinary from "@/lib/cloudinary"

// If none of the above work, use this direct instantiation:
const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const image = await prisma.image.findUnique({
      where: { id: params.id },
      include: {
        category: true
      }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, categoryId, isHeader, displayOrder } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check if image exists
    const existingImage = await prisma.image.findUnique({
      where: { id: params.id },
      include: { category: true }
    })

    if (!existingImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Validate category if provided
    if (categoryId && categoryId !== existingImage.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId }
      })
      if (!categoryExists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
    }

    // Prepare update data - only include fields that exist in your schema
    const updateData: any = {
      title: title.trim(),
      categoryId: categoryId || existingImage.categoryId,
      updatedAt: new Date()
    }

    // Only include optional fields if they exist in your schema
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (isHeader !== undefined) {
      updateData.isHeader = Boolean(isHeader)
    }
    
    if (displayOrder !== undefined && displayOrder !== null) {
      updateData.displayOrder = parseInt(displayOrder)
    }

    // Update image
    const updatedImage = await prisma.image.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true
      }
    })

    return NextResponse.json({ 
      message: 'Image updated successfully',
      image: updatedImage 
    })
  } catch (error) {
    console.error('Error updating image:', error)
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

    // Get image details
    const image = await prisma.image.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    try {
      // Delete from Cloudinary
      if (image.cloudinaryId) {
        await cloudinary.uploader.destroy(image.cloudinaryId)
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError)
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.image.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}