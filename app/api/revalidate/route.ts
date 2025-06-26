// app/api/revalidate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow revalidation for authenticated users or public paths
    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    const tag = url.searchParams.get('tag')
    
    if (path) {
      revalidatePath(path)
      console.log(`Revalidated path: ${path}`)
      return NextResponse.json({ revalidated: true, path })
    }
    
    if (tag) {
      revalidateTag(tag)
      console.log(`Revalidated tag: ${tag}`)
      return NextResponse.json({ revalidated: true, tag })
    }
    
    // Revalidate common paths that depend on auth state
    const pathsToRevalidate = [
      '/',
      '/gallery/[key]',
      '/api/categories',
      '/api/images'
    ]
    
    pathsToRevalidate.forEach(path => {
      revalidatePath(path, 'page')
      console.log(`Revalidated: ${path}`)
    })
    
    // Also revalidate by tags
    revalidateTag('categories')
    revalidateTag('images')
    
    return NextResponse.json({ 
      revalidated: true, 
      paths: pathsToRevalidate,
      message: 'Cache cleared successfully'
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ 
      error: 'Failed to revalidate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}