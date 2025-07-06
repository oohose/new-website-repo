// ✅ Updated AdminDashboard.tsx with video support
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BarChart3, Upload, FolderPlus, Image as ImageIcon, Settings, Eye, Video as VideoIcon
} from 'lucide-react'
import { CategoryManager } from '@/components/admin/InlineEditComponents'
import AdminImageSync from '@/components/admin/AdminImageSync'
import ImageManager from '@/components/admin/ImageManager'
import VideoManager from '@/components/admin/VideoManager'
import CloudinaryUpload from '@/components/admin/CloudinaryUpload'
import { Category } from '@/lib/types'

interface AdminDashboardProps {
  children?: React.ReactNode
}

export default function AdminDashboard({ children }: AdminDashboardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalImages: 0,
    totalVideos: 0,
    totalCategories: 0,
    totalViews: 0,
    storageUsed: '0 MB'
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.push('/admin/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      refreshDashboardData()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      console.log('🔍 Starting to fetch categories...')
      const response = await fetch('/api/categories?includePrivate=true')
      console.log('📡 Categories API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Raw API response data:', data)
        
        let fetchedCategories = []
        
        if (Array.isArray(data)) {
          fetchedCategories = data
          console.log('✅ API returned categories as direct array')
        } else if (data.categories && Array.isArray(data.categories)) {
          fetchedCategories = data.categories
          console.log('✅ API returned categories in categories property')
        } else {
          console.warn('⚠️ Unexpected API response format:', data)
          fetchedCategories = []
        }
        
        console.log('📊 Number of top-level categories processed:', fetchedCategories.length)
        
        // Extract all categories (including subcategories) for dropdown usage
        const allCats: Category[] = []
        
        const addCategoriesRecursively = (cats: Category[], level = 0) => {
          cats.forEach(cat => {
            allCats.push({
              ...cat,
              displayName: '  '.repeat(level) + cat.name
            })
            
            if (cat.subcategories && cat.subcategories.length > 0) {
              addCategoriesRecursively(cat.subcategories, level + 1)
            }
          })
        }
        
        addCategoriesRecursively(fetchedCategories)
        
        console.log('📊 Total categories (including subcategories):', allCats.length)
        
        if (fetchedCategories.length > 0) {
          fetchedCategories.forEach((cat: Category, index: number) => {
            console.log(`📁 Category ${index + 1}:`, {
              id: cat.id,
              name: cat.name,
              key: cat.key,
              isPrivate: cat.isPrivate,
              parentId: cat.parentId,
              subcategoriesCount: cat.subcategories?.length || 0,
              _count: cat._count
            })
          })
        }
        
        console.log('💾 Setting categories state to:', fetchedCategories)
        setCategories(fetchedCategories)
        setAllCategories(allCats)
        
      } else {
        console.error('❌ Failed to fetch categories, status:', response.status)
        const responseText = await response.text()
        console.error('❌ Error response body:', responseText)
      }
    } catch (error: unknown) {
      console.error('💥 Exception while fetching categories:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch both images and videos to calculate stats
      const [imagesRes, videosRes, categoriesRes] = await Promise.all([
        fetch('/api/images?includePrivate=true'),
        fetch('/api/videos?includePrivate=true'),
        fetch('/api/categories?includePrivate=true')
      ])
      
      const [imagesData, videosData, categoriesData] = await Promise.all([
        imagesRes.json(),
        videosRes.json(),
        categoriesRes.json()
      ])
      
      const totalImages = imagesData.images?.length || 0
      const totalVideos = videosData.videos?.length || 0
      const totalCategories = Array.isArray(categoriesData) ? categoriesData.length : categoriesData.categories?.length || 0
      
      // Calculate storage used (basic calculation)
      const totalImagesSize = imagesData.images?.reduce((total: number, img: any) => 
        total + (img.bytes || 0), 0) || 0
      const totalVideosSize = videosData.videos?.reduce((total: number, vid: any) => 
        total + (vid.bytes || 0), 0) || 0
      const totalSize = totalImagesSize + totalVideosSize
      const storageMB = (totalSize / (1024 * 1024)).toFixed(1)
      
      setStats({
        totalImages,
        totalVideos,
        totalCategories,
        totalViews: 0, // This would come from analytics
        storageUsed: `${storageMB} MB`
      })
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const refreshDashboardData = async () => {
    await Promise.all([fetchCategories()])
    await fetchStats() // Fetch stats after categories are loaded
  }

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update category')
      await refreshDashboardData()
    } catch (error: unknown) {
      console.error('Update category error:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Delete API Error:', response.status, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete category`)
      }
      
      await refreshDashboardData()
    } catch (error: unknown) {
      console.error('Delete category error:', error)
      throw error
    }
  }

  const createCategory = async (data: Partial<Category>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }
      await refreshDashboardData()
      const result = await response.json()
      return result.category
    } catch (error: unknown) {
      console.error('Create category error:', error)
      throw error
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'upload', label: 'Upload Media', icon: Upload },
    { id: 'images', label: 'Manage Images', icon: ImageIcon },
    { id: 'videos', label: 'Manage Videos', icon: VideoIcon },
    { id: 'categories', label: 'Categories', icon: FolderPlus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
              <p className="text-gray-400">Manage your photography and videography portfolio</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard title="Total Images" value={stats.totalImages} icon={ImageIcon} color="blue" />
              <StatCard title="Total Videos" value={stats.totalVideos} icon={VideoIcon} color="purple" />
              <StatCard title="Categories" value={stats.totalCategories} icon={FolderPlus} color="green" />
              <StatCard title="Total Views" value={stats.totalViews} icon={Eye} color="orange" />
              <StatCard title="Storage Used" value={stats.storageUsed} icon={BarChart3} color="red" />
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <QuickActionButton 
                  icon={Upload} 
                  title="Upload Media" 
                  description="Add new photos and videos" 
                  onClick={() => setActiveTab('upload')} 
                />
                <QuickActionButton 
                  icon={ImageIcon} 
                  title="Manage Images" 
                  description="Edit and organize photos" 
                  onClick={() => setActiveTab('images')} 
                />
                <QuickActionButton 
                  icon={VideoIcon} 
                  title="Manage Videos" 
                  description="Edit and organize videos" 
                  onClick={() => setActiveTab('videos')} 
                />
                <QuickActionButton 
                  icon={FolderPlus} 
                  title="Create Category" 
                  description="Organize your work" 
                  onClick={() => setActiveTab('categories')} 
                />
              </div>
            </div>
          </div>
        )
      case 'upload':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-2">Upload Media</h2>
            <p className="text-gray-400 mb-4">Add new photos and videos to your portfolio</p>
            <CloudinaryUpload 
              categories={allCategories} 
              onUploadComplete={refreshDashboardData} 
            />
          </div>
        )
      case 'images':
        return (
          <ImageManager 
            categories={allCategories} 
            refresh={refreshDashboardData} 
          />
        )
      case 'videos':
        return (
          <VideoManager 
            categories={allCategories} 
            refresh={refreshDashboardData} 
          />
        )
      case 'categories':
        return (
          <CategoryManager 
            categories={allCategories}
            onUpdate={updateCategory} 
            onDelete={deleteCategory} 
            onCreate={createCategory} 
          />
        )
      case 'settings':
        return <AdminImageSync refresh={refreshDashboardData} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-screen fixed left-0 top-0 z-10">
          <nav className="p-4 pt-20">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </aside>
        <main className="flex-1 ml-64 pt-20 p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' 
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
  }
  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon: Icon, title, description, onClick }: { 
  icon: any; 
  title: string; 
  description: string; 
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick} 
      className="bg-gray-700 rounded-lg p-6 text-left hover:bg-gray-600 transition-colors h-full"
    >
      <div className="flex items-center space-x-3 mb-3">
        <Icon className="w-6 h-6 text-blue-400" />
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </button>
  )
}