'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FolderPlus, 
  Image as ImageIcon, 
  Settings, 
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Home,
  LogOut,
  ExternalLink,
  X,
  Save,
  Check,
  Camera,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import { CategoryManager } from '@/components/admin/InlineEditComponents'
import AdminImageSync from '@/components/admin/AdminImageSync'
import ImageManager from '@/components/admin/ImageManager'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Category } from '@/lib/types'

interface AdminDashboardProps {
  children?: React.ReactNode
}

// Enhanced Navigation Header
function AdminHeader({ session }: { session: any }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">
              {siteConfig.name} - Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Portfolio</span>
            </Link>
            
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm">View Site</span>
            </Link>
            
            <span className="text-sm text-gray-400">
              Welcome, {session.user?.name || session.user?.email}
            </span>
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Category Picker Modal Component
interface CategoryPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (categoryId: string) => void
  categories: Category[]
  selectedCategoryId: string
}

function CategoryPickerModal({ isOpen, onClose, onSelect, categories, selectedCategoryId }: CategoryPickerModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

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
      <div key={category.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div
          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSelect(category.id)}
        >
          <div className="flex items-center space-x-3">
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
              <FolderOpen className="w-5 h-5 text-blue-400" />
            ) : (
              <FolderOpen className="w-5 h-5 text-gray-400" />
            )}
            
            <div className="flex-1">
              <p className="font-medium">{category.name}</p>
              {category.description && (
                <p className="text-xs opacity-75 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {category.isPrivate && (
              <EyeOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
              {category._count?.images || 0}
            </span>
          </div>
        </div>
        
        {hasSubcategories && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            {category.subcategories?.map(subcategory => 
              renderCategory(subcategory, level + 1)
            )}
          </motion.div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  const filteredCategories = categories
    .filter(cat => !cat.parentId)
    .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Select Category</h3>
              <p className="text-gray-400 text-sm">Choose where to upload your images</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filteredCategories.map(category => renderCategory(category))}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No categories found</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              {categories.length} categories available
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
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

// Simple Upload Component
interface SimpleUploadComponentProps {
  categories: Category[]
  onUploadComplete: () => void
}

function SimpleUploadComponent({ categories, onUploadComplete }: SimpleUploadComponentProps) {
  const [selectedFiles, setSelectedFiles] = useState<{
    id: string
    file: File
    preview: string
    title: string
    compressedFile?: File
    isCompressing?: boolean
  }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      )
      
      for (const file of files) {
        const fileId = Math.random().toString(36)
        const fileObj = {
          id: fileId,
          file,
          preview: URL.createObjectURL(file),
          title: file.name.replace(/\.[^/.]+$/, ''),
          isCompressing: file.size > 10 * 1024 * 1024
        }
        
        setSelectedFiles(prev => [...prev, fileObj])
        
        if (file.size > 10 * 1024 * 1024) {
          toast(`Compressing ${file.name}...`)
          try {
            const compressedFile = await compressImage(file, 9)
            toast.success(`${file.name} compressed`)
            
            setSelectedFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, compressedFile, isCompressing: false }
                : f
            ))
          } catch (error) {
            toast.error(`Failed to compress ${file.name}`)
            setSelectedFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, isCompressing: false }
                : f
            ))
          }
        }
      }
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setShowCategoryPicker(false)
  }

  const handleUpload = async () => {
    if (!selectedCategoryId || selectedFiles.length === 0) {
      toast.error('Please select a category and files')
      return
    }

    setIsUploading(true)
    let successCount = 0

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileObj = selectedFiles[i]
      const fileId = `file-${i}`
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        
        const formData = new FormData()
        const fileToUpload = fileObj.compressedFile || fileObj.file
        formData.append('file', fileToUpload)
        formData.append('title', fileObj.title)
        formData.append('categoryId', selectedCategoryId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
          successCount++
        } else {
          throw new Error('Upload failed')
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploadProgress(prev => ({ ...prev, [fileId]: -1 }))
      }
    }

    setIsUploading(false)
    
    if (successCount > 0) {
      toast.success(`${successCount} images uploaded successfully`)
      onUploadComplete()
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview))
      setSelectedFiles([])
      setUploadProgress({})
    }
  }

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Upload Images</h3>
          <p className="text-gray-400">Add new photos to your portfolio</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-6">
        <label className="block text-white font-semibold mb-4">Select Destination Category</label>
        
        {selectedCategory ? (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl border border-blue-500/30">
            <div className="flex items-center space-x-3">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">{selectedCategory.name}</p>
                <p className="text-blue-300 text-sm">{selectedCategory._count?.images || 0} images</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCategoryPicker(true)}
            className="w-full p-6 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl transition-all duration-200 group"
          >
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
              <p className="text-white font-medium mb-1">Choose Category</p>
              <p className="text-gray-400 text-sm">Click to select where to upload your images</p>
            </div>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-6">
        <label className="block text-white font-semibold mb-4">Select Images</label>
        
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-xl p-8 text-center transition-all duration-200 group">
            <Camera className="w-16 h-16 text-gray-400 group-hover:text-purple-400 mx-auto mb-4 transition-colors" />
            <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-gray-400 text-sm">Support: JPG, PNG, WebP • Files over 10MB will be automatically compressed</p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-white font-semibold">Selected Files ({selectedFiles.length})</h4>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedCategoryId || selectedFiles.length === 0 || isUploading || selectedFiles.some(f => f.isCompressing)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </>
              ) : selectedFiles.some(f => f.isCompressing) ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload {selectedFiles.length} Images</span>
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedFiles.map((fileObj, index) => (
              <div key={fileObj.id} className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-xl">
                <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src={fileObj.preview}
                    alt={fileObj.title}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={fileObj.title}
                    onChange={(e) => {
                      setSelectedFiles(prev => prev.map(f => 
                        f.id === fileObj.id ? { ...f, title: e.target.value } : f
                      ))
                    }}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-1 text-white text-sm mb-2"
                    placeholder="Image title"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {fileObj.compressedFile ? (
                        <>
                          <span className="line-through text-red-400">
                            {(fileObj.file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          {' → '}
                          <span className="text-green-400">
                            {(fileObj.compressedFile.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </>
                      ) : fileObj.isCompressing ? (
                        <span className="text-yellow-400">Compressing...</span>
                      ) : (
                        `${(fileObj.file.size / 1024 / 1024).toFixed(1)}MB`
                      )}
                    </span>
                    
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {uploadProgress[`file-${index}`] !== undefined && (
                    <div className="mt-2">
                      {uploadProgress[`file-${index}`] === 100 ? (
                        <div className="flex items-center text-green-400 text-sm">
                          <Check className="w-4 h-4 mr-1" />
                          Uploaded
                        </div>
                      ) : uploadProgress[`file-${index}`] === -1 ? (
                        <div className="flex items-center text-red-400 text-sm">
                          <X className="w-4 h-4 mr-1" />
                          Failed
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-400 text-sm">
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent mr-1" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CategoryPickerModal
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={handleCategorySelect}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />
    </div>
  )
}

// Main Component
export default function AdminDashboard({ children }: AdminDashboardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalImages: 0,
    totalCategories: 0,
    totalViews: 0,
    storageUsed: '0 MB'
  })
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.push('/admin/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      fetchCategories()
      fetchStats()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includePrivate=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'upload', label: 'Upload Photos', icon: Upload },
    { id: 'images', label: 'Manage Images', icon: ImageIcon },
    { id: 'categories', label: 'Categories', icon: FolderPlus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update category')
      setCategories(prev => 
        prev.map(cat => cat.id === id ? { ...cat, ...data } : cat)
      )
    } catch (error) {
      console.error('Update category error:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (error) {
      console.error('Delete category error:', error)
      throw error
    }
  }

  const createCategory = async (data: Partial<Category>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const result = await response.json()
      setCategories(prev => [...prev, result.category])
      return result.category
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={stats} />
      
      case 'upload':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Upload Photos</h2>
              <p className="text-gray-400 mb-8">Add new photos to your portfolio</p>
              
              <SimpleUploadComponent 
                categories={categories}
                onUploadComplete={() => {
                  fetchStats()
                  fetchCategories()
                }}
              />
            </div>
          </div>
        )

      case 'images':
        return (
          <div className="space-y-8">
            <ImageManager categories={categories} />
          </div>
        )
      
      case 'categories':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Manage Categories</h2>
              <p className="text-gray-400 mb-8">Create and organize your photo categories</p>
            </div>
            
            <CategoryManager
              categories={categories}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
              onCreate={createCategory}
            />
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Site Settings</h2>
              <p className="text-gray-400 mb-8">Configure your photography website</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Site Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        defaultValue={siteConfig.name}
                        className="form-input"
                        placeholder="Your site name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Description
                      </label>
                      <textarea
                        defaultValue={siteConfig.description}
                        className="form-textarea"
                        rows={3}
                        placeholder="Site description"
                      />
                    </div>
                    <button className="btn-primary">
                      Save Settings
                    </button>
                  </div>
                </div>

                <AdminImageSync />
              </div>
            </div>
          </div>
        )
      
      default:
        return <div className="text-white">Select a tab</div>
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader session={session} />

      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function AdminOverview({ stats }: { stats: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">Manage your photography portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          icon={ImageIcon}
          color="blue"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          icon={FolderPlus}
          color="green"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Storage Used"
          value={stats.storageUsed}
          icon={BarChart3}
          color="orange"
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            icon={Upload}
            title="Upload Photos"
            description="Add new photos to your portfolio"
            onClick={() => {}}
          />
          <QuickActionButton
            icon={FolderPlus}
            title="Create Category"
            description="Organize your work into categories"
            onClick={() => {}}
          />
          <QuickActionButton
            icon={Settings}
            title="Site Settings"
            description="Update your site configuration"
            onClick={() => {}}
          />
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon: Icon, title, description, onClick }: {
  icon: any
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-700 rounded-lg p-4 text-left hover:bg-gray-600 transition-colors"
    >
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5 text-blue-400" />
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  )
}