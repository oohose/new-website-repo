import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    const categories = await db.category.findMany({
      where: {
        ...(!(includePrivate && isAdmin) && { isPrivate: false })
      },
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
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
    const { name, description, isPrivate } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' }, 
        { status: 400 }
      )
    }

    // Create a URL-friendly key from the name
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const savedCategory = await db.category.create({
      data: {
        name: name.trim(),
        key: key,
        description: description?.trim() || null,
        isPrivate: isPrivate || false,
      },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      category: savedCategory 
    })

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' }, 
      { status: 500 }
    )
  }
}