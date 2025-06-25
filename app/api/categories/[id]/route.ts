import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

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
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, description, key, isPrivate, parentId } = body

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

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        key: key?.trim() || existingCategory.key,
        isPrivate: Boolean(isPrivate),
        parentId: parentId || null,
        updatedAt: new Date()
      },
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

    // Check if category exists and get image count
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

    // Check if category has images or subcategories
    const totalImages = category.images.length + 
      category.subcategories.reduce((sum, sub) => sum + sub.images.length, 0)
    
    if (totalImages > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with images. Please move or delete images first.' },
        { status: 400 }
      )
    }

    if (category.subcategories.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
        { status: 400 }
      )
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}