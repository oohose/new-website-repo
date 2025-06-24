'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadedFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
  publicId?: string
  url?: string
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
  const [categories, setCategories] = useState([]) // Will be populated from API

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false
    }))
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

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
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'photography')
    formData.append('folder', `photography/${selectedCategory || 'uncategorized'}`)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Upload failed')
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
          publicId: result.public_id,
          url: result.secure_url,
          originalFilename: result.original_filename,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          categoryId: selectedCategory,
          tags: result.tags || []
        }))
      })
    })

    if (!response.ok) {
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
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i] = {
              ...newFiles[i],
              uploading: false,
              uploaded: false,
              error: 'Upload failed'
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
      console.error('Upload error:', error)
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
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-select"
          required
        >
          <option value="">Choose a category...</option>
          <option value="wedding">Wedding</option>
          <option value="portrait">Portrait</option>
          <option value="corporate">Corporate</option>
          <option value="family">Family</option>
          <option value="event">Event</option>
        </select>
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
                      {file.uploading && (
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <div className="w-4 h-4 spinner" />
                        </div>
                      )}
                      {file.uploaded && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      {file.error && (
                        <div className="bg-red-500 text-white rounded-full p-1">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {file.file.name}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={clearAll}
                className="btn-ghost"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !selectedCategory}
                className="btn-primary flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 spinner" />
                    <span>Uploading...</span>
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