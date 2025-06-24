'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { siteConfig } from '@/config/site'

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
}

export default function About() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [aboutImages, setAboutImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch images from your API
  useEffect(() => {
    setMounted(true)
    fetchImages()
  }, [])

  // Auto-cycle through images
  useEffect(() => {
    if (aboutImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % aboutImages.length)
      }, 4000)
      
      return () => clearInterval(interval)
    }
  }, [aboutImages.length])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images?public=true')
      if (response.ok) {
        const data = await response.json()
        // Take a random selection of images for the about section
        const shuffled = data.images.sort(() => 0.5 - Math.random())
        setAboutImages(shuffled.slice(0, 6)) // Show 6 random images
      } else {
        console.error('Failed to fetch images')
        // Fallback to empty array if API fails
        setAboutImages([])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      setAboutImages([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="h-96 bg-gray-800 animate-pulse" />
  }

  return (
    <section id="about" className="py-20 lg:py-32 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flex layout instead of grid to allow dynamic sizing */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
          {/* Text Content - Fixed width on large screens */}
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
                statewide to create something beautiful together.
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">4+</div>
                <div className="text-sm text-white/60">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">500+</div>
                <div className="text-sm text-white/60">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">1000+</div>
                <div className="text-sm text-white/60">Photos Taken</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Image Section - Completely free-flowing */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative flex justify-center lg:justify-start"
          >
            {/* Container that sizes itself to image content */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary-500/20 shadow-2xl p-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-20 rounded-2xl" />
                
                {/* Images that determine container size */}
                <div className="relative">
                  {loading ? (
                    // Loading state
                    <div className="w-96 h-96 bg-gray-700 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <div className="text-4xl mb-2 animate-pulse">📸</div>
                        <div className="text-sm">Loading portfolio...</div>
                      </div>
                    </div>
                  ) : aboutImages.length > 0 ? (
                    // Images with natural dimensions
                    aboutImages.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: index === currentImageIndex ? 1 : 0,
                        }}
                        transition={{ duration: 1.5 }}
                        className={index === currentImageIndex ? 'block' : 'absolute inset-0 invisible'}
                      >
                        <Image
                          src={getClientThumbnailUrl(image.cloudinaryId, 600, 800)}
                          alt={image.title}
                          width={600}
                          height={800}
                          className="rounded-xl shadow-lg max-w-[90vw] max-h-[70vh] w-auto h-auto"
                          sizes="(max-width: 768px) 90vw, 600px"
                          priority={index === 0}
                        />
                        {/* Subtle overlay */}
                        <div className="absolute inset-0 bg-black/5 rounded-xl pointer-events-none" />
                      </motion.div>
                    ))
                  ) : (
                    // Fallback
                    <div className="w-96 h-96 bg-gray-700 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <div className="text-4xl mb-2">📸</div>
                        <div className="text-sm">Portfolio Loading...</div>
                      </div>
                    </div>
                  )}
                </div>
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