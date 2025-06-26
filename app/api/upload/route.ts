// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload request received')
    
    // Check environment variables first
    console.log('Environment check:', {
      hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasCloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
      hasCloudinarySecret: !!process.env.CLOUDINARY_API_SECRET,
    })
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found', (session?.user as any)?.role)
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      console.log('Authorization failed - not admin')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const description = formData.get('description') as string | null

    console.log('Form data received:', {
      file: file ? `${file.name} (${file.size} bytes)` : 'No file',
      title,
      categoryId,
      description
    })

    // Validation
    if (!file) {
      console.log('Validation failed: No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      console.log('Validation failed: No title provided')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!categoryId) {
      console.log('Validation failed: No category provided')
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      console.log('Validation failed: File is not an image, type:', file.type)
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.log('Validation failed: File too large:', file.size)
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Verify category exists
    console.log('Looking up category:', categoryId)
    try {
      const category = await db.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        console.log('Category not found:', categoryId)
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      console.log('Category found:', category.name, category.key)

      // Convert file to buffer
      console.log('Converting file to buffer...')
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      console.log('Buffer created, size:', buffer.length)

      // Upload to Cloudinary with correct folder structure
      console.log('Uploading to Cloudinary...')
      const cloudinaryResult = await uploadToCloudinary(buffer, {
        folder: `portfolio/${category.key}`, // This will override the default folder
        public_id: `${category.key}_${Date.now()}`,
        tags: [category.key, 'portfolio']
      })
      console.log('Cloudinary upload successful:', cloudinaryResult.public_id)

      // Get the next order number for this category (with fallback)
      console.log('Getting next order number...')
      let nextOrder = 1
      try {
        const lastImage = await db.image.findFirst({
          where: { categoryId },
          orderBy: { order: 'desc' }
        })
        nextOrder = (lastImage?.order || 0) + 1
      } catch (orderError) {
        console.warn('Order field might not exist, using default order 1')
      }
      console.log('Next order number:', nextOrder)

      // Save to database with defensive field handling
      console.log('Saving to database...')
      const imageData: any = {
        title: title.trim(),
        description: description?.trim() || null,
        cloudinaryId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        categoryId,
        isHeader: false
      }

      // Only add optional fields if they might exist in your schema
      try {
        imageData.order = nextOrder
      } catch (e) {
        console.warn('Order field not available')
      }

      try {
        imageData.width = cloudinaryResult.width || null
        imageData.height = cloudinaryResult.height || null
        imageData.format = cloudinaryResult.format || null
        imageData.bytes = cloudinaryResult.bytes || null
      } catch (e) {
        console.warn('Some image metadata fields not available')
      }

      const image = await db.image.create({
        data: imageData,
        include: {
          category: true
        }
      })
      console.log('Database save successful:', image.id)

      return NextResponse.json({ 
        message: 'Upload successful',
        image 
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error details:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Handle specific error types with better messaging
      if (error.message.includes('Cloudinary') || error.message.includes('cloudinary')) {
        return NextResponse.json(
          { error: `Cloudinary error: ${error.message}` },
          { status: 500 }
        )
      }
      if (error.message.includes('Database') || error.message.includes('Prisma')) {
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        )
      }
      if (error.message.includes('auth') || error.message.includes('session')) {
        return NextResponse.json(
          { error: `Authentication error: ${error.message}` },
          { status: 500 }
        )
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}