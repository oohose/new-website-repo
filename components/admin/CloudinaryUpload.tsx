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
  ChevronDown
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

// Image compression function
const compressImage = (file: File, maxSizeMB: number = 10): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    
    img.onload = () => {
      const maxWidth = 2000
      const maxHeight = 2000
      let { width, height } = img
      
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
      ctx?.drawImage(img, 0, 0, width, height)
      
      const tryCompress = (quality: number) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            
            if (compressedFile.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
              tryCompress(quality - 0.1)
            } else {
              resolve(compressedFile)
            }
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      tryCompress(0.8)
    }
    
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

// Category Picker Component
function CategoryPicker({ categories, selectedCategoryId, onCategorySelect }: CategoryPickerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategory = (category: Category, level = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategoryId === category.id

    return (
      <div key={category.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onCategorySelect(category.id)}
        >
          {hasSubcategories && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(category.id)
              }}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasSubcategories && level > 0 && <div className="w-6" />}
          
          {hasSubcategories ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          
          <span className="flex-1 text-sm">{category.name}</span>
          <span className="text-xs text-gray-500">
            {category._count?.images || 0}
          </span>
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="mt-1">
            {category.subcategories?.map(subcategory => 
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
      <h4 className="text-white font-medium mb-3">Select Category</h4>
      {categories
      .filter(cat => !cat.parentId) // top-level only
      .sort((a, b) => a.name.localeCompare(b.name)) // optional sorting
      .map(category => renderCategory(category))}
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

  const clearAllFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
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
      
      if (file.size > 10 * 1024 * 1024) {
        toast(`Compressing ${file.name}...`)
        try {
          processedFile = await compressImage(file, 9)
          toast.success(`${file.name} compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(processedFile.size / 1024 / 1024).toFixed(1)}MB`)
        } catch (error) {
          toast.error(`Failed to compress ${file.name}`)
          return null
        }
      }

      return {
        id: Math.random().toString(36),
        file: processedFile,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0,
        title: file.name.replace(/\.[^/.]+$/, ''),
        compressedFile: processedFile !== file ? processedFile : undefined
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

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            ))
          } else {
            const error = await response.json()
            throw new Error(error.message || 'Upload failed')
          }
        } catch (error: any) {
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
        onUploadComplete()
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} images failed to upload`)
      }

      setTimeout(() => {
        clearAllFiles()
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)
  const pendingFiles = files.filter(f => f.status === 'pending')
  const canUpload = pendingFiles.length > 0 && selectedCategoryId && !isUploading

  return (
    <div className="space-y-6">
      {/* Category Picker */}
      <CategoryPicker
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
      />

      {/* Selected Category Display */}
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

      {/* Drop Zone */}
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
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
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
              Supports JPG, PNG, WebP. Files over 10MB will be automatically compressed.
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
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
                    {/* Preview */}
                    <div className="w-16 h-16 relative flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                      <Image
                        src={uploadFile.preview}
                        alt={uploadFile.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Content */}
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
                                {(uploadFile.file.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                              {' → '}
                              <span className="text-green-400">
                                {(uploadFile.compressedFile.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            </>
                          ) : (
                            `${(uploadFile.file.size / 1024 / 1024).toFixed(1)}MB`
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