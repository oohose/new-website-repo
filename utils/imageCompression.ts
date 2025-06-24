// utils/imageCompression.ts

interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight?: number
  initialQuality?: number
  useWebWorker?: boolean
}

interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  wasCompressed: boolean
}

export class ImageCompressor {
  private static readonly COMPRESSION_THRESHOLD_MB = 10 // Files larger than this get compressed
  private static readonly TARGET_MAX_SIZE_MB = 9.5 // Target size (slightly under 10MB limit)
  private static readonly MIN_QUALITY = 0.3 // Minimum quality to maintain
  private static readonly MAX_DIMENSION = 4096 // Max width/height for very large images

  /**
   * Compresses an image file if it's over the threshold size
   */
  static async compressIfNeeded(file: File): Promise<CompressionResult> {
    const originalSizeMB = file.size / (1024 * 1024)
    
    // Only compress if file is over threshold
    if (originalSizeMB <= this.COMPRESSION_THRESHOLD_MB) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        wasCompressed: false
      }
    }

    try {
      const compressedFile = await this.compressImage(file, {
        maxSizeMB: this.TARGET_MAX_SIZE_MB,
        maxWidthOrHeight: this.MAX_DIMENSION,
        initialQuality: 0.8
      })

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size / compressedFile.size,
        wasCompressed: true
      }
    } catch (error) {
      console.error('Compression failed, using original file:', error)
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
   * Compresses an image using canvas with iterative quality reduction
   */
  private static async compressImage(file: File, options: CompressionOptions): Promise<File> {
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

          // Draw image on canvas
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
   * Check if file type is supported for compression
   */
  static isSupportedImageType(file: File): boolean {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    return supportedTypes.includes(file.type.toLowerCase())
  }
}