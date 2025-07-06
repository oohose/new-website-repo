'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Edit, Settings, Play } from 'lucide-react'
import { Category } from '@/lib/types'
import { useAuthCache } from '@/lib/hooks/useAuthCache'
import EditCategoryModal from '@/components/EditCategoryModal'

// Client-safe thumbnail function for images
function getClientThumbnailUrl(cloudinaryId: string, width: number, height: number): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !cloudinaryId) {
    return '/placeholder-image.jpg'
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${cloudinaryId}`
}

// Client-safe thumbnail function for videos
function getClientVideoThumbnailUrl(cloudinaryId: string, width: number, height: number): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !cloudinaryId) {
    return '/placeholder-video.jpg'
  }
  return `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,w_${width},h_${height},so_1,f_jpg,q_auto/${cloudinaryId}`
}

interface PortfolioProps {
  categories: Category[]
  onRefresh?: () => Promise<void>
}

export default function ModernPortfolio({ categories, onRefresh }: PortfolioProps) {
  const [mounted, setMounted] = useState(false)
  const [categoriesList, setCategoriesList] = useState(categories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: session } = useSession()
  
  const { isAdmin, forceRefresh } = useAuthCache()

  // ✅ Additional admin check using session data as fallback
  const isUserAdmin = isAdmin || session?.user?.role === 'ADMIN'

  // Debug logging
  useEffect(() => {
    console.log('Portfolio Admin Check:', {
      isAdmin,
      sessionRole: session?.user?.role,
      finalAdminStatus: isUserAdmin,
      sessionUser: session?.user
    })
  }, [isAdmin, session, isUserAdmin])

  // ✅ Update categories whenever the prop changes
  useEffect(() => {
    setMounted(true)
    setCategoriesList(categories)
    
    // Debug logging for categories with video support
    console.log('📊 Portfolio Categories Debug (with videos):', {
      totalCategories: categories.length,
      privateCategories: categories.filter(cat => cat.isPrivate).length,
      publicCategories: categories.filter(cat => !cat.isPrivate).length,
      topLevelCategories: categories.filter(cat => !cat.parentId).length,
      allCategories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        isPrivate: cat.isPrivate,
        parentId: cat.parentId,
        imageCount: cat._count?.images || 0,
        videoCount: cat._count?.videos || 0, // ✅ Added video count
        totalMedia: (cat._count?.images || 0) + (cat._count?.videos || 0)
      }))
    })
  }, [categories])

  // ✅ Force refresh function that actually updates the data
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true)
    try {
      console.log('🔄 Refreshing portfolio data...')
      
      // Call the parent's refresh function
      if (onRefresh) {
        await onRefresh()
      }
      
      // Force auth cache refresh
      await forceRefresh()
      
      // Also invalidate Next.js cache
      try {
        await fetch('/api/revalidate', { method: 'POST' })
        console.log('✅ Cache invalidated')
      } catch (error) {
        console.error('Failed to revalidate cache:', error)
      }
      
      console.log('✅ Portfolio refresh complete')
      
    } catch (error) {
      console.error('❌ Portfolio refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, forceRefresh, isRefreshing])

  // ✅ Listen for custom events from upload component
  useEffect(() => {
    const handleUploadSuccess = () => {
      console.log('📸 Upload success detected, refreshing portfolio...')
      handleRefresh()
    }

    // Listen for upload success events
    window.addEventListener('uploadSuccess', handleUploadSuccess)
    
    return () => {
      window.removeEventListener('uploadSuccess', handleUploadSuccess)
    }
  }, [handleRefresh])

  // ✅ MOVED: Debug filtering effect moved here with other hooks
  const topLevelCategories = categoriesList
    .filter(cat => !cat.parentId && (isUserAdmin || !cat.isPrivate))

  useEffect(() => {
    console.log('🔍 Portfolio Filtering Debug:', {
      isUserAdmin,
      totalTopLevel: categoriesList.filter(cat => !cat.parentId).length,
      filteredTopLevel: topLevelCategories.length,
      privateTopLevel: categoriesList.filter(cat => !cat.parentId && cat.isPrivate).length,
      publicTopLevel: categoriesList.filter(cat => !cat.parentId && !cat.isPrivate).length,
      topLevelCategories: topLevelCategories.map(cat => ({
        name: cat.name,
        isPrivate: cat.isPrivate,
        shouldShow: isUserAdmin || !cat.isPrivate,
        imageCount: cat._count?.images || 0,
        videoCount: cat._count?.videos || 0 // ✅ Added video count to debug
      }))
    })
  }, [categoriesList, topLevelCategories, isUserAdmin])

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    await handleRefresh()
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  if (!mounted) {
    return <div className="h-96 bg-gray-800 animate-pulse" />
  }

  // ✅ FIXED: Calculate total media (images + videos) for each category
  const categoriesWithTotals = topLevelCategories.map(category => {
    // Count subcategory media (images + videos)
    const subcategoryMedia = category.subcategories?.reduce(
      (total, sub) => {
        if (isUserAdmin || !sub.isPrivate) {
          const subImages = sub._count?.images || 0
          const subVideos = sub._count?.videos || 0
          return total + subImages + subVideos
        }
        return total
      },
      0
    ) || 0
    
    // Count main category media (images + videos)
    const categoryImages = category._count?.images || 0
    const categoryVideos = category._count?.videos || 0
    const totalMedia = categoryImages + categoryVideos + subcategoryMedia

    // Get most recent media from the PARENT category itself (prefer images, then videos)
    const categoryImagesList = category.images || []
    const categoryVideosList = category.videos || []
    
    // Combine all media and sort by creation date
    const allCategoryMedia = [
      ...categoryImagesList.map(img => ({ ...img, mediaType: 'image' as const })),
      ...categoryVideosList.map(vid => ({ ...vid, mediaType: 'video' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const recentMedia = allCategoryMedia[0]

    console.log(`📊 Category ${category.name} totals:`, {
      images: categoryImages,
      videos: categoryVideos,
      subcategoryMedia,
      totalMedia,
      recentMedia: recentMedia ? `${recentMedia.mediaType}: ${recentMedia.title}` : 'none'
    })

    return {
      ...category,
      totalMedia, // ✅ Changed from totalImages to totalMedia
      recentMedia // ✅ Changed from recentImage to recentMedia
    }
  }).filter(cat => cat.totalMedia > 0) // ✅ Changed from totalImages to totalMedia

  return (
    <>
      <section id="portfolio" className="bg-gray-800 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-4 mb-4">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-tight">
                Portfolio
              </h2>
              {/* Admin Quick Access */}
              {isUserAdmin && (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage</span>
                  </Link>
                  {/* Manual Refresh Button for Admin */}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="w-16 h-px bg-gray-400 mx-auto mb-6"></div>
            <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Explore my collection of photography and videography.
            </p>
          </motion.div>

          {/* Portfolio Grid */}
          {categoriesWithTotals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categoriesWithTotals.map((category, index) => (
                <ModernPortfolioCard
                  key={`${category.id}-${category.totalMedia}`} // ✅ Force re-render when media count changes
                  category={category}
                  index={index}
                  isAdmin={isUserAdmin}
                  onEdit={() => handleEditCategory(category)}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center py-16"
            >
              <h3 className="text-xl text-gray-300 mb-3 font-light">No Galleries Available</h3>
              <p className="text-gray-400 mb-6">
                {isUserAdmin 
                  ? "Create your first category to get started!" 
                  : "Check back soon for new photo galleries!"
                }
              </p>
              {isUserAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Go to Admin</span>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditCategoryModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEdit}
            category={editingCategory}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}

interface ModernPortfolioCardProps {
  category: any
  index: number
  isAdmin: boolean
  onEdit?: () => void
}

function ModernPortfolioCard({ category, index, isAdmin, onEdit }: ModernPortfolioCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0) // ✅ Changed from currentImageIndex
  const [hasShuffled, setHasShuffled] = useState(false)
  const [mediaPreloaded, setMediaPreloaded] = useState(false) // ✅ Changed from imagesPreloaded

  // Generate gradient colors based on category name
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

  // ✅ FIXED: Get all available media (images + videos) for shuffling
  const getAllMedia = () => {
    const categoryImages = (category.images || []).map((img: any) => ({ ...img, mediaType: 'image' }))
    const categoryVideos = (category.videos || []).map((vid: any) => ({ ...vid, mediaType: 'video' }))
    
    const subcategoryMedia = category.subcategories?.flatMap((sub: any) => {
      if (isAdmin || !sub.isPrivate) {
        const subImages = (sub.images || []).map((img: any) => ({ ...img, mediaType: 'image' }))
        const subVideos = (sub.videos || []).map((vid: any) => ({ ...vid, mediaType: 'video' }))
        return [...subImages, ...subVideos]
      }
      return []
    }) || []
    
    const allMedia = [...categoryImages, ...categoryVideos, ...subcategoryMedia]
      .filter((media: any) => media.cloudinaryId)
    
    console.log(`📊 ${category.name} media:`, {
      images: categoryImages.length,
      videos: categoryVideos.length,
      subcategoryMedia: subcategoryMedia.length,
      total: allMedia.length
    })
    
    return allMedia
  }

  const allMedia = getAllMedia()
  const currentMedia = allMedia[currentMediaIndex] || category.recentMedia

  // ✅ PRELOAD ALL MEDIA for smooth transitions
  useEffect(() => {
    if (allMedia.length > 1 && !mediaPreloaded) {
      const preloadPromises = allMedia.map((media: any) => {
        return new Promise((resolve, reject) => {
          const element = new window.Image()
          element.onload = resolve
          element.onerror = reject
          
          if (media.mediaType === 'video') {
            // For videos, load the thumbnail
            element.src = getClientVideoThumbnailUrl(media.cloudinaryId, 600, 480)
          } else {
            // For images, load normally
            element.src = getClientThumbnailUrl(media.cloudinaryId, 600, 480)
          }
        })
      })

      Promise.allSettled(preloadPromises).then(() => {
        setMediaPreloaded(true)
        console.log(`✅ Preloaded ${allMedia.length} media items for category: ${category.name}`)
      })
    }
  }, [allMedia, category.name, mediaPreloaded])

  // ✅ FIXED: Single shuffle on hover that persists (only after preload)
  const handleMouseEnter = () => {
    setIsHovered(true)
    
    // Only shuffle if we haven't shuffled yet AND there are multiple media items AND media is preloaded
    if (!hasShuffled && allMedia.length > 1 && mediaPreloaded) {
      setHasShuffled(true)
      
      // Pick a random media item that's different from current
      const availableIndices = allMedia.map((_, index) => index).filter(index => index !== currentMediaIndex)
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
        setCurrentMediaIndex(randomIndex)
      }
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // ✅ Don't reset the media index - keep the shuffled media
    // Reset shuffle state after a delay to allow re-shuffle on next hover
    setTimeout(() => {
      setHasShuffled(false)
    }, 1000) // 1 second cooldown before allowing another shuffle
  }

  const gradientClass = generateGradient(category.name)

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEdit) {
      onEdit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Admin Edit Button */}
      {isAdmin && (
        <button
          onClick={handleEditClick}
          className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Edit Category"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      <Link href={`/gallery/${category.key}`} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-gray-700 mb-4 rounded-xl shadow-lg">
          {/* Background Media with Shuffle Effect */}
          <AnimatePresence mode="wait">
            {currentMedia && currentMedia.cloudinaryId && !imageError ? (
              <motion.div
                key={`${currentMedia.id}-${currentMediaIndex}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeOut"
                }}
                className="absolute inset-0"
              >
                {currentMedia.mediaType === 'video' ? (
                  // ✅ Video thumbnail with play indicator
                  <div className="relative w-full h-full">
                    <Image
                      src={currentMedia.thumbnailUrl || getClientVideoThumbnailUrl(currentMedia.cloudinaryId, 600, 480)}
                      alt={category.name}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-105"
                      onError={() => setImageError(true)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                    {/* Video play indicator */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // ✅ Regular image
                  <Image
                    src={getClientThumbnailUrl(currentMedia.cloudinaryId, 600, 480)}
                    alt={category.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index < 3}
                  />
                )}
              </motion.div>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
            )}
          </AnimatePresence>
          
          {/* Media Index Indicator (shows when hovering and multiple media available) */}
          {isHovered && allMedia.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1"
            >
              <span>{currentMediaIndex + 1} / {allMedia.length}</span>
              {currentMedia?.mediaType === 'video' && <Play className="w-3 h-3" />}
              {!mediaPreloaded && <span className="animate-pulse">●</span>}
            </motion.div>
          )}
          
          {/* Dark Overlay */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-70'
          }`} />
          
          {/* Privacy indicator */}
          {isAdmin && category.isPrivate && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full">
              Private
            </div>
          )}

          {/* Category Name */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
            <h3 className="text-2xl md:text-3xl font-light text-white drop-shadow-lg leading-tight mb-2">
              {category.name}
            </h3>
            
            {/* Hover Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 10
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30"
            >
              <span className="text-white text-sm font-light">View Gallery →</span>
            </motion.div>
          </div>

          {/* Bottom Info */}
          <motion.div
            animate={{ 
              opacity: isHovered ? 0 : 1,
              y: isHovered ? 10 : 0
            }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div className="flex items-center justify-between text-white/80">
              <span className="text-sm">
                {category.totalMedia} {category.totalMedia === 1 ? 'item' : 'items'}
              </span>
              <span className="text-sm">
                {allMedia.length > 1 ? 
                  (mediaPreloaded ? 'Hover to preview →' : 'Loading preview...') : 
                  'Tap to view →'
                }
              </span>
            </div>
          </motion.div>
        </div>

        {/* Content Below Image */}
        <div className="space-y-1">          
          {category.description && (
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-1 text-center">
              {category.description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}