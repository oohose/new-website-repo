'use client'

import { motion } from 'framer-motion'
import NextImage from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { siteConfig } from '@/config/site'
import { Image as ImageType } from '@/lib/types'

// Client-safe thumbnail function
function getClientThumbnailUrl(cloudinaryId: string, width: number, height: number): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !cloudinaryId) {
    return '/placeholder-image.jpg'
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${cloudinaryId}`
}

interface ImageData {
  id: string
  cloudinaryId: string
  title: string
  url: string
  createdAt: string
}

interface ImageDimensions {
  width: number
  height: number
  orientation: 'landscape' | 'portrait' | 'square'
}

export default function About() {
  const [mounted, setMounted] = useState(false)
  const [aboutImages, setAboutImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Simplified state management
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [containerDimensions, setContainerDimensions] = useState({ width: 450, height: 450 })
  const [showImage, setShowImage] = useState(true)
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fadeOut' | 'resize' | 'fadeIn'>('idle')

  useEffect(() => {
    setMounted(true)
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      // ✅ Updated to fetch images including subcategories
      const response = await fetch('/api/images?public=true&includeSubcategories=true')
      if (response.ok) {
        const data = await response.json()
        const shuffled = data.images.sort(() => 0.5 - Math.random())
        setAboutImages(shuffled.slice(0, 8)) // ✅ Increased from 6 to 8 since we have more images now
      } else {
        console.error('Failed to fetch images')
        setAboutImages([])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      setAboutImages([])
    } finally {
      setLoading(false)
    }
  }

  const detectImageDimensions = useCallback((cloudinaryId: string): Promise<ImageDimensions> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight
        let orientation: 'landscape' | 'portrait' | 'square'
        
        if (aspectRatio > 1.2) {
          orientation = 'landscape'
        } else if (aspectRatio < 0.8) {
          orientation = 'portrait'
        } else {
          orientation = 'square'
        }

        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          orientation
        })
      }
      img.src = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${cloudinaryId}`
    })
  }, [])

  const calculateContainerSize = useCallback((imageDims: ImageDimensions) => {
    const { width, height, orientation } = imageDims
    const maxWidth = 500
    const maxHeight = 600
    
    let containerWidth, containerHeight
    
    if (orientation === 'landscape') {
      containerWidth = Math.min(maxWidth, width * (maxHeight / height))
      containerHeight = Math.min(maxHeight, containerWidth * (height / width))
    } else if (orientation === 'portrait') {
      containerHeight = Math.min(maxHeight, height * (maxWidth / width))
      containerWidth = Math.min(maxWidth, containerHeight * (width / height))
    } else {
      const size = Math.min(maxWidth, maxHeight)
      containerWidth = size
      containerHeight = size
    }

    return {
      width: Math.round(containerWidth),
      height: Math.round(containerHeight)
    }
  }, [])

  const performTransition = useCallback(async () => {
    if (aboutImages.length <= 1) return

    const nextIndex = (currentImageIndex + 1) % aboutImages.length
    const nextImage = aboutImages[nextIndex]
    
    // Phase 1: Fade out - faster
    setTransitionPhase('fadeOut')
    setShowImage(false)
    
    // Wait for fade out - reduced timing
    await new Promise(resolve => setTimeout(resolve, 500)) // ✅ Reduced from 800ms
    
    // Phase 2: Detect new image dimensions and resize container - faster
    setTransitionPhase('resize')
    const newDimensions = await detectImageDimensions(nextImage.cloudinaryId)
    const newContainerSize = calculateContainerSize(newDimensions)
    setContainerDimensions(newContainerSize)
    
    // Wait for container resize - much faster
    await new Promise(resolve => setTimeout(resolve, 800)) // ✅ Reduced from 2000ms to 800ms
    
    // Phase 3: Change image and fade in
    setTransitionPhase('fadeIn')
    setCurrentImageIndex(nextIndex)
    
    // Small delay then fade in
    await new Promise(resolve => setTimeout(resolve, 100))
    setShowImage(true)
    
    // Wait for fade in to complete - faster
    await new Promise(resolve => setTimeout(resolve, 500)) // ✅ Reduced from 800ms
    
    setTransitionPhase('idle')
  }, [aboutImages, currentImageIndex, detectImageDimensions, calculateContainerSize])

  // Auto transition - faster timing
  useEffect(() => {
    if (aboutImages.length > 1 && transitionPhase === 'idle') {
      const timer = setTimeout(performTransition, 5000) // ✅ Reduced from 8000ms to 5000ms
      return () => clearTimeout(timer)
    }
  }, [aboutImages.length, transitionPhase, performTransition])

  // Initialize first image dimensions
  useEffect(() => {
    if (aboutImages.length > 0 && transitionPhase === 'idle' && containerDimensions.width === 450) {
      const firstImage = aboutImages[0]
      detectImageDimensions(firstImage.cloudinaryId).then(dims => {
        const size = calculateContainerSize(dims)
        setContainerDimensions(size)
      })
    }
  }, [aboutImages, transitionPhase, containerDimensions.width, detectImageDimensions, calculateContainerSize])

  if (!mounted) {
    return <div className="h-96 bg-gray-800 animate-pulse" />
  }

  return (
    <section id="about" className="py-20 lg:py-32 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 lg:w-1/2 lg:flex-shrink-0"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white gradient-text">
              About {siteConfig.photographer.name.split(' ')[0]}
            </h2>
            
            <div className="space-y-6 text-lg text-white/80 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {siteConfig.photographer.bio}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                {siteConfig.content.about.content}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                Based in {siteConfig.photographer.location}, I'm open to working with clients 
                statewide to capture your visions, or work with you to create your own unique vision. 
              </motion.p>
            </div>
          </motion.div>

          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex justify-center lg:justify-start"
          >
            {/* Fixed outer container to prevent layout shifts */}
            <div className="relative" style={{ width: '520px', height: '620px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Dynamic container */}
                <motion.div 
                  className="relative overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary-500/20 shadow-2xl"
                  style={{
                    borderRadius: '16px', // Explicit border radius
                    padding: '16px'
                  }}
                  animate={{ 
                    width: containerDimensions.width,
                    height: containerDimensions.height
                  }}
                  transition={{ 
                    duration: transitionPhase === 'resize' ? 0.8 : 0, // ✅ Reduced from 2 seconds to 0.8 seconds
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-20" style={{ borderRadius: '16px' }} />
                  
                  {/* Image container with proper clipping */}
                  <div 
                    className="relative w-full h-full overflow-hidden bg-gray-800/20"
                    style={{ borderRadius: '8px' }} // Inner radius smaller than container
                  >
                    {loading ? (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center" style={{ borderRadius: '8px' }}>
                        <div className="text-center text-white/60">
                          <div className="text-4xl mb-2 animate-pulse">📸</div>
                          <div className="text-sm">Loading portfolio...</div>
                        </div>
                      </div>
                    ) : aboutImages.length > 0 ? (
                      <motion.div
                        className="absolute inset-0"
                        style={{ borderRadius: '8px' }}
                        animate={{ opacity: showImage ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }} // ✅ Faster fade transitions
                      >
                        {/* Image with proper clipping mask */}
                        <div 
                          className="w-full h-full relative"
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            clipPath: 'inset(0 round 8px)'
                          }}
                        >
                          <NextImage
                            src={getClientThumbnailUrl(
                              aboutImages[currentImageIndex].cloudinaryId, 
                              containerDimensions.width * 2, 
                              containerDimensions.height * 2
                            )}
                            alt={aboutImages[currentImageIndex].title}
                            fill
                            className="object-cover"
                            style={{
                              borderRadius: '8px'
                            }}
                            sizes="(max-width: 768px) 90vw, 600px"
                          />
                        </div>
                        {/* Inner shadow for depth */}
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={{
                            borderRadius: '8px',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 3px rgba(0,0,0,0.3)',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.03) 100%)'
                          }} 
                        />
                      </motion.div>
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center" style={{ borderRadius: '8px' }}>
                        <div className="text-center text-white/60">
                          <div className="text-4xl mb-2">📸</div>
                          <div className="text-sm">Portfolio Loading...</div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary-500/20 rounded-full blur-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}