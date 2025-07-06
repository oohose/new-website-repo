// app/api/categories/route.ts - Fixed with unique key generation
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Helper function to generate a unique key
async function generateUniqueKey(name: string, parentId?: string): Promise<string> {
  // Base key generation
  let baseKey = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim()

  // Check if base key is unique
  const existingCategory = await db.category.findUnique({
    where: { key: baseKey }
  })

  if (!existingCategory) {
    return baseKey
  }

  // If not unique, append numbers until we find a unique key
  let counter = 1
  let uniqueKey = `${baseKey}-${counter}`
  
  while (true) {
    const existing = await db.category.findUnique({
      where: { key: uniqueKey }
    })
    
    if (!existing) {
      return uniqueKey
    }
    
    counter++
    uniqueKey = `${baseKey}-${counter}`
    
    // Safety check to prevent infinite loops
    if (counter > 100) {
      // Fallback to timestamp-based key
      uniqueKey = `${baseKey}-${Date.now()}`
      break
    }
  }
  
  return uniqueKey
}

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
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { 
            images: true,
            subcategories: true
          }
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

// ✅ POST method - Create category with unique key generation
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

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Category name is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate or validate unique key
    let key = body.key
    if (!key) {
      // Generate unique key from name
      key = await generateUniqueKey(body.name, body.parentId)
      console.log('🔑 Generated unique key:', key)
    } else {
      // Check if provided key is unique
      const existingCategory = await db.category.findUnique({
        where: { key: key }
      })
      
      if (existingCategory) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `A category with key "${key}" already exists` 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    const newCategory = await db.category.create({ 
      data: {
        name: body.name,
        key: key,
        description: body.description || null,
        isPrivate: body.isPrivate || false,
        parentId: body.parentId || null,
        socialLinks: body.socialLinks || null
      },
      include: {
        _count: {
          select: { 
            images: true,
            subcategories: true
          }
        }
      }
    })

    console.log('✅ Category created:', newCategory)

    return new Response(JSON.stringify({ 
      success: true, 
      category: newCategory 
    }), { 
      status: 201, // Use 201 for successful creation
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('❌ Create category error:', error)
    
    let errorMessage = 'Failed to create category'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        errorMessage = 'A category with this key already exists'
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), { 
      status: statusCode,
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