'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageType {
  id: string
  title: string
  description: string | null
  cloudinaryId: string
  url: string
  width: number | null
  height: number | null
  format: string | null
  isHeader: boolean
  createdAt: string
}

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  images: ImageType[]
  subcategories: any[]
  _count: { images: number }
}

interface DarkElegantGalleryViewProps {
  category: Category
  isAdmin: boolean
}

export default function DarkElegantGalleryView({ category, isAdmin }: DarkElegantGalleryViewProps) {
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // FIXED: Simple Cloudinary URL function that doesn't crop
  const getOptimizedUrl = (image: ImageType, width?: number, forLightbox = false) => {
    if (!image.cloudinaryId) {
      return image.url || '/placeholder-image.jpg'
    }
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      return image.url || '/placeholder-image.jpg'
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

  const headerImage = category.images.find(img => img.isHeader)
  const galleryImages = category.images.filter(img => !img.isHeader)

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
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-0 left-0 -mt-20"
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

            {/* Main Content */}
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

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex items-center justify-center space-x-8 text-white/60"
              >
                <span className="font-light tracking-wide">
                  {category._count.images} {category._count.images === 1 ? 'image' : 'images'} in this collection
                </span>
                {isAdmin && category.isPrivate && (
                  <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30">
                    Private Gallery
                  </span>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
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

            {/* Subcategories */}
            {category.subcategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mt-24"
              >
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-light text-white mb-4 tracking-tight">
                    Related Galleries
                  </h2>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.subcategories.map((subcat) => (
                    <Link key={subcat.id} href={`/gallery/${subcat.key}`}>
                      <div className="group bg-gray-800 border border-gray-700/50 rounded-lg overflow-hidden hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105">
                        {subcat.images[0] && (
                          <div className="aspect-[4/3] relative overflow-hidden">
                            <Image
                              src={getOptimizedUrl(subcat.images[0], 400)}
                              alt={subcat.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-lg font-light text-white mb-2 group-hover:text-white/80 transition-colors">
                            {subcat.name}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {subcat._count.images} {subcat._count.images === 1 ? 'image' : 'images'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
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