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
        _count: {
          select: { images: true }
        },
        subcategories: {
          where: includePrivate ? {} : { isPrivate: false },
          include: {
            images: true,
            _count: {
              select: { images: true }
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
            _count: {
              select: { images: true }
            }
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        parent: true,
        _count: {
          select: { images: true }
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