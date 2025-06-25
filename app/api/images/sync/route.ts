import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v2 as cloudinary } from 'cloudinary'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all images from database
    const dbImages = await db.image.findMany({
      select: { id: true, cloudinaryId: true, title: true }
    })

    // Get all images from Cloudinary
    const cloudinaryImages = await cloudinary.search
      .expression('folder:peyton-portfolio/*')
      .max_results(500)
      .execute()

    const cloudinaryIds = new Set(
      cloudinaryImages.resources.map((img: any) => img.public_id)
    )

    // Find orphaned database records (exist in DB but not in Cloudinary)
    const orphanedDbImages = dbImages.filter(
      img => !cloudinaryIds.has(img.cloudinaryId)
    )

    console.log(`Found ${orphanedDbImages.length} orphaned database records`)

    // Delete orphaned database records
    if (orphanedDbImages.length > 0) {
      await db.image.deleteMany({
        where: {
          id: {
            in: orphanedDbImages.map(img => img.id)
          }
        }
      })

      console.log(`✅ Cleaned up ${orphanedDbImages.length} orphaned records:`)
      orphanedDbImages.forEach(img => {
        console.log(`  - ${img.title} (${img.cloudinaryId})`)
      })
    }

    return NextResponse.json({
      success: true,
      deletedFromDb: orphanedDbImages.length,
      message: `Sync complete. Removed ${orphanedDbImages.length} orphaned records.`,
      orphanedImages: orphanedDbImages.map(img => ({ 
        title: img.title, 
        cloudinaryId: img.cloudinaryId 
      }))
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync images' },
      { status: 500 }
    )
  }
}