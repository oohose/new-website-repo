// app/api/admin/upload/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const categoryId = formData.get('categoryId') as string
    const titles = formData.getAll('titles') as string[]
    const descriptions = formData.getAll('descriptions') as string[]

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const title = titles[i] || file.name.replace(/\.[^/.]+$/, '')
      const description = descriptions[i] || ''

      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error('File must be an image')
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          throw new Error('File size too large')
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(buffer, {
          folder: `portfolio/${category.key}`,
          public_id: `${category.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tags: ['peyton-portfolio', category.key]
        })

        // Save to database
        const image = await db.image.create({
          data: {
            title,
            description: description || null,
            cloudinaryId: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            bytes: cloudinaryResult.bytes,
            categoryId: categoryId,
            order: await getNextOrderValue(categoryId)
          },
          include: {
            category: true
          }
        })

        results.push(image)
        successCount++

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        results.push({
          error: error instanceof Error ? error.message : 'Upload failed',
          filename: file.name
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      results,
      stats: {
        total: files.length,
        successful: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get next order value for image sorting
async function getNextOrderValue(categoryId: string): Promise<number> {
  const lastImage = await db.image.findFirst({
    where: { categoryId },
    orderBy: { order: 'desc' }
  })
  
  return (lastImage?.order || 0) + 1
}