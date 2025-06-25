// ✅ Updated ImageDeleteButton.tsx with router.refresh for Cloudinary sync
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ImageDeleteButtonProps {
  imageId: string
  imageName: string
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon'
  className?: string
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  imageName: string
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteModal({ isOpen, onClose, imageName, onConfirm, isDeleting }: DeleteModalProps) {
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

          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <p className="text-white font-medium text-center">{imageName}</p>
          </div>

          <p className="text-gray-300 mb-6 text-center">
            Are you sure you want to delete this image? It will be permanently removed 
            from both your website and Cloudinary storage.
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

export default function ImageDeleteButton({
  imageId,
  imageName,
  onDelete,
  size = 'md',
  variant = 'button',
  className = ''
}: ImageDeleteButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Image deleted successfully')
        onDelete()
        setShowModal(false)
        router.refresh() // ✅ Refresh server-rendered content
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete image')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-2' : 'px-3 py-2 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded transition-colors ${sizeClasses[size]} ${className}`}
          title="Delete image"
        >
          <Trash2 className={iconSizes[size]} />
        </button>

        <AnimatePresence>
          {showModal && (
            <DeleteModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              imageName={imageName}
              onConfirm={handleDelete}
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center space-x-2 ${sizeClasses[size]} ${className}`}
      >
        <Trash2 className={iconSizes[size]} />
        <span>Delete</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <DeleteModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            imageName={imageName}
            onConfirm={handleDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  )
}
