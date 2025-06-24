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
    const { id } = params

    // If name is being updated, also update the key
    if (body.name) {
      body.key = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: body,
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

    const { id } = params

    await db.category.delete({
      where: { id }
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