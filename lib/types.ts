// lib/types.ts - Shared type definitions with video support

export interface Image {
  id: string
  title: string
  description?: string | null
  cloudinaryId: string
  url: string
  width?: number | null
  height?: number | null
  format?: string | null
  bytes?: number | null
  isHeader: boolean
  order: number
  categoryId: string
  category?: Category
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Video {
  id: string
  title: string
  description?: string | null
  cloudinaryId: string
  url: string
  thumbnailUrl?: string | null
  width?: number | null
  height?: number | null
  duration?: number | null  // Duration in seconds
  format?: string | null
  bytes?: number | null
  bitrate?: number | null
  frameRate?: number | null
  order: number
  categoryId: string
  category?: Category
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  parentId: string | null
  parent?: {
    id: string
    name: string
    key: string
  } | Category | null
  subcategories: Category[]
  images: Image[]
  videos: Video[]  // Add videos array
  createdAt?: Date | string
  updatedAt?: Date | string
  socialLinks?: any
  _count: { 
    images: number
    videos?: number  // Add video count
    subcategories?: number
  }
  // New properties for better UX
  displayName?: string // For showing indented names in dropdowns
  isSubcategory?: boolean // Whether this is a subcategory
}

export interface UploadFile {
  id: string
  file: File // The file to upload (potentially compressed)
  originalFile: File // The original file for display purposes
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  title: string
  compressedFile?: File
  error?: string
  mediaType: 'image' | 'video'  // Track whether it's image or video
  duration?: number  // For videos
  thumbnail?: string  // For video previews
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date | string
  updatedAt: Date | string
}

// New interfaces for media handling
export interface MediaFile extends UploadFile {
  mediaType: 'image' | 'video'
}

export interface VideoCompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  wasCompressed: boolean
  thumbnail?: string
  duration?: number
}

export interface MediaCompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight?: number
  initialQuality?: number
  mediaType: 'image' | 'video'
}