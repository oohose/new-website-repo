'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload as UploadIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  EyeOff,
  Image as ImageIcon,
  Video as VideoIcon,
  Play
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Category, UploadFile } from '@/lib/types'
import { MediaCompressor } from '@/utils/mediaCompression'


interface CategoryPickerProps {
  categories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string) => void
}

interface UploadComponentProps {
  categories: Category[]
  onUploadComplete: () => void
}

// Enhanced Category Picker Component
function CategoryPicker({ categories, selectedCategoryId, onCategorySelect }: CategoryPickerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  console.log('🔍 CategoryPicker received categories:', categories.length, categories)
  
  const toggleExpanded = (categoryId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategoryClick = (categoryId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Category clicked:', categoryId)
    onCategorySelect(categoryId)
  }

  // Render a single category with subcategories in tree style
  const renderCategory = (category: Category, level = 0) => {
    const isSelected = selectedCategoryId === category.id
    const imageCount = category._count?.images || 0
    const videoCount = category._count?.videos || 0
    const hasSubcategories = category.subcategories && category.subcategories.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        {/* Main Category Row */}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'hover:bg-gray-700 text-gray-300 hover:text-white'
          }`}
          style={{ minHeight: '48px' }}
        >
          {/* Expand/Collapse Button for Parent Categories */}
          {hasSubcategories ? (
            <button
              onClick={(e) => toggleExpanded(category.id, e)}
              className="flex-shrink-0 p-1 hover:bg-gray-600 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex-shrink-0">
              <Folder className="w-5 h-5" />
            </div>
          )}
          
          {/* Category Name - Clickable */}
          <div 
            className="flex-1 flex items-center space-x-2 min-w-0"
            onClick={(e) => handleCategoryClick(category.id, e)}
          >
            <span className="text-sm font-medium truncate">
              {category.name}
            </span>
            
            {category.isPrivate && (
              <EyeOff className="w-3 h-3 text-red-400 flex-shrink-0" />
            )}
          </div>
          
          {/* Media counts */}
          <div className="flex items-center space-x-2 text-xs text-gray-400 flex-shrink-0">
            {imageCount > 0 && (
              <div className="flex items-center space-x-1">
                <ImageIcon className="w-3 h-3" />
                <span>{imageCount}</span>
              </div>
            )}
            {videoCount > 0 && (
              <div className="flex items-center space-x-1">
                <VideoIcon className="w-3 h-3" />
                <span>{videoCount}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {category.subcategories!.map(subcategory => {
              const subSelected = selectedCategoryId === subcategory.id
              const subImageCount = subcategory._count?.images || 0
              const subVideoCount = subcategory._count?.videos || 0
              
              return (
                <div
                  key={subcategory.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    subSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                  }`}
                  onClick={(e) => handleCategoryClick(subcategory.id, e)}
                  style={{ minHeight: '48px' }}
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 flex items-center space-x-2 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {subcategory.name}
                    </span>
                    
                    {subcategory.isPrivate && (
                      <EyeOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  {/* Media counts for subcategories */}
                  <div className="flex items-center space-x-2 text-xs text-gray-400 flex-shrink-0">
                    {subImageCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>{subImageCount}</span>
                      </div>
                    )}
                    {subVideoCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <VideoIcon className="w-3 h-3" />
                        <span>{subVideoCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Calculate total categories including subcategories
  const totalCategoriesCount = categories.reduce((total, cat) => {
    return total + 1 + (cat.subcategories?.length || 0)
  }, 0)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg max-h-64 overflow-y-auto">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <h4 className="text-white font-medium">Select Category</h4>
        <div className="text-xs text-gray-400 mt-1 space-y-1">
          <p>Total available: {totalCategoriesCount} categories ({categories.length} top-level)</p>
          {selectedCategoryId && (
            <p className="text-blue-400">✓ Category selected</p>
          )}
          {categories.length === 0 && (
            <p className="text-yellow-400">⚠️ No categories found - check Categories tab</p>
          )}
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        {categories.length > 0 ? (
          <>
            {categories
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(category => renderCategory(category))}
          </>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No categories available</p>
            <p className="text-xs mt-1">Create a category first in the Categories tab</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Video preview component
function VideoPreview({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`relative bg-gray-900 rounded overflow-hidden ${className}`}>
      <video 
        src={src} 
        className="w-full h-full object-cover"
        muted
        preload="metadata"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <Play className="w-6 h-6 text-white" />
      </div>
    </div>
  )
}

// Main Upload Component
export default function UploadComponent({ categories, onUploadComplete }: UploadComponentProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add debugging
  console.log('🚀 UploadComponent rendered with categories:', categories.length, categories)

  const clearAllFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      if (file.thumbnail) {
        URL.revokeObjectURL(file.thumbnail)
      }
    })
    setFiles([])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
  const fileArray = Array.from(newFiles)

  // Filter for supported types first
  const validFiles = fileArray.filter(file => {
    if (!MediaCompressor.isSupportedMediaType(file)) {
      toast.error(`${file.name} is not a supported file type`)
      return false
    }
    return true
  })

  // Show loading state for compression
  if (validFiles.length > 0) {
    toast.loading(`Processing ${validFiles.length} file(s)...`, {
      id: 'compression-toast',
      duration: Infinity,
    })
  }

  const uploadFilesPromises = validFiles.map(async (file): Promise<UploadFile | null> => {
    try {
      const originalSizeMB = file.size / (1024 * 1024)
      console.log(`📁 Processing ${file.name}: ${originalSizeMB.toFixed(2)}MB`)

      // ✨ COMPRESSION HAPPENS HERE ✨
      const compressionResult = await MediaCompressor.compressIfNeeded(file)
      const processedFile = compressionResult.file
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video'

      if (compressionResult.wasCompressed) {
        const originalMB = compressionResult.originalSize / (1024 * 1024)
        const compressedMB = compressionResult.compressedSize / (1024 * 1024)
        console.log(`🗜️ Compressed ${file.name}: ${originalMB.toFixed(2)}MB → ${compressedMB.toFixed(2)}MB (${compressionResult.compressionRatio.toFixed(2)}x)`)
        toast.success(
          `Compressed ${file.name}: ${originalMB.toFixed(1)}MB → ${compressedMB.toFixed(1)}MB`,
          { duration: 3000 }
        )
      }

      const preview = compressionResult.thumbnail || URL.createObjectURL(processedFile)

      return {
        id: Math.random().toString(36),
        file: processedFile,
        originalFile: file,
        preview,
        status: 'pending' as const,
        progress: 0,
        title: file.name.replace(/\.[^/.]+$/, ''),
        mediaType,
        duration: compressionResult.duration,
        thumbnail: compressionResult.thumbnail,
      }
    } catch (error) {
      console.error('❌ File processing failed:', error)

      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'

      toast.error(`Failed to process ${file.name}: ${errorMessage}`)
      return null
    }
  })

  try {
    const uploadFilesResults = await Promise.all(uploadFilesPromises)
    const validUploadFiles = uploadFilesResults.filter((file): file is UploadFile => file !== null)

    toast.dismiss('compression-toast')

    if (validUploadFiles.length > 0) {
      setFiles(prev => [...prev, ...validUploadFiles])
      toast.success(`${validUploadFiles.length} file(s) ready for upload!`)
    }
  } catch (error) {
    toast.dismiss('compression-toast')
    console.error('❌ Batch file processing failed:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown batch error occurred'

    toast.error(`Failed to process some files: ${errorMessage}`)
  }
}, [])


  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      if (fileToRemove?.thumbnail) {
        URL.revokeObjectURL(fileToRemove.thumbnail)
      }
      return prev.filter(f => f.id !== fileId)
    })
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const updateFileTitle = useCallback((fileId: string, title: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, title } : file
    ))
  }, [])

  const uploadFiles = async () => {
    if (!selectedCategoryId) {
      toast.error('Please select a category')
      return
    }

    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setIsUploading(true)
    let successfulUploads = 0

    try {
      const uploadPromises = files.map(async (uploadFile) => {
        if (uploadFile.status !== 'pending') return

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ))

        try {
          const formData = new FormData()
          const fileToUpload = uploadFile.file
          formData.append('file', fileToUpload)
          formData.append('title', uploadFile.title)
          formData.append('categoryId', selectedCategoryId)

          console.log(`📤 Uploading ${uploadFile.mediaType}: ${uploadFile.title} (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          const contentType = response.headers.get('content-type')
          let responseData
          
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json()
          } else {
            const textResponse = await response.text()
            console.error('Non-JSON response:', textResponse.substring(0, 200))
            throw new Error(`Server error: ${response.status} ${response.statusText}`)
          }

          if (response.ok && responseData.success) {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            ))
            
            console.log('✅ Upload successful:', responseData.data)
            successfulUploads++
            
            // ENHANCED SUCCESS HANDLING WITH COMPREHENSIVE REVALIDATION
            try {
              console.log('🔄 Starting post-upload revalidation...')
              
              // Step 1: Call our enhanced revalidation endpoint
              const revalidateResponse = await fetch('/api/revalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  categoryKey: responseData.data.categoryKey,
                  action: 'upload',
                  mediaType: uploadFile.mediaType
                })
              });
              
              if (revalidateResponse.ok) {
                const revalidateData = await revalidateResponse.json()
                console.log('✅ Post-upload revalidation successful:', revalidateData);
              } else {
                console.error('❌ Revalidation endpoint failed:', await revalidateResponse.text());
              }
              
              // Step 2: Additional cache busting
              try {
                // Force a direct API call to refresh the specific gallery
                const bustResponse = await fetch(`/api/media?categoryKey=${responseData.data.categoryKey}&t=${Date.now()}`, {
                  cache: 'no-store',
                  headers: { 'Cache-Control': 'no-cache' }
                });
                console.log('🔄 Cache bust fetch completed:', bustResponse.ok);
              } catch (bustError) {
                console.warn('Cache bust fetch failed:', bustError);
              }
              
              // Step 3: Force browser cache clearing
              if (typeof window !== 'undefined') {
                // Clear any browser caches related to galleries
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => {
                      if (name.includes('gallery') || name.includes('media') || name.includes('api')) {
                        caches.delete(name);
                        console.log('🗑️ Cleared browser cache:', name);
                      }
                    });
                  });
                }
              }
              
            } catch (revalidateError) {
              console.error('❌ Post-upload revalidation failed:', revalidateError);
            }
            
            toast.success(`${uploadFile.mediaType} uploaded successfully`)
            
          } else {
            throw new Error(responseData.error || 'Upload failed')
          }
        } catch (error: any) {
          console.error('❌ Upload failed for', uploadFile.title, ':', error)
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: error.message }
              : f
          ))
          toast.error(`Failed to upload ${uploadFile.title}`)
        }
      })

      await Promise.all(uploadPromises)
      
      const errorCount = files.filter(f => f.status === 'error').length
      
      if (successfulUploads > 0) {
        console.log(`🎉 Upload batch complete: ${successfulUploads} successful uploads`)
        
        // Fire the upload success event for portfolio refresh with more data
        const uploadEvent = new CustomEvent('uploadSuccess', {
          detail: { 
            successCount: successfulUploads, 
            categoryId: selectedCategoryId,
            categoryKey: files.find(f => f.status === 'success')?.title, // Try to get category key
            timestamp: Date.now(),
            forceRefresh: true
          }
        })
        window.dispatchEvent(uploadEvent)

        // Call the onUploadComplete callback
        onUploadComplete()

        // Additional forced refresh after a delay
        setTimeout(() => {
          console.log('🔄 Secondary refresh trigger...')
          // Try to trigger a page refresh through router if available
          if (typeof window !== 'undefined' && window.location) {
            // Force a gentle refresh of dynamic content
            const refreshEvent = new Event('visibilitychange')
            document.dispatchEvent(refreshEvent)
          }
        }, 1000)
        
        // Add a small delay then show final success message
        setTimeout(() => {
          toast.success(`🎉 All uploads complete! ${successfulUploads} files uploaded successfully`)
        }, 500)
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} files failed to upload`)
      }

      // Clean up successful uploads after showing them briefly
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'))
      }, 3000)

    } catch (error) {
      console.error('❌ Upload batch error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Find selected category (could be parent or subcategory)
  const findSelectedCategory = (): Category | null => {
    for (const category of categories) {
      if (category.id === selectedCategoryId) {
        return category
      }
      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          if (subcategory.id === selectedCategoryId) {
            return subcategory
          }
        }
      }
    }
    return null
  }

  const selectedCategory = findSelectedCategory()
  const pendingFiles = files.filter(f => f.status === 'pending')
  const canUpload = pendingFiles.length > 0 && selectedCategoryId && !isUploading

  // Calculate total categories including subcategories
  const totalCategoriesCount = categories.reduce((total, cat) => {
    return total + 1 + (cat.subcategories?.length || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <h4 className="text-red-400 font-medium mb-2">Debug Info</h4>
        <div className="text-sm space-y-1">
          <p className="text-gray-300">Top-level categories: <span className="text-white">{categories.length}</span></p>
          <p className="text-gray-300">Total categories (with subcategories): <span className="text-white">{totalCategoriesCount}</span></p>
          <p className="text-gray-300">Selected category ID: <span className="text-white">{selectedCategoryId || 'none'}</span></p>
          {selectedCategory && (
            <p className="text-gray-300">Selected: <span className="text-white">{selectedCategory.name}</span></p>
          )}
        </div>
      </div>

      <CategoryPicker
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {selectedCategory && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <span className="text-white font-medium">
              Uploading to: {selectedCategory.name}
            </span>
            {selectedCategory.isPrivate && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                Private
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files)
              e.target.value = ''
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
            <UploadIcon className="w-6 h-6 text-gray-400" />
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">
              Drop images or videos here or click to browse
            </p>
            <p className="text-gray-400 text-sm">
              Images: JPG, PNG, WebP (up to 50MB) • Videos: MP4, MOV, WebM (up to 100MB)
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Large files will be automatically optimized
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-white font-medium">
                Files to Upload ({files.length})
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={clearAllFiles}
                  disabled={isUploading}
                  className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
                <button
                  onClick={uploadFiles}
                  disabled={!canUpload}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    canUpload
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} Files`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex space-x-3">
                    <div className="w-16 h-16 relative flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                      {uploadFile.mediaType === 'image' ? (
                        <Image
                          src={uploadFile.preview}
                          alt={uploadFile.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <VideoPreview 
                          src={uploadFile.thumbnail || uploadFile.preview} 
                          className="w-full h-full"
                        />
                      )}
                      
                      {/* Media type indicator */}
                      <div className="absolute top-1 right-1 bg-black/70 p-1 rounded">
                        {uploadFile.mediaType === 'image' ? (
                          <ImageIcon className="w-3 h-3 text-white" />
                        ) : (
                          <VideoIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={uploadFile.title}
                        onChange={(e) => updateFileTitle(uploadFile.id, e.target.value)}
                        disabled={uploadFile.status !== 'pending'}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm disabled:opacity-50"
                        placeholder={`${uploadFile.mediaType} title`}
                      />
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-400">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(1)}MB
                          {uploadFile.duration && (
                            <span className="ml-2">• {Math.floor(uploadFile.duration / 60)}:{(uploadFile.duration % 60).toFixed(0).padStart(2, '0')}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {uploadFile.status === 'pending' && (
                            <button
                              onClick={() => removeFile(uploadFile.id)}
                              disabled={isUploading}
                              className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          
                          {uploadFile.status === 'uploading' && (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                          )}
                          
                          {uploadFile.status === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          
                          {uploadFile.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          />
                        </div>
                      )}
                      
                      {uploadFile.status === 'error' && uploadFile.error && (
                        <p className="text-xs text-red-400 mt-1">{uploadFile.error}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}