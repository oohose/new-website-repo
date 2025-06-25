'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // Don't redirect if we're on the signin page
    if (pathname === '/admin/signin') return

    if (!session) {
      router.push('/admin/signin')
      return
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'ADMIN') {
      router.push('/admin/signin')
      return
    }
  }, [session, status, router, pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Allow signin page to render without auth check
  if (pathname === '/admin/signin') {
    return <>{children}</>
  }

  // Require auth for other admin pages
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}