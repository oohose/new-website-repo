import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper functions for common database operations

export async function getCategories(includePrivate = false) {
  return await db.category.findMany({
    where: includePrivate ? {} : { isPrivate: false },
    include: {
      subcategories: {
        where: includePrivate ? {} : { isPrivate: false },
        include: {
          images: true,
          _count: {
            select: { images: true }
          }
        }
      },
      images: true,
      _count: {
        select: { images: true }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

export async function getCategoryByKey(key: string, includePrivate = false) {
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
}

export async function getPublicImages() {
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
}

export async function getAllImages(includePrivate = false) {
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
}

export async function getImagesByCategory(categoryKey: string, includePrivate = false) {
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
}