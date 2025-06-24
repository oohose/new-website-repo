'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, ArrowRight } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { EditableText, CategoryManager } from '@/components/admin/InlineEditComponents'
import toast from 'react-hot-toast'

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  images: any[]
  subcategories: any[]
  _count: { images: number }
}

interface PortfolioProps {
  categories: Category[]
  recentImages: any[]
}

export default function Portfolio({ categories, recentImages }: PortfolioProps) {
  const [mounted, setMounted] = useState(false)
  const [categoriesList, setCategoriesList] = useState(categories)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    setCategoriesList(categories)
  }, [categories])

  const isAdmin = session?.user?.role === 'ADMIN'

  // API functions for category management
  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update category')

      // Update local state
      setCategoriesList(prev => 
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

      // Remove from local state
      setCategoriesList(prev => prev.filter(cat => cat.id !== id))
    } catch (error) {
      console.error('Delete category error:', error)
      throw error
    }
  }

  const createCategory = async (data: Omit<Category, 'id'>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create category')

      const result = await response.json()
      
      // Add to local state
      setCategoriesList(prev => [...prev, result.category])
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  if (!mounted) {
    return <div className="h-96 bg-gray-900 animate-pulse" />
  }

  // Filter to only show top-level categories (no parent) and handle admin vs public view
  const topLevelCategories = categoriesList
    .filter(cat => !cat.parentId && (isAdmin || !cat.isPrivate))

  // Calculate total images for each category (including subcategories)
  const categoriesWithTotals = topLevelCategories.map(category => {
    const subcategoryImages = category.subcategories?.reduce(
      (total, sub) => total + sub._count.images,
      0
    ) || 0
    const totalImages = category._count.images + subcategoryImages

    // Get most recent image for background
    const allCategoryImages = [
      ...(category.images || []),
      ...(category.subcategories?.flatMap(sub => sub.images || []) || [])
    ]
    const recentImage = allCategoryImages
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    return {
      ...category,
      totalImages,
      recentImage
    }
  }).filter(cat => cat.totalImages > 0) // Only show categories with images

  return (
    <section id="portfolio" className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white gradient-text">
              Portfolio
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="btn-primary text-sm"
              >
                {showCategoryManager ? 'Hide Manager' : 'Manage Categories'}
              </button>
            )}
          </div>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Explore my diverse collection of photography work across different styles and occasions
          </p>
        </motion.div>

        {/* Category Manager (Admin Only) */}
        {isAdmin && showCategoryManager && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12"
          >
            <CategoryManager
              categories={categoriesList}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
              onCreate={createCategory}
            />
          </motion.div>
        )}

        {/* Portfolio Grid */}
        {categoriesWithTotals.length > 0 ? (
          <div className="gallery-grid">
            {categoriesWithTotals.map((category, index) => (
              <PortfolioCard
                key={category.id}
                category={category}
                index={index}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center py-20"
          >
            <h3 className="text-2xl text-white/70 mb-4">No Galleries Available</h3>
            <p className="text-white/50">
              {isAdmin 
                ? "Create your first category to get started!" 
                : "Check back soon for new photo galleries!"
              }
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}

interface PortfolioCardProps {
  category: any
  index: number
  onUpdate: (id: string, data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isAdmin: boolean
}

function PortfolioCard({ 
  category, 
  index, 
  onUpdate, 
  onDelete,
  isAdmin 
}: PortfolioCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleCategoryUpdate = async (field: string, value: any) => {
    await onUpdate(category.id, { [field]: value })
  }

  const handleCategoryDelete = async () => {
    await onDelete(category.id)
  }

  // Generate gradient colors based on category name
  const generateGradient = (name: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
    ]
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const gradientClass = generateGradient(category.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <Link href={`/gallery/${category.key}`}>
        <div
          className="category-card group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Background Image or Gradient */}
          <div className="relative w-full h-80 lg:h-96 overflow-hidden rounded-xl">
            {category.recentImage && !imageError ? (
              <Image
                src={getThumbnailUrl(category.recentImage.publicId, 800, 600)}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index < 3}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradientClass} opacity-80`} />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
              {/* Hover Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0,
                  scale: isHovered ? 1 : 0.8
                }}
                transition={{ duration: 0.2 }}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-3"
              >
                <Eye className="w-5 h-5 text-white" />
              </motion.div>

              {/* Category Info */}
              <div className="space-y-2">
                {/* Editable Category Name */}
                {isAdmin ? (
                  <EditableText
                    value={category.name}
                    onSave={async (value) => await handleCategoryUpdate('name', value)}
                    onDelete={handleCategoryDelete}
                    className="mb-2"
                  >
                    <h3 className="text-2xl lg:text-3xl font-light text-white group-hover:text-white/90 transition-colors">
                      {category.name}
                    </h3>
                  </EditableText>
                ) : (
                  <h3 className="text-2xl lg:text-3xl font-light text-white group-hover:text-white/90 transition-colors">
                    {category.name}
                  </h3>
                )}
                
                {/* Editable Description */}
                {isAdmin ? (
                  <EditableText
                    value={category.description || ''}
                    onSave={async (value) => await handleCategoryUpdate('description', value)}
                    multiline
                    placeholder="Add a description..."
                  >
                    {category.description && (
                      <p className="text-white/80 text-sm lg:text-base line-clamp-2 group-hover:text-white/70 transition-colors">
                        {category.description}
                      </p>
                    )}
                  </EditableText>
                ) : (
                  category.description && (
                    <p className="text-white/80 text-sm lg:text-base line-clamp-2 group-hover:text-white/70 transition-colors">
                      {category.description}
                    </p>
                  )
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-white/60 text-sm">
                      {category.totalImages} {category.totalImages === 1 ? 'photo' : 'photos'}
                    </span>
                    
                    {/* Privacy indicator for admin */}
                    {isAdmin && category.isPrivate && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        Private
                      </span>
                    )}
                  </div>
                  
                  <motion.div
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center text-white/80 text-sm"
                  >
                    <span className="mr-2">View Gallery</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Admin Controls Outside the Link */}
      {isAdmin && (
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <label className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded px-3 py-1">
            <input
              type="checkbox"
              checked={category.isPrivate}
              onChange={async (e) => {
                e.stopPropagation()
                await handleCategoryUpdate('isPrivate', e.target.checked)
              }}
              className="form-checkbox text-blue-500"
            />
            <span className="text-white text-sm">Private</span>
          </label>
        </div>
      )}
    </motion.div>
  )
}

// Helper function for Cloudinary thumbnails
function getThumbnailUrl(publicId: string, width: number, height: number): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`
}