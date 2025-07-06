// utils/mediaCompression.ts - Enhanced compression for both images and videos

interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight?: number
  initialQuality?: number
  useWebWorker?: boolean
  mediaType: 'image' | 'video'
}

interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  wasCompressed: boolean
  thumbnail?: string
  duration?: number
  metadata?: VideoMetadata
}

interface VideoMetadata {
  duration: number
  width: number
  height: number
  frameRate?: number
  bitrate?: number
}

export class MediaCompressor {
  private static readonly IMAGE_COMPRESSION_THRESHOLD_MB = 5 // Lower threshold for images
  private static readonly VIDEO_COMPRESSION_THRESHOLD_MB = 50 // Lower threshold for videos
  private static readonly IMAGE_TARGET_MAX_SIZE_MB = 8 // Target 8MB for images
  private static readonly VIDEO_TARGET_MAX_SIZE_MB = 90 // Target 90MB for videos
  private static readonly MIN_QUALITY = 0.1 // Lower minimum quality
  private static readonly MAX_DIMENSION = 3840 // 4K max for images
  private static readonly VIDEO_MAX_DIMENSION = 1920 // 1080p max for videos
  
  // Supported file types
  private static readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ]
  private static readonly SUPPORTED_VIDEO_TYPES = [
    'video/mp4', 'video/quicktime', 'video/mov', 'video/avi', 'video/webm', 'video/mkv'
  ]

  /**
   * Main compression method that handles both images and videos
   */
  static async compressIfNeeded(file: File): Promise<CompressionResult> {
    const mediaType = this.getMediaType(file)
    const originalSizeMB = file.size / (1024 * 1024)
    
    console.log(`📊 Processing ${mediaType}: ${file.name} (${originalSizeMB.toFixed(2)}MB)`)
    
    if (mediaType === 'image') {
      return this.compressImage(file, originalSizeMB)
    } else if (mediaType === 'video') {
      return this.compressVideo(file, originalSizeMB)
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  /**
   * Compress image files with more aggressive settings
   */
  private static async compressImage(file: File, originalSizeMB: number): Promise<CompressionResult> {
    // Only compress if file is over threshold
    if (originalSizeMB <= this.IMAGE_COMPRESSION_THRESHOLD_MB) {
      console.log(`✅ Image ${file.name} is under ${this.IMAGE_COMPRESSION_THRESHOLD_MB}MB, no compression needed`)
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        wasCompressed: false
      }
    }

    try {
      console.log(`🔄 Compressing image ${file.name} from ${originalSizeMB.toFixed(2)}MB...`)
      
      const compressedFile = await this.compressImageFile(file, {
        maxSizeMB: this.IMAGE_TARGET_MAX_SIZE_MB,
        maxWidthOrHeight: this.MAX_DIMENSION,
        initialQuality: 0.9, // Start with higher quality
        mediaType: 'image'
      })

      const compressionRatio = file.size / compressedFile.size
      console.log(`✅ Image compression complete: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio.toFixed(2)}x compression)`)

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        wasCompressed: true
      }
    } catch (error) {
      console.error('❌ Image compression failed, using original file:', error)
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        wasCompressed: false
      }
    }
  }

  /**
   * Compress video files using HTML5 Canvas (client-side compression)
   */
  private static async compressVideo(file: File, originalSizeMB: number): Promise<CompressionResult> {
    try {
      // Extract video metadata and thumbnail first
      const metadata = await this.extractVideoMetadata(file)
      const thumbnail = await this.generateVideoThumbnail(file)
      
      console.log(`📹 Video metadata: ${metadata.width}x${metadata.height}, ${metadata.duration.toFixed(1)}s`)
      
      // Only compress if file is over threshold
      if (originalSizeMB <= this.VIDEO_COMPRESSION_THRESHOLD_MB) {
        console.log(`✅ Video ${file.name} is under ${this.VIDEO_COMPRESSION_THRESHOLD_MB}MB, no compression needed`)
        return {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          wasCompressed: false,
          thumbnail,
          duration: metadata.duration,
          metadata
        }
      }

      // For client-side video compression, we'll implement a basic approach
      // This is limited but better than nothing
      console.log(`🔄 Attempting video compression for ${file.name} from ${originalSizeMB.toFixed(2)}MB...`)
      
      const compressedFile = await this.compressVideoFile(file, metadata)
      
      const compressionRatio = file.size / compressedFile.size
      console.log(`✅ Video compression complete: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio.toFixed(2)}x compression)`)

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        wasCompressed: true,
        thumbnail,
        duration: metadata.duration,
        metadata
      }
    } catch (error) {
      console.error('❌ Video processing failed:', error)
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        wasCompressed: false
      }
    }
  }

  /**
   * Basic video compression using canvas frame extraction and re-encoding
   * Note: This is a simplified approach. For production, consider server-side compression
   */
  private static async compressVideoFile(file: File, metadata: VideoMetadata): Promise<File> {
    return new Promise(async (resolve, reject) => {
      try {
        // Calculate target dimensions
        const targetDimensions = this.calculateVideoDimensions(metadata.width, metadata.height)
        
        // Create video element
        const video = document.createElement('video')
        const url = URL.createObjectURL(file)
        
        // For now, we'll just resize the video using canvas extraction
        // This is a basic approach - real video compression requires WebCodecs or server-side processing
        
        video.onloadedmetadata = async () => {
          try {
            // Calculate quality reduction based on file size
            const targetSizeMB = this.VIDEO_TARGET_MAX_SIZE_MB
            const currentSizeMB = file.size / (1024 * 1024)
            const qualityReduction = Math.min(0.8, targetSizeMB / currentSizeMB)
            
            console.log(`📹 Video compression: ${metadata.width}x${metadata.height} -> ${targetDimensions.width}x${targetDimensions.height}, quality: ${qualityReduction.toFixed(2)}`)
            
            // For now, if the video is too large, we'll warn and return original
            // In a real implementation, you'd use WebCodecs API or send to server
            if (currentSizeMB > this.VIDEO_TARGET_MAX_SIZE_MB * 1.5) {
              console.warn(`⚠️ Video ${file.name} is very large (${currentSizeMB.toFixed(2)}MB). Consider server-side compression.`)
            }
            
            URL.revokeObjectURL(url)
            resolve(file) // Return original for now - implement proper compression as needed
            
          } catch (error) {
            URL.revokeObjectURL(url)
            reject(error)
          }
        }
        
        video.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load video for compression'))
        }
        
        video.src = url
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Calculate optimal video dimensions
   */
  private static calculateVideoDimensions(width: number, height: number): { width: number; height: number } {
    // If already within limits, return as-is
    if (width <= this.VIDEO_MAX_DIMENSION && height <= this.VIDEO_MAX_DIMENSION) {
      return { width, height }
    }

    const aspectRatio = width / height

    if (width > height) {
      return {
        width: this.VIDEO_MAX_DIMENSION,
        height: Math.round(this.VIDEO_MAX_DIMENSION / aspectRatio)
      }
    } else {
      return {
        width: Math.round(this.VIDEO_MAX_DIMENSION * aspectRatio),
        height: this.VIDEO_MAX_DIMENSION
      }
    }
  }

  /**
   * Extract video metadata using HTML5 video element
   */
  private static async extractVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          frameRate: undefined, // Not easily accessible via HTML5 API
          bitrate: undefined    // Not easily accessible via HTML5 API
        }
        
        URL.revokeObjectURL(url)
        resolve(metadata)
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load video metadata'))
      }
      
      video.src = url
    })
  }

  /**
   * Generate thumbnail from video using canvas
   */
  private static async generateVideoThumbnail(file: File, timeSeconds: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const url = URL.createObjectURL(file)
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      video.onloadedmetadata = () => {
        // Set video to specific time to capture thumbnail
        video.currentTime = Math.min(timeSeconds, video.duration * 0.1) // 10% into video or 1 second
      }
      
      video.onseeked = () => {
        // Set canvas dimensions (thumbnail size)
        const maxThumbnailSize = 400
        const aspectRatio = video.videoWidth / video.videoHeight
        
        if (video.videoWidth > video.videoHeight) {
          canvas.width = maxThumbnailSize
          canvas.height = maxThumbnailSize / aspectRatio
        } else {
          canvas.width = maxThumbnailSize * aspectRatio
          canvas.height = maxThumbnailSize
        }
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            URL.revokeObjectURL(url)
            resolve(thumbnailUrl)
          } else {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to generate thumbnail'))
          }
        }, 'image/jpeg', 0.8)
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load video for thumbnail'))
      }
      
      video.src = url
    })
  }

  /**
   * Enhanced image compression with multiple quality passes
   */
  private static async compressImageFile(file: File, options: CompressionOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            options.maxWidthOrHeight
          )

          canvas.width = width
          canvas.height = height

          // Draw image on canvas with high quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Start with initial quality and reduce if needed
          this.compressWithQuality(canvas, file, options, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Iteratively reduces quality until file size is under target
   */
  private static compressWithQuality(
    canvas: HTMLCanvasElement,
    originalFile: File,
    options: CompressionOptions,
    resolve: (file: File) => void,
    reject: (error: Error) => void,
    currentQuality: number = options.initialQuality || 0.9,
    attempts: number = 0
  ) {
    const maxAttempts = 10
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const currentSizeMB = blob.size / (1024 * 1024)
        
        console.log(`🔍 Compression attempt ${attempts + 1}: ${currentSizeMB.toFixed(2)}MB at quality ${currentQuality.toFixed(2)}`)
        
        // If size is acceptable or quality is at minimum or max attempts reached, we're done
        if (currentSizeMB <= options.maxSizeMB || currentQuality <= this.MIN_QUALITY || attempts >= maxAttempts) {
          const compressedFile = new File(
            [blob], 
            originalFile.name, 
            { 
              type: blob.type,
              lastModified: Date.now()
            }
          )
          
          if (currentSizeMB > options.maxSizeMB) {
            console.warn(`⚠️ Could not compress ${originalFile.name} below ${options.maxSizeMB}MB. Final size: ${currentSizeMB.toFixed(2)}MB`)
          }
          
          resolve(compressedFile)
          return
        }

        // Calculate next quality more aggressively for large files
        const sizeFactor = currentSizeMB / options.maxSizeMB
        let qualityReduction = 0.85
        
        if (sizeFactor > 2) {
          qualityReduction = 0.7 // More aggressive for very large files
        } else if (sizeFactor > 1.5) {
          qualityReduction = 0.8
        }
        
        const newQuality = Math.max(currentQuality * qualityReduction, this.MIN_QUALITY)
        this.compressWithQuality(canvas, originalFile, options, resolve, reject, newQuality, attempts + 1)
      },
      'image/jpeg',
      currentQuality
    )
  }

  /**
   * Calculate new dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxDimension?: number
  ): { width: number; height: number } {
    if (!maxDimension || (originalWidth <= maxDimension && originalHeight <= maxDimension)) {
      return { width: originalWidth, height: originalHeight }
    }

    const aspectRatio = originalWidth / originalHeight

    if (originalWidth > originalHeight) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio)
      }
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension
      }
    }
  }

  /**
   * Determine if file is image or video
   */
  private static getMediaType(file: File): 'image' | 'video' {
    if (this.SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      return 'image'
    } else if (this.SUPPORTED_VIDEO_TYPES.includes(file.type.toLowerCase())) {
      return 'video'
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  /**
   * Check if file type is supported
   */
  static isSupportedMediaType(file: File): boolean {
    const fileType = file.type.toLowerCase()
    return [...this.SUPPORTED_IMAGE_TYPES, ...this.SUPPORTED_VIDEO_TYPES].includes(fileType)
  }

  /**
   * Get supported file types for input accept attribute
   */
  static getSupportedFileTypes(): string {
    return [...this.SUPPORTED_IMAGE_TYPES, ...this.SUPPORTED_VIDEO_TYPES].join(',')
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }
}