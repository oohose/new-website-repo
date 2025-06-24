'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageCompressor } from '@/utils/imageCompression'

interface UploadedFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  compressing: boolean
  error?: string
  publicId?: string
  url?: string
  originalSize?: number
  compressedSize?: number
  compressionRatio?: number
  wasCompressed?: boolean
}

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
}

interface CloudinaryUploadProps {
  onUploadComplete?: (results: any[]) => void
  maxFiles?: number
  category?: string
}

export default function CloudinaryUpload({ 
  onUploadComplete, 
  maxFiles = 10,
  category 
}: CloudinaryUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(category || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includePrivate=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
      compressing: false,
      originalSize: file.size
    }))
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))

    // Start compression for large files
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = files.length + i
      compressFileIfNeeded(fileIndex, newFiles[i].file)
    }
  }, [maxFiles, files.length])

  const compressFileIfNeeded = async (index: number, originalFile: File) => {
    const fileSizeMB = originalFile.size / (1024 * 1024)
    
    // Only compress if file is large and is a supported image type
    if (fileSizeMB <= 10 || !ImageCompressor.isSupportedImageType(originalFile)) {
      return
    }

    // Set compressing state
    setFiles(prev => {
      const newFiles = [...prev]
      if (newFiles[index]) {
        newFiles[index] = { ...newFiles[index], compressing: true }
      }
      return newFiles
    })

    try {
      const result = await ImageCompressor.compressIfNeeded(originalFile)
      
      if (result.wasCompressed) {
        // Update file with compressed version
        setFiles(prev => {
          const newFiles = [...prev]
          if (newFiles[index]) {
            // Revoke old preview URL
            URL.revokeObjectURL(newFiles[index].preview)
            
            newFiles[index] = {
              ...newFiles[index],
              file: result.file,
              preview: URL.createObjectURL(result.file),
              compressing: false,
              originalSize: result.originalSize,
              compressedSize: result.compressedSize,
              compressionRatio: result.compressionRatio,
              wasCompressed: true
            }
          }
          return newFiles
        })

        toast.success(
          `Compressed ${originalFile.name}: ${ImageCompressor.formatFileSize(result.originalSize)} → ${ImageCompressor.formatFileSize(result.compressedSize)}`
        )
      } else {
        // Just update the compressing state
        setFiles(prev => {
          const newFiles = [...prev]
          if (newFiles[index]) {
            newFiles[index] = { ...newFiles[index], compressing: false }
          }
          return newFiles
        })
      }
    } catch (error) {
      console.error('Compression error:', error)
      setFiles(prev => {
        const newFiles = [...prev]
        if (newFiles[index]) {
          newFiles[index] = { 
            ...newFiles[index], 
            compressing: false,
            error: 'Compression failed'
          }
        }
        return newFiles
      })
      toast.error(`Failed to compress ${originalFile.name}`)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxFiles,
    multiple: true
  })

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const uploadToCloudinary = async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Use the correct upload preset from your environment
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!uploadPreset) {
      throw new Error('Cloudinary upload preset not configured')
    }
    
    formData.append('upload_preset', uploadPreset)
    
    // Find the selected category to use its key for the folder
    const categoryObj = categories.find(cat => cat.id === selectedCategory)
    const folderName = categoryObj ? categoryObj.key : 'uncategorized'
    formData.append('folder', `photography/${folderName}`)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured')
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Cloudinary upload error:', errorData)
      throw new Error(`Upload failed: ${response.status}`)
    }

    return response.json()
  }

  const saveToDatabase = async (uploadResults: any[]) => {
    const response = await fetch('/api/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: uploadResults.map(result => ({
          title: result.original_filename || 'Untitled',
          description: null,
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          categoryId: selectedCategory,
          isHeader: false,
          order: 0
        }))
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Database save error:', errorData)
      throw new Error('Failed to save to database')
    }

    return response.json()
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }

    // Check if any files are still compressing
    const stillCompressing = files.some(file => file.compressing)
    if (stillCompressing) {
      toast.error('Please wait for compression to complete')
      return
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error('Cloudinary configuration missing')
      return
    }

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary upload preset not configured')
      return
    }

    setUploading(true)
    const uploadResults = []

    try {
      // Upload files one by one to show progress
      for (let i = 0; i < files.length; i++) {
        if (files[i].uploaded) continue

        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i] = { ...newFiles[i], uploading: true }
          return newFiles
        })

        try {
          const result = await uploadToCloudinary(files[i].file)
          uploadResults.push(result)

          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = {
              ...newFiles[i],
              uploading: false,
              uploaded: true,
              publicId: result.public_id,
              url: result.secure_url
            }
            return newFiles
          })

          toast.success(`Uploaded ${files[i].file.name}`)
        } catch (error) {
          console.error('Upload error for file:', files[i].file.name, error)
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = {
              ...newFiles[i],
              uploading: false,
              uploaded: false,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
            return newFiles
          })
          toast.error(`Failed to upload ${files[i].file.name}`)
        }
      }

      // Save successful uploads to database
      if (uploadResults.length > 0) {
        await saveToDatabase(uploadResults)
        toast.success(`Successfully uploaded ${uploadResults.length} images`)
        onUploadComplete?.(uploadResults)
      }

    } catch (error) {
      console.error('Upload process error:', error)
      toast.error('Upload process failed')
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview))
    setFiles([])
  }

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Select Category *
        </label>
        {loadingCategories ? (
          <div className="text-gray-400">Loading categories...</div>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Choose a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {cat.isPrivate ? '(Private)' : ''}
              </option>
            ))}
          </select>
        )}
        
        {!loadingCategories && categories.length === 0 && (
          <p className="text-yellow-400 text-sm mt-2">
            No categories found. Please create a category first.
          </p>
        )}
      </div>

      {/* Compression Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-blue-400 font-medium">Smart Compression</h3>
        </div>
        <p className="text-blue-200 text-sm">
          Files larger than 10MB will be automatically compressed to under 10MB while maintaining quality.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-white mb-2">
          {isDragActive ? 'Drop the files here...' : 'Drag & drop images here'}
        </p>
        <p className="text-gray-400">
          or click to select files (max {maxFiles} files)
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supports: JPEG, PNG, WebP, HEIC
        </p>
      </div>

      {/* File Preview Grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Selected Files ({files.length})
              </h3>
              <button
                onClick={clearAll}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute bottom-2 right-2">
                      {file.compressing && (
                        <div className="bg-yellow-500 text-white rounded-full p-1" title="Compressing...">
                          <Zap className="w-4 h-4 animate-pulse" />
                        </div>
                      )}
                      {file.uploading && (
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        </div>
                      )}
                      {file.uploaded && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      {file.error && (
                        <div className="bg-red-500 text-white rounded-full p-1" title={file.error}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Compression Badge */}
                    {file.wasCompressed && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white rounded px-2 py-1 text-xs">
                        -{Math.round((1 - 1/file.compressionRatio!) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-xs text-gray-400 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {file.compressedSize 
                          ? ImageCompressor.formatFileSize(file.compressedSize)
                          : ImageCompressor.formatFileSize(file.file.size)
                        }
                      </span>
                      {file.wasCompressed && (
                        <span className="text-green-400">
                          Compressed
                        </span>
                      )}
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-400 mt-1 truncate">
                        {file.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  uploading || 
                  files.length === 0 || 
                  !selectedCategory || 
                  files.some(f => f.compressing)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </>
                ) : files.some(f => f.compressing) ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    <span>Compressing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload {files.length} Files</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}