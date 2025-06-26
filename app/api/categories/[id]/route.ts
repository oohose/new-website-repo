import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'
import cloudinary from "@/lib/cloudinary"


// If none of the above work, use this direct instantiation:
const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        },
        subcategories: {
          include: {
            images: true,
            _count: {
              select: { images: true }
            }
          }
        },
        _count: {
          select: { images: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT request received for category ID:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, description, key, isPrivate, parentId, socialLinks } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if key is unique (if being updated)
    if (key && key !== existingCategory.key) {
      const keyExists = await prisma.category.findUnique({
        where: { key }
      })
      if (keyExists) {
        return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
      }
    }

    // Prepare the base update data
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      key: key?.trim() || existingCategory.key,
      isPrivate: Boolean(isPrivate),
      parentId: parentId || null,
      updatedAt: new Date()
    }

    // Only add socialLinks if it exists and the database supports it
    if (socialLinks && typeof socialLinks === 'object') {
      try {
        const cleanSocialLinks = Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => 
            value && typeof value === 'string' && value.trim() !== ''
          )
        )
        
        if (Object.keys(cleanSocialLinks).length > 0) {
          updateData.socialLinks = cleanSocialLinks
        } else {
          updateData.socialLinks = null
        }
      } catch (error) {
        console.warn('socialLinks field not supported, skipping...', error)
        // Continue without socialLinks if there's an issue
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: updateData,
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        },
        subcategories: {
          include: {
            images: true,
            _count: {
              select: { images: true }
            }
          }
        },
        _count: {
          select: { images: true }
        }
      }
    })

    console.log('Category updated successfully:', updatedCategory.id)

    return NextResponse.json({ 
      message: 'Category updated successfully',
      category: updatedCategory 
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get category with all nested content
    const category = await prisma.category.findUnique({
      where: { id: params.id },
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

    const deletedImages: string[] = []
    const deletedFolders: string[] = []
    let deletedImageCount = 0
    let deletedSubcategoryCount = 0

    try {
      // Delete all images from this category and subcategories
      const allImages = [
        ...category.images,
        ...category.subcategories.flatMap(sub => sub.images)
      ]

      // Delete images from Cloudinary
      for (const image of allImages) {
        if (image.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(image.cloudinaryId)
            deletedImages.push(image.cloudinaryId)
          } catch (cloudinaryError) {
            console.warn(`Failed to delete image from Cloudinary: ${image.cloudinaryId}`, cloudinaryError)
            // Continue with database deletion even if Cloudinary fails
          }
        }
      }

      // Use transaction to delete everything in the correct order
      await prisma.$transaction(async (tx) => {
        // Delete images from subcategories
        for (const subcategory of category.subcategories) {
          if (subcategory.images.length > 0) {
            await tx.image.deleteMany({
              where: { categoryId: subcategory.id }
            })
            deletedImageCount += subcategory.images.length
          }
        }

        // Delete subcategories
        if (category.subcategories.length > 0) {
          await tx.category.deleteMany({
            where: { parentId: params.id }
          })
          deletedSubcategoryCount = category.subcategories.length
        }

        // Delete images from main category
        if (category.images.length > 0) {
          await tx.image.deleteMany({
            where: { categoryId: params.id }
          })
          deletedImageCount += category.images.length
        }

        // Finally delete the main category
        await tx.category.delete({
          where: { id: params.id }
        })
      })

      // Delete Cloudinary folders AFTER database cleanup
      try {
        // Delete subcategory folders
        for (const subcategory of category.subcategories) {
          const subcategoryFolderPath = `portfolio/${subcategory.key}`
          try {
            await cloudinary.api.delete_folder(subcategoryFolderPath)
            deletedFolders.push(subcategoryFolderPath)
            console.log(`Deleted Cloudinary folder: ${subcategoryFolderPath}`)
          } catch (folderError: any) {
            if (folderError.error?.http_code !== 404) { // Ignore "folder not found" errors
              console.warn(`Failed to delete Cloudinary folder: ${subcategoryFolderPath}`, folderError)
            }
          }
        }

        // Delete main category folder
        const mainFolderPath = `portfolio/${category.key}`
        try {
          await cloudinary.api.delete_folder(mainFolderPath)
          deletedFolders.push(mainFolderPath)
          console.log(`Deleted Cloudinary folder: ${mainFolderPath}`)
        } catch (folderError: any) {
          if (folderError.error?.http_code !== 404) { // Ignore "folder not found" errors
            console.warn(`Failed to delete Cloudinary folder: ${mainFolderPath}`, folderError)
          }
        }
      } catch (cloudinaryFolderError) {
        console.warn('Error deleting Cloudinary folders:', cloudinaryFolderError)
        // Don't fail the entire operation if folder deletion fails
      }

      return NextResponse.json({ 
        message: 'Category and all content deleted successfully',
        deletedImages: deletedImageCount,
        deletedSubcategories: deletedSubcategoryCount,
        cloudinaryImagesDeleted: deletedImages.length,
        cloudinaryFoldersDeleted: deletedFolders.length,
        deletedFolders: deletedFolders
      })

    } catch (deleteError) {
      console.error('Error during deletion process:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete category and its content' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}