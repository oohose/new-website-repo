import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db' // ← Add this import

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { images } = body

    // Replace this placeholder section with real Prisma calls:
    const savedImages = []
    
    for (const imageData of images) {
      // Real database save using Prisma
      const savedImage = await db.image.create({
        data: {
          publicId: imageData.publicId,
          url: imageData.url,
          originalFilename: imageData.originalFilename,
          format: imageData.format,
          width: imageData.width,
          height: imageData.height,
          bytes: imageData.bytes,
          categoryId: imageData.categoryId,
          tags: imageData.tags || [],
          isPrivate: false
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
    const isPublic = searchParams.get('public') === 'true'

    // Real database fetch using Prisma
    const images = await db.image.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(isPublic && { isPrivate: false })
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