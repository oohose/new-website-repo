'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  FolderPlus, 
  Image as ImageIcon, 
  Settings, 
  Users, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { siteConfig } from '@/config/site'
import CloudinaryUpload from './CloudinaryUpload'
import { CategoryManager } from './InlineEditComponents'

interface Category {
  id: string
  key: string
  name: string
  description: string | null
  isPrivate: boolean
  images: any[]
  subcategories: any[]
  _count: { images: number }
}

interface AdminDashboardProps {
  children?: React.ReactNode
}

export default function AdminDashboard({ children }: AdminDashboardProps) {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalImages: 0,
    totalCategories: 0,
    totalViews: 0,
    storageUsed: '0 MB'
  })
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    // Fetch categories and stats when component mounts
    if (session?.user?.role === 'ADMIN') {
      fetchCategories()
      fetchStats()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includePrivate=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'upload', label: 'Upload Photos', icon: Upload },
    { id: 'galleries', label: 'Manage Galleries', icon: ImageIcon },
    { id: 'categories', label: 'Categories', icon: FolderPlus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  // API functions for category management
  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update category')

      // Update local state
      setCategories(prev => 
        prev.map(cat => cat.id === id ? { ...cat, ...data } : cat)
      )
    } catch (error) {
      console.error('Update category error:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')

      // Remove from local state
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (error) {
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

      const result = await response.json()
      
      // Add to local state
      setCategories(prev => [...prev, result.category])
      return result.category
    } catch (error) {
      console.error('Create category error:', error)
      throw error
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={stats} />
      
      case 'upload':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Upload Photos</h2>
              <p className="text-gray-400 mb-8">Add new photos to your portfolio</p>
              
              <CloudinaryUpload
                maxFiles={20}
                onUploadComplete={(results) => {
                  console.log('Upload complete:', results)
                  fetchStats() // Refresh stats after upload
                }}
              />
            </div>
          </div>
        )
      
      case 'galleries':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Manage Galleries</h2>
              <p className="text-gray-400 mb-8">View and organize your photo galleries</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{category.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {category.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">
                        {category._count?.images || 0} photos
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          Edit
                        </button>
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'categories':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Manage Categories</h2>
              <p className="text-gray-400 mb-8">Create and organize your photo categories</p>
              
              <CategoryManager
                categories={categories}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
                onCreate={createCategory}
              />
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Site Settings</h2>
              <p className="text-gray-400 mb-8">Configure your photography website</p>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Site Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      defaultValue={siteConfig.name}
                      className="form-input"
                      placeholder="Your site name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description
                    </label>
                    <textarea
                      defaultValue={siteConfig.description}
                      className="form-textarea"
                      rows={3}
                      placeholder="Site description"
                    />
                  </div>
                  <button className="btn-primary">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return <div className="text-white">Select a tab</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">
                {siteConfig.name} - Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <a
                href="/"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Site
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-screen">
          <nav className="p-4">
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

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function AdminOverview({ stats }: { stats: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">Manage your photography portfolio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Images"
          value={stats.totalImages}
          icon={ImageIcon}
          color="blue"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          icon={FolderPlus}
          color="green"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Storage Used"
          value={stats.storageUsed}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            icon={Upload}
            title="Upload Photos"
            description="Add new photos to your portfolio"
            onClick={() => {}}
          />
          <QuickActionButton
            icon={FolderPlus}
            title="Create Category"
            description="Organize your work into categories"
            onClick={() => {}}
          />
          <QuickActionButton
            icon={Settings}
            title="Site Settings"
            description="Update your site configuration"
            onClick={() => {}}
          />
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
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
  icon: any
  title: string
  description: string
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