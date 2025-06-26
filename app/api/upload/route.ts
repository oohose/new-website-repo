import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const categoryId = formData.get('categoryId') as string
    const description = formData.get('description') as string | null

    if (!file || !title || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Upload request received')

    // Lookup category
    const category = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    console.log(`Category found: ${category.name} (${category.key})`)

    // Convert file to buffer
    console.log('Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Buffer created, size:', buffer.length)

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...')
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `portfolio/${category.key}`,
          public_id: `${category.key}_${Date.now()}`,
          tags: [category.key, 'portfolio'],
        },
        (err, result) => {
          if (err || !result) {
            console.error('Cloudinary upload error:', err)
            return reject(new Error(err?.message || 'Cloudinary upload failed'))
          }
          resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    console.log('Cloudinary upload successful:', (cloudinaryResult as any).public_id)

    // Save to DB
    const image = await db.image.create({
      data: {
        title,
        description: description || null,
        categoryId,
        url: (cloudinaryResult as any).secure_url,
        cloudinaryId: (cloudinaryResult as any).public_id,
        width: (cloudinaryResult as any).width,
        height: (cloudinaryResult as any).height,
        format: (cloudinaryResult as any).format,
        bytes: (cloudinaryResult as any).bytes,
      }
    })

    return NextResponse.json(image, { status: 201 })

  } catch (err: any) {
    console.error('Unhandled upload error:', err)
    return NextResponse.json({
      error: err?.message || 'Something went wrong during upload'
    }, { status: 500 })
  }
}
