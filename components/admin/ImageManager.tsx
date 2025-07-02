/* Fixed ImageManager.tsx with working image selection */

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

interface ImageWithCategory extends Omit<ImageType, 'isHeader' | 'category'> {
  category: Category  // Make category required instead of optional
  isHeader?: boolean  // Make isHeader optional
  displayOrder?: number | null  // Add displayOrder (since base type has 'order')
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

  // FIXED: Better toggle select function with debugging
  const toggleSelect = (imageId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    console.log('🔄 Toggling selection for image:', imageId)
    console.log('📊 Current selected images:', Array.from(selectedImages))
    
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
        console.log('➖ Removed from selection:', imageId)
      } else {
        newSet.add(imageId)
        console.log('➕ Added to selection:', imageId)
      }
      console.log('📊 New selected images:', Array.from(newSet))
      return newSet
    })
  }

  // FIXED: Better select mode toggle with cleanup
  const toggleSelectMode = () => {
    if (isSelectMode) {
      // Exiting select mode - clear selections
      setSelectedImages(new Set())
      console.log('🚫 Exiting select mode, cleared selections')
    } else {
      console.log('✅ Entering select mode')
    }
    setIsSelectMode(!isSelectMode)
  }

  // FIXED: Select all/none functionality
  const selectAll = () => {
    const allImageIds = new Set(filteredImages.map(img => img.id))
    setSelectedImages(allImageIds)
    console.log('✅ Selected all images:', Array.from(allImageIds))
  }

  const selectNone = () => {
    setSelectedImages(new Set())
    console.log('🚫 Cleared all selections')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Image Manager</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleSelectMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelectMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isSelectMode ? 'Cancel Selection' : 'Select Images'}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ENHANCED: Selection controls */}
      {isSelectMode && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">
                Selected: {selectedImages.size} of {filteredImages.length}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-gray-500">|</span>
                <button
                  onClick={selectNone}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {selectedImages.size > 0 && (
              <button
                onClick={() => setShowBulkDelete(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedImages.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setShowPrivateOnly(!showPrivateOnly)}
          className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            showPrivateOnly 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
          }`}
        >
          {showPrivateOnly ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPrivateOnly ? 'Private Only' : 'Show Private'}
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400">
        Showing {filteredImages.length} of {images.length} images
      </div>

      {/* Images grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map(image => (
          <div 
            key={image.id} 
            className={`bg-gray-800 border rounded-lg overflow-hidden relative transition-all duration-200 ${
              selectedImages.has(image.id) 
                ? 'ring-2 ring-blue-500 bg-gray-750' 
                : 'border-gray-700 hover:border-gray-600'
            } ${isSelectMode ? 'cursor-pointer' : ''}`}
            onClick={isSelectMode ? (e) => toggleSelect(image.id, e) : undefined}
          >
            {/* Selection indicator - shows when in select mode */}
            {isSelectMode && (
              <div className="absolute top-2 left-2 z-10 bg-black/70 p-2 rounded-full pointer-events-none">
                {selectedImages.has(image.id) ? (
                  <CheckSquare className="text-blue-400 w-5 h-5" />
                ) : (
                  <Square className="text-white w-5 h-5" />
                )}
              </div>
            )}

            {/* Private indicator */}
            {image.category.isPrivate && (
              <div className="absolute top-2 right-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                <EyeOff className="w-3 h-3" />
              </div>
            )}

            {/* Selection overlay - visible when in select mode */}
            {isSelectMode && (
              <div className={`absolute inset-0 z-20 transition-all duration-200 pointer-events-none ${
                selectedImages.has(image.id) 
                  ? 'bg-blue-500/30' 
                  : 'bg-transparent hover:bg-white/10'
              }`} />
            )}

            {/* Image */}
            <div className="relative aspect-square">
              <Image
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_300,h_300,q_auto,f_auto/${image.cloudinaryId}`}
                alt={image.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Image info and actions */}
            <div 
              className="p-3"
              onClick={!isSelectMode ? undefined : (e) => e.stopPropagation()}
            >
              <div className="text-sm text-white">
                <div className="font-semibold truncate mb-1">{image.title}</div>
                <div className="text-xs text-gray-400 mb-2">{image.category.name}</div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                  {image.width && image.height ? (
                    <span>{image.width} × {image.height}</span>
                  ) : (
                    <span>Unknown size</span>
                  )}
                </div>

                {/* Action buttons - only show when not in select mode */}
                {!isSelectMode && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditImage(image)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-md hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <ImageDeleteButton
                      imageId={image.id}
                      imageName={image.title}
                      onDelete={() => handleDelete(image.id)}
                      size="sm"
                      variant="button"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No images found</div>
          <div className="text-gray-500 text-sm">
            {searchTerm || selectedCategory !== 'all' || showPrivateOnly
              ? 'Try adjusting your filters'
              : 'Upload some images to get started'
            }
          </div>
        </div>
      )}

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
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-white text-lg font-bold">Confirm Bulk Delete</h3>
          </div>
          
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete <strong>{selectedImages.size}</strong> selected images? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBulkDelete(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isBulkDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedImages.size} Images
                </>
              )}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  )
}