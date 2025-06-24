import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    
    // Check if user is admin for private categories
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const categories = await db.category.findMany({
      where: {
        // Only include private categories if user is admin and requested
        ...(includePrivate && isAdmin ? {} : { isPrivate: false })
      },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        subcategories: {
          include: {
            _count: {
              select: { images: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, key, description, isPrivate, parentId } = body

    // Validate required fields
    if (!name || !key) {
      return NextResponse.json(
        { error: 'Name and key are required' }, 
        { status: 400 }
      )
    }

    // Check if key already exists
    const existingCategory = await db.category.findUnique({
      where: { key }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category key already exists' }, 
        { status: 400 }
      )
    }

    // Create category
    const category = await db.category.create({
      data: {
        name: name.trim(),
        key: key.trim(),
        description: description?.trim() || null,
        isPrivate: Boolean(isPrivate),
        parentId: parentId || null
      },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      category 
    })

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' }, 
      { status: 500 }
    )
  }
}