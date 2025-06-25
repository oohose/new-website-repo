'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { Category } from '@/lib/types'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSuccess: () => void
}

export default function EditCategoryModal({ 
  isOpen, 
  onClose, 
  category, 
  onSuccess 
}: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    key: category?.key || '',
    isPrivate: category?.isPrivate || false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        key: category.key,
        isPrivate: category.isPrivate
      })
      setErrors({})
    }
  }, [category])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain lowercase letters, numbers, and hyphens'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category || !validateForm()) return

    setIsLoading(true)

    try {
      console.log('Submitting form data:', formData)
      
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const result = await response.json()
        console.log('Update successful:', result)
        toast.success('Category updated successfully')
        onSuccess()
        onClose()
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: `HTTP ${response.status}: ${errorText || 'Unknown error'}` }
        }
        
        toast.error(error.error || 'Failed to update category')
        
        // Handle specific validation errors
        if (error.field) {
          setErrors({ [error.field]: error.error })
        }
      }
    } catch (error) {
      console.error('Network error updating category:', error)
      toast.error('Network error: Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Edit Category</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Enter category name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Optional description"
                disabled={isLoading}
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL Key *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.key 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="url-friendly-key"
                disabled={isLoading}
              />
              {errors.key && (
                <p className="mt-1 text-sm text-red-400">{errors.key}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Used in URLs: /gallery/{formData.key || 'your-key'}
              </p>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="flex items-center space-x-2 text-white font-medium">
                  {formData.isPrivate ? (
                    <EyeOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-400" />
                  )}
                  <span>Privacy Setting</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {formData.isPrivate 
                    ? 'Only visible to admins' 
                    : 'Visible to all visitors'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {/* Category Stats */}
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Images:</span>
                <span className="text-white font-medium">
                  {category._count?.images || 0}
                </span>
              </div>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Subcategories:</span>
                  <span className="text-white font-medium">
                    {category.subcategories.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}