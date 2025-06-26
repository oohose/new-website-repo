'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ModalWrapper from '@/components/ui/ModalWrapper'

interface ImageDeleteButtonProps {
  imageId: string
  imageName: string
  onDelete: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon'
  className?: string
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

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowModal(true)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Image deleted')
        onDelete()
        setShowModal(false)
        router.refresh()
      } else {
        toast.error('Failed to delete image')
      }
    } catch (err) {
      toast.error('An error occurred while deleting')
    } finally {
      setIsDeleting(false)
    }
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
        <DeleteModal
          show={showModal}
          onClose={() => setShowModal(false)}
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
        onClick={handleClick}
        className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors ${className}`}
      >
        <Trash2 className={`${iconSizes[size]}`} />
        <span>Delete</span>
      </button>

      <DeleteModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        imageName={imageName}
        isDeleting={isDeleting}
      />
    </>
  )
}

function DeleteModal({
  show,
  onClose,
  onConfirm,
  imageName,
  isDeleting
}: {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  imageName: string
  isDeleting: boolean
}) {
  return (
    <ModalWrapper isOpen={show} onClose={onClose}>
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
    </ModalWrapper>
  )
}