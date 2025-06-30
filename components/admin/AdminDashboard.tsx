// ✅ Fixed AdminDashboard.tsx with proper navbar spacing and improved layout
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BarChart3, Upload, FolderPlus, Image as ImageIcon, Settings, Eye
} from 'lucide-react'
import { CategoryManager } from '@/components/admin/InlineEditComponents'
import AdminImageSync from '@/components/admin/AdminImageSync'
import ImageManager from '@/components/admin/ImageManager'
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
    totalCategories: 0,
    totalViews: 0,
    storageUsed: '0 MB'
  })
  const [categories, setCategories] = useState<Category[]>([])

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
      
      // FIX: Handle both response formats
      let fetchedCategories = []
      
      if (Array.isArray(data)) {
        // If the response is directly an array of categories
        fetchedCategories = data
        console.log('✅ API returned categories as direct array')
      } else if (data.categories && Array.isArray(data.categories)) {
        // If the response has a 'categories' property
        fetchedCategories = data.categories
        console.log('✅ API returned categories in categories property')
      } else {
        console.warn('⚠️ Unexpected API response format:', data)
        fetchedCategories = []
      }
      
      console.log('📊 Number of categories processed:', fetchedCategories.length)
      
      if (fetchedCategories.length > 0) {
        // Log each category for debugging
        fetchedCategories.forEach((cat: Category, index: number) => {
          console.log(`📁 Category ${index + 1}:`, {
            id: cat.id,
            name: cat.name,
            key: cat.key,
            isPrivate: cat.isPrivate,
            parentId: cat.parentId,
            _count: cat._count
          })
        })
      }
      
      console.log('💾 Setting categories state to:', fetchedCategories)
      setCategories(fetchedCategories)
      
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
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const refreshDashboardData = async () => {
    await Promise.all([fetchStats(), fetchCategories()])
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
    { id: 'upload', label: 'Upload Photos', icon: Upload },
    { id: 'images', label: 'Manage Images', icon: ImageIcon },
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
              <p className="text-gray-400">Manage your photography portfolio</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Images" value={stats.totalImages} icon={ImageIcon} color="blue" />
              <StatCard title="Categories" value={stats.totalCategories} icon={FolderPlus} color="green" />
              <StatCard title="Total Views" value={stats.totalViews} icon={Eye} color="purple" />
              <StatCard title="Storage Used" value={stats.storageUsed} icon={BarChart3} color="orange" />
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionButton icon={Upload} title="Upload Photos" description="Add new photos to your portfolio" onClick={() => setActiveTab('upload')} />
                <QuickActionButton icon={FolderPlus} title="Create Category" description="Organize your work into categories" onClick={() => setActiveTab('categories')} />
                <QuickActionButton icon={Settings} title="Site Settings" description="Update your site configuration" onClick={() => setActiveTab('settings')} />
              </div>
            </div>
          </div>
        )
      case 'upload':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-2">Upload Photos</h2>
            <p className="text-gray-400 mb-4">Add new photos to your portfolio</p>
            <CloudinaryUpload categories={categories} onUploadComplete={refreshDashboardData} />
          </div>
        )
      case 'images':
        return <ImageManager categories={categories} refresh={refreshDashboardData} />
      case 'categories':
        return <CategoryManager categories={categories} onUpdate={updateCategory} onDelete={deleteCategory} onCreate={createCategory} />
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
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

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: 'blue' | 'green' | 'purple' | 'orange' }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
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

function QuickActionButton({ icon: Icon, title, description, onClick }: { icon: any; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-gray-700 rounded-lg p-6 text-left hover:bg-gray-600 transition-colors h-full">
      <div className="flex items-center space-x-3 mb-3">
        <Icon className="w-6 h-6 text-blue-400" />
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </button>
  )
}