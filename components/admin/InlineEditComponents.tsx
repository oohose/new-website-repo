'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, Plus, X, Save, EyeOff, AlertTriangle, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { Category } from '@/lib/types'

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: Partial<Category>) => Promise<void>
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteCategoryModal({ isOpen, onClose, category, onConfirm, isDeleting }: DeleteModalProps) {
  if (!isOpen || !category) return null

  const totalImages = (category._count?.images || 0) + 
    (category.subcategories?.reduce((sum, sub) => sum + (sub._count?.images || 0), 0) || 0)

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
              <h3 className="text-lg font-semibold text-white">Delete Category</h3>
              <p className="text-gray-400 text-sm">This action cannot be undone</p>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3 mb-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white">{category.name}</span>
              {category.isPrivate && <EyeOff className="w-4 h-4 text-red-400" />}
            </div>
            {category.description && (
              <p className="text-gray-300 text-sm mb-2">{category.description}</p>
            )}
            <div className="text-sm text-gray-400">
              <p>• {totalImages} images will be deleted</p>
              <p>• {category.subcategories?.length || 0} subcategories will be deleted</p>
              <p>• All images will be removed from Cloudinary storage</p>
            </div>
          </div>

          <p className="text-gray-300 mb-6">
            Are you sure you want to delete "<span className="font-medium text-white">{category.name}</span>" 
            and all its content? This will permanently remove everything from both your website and cloud storage.
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
                  <span>Delete Category</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function CategoryManager({ 
  categories, 
  onUpdate, 
  onDelete, 
  onCreate
}: CategoryManagerProps) {
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    category: null as Category | null
  })
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    category: null as Category | null,
    isDeleting: false
  })

  const handleEdit = (category: Category) => {
    setEditModalState({
      isOpen: true,
      category
    })
  }

  const handleCreate = () => {
    setEditModalState({
      isOpen: true,
      category: null
    })
  }

  const handleDeleteClick = (category: Category) => {
    setDeleteModalState({
      isOpen: true,
      category,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModalState.category) return

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }))
    
    try {
      await onDelete(deleteModalState.category.id)
      toast.success(`Category "${deleteModalState.category.name}" deleted successfully`)
      setDeleteModalState({ isOpen: false, category: null, isDeleting: false })
    } catch (error) {
      toast.error('Failed to delete category')
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleSave = async (id: string | null, data: Partial<Category>) => {
    if (id) {
      await onUpdate(id, data)
    } else {
      await onCreate(data)
    }
    setEditModalState({ isOpen: false, category: null })
  }

  const handleCloseModal = () => {
    setEditModalState({ isOpen: false, category: null })
  }

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Category Manager</h3>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

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
                  onDelete={handleDeleteClick}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalState.isOpen && (
          <CategoryEditModal
            isOpen={editModalState.isOpen}
            onClose={handleCloseModal}
            category={editModalState.category}
            categories={categories}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModalState.isOpen && (
          <DeleteCategoryModal
            isOpen={deleteModalState.isOpen}
            onClose={() => setDeleteModalState({ isOpen: false, category: null, isDeleting: false })}
            category={deleteModalState.category}
            onConfirm={handleDeleteConfirm}
            isDeleting={deleteModalState.isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  )
}

interface CategoryCardProps {
  category: Category
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (category: Category) => void
  onEdit: (category: Category) => void
}

function CategoryCard({ category, onUpdate, onDelete, onEdit }: CategoryCardProps) {
  const handleUpdate = async (field: string, value: any) => {
    await onUpdate(category.id, { [field]: value })
  }

  const totalImages = (category._count?.images || 0) + 
    (category.subcategories?.reduce((sum, sub) => sum + (sub._count?.images || 0), 0) || 0)

  return (
    <div className="bg-gray-600 rounded p-4 space-y-3 group hover:bg-gray-550 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-white">{category.name}</h5>
          <p className="text-gray-300 text-sm mt-1">
            {category.description || 'No description'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {category.isPrivate && (
            <EyeOff className="w-4 h-4 text-red-400" />
          )}
          
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              className="p-1 text-blue-400 hover:text-blue-300 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => onDelete(category)}
              className="p-1 text-red-400 hover:text-red-300 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {totalImages} total photos
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

// Category Edit Modal (reusing from previous component)
interface CategoryEditModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  categories: Category[]
  onSave: (id: string | null, data: Partial<Category>) => Promise<void>
}

function CategoryEditModal({ isOpen, onClose, category, categories, onSave }: CategoryEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    isPrivate: false,
    parentId: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        key: category.key,
        description: category.description || '',
        isPrivate: category.isPrivate,
        parentId: category.parentId || ''
      })
    } else {
      setFormData({
        name: '',
        key: '',
        description: '',
        isPrivate: false,
        parentId: ''
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(category?.id || null, {
        ...formData,
        parentId: formData.parentId || null,
        description: formData.description || null
      })

      toast.success(category ? 'Category updated successfully!' : 'Category created successfully!')
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  const availableParentCategories = categories.filter(cat => 
    !cat.parentId && (!category || cat.id !== category.id)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-gray-800 rounded-lg border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {category ? 'Edit Category' : 'Create Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="e.g., Wedding Photography"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              URL Key
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              className="form-input"
              placeholder="wedding-photography (auto-generated if empty)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Parent Category (Optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="form-select"
            >
              <option value="">None (Top-level category)</option>
              {availableParentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="form-textarea"
              placeholder="Describe this category..."
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="form-checkbox"
            />
            <label htmlFor="isPrivate" className="text-white text-sm">
              Private category (only visible to admins)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{category ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}