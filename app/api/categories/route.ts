// app/api/categories/route.ts - Complete implementation
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ✅ GET method - Fetch categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'

    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    console.log('🔍 Categories API Debug:')
    console.log('- Include private:', includePrivate)
    console.log('- Is admin:', isAdmin)
    console.log('- Session user:', session?.user)

    // Build where clause
    let whereClause: any = {}
    if (!includePrivate && !isAdmin) {
      whereClause.isPrivate = false
    }

    console.log('- Where clause:', whereClause)

    // First, let's see what's in the database
    const allCategories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        key: true,
        parentId: true,
        isPrivate: true,
        createdAt: true
      }
    })

    console.log('- All categories in DB:', allCategories)

    // Get categories with full data
    const categories = await db.category.findMany({
      where: whereClause,
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        },
        subcategories: {
          where: !includePrivate && !isAdmin ? { isPrivate: false } : {},
          include: {
            images: {
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: { images: true }
            }
          }
        },
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('- Filtered categories:', categories.length)
    console.log('- Categories data:', categories.map(c => ({ 
      id: c.id, 
      name: c.name, 
      parentId: c.parentId,
      imageCount: c._count.images
    })))

    return new Response(JSON.stringify({ 
      success: true, 
      categories,
      debug: {
        totalInDB: allCategories.length,
        filtered: categories.length,
        isAdmin,
        includePrivate,
        timestamp: new Date().toISOString()
      }
    }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Prevent caching during debugging
      }
    })

  } catch (error) {
    console.error('❌ Categories GET Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// ✅ POST method - Create category (your existing code)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    console.log('🔍 Creating category with data:', body)

    // Generate key if not provided
    if (!body.key && body.name) {
      body.key = body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
    }

    const newCategory = await db.category.create({ 
      data: {
        ...body,
        // Ensure parentId is null if empty string
        parentId: body.parentId || null,
        // Ensure description is null if empty string
        description: body.description || null
      },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    console.log('✅ Category created:', newCategory)

    return new Response(JSON.stringify({ 
      success: true, 
      category: newCategory 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('❌ Create category error:', error)
    
    let errorMessage = 'Failed to create category'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error details:', error.stack)
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// ✅ OPTIONS method - Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}