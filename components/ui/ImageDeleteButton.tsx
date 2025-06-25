'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface ImageDeleteButtonProps {
  imageId: string
  imageName: string
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button'
}

export default function ImageDeleteButton({ 
  imageId, 
  imageName, 
  onDelete, 
  size = 'md',
  variant = 'icon'
}: ImageDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Image deleted successfully')
        onDelete()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete image')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5', 
    lg: 'w-10 h-10 p-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
        </button>

        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleDelete}
          imageName={imageName}
          isDeleting={isDeleting}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className={`${sizeClasses[size]} bg-red-600/90 hover:bg-red-700 disabled:bg-red-400 text-white rounded-full transition-all duration-200 backdrop-blur-sm`}
        title="Delete image"
      >
        {isDeleting ? (
          <div className={`${iconSizes[size]} animate-spin rounded-full border-2 border-white border-t-transparent`} />
        ) : (
          <Trash2 className={iconSizes[size]} />
        )}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        imageName={imageName}
        isDeleting={isDeleting}
      />
    </>
  )
}

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  imageName: string
  isDeleting: boolean
}

function ConfirmModal({ isOpen, onClose, onConfirm, imageName, isDeleting }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Delete Image</h3>
              <p className="text-gray-400 text-sm">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-gray-300 mb-6">
            Are you sure you want to delete "<span className="font-medium text-white">{imageName}</span>"? 
            This will permanently remove the image from both your website and Cloudinary storage.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}