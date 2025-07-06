// app/api/categories/all/route.ts - Fetch all categories as flat list
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    // Get session to determine admin status
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    console.log('🔍 Categories All API Debug:')
    console.log('- Session exists:', !!session)
    console.log('- User email:', session?.user?.email)
    console.log('- User role:', (session?.user as any)?.role)
    console.log('- Is admin:', isAdmin)

    // Get ALL categories (both parent and child) as a flat list
    const allCategories = await db.category.findMany({
      where: isAdmin ? {} : { isPrivate: false }, // Include private only for admins
      include: {
        images: {
          orderBy: { createdAt: 'desc' }
        },
        parent: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        _count: {
          select: { 
            images: true,
            subcategories: true 
          }
        }
      },
      orderBy: [
        { parentId: 'asc' }, // Parents first, then children
        { createdAt: 'asc' }
      ]
    })

    // Add display names with indentation for better UX
    const categoriesWithDisplayNames = allCategories.map(category => ({
      ...category,
      displayName: category.parentId 
        ? `  └─ ${category.name}` // Indent subcategories
        : category.name, // Top-level categories without indentation
      isSubcategory: !!category.parentId
    }))

    console.log('- Total categories returned (flat):', categoriesWithDisplayNames.length)
    console.log('- Top-level categories:', categoriesWithDisplayNames.filter(c => !c.isSubcategory).length)
    console.log('- Subcategories:', categoriesWithDisplayNames.filter(c => c.isSubcategory).length)

    return new Response(JSON.stringify(categoriesWithDisplayNames), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('❌ Categories All GET Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch all categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}