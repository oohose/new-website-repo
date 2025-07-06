import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper functions for common database operations

export async function getCategories(includePrivate = false) {
  try {
    return await db.category.findMany({
      where: {
        parentId: null,
        ...(includePrivate ? {} : { isPrivate: false }),
      },
      include: {
        images: true,
        videos: true, // Include videos
        _count: {
          select: { 
            images: true,
            videos: true // Include video count
          }
        },
        subcategories: {
          where: includePrivate ? {} : { isPrivate: false },
          include: {
            images: true,
            videos: true, // Include videos in subcategories
            _count: {
              select: { 
                images: true,
                videos: true // Include video count in subcategories
              }
            },
            subcategories: {
              include: {
                images: true,
                videos: true, // Include videos in sub-subcategories
                _count: {
                  select: { 
                    images: true,
                    videos: true
                  }
                },
                subcategories: {
                  include: {
                    images: true,
                    videos: true,
                    _count: {
                      select: { 
                        images: true,
                        videos: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  } catch (error) {
    console.error('Database error in getCategories:', error)
    throw error
  }
}

export async function getCategoryByKey(key: string, includePrivate = false) {
  try {
    return await db.category.findUnique({
      where: { key },
      include: {
        subcategories: {
          where: includePrivate ? {} : { isPrivate: false },
          include: {
            images: {
              orderBy: { order: 'asc' }
            },
            videos: {
              orderBy: { order: 'asc' }
            },
            _count: {
              select: { 
                images: true,
                videos: true
              }
            }
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        videos: {
          orderBy: { order: 'asc' }
        },
        parent: true,
        _count: {
          select: { 
            images: true,
            videos: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Database error in getCategoryByKey:', error)
    throw error
  }
}

export async function getPublicImages() {
  try {
    return await db.image.findMany({
      where: {
        category: {
          isPrivate: false
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Database error in getPublicImages:', error)
    throw error
  }
}

export async function getPublicVideos() {
  try {
    return await db.video.findMany({
      where: {
        category: {
          isPrivate: false
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Database error in getPublicVideos:', error)
    throw error
  }
}

export async function getAllImages(includePrivate = false) {
  try {
    return await db.image.findMany({
      where: includePrivate ? {} : {
        category: {
          isPrivate: false
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Database error in getAllImages:', error)
    throw error
  }
}

export async function getAllVideos(includePrivate = false) {
  try {
    return await db.video.findMany({
      where: includePrivate ? {} : {
        category: {
          isPrivate: false
        }
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Database error in getAllVideos:', error)
    throw error
  }
}

export async function getImagesByCategory(categoryKey: string, includePrivate = false) {
  try {
    return await db.image.findMany({
      where: {
        category: {
          key: categoryKey,
          ...(includePrivate ? {} : { isPrivate: false })
        }
      },
      include: {
        category: true
      },
      orderBy: {
        order: 'asc'
      }
    })
  } catch (error) {
    console.error('Database error in getImagesByCategory:', error)
    throw error
  }
}

export async function getVideosByCategory(categoryKey: string, includePrivate = false) {
  try {
    return await db.video.findMany({
      where: {
        category: {
          key: categoryKey,
          ...(includePrivate ? {} : { isPrivate: false })
        }
      },
      include: {
        category: true
      },
      orderBy: {
        order: 'asc'
      }
    })
  } catch (error) {
    console.error('Database error in getVideosByCategory:', error)
    throw error
  }
}

// Combined media functions
export async function getAllMedia(includePrivate = false) {
  try {
    const [images, videos] = await Promise.all([
      getAllImages(includePrivate),
      getAllVideos(includePrivate)
    ])
    
    // Combine and sort by creation date
    const allMedia = [
      ...images.map(img => ({ ...img, mediaType: 'image' as const })),
      ...videos.map(vid => ({ ...vid, mediaType: 'video' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return allMedia
  } catch (error) {
    console.error('Database error in getAllMedia:', error)
    throw error
  }
}

export async function getMediaByCategory(categoryKey: string, includePrivate = false) {
  try {
    const [images, videos] = await Promise.all([
      getImagesByCategory(categoryKey, includePrivate),
      getVideosByCategory(categoryKey, includePrivate)
    ])
    
    // Combine and sort by order
    const allMedia = [
      ...images.map(img => ({ ...img, mediaType: 'image' as const })),
      ...videos.map(vid => ({ ...vid, mediaType: 'video' as const }))
    ].sort((a, b) => a.order - b.order)
    
    return allMedia
  } catch (error) {
    console.error('Database error in getMediaByCategory:', error)
    throw error
  }
}