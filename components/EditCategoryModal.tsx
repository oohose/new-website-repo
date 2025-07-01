'use client'

import { useState, useEffect } from 'react'
import { Edit2, Trash2, Plus, X, Save, EyeOff, AlertTriangle, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import ModalWrapper from '@/components/ui/ModalWrapper'
import { Category } from '@/lib/types'

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: Partial<Category>) => Promise<Category>
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteCategoryModal({ isOpen, onClose, category, onConfirm, isDeleting }: DeleteModalProps) {
  if (!category) return null

  const totalImages = (category._count?.images || 0) + 
    (category.subcategories?.reduce((sum, sub) => sum + (sub._count?.images || 0), 0) || 0)

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
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
    </ModalWrapper>
  )
}

// Separate EditCategoryModal component that matches the expected interface from other files
interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSuccess: () => Promise<void>
}

function EditCategoryModal({ isOpen, onClose, category, onSuccess }: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    key: category?.key || '',
    description: category?.description || '',
    isPrivate: category?.isPrivate || false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        key: category.key,
        description: category.description || '',
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
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Category updated successfully')
        await onSuccess()
        onClose()
      } else {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: `HTTP ${response.status}: ${errorText || 'Unknown error'}` }
        }
        
        toast.error(error.error || 'Failed to update category')
        
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
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!category) return null

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
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

        <div className="p-6 space-y-4">
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

          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <div className="flex items-center space-x-2 text-white font-medium">
                {formData.isPrivate ? (
                  <EyeOff className="w-4 h-4 text-red-400" />
                ) : (
                  <FolderOpen className="w-4 h-4 text-green-400" />
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

          {category && (
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
          )}
        </div>

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
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    </ModalWrapper>
  )
}

// Export EditCategoryModal as the default export and CategoryManager as named export
export { CategoryManager }
export default EditCategoryModal

function CategoryManager({ 
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

  // Debug: Log what we're receiving
  console.log('🎯 CategoryManager received categories:', categories.length, categories)

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
    try {
      if (id) {
        await onUpdate(id, data)
        toast.success('Category updated successfully!')
      } else {
        await onCreate(data)
        toast.success('Category created successfully!')
      }
      setEditModalState({ isOpen: false, category: null })
    } catch (error) {
      toast.error(id ? 'Failed to update category' : 'Failed to create category')
      console.error('Error saving category:', error)
    }
  }

  const handleCloseModal = () => {
    setEditModalState({ isOpen: false, category: null })
  }

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">
            Category Manager 
            <span className="text-gray-400 text-sm font-normal ml-2">
              ({categories.length} total)
            </span>
          </h3>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <CategoryEditModal
        isOpen={editModalState.isOpen}
        onClose={handleCloseModal}
        category={editModalState.category}
        categories={categories}
        onSave={handleSave}
      />

      {/* Delete Modal */}
      <DeleteCategoryModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, category: null, isDeleting: false })}
        category={deleteModalState.category}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteModalState.isDeleting}
      />
    </>
  )
}

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isSubcategory = !!category.parentId
  
  return (
    <div className="bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200">
      <div className="p-4">
        {/* Header Row - Title and Privacy */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Show if it's a subcategory */}
            {isSubcategory && (
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
            )}
            
            <h3 className="text-white font-medium text-lg truncate">
              {isSubcategory ? `└─ ${category.name}` : category.name}
            </h3>
            
            {/* Private indicator next to title */}
            {category.isPrivate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                <EyeOff className="w-3 h-3 mr-1" />
                Private
              </span>
            )}
          </div>
          
          {/* Always visible action buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => onEdit(category)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-md hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => onDelete(category)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        {/* Details Row */}
        <div className="space-y-2">
          {category.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Key: <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">{category.key}</code></span>
              <span>{category._count?.images || 0} images</span>
              {/* Show parent info for subcategories */}
              {isSubcategory && category.parent && (
                <span className="text-blue-400">Parent: {category.parent.name}</span>
              )}
              {/* Show subcategory count for parent categories */}
              {!isSubcategory && category._count?.subcategories && category._count.subcategories > 0 && (
                <span className="text-green-400">{category._count.subcategories} subcategories</span>
              )}
            </div>
            <span className="text-xs">
              {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'Unknown date'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CategoryTreeItemProps {
  category: Category
  isExpanded: boolean
  onToggleExpanded: () => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function CategoryTreeItem({ 
  category, 
  isExpanded, 
  onToggleExpanded, 
  onEdit, 
  onDelete
}: CategoryTreeItemProps) {
  const hasSubcategories = category.subcategories && category.subcategories.length > 0

  return (
    <div className="space-y-2">
      {/* Main Category */}
      <div className="bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Expand/Collapse Button */}
              {hasSubcategories ? (
                <button
                  onClick={onToggleExpanded}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6" /> // Spacer for alignment
              )}
              
              {/* Category Name and Privacy */}
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h3 className="text-white font-medium text-lg truncate">
                  {category.name}
                </h3>
                {category.isPrivate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Private
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => onEdit(category)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-md hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => onDelete(category)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>

          {/* Category Details */}
          <div className="mt-3 space-y-2">
            {category.description && (
              <p className="text-gray-300 text-sm line-clamp-2">
                {category.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Key: <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">{category.key}</code></span>
                <span>{category._count?.images || 0} images</span>
                {hasSubcategories && (
                  <span>{category.subcategories!.length} subcategories</span>
                )}
              </div>
              <span className="text-xs">
                {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'Unknown date'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {hasSubcategories && isExpanded && (
        <div className="ml-6 space-y-2">
          {category.subcategories!.map((subcategory) => (
            <div key={subcategory.id} className="bg-gray-700/30 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">
                        {subcategory.name}
                      </h4>
                      {subcategory.isPrivate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onEdit(subcategory)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(subcategory)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {subcategory.description && (
                    <p className="text-gray-400 text-sm line-clamp-1">
                      {subcategory.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>Key: <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">{subcategory.key}</code></span>
                      <span>{subcategory._count?.images || 0} images</span>
                    </div>
                    <span>
                      {subcategory.createdAt ? new Date(subcategory.createdAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Category Edit Modal
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
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    setErrors({})
  }, [category])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }

    if (formData.key && !/^[a-z0-9-]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain lowercase letters, numbers, and hyphens'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      await onSave(category?.id || null, {
        ...formData,
        parentId: formData.parentId || null,
        description: formData.description || null
      })
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      // Error handling is done in the parent component
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

  const availableParentCategories = categories.filter(cat => 
    !cat.parentId && (!category || cat.id !== category.id)
  )

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
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
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
              errors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-600 focus:ring-blue-500'
            }`}
            placeholder="e.g., Wedding Photography"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL Key
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
            placeholder="wedding-photography (auto-generated if empty)"
            disabled={isLoading}
          />
          {errors.key && (
            <p className="mt-1 text-sm text-red-400">{errors.key}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Used in URLs: /gallery/{formData.key || 'your-key'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Parent Category (Optional)
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => handleInputChange('parentId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">None (Top-level category)</option>
            {availableParentCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe this category..."
            disabled={isLoading}
          />
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
          <div>
            <div className="flex items-center space-x-2 text-white font-medium">
              {formData.isPrivate ? (
                <EyeOff className="w-4 h-4 text-red-400" />
              ) : (
                <FolderOpen className="w-4 h-4 text-green-400" />
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

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    </ModalWrapper>
  )
}