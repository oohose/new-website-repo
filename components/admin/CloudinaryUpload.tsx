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
  EyeOff
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Category, UploadFile } from '@/lib/types'

interface CategoryPickerProps {
  categories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string) => void
}

interface UploadComponentProps {
  categories: Category[]
  onUploadComplete: () => void
}

// ENHANCED Category Picker Component that shows subcategories in tree view
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
          
          <span className="text-xs text-gray-400 flex-shrink-0 min-w-[30px] text-right">
            {imageCount}
          </span>
        </div>
        
        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {category.subcategories!.map(subcategory => {
              const subSelected = selectedCategoryId === subcategory.id
              const subImageCount = subcategory._count?.images || 0
              
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
                  
                  <span className="text-xs text-gray-400 flex-shrink-0 min-w-[30px] text-right">
                    {subImageCount}
                  </span>
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

// Fixed image compression function for photography portfolio
const compressImage = (file: File, targetSizeMB: number = 4.5): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Early return if file is already small enough
    if (file.size <= targetSizeMB * 1024 * 1024) {
      console.log('✅ File already small enough, no compression needed')
      resolve(file)
      return
    }

    console.log(`🔄 Compressing ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to target ${targetSizeMB}MB`)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    
    const cleanup = () => {
      URL.revokeObjectURL(img.src)
    }

    img.onload = () => {
      try {
        // More generous dimensions for photography - maintain higher resolution
        const maxWidth = 2800  // Increased from 2000
        const maxHeight = 2800 // Increased from 2000
        let { width, height } = img
        
        // Only resize if significantly larger than max dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
        } else {
          cleanup()
          reject(new Error('Could not get canvas context'))
          return
        }
        
        const targetSizeBytes = targetSizeMB * 1024 * 1024
        let bestResult = file // Keep track of best result so far
        let attempts = 0
        const maxAttempts = 15
        
        const tryCompress = (quality: number) => {
          attempts++
          
          if (attempts > maxAttempts) {
            console.log(`⚠️ Max attempts reached. Using best result: ${(bestResult.size / 1024 / 1024).toFixed(2)}MB`)
            cleanup()
            resolve(bestResult)
            return
          }

          canvas.toBlob((blob) => {
            if (!blob) {
              cleanup()
              reject(new Error('Failed to create compressed blob'))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            
            const sizeMB = compressedFile.size / 1024 / 1024
            console.log(`📊 Attempt ${attempts}: ${sizeMB.toFixed(2)}MB at quality ${quality.toFixed(2)}`)
            
            // Update best result if this is closer to target (but still under)
            if (compressedFile.size <= targetSizeBytes) {
              if (compressedFile.size > bestResult.size || bestResult.size > targetSizeBytes) {
                bestResult = compressedFile
              }
            }
            
            // If we're very close to target size, use this result
            const targetTolerance = targetSizeBytes * 0.1 // 10% tolerance
            if (Math.abs(compressedFile.size - targetSizeBytes) <= targetTolerance) {
              console.log(`✅ Target achieved: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${sizeMB.toFixed(2)}MB`)
              cleanup()
              resolve(compressedFile)
              return
            }
            
            // If we're under target and quality is still reasonable, try higher quality
            if (compressedFile.size < targetSizeBytes && quality < 0.95) {
              const newQuality = Math.min(0.95, quality + 0.05)
              tryCompress(newQuality)
            }
            // If we're over target, try lower quality
            else if (compressedFile.size > targetSizeBytes && quality > 0.3) {
              const newQuality = Math.max(0.3, quality - 0.05)
              tryCompress(newQuality)
            }
            // If we can't get closer, use best result
            else {
              console.log(`✅ Compression complete: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(bestResult.size / 1024 / 1024).toFixed(2)}MB`)
              cleanup()
              resolve(bestResult)
            }
          }, 'image/jpeg', quality)
        }
        
        // Start with a quality that should get us close to target
        const initialQuality = 0.8
        tryCompress(initialQuality)
        
      } catch (canvasError) {
        cleanup()
        reject(canvasError)
      }
    }
    
    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to load image for compression'))
    }
    
    try {
      img.src = URL.createObjectURL(file)
    } catch (urlError) {
      cleanup()
      reject(urlError)
    }
  })
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
    })
    setFiles([])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      return true
    })

    const uploadFilesPromises = validFiles.map(async (file): Promise<UploadFile | null> => {
      let processedFile = file
      const originalFile = file
      
      if (file.size > 9 * 1024 * 1024) {
        toast(`Compressing ${file.name}...`)
        try {
          processedFile = await compressImage(file, 4.5)
          
          const originalSizeMB = (file.size / 1024 / 1024).toFixed(1)
          const compressedSizeMB = (processedFile.size / 1024 / 1024).toFixed(1)
          
          toast.success(`${file.name} compressed from ${originalSizeMB}MB to ${compressedSizeMB}MB`)
          
          console.log(`Compression result:`, {
            original: `${originalSizeMB}MB`,
            compressed: `${compressedSizeMB}MB`,
            fileName: file.name
          })
          
        } catch (error) {
          console.error('Compression failed:', error)
          toast.error(`Failed to compress ${file.name}`)
          return null
        }
      } else {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1)
        console.log(`File ${file.name}: ${sizeMB}MB - no compression needed`)
      }

      return {
        id: Math.random().toString(36),
        file: processedFile,
        originalFile: originalFile,
        preview: URL.createObjectURL(originalFile),
        status: 'pending' as const,
        progress: 0,
        title: file.name.replace(/\.[^/.]+$/, ''),
        compressedFile: processedFile !== originalFile ? processedFile : undefined
      }
    })

    const uploadFilesResults = await Promise.all(uploadFilesPromises)
    const validUploadFiles = uploadFilesResults.filter((file): file is UploadFile => file !== null)
    setFiles(prev => [...prev, ...validUploadFiles])
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
          const fileToUpload = uploadFile.compressedFile || uploadFile.file
          formData.append('file', fileToUpload)
          formData.append('title', uploadFile.title)
          formData.append('categoryId', selectedCategoryId)

          console.log(`📤 Uploading ${uploadFile.title} (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`)

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
        }
      })

      await Promise.all(uploadPromises)
      
      const successCount = files.filter(f => f.status === 'success').length
      const errorCount = files.filter(f => f.status === 'error').length
      
      if (successCount > 0) {
        toast.success(`${successCount} images uploaded successfully`)

        const uploadEvent = new CustomEvent('uploadSuccess', {
        detail: { successCount, categoryId: selectedCategoryId }
      })
      window.dispatchEvent(uploadEvent)

        onUploadComplete()
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} images failed to upload`)
      }

      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'))
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
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
          {categories.length > 0 && (
            <details className="mt-2">
              <summary className="text-blue-400 cursor-pointer text-xs">View Raw Categories</summary>
              <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(categories, null, 2)}
              </pre>
            </details>
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
          accept="image/*"
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
              Drop images here or click to browse
            </p>
            <p className="text-gray-400 text-sm">
              Supports JPG, PNG, WebP. Files over 9MB will be compressed to ~4.5MB.
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
                      <Image
                        src={uploadFile.preview}
                        alt={uploadFile.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={uploadFile.title}
                        onChange={(e) => updateFileTitle(uploadFile.id, e.target.value)}
                        disabled={uploadFile.status !== 'pending'}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm disabled:opacity-50"
                        placeholder="Image title"
                      />
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {uploadFile.compressedFile ? (
                            <>
                              <span className="line-through text-red-400">
                                {(uploadFile.originalFile.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                              {' → '}
                              <span className="text-green-400">
                                {(uploadFile.compressedFile.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            </>
                          ) : (
                            `${(uploadFile.originalFile.size / 1024 / 1024).toFixed(1)}MB`
                          )}
                        </span>
                        
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