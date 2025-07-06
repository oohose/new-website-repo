// utils/deleteMediaHelper.ts - Helper function for deleting media with auto-refresh
import toast from 'react-hot-toast'

interface DeleteMediaParams {
  mediaId: string
  mediaType: 'image' | 'video'
  categoryKey: string
  title?: string
}

export async function deleteMedia({ mediaId, mediaType, categoryKey, title }: DeleteMediaParams) {
  try {
    console.log('🗑️ Deleting media:', { mediaId, mediaType, title })
    
    const response = await fetch(`/api/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Delete failed')
    }

    if (result.success) {
      console.log('✅ Media deleted successfully:', result.data)
      
      // Show success message
      toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} deleted successfully`)
      
      // Dispatch delete success event for auto-refresh
      const deleteEvent = new CustomEvent('deleteSuccess', {
        detail: {
          mediaId,
          mediaType,
          categoryKey,
          title,
          timestamp: Date.now()
        }
      })
      window.dispatchEvent(deleteEvent)
      
      return { success: true, data: result.data }
    } else {
      throw new Error(result.error || 'Delete failed')
    }

  } catch (error: any) {
    console.error('❌ Delete media failed:', error)
    toast.error(`Failed to delete ${mediaType}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Example usage in your admin components:
/*
import { deleteMedia } from '@/utils/deleteMediaHelper'

// In your component:
const handleDeleteMedia = async () => {
  const result = await deleteMedia({
    mediaId: 'your-media-id',
    mediaType: 'image', // or 'video'
    categoryKey: 'your-category-key',
    title: 'Media Title'
  })
  
  if (result.success) {
    // Gallery will auto-refresh via event listener
    console.log('Media deleted and gallery will refresh automatically')
  }
}
*/