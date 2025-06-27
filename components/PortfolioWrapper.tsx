// components/PortfolioWrapper.tsx - Simplified wrapper with proper refresh
'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ModernPortfolio from '@/components/Portfolio'
import { Category } from '@/lib/types'

interface PortfolioWrapperProps {
  initialCategories: Category[]
}

export default function PortfolioWrapper({ initialCategories }: PortfolioWrapperProps) {
  const [categories, setCategories] = useState(initialCategories)
  const { data: session } = useSession()
  const router = useRouter()
  
  const isAdmin = session?.user?.role === 'ADMIN'

  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 Refreshing categories, admin status:', isAdmin)
      
      // Fetch updated data via API (automatically handles admin status)
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const updatedCategories = await response.json()
        console.log('✅ Categories updated:', {
          count: updatedCategories.length,
          private: updatedCategories.filter((c: any) => c.isPrivate).length
        })
        setCategories(updatedCategories)
      } else {
        console.error('❌ Failed to fetch categories:', response.status)
        // Fallback to page refresh
        router.refresh()
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh categories:', error)
      // Fallback to page refresh
      router.refresh()
    }
  }, [isAdmin, router])

  return (
    <ModernPortfolio 
      categories={categories} 
      onRefresh={handleRefresh}
    />
  )
}