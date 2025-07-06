'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Edit, ExternalLink, Lock, Play, Pause } from 'lucide-react'
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

function SimpleVideoPlayer({ src, poster, autoStart = false, videoDuration }: { src: string, poster?: string, autoStart?: boolean, videoDuration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(videoDuration || 0) // Use provided duration from Cloudinary
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Fixed 16:9 dimensions
  const playerWidth = Math.min(window.innerWidth * 0.85, 1200)
  const playerHeight = Math.round(playerWidth * (9/16))

  // Simple format time function
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Simple progress calculation
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0

  // Event handlers - simplified since we have duration from Cloudinary
  const handleVideoReady = () => {
    setIsLoading(false)
    console.log('✅ Video ready, using Cloudinary duration:', duration)
    
    // Only try to get duration from video if we don't have it from Cloudinary
    if (!duration && videoRef.current?.duration) {
      setDuration(videoRef.current.duration)
      console.log('📺 Fallback: Got duration from video element:', videoRef.current.duration)
    }
  }

  // Simplified duration detection - less aggressive since we have it from Cloudinary
  const tryGetDuration = () => {
    if (!duration && videoRef.current?.duration) {
      setDuration(videoRef.current.duration)
      console.log('🔧 Duration captured from video element:', videoRef.current.duration)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      // Try to grab duration on every time update if we don't have it
      tryGetDuration()
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    setShowPoster(false)
    // Try to get duration when play starts
    tryGetDuration()
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const togglePlay = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          await videoRef.current.play()
        }
      } catch (error) {
        console.error('Play error:', error)
      }
    }
  }

  // Handle spacebar for play/pause
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !showPoster && !isLoading) {
      e.preventDefault()
      e.stopPropagation()
      togglePlay()
    }
  }, [isPlaying, showPoster, isLoading])

  // Add spacebar listener when video is active
  useEffect(() => {
    if (!showPoster && !isLoading) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, showPoster, isLoading])

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (videoRef.current && duration > 0) {
      const newTime = (parseFloat(e.target.value) / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const newVolume = parseFloat(e.target.value) / 100
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume
        videoRef.current.muted = false
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  const handlePosterClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPoster(false)
    if (videoRef.current) {
      try {
        await videoRef.current.play()
      } catch (error) {
        console.error('Play error:', error)
        setShowPoster(true)
      }
    }
  }

  // Auto-start effect - simplified
  useEffect(() => {
    if (autoStart && !isLoading && videoRef.current) {
      const startVideo = async () => {
        try {
          setShowPoster(false)
          await videoRef.current?.play()
        } catch (error) {
          console.error('Auto-start failed:', error)
        }
      }
      setTimeout(startVideo, 300)
    }
  }, [autoStart, isLoading])

  // Remove aggressive duration monitoring since we have it from Cloudinary
  useEffect(() => {
    // Set loading to false immediately if we have duration from Cloudinary
    if (videoDuration && videoDuration > 0) {
      setIsLoading(false)
    }
  }, [videoDuration])

  // Initial setup when video loads
  useEffect(() => {
    if (videoRef.current && !duration) {
      // Only try to get duration if we don't have it from Cloudinary
      setTimeout(tryGetDuration, 200)
    }
  }, [src])

  return (
    <div 
      className="relative group bg-black rounded-lg overflow-hidden"
      style={{
        width: playerWidth,
        height: playerHeight,
        aspectRatio: '16 / 9'
      }}
    >
      {/* Video Element - YouTube-style invisible clickable area */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        style={{
          opacity: showPoster ? 0 : 1,
          transition: 'opacity 0.3s ease',
          cursor: 'default' // No pointer cursor - invisible clickable like YouTube
        }}
        onClick={!showPoster ? togglePlay : undefined}
        onLoadedMetadata={handleVideoReady}
        onLoadedData={handleVideoReady}
        onCanPlay={handleVideoReady}
        onDurationChange={handleVideoReady}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
        controls={false}
        playsInline
        muted={false}
      />

      {/* Simple Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-20">
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="relative z-10 flex flex-col items-center space-y-4 text-white">
            <div className="w-16 h-16 border-4 border-white/20 border-t-[#338182] rounded-full animate-spin"></div>
            <div className="text-lg font-medium">Loading video...</div>
          </div>
        </div>
      )}

      {/* Poster Overlay */}
      {showPoster && !isLoading && (
        <div 
          className="absolute inset-0 cursor-pointer bg-black flex items-center justify-center z-10"
          onClick={handlePosterClick}
        >
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Play Button */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-20 h-20 bg-[#338182] hover:bg-[#2a6a6b] rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-2xl">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          {/* Duration Badge */}
          {duration > 0 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
              {formatTime(duration)}
            </div>
          )}
        </div>
      )}

      {/* Controls - PROPER BUTTONS that look soft */}
      {!showPoster && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-3">
            {/* Play/Pause - Proper button with soft styling */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay(e)
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Current Time */}
            <span className="text-white text-sm font-medium min-w-[40px]">
              {formatTime(currentTime)}
            </span>

            {/* Progress Bar */}
            <div className="flex-1 relative group/progress">
              <div className="relative h-1 bg-white/30 rounded-full overflow-hidden hover:h-2 transition-all">
                <div
                  className="absolute top-0 left-0 h-full bg-[#338182] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleProgressChange}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Video progress"
                />
                <div
                  className="absolute top-1/2 w-3 h-3 bg-[#338182] border-2 border-white rounded-full transform -translate-y-1/2 transition-all opacity-0 group-hover/progress:opacity-100 shadow-lg"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
            </div>

            {/* Duration */}
            <span className="text-white text-sm font-medium min-w-[40px]">
              {formatTime(duration)}
            </span>

            {/* Volume - Proper button with soft styling */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute(e)
                }}
                className="text-white hover:text-gray-300 p-1 hover:bg-white/10 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.414v13.172a.5.5 0 01-.854.353L5.5 13.5H3a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.646-3.439A.5.5 0 0110 3.414z" />
                    <path d="M13.293 6.293a1 1 0 011.414 1.414L16 9l-1.293 1.293a1 1 0 01-1.414-1.414L14.586 9l-1.293-1.293z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.414v13.172a.5.5 0 01-.854.353L5.5 13.5H3a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.646-3.439A.5.5 0 0110 3.414z" />
                    <path d="M14.657 3.657a8 8 0 010 11.314L13.95 14.264a6.5 6.5 0 000-8.528l.707-.707z" />
                    <path d="M12.828 5.828a4 4 0 010 5.656l-.707-.707a3 3 0 000-4.242l.707-.707z" />
                  </svg>
                )}
              </button>

              <div className="relative w-20 h-1 bg-white/20 rounded-full group/volume">
                <div
                  className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
                <div
                  className="absolute top-1/2 w-3 h-3 bg-white border-2 border-[#338182] rounded-full transform -translate-y-1/2 transition-all opacity-0 group-hover/volume:opacity-100"
                  style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 6px)` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Check if this is a private gallery being accessed by non-admin
  const isPrivateDirectAccess = category.isPrivate && !isAdmin

  // Enhanced Cloudinary URL function that handles both images and videos
  const getOptimizedUrl = (media: any, width?: number, forLightbox = false) => {
    if (!media.cloudinaryId) {
      // Fallback to url property if available, or placeholder
      return media.url || '/placeholder-image.jpg'
    }
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      return media.url || '/placeholder-image.jpg'
    }

    // Determine if this is a video
    const isVideo = media.mediaType === 'video' || 
                    media.format === 'mp4' || 
                    ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(media.format?.toLowerCase() || '')

    // For videos, use different transformations
    if (isVideo) {
      if (forLightbox) {
        // For video lightbox, return the video URL directly
        return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/${media.cloudinaryId}`
      }
      
      if (width) {
        // For video thumbnails in gallery
        return `https://res.cloudinary.com/${cloudName}/video/upload/w_${width},so_1,f_jpg,q_auto/${media.cloudinaryId}`
      }
      
      // Default video thumbnail
      return `https://res.cloudinary.com/${cloudName}/video/upload/so_1,f_jpg,q_auto/${media.cloudinaryId}`
    }

    // For images (existing logic)
    if (forLightbox) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,q_auto,f_auto/${media.cloudinaryId}`
    }

    if (width) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_auto,f_auto/${media.cloudinaryId}`
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${media.cloudinaryId}`
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
  
  // FIXED: Combine images and videos into one gallery array, removing duplicates
  const allMedia = [
    ...category.images.filter(img => !(img as any).isHeader).map(img => ({ ...img, mediaType: 'image' })),
    ...(category.videos || []).map(vid => ({ ...vid, mediaType: 'video' }))
  ]
  
  // Remove duplicates based on cloudinaryId and sort by order
  const uniqueMedia = allMedia.filter((media, index, self) => 
    index === self.findIndex((m) => m.cloudinaryId === media.cloudinaryId)
  )
  
  const galleryMedia = uniqueMedia.sort((a, b) => (a.order || 0) - (b.order || 0))

  console.log('🎬 GalleryView Debug:', {
    categoryName: category.name,
    totalImages: category.images.length,
    totalVideos: category.videos?.length || 0,
    allMediaBeforeDedup: allMedia.length,
    uniqueMediaAfterDedup: uniqueMedia.length,
    galleryMedia: galleryMedia.length,
    duplicatesRemoved: allMedia.length - uniqueMedia.length,
    mediaTypes: galleryMedia.map(m => ({ id: m.id, type: m.mediaType, format: m.format, cloudinaryId: m.cloudinaryId }))
  })

  // Filter subcategories based on admin status
  const visibleSubcategories = category.subcategories?.filter(sub => 
    isAdmin || !sub.isPrivate
  ) || []

  const openLightbox = (media: any, index: number) => {
    setSelectedImage(media)
    setCurrentImageIndex(index)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % galleryMedia.length
    setSelectedImage(galleryMedia[nextIndex])
    setCurrentImageIndex(nextIndex)
  }

  const previousImage = () => {
    const prevIndex = currentImageIndex === 0 ? galleryMedia.length - 1 : currentImageIndex - 1
    setSelectedImage(galleryMedia[prevIndex])
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
    
    // Enhanced revalidation
    try {
      await fetch('/api/revalidate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryKey: category.key,
          action: 'edit',
          force: true
        })
      })
    } catch (error) {
      console.error('Failed to revalidate cache:', error)
    }
    
    setIsEditModalOpen(false)
    setEditingCategory(null)
    
    // Wait a moment for revalidation, then reload
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  // Listen for upload/delete events to auto-refresh the gallery
  useEffect(() => {
    const handleUploadSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('🎉 Upload success detected, refreshing gallery...', customEvent.detail)
      
      // Call revalidation API
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryKey: category.key,
            action: 'upload',
            mediaType: customEvent.detail?.mediaType,
            force: true
          })
        })
      } catch (error) {
        console.error('Revalidation failed:', error)
      }

      // Refresh the gallery data
      if (onRefresh) {
        await onRefresh()
      }

      // Reload the page after a short delay to ensure fresh content
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    const handleDeleteSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('🗑️ Delete success detected, refreshing gallery...', customEvent.detail)
      
      // Call revalidation API
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryKey: category.key,
            action: 'delete',
            mediaType: customEvent.detail?.mediaType,
            force: true
          })
        })
      } catch (error) {
        console.error('Revalidation failed:', error)
      }

      // Refresh the gallery data
      if (onRefresh) {
        await onRefresh()
      }

      // Reload the page after a short delay to ensure fresh content
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    // Listen for custom events
    window.addEventListener('uploadSuccess', handleUploadSuccess)
    window.addEventListener('deleteSuccess', handleDeleteSuccess)

    return () => {
      window.removeEventListener('uploadSuccess', handleUploadSuccess)
      window.removeEventListener('deleteSuccess', handleDeleteSuccess)
    }
  }, [category.key, onRefresh])
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
  }, [selectedImage, currentImageIndex, galleryMedia.length])

  // Preload adjacent media for instant navigation
  useEffect(() => {
    if (!selectedImage || galleryMedia.length <= 1) return

    const preloadMedia = (index: number) => {
      const media = galleryMedia[index]
      if (media.mediaType === 'image') {
        const img = new window.Image()
        img.src = getOptimizedUrl(media, 1200, true)
      }
    }

    // Preload next and previous media
    const nextIndex = (currentImageIndex + 1) % galleryMedia.length
    const prevIndex = currentImageIndex === 0 ? galleryMedia.length - 1 : currentImageIndex - 1
    
    preloadMedia(nextIndex)
    preloadMedia(prevIndex)
  }, [selectedImage, currentImageIndex, galleryMedia])

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
            <HeaderContent 
              category={category} 
              isAdmin={isAdmin} 
              isPrivateDirectAccess={isPrivateDirectAccess}
              actualMediaCount={galleryMedia.length}
            />
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
            {galleryMedia.length > 0 ? (
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
                {galleryMedia.map((media, index) => {
                  const isVideo = media.mediaType === 'video' || 
                                  media.format === 'mp4' || 
                                  ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(media.format?.toLowerCase() || '')

                  return (
                    <motion.div
                      key={`${media.mediaType}-${media.id}`}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="group cursor-pointer break-inside-avoid mb-6"
                      onClick={() => openLightbox(media, index)}
                    >
                      <div className="relative overflow-hidden rounded-lg bg-gray-800 border border-gray-700/50">
                        <div className="relative">
                          {isVideo ? (
                            // For videos, show thumbnail with play icon
                            <div className="relative">
                              <img
                                src={getOptimizedUrl(media, 400)}
                                alt={media.title || ''}
                                className="w-full h-auto transition-all duration-700 group-hover:scale-105 rounded-lg"
                                loading="lazy"
                              />
                              {/* Play icon overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                                  <Play className="w-6 h-6 text-white ml-1" />
                                </div>
                              </div>
                              {/* Video indicator badge */}
                              <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                VIDEO
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getOptimizedUrl(media, 400)}
                              alt={media.title || ''}
                              className="w-full h-auto transition-all duration-700 group-hover:scale-105 rounded-lg"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 rounded-lg" />
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-colors duration-500 rounded-lg" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-2xl text-white/70 mb-4 font-light">No Media Yet</h3>
                <p className="text-white/50">
                  {isAdmin
                    ? 'Upload some images or videos to this category to get started!'
                    : 'Check back soon for new content!'}
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

      {/* Lightbox Modal - Enhanced for Videos with Fixed Navigation */}
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
              <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50 text-white/60 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full border border-white/10">
                ← → to navigate • ESC to close
              </div>

              {/* Navigation Buttons - ALWAYS OUTSIDE OF MEDIA */}
              {galleryMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      previousImage()
                    }}
                    className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-all duration-200 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                    className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-all duration-200 rounded-full backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Media Container */}
              <motion.div
                key={selectedImage.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Display Video or Image */}
                {selectedImage.mediaType === 'video' || 
                 selectedImage.format === 'mp4' || 
                 ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(selectedImage.format?.toLowerCase() || '') ? (
                  <SimpleVideoPlayer 
                    src={getOptimizedUrl(selectedImage, undefined, true)}
                    poster={getOptimizedUrl(selectedImage, 800)}
                    autoStart={true}
                    videoDuration={selectedImage.duration} // Pass Cloudinary duration
                  />
                ) : (
                  <img
                    key={selectedImage.id}
                    src={getOptimizedUrl(selectedImage, 1200, true)}
                    alt={selectedImage.title || ''}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    style={{ 
                      maxWidth: '90vw', 
                      maxHeight: '90vh',
                      width: 'auto',
                      height: 'auto'
                    }}
                    loading="eager"
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Separate component for header content with social media integration
function HeaderContent({ category, isAdmin, isPrivateDirectAccess, actualMediaCount }: { 
  category: Category, 
  isAdmin: boolean,
  isPrivateDirectAccess: boolean,
  actualMediaCount?: number
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
        {/* Media Count - Use actual displayed media count */}
        <span className="text-white/60 font-light tracking-wide">
          {actualMediaCount || ((category._count?.images || 0) + (category._count?.videos || 0))} {(actualMediaCount || ((category._count?.images || 0) + (category._count?.videos || 0))) === 1 ? 'item' : 'items'} in this collection
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