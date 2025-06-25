'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Category } from '@/lib/types'

// Client-safe thumbnail function (doesn't import server-side Cloudinary)
function getClientThumbnailUrl(cloudinaryId: string, width: number, height: number): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName || !cloudinaryId) {
    return '/placeholder-image.jpg'
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${cloudinaryId}`
}

interface PortfolioProps {
  categories: Category[]
  recentImages: any[]
}

export default function ModernPortfolio({ categories, recentImages }: PortfolioProps) {
  const [mounted, setMounted] = useState(false)
  const [categoriesList, setCategoriesList] = useState(categories)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    setCategoriesList(categories)
  }, [categories])

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  if (!mounted) {
    return <div className="h-96 bg-gray-800 animate-pulse" />
  }

  // Filter to show private categories to admins
  const topLevelCategories = categoriesList
    .filter(cat => !cat.parentId && (isAdmin || !cat.isPrivate))

  // Calculate total images for each category (including subcategories)
  const categoriesWithTotals = topLevelCategories.map(category => {
    const subcategoryImages = category.subcategories?.reduce(
      (total, sub) => total + (sub._count?.images || 0),
      0
    ) || 0
    const totalImages = (category._count?.images || 0) + subcategoryImages

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
  }).filter(cat => cat.totalImages > 0)

  return (
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
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-white mb-4 tracking-tight">
            Portfolio
          </h2>
          <div className="w-16 h-px bg-gray-400 mx-auto mb-6"></div>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Explore my collection of photography work across different styles and occasions
          </p>
        </motion.div>

        {/* Portfolio Grid */}
        {categoriesWithTotals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {categoriesWithTotals.map((category, index) => (
              <ModernPortfolioCard
                key={category.id}
                category={category}
                index={index}
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
            className="text-center py-16"
          >
            <h3 className="text-xl text-gray-300 mb-3 font-light">No Galleries Available</h3>
            <p className="text-gray-400">
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

interface ModernPortfolioCardProps {
  category: any
  index: number
  isAdmin: boolean
}

function ModernPortfolioCard({ category, index, isAdmin }: ModernPortfolioCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Generate gradient colors based on category name (fallback for no image)
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

  const gradientClass = generateGradient(category.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/gallery/${category.key}`} className="block">
        {/* Image Container - Dark Overlay Style */}
        <div className="relative aspect-[5/4] overflow-hidden bg-gray-700 mb-4 rounded-xl shadow-lg">
          {/* Background Image (Always Present) */}
          {category.recentImage && category.recentImage.cloudinaryId && !imageError ? (
            <Image
              src={getClientThumbnailUrl(category.recentImage.cloudinaryId, 600, 480)}
              alt={category.name}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 3}
            />
          ) : (
            // Fallback gradient if no image
            <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
          )}
          
          {/* Dark Overlay (70% opacity by default, disappears on hover) */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-70'
          }`} />
          
          {/* Privacy indicator */}
          {isAdmin && category.isPrivate && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full">
              Private
            </div>
          )}

          {/* Category Name (Always Visible) */}
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

          {/* Bottom Info (Hidden on Hover) */}
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
                {category.totalImages} {category.totalImages === 1 ? 'image' : 'images'}
              </span>
              <span className="text-sm">
                Tap to view →
              </span>
            </div>
          </motion.div>
        </div>

        {/* Content Below Image - Minimal */}
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