import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Meeting types
export interface Meeting {
  id: number
  serial_number: number
  title: string
  description?: string
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
  meeting_date: string
  meeting_time: string
  meeting_datetime?: string
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
  comments?: MeetingComment[]
  comment_count: number
  attachment_count: number
}

export interface MeetingComment {
  id: number
  content: string
  author: number
  author_name: string
  author_email: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface MeetingListItem {
  id: number
  serial_number: number
  title: string
  description?: string
  status: 'logged' | 'scheduled'
  status_display: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  contact_display_name?: string
  meeting_date: string
  meeting_time: string
  duration_display?: string
  created_by_name: string
  entity_type?: string
  entity_id?: number
  created_at: string
  updated_at: string
  is_overdue_followup: boolean
  follow_up_required: boolean
}

export interface MeetingCreate {
  title: string
  description?: string
  status?: 'logged' | 'scheduled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  meeting_date?: string
  meeting_time?: string
  duration?: number
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  entity_type?: string
  entity_id?: number
}

export interface MeetingUpdate {
  title?: string
  description?: string
  status?: 'logged' | 'scheduled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  contact?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  meeting_date?: string
  meeting_time?: string
  duration?: number
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  tags?: string[]
  is_active?: boolean
}

export interface MeetingStats {
  total_meetings: number
  scheduled_meetings: number
  completed_meetings: number
  cancelled_meetings: number
  meetings_with_followup: number
  overdue_followups: number
  my_meetings: number
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
  const apiUrl = `${baseUrl}/api/meetings/`
  console.log('🔍 Meetings API URL:', apiUrl)
  
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

const meetingApi = {
  // Get all meetings with filters
  getMeetings: async (params?: {
    page?: number
    pageSize?: number
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
  }): Promise<PaginatedResponse<MeetingListItem>> => {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString())
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
    console.log('🔍 Fetching meetings from:', url)
    const response = await axios.get(url)
    console.log('🔍 Meetings response:', response.data)
    
    // Ensure we return the correct paginated format
    if (response.data && typeof response.data === 'object') {
      return response.data
    } else {
      console.warn('Unexpected API response format:', response.data)
      return { count: 0, next: null, previous: null, results: [] }
    }
  },

  // Get single meeting
  getMeeting: async (id: number): Promise<Meeting> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create meeting
  createMeeting: async (data: MeetingCreate): Promise<Meeting> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update meeting
  updateMeeting: async (id: number, data: MeetingUpdate): Promise<Meeting> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete meeting (soft delete)
  deleteMeeting: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get my meetings
  getMyMeetings: async (status?: string, priority?: string): Promise<MeetingListItem[]> => {
    const searchParams = new URLSearchParams()
    if (status) searchParams.append('status', status)
    if (priority) searchParams.append('priority', priority)
    
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

  // Get meetings for specific entity
  getEntityMeetings: async (entityType: string, entityId: number): Promise<MeetingListItem[]> => {
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

  // Get meetings for specific contact
  getContactMeetings: async (contactId: number): Promise<MeetingListItem[]> => {
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

  // Create meeting for entity
  createEntityMeeting: async (entityType: string, entityId: number, data: MeetingCreate): Promise<Meeting> => {
    // Remove entity linking fields since the backend gets them from URL path
    const { entity_type, entity_id, ...meetingData } = data
    const response = await axios.post(`${getApiUrl()}${entityType}/${entityId}/`, meetingData)
    return response.data
  },

  // Update meeting status
  updateMeetingStatus: async (id: number, status: string): Promise<Meeting> => {
    const response = await axios.post(`${getApiUrl()}${id}/status/`, { status })
    return response.data
  },

  // Mark follow-up as completed
  markFollowupCompleted: async (id: number): Promise<Meeting> => {
    const response = await axios.post(`${getApiUrl()}${id}/followup/complete/`)
    return response.data
  },

  // Get upcoming follow-ups
  getUpcomingFollowups: async (days?: number): Promise<MeetingListItem[]> => {
    const searchParams = new URLSearchParams()
    if (days) searchParams.append('days', days.toString())
    
    const url = `${getApiUrl()}followups/?${searchParams.toString()}`
    const response = await axios.get(url)
    return response.data
  },

  // Get meeting statistics
  getMeetingStats: async (): Promise<MeetingStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },

  // Meeting comments
  getMeetingComments: async (meetingId: number): Promise<MeetingComment[]> => {
    const response = await axios.get(`${getApiUrl()}${meetingId}/comments/`)
    return response.data
  },

  createMeetingComment: async (meetingId: number, content: string): Promise<MeetingComment> => {
    const response = await axios.post(`${getApiUrl()}${meetingId}/comments/`, { content })
    return response.data
  },

  updateMeetingComment: async (commentId: number, content: string): Promise<MeetingComment> => {
    const response = await axios.patch(`${getApiUrl()}comments/${commentId}/`, { content })
    return response.data
  },

  deleteMeetingComment: async (commentId: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}comments/${commentId}/`)
  }
}

// React Query hooks
export const useMeetings = (params?: Parameters<typeof meetingApi.getMeetings>[0]) => {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => meetingApi.getMeetings(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMeeting = (id: number) => {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingApi.getMeeting(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateMeeting = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: meetingApi.createMeeting,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MeetingUpdate }) => 
      meetingApi.updateMeeting(id, data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['meeting', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: meetingApi.deleteMeeting,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useMyMeetings = (status?: string, priority?: string) => {
  return useQuery({
    queryKey: ['my-meetings', status, priority],
    queryFn: () => meetingApi.getMyMeetings(status, priority),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEntityMeetings = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['entity-meetings', entityType, entityId],
    queryFn: () => meetingApi.getEntityMeetings(entityType, entityId),
    enabled: !!entityType && !!entityId && entityType !== 'standalone',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactMeetings = (contactId: number) => {
  return useQuery({
    queryKey: ['contact-meetings', contactId],
    queryFn: () => meetingApi.getContactMeetings(contactId),
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEntityMeeting = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { 
      entityType: string; 
      entityId: number; 
      data: MeetingCreate 
    }) => meetingApi.createEntityMeeting(entityType, entityId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats' ||
                 queryKey === 'upcoming-followups'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateMeetingStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      meetingApi.updateMeetingStatus(id, status),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['meeting', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useMarkFollowupCompleted = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: meetingApi.markFollowupCompleted,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['meeting', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meetings' || 
                 queryKey === 'meeting' ||
                 queryKey === 'my-meetings' ||
                 queryKey === 'entity-meetings' ||
                 queryKey === 'contact-meetings' ||
                 queryKey === 'meeting-stats' ||
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
    queryFn: () => meetingApi.getUpcomingFollowups(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMeetingStats = () => {
  return useQuery({
    queryKey: ['meeting-stats'],
    queryFn: meetingApi.getMeetingStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMeetingComments = (meetingId: number) => {
  return useQuery({
    queryKey: ['meeting-comments', meetingId],
    queryFn: () => meetingApi.getMeetingComments(meetingId),
    enabled: !!meetingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateMeetingComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ meetingId, content }: { meetingId: number; content: string }) => 
      meetingApi.createMeetingComment(meetingId, content),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['meeting-comments', variables.meetingId]
      })
      await queryClient.invalidateQueries({ 
        queryKey: ['meeting', variables.meetingId]
      })
    },
  })
}

export const useUpdateMeetingComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => 
      meetingApi.updateMeetingComment(commentId, content),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meeting-comments' || queryKey === 'meeting'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteMeetingComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: meetingApi.deleteMeetingComment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'meeting-comments' || queryKey === 'meeting'
        },
        type: 'active'
      })
    },
  })
}

export default meetingApi