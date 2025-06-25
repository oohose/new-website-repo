'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuthCache() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const previousAuthState = useRef<string | null>(null)
  const isInitialized = useRef(false)

  const invalidateCache = async () => {
    try {
      console.log('Invalidating cache due to auth state change...')
      
      // Call revalidation API
      await fetch('/api/revalidate', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Force router refresh
      router.refresh()
      
      console.log('Cache invalidated successfully')
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    const currentAuthState = session?.user ? 
      `${(session.user as any)?.role || 'USER'}-${session.user.email}` : 
      'UNAUTHENTICATED'

    // Skip the first run to avoid unnecessary invalidation on initial load
    if (!isInitialized.current) {
      previousAuthState.current = currentAuthState
      isInitialized.current = true
      return
    }

    // Check if auth state actually changed
    if (previousAuthState.current !== currentAuthState) {
      console.log('Auth state changed:', {
        from: previousAuthState.current,
        to: currentAuthState
      })
      
      // Invalidate cache when auth state changes
      invalidateCache()
      
      previousAuthState.current = currentAuthState
    }
  }, [session, status, router])

  const forceRefresh = async () => {
    await invalidateCache()
  }

  return {
    isAdmin: (session?.user as any)?.role === 'ADMIN',
    isAuthenticated: !!session?.user,
    forceRefresh,
    session,
    status
  }
}