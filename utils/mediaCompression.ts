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
  private static readonly IMAGE_COMPRESSION_THRESHOLD_MB = 10 // Files larger than this get compressed
  private static readonly VIDEO_COMPRESSION_THRESHOLD_MB = 100 // Videos larger than this get compressed
  private static readonly IMAGE_TARGET_MAX_SIZE_MB = 9.5 // Target size for images
  private static readonly VIDEO_TARGET_MAX_SIZE_MB = 95 // Target size for videos
  private static readonly MIN_QUALITY = 0.3 // Minimum quality to maintain
  private static readonly MAX_DIMENSION = 4096 // Max width/height for very large files
  
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
    
    if (mediaType === 'image') {
      return this.compressImage(file, originalSizeMB)
    } else if (mediaType === 'video') {
      return this.compressVideo(file, originalSizeMB)
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  /**
   * Compress image files
   */
  private static async compressImage(file: File, originalSizeMB: number): Promise<CompressionResult> {
    // Only compress if file is over threshold
    if (originalSizeMB <= this.IMAGE_COMPRESSION_THRESHOLD_MB) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        wasCompressed: false
      }
    }

    try {
      const compressedFile = await this.compressImageFile(file, {
        maxSizeMB: this.IMAGE_TARGET_MAX_SIZE_MB,
        maxWidthOrHeight: this.MAX_DIMENSION,
        initialQuality: 0.8,
        mediaType: 'image'
      })

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size / compressedFile.size,
        wasCompressed: true
      }
    } catch (error) {
      console.error('Image compression failed, using original file:', error)
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
   * Handle video files (currently just validates size and extracts metadata)
   */
  private static async compressVideo(file: File, originalSizeMB: number): Promise<CompressionResult> {
    try {
      // Extract video metadata and thumbnail
      const metadata = await this.extractVideoMetadata(file)
      const thumbnail = await this.generateVideoThumbnail(file)
      
      // For now, we don't compress videos client-side as it's computationally expensive
      // Cloudinary will handle video optimization server-side
      if (originalSizeMB > this.VIDEO_COMPRESSION_THRESHOLD_MB) {
        console.warn(`Video file ${file.name} is ${originalSizeMB.toFixed(1)}MB, which exceeds the 100MB limit`)
        // You could throw an error here or let Cloudinary handle it
      }

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
    } catch (error) {
      console.error('Video processing failed:', error)
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
        // Set canvas dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
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
   * Compress image using canvas (from your existing imageCompression.ts)
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
    currentQuality: number = options.initialQuality || 0.8
  ) {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const currentSizeMB = blob.size / (1024 * 1024)
        
        // If size is acceptable or quality is at minimum, we're done
        if (currentSizeMB <= options.maxSizeMB || currentQuality <= this.MIN_QUALITY) {
          const compressedFile = new File(
            [blob], 
            originalFile.name, 
            { 
              type: blob.type,
              lastModified: Date.now()
            }
          )
          resolve(compressedFile)
          return
        }

        // Reduce quality and try again
        const newQuality = Math.max(currentQuality * 0.85, this.MIN_QUALITY)
        this.compressWithQuality(canvas, originalFile, options, resolve, reject, newQuality)
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