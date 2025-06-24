'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit, Save, X, Trash2, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

// Inline Edit Button Component
interface InlineEditButtonProps {
  onEdit: () => void
  onDelete?: () => void
  className?: string
}

export function InlineEditButton({ onEdit, onDelete, className = '' }: InlineEditButtonProps) {
  const { data: session } = useSession()
  
  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className={`inline-edit-buttons ${className}`}>
      <button
        onClick={onEdit}
        className="inline-edit-btn edit"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="inline-edit-btn delete"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Inline Text Editor
interface InlineTextEditorProps {
  initialValue: string
  onSave: (value: string) => Promise<void>
  onCancel: () => void
  multiline?: boolean
  placeholder?: string
}

export function InlineTextEditor({ 
  initialValue, 
  onSave, 
  onCancel, 
  multiline = false,
  placeholder = 'Enter text...'
}: InlineTextEditorProps) {
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (value.trim() === '') {
      toast.error('Value cannot be empty')
      return
    }

    setSaving(true)
    try {
      await onSave(value.trim())
      toast.success('Saved successfully')
    } catch (error) {
      toast.error('Failed to save')
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="inline-edit-form"
    >
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="inline-edit-input multiline"
          rows={3}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="inline-edit-input"
          autoFocus
        />
      )}
      
      <div className="inline-edit-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-edit-btn save"
        >
          {saving ? (
            <div className="w-4 h-4 spinner" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-edit-btn cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Editable Text Component
interface EditableTextProps {
  value: string
  onSave: (value: string) => Promise<void>
  onDelete?: () => Promise<void>
  multiline?: boolean
  placeholder?: string
  className?: string
  children?: React.ReactNode
}

export function EditableText({ 
  value, 
  onSave, 
  onDelete,
  multiline = false,
  placeholder,
  className = '',
  children
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { data: session } = useSession()

  const handleSave = async (newValue: string) => {
    await onSave(newValue)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (onDelete && confirm('Are you sure you want to delete this?')) {
      try {
        await onDelete()
        toast.success('Deleted successfully')
      } catch (error) {
        toast.error('Failed to delete')
        console.error('Delete error:', error)
      }
    }
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className={`editable-text-container ${className}`}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <InlineTextEditor
            key="editor"
            initialValue={value}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            multiline={multiline}
            placeholder={placeholder}
          />
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="editable-text-display"
          >
            {children || (
              <span className={value ? '' : 'text-gray-400 italic'}>
                {value || placeholder || 'Click to edit...'}
              </span>
            )}
            
            {isAdmin && (
              <InlineEditButton
                onEdit={() => setIsEditing(true)}
                onDelete={onDelete ? handleDelete : undefined}
                className="editable-text-buttons"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Category Manager Component
interface Category {
  id: string
  name: string
  description?: string
  isPrivate: boolean
}

interface CategoryManagerProps {
  categories: Category[]
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate: (data: Omit<Category, 'id'>) => Promise<void>
}

export function CategoryManager({ 
  categories, 
  onUpdate, 
  onDelete, 
  onCreate 
}: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    isPrivate: false
  })

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      await onCreate(newCategory)
      setNewCategory({ name: '', description: '', isPrivate: false })
      setIsCreating(false)
      toast.success('Category created successfully')
    } catch (error) {
      toast.error('Failed to create category')
      console.error('Create error:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Categories</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Create New Category Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <h4 className="text-lg font-medium text-white mb-4">Create New Category</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., Wedding Photography"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="Brief description of this category..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newCategory.isPrivate}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="form-checkbox"
                />
                <label htmlFor="isPrivate" className="text-sm text-white">
                  Private category (hidden from public)
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleCreate}
                  className="btn-primary"
                >
                  Create Category
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <EditableText
                  value={category.name}
                  onSave={async (value) => await onUpdate(category.id, { name: value })}
                  onDelete={async () => await onDelete(category.id)}
                  className="mb-2"
                >
                  <h4 className="text-lg font-medium text-white">{category.name}</h4>
                </EditableText>

                <EditableText
                  value={category.description || ''}
                  onSave={async (value) => await onUpdate(category.id, { description: value })}
                  multiline
                  placeholder="Add a description..."
                >
                  <p className="text-gray-400 text-sm">
                    {category.description || 'No description'}
                  </p>
                </EditableText>
              </div>

              <div className="flex items-center space-x-4 ml-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={category.isPrivate}
                    onChange={async (e) => await onUpdate(category.id, { isPrivate: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="text-sm text-gray-400">Private</span>
                </label>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// CSS Styles (add to your globals.css)
export const inlineEditStyles = `
  .inline-edit-buttons {
    @apply opacity-0 group-hover:opacity-100 transition-opacity duration-200;
  }

  .inline-edit-btn {
    @apply p-2 rounded-full transition-colors duration-200;
  }

  .inline-edit-btn.edit {
    @apply bg-blue-500 hover:bg-blue-600 text-white;
  }

  .inline-edit-btn.delete {
    @apply bg-red-500 hover:bg-red-600 text-white;
  }

  .inline-edit-btn.save {
    @apply bg-green-500 hover:bg-green-600 text-white;
  }

  .inline-edit-btn.cancel {
    @apply bg-gray-500 hover:bg-gray-600 text-white;
  }

  .inline-edit-form {
    @apply bg-gray-800 border border-gray-600 rounded-lg p-3 space-y-3;
  }

  .inline-edit-input {
    @apply w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500;
  }

  .inline-edit-input.multiline {
    @apply resize-none;
  }

  .inline-edit-actions {
    @apply flex space-x-2;
  }

  .editable-text-container {
    @apply group relative;
  }

  .editable-text-display {
    @apply relative;
  }

  .editable-text-buttons {
    @apply absolute -top-2 -right-2 flex space-x-1;
  }

  .form-input {
    @apply w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500;
  }

  .form-textarea {
    @apply w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none;
  }

  .form-select {
    @apply w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500;
  }

  .form-checkbox {
    @apply bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500 focus:ring-2;
  }

  .btn-primary {
    @apply bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-ghost {
    @apply border border-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors duration-200;
  }

  .spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-500;
  }
`