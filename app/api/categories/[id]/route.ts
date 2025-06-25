import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { v2 as cloudinary } from 'cloudinary'


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.id

    // Get category with images and subcategories
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
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Collect all images from category and subcategories
    const allImages = [
      ...category.images,
      ...category.subcategories.flatMap(sub => sub.images)
    ]

    // Delete all images from Cloudinary
    const cloudinaryDeletions = allImages.map(async (image) => {
      try {
        await deleteFromCloudinary(image.cloudinaryId)
        console.log(`✅ Deleted from Cloudinary: ${image.cloudinaryId}`)
      } catch (error) {
        console.error(`Failed to delete from Cloudinary: ${image.cloudinaryId}`, error)
      }
    })

    await Promise.all(cloudinaryDeletions)

    // Delete category (this will cascade delete images and subcategories)
    await db.category.delete({
      where: { id: categoryId }
    })

    // Delete Cloudinary folder
    try {
      await cloudinary.api.delete_folder(`peyton-portfolio/${category.key}`)

      console.log(`✅ Deleted Cloudinary folder: ${category.key}`)
    } catch (err) {
      console.warn(`⚠️ Could not delete Cloudinary folder: ${category.key}`, err)
    }

    console.log(`✅ Deleted category: ${category.name} with ${allImages.length} images`)

    return NextResponse.json({ 
      success: true, 
      message: `Category "${category.name}" and ${allImages.length} images deleted successfully` 
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.id
    const body = await request.json()

    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: body,
      include: {
        subcategories: {
          include: {
            images: true,
            _count: { select: { images: true } }
          }
        },
        images: true,
        _count: { select: { images: true } }
      }
    })

    return NextResponse.json({ 
      success: true, 
      category: updatedCategory 
    })

  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}