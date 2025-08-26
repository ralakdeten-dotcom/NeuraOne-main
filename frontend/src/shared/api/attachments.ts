import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types matching backend serializers
export interface Attachment {
  id: number
  attachment_type: 'file' | 'link'
  file?: string
  link_url?: string
  original_filename: string
  file_size?: number
  file_size_human: string
  content_type_header?: string
  file_extension: string
  is_image: boolean
  is_document: boolean
  description: string
  uploaded_at: string
  updated_at: string
  uploaded_by_name: string
  uploaded_by_email: string
  file_url?: string
  download_url: string
  entity_type: string
  entity_id: number
  is_active: boolean
}

export interface AttachmentUpload {
  attachment_type: 'file' | 'link'
  file?: File
  link_url?: string
  title?: string
  description?: string
  entity_type: string
  entity_id: number
}

export interface AttachmentStats {
  total_count: number
  total_size: number
  total_size_human: string
  type_counts: Record<string, number>
}

export interface AttachmentPreview {
  preview_available: boolean
  preview_type?: 'text' | 'pdf' | 'office' | 'image'
  content?: string
  is_truncated?: boolean
  filename: string
  size: string
  encoding?: string
  pages?: number
  download_url?: string
  message?: string
}

// API URL helper
const getApiUrl = (entityType: string, entityId: number) => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/attachments/${entityType}/${entityId}/`
}

const getAttachmentUrl = (attachmentId: number) => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/attachments/${attachmentId}/`
}

// API functions
const attachmentApi = {
  // Get all attachments for an entity
  getAttachments: async (entityType: string, entityId: number): Promise<Attachment[]> => {
    const response = await axios.get(getApiUrl(entityType, entityId))
    return response.data
  },

  // Upload file attachment
  uploadFile: async (data: AttachmentUpload): Promise<Attachment> => {
    const formData = new FormData()
    formData.append('attachment_type', data.attachment_type)
    
    if (data.attachment_type === 'file' && data.file) {
      formData.append('file', data.file)
    } else if (data.attachment_type === 'link' && data.link_url) {
      formData.append('link_url', data.link_url)
      if (data.title) formData.append('title', data.title)
    }
    
    if (data.description) formData.append('description', data.description)

    const response = await axios.post(getApiUrl(data.entity_type, data.entity_id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update attachment
  updateAttachment: async (id: number, data: Partial<Pick<Attachment, 'description' | 'link_url' | 'is_active'>>): Promise<Attachment> => {
    const response = await axios.patch(getAttachmentUrl(id), data)
    return response.data
  },

  // Delete attachment
  deleteAttachment: async (id: number): Promise<void> => {
    await axios.delete(getAttachmentUrl(id))
  },

  // Get attachment statistics
  getAttachmentStats: async (entityType: string, entityId: number): Promise<AttachmentStats> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.get(`${baseUrl}/api/attachments/${entityType}/${entityId}/stats/`)
    return response.data
  },

  // Get attachment preview
  getAttachmentPreview: async (attachmentId: number, size?: 'thumb' | 'small' | 'medium'): Promise<AttachmentPreview> => {
    const baseUrl = getApiBaseUrl()
    const params = size ? `?size=${size}` : ''
    const response = await axios.get(`${baseUrl}/api/attachments/${attachmentId}/preview/${params}`)
    return response.data
  },

  // Download attachment
  downloadAttachment: async (attachmentId: number): Promise<Blob> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.get(`${baseUrl}/api/attachments/${attachmentId}/download/`, {
      responseType: 'blob',
    })
    return response.data
  }
}

// React Query hooks
export const useAttachments = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () => attachmentApi.getAttachments(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useUploadAttachment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attachmentApi.uploadFile,
    onSuccess: async (data, variables) => {
      await queryClient.refetchQueries({ 
        queryKey: ['attachments', variables.entity_type, variables.entity_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['attachment-stats', variables.entity_type, variables.entity_id],
        type: 'active'
      })
    },
  })
}

export const useUpdateAttachment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<Attachment, 'description' | 'link_url' | 'is_active'>> }) => 
      attachmentApi.updateAttachment(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['attachments'],
        type: 'active'
      })
    },
  })
}

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: attachmentApi.deleteAttachment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['attachments'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['attachment-stats'],
        type: 'active'
      })
    },
  })
}

export const useAttachmentStats = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['attachment-stats', entityType, entityId],
    queryFn: () => attachmentApi.getAttachmentStats(entityType, entityId),
    enabled: !!entityType && !!entityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAttachmentPreview = (attachmentId: number, size?: 'thumb' | 'small' | 'medium') => {
  return useQuery({
    queryKey: ['attachment-preview', attachmentId, size],
    queryFn: () => attachmentApi.getAttachmentPreview(attachmentId, size),
    enabled: !!attachmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}