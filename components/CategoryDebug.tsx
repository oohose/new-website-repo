// components/CategoryDebug.tsx - Debug component to check category data
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function CategoryDebug({ categories }: { categories: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const privateCategories = categories.filter(cat => cat.isPrivate)
  const topLevelPrivate = categories.filter(cat => !cat.parentId && cat.isPrivate)

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white p-2 rounded-lg text-xs z-50"
      >
        {isOpen ? 'Hide' : 'Show'} Category Debug
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Category Debug Info:</h3>
          
          <div className="space-y-2 mb-4">
            <p><strong>User Email:</strong> {session?.user?.email}</p>
            <p><strong>User Role:</strong> {(session?.user as any)?.role}</p>
            <p><strong>Total Categories:</strong> {categories.length}</p>
            <p><strong>Private Categories:</strong> {privateCategories.length}</p>
            <p><strong>Top-level Private:</strong> {topLevelPrivate.length}</p>
          </div>

          {/* All Categories */}
          <div className="mb-4">
            <h4 className="font-semibold mb-1">All Categories:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className={`p-1 rounded ${cat.isPrivate ? 'bg-red-800/30' : 'bg-green-800/30'}`}>
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-xs opacity-70">
                    Private: {cat.isPrivate ? 'YES' : 'NO'} | 
                    Parent: {cat.parentId ? 'YES' : 'NO'} | 
                    Images: {cat._count?.images || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Private Categories Only */}
          {privateCategories.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1 text-red-300">Private Categories:</h4>
              <div className="space-y-1">
                {privateCategories.map(cat => (
                  <div key={cat.id} className="p-1 bg-red-800/30 rounded">
                    <div className="font-medium">{cat.name}</div>
                    <div className="text-xs opacity-70">
                      Top-level: {cat.parentId ? 'NO' : 'YES'} | 
                      Images: {cat._count?.images || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}