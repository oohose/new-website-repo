// app/api/images/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🖼️ Images API: GET request received')
    
    const { searchParams } = new URL(request.url)
    const includePrivate = searchParams.get('includePrivate') === 'true'
    const public_only = searchParams.get('public') === 'true'
    
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'
    
    console.log('👤 Session:', { isAdmin, includePrivate, public_only })
    
    let whereClause = {}
    
    if (public_only) {
      // For public API, only show images from public categories
      whereClause = {
        category: {
          isPrivate: false
        }
      }
    } else if (includePrivate && isAdmin) {
      // Admin requesting all images
      whereClause = {}
    } else {
      // Regular user or not admin
      whereClause = {
        category: {
          isPrivate: false
        }
      }
    }
    
    const images = await db.image.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log('🖼️ Found images:', images.length)
    return NextResponse.json({ images })
  } catch (error) {
    console.error('❌ Images API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images', details: error.message },
      { status: 500 }
    )
  }
}