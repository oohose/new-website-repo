'use client'

import { useRouter } from 'next/navigation'

export function useCacheUtils() {
  const router = useRouter()

  const refreshPage = () => {
    // Force a hard refresh of the current page
    router.refresh()
  }

  const navigateAndRefresh = (path: string) => {
    // Navigate and force refresh
    router.push(path)
    router.refresh()
  }

  const invalidateCache = async (paths: string[] = []) => {
    try {
      // Call revalidation API for specific paths
      for (const path of paths) {
        await fetch(`/api/revalidate?path=${encodeURIComponent(path)}`, {
          method: 'POST',
        })
      }
      router.refresh()
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    }
  }

  return {
    refreshPage,
    navigateAndRefresh,
    invalidateCache,
  }
}