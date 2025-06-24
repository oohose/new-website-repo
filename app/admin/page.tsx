'use client'

import { Suspense } from 'react'
import { default as AdminDashboard } from '@/components/admin/AdminDashboard'
import CloudinaryUpload from '@/components/admin/CloudinaryUpload'

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <AdminDashboard />
    </Suspense>
  )
}

function AdminContent() {
  const handleUploadComplete = (results: any[]) => {
    console.log('Upload complete:', results)
    // Optionally refresh the page or update state
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Upload Photos</h2>
        <p className="text-gray-400 mb-8">Add new photos to your portfolio</p>
        
        <CloudinaryUpload
          maxFiles={20}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </div>
  )
}