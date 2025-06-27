import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import GalleryView from '@/components/gallery/GalleryView'
import type { Category } from '@/lib/types'

interface GalleryPageProps {
  params: { key: string }
}

async function getCategory(key: string, isAdmin: boolean) {
  try {
    const category = await db.category.findUnique({
      where: { key },
      include: {
        images: {
          orderBy: [
            { isHeader: 'desc' }, // Header images first
            { order: 'asc' },     // Then by custom order
            { createdAt: 'desc' }  // Then by creation date
          ]
        },
        subcategories: {
          where: isAdmin ? {} : { isPrivate: false }, // Only show public subcategories to non-admins
          include: {
            images: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: { images: true }
            }
          }
        },
        _count: {
          select: { images: true }
        }
      }
    })

    return category
  } catch (error) {
    console.error('Database error fetching category:', error)
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
    accessType: 'direct_link'
  })

  // Fetch category
  const category = await getCategory(params.key, isAdmin)

  // Check if category exists
  if (!category) {
    console.log('❌ Category not found:', params.key)
    notFound()
  }

  // ✅ REMOVED: The private category check - now allows direct access to private galleries
  // This enables sharing private galleries via direct link while keeping them hidden from portfolio
  
  console.log('📊 Gallery Access Result:', {
    categoryName: category.name,
    isPrivate: category.isPrivate,
    imageCount: category.images?.length || 0,
    subcategoryCount: category.subcategories?.length || 0,
    accessGranted: true,
    reason: category.isPrivate ? 
      (isAdmin ? 'admin_access' : 'private_direct_access') : 
      'public_access'
  })

  // Ensure category has required properties and convert dates to strings
  const safeCategory: Category = {
    id: category.id,
    key: category.key,
    name: category.name || 'Untitled Gallery',
    description: category.description ?? null,
    isPrivate: Boolean(category.isPrivate),
    parentId: category.parentId ?? null,
    images: Array.isArray(category.images)
      ? category.images.map(img => ({
          ...img,
          createdAt: img.createdAt.toISOString()
        }))
      : [],
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map(sub => ({
          id: sub.id,
          key: sub.key,
          name: sub.name,
          description: sub.description ?? null,
          isPrivate: Boolean(sub.isPrivate),
          parentId: sub.parentId ?? null,
          images: Array.isArray(sub.images)
            ? sub.images.map(img => ({
                ...img,
                createdAt: img.createdAt.toISOString()
              }))
            : [],
          subcategories: [],
          _count: {
            images: sub._count?.images || 0
          }
        }))
      : [],
    _count: {
      images: category._count?.images || 0
    }
  }

  // ✅ Check if this is a private gallery being accessed by non-admin
  const isPrivateDirectAccess = category.isPrivate && !isAdmin

  return (
    <div className="relative">
      
      {/* ✅ Gallery Content with proper spacing for banner */}
      <div className={isPrivateDirectAccess ? 'pt-16' : ''}>
        <GalleryView category={safeCategory} isAdmin={isAdmin} />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: GalleryPageProps) {
  // Validate params
  if (!params?.key || typeof params.key !== 'string') {
    return {
      title: 'Gallery Not Found',
    }
  }

  try {
    // ✅ Fetch category regardless of privacy status for metadata generation
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

    // ✅ Generate Open Graph image for social sharing
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
      // ✅ Add robots meta for private galleries
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