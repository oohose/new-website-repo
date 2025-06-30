// components/AdminDebug.tsx - Temporary debug component
'use client'

import { useSession } from 'next-auth/react'
import { useAuthCache } from '@/lib/hooks/useAuthCache'

export default function AdminDebug() {
  const { data: session } = useSession()
  const { isAdmin } = useAuthCache()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Admin Debug Info:</h3>
      <div className="space-y-1">
        <p><strong>Session Status:</strong> {session ? 'Logged in' : 'Not logged in'}</p>
        <p><strong>User Email:</strong> {session?.user?.email || 'None'}</p>
        <p><strong>User Role:</strong> {(session?.user as any)?.role || 'None'}</p>
        <p><strong>useAuthCache isAdmin:</strong> {isAdmin ? 'true' : 'false'}</p>
        <p><strong>Final Admin Status:</strong> {(isAdmin || (session?.user as any)?.role === 'ADMIN') ? 'ADMIN' : 'USER'}</p>
      </div>
    </div>
  )
}