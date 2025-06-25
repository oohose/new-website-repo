import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const categoryId = formData.get('categoryId') as string

    if (!file || !categoryId) {
      return new Response(JSON.stringify({ error: 'Missing file or category ID' }), { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: categoryId }, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }).end(buffer)
    })

    const result = uploadResult as any

    const newImage = await db.image.create({
      data: {
        url: result.secure_url,
        categoryId,
        cloudinaryId: result.public_id
      }
    })

    return new Response(JSON.stringify({ success: true, image: newImage }), { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Upload error:', error.message)
    } else {
      console.error('Unknown upload error:', error)
    }
    return new Response(JSON.stringify({ success: false }), { status: 500 })
  }
}
