// app/api/videos/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get('public') === 'true'
    const includePrivate = searchParams.get('includePrivate') === 'true'
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true'
    const categoryId = searchParams.get('categoryId')

    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // Build the where clause for categories
    let categoryWhere: any = {}
    
    if (!isAdmin) {
      categoryWhere.isPrivate = false
    }

    if (categoryId) {
      categoryWhere.id = categoryId
    }

    let videos

    if (includeSubcategories) {
      // Get all categories (parent and subcategories) that match criteria
      const categories = await db.category.findMany({
        where: categoryWhere,
        include: {
          videos: {
            orderBy: { createdAt: 'desc' }
          },
          // Include parent categories and their videos
          parent: {
            include: {
              videos: {
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          // Include subcategories and their videos  
          subcategories: {
            where: publicOnly ? { isPrivate: false } : {},
            include: {
              videos: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      })

      // Flatten all videos from categories and subcategories
      const allVideos = []
      
      for (const category of categories) {
        // Add videos from main category
        for (const video of category.videos) {
          allVideos.push({
            ...video,
            category: {
              id: category.id,
              name: category.name,
              key: category.key,
              isPrivate: category.isPrivate
            }
          })
        }
        
        // Add videos from subcategories
        for (const subcategory of category.subcategories) {
          for (const video of subcategory.videos) {
            allVideos.push({
              ...video,
              category: {
                id: subcategory.id,
                name: subcategory.name,
                key: subcategory.key,
                isPrivate: subcategory.isPrivate
              }
            })
          }
        }
      }

      // Remove duplicates and sort by creation date
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(vid => vid.id === video.id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      videos = uniqueVideos

    } else {
      // Original query - just direct category videos
      videos = await db.video.findMany({
        where: {
          category: categoryWhere
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              key: true,
              isPrivate: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      videos,
      total: videos.length 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error fetching videos:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch videos' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}