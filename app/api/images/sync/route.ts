import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images }: { images: { id: string; public_id: string; url: string; categoryId: string }[] } = body

    const createdImages = await db.image.createMany({ data: images })

    return new Response(JSON.stringify({ success: true, createdImages }), { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Image sync error:', error.message)
    } else {
      console.error('Unknown image sync error:', error)
    }
    return new Response(JSON.stringify({ success: false }), { status: 500 })
  }
}