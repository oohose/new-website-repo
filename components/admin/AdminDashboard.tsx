// ✅ Complete Fixed AdminDashboard.tsx
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
import ImageDeleteButton from '@/components/ImageDeleteButton'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.push('/admin/signin')
      return
    }
    
    // Only fetch data if user is authenticated admin
    refreshDashboardData()
  }, [session, status, router])

  const fetchCategories = async () => {
    try {
      console.log('🔄 Fetching categories...')
      const response = await fetch('/api/categories?includePrivate=true', {
        cache: 'no-store' // Prevent caching during debugging
      })
      
      console.log('📡 Categories API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Categories data received:', data)
        setCategories(data.categories || [])
        return data.categories || []
      } else {
        const errorText = await response.text()
        console.error('❌ Categories API error:', response.status, errorText)
        toast.error(`Failed to fetch categories: ${response.status}`)
        setCategories([])
        return []
      }
    } catch (error: unknown) {
      console.error('❌ Failed to fetch categories:', error)
      toast.error('Failed to fetch categories')
      setCategories([])
      return []
    }
  }

  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching stats...')
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Stats data received:', data)
        setStats(data)
      } else {
        console.error('❌ Stats API error:', response.status)
        // Don't show error for stats as it's not critical
      }
    } catch (error: unknown) {
      console.error('❌ Failed to fetch stats:', error)
      // Don't show error for stats as it's not critical
    }
  }

  const refreshDashboardData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Refreshing dashboard data...')
      const [categoriesData] = await Promise.all([
        fetchCategories(),
        fetchStats()
      ])
      
      // Update stats with actual category count
      setStats(prev => ({
        ...prev,
        totalCategories: categoriesData.length
      }))
      
      console.log('✅ Dashboard data refreshed')
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      console.log('🔄 Updating category:', id, data)
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }
      
      console.log('✅ Category updated successfully')
      toast.success('Category updated successfully!')
      await refreshDashboardData()
    } catch (error: unknown) {
      console.error('❌ Update category error:', error)
      const message = error instanceof Error ? error.message : 'Failed to update category'
      toast.error(message)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      console.log('🔄 Deleting category:', id)
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }
      
      console.log('✅ Category deleted successfully')
      toast.success('Category deleted successfully!')
      await refreshDashboardData()
    } catch (error: unknown) {
      console.error('❌ Delete category error:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete category'
      toast.error(message)
      throw error
    }
  }

  const createCategory = async (data: Partial<Category>) => {
    try {
      console.log('🔄 Creating category:', data)
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }
      
      const result = await response.json()
      console.log('✅ Category created successfully:', result)
      toast.success('Category created successfully!')
      await refreshDashboardData()
      return result.category
    } catch (error: unknown) {
      console.error('❌ Create category error:', error)
      const message = error instanceof Error ? error.message : 'Failed to create category'
      toast.error(message)
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
    if (loading && activeTab !== 'overview') {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
              <p className="text-gray-400">Manage your photography portfolio</p>
            </div>
            
            {/* Debug Info */}
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
              <h3 className="text-yellow-400 font-medium mb-2">Debug Information</h3>
              <div className="text-sm text-yellow-200 space-y-1">
                <p>Session status: {status}</p>
                <p>User role: {(session?.user as any)?.role || 'None'}</p>
                <p>Categories loaded: {categories.length}</p>
                <p>Loading state: {loading ? 'Yes' : 'No'}</p>
                <p>Last update: {new Date().toLocaleTimeString()}</p>
                <button
                  onClick={refreshDashboardData}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-black rounded text-xs hover:bg-yellow-500"
                >
                  Refresh Data
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Images" value={stats.totalImages} icon={ImageIcon} color="blue" />
              <StatCard title="Categories" value={categories.length} icon={FolderPlus} color="green" />
              <StatCard title="Total Views" value={stats.totalViews} icon={Eye} color="purple" />
              <StatCard title="Storage Used" value={stats.storageUsed} icon={BarChart3} color="orange" />
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionButton 
                  icon={Upload} 
                  title="Upload Photos" 
                  description="Add new photos to your portfolio" 
                  onClick={() => setActiveTab('upload')} 
                />
                <QuickActionButton 
                  icon={FolderPlus} 
                  title="Create Category" 
                  description="Organize your work into categories" 
                  onClick={() => setActiveTab('categories')} 
                />
                <QuickActionButton 
                  icon={Settings} 
                  title="Site Settings" 
                  description="Update your site configuration" 
                  onClick={() => setActiveTab('settings')} 
                />
              </div>
            </div>

            {/* Recent Categories */}
            {categories.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.slice(0, 6).map((category) => (
                    <div key={category.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{category.name}</h4>
                        {category.isPrivate && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {category._count?.images || 0} images
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        /{category.key}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      case 'upload':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Upload Photos</h2>
              <p className="text-gray-400 mb-4">Add new photos to your portfolio</p>
            </div>
            
            {categories.length === 0 ? (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
                <h3 className="text-yellow-400 font-medium mb-2">No Categories Available</h3>
                <p className="text-yellow-200 mb-4">
                  You need to create at least one category before uploading photos.
                </p>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Category First
                </button>
              </div>
            ) : (
              <CloudinaryUpload categories={categories} onUploadComplete={refreshDashboardData} />
            )}
          </div>
        )
      case 'images':
        return <ImageManager categories={categories} refresh={refreshDashboardData} />
      case 'categories':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Category Management</h2>
              <p className="text-gray-400 mb-4">Create and organize your photo categories</p>
            </div>
            <CategoryManager 
              categories={categories} 
              onUpdate={updateCategory} 
              onDelete={deleteCategory} 
              onCreate={createCategory} 
            />
          </div>
        )
      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
              <p className="text-gray-400 mb-4">System settings and maintenance</p>
            </div>
            <AdminImageSync refresh={refreshDashboardData} />
          </div>
        )
      default:
        return null
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized if not admin
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this area.</p>
          <button
            onClick={() => router.push('/admin/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ✅ Add top padding to account for fixed navigation */}
      <div className="pt-16 lg:pt-20">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-800 min-h-screen">
            <nav className="p-4">
              <div className="mb-6">
                <h1 className="text-white text-lg font-semibold">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Welcome back, {(session?.user as any)?.name || 'Admin'}</p>
              </div>
              
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

              {/* Quick Stats in Sidebar */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Categories:</span>
                    <span>{categories.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Images:</span>
                    <span>{stats.totalImages}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Storage:</span>
                    <span>{stats.storageUsed}</span>
                  </div>
                </div>
              </div>
            </nav>
          </aside>
          
          {/* ✅ Main content with proper spacing */}
          <main className="flex-1 p-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: 'blue' | 'green' | 'purple' | 'orange' 
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
  }
  
  return (
    <div className="bg-gray-800 rounded-lg p-6">
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
      className="bg-gray-700 rounded-lg p-4 text-left hover:bg-gray-600 transition-colors"
    >
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-5 h-5 text-blue-400" />
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  )
}