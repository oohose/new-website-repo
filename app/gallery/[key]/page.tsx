import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import GalleryView from '@/components/gallery/GalleryView'
import type { Category } from '@/lib/types'

interface GalleryPageProps {
  params: { key: string }
}

async function getCategoryWithMedia(key: string, isAdmin: boolean) {
  try {
    // Use your media API that searches Cloudinary
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/media?categoryKey=${key}&includePrivate=${isAdmin}&t=${Date.now()}`, {
      cache: 'no-store', // Always get fresh data
      next: { 
        revalidate: 0, 
        tags: [`gallery-${key}`, 'media', 'categories'] // Add these cache tags!
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      console.error('Media API error:', response.status, response.statusText)
      return null
    }
    
    const data = await response.json()
    
    if (!data.success) {
      console.error('Media API returned error:', data.error)
      return null
    }
    
    // Transform the media back into separate images and videos arrays
    const images = data.media.filter((item: any) => item.mediaType === 'image')
    const videos = data.media.filter((item: any) => item.mediaType === 'video')
    
    return {
      ...data.category,
      images,
      videos,
      _count: {
        images: images.length,
        videos: videos.length
      }
    }
    
  } catch (error) {
    console.error('Error fetching category with media:', error)
    return null
  }
}

// Add refresh function for the GalleryView component
async function refreshGalleryData(categoryKey: string, isAdmin: boolean) {
  'use server'
  
  try {
    // Import revalidation functions
    const { revalidatePath, revalidateTag } = await import('next/cache')
    
    // Revalidate specific tags
    revalidateTag(`gallery-${categoryKey}`)
    revalidateTag('media')
    revalidateTag('categories')
    
    // Revalidate specific paths
    revalidatePath(`/gallery/${categoryKey}`, 'page')
    revalidatePath('/api/media') // No type needed for API routes
    revalidatePath('/', 'page') // In case the home page shows this category
    
    // Clear the route cache for this specific gallery
    revalidatePath(`/gallery/[key]`, 'page')
    
    console.log(`🔄 Revalidated gallery data for: ${categoryKey}`)
    
    // Fetch fresh data with a slight delay to ensure cache is cleared
    await new Promise(resolve => setTimeout(resolve, 100))
    return await getCategoryWithMedia(categoryKey, isAdmin)
  } catch (error) {
    console.error('Error refreshing gallery data:', error)
    return null
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  // Validate params
  if (!params?.key || typeof params.key !== 'string') {
    console.error('Invalid gallery key:', params)
    notFound()
  }

  let session
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error('Error getting session:', error)
    session = null
  }
  
  const isAdmin = session?.user?.role === 'ADMIN'

  console.log('🖼️ Gallery Page Access:', {
    galleryKey: params.key,
    hasSession: !!session,
    userEmail: session?.user?.email,
    isAdmin,
    accessType: 'direct_link',
    timestamp: new Date().toISOString()
  })

  // Fetch category with combined media (images + videos from subfolder)
  const category = await getCategoryWithMedia(params.key, isAdmin)

  // Check if category exists
  if (!category) {
    console.log('❌ Category not found:', params.key)
    notFound()
  }
  
  console.log('📊 Gallery Access Result:', {
    categoryName: category.name,
    isPrivate: category.isPrivate,
    imageCount: category.images?.length || 0,
    videoCount: category.videos?.length || 0,
    totalMedia: (category.images?.length || 0) + (category.videos?.length || 0),
    subcategoryCount: category.subcategories?.length || 0,
    accessGranted: true,
    reason: category.isPrivate ? 
      (isAdmin ? 'admin_access' : 'private_direct_access') : 
      'public_access',
    timestamp: new Date().toISOString()
  })

  // Create safe category object for component
  const safeCategory: Category = {
    id: category.id,
    key: category.key,
    name: category.name || 'Untitled Gallery',
    description: category.description ?? null,
    isPrivate: Boolean(category.isPrivate),
    parentId: category.parentId ?? null,
    images: Array.isArray(category.images)
      ? category.images.map((img: any) => ({
          ...img,
          createdAt: typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString()
        }))
      : [],
    videos: Array.isArray(category.videos)
      ? category.videos.map((vid: any) => ({
          ...vid,
          createdAt: vid.createdAt 
            ? (typeof vid.createdAt === 'string' ? vid.createdAt : vid.createdAt.toISOString())
            : new Date().toISOString() // Fallback for videos without createdAt
        }))
      : [],
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((sub: any) => ({
          id: sub.id,
          key: sub.key,
          name: sub.name,
          description: sub.description ?? null,
          isPrivate: Boolean(sub.isPrivate),
          parentId: sub.parentId ?? null,
          images: Array.isArray(sub.images)
            ? sub.images.map((img: any) => ({
                ...img,
                createdAt: typeof img.createdAt === 'string' ? img.createdAt : img.createdAt.toISOString()
              }))
            : [],
          videos: Array.isArray(sub.videos)
            ? sub.videos.map((vid: any) => ({
                ...vid,
                createdAt: vid.createdAt 
                  ? (typeof vid.createdAt === 'string' ? vid.createdAt : vid.createdAt.toISOString())
                  : new Date().toISOString() // Fallback for videos without createdAt
              }))
            : [],
          subcategories: [],
          _count: {
            images: sub._count?.images || 0,
            videos: sub._count?.videos || 0
          }
        }))
      : [],
    _count: {
      images: category._count?.images || 0,
      videos: category._count?.videos || 0
    }
  }

  const isPrivateDirectAccess = category.isPrivate && !isAdmin

  // Create refresh function bound to this category
  const onRefresh = async () => {
    'use server'
    return await refreshGalleryData(params.key, isAdmin)
  }

  return (
    <div className="relative">
      <div className={isPrivateDirectAccess ? 'pt-16' : ''}>
        <GalleryView 
          category={safeCategory} 
          isAdmin={isAdmin} 
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: GalleryPageProps) {
  if (!params?.key || typeof params.key !== 'string') {
    return {
      title: 'Gallery Not Found',
    }
  }

  try {
    // For metadata, we can do a simpler database query
    const { db } = await import('@/lib/db')
    
    const category = await db.category.findUnique({
      where: { key: params.key },
      select: { 
        name: true, 
        description: true, 
        isPrivate: true,
        images: {
          take: 1,
          where: { isHeader: true },
          select: { cloudinaryId: true }
        }
      }
    })

    if (!category) {
      return {
        title: 'Gallery Not Found',
        description: 'The requested gallery could not be found.'
      }
    }

    const title = `${category.name} - Peyton's Photography`
    const description = category.description || 
      `View ${category.name} photography gallery${category.isPrivate ? ' (Private Collection)' : ''}`

    const headerImage = category.images?.[0]
    const ogImage = headerImage ? 
      `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${headerImage.cloudinaryId}` :
      null

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(ogImage && { 
          images: [{ 
            url: ogImage, 
            width: 1200, 
            height: 630,
            alt: category.name
          }] 
        })
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(ogImage && { images: [ogImage] })
      },
      ...(category.isPrivate && {
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      })
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Gallery - Peyton\'s Photography',
      description: 'Photography gallery'
    }
  }
}

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0