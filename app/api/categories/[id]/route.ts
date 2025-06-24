import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, key, description, isPrivate } = body
    const categoryId = params.id

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' }, 
        { status: 404 }
      )
    }

    // If key is being updated, check for conflicts
    if (key && key !== existingCategory.key) {
      const keyConflict = await db.category.findUnique({
        where: { key }
      })

      if (keyConflict) {
        return NextResponse.json(
          { error: 'Category key already exists' }, 
          { status: 400 }
        )
      }
    }

    // Update category
    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(key && { key: key.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPrivate !== undefined && { isPrivate: Boolean(isPrivate) })
      },
      include: {
        _count: {
          select: { images: true }
        }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.id

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' }, 
        { status: 404 }
      )
    }

    // Check if category has images
    if (existingCategory._count.images > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with images. Please delete or move images first.' }, 
        { status: 400 }
      )
    }

    // Delete category
    await db.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' }, 
      { status: 500 }
    )
  }
}