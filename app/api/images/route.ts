// app/api/images/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get('public') === 'true'
    const includePrivate = searchParams.get('includePrivate') === 'true'
    const includeSubcategories = searchParams.get('includeSubcategories') === 'true' // ✅ New parameter
    const categoryId = searchParams.get('categoryId')

    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // Build the where clause for categories
    let categoryWhere: any = {}
    
    if (publicOnly && !includePrivate) {
      categoryWhere.isPrivate = false
    } else if (includePrivate && !isAdmin) {
      categoryWhere.isPrivate = false
    }

    if (categoryId) {
      categoryWhere.id = categoryId
    }

    // ✅ Updated query to include subcategory images when requested
    let images
    
    if (includeSubcategories) {
      // Get all categories (parent and subcategories) that match criteria
      const categories = await db.category.findMany({
        where: categoryWhere,
        include: {
          images: {
            orderBy: { createdAt: 'desc' }
          },
          // Include parent categories and their images
          parent: {
            include: {
              images: {
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          // Include subcategories and their images  
          subcategories: {
            where: publicOnly ? { isPrivate: false } : {},
            include: {
              images: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      })

      // Flatten all images from categories and subcategories
      const allImages = []
      
      for (const category of categories) {
        // Add images from main category
        for (const image of category.images) {
          allImages.push({
            ...image,
            category: {
              id: category.id,
              name: category.name,
              key: category.key,
              isPrivate: category.isPrivate
            }
          })
        }
        
        // Add images from subcategories
        for (const subcategory of category.subcategories) {
          for (const image of subcategory.images) {
            allImages.push({
              ...image,
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
      const uniqueImages = allImages.filter((image, index, self) => 
        index === self.findIndex(img => img.id === image.id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      images = uniqueImages

    } else {
      // Original query - just direct category images
      images = await db.image.findMany({
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
      images,
      total: images.length 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error fetching images:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch images' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}