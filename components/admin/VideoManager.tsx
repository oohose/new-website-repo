/* VideoManager.tsx - Complete Video management component */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Grid,
  List,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Play,
  Clock,
  FileVideo
} from 'lucide-react'
import toast from 'react-hot-toast'
import ModalWrapper from '@/components/ui/ModalWrapper'
import { Category, Video } from '@/lib/types'

interface VideoManagerProps {
  categories: Category[]
  refresh?: () => Promise<void>
}

interface VideoWithCategory extends Video {
  category: Category
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

function VideoEditModal({ video, onClose, onSave, isSaving }: {
  video: VideoWithCategory
  onClose: () => void
  onSave: (id: string, data: Partial<VideoWithCategory>) => void
  isSaving: boolean
}) {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description || '',
    order: video.order || 0,
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(video.id, formData)
  }

  return (
    <ModalWrapper isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Video</h3>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          placeholder="Title"
        />

        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          placeholder="Description"
          rows={3}
        />

        <input
          type="number"
          value={formData.order}
          onChange={(e) => handleChange('order', parseInt(e.target.value))}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-24"
          placeholder="Order"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

function VideoDeleteButton({ videoId, videoName, onDelete, size = 'md' }: {
  videoId: string
  videoName: string
  onDelete: () => void
  size?: 'sm' | 'md'
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await onDelete()
      setShowConfirm(false)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const buttonClasses = size === 'sm' 
    ? 'flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium'
    : 'inline-flex items-center px-4 py-2 text-sm font-medium'

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className={`${buttonClasses} text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors`}
      >
        <Trash2 className={`${size === 'sm' ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
        Delete
      </button>
    )
  }

  return (
    <div className="flex space-x-1">
      <button
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
        className={`${buttonClasses} text-gray-300 bg-gray-600/20 border border-gray-500/30 rounded-md hover:bg-gray-600/30 transition-colors disabled:opacity-50`}
      >
        Cancel
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`${buttonClasses} text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors disabled:opacity-50`}
      >
        {isDeleting ? (
          <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-1" />
        ) : (
          <Trash2 className={`${size === 'sm' ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
        )}
        {isDeleting ? 'Deleting...' : 'Confirm'}
      </button>
    </div>
  )
}

export default function VideoManager({ categories }: VideoManagerProps) {
  const [videos, setVideos] = useState<VideoWithCategory[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoWithCategory[]>([])
  const [editVideo, setEditVideo] = useState<VideoWithCategory | null>(null)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPrivateOnly, setShowPrivateOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isSaving, setIsSaving] = useState(false)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    let result = videos
    if (searchTerm) {
      result = result.filter(video => video.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (selectedCategory !== 'all') {
      result = result.filter(video => video.categoryId === selectedCategory)
    }
    if (showPrivateOnly) {
      result = result.filter(video => video.category.isPrivate)
    }
    setFilteredVideos(result)
  }, [videos, searchTerm, selectedCategory, showPrivateOnly])

  const fetchVideos = async () => {
    try {
      console.log('🎥 Fetching videos from API...')
      const res = await fetch('/api/videos?includePrivate=true')
      const data = await res.json()
      
      console.log('🎥 Video API response:', {
        success: data.success,
        videosCount: data.videos?.length || 0,
        videos: data.videos || []
      })
      
      if (data.success && data.videos) {
        setVideos(data.videos)
        console.log('✅ Videos loaded successfully:', data.videos.length)
      } else {
        console.error('❌ Failed to fetch videos:', data.error || 'Unknown error')
        setVideos([])
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error)
      toast.error('Failed to fetch videos')
      setVideos([])
    }
  }

  const handleVideoUpdate = async (id: string, data: Partial<VideoWithCategory>) => {
    try {
      setIsSaving(true)
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to update video`)
      }
      
      const updated = await res.json()
      setVideos(prev => prev.map(video => (video.id === id ? { ...video, ...updated.video } : video)))
      toast.success('Video updated')
      setEditVideo(null)
    } catch (error: any) {
      console.error('Video update error:', error)
      toast.error(`Update failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to delete video`)
      }
      
      setVideos(prev => prev.filter(video => video.id !== id))
      toast.success('Video deleted')
    } catch (error: any) {
      console.error('Video delete error:', error)
      toast.error(`Delete failed: ${error.message}`)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const res = await fetch('/api/videos/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: Array.from(selectedVideos) }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Bulk delete failed`)
      }
      
      const result = await res.json()
      setVideos(prev => prev.filter(video => !selectedVideos.has(video.id)))
      setSelectedVideos(new Set())
      toast.success(`${result.deletedCount} videos deleted`)
      setShowBulkDelete(false)
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(`Bulk delete failed: ${error.message}`)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const toggleSelect = (videoId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedVideos(new Set())
    }
    setIsSelectMode(!isSelectMode)
  }

  const selectAll = () => {
    const allVideoIds = new Set(filteredVideos.map(video => video.id))
    setSelectedVideos(allVideoIds)
  }

  const selectNone = () => {
    setSelectedVideos(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Video Manager</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleSelectMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelectMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isSelectMode ? 'Cancel Selection' : 'Select Videos'}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Selection controls */}
      {isSelectMode && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">
                Selected: {selectedVideos.size} of {filteredVideos.length}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-gray-500">|</span>
                <button
                  onClick={selectNone}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {selectedVideos.size > 0 && (
              <button
                onClick={() => setShowBulkDelete(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-300 bg-red-600/20 border border-red-500/30 rounded-md hover:bg-red-600/30 hover:border-red-500/50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedVideos.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setShowPrivateOnly(!showPrivateOnly)}
          className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            showPrivateOnly 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
          }`}
        >
          {showPrivateOnly ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showPrivateOnly ? 'Private Only' : 'Show Private'}
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-400">
        Showing {filteredVideos.length} of {videos.length} videos
      </div>

      {/* Videos grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredVideos.map(video => (
          <div 
            key={video.id} 
            className={`bg-gray-800 border rounded-lg overflow-hidden relative transition-all duration-200 ${
              selectedVideos.has(video.id) 
                ? 'ring-2 ring-blue-500 bg-gray-750' 
                : 'border-gray-700 hover:border-gray-600'
            } ${isSelectMode ? 'cursor-pointer' : ''}`}
            onClick={isSelectMode ? (e) => toggleSelect(video.id, e) : undefined}
          >
            {/* Selection indicator */}
            {isSelectMode && (
              <div className="absolute top-2 left-2 z-10 bg-black/70 p-2 rounded-full pointer-events-none">
                {selectedVideos.has(video.id) ? (
                  <CheckSquare className="text-blue-400 w-5 h-5" />
                ) : (
                  <Square className="text-white w-5 h-5" />
                )}
              </div>
            )}

            {/* Private indicator */}
            {video.category.isPrivate && (
              <div className="absolute top-2 right-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                <EyeOff className="w-3 h-3" />
              </div>
            )}

            {/* Selection overlay */}
            {isSelectMode && (
              <div className={`absolute inset-0 z-20 transition-all duration-200 pointer-events-none ${
                selectedVideos.has(video.id) 
                  ? 'bg-blue-500/30' 
                  : 'bg-transparent hover:bg-white/10'
              }`} />
            )}

            {/* Video thumbnail */}
            <div className="relative aspect-video bg-gray-900">
              {video.thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <FileVideo className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {/* Duration badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(video.duration)}</span>
                </div>
              )}
            </div>

            {/* Video info and actions */}
            <div 
              className="p-3"
              onClick={!isSelectMode ? undefined : (e) => e.stopPropagation()}
            >
              <div className="text-sm text-white">
                <div className="font-semibold truncate mb-1">{video.title}</div>
                <div className="text-xs text-gray-400 mb-2">{video.category.name}</div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  {video.width && video.height ? (
                    <span>{video.width} × {video.height}</span>
                  ) : (
                    <span>Unknown size</span>
                  )}
                </div>

                {/* File info */}
                <div className="text-xs text-gray-500 mb-3">
                  {video.bytes && (
                    <span>{formatFileSize(video.bytes)}</span>
                  )}
                  {video.format && (
                    <span className="ml-2">• {video.format.toUpperCase()}</span>
                  )}
                </div>

                {/* Action buttons - only show when not in select mode */}
                {!isSelectMode && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditVideo(video)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-300 bg-blue-600/20 border border-blue-500/30 rounded-md hover:bg-blue-600/30 hover:border-blue-500/50 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <VideoDeleteButton
                      videoId={video.id}
                      videoName={video.title}
                      onDelete={() => handleDelete(video.id)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No videos found</div>
          <div className="text-gray-500 text-sm">
            {searchTerm || selectedCategory !== 'all' || showPrivateOnly
              ? 'Try adjusting your filters'
              : 'Upload some videos to get started'
            }
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editVideo && (
        <VideoEditModal
          video={editVideo}
          onClose={() => setEditVideo(null)}
          onSave={handleVideoUpdate}
          isSaving={isSaving}
        />
      )}

      {/* Bulk Delete Modal */}
      <ModalWrapper isOpen={showBulkDelete} onClose={() => setShowBulkDelete(false)}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-white text-lg font-bold">Confirm Bulk Delete</h3>
          </div>
          
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete <strong>{selectedVideos.size}</strong> selected videos? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBulkDelete(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isBulkDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedVideos.size} Videos
                </>
              )}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  )
}