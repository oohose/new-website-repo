'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Download, Share2, Edit } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getDisplayUrl, getThumbnailUrl } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  subcategories: any[]
  socialLinks: any
}

interface Image {
  id: string
  title: string
  description: string | null
  cloudinaryId: string
  url: string
  category: { name: string; key: string }
}

interface GalleryViewProps {
  category: Category
  mainImages: Image[]
  subcategoryImages: Image[]
}

export default function GalleryView({ 
  category, 
  mainImages, 
  subcategoryImages 
}: GalleryViewProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === 'ADMIN'
  const allImages = [...mainImages, ...subcategoryImages]

  const openLightbox = (image: Image, index: number) => {
    setSelectedImage(image)
    setCurrentImageIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentImageIndex - 1 + allImages.length) % allImages.length
      : (currentImageIndex + 1) % allImages.length
    
    setCurrentImageIndex(newIndex)
    setSelectedImage(allImages[newIndex])
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${category.name} Gallery`,
          text: category.description || `Beautiful ${category.name.toLowerCase()} photography`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Gallery link copied to clipboard!')
    }
  }

  const handleDownload = (image: Image) => {
    const link = document.createElement('a')
    link.href = getDisplayUrl(image.cloudinaryId)
    link.download = `${image.title}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse social links
  const socialLinks = category.socialLinks ? 
    (typeof category.socialLinks === 'string' ? 
      JSON.parse(category.socialLinks) : 
      category.socialLinks) : {}

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Portfolio</span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              
              {isAdmin && (
                <Link
                  href={`/admin/gallery/${category.key}`}
                  className="flex items-center space-x-1 text-white/70 hover:text-primary-400 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Gallery Header */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {category.isPrivate && isAdmin && (
              <div className="inline-block mb-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-red-400 text-sm font-medium">🔒 Private Gallery</span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 gradient-text">
              {category.name}
            </h1>
            
            {category.description && (
              <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8">
                {category.description}
              </p>
            )}

            <div className="flex items-center justify-center space-x-6 text-white/60">
              <span>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</span>
              {category.subcategories.length > 0 && (
                <span>{category.subcategories.length} collection{category.subcategories.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {/* Social Links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="mt-8 flex justify-center space-x-4">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null
                  return (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-primary-400 transition-colors capitalize"
                    >
                      {platform}
                    </a>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Subcategory Cards */}
      {category.subcategories.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-light text-white mb-8 text-center">Collections</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.subcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Link href={`/gallery/${subcategory.key}`}>
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
                      {subcategory.images?.[0] && (
                        <Image
                          src={getThumbnailUrl(subcategory.images[0].cloudinaryId, 400, 300)}
                          alt={subcategory.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-lg font-semibold text-white mb-1">{subcategory.name}</h3>
                        <p className="text-white/70 text-sm">
                          {subcategory._count?.images || 0} images
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Images Grid */}
      {allImages.length > 0 ? (
        <div className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            {mainImages.length > 0 && category.subcategories.length > 0 && (
              <h2 className="text-2xl font-light text-white mb-8 text-center">Featured Images</h2>
            )}
            
            <div className="gallery-grid">
              {allImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(image, index)}
                >
                  <div className="relative aspect-photo rounded-xl overflow-hidden bg-gray-800">
                    <Image
                      src={getThumbnailUrl(image.cloudinaryId, 400, 300)}
                      alt={image.title}
                      fill
                      className="object-cover transition-all duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    
                    {/* Image overlay info */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-white font-medium text-lg mb-1">{image.title}</h3>
                        {image.description && (
                          <p className="text-white/70 text-sm line-clamp-2">{image.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto text-center py-20">
            <h3 className="text-2xl text-white/70 mb-4">No Images Yet</h3>
            <p className="text-white/50">This gallery is being prepared. Check back soon!</p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateImage('prev')
                    }}
                    className="absolute left-4 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateImage('next')
                    }}
                    className="absolute right-4 z-10 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={getDisplayUrl(selectedImage.cloudinaryId, 1920)}
                  alt={selectedImage.title}
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-[80vh] object-contain"
                />
                
                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white text-xl font-medium mb-2">{selectedImage.title}</h3>
                      {selectedImage.description && (
                        <p className="text-white/70">{selectedImage.description}</p>
                      )}
                      <p className="text-white/50 text-sm mt-2">
                        {currentImageIndex + 1} of {allImages.length}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(selectedImage)}
                      className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}