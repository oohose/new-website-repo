// lib/types.ts - Shared type definitions to avoid conflicts

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
  createdAt?: Date | string
  updatedAt?: Date | string
  socialLinks?: any
  _count: { 
    images: number
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
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date | string
  updatedAt: Date | string
}