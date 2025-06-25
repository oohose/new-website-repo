// lib/types.ts - Shared type definitions to avoid conflicts

export interface Image {
  id: string
  title: string
  cloudinaryId: string
  url: string
  categoryId: string
  category?: Category
  order: number
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
  images: Image[]
  subcategories: Category[]
  parent?: Category | null
  _count: { images: number }
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface UploadFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  title: string
  compressedFile?: File
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date | string
  updatedAt: Date | string
}