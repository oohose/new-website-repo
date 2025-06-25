'use client'

import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminImageSync() {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    
    try {
      const response = await fetch('/api/images/sync', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Failed to sync images')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Sync Images</h3>
          <p className="text-gray-400 text-sm">Clean up orphaned database records</p>
        </div>
      </div>

      <div className="flex items-start space-x-3 mb-4">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
        <p className="text-gray-300 text-sm">
          If you have deleted images directly from Cloudinary, use this to remove orphaned database records 
          and keep your website in sync.
        </p>
      </div>

      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? 'Syncing...' : 'Sync Images'}</span>
      </button>
    </div>
  )
}