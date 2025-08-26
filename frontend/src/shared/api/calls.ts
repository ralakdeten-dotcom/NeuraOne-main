import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Call types
export interface Call {
  id: number
  serial_number: number
  title: string
  description?: string
  direction: 'inbound' | 'outbound'
  direction_display: string
  status: 'logged' | 'scheduled'
  status_display: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  contact?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  contact_display_name?: string
  contact_display_phone?: string
  contact_display_email?: string
  call_date: string
  call_time: string
  call_datetime?: string
  duration?: number
  duration_display?: string
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
  comments?: CallComment[]
  comment_count: number
  attachment_count: number
}

export interface CallComment {
  id: number
  content: string
  author: number
  author_name: string
  author_email: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface CallListItem {
  id: number
  serial_number: number
  title: string
  description?: string
  direction: 'inbound' | 'outbound'
  direction_display: string
  status: 'logged' | 'scheduled'
  status_display: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  contact_display_name?: string
  contact_display_phone?: string
  contact_phone?: string
  call_date: string
  call_time: string
  duration_display?: string
  created_by_name: string
  entity_type?: string
  entity_id?: number
  created_at: string
  updated_at: string
  is_overdue_followup: boolean
  follow_up_required: boolean
}

export interface CallCreate {
  title: string
  description?: string
  direction: 'inbound' | 'outbound'
  status?: 'logged' | 'scheduled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  call_date?: string
  call_time?: string
  duration?: number
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  entity_type?: string
  entity_id?: number
}

export interface CallUpdate {
  title?: string
  description?: string
  direction?: 'inbound' | 'outbound'
  status?: 'logged' | 'scheduled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  call_date?: string
  call_time?: string
  duration?: number
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  is_active?: boolean
}

export interface CallStats {
  total_calls: number
  inbound_calls: number
  outbound_calls: number
  completed_calls: number
  missed_calls: number
  calls_with_followup: number
  overdue_followups: number
  my_calls: number
  created_by_me: number
  total_duration: number // in minutes
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
  const apiUrl = `${baseUrl}/api/calls/`
  console.log('🔍 Calls API URL:', apiUrl)
  
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

const callApi = {
  // Get all calls with filters
  getCalls: async (params?: {
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
  }): Promise<PaginatedResponse<CallListItem>> => {
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
    console.log('🔍 Fetching calls from:', url)
    const response = await axios.get(url)
    console.log('🔍 Calls response:', response.data)
    
    // Ensure we return the correct paginated format
    if (response.data && typeof response.data === 'object') {
      return response.data
    } else {
      console.warn('Unexpected API response format:', response.data)
      return { count: 0, next: null, previous: null, results: [] }
    }
  },

  // Get single call
  getCall: async (id: number): Promise<Call> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create call
  createCall: async (data: CallCreate): Promise<Call> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update call
  updateCall: async (id: number, data: CallUpdate): Promise<Call> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete call (soft delete)
  deleteCall: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get my calls
  getMyCalls: async (direction?: string, status?: string): Promise<CallListItem[]> => {
    const searchParams = new URLSearchParams()
    if (direction) searchParams.append('direction', direction)
    if (status) searchParams.append('status', status)
    
    const url = `${getApiUrl()}my/?${searchParams.toString()}`
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

  // Get calls for specific entity
  getEntityCalls: async (entityType: string, entityId: number): Promise<CallListItem[]> => {
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

  // Get calls for specific contact
  getContactCalls: async (contactId: number): Promise<CallListItem[]> => {
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

  // Create call for entity
  createEntityCall: async (entityType: string, entityId: number, data: CallCreate): Promise<Call> => {
    // Remove entity linking fields since the backend gets them from URL path
    const { entity_type, entity_id, ...callData } = data
    const response = await axios.post(`${getApiUrl()}${entityType}/${entityId}/`, callData)
    return response.data
  },

  // Update call status
  updateCallStatus: async (id: number, status: string): Promise<Call> => {
    const response = await axios.post(`${getApiUrl()}${id}/status/`, { status })
    return response.data
  },

  // Mark follow-up as completed
  markFollowupCompleted: async (id: number): Promise<Call> => {
    const response = await axios.post(`${getApiUrl()}${id}/followup/complete/`)
    return response.data
  },

  // Get upcoming follow-ups
  getUpcomingFollowups: async (days?: number): Promise<CallListItem[]> => {
    const searchParams = new URLSearchParams()
    if (days) searchParams.append('days', days.toString())
    
    const url = `${getApiUrl()}followups/?${searchParams.toString()}`
    const response = await axios.get(url)
    return response.data
  },

  // Get call statistics
  getCallStats: async (): Promise<CallStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },

  // Call comments
  getCallComments: async (callId: number): Promise<CallComment[]> => {
    const response = await axios.get(`${getApiUrl()}${callId}/comments/`)
    return response.data
  },

  createCallComment: async (callId: number, content: string): Promise<CallComment> => {
    const response = await axios.post(`${getApiUrl()}${callId}/comments/`, { content })
    return response.data
  },

  updateCallComment: async (commentId: number, content: string): Promise<CallComment> => {
    const response = await axios.patch(`${getApiUrl()}comments/${commentId}/`, { content })
    return response.data
  },

  deleteCallComment: async (commentId: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}comments/${commentId}/`)
  }
}

// React Query hooks
export const useCalls = (params?: Parameters<typeof callApi.getCalls>[0]) => {
  return useQuery({
    queryKey: ['calls', params],
    queryFn: () => callApi.getCalls(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCall = (id: number) => {
  return useQuery({
    queryKey: ['call', id],
    queryFn: () => callApi.getCall(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateCall = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: callApi.createCall,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateCall = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CallUpdate }) => 
      callApi.updateCall(id, data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['call', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteCall = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: callApi.deleteCall,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useMyCalls = (direction?: string, status?: string) => {
  return useQuery({
    queryKey: ['my-calls', direction, status],
    queryFn: () => callApi.getMyCalls(direction, status),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEntityCalls = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['entity-calls', entityType, entityId],
    queryFn: () => callApi.getEntityCalls(entityType, entityId),
    enabled: !!entityType && !!entityId && entityType !== 'standalone',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactCalls = (contactId: number) => {
  return useQuery({
    queryKey: ['contact-calls', contactId],
    queryFn: () => callApi.getContactCalls(contactId),
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEntityCall = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { 
      entityType: string; 
      entityId: number; 
      data: CallCreate 
    }) => callApi.createEntityCall(entityType, entityId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateCallStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      callApi.updateCallStatus(id, status),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['call', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useMarkFollowupCompleted = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: callApi.markFollowupCompleted,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['call', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'calls' || 
                 queryKey === 'call' ||
                 queryKey === 'my-calls' ||
                 queryKey === 'entity-calls' ||
                 queryKey === 'contact-calls' ||
                 queryKey === 'call-stats' ||
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
    queryFn: () => callApi.getUpcomingFollowups(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCallStats = () => {
  return useQuery({
    queryKey: ['call-stats'],
    queryFn: callApi.getCallStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCallComments = (callId: number) => {
  return useQuery({
    queryKey: ['call-comments', callId],
    queryFn: () => callApi.getCallComments(callId),
    enabled: !!callId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateCallComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ callId, content }: { callId: number; content: string }) => 
      callApi.createCallComment(callId, content),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['call-comments', variables.callId]
      })
      await queryClient.invalidateQueries({ 
        queryKey: ['call', variables.callId]
      })
    },
  })
}

export const useUpdateCallComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => 
      callApi.updateCallComment(commentId, content),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'call-comments' || queryKey === 'call'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteCallComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: callApi.deleteCallComment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'call-comments' || queryKey === 'call'
        },
        type: 'active'
      })
    },
  })
}

export default callApi