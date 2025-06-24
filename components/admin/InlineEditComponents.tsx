'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  parentId?: string | null
  images: any[]
  subcategories: any[]
  _count: { images: number }
}

interface EditableTextProps {
  value: string
  onSave: (value: string) => Promise<void>
  onDelete?: () => Promise<void>
  multiline?: boolean
  placeholder?: string
  className?: string
  children: React.ReactNode
}

export function EditableText({ 
  value, 
  onSave, 
  onDelete, 
  multiline = false, 
  placeholder = "Enter text...",
  className = "",
  children 
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
      toast.success('Updated successfully!')
    } catch (error) {
      toast.error('Failed to update')
      setEditValue(value) // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this?')) return

    setIsLoading(true)
    try {
      await onDelete()
      toast.success('Deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="w-3 h-3" />
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 bg-black/60 rounded text-white/80 hover:text-white"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: Partial<Category>) => Promise<void>
}

export function CategoryManager({ categories, onUpdate, onDelete, onCreate }: CategoryManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    key: '',
    description: '',
    isPrivate: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsLoading(true)
    try {
      const key = newCategory.key.trim() || newCategory.name.toLowerCase().replace(/\s+/g, '-')
      
      await onCreate({
        name: newCategory.name.trim(),
        key,
        description: newCategory.description.trim() || null,
        isPrivate: newCategory.isPrivate
      })
      
      // Reset form
      setNewCategory({ name: '', key: '', description: '', isPrivate: false })
      setShowCreateForm(false)
      toast.success('Category created successfully!')
    } catch (error) {
      toast.error('Failed to create category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Category Manager</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-700 rounded p-4 space-y-4"
          >
            <h4 className="font-medium text-white">Create New Category</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Wedding Photography"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  URL Key (optional)
                </label>
                <input
                  type="text"
                  value={newCategory.key}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="wedding-photography"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this category..."
                rows={3}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newCategory.isPrivate}
                onChange={(e) => setNewCategory(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="form-checkbox text-blue-500"
              />
              <label htmlFor="isPrivate" className="text-white text-sm">
                Private category (only visible to admins)
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreate}
                disabled={isLoading || !newCategory.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Category'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      <div className="space-y-4">
        <h4 className="font-medium text-white">Existing Categories ({categories.length})</h4>
        
        {categories.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No categories yet. Create your first category to get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CategoryCardProps {
  category: Category
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function CategoryCard({ category, onUpdate, onDelete }: CategoryCardProps) {
  const handleUpdate = async (field: string, value: any) => {
    await onUpdate(category.id, { [field]: value })
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${category.name}"? This will also delete all photos in this category.`)) {
      await onDelete(category.id)
    }
  }

  return (
    <div className="bg-gray-600 rounded p-4 space-y-3">
      <div className="flex items-start justify-between">
        <EditableText
          value={category.name}
          onSave={async (value) => await handleUpdate('name', value)}
        >
          <h5 className="font-medium text-white">{category.name}</h5>
        </EditableText>
        
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <EditableText
        value={category.description || ''}
        onSave={async (value) => await handleUpdate('description', value)}
        multiline
        placeholder="Add a description..."
      >
        <p className="text-gray-300 text-sm">
          {category.description || 'No description'}
        </p>
      </EditableText>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {category._count?.images || 0} photos
        </span>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={category.isPrivate}
            onChange={async (e) => await handleUpdate('isPrivate', e.target.checked)}
            className="form-checkbox text-blue-500"
          />
          <span className="text-gray-300">Private</span>
        </label>
      </div>
      
      <div className="text-xs text-gray-500">
        URL: /gallery/{category.key}
      </div>
    </div>
  )
}