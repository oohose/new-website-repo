'use client'

import { Suspense } from 'react'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  )
}