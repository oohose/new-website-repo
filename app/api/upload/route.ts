// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const description = formData.get('description') as string | null

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: `peyton-portfolio/${category.key}`,
      public_id: `${category.key}_${Date.now()}`,
      tags: [category.key, 'portfolio']
    })

    // Get the next order number for this category
    const lastImage = await db.image.findFirst({
      where: { categoryId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastImage?.order || 0) + 1

    // Save to database
    const image = await db.image.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        cloudinaryId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        categoryId,
        order: nextOrder,
        width: cloudinaryResult.width || null,
        height: cloudinaryResult.height || null,
        format: cloudinaryResult.format || null,
        bytes: cloudinaryResult.bytes || null, // Use 'bytes' instead of 'size'
        isHeader: false // Set default value for isHeader
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ 
      message: 'Upload successful',
      image 
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Cloudinary')) {
        return NextResponse.json(
          { error: 'Image upload service error. Please try again.' },
          { status: 500 }
        )
      }
      if (error.message.includes('Database')) {
        return NextResponse.json(
          { error: 'Database error. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}