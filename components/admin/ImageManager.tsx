/* Full ImageManager.tsx with ModalWrapper integration */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Grid,
  List,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ImageDeleteButton from '@/components/ImageDeleteButton'
import ModalWrapper from '@/components/ui/ModalWrapper'
import { Category, Image as ImageType } from '@/lib/types'

interface ImageManagerProps {
  categories: Category[]
  refresh?: () => Promise<void>
}

interface ImageWithCategory extends ImageType {
  category: Category
  description?: string | null
  isHeader?: boolean
  displayOrder?: number | null
}

function ImageEditModal({ image, onClose, onSave, isSaving }: {
  image: ImageWithCategory
  onClose: () => void
  onSave: (id: string, data: Partial<ImageWithCategory>) => void
  isSaving: boolean
}) {
  const [formData, setFormData] = useState({
    title: image.title,
    description: image.description || '',
    isHeader: image.isHeader || false,
    displayOrder: image.displayOrder || 0,
  })

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(image.id, formData)
  }

  return (
    <ModalWrapper isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Image</h3>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          placeholder="Title"
        />

        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          placeholder="Description"
          rows={3}
        />

        <div className="flex items-center space-x-2">
          <label className="text-sm text-white flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isHeader}
              onChange={(e) => handleChange('isHeader', e.target.checked)}
            />
            <span>Is Header</span>
          </label>

          <input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => handleChange('displayOrder', parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-24"
            placeholder="Order"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

export default function ImageManager({ categories }: ImageManagerProps) {
  const [images, setImages] = useState<ImageWithCategory[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageWithCategory[]>([])
  const [editImage, setEditImage] = useState<ImageWithCategory | null>(null)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPrivateOnly, setShowPrivateOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isSaving, setIsSaving] = useState(false)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  useEffect(() => {
    let result = images
    if (searchTerm) {
      result = result.filter(img => img.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedCategory !== 'all') {
      result = result.filter(img => img.categoryId === selectedCategory)
    }
    if (showPrivateOnly) {
      result = result.filter(img => img.category.isPrivate)
    }
    setFilteredImages(result)
  }, [images, searchTerm, selectedCategory, showPrivateOnly])

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/images?includePrivate=true')
      const data = await res.json()
      setImages(data.images || [])
    } catch {
      toast.error('Failed to fetch images')
    }
  }

  const handleImageUpdate = async (id: string, data: Partial<ImageWithCategory>) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const updated = await res.json()
      setImages(prev => prev.map(img => (img.id === id ? { ...img, ...updated.image } : img)))
      toast.success('Image updated')
      setEditImage(null)
    } catch {
      toast.error('Update failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/images/${id}`, { method: 'DELETE' })
      setImages(prev => prev.filter(img => img.id !== id))
      toast.success('Image deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const res = await fetch('/api/images/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: Array.from(selectedImages) }),
      })
      const result = await res.json()
      setImages(prev => prev.filter(img => !selectedImages.has(img.id)))
      setSelectedImages(new Set())
      toast.success(`${result.deletedCount} images deleted`)
      setShowBulkDelete(false)
    } catch {
      toast.error('Bulk delete failed')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Image Manager</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isSelectMode && selectedImages.size > 0 && (
        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
          <span className="text-white">Selected: {selectedImages.size}</span>
          <button
            onClick={() => setShowBulkDelete(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map(image => (
          <div key={image.id} className={`bg-gray-800 border rounded-lg overflow-hidden relative ${selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''}`}>
            {isSelectMode && (
              <button
                onClick={() => toggleSelect(image.id)}
                className="absolute top-2 left-2 bg-black/60 p-1 rounded"
              >
                {selectedImages.has(image.id) ? <CheckSquare className="text-blue-400 w-5 h-5" /> : <Square className="text-white w-5 h-5" />}
              </button>
            )}
            <div className="relative aspect-square">
              <Image
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_300,h_300,q_auto,f_auto/${image.cloudinaryId}`}
                alt={image.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 text-sm text-white">
              <div className="font-semibold truncate">{image.title}</div>
              <div className="text-xs text-gray-400">{image.category.name}</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{new Date(image.createdAt).toLocaleDateString()}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditImage(image)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-md hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <ImageDeleteButton
                    imageId={image.id}
                    imageName={image.title}
                    onDelete={() => handleDelete(image.id)}
                    size="md"
                    variant="button"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editImage && (
        <ImageEditModal
          image={editImage}
          onClose={() => setEditImage(null)}
          onSave={handleImageUpdate}
          isSaving={isSaving}
        />
      )}

      {/* Bulk Delete Modal */}
      <ModalWrapper isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)}>
        <div className="p-6">
          <h3 className="text-white text-lg font-bold mb-4">Confirm Bulk Delete</h3>
          <p className="text-gray-300 mb-6">Are you sure you want to delete {selectedImages.size} selected images? This cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBulkDelete(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  )
}