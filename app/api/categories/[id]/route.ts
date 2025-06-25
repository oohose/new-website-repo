import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const categoryId = params.id

    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        images: true,
        subcategories: {
          include: {
            images: true
          }
        }
      }
    })

    if (!category) {
      return new Response(JSON.stringify({ error: 'Category not found' }), { status: 404 })
    }

    const allImages = [
      ...category.images,
      ...category.subcategories.flatMap((sub: { images: { cloudinaryId: string }[] }) => sub.images)
    ]

    const cloudinaryDeletions = allImages.map(async (image: { cloudinaryId: string }) => {
      try {
        await deleteFromCloudinary(image.cloudinaryId)
        console.log(`✅ Deleted from Cloudinary: ${image.cloudinaryId}`)
      } catch (error: unknown) {
        console.error(`Failed to delete from Cloudinary: ${image.cloudinaryId}`, error)
      }
    })

    await Promise.all(cloudinaryDeletions)

    await db.category.delete({
      where: { id: categoryId }
    })

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Category "${category.name}" and ${allImages.length} images deleted successfully` 
    }))
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Delete category error:', error.message)
    } else {
      console.error('Unknown category delete error:', error)
    }
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), { status: 500 })
  }
}