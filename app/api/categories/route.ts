// app/api/categories/route.ts - Updated to automatically handle admin status
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ✅ GET method - Fetch categories with automatic admin detection
export async function GET(request: NextRequest) {
  try {
    // Get session to determine admin status
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    console.log('🔍 Categories API Debug:')
    console.log('- Session exists:', !!session)
    console.log('- User email:', session?.user?.email)
    console.log('- User role:', (session?.user as any)?.role)
    console.log('- Is admin:', isAdmin)

    // Get all categories if admin, only public if not
    const categories = await db.category.findMany({
      where: {
        parentId: null, // Only top-level categories
        ...(isAdmin ? {} : { isPrivate: false }) // Include private only for admins
      },
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        },
        subcategories: {
          where: isAdmin ? {} : { isPrivate: false }, // Include private subcategories only for admins
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
        createdAt: 'asc'
      }
    })

    console.log('- Total categories returned:', categories.length)
    console.log('- Private categories in result:', categories.filter(c => c.isPrivate).length)

    return new Response(JSON.stringify(categories), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate' // Force fresh data
      }
    })

  } catch (error) {
    console.error('❌ Categories GET Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// ✅ POST method - Create category (keeping your existing logic)
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
        parentId: body.parentId || null,
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

// ✅ OPTIONS method - Handle CORS
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