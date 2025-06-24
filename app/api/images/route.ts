import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { images } = body

    const savedImages = []
    
    for (const imageData of images) {
      // Match your Prisma schema exactly
      const savedImage = await db.image.create({
        data: {
          title: imageData.title || imageData.originalFilename || 'Untitled', // Required field
          description: imageData.description || null,
          cloudinaryId: imageData.publicId, // Changed from 'publicId' to 'cloudinaryId'
          url: imageData.url,
          width: imageData.width || null,
          height: imageData.height || null,
          format: imageData.format || null,
          bytes: imageData.bytes || null,
          categoryId: imageData.categoryId,
          isHeader: false, // Default value
          order: 0 // Default value
        }
      })
      
      savedImages.push(savedImage)
    }

    return NextResponse.json({ 
      success: true, 
      images: savedImages 
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to save images' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const images = await db.image.findMany({
      where: {
        ...(categoryId && { categoryId })
      },
      include: {
        category: true // Include category info
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ images })

  } catch (error) {
    console.error('Fetch images error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    await db.image.delete({
      where: { id: imageId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' }, 
      { status: 500 }
    )
  }
}