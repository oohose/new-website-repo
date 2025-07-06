// app/api/revalidate/route.ts - Enhanced revalidation endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Revalidation API called')
    
    // Check authentication for admin-only operations
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    
    // Parse request body (optional parameters)
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Body is optional, continue with empty object
    }
    
    const { 
      categoryKey, 
      action, 
      mediaType, 
      specificPaths = [],
      force = false 
    } = body

    console.log('📋 Revalidation details:', {
      categoryKey,
      action,
      mediaType,
      specificPaths,
      force,
      isAdmin,
      timestamp: new Date().toISOString()
    })

    // STEP 1: Revalidate cache tags
    const tagsToRevalidate = [
      'media',
      'categories',
      'images',
      'videos'
    ]

    // Add category-specific tag if provided
    if (categoryKey) {
      tagsToRevalidate.push(`gallery-${categoryKey}`)
    }

    console.log('🏷️ Revalidating tags:', tagsToRevalidate)
    tagsToRevalidate.forEach(tag => {
      try {
        revalidateTag(tag)
        console.log(`✅ Tag revalidated: ${tag}`)
      } catch (error) {
        console.error(`❌ Failed to revalidate tag ${tag}:`, error)
      }
    })

    // STEP 2: Revalidate specific paths
    const pathsToRevalidate = [
      '/', // Home page
      '/api/media',
      '/api/categories'
    ]

    // Add category-specific paths
    if (categoryKey) {
      pathsToRevalidate.push(
        `/gallery/${categoryKey}`,
        '/gallery/[key]' // Dynamic route pattern
      )
    }

    // Add any additional specific paths
    if (Array.isArray(specificPaths) && specificPaths.length > 0) {
      pathsToRevalidate.push(...specificPaths)
    }

    console.log('🛤️ Revalidating paths:', pathsToRevalidate)
    const revalidationResults: { path: string; success: boolean; error?: string }[] = []

    for (const path of pathsToRevalidate) {
      try {
        if (path.startsWith('/api/')) {
          // API routes don't need page type
          revalidatePath(path)
        } else {
          // Page routes need page type
          revalidatePath(path, 'page')
        }
        revalidationResults.push({ path, success: true })
        console.log(`✅ Path revalidated: ${path}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        revalidationResults.push({ path, success: false, error: errorMessage })
        console.error(`❌ Failed to revalidate path ${path}:`, error)
      }
    }

    // STEP 3: If this is a deletion, also clear parent category cache
    if (action === 'delete' && categoryKey) {
      try {
        // Try to find parent category and revalidate it too
        const { db } = await import('@/lib/db')
        const category = await db.category.findUnique({
          where: { key: categoryKey },
          select: { 
            parent: { 
              select: { key: true } 
            } 
          }
        })

        if (category?.parent?.key) {
          revalidateTag(`gallery-${category.parent.key}`)
          revalidatePath(`/gallery/${category.parent.key}`, 'page')
          console.log(`✅ Parent category revalidated: ${category.parent.key}`)
        }
      } catch (error) {
        console.warn('Failed to revalidate parent category:', error)
      }
    }

    // STEP 4: Add a small delay for cache propagation
    await new Promise(resolve => setTimeout(resolve, 100))

    const successCount = revalidationResults.filter(r => r.success).length
    const errorCount = revalidationResults.filter(r => !r.success).length

    console.log(`🎉 Revalidation complete: ${successCount} successful, ${errorCount} failed`)

    return NextResponse.json({
      success: true,
      message: 'Cache revalidation completed',
      details: {
        tagsRevalidated: tagsToRevalidate.length,
        pathsProcessed: revalidationResults.length,
        successful: successCount,
        failed: errorCount,
        results: revalidationResults,
        categoryKey,
        action,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('💥 Revalidation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Revalidation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET method for manual cache clearing (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryKey = searchParams.get('categoryKey')
    const clearAll = searchParams.get('clearAll') === 'true'

    console.log('🔄 Manual cache clear requested:', { categoryKey, clearAll })

    if (clearAll) {
      // Clear all caches
      const allTags = ['media', 'categories', 'images', 'videos']
      const allPaths = ['/', '/api/media', '/api/categories']

      allTags.forEach(tag => revalidateTag(tag))
      allPaths.forEach(path => {
        if (path.startsWith('/api/')) {
          revalidatePath(path)
        } else {
          revalidatePath(path, 'page')
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All caches cleared',
        clearedTags: allTags.length,
        clearedPaths: allPaths.length
      })
    }

    if (categoryKey) {
      // Clear specific category cache
      revalidateTag(`gallery-${categoryKey}`)
      revalidatePath(`/gallery/${categoryKey}`, 'page')
      revalidatePath('/gallery/[key]', 'page')

      return NextResponse.json({
        success: true,
        message: `Cache cleared for category: ${categoryKey}`,
        categoryKey
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No cache clearing parameters provided'
    }, { status: 400 })

  } catch (error) {
    console.error('Manual cache clear error:', error)
    return NextResponse.json(
      { error: 'Cache clear failed' },
      { status: 500 }
    )
  }
}