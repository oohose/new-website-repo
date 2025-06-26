// app/api/admin/stats/route.ts

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

    // Get total images count
    const totalImages = await db.image.count()

    // Get total categories count
    const totalCategories = await db.category.count()

    // Calculate storage used (sum of all image bytes)
    const storageResult = await db.image.aggregate({
      _sum: {
        bytes: true
      }
    })

    const totalBytes = storageResult._sum.bytes || 0
    const storageUsed = formatBytes(totalBytes)

    // For now, set views to 0 (you can implement view tracking later)
    const totalViews = 0

    return NextResponse.json({
      totalImages,
      totalCategories,
      totalViews,
      storageUsed
    })

  } catch (error) {
    console.error('Fetch admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' }, 
      { status: 500 }
    )
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}