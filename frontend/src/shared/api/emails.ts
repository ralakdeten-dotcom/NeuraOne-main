import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Email types
export interface Email {
  id: number
  serial_number: number
  subject: string
  content: string
  email_address: string
  direction: 'inbound' | 'outbound' | 'draft'
  direction_display: string
  status: 'sent' | 'received' | 'read' | 'replied' | 'forwarded' | 'draft' | 'failed'
  status_display: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  contact?: number
  contact_name?: string
  contact_display_name?: string
  contact_display_email?: string
  email_date: string
  email_time: string
  email_datetime?: string
  cc_addresses?: string
  bcc_addresses?: string
  cc_list: string[]
  bcc_list: string[]
  message_id?: string
  thread_id?: string
  created_by: number
  created_by_name: string
  created_by_email: string
  content_type?: number
  object_id?: number
  entity_type?: string
  entity_id?: number
  follow_up_required: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags: string[]
  created_at: string
  updated_at: string
  is_active: boolean
  is_overdue_followup: boolean
  comments?: EmailComment[]
  comment_count: number
  attachment_count: number
}

export interface EmailComment {
  id: number
  content: string
  author: number
  author_name: string
  author_email: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface EmailListItem {
  id: number
  serial_number: number
  subject: string
  content: string
  email_address: string
  direction: 'inbound' | 'outbound' | 'draft'
  direction_display: string
  status: 'sent' | 'received' | 'read' | 'replied' | 'forwarded' | 'draft' | 'failed'
  status_display: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  contact_display_name?: string
  email_date: string
  email_time: string
  created_by_name: string
  entity_type?: string
  entity_id?: number
  created_at: string
  updated_at: string
  is_overdue_followup: boolean
  follow_up_required: boolean
}

export interface EmailCreate {
  subject: string
  content: string
  email_address: string
  direction: 'inbound' | 'outbound' | 'draft'
  status?: 'sent' | 'received' | 'read' | 'replied' | 'forwarded' | 'draft' | 'failed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  email_date?: string
  email_time?: string
  cc_addresses?: string
  bcc_addresses?: string
  message_id?: string
  thread_id?: string
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  entity_type?: string
  entity_id?: number
}

export interface EmailUpdate {
  subject?: string
  content?: string
  email_address?: string
  direction?: 'inbound' | 'outbound' | 'draft'
  status?: 'sent' | 'received' | 'read' | 'replied' | 'forwarded' | 'draft' | 'failed'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  email_date?: string
  email_time?: string
  cc_addresses?: string
  bcc_addresses?: string
  message_id?: string
  thread_id?: string
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  is_active?: boolean
}

export interface EmailStats {
  total_emails: number
  sent_emails: number
  received_emails: number
  draft_emails: number
  emails_with_followup: number
  overdue_followups: number
  my_emails: number
  created_by_me: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/emails/`
  console.log('🔍 Emails API URL:', apiUrl)
  
  // Debug auth tokens
  const tokens = localStorage.getItem('auth_tokens')
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens)
      console.log('🔑 Auth tokens available:', {
        has_access_token: !!parsed.access_token,
        token_preview: parsed.access_token ? parsed.access_token.substring(0, 20) + '...' : 'none'
      })
    } catch (e) {
      console.error('🚫 Error parsing auth tokens:', e)
    }
  } else {
    console.warn('🚫 No auth tokens found in localStorage')
  }
  
  return apiUrl
}

const emailApi = {
  // Get all emails with filters
  getEmails: async (params?: {
    page?: number
    pageSize?: number
    direction?: string
    status?: string
    priority?: string
    created_by?: string | number
    contact?: number
    entity_type?: string
    entity_id?: number
    follow_up?: string
    overdue_followup?: boolean
    date_from?: string
    date_to?: string
    search?: string
  }): Promise<PaginatedResponse<EmailListItem>> => {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString())
    if (params?.direction) searchParams.append('direction', params.direction)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.created_by) searchParams.append('created_by', params.created_by.toString())
    if (params?.contact) searchParams.append('contact', params.contact.toString())
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type)
    if (params?.entity_id) searchParams.append('entity_id', params.entity_id.toString())
    if (params?.follow_up) searchParams.append('follow_up', params.follow_up)
    if (params?.overdue_followup) searchParams.append('overdue_followup', 'true')
    if (params?.date_from) searchParams.append('date_from', params.date_from)
    if (params?.date_to) searchParams.append('date_to', params.date_to)
    if (params?.search) searchParams.append('search', params.search)

    const url = `${getApiUrl()}?${searchParams.toString()}`
    console.log('🔍 Fetching emails from:', url)
    const response = await axios.get(url)
    console.log('🔍 Emails response:', response.data)
    
    // Ensure we return the correct paginated format
    if (response.data && typeof response.data === 'object') {
      return response.data
    } else {
      console.warn('Unexpected API response format:', response.data)
      return { count: 0, next: null, previous: null, results: [] }
    }
  },

  // Get single email
  getEmail: async (id: number): Promise<Email> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create email
  createEmail: async (data: EmailCreate): Promise<Email> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update email
  updateEmail: async (id: number, data: EmailUpdate): Promise<Email> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete email (soft delete)
  deleteEmail: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get my emails
  getMyEmails: async (direction?: string, status?: string): Promise<EmailListItem[]> => {
    const searchParams = new URLSearchParams()
    if (direction) searchParams.append('direction', direction)
    if (status) searchParams.append('status', status)
    
    const url = `${getApiUrl()}me/?${searchParams.toString()}`
    const response = await axios.get(url)
    // Handle both paginated and direct array responses
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    } else {
      console.warn('Unexpected API response format:', response.data)
      return []
    }
  },

  // Get emails for specific entity
  getEntityEmails: async (entityType: string, entityId: number): Promise<EmailListItem[]> => {
    const response = await axios.get(`${getApiUrl()}${entityType}/${entityId}/`)
    // Handle both paginated and direct array responses
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    } else {
      console.warn('Unexpected API response format:', response.data)
      return []
    }
  },

  // Get emails for specific contact
  getContactEmails: async (contactId: number): Promise<EmailListItem[]> => {
    const response = await axios.get(`${getApiUrl()}contact/${contactId}/`)
    // Handle both paginated and direct array responses
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    } else {
      console.warn('Unexpected API response format:', response.data)
      return []
    }
  },

  // Create email for entity
  createEntityEmail: async (entityType: string, entityId: number, data: EmailCreate): Promise<Email> => {
    // Remove entity linking fields since the backend gets them from URL path
    const { entity_type, entity_id, ...emailData } = data
    const response = await axios.post(`${getApiUrl()}${entityType}/${entityId}/`, emailData)
    return response.data
  },

  // Update email status
  updateEmailStatus: async (id: number, status: string): Promise<Email> => {
    const response = await axios.post(`${getApiUrl()}${id}/update-status/`, { status })
    return response.data
  },

  // Mark follow-up as completed
  markFollowupCompleted: async (id: number): Promise<Email> => {
    const response = await axios.post(`${getApiUrl()}${id}/mark-followup-completed/`)
    return response.data
  },

  // Get upcoming follow-ups
  getUpcomingFollowups: async (days?: number): Promise<EmailListItem[]> => {
    const searchParams = new URLSearchParams()
    if (days) searchParams.append('days', days.toString())
    
    const url = `${getApiUrl()}upcoming-followups/?${searchParams.toString()}`
    const response = await axios.get(url)
    return response.data
  },

  // Get email statistics
  getEmailStats: async (): Promise<EmailStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },

  // Email comments
  getEmailComments: async (emailId: number): Promise<EmailComment[]> => {
    const response = await axios.get(`${getApiUrl()}${emailId}/comments/`)
    return response.data
  },

  createEmailComment: async (emailId: number, content: string): Promise<EmailComment> => {
    const response = await axios.post(`${getApiUrl()}${emailId}/comments/`, { content })
    return response.data
  },

  updateEmailComment: async (commentId: number, content: string): Promise<EmailComment> => {
    const response = await axios.patch(`${getApiUrl()}comments/${commentId}/`, { content })
    return response.data
  },

  deleteEmailComment: async (commentId: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}comments/${commentId}/`)
  }
}

// React Query hooks
export const useEmails = (params?: Parameters<typeof emailApi.getEmails>[0]) => {
  return useQuery({
    queryKey: ['emails', params],
    queryFn: () => emailApi.getEmails(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEmail = (id: number) => {
  return useQuery({
    queryKey: ['email', id],
    queryFn: () => emailApi.getEmail(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: emailApi.createEmail,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmailUpdate }) => 
      emailApi.updateEmail(id, data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['email', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: emailApi.deleteEmail,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useMyEmails = (direction?: string, status?: string) => {
  return useQuery({
    queryKey: ['my-emails', direction, status],
    queryFn: () => emailApi.getMyEmails(direction, status),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEntityEmails = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['entity-emails', entityType, entityId],
    queryFn: () => emailApi.getEntityEmails(entityType, entityId),
    enabled: !!entityType && !!entityId && entityType !== 'standalone',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactEmails = (contactId: number) => {
  return useQuery({
    queryKey: ['contact-emails', contactId],
    queryFn: () => emailApi.getContactEmails(contactId),
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEntityEmail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { 
      entityType: string; 
      entityId: number; 
      data: EmailCreate 
    }) => emailApi.createEntityEmail(entityType, entityId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateEmailStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      emailApi.updateEmailStatus(id, status),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['email', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useMarkFollowupCompleted = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: emailApi.markFollowupCompleted,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['email', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'emails' || 
                 queryKey === 'email' ||
                 queryKey === 'my-emails' ||
                 queryKey === 'entity-emails' ||
                 queryKey === 'contact-emails' ||
                 queryKey === 'email-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpcomingFollowups = (days?: number) => {
  return useQuery({
    queryKey: ['upcoming-followups', days],
    queryFn: () => emailApi.getUpcomingFollowups(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEmailStats = () => {
  return useQuery({
    queryKey: ['email-stats'],
    queryFn: emailApi.getEmailStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEmailComments = (emailId: number) => {
  return useQuery({
    queryKey: ['email-comments', emailId],
    queryFn: () => emailApi.getEmailComments(emailId),
    enabled: !!emailId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateEmailComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ emailId, content }: { emailId: number; content: string }) => 
      emailApi.createEmailComment(emailId, content),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['email-comments', variables.emailId]
      })
      await queryClient.invalidateQueries({ 
        queryKey: ['email', variables.emailId]
      })
    },
  })
}

export const useUpdateEmailComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => 
      emailApi.updateEmailComment(commentId, content),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'email-comments' || queryKey === 'email'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteEmailComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: emailApi.deleteEmailComment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'email-comments' || queryKey === 'email'
        },
        type: 'active'
      })
    },
  })
}

export default emailApi