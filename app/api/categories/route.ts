// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    console.log('📂 Categories API: GET request received')
    
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'
    
    console.log('👤 Session:', { isAdmin, includePrivate })
    
    // Only show private categories to admins
    const whereClause = includePrivate && isAdmin ? {} : { isPrivate: false }
    
    const categories = await db.category.findMany({
      where: whereClause,
      include: {
        subcategories: {
          where: includePrivate && isAdmin ? {} : { isPrivate: false },
          include: {
            images: true,
            _count: {
              select: { images: true }
            }
          }
        },
        images: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('📂 Found categories:', categories.length)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('❌ Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, isPrivate, parentId } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate unique key
    let key = slugify(name)
    let counter = 1
    while (await db.category.findUnique({ where: { key } })) {
      key = `${slugify(name)}-${counter}`
      counter++
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        key,
        description: description?.trim() || null,
        isPrivate: isPrivate || false,
        parentId: parentId || null
      },
      include: {
        subcategories: true,
        images: true,
        _count: {
          select: { images: true }
        }
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}