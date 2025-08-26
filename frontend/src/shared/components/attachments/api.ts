import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

export interface Attachment {
  id: number
  attachment_type: 'file' | 'link'
  file: string | null
  link_url: string | null
  original_filename: string
  file_size: number | null
  file_size_human: string
  content_type_header: string | null
  file_extension: string
  is_image: boolean
  is_document: boolean
  description: string
  uploaded_at: string
  updated_at: string
  uploaded_by_name: string
  uploaded_by_email: string
  file_url: string
  download_url: string
  entity_type: string
  entity_id: number
  is_active: boolean
}

export interface AttachmentUploadData {
  attachment_type?: 'file' | 'link'
  file?: File
  link_url?: string
  title?: string
  description?: string
  entity_type: string
  entity_id: number
}

// Query keys
export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (entityType: string, entityId: number) => [...attachmentKeys.lists(), entityType, entityId] as const,
  details: () => [...attachmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...attachmentKeys.details(), id] as const,
}

// Helper function to get API URL
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/attachments/`
  console.log('🔍 Attachments API URL:', apiUrl)
  return apiUrl
}

// API functions
export const attachmentApi = {
  // Get attachments for entity
  getAttachments: async (entityType: string, entityId: number): Promise<Attachment[]> => {
    try {
      const url = `${getApiUrl()}${entityType}/${entityId}/`
      console.log('🔍 Fetching attachments from:', url)
      
      const response = await axios.get(url)
      console.log('🔍 Attachments response:', response.data)
      
      return response.data.results || response.data
    } catch (error) {
      console.error('❌ Error fetching attachments:', error)
      throw error
    }
  },


  // Upload attachment (file or link)
  uploadAttachment: async (data: AttachmentUploadData): Promise<Attachment> => {
    try {
      const url = `${getApiUrl()}${data.entity_type}/${data.entity_id}/`
      console.log('🔍 Uploading attachment to:', url)

      // Always use FormData for both files and links
      const requestData = new FormData()
      
      if (data.attachment_type === 'link') {
        // For links, send as form data
        requestData.append('attachment_type', 'link')
        if (data.link_url) {
          requestData.append('link_url', data.link_url)
        }
        if (data.title && data.title.trim()) {
          requestData.append('title', data.title.trim())
        }
        if (data.description && data.description.trim()) {
          requestData.append('description', data.description.trim())
        }
      } else {
        // For files, send as form data
        if (data.file) {
          requestData.append('file', data.file)
        }
        requestData.append('attachment_type', data.attachment_type || 'file')
        if (data.description && data.description.trim()) {
          requestData.append('description', data.description.trim())
        }
      }


      const response = await axios.post(url, requestData, {
        headers: {
          'Content-Type': undefined, // Let browser set Content-Type with boundary for FormData
        },
      })
      
      console.log('🔍 Upload response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error uploading attachment:', error)
      throw error
    }
  },

  // Update attachment
  updateAttachment: async (id: number, data: Partial<Pick<Attachment, 'description' | 'link_url' | 'is_active'>>): Promise<Attachment> => {
    try {
      const url = `${getApiUrl()}${id}/`
      const response = await axios.patch(url, data)
      return response.data
    } catch (error) {
      console.error('❌ Error updating attachment:', error)
      throw error
    }
  },

  // Delete attachment
  deleteAttachment: async (id: number): Promise<void> => {
    try {
      const url = `${getApiUrl()}${id}/`
      await axios.delete(url)
    } catch (error) {
      console.error('❌ Error deleting attachment:', error)
      throw error
    }
  },

  // Download attachment
  downloadAttachment: async (id: number): Promise<Blob> => {
    try {
      const url = `${getApiUrl()}${id}/download/`
      const response = await axios.get(url, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('❌ Error downloading attachment:', error)
      throw error
    }
  },

  // Preview attachment (for text/metadata)
  previewAttachment: async (id: number, size?: string): Promise<any> => {
    try {
      const url = `${getApiUrl()}${id}/preview/${size ? `?size=${size}` : ''}`
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error previewing attachment:', error)
      throw error
    }
  },

  // Get preview blob for images (authenticated)
  getPreviewBlob: async (id: number, size?: string): Promise<Blob> => {
    try {
      const url = `${getApiUrl()}${id}/preview/${size ? `?size=${size}` : ''}`
      const response = await axios.get(url, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('❌ Error fetching preview blob:', error)
      throw error
    }
  },

  // Get preview URL for direct access (use with caution - auth issues)
  getPreviewUrl: (id: number, size?: string): string => {
    const baseUrl = getApiUrl()
    return `${baseUrl}${id}/preview/${size ? `?size=${size}` : ''}`
  },
}

// React Query hooks
export const useAttachments = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: attachmentKeys.list(entityType, entityId),
    queryFn: () => attachmentApi.getAttachments(entityType, entityId),
    enabled: !!entityType && !!entityId,
  })
}


export const useUploadAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AttachmentUploadData) => attachmentApi.uploadAttachment(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch attachments for this entity
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(variables.entity_type, variables.entity_id)
      })
    },
  })
}

export const useUpdateAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Attachment, 'description' | 'link_url' | 'is_active'>> }) =>
      attachmentApi.updateAttachment(id, data),
    onSuccess: () => {
      // Simple approach: just invalidate all attachment queries
      // This triggers a fresh fetch, ensuring all components get updated data
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.all
      })
    },
  })
}

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attachmentApi.deleteAttachment,
    onSuccess: () => {
      // Remove the attachment from all queries
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.lists()
      })
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.all
      })
    },
  })
}

export const useDownloadAttachment = () => {
  return useMutation({
    mutationFn: attachmentApi.downloadAttachment,
    onSuccess: (blob, attachmentId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attachment_${attachmentId}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}

export const usePreviewBlob = (attachmentId: number, size?: string, enabled = true) => {
  return useQuery({
    queryKey: ['attachment-preview-blob', attachmentId, size],
    queryFn: () => attachmentApi.getPreviewBlob(attachmentId, size),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (blob) => {
      // Convert blob to object URL for use in img src
      return window.URL.createObjectURL(blob)
    },
  })
}