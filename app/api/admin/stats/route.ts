import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalImages, totalCategories] = await Promise.all([
      db.image.count(),
      db.category.count(),
    ])

    const stats = {
      totalImages,
      totalCategories,
      totalViews: 0,
      storageUsed: '0 MB'
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Fetch stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' }, 
      { status: 500 }
    )
  }
}