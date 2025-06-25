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

  // Fetch category
  const category = await getCategory(params.key, isAdmin)

  // Check if category exists
  if (!category) {
    console.log('Category not found:', params.key)
    notFound()
  }

  // Check if category is private and user is not admin
  if (category.isPrivate && !isAdmin) {
    console.log('Private category accessed by non-admin:', params.key)
    notFound()
  }

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


  return <GalleryView category={safeCategory} isAdmin={isAdmin} />
}

export async function generateMetadata({ params }: GalleryPageProps) {
  // Validate params
  if (!params?.key || typeof params.key !== 'string') {
    return {
      title: 'Gallery Not Found',
    }
  }

  try {
    const category = await db.category.findUnique({
      where: { key: params.key },
      select: { name: true, description: true }
    })

    if (!category) {
      return {
        title: 'Gallery Not Found',
      }
    }

    return {
      title: `${category.name} - Peyton's Photography`,
      description: category.description || `View ${category.name} photography gallery`,
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Gallery',
    }
  }
}