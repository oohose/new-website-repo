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
import ImageDeleteButton from '@/components/ui/ImageDeleteButton'
import { Category, Image as ImageType } from '@/lib/types'

interface ImageManagerProps {
  categories: Category[]
}

interface ImageWithCategory extends ImageType {
  category: Category
}

interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  selectedImages: ImageWithCategory[]
  onConfirm: () => void
  isDeleting: boolean
}

function BulkDeleteModal({ isOpen, onClose, selectedImages, onConfirm, isDeleting }: BulkDeleteModalProps) {
  if (!isOpen) return null

  const categoryCounts = selectedImages.reduce((acc, image) => {
    const categoryName = image.category.name
    acc[categoryName] = (acc[categoryName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
              <h3 className="text-lg font-semibold text-white">Delete Selected Images</h3>
              <p className="text-gray-400 text-sm">This action cannot be undone</p>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div className="text-center mb-3">
              <span className="text-2xl font-bold text-white">{selectedImages.length}</span>
              <span className="text-gray-300 ml-2">images selected</span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-300">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <div key={category} className="flex justify-between">
                  <span>{category}:</span>
                  <span className="text-white font-medium">{count} image{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-300 mb-6 text-center">
            Are you sure you want to delete these {selectedImages.length} images? 
            They will be permanently removed from both your website and Cloudinary storage.
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
                  <span>Delete {selectedImages.length} Images</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ImageManager({ categories }: ImageManagerProps) {
  const [images, setImages] = useState<ImageWithCategory[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPrivateOnly, setShowPrivateOnly] = useState(false)
  
  // Bulk selection state
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  useEffect(() => {
    filterImages()
  }, [images, searchTerm, selectedCategory, showPrivateOnly])

  // Clear selection when filters change
  useEffect(() => {
    setSelectedImages(new Set())
  }, [searchTerm, selectedCategory, showPrivateOnly])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images?includePrivate=true')
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        toast.error('Failed to fetch images')
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }

  const filterImages = () => {
    let filtered = images

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(image => 
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(image => image.categoryId === selectedCategory)
    }

    // Filter by privacy
    if (showPrivateOnly) {
      filtered = filtered.filter(image => image.category.isPrivate)
    }

    setFilteredImages(filtered)
  }

  const handleImageDelete = (deletedImageId: string) => {
    setImages(prev => prev.filter(img => img.id !== deletedImageId))
    setSelectedImages(prev => {
      const newSelected = new Set(prev)
      newSelected.delete(deletedImageId)
      return newSelected
    })
    toast.success('Image deleted successfully')
  }

  const handleImageSelect = (imageId: string, isSelected: boolean) => {
    setSelectedImages(prev => {
      const newSelected = new Set(prev)
      if (isSelected) {
        newSelected.add(imageId)
      } else {
        newSelected.delete(imageId)
      }
      return newSelected
    })
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedImages(new Set(filteredImages.map(img => img.id)))
    } else {
      setSelectedImages(new Set())
    }
  }

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedImages(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return

    setIsBulkDeleting(true)
    
    try {
      const imageIds = Array.from(selectedImages)
      const response = await fetch('/api/images/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      })

      if (response.ok) {
        const result = await response.json()
        setImages(prev => prev.filter(img => !selectedImages.has(img.id)))
        setSelectedImages(new Set())
        setShowBulkDeleteModal(false)
        toast.success(`${result.deletedCount} images deleted successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete images')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete images')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const getClientThumbnailUrl = (cloudinaryId: string, width: number, height: number): string => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName || !cloudinaryId) {
      return '/placeholder-image.jpg'
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${cloudinaryId}`
  }

  const selectedImagesData = filteredImages.filter(img => selectedImages.has(img.id))
  const isAllSelected = filteredImages.length > 0 && selectedImages.size === filteredImages.length
  const isPartiallySelected = selectedImages.size > 0 && selectedImages.size < filteredImages.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Image Manager</h2>
          <p className="text-gray-400">
            {filteredImages.length} of {images.length} images
            {selectedImages.size > 0 && (
              <span className="ml-2 text-blue-400">
                • {selectedImages.size} selected
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Selection controls */}
          {selectedImages.size > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedImages.size})</span>
              </button>
            </div>
          )}
          
          <button
            onClick={toggleSelectMode}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isSelectMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isSelectMode ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>Select</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Select All Controls */}
      {isSelectMode && filteredImages.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="form-checkbox text-blue-500"
                />
              </div>
              <span className="text-white font-medium">
                {isAllSelected 
                  ? `All ${filteredImages.length} images selected`
                  : selectedImages.size > 0 
                    ? `${selectedImages.size} of ${filteredImages.length} images selected`
                    : `Select all ${filteredImages.length} images`
                }
              </span>
            </label>
            
            {selectedImages.size > 0 && (
              <button
                onClick={() => setSelectedImages(new Set())}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category._count?.images || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Filter */}
          <label className="flex items-center space-x-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={showPrivateOnly}
              onChange={(e) => setShowPrivateOnly(e.target.checked)}
              className="form-checkbox text-blue-500"
            />
            <span className="text-sm">Private only</span>
          </label>
        </div>
      </div>

      {/* Images */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl text-gray-300 mb-2">No images found</h3>
          <p className="text-gray-400">
            {searchTerm || selectedCategory !== 'all' || showPrivateOnly
              ? 'Try adjusting your filters'
              : 'Upload some images to get started'
            }
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image, index) => (
                <ImageGridCard
                  key={image.id}
                  image={image}
                  index={index}
                  onDelete={handleImageDelete}
                  getThumbnailUrl={getClientThumbnailUrl}
                  isSelectMode={isSelectMode}
                  isSelected={selectedImages.has(image.id)}
                  onSelect={handleImageSelect}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredImages.map((image, index) => (
                <ImageListItem
                  key={image.id}
                  image={image}
                  index={index}
                  onDelete={handleImageDelete}
                  getThumbnailUrl={getClientThumbnailUrl}
                  isSelectMode={isSelectMode}
                  isSelected={selectedImages.has(image.id)}
                  onSelect={handleImageSelect}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <BulkDeleteModal
            isOpen={showBulkDeleteModal}
            onClose={() => setShowBulkDeleteModal(false)}
            selectedImages={selectedImagesData}
            onConfirm={handleBulkDelete}
            isDeleting={isBulkDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Updated Grid Card Component
interface ImageCardProps {
  image: ImageWithCategory
  index: number
  onDelete: (id: string) => void
  getThumbnailUrl: (id: string, width: number, height: number) => string
  isSelectMode: boolean
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
}

function ImageGridCard({ 
  image, 
  index, 
  onDelete, 
  getThumbnailUrl, 
  isSelectMode, 
  isSelected, 
  onSelect 
}: ImageCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleCardClick = () => {
    if (isSelectMode) {
      onSelect(image.id, !isSelected)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(image.id, !isSelected)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={`group relative bg-gray-800 rounded-lg overflow-hidden border transition-all ${
        isSelectMode 
          ? `cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700 hover:border-gray-600'}` 
          : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {isSelectMode && (
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={handleCheckboxClick}
            className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded border-2 border-white flex items-center justify-center"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square relative bg-gray-700">
        {!imageError ? (
          <Image
            src={getThumbnailUrl(image.cloudinaryId, 300, 300)}
            alt={image.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="300px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <div className="text-gray-400 text-center">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-xs">Image not found</div>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        {!isSelectMode && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageDeleteButton
                imageId={image.id}
                imageName={image.title}
                onDelete={() => onDelete(image.id)}
                size="sm"
                variant="icon"
              />
            </div>
          </div>
        )}
        
        {/* Privacy indicator */}
        {image.category.isPrivate && (
          <div className="absolute top-2 right-2">
            <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
              <EyeOff className="w-3 h-3" />
              <span>Private</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-white font-medium text-sm truncate mb-1">{image.title}</h4>
        <p className="text-gray-400 text-xs truncate">{image.category.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-500 text-xs">
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
          {!isSelectMode && (
            <button className="text-gray-400 hover:text-white transition-colors">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Updated List Item Component
function ImageListItem({ 
  image, 
  index, 
  onDelete, 
  getThumbnailUrl, 
  isSelectMode, 
  isSelected, 
  onSelect 
}: ImageCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleRowClick = () => {
    if (isSelectMode) {
      onSelect(image.id, !isSelected)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(image.id, !isSelected)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className={`group bg-gray-800 rounded-lg border transition-all ${
        isSelectMode 
          ? `cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700 hover:border-gray-600'}` 
          : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={handleRowClick}
    >
      <div className="flex items-center p-4 space-x-4">
        {/* Selection checkbox */}
        {isSelectMode && (
          <button
            onClick={handleCheckboxClick}
            className="w-6 h-6 bg-gray-700 rounded border-2 border-gray-500 flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-400" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* Thumbnail */}
        <div className="w-16 h-16 relative bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          {!imageError ? (
            <Image
              src={getThumbnailUrl(image.cloudinaryId, 64, 64)}
              alt={image.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 text-xl">📷</div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-white font-medium truncate">{image.title}</h4>
            {image.category.isPrivate && (
              <div className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
                <EyeOff className="w-3 h-3" />
                <span>Private</span>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm">{image.category.name}</p>
          <p className="text-gray-500 text-xs mt-1">
            Uploaded {new Date(image.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        {!isSelectMode && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <ImageDeleteButton
              imageId={image.id}
              imageName={image.title}
              onDelete={() => onDelete(image.id)}
              size="sm"
              variant="icon"
            />
          </div>
        )}

        {/* File info */}
        <div className="text-right text-xs text-gray-500 min-w-0">
          <div>{image.cloudinaryId.split('/').pop()}</div>
          <div className="truncate max-w-24">ID: {image.id.slice(-8)}</div>
        </div>
      </div>
    </motion.div>
  )
}