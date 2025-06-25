import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { images }: { images: { id: string; cloudinaryId: string }[] } = await req.json()

    const deleteCloudinary = images.map(async (image) => {
      try {
        await deleteFromCloudinary(image.cloudinaryId)
      } catch (error: unknown) {
        console.error(`Failed to delete Cloudinary image: ${image.cloudinaryId}`, error)
      }
    })

    const deleteDatabase = db.image.deleteMany({
      where: {
        id: {
          in: images.map((img) => img.id)
        }
      }
    })

    await Promise.all([Promise.all(deleteCloudinary), deleteDatabase])

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Bulk delete error:', error.message)
    } else {
      console.error('Unknown bulk delete error:', error)
    }
    return new Response(JSON.stringify({ success: false }), { status: 500 })
  }
}
