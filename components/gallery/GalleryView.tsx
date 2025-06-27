'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Edit, ExternalLink, Lock } from 'lucide-react'
import EditCategoryModal from '@/components/EditCategoryModal'
import { Category, Image as ImageType } from '@/lib/types'

interface DarkElegantGalleryViewProps {
  category: Category
  isAdmin: boolean
  onRefresh?: () => Promise<void>
}

interface SocialMediaLinksProps {
  socialLinks: {
    instagram?: string
    twitter?: string
    tiktok?: string
    youtube?: string
    linkedin?: string
    website?: string
  }
  className?: string
}

function SocialMediaLinks({ socialLinks, className = '' }: SocialMediaLinksProps) {
  // Helper function to format URLs
  const formatUrl = (platform: string, value: string): string => {
    if (!value) return ''
    
    // If it's already a full URL, return as is
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }
    
    // Handle @username format or just username
    const username = value.replace('@', '')
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`
      case 'twitter':
        return `https://twitter.com/${username}`
      case 'tiktok':
        return `https://tiktok.com/@${username}`
      case 'youtube':
        return `https://youtube.com/@${username}`
      case 'linkedin':
        return value.includes('linkedin.com') ? value : `https://linkedin.com/in/${username}`
      case 'website':
        return value.startsWith('www.') ? `https://${value}` : value
      default:
        return value
    }
  }

  // Define social media platforms with their icons and colors
  const platforms = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: '📷',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-600 hover:to-pink-600'
    },
    {
      key: 'twitter',
      label: 'Twitter',
      icon: '🐦',
      color: 'from-blue-400 to-blue-600',
      hoverColor: 'hover:from-blue-500 hover:to-blue-700'
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: '🎵',
      color: 'from-black to-gray-800',
      hoverColor: 'hover:from-gray-800 hover:to-black'
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: '📺',
      color: 'from-red-500 to-red-700',
      hoverColor: 'hover:from-red-600 hover:to-red-800'
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: '💼',
      color: 'from-blue-600 to-blue-800',
      hoverColor: 'hover:from-blue-700 hover:to-blue-900'
    },
    {
      key: 'website',
      label: 'Website',
      icon: '🌐',
      color: 'from-gray-600 to-gray-800',
      hoverColor: 'hover:from-gray-700 hover:to-gray-900'
    }
  ]

  // Filter platforms that have links
  const availableLinks = platforms.filter(platform => 
    socialLinks[platform.key as keyof typeof socialLinks]
  )

  if (availableLinks.length === 0) return null

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center justify-center space-x-2">
        <ExternalLink className="w-5 h-5" />
        <span>Connect</span>
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3">
        {availableLinks.map(platform => {
          const url = formatUrl(platform.key, socialLinks[platform.key as keyof typeof socialLinks] || '')
          
          return (
            <a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center space-x-2 px-4 py-2 rounded-full
                bg-gradient-to-r ${platform.color} ${platform.hoverColor}
                text-white text-sm font-medium
                transition-all duration-200 transform hover:scale-105
                shadow-lg hover:shadow-xl
              `}
            >
              <span>{platform.icon}</span>
              <span>{platform.label}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default function DarkElegantGalleryView({ category, isAdmin, onRefresh }: DarkElegantGalleryViewProps) {
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Check if this is a private gallery being accessed by non-admin
  const isPrivateDirectAccess = category.isPrivate && !isAdmin

  // FIXED: Simple Cloudinary URL function that doesn't crop
  const getOptimizedUrl = (image: ImageType, width?: number, forLightbox = false) => {
    if (!image.cloudinaryId) {
      // Fallback to url property if available, or placeholder
      return (image as any).url || '/placeholder-image.jpg'
    }
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      return (image as any).url || '/placeholder-image.jpg'
    }

    // For lightbox - optimized size for faster loading
    if (forLightbox) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,q_auto,f_auto/${image.cloudinaryId}`
    }

    // For gallery - just resize width, maintain aspect ratio
    if (width) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_auto,f_auto/${image.cloudinaryId}`
    }

    // Default - original with quality optimization
    return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${image.cloudinaryId}`
  }

  // Generate gradient colors for subcategories (same as Portfolio.tsx)
  const generateGradient = (name: string) => {
    const gradients = [
      'from-rose-400 to-pink-600',
      'from-blue-400 to-blue-600', 
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-600',
      'from-violet-400 to-purple-600',
      'from-cyan-400 to-blue-600',
      'from-pink-400 to-rose-600',
      'from-indigo-400 to-purple-600',
      'from-green-400 to-emerald-600',
      'from-yellow-400 to-amber-600'
    ]
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
  }

  const headerImage = category.images.find(img => (img as any).isHeader)
  const galleryImages = category.images.filter(img => !(img as any).isHeader)

  // Filter subcategories based on admin status
  const visibleSubcategories = category.subcategories?.filter(sub => 
    isAdmin || !sub.isPrivate
  ) || []

  const openLightbox = (image: ImageType, index: number) => {
    setSelectedImage(image)
    setCurrentImageIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % galleryImages.length
    setSelectedImage(galleryImages[nextIndex])
    setCurrentImageIndex(nextIndex)
  }

  const previousImage = () => {
    const prevIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
    setSelectedImage(galleryImages[prevIndex])
    setCurrentImageIndex(prevIndex)
  }

  // Edit category handlers
  const handleEditCategory = (categoryToEdit: Category) => {
    setEditingCategory(categoryToEdit)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    // Refresh the data and invalidate cache
    if (onRefresh) {
      await onRefresh()
    }
    
    // Also invalidate Next.js cache
    try {
      await fetch('/api/revalidate', { method: 'POST' })
    } catch (error) {
      console.error('Failed to revalidate cache:', error)
    }
    
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          e.preventDefault()
          previousImage()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextImage()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, currentImageIndex, galleryImages.length])

  // Preload adjacent images for instant navigation
  useEffect(() => {
    if (!selectedImage || galleryImages.length <= 1) return

    const preloadImage = (index: number) => {
      const img = new window.Image()
      img.src = getOptimizedUrl(galleryImages[index], 1200, true)
    }

    // Preload next and previous images
    const nextIndex = (currentImageIndex + 1) % galleryImages.length
    const prevIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1
    
    preloadImage(nextIndex)
    preloadImage(prevIndex)
  }, [selectedImage, currentImageIndex, galleryImages])

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        {/* Header Section */}
        <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Background with subtle pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          
          {/* Background Image (if header image exists) */}
          {headerImage && (
            <div className="absolute inset-0 opacity-10">
              <Image
                src={getOptimizedUrl(headerImage, 1920)}
                alt={category.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto pt-40 sm:pt-52">
            {/* Navigation Buttons - Centered above content */}
            <div className="flex flex-col items-center space-y-4 mb-12">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link
                  href="/#portfolio"
                  className="inline-flex items-center space-x-3 text-white/70 hover:text-white transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                  </div>
                  <span className="font-light tracking-wide">Back to Portfolio</span>
                </Link>
              </motion.div>

              {/* Edit Button (Admin Only) */}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="group inline-flex items-center space-x-3 text-white/70 hover:text-white transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                      <Edit className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                    </div>
                    <span className="font-light tracking-wide">Edit Category</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Main Content */}
            <HeaderContent category={category} isAdmin={isAdmin} isPrivateDirectAccess={isPrivateDirectAccess} />
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="flex flex-col items-center space-y-3 text-white/50">
              <span className="text-sm font-light tracking-wide">Scroll to view gallery</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-6 h-10 border border-white/30 rounded-full flex justify-center"
              >
                <div className="w-1 h-3 bg-white/30 rounded-full mt-2"></div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Gallery Section */}
        <div className="relative bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {galleryImages.length > 0 ? (
              <>
                {/* Section Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl md:text-4xl font-light text-white mb-4 tracking-tight">
                    Gallery
                  </h2>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </motion.div>

                {/* Image Grid - Masonry layout */}
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                  {galleryImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="group cursor-pointer break-inside-avoid mb-6"
                      onClick={() => openLightbox(image, index)}
                    >
                      <div className="relative overflow-hidden rounded-lg bg-gray-800 border border-gray-700/50">
                        <div className="relative">
                          <img
                            src={getOptimizedUrl(image, 400)}
                            alt=""
                            className="w-full h-auto transition-all duration-700 group-hover:scale-105 rounded-lg"
                            loading="lazy"
                          />
                        </div>
                        
                        {/* Simple hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 rounded-lg" />
                        
                        {/* Hover Border Effect */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-colors duration-500 rounded-lg" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-2xl text-white/70 mb-4 font-light">No Images Yet</h3>
                <p className="text-white/50">
                  {isAdmin
                    ? "Upload some images to this category to get started!"
                    : "Check back soon for new photos!"}
                </p>
              </div>
            )}

            {/* Subcategories Section */}
            {visibleSubcategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mt-24"
              >
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-light text-white mb-4 tracking-tight">
                    More from this collection
                  </h2>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
                
                {/* Subcategories Grid with Edit Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {visibleSubcategories.map((subcategory, index) => {
                    const recentImage = subcategory.images?.[0]
                    const gradientClass = generateGradient(subcategory.name)

                    return (
                      <motion.div
                        key={subcategory.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative"
                      >
                        {/* Edit Button for Subcategories */}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditCategory(subcategory)
                            }}
                            className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Edit Subcategory"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <Link href={`/gallery/${subcategory.key}`} className="block">
                          <div className="relative aspect-[5/4] overflow-hidden bg-gray-700 mb-4 rounded-xl shadow-lg">
                            {/* Background Image or Gradient */}
                            {recentImage ? (
                              <Image
                                src={getOptimizedUrl(recentImage, 600)}
                                alt={subcategory.name}
                                fill
                                className="object-cover transition-all duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
                            )}
                            
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-black/70 group-hover:bg-black/50 transition-opacity duration-500" />
                            
                            {/* Privacy indicator */}
                            {isAdmin && subcategory.isPrivate && (
                              <div className="absolute top-3 left-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full">
                                Private
                              </div>
                            )}

                            {/* Category Name */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
                              <h3 className="text-2xl md:text-3xl font-light text-white drop-shadow-lg leading-tight mb-2">
                                {subcategory.name}
                              </h3>
                              
                              {/* Hover Button */}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              >
                                <span className="text-white text-sm font-light">View Gallery →</span>
                              </motion.div>
                            </div>

                            {/* Bottom Info */}
                            <div className="absolute bottom-4 left-4 right-4 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                              <div className="flex items-center justify-between text-white/80">
                                <span className="text-sm">
                                  {subcategory._count?.images || 0} {(subcategory._count?.images || 0) === 1 ? 'image' : 'images'}
                                </span>
                                <span className="text-sm">
                                  Tap to view →
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Content Below Image */}
                          <div className="space-y-1">          
                            {subcategory.description && (
                              <p className="text-gray-400 text-xs leading-relaxed line-clamp-1 text-center">
                                {subcategory.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <EditCategoryModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          category={editingCategory}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Lightbox Modal - Custom Full Screen Implementation */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="fixed top-4 right-4 md:top-6 md:right-6 z-50 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-all duration-200 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Keyboard Navigation Hint */}
              <div className="fixed top-4 left-4 md:top-6 md:left-6 z-20 text-white/60 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full border border-white/10">
                ← → to navigate • ESC to close
              </div>

              {/* Image Container */}
              <motion.div
                key={selectedImage.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Navigation Buttons - POSITIONED OUTSIDE IMAGE EDGES */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        previousImage()
                      }}
                      className="absolute -left-16 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-all duration-200 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      className="absolute -right-16 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-all duration-200 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <img
                  key={selectedImage.id}
                  src={getOptimizedUrl(selectedImage, 1200, true)}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{ 
                    maxWidth: '90vw', 
                    maxHeight: '90vh',
                    width: 'auto',
                    height: 'auto'
                  }}
                  loading="eager"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Separate component for header content with social media integration
function HeaderContent({ category, isAdmin, isPrivateDirectAccess }: { 
  category: Category, 
  isAdmin: boolean,
  isPrivateDirectAccess: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="space-y-8"
    >
      {/* Category Title */}
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white tracking-tight leading-none">
          {category.name}
        </h1>
        
        {/* Decorative Line */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
      </div>

      {/* Description */}
      {category.description && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="border border-white/20 rounded-lg p-6 backdrop-blur-sm bg-white/5">
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light">
              {category.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Social Media Links */}
      {(category as any).socialLinks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <SocialMediaLinks socialLinks={(category as any).socialLinks} />
        </motion.div>
      )}

      {/* Stats with Private Gallery Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="flex flex-col items-center justify-center space-y-4"
      >
        {/* Image Count */}
        <span className="text-white/60 font-light tracking-wide">
          {category._count.images} {category._count.images === 1 ? 'image' : 'images'} in this collection
        </span>
        
        {/* Privacy Indicators */}
        <div className="flex items-center justify-center space-x-4">
          {/* Admin Private Gallery Badge */}
          {isAdmin && category.isPrivate && (
            <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30 flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>Private Gallery</span>
            </span>
          )}
          
          {/* Subtle Private Access Indicator for Non-Admin */}
          {isPrivateDirectAccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="px-4 py-2 bg-amber-900/30 text-amber-200/80 rounded-full text-sm border border-amber-700/40 flex items-center space-x-2 backdrop-blur-sm"
            >
              <Lock className="w-3 h-3" />
              <span>Private Collection</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}