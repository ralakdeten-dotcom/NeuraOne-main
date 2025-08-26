import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'


// Lead types
export interface Lead {
  lead_id: number
  tenant: number
  tenant_name: string
  account?: number
  company_name?: string
  first_name: string
  last_name: string
  title?: string
  website?: string
  description?: string
  lead_status?: string
  score?: number
  lead_owner?: number
  lead_owner_name?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  number_of_employees?: number
  average_revenue?: number
  lead_source?: string
  industry?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface LeadListItem {
  lead_id: number
  first_name: string
  last_name: string
  full_name: string
  title?: string
  email?: string
  phone?: string
  company_name?: string
  lead_status?: string
  score?: number
  lead_source?: string
  industry?: string
  tenant_name: string
  lead_owner?: number
  lead_owner_name?: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface LeadCreate {
  account?: number | null
  company_name: string
  first_name: string
  last_name: string
  title?: string
  website?: string
  description?: string
  lead_status?: string
  score?: number
  lead_owner?: number
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  number_of_employees?: number
  average_revenue?: number
  lead_source?: string
  industry?: string
}

export interface LeadSummary {
  total_leads: number
  leads_with_account: number
  leads_with_phone: number
  leads_with_score: number
  leads_by_status: Record<string, number>
  leads_by_source: Record<string, number>
  tenant: string
}

export interface LeadScoreDistribution {
  score_range: string
  count: number
  percentage: number
}

export interface LeadScoreStats {
  total_leads: number
  avg_score: number
  high_score_leads: number
  medium_score_leads: number
  low_score_leads: number
  very_low_score_leads: number
  distribution: LeadScoreDistribution[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions - using axios with automatic auth handling

const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/crm/leads/`
  console.log('🔍 Leads API URL:', apiUrl)
  return apiUrl
}

const leadApi = {
  // Get all leads
  getLeads: async (page = 1, pageSize = 20): Promise<PaginatedResponse<LeadListItem>> => {
    const url = `${getApiUrl()}?page=${page}&page_size=${pageSize}`
    console.log('🔍 Fetching leads from:', url)
    const response = await axios.get(url)
    console.log('🔍 Leads response:', response.data)
    return response.data
  },

  // Get single lead
  getLead: async (id: number): Promise<Lead> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create lead
  createLead: async (data: LeadCreate): Promise<Lead> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update lead
  updateLead: async (id: number, data: Partial<LeadCreate>): Promise<Lead> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete lead
  deleteLead: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get lead summary
  getLeadSummary: async (): Promise<LeadSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Get lead score distribution
  getLeadScoreDistribution: async (): Promise<LeadScoreStats> => {
    const response = await axios.get(`${getApiUrl()}score_distribution/`)
    return response.data
  },

  // Get lead account info
  getLeadAccountInfo: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/account_info/`)
    return response.data
  },

  // Get leads by account
  getLeadsByAccount: async (accountId: number) => {
    const response = await axios.get(`${getApiUrl()}by_account/?account_id=${accountId}`)
    return response.data
  },

  // Get leads by status
  getLeadsByStatus: async (status: string) => {
    const response = await axios.get(`${getApiUrl()}by_status/?status=${status}`)
    return response.data
  },

  // Convert lead (simple)
  convertLead: async (id: number) => {
    const response = await axios.post(`${getApiUrl()}${id}/convert/`)
    return response.data
  },

  // Convert lead (enhanced with custom data)
  convertLeadEnhanced: async (id: number, conversionData: any) => {
    const response = await axios.post(`${getApiUrl()}${id}/convert/`, conversionData)
    return response.data
  },

  // Get today's leads
  getTodaysLeads: async (): Promise<PaginatedResponse<LeadListItem>> => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const url = `${getApiUrl()}?created_at__date=${today}&page_size=100`
    console.log('🔍 Fetching today\'s leads from:', url)
    const response = await axios.get(url)
    console.log('🔍 Today\'s leads response:', response.data)
    return response.data
  }
}

// React Query hooks
export const useLeads = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['leads', page, pageSize],
    queryFn: () => leadApi.getLeads(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLead = (id: number) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.getLead(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateLead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: leadApi.createLead,
    onSuccess: async () => {
      // Invalidate all lead-related queries using predicate
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'leads' || 
                 queryKey === 'lead' ||
                 queryKey === 'lead-account-info' ||
                 queryKey === 'leads-by-account' || 
                 queryKey === 'leads-by-status' ||
                 queryKey === 'account-leads'
        },
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['lead-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useUpdateLead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeadCreate> }) => 
      leadApi.updateLead(id, data),
    onSuccess: async (data) => {
      // Explicitly invalidate the specific lead being updated
      await queryClient.invalidateQueries({ 
        queryKey: ['lead', data.lead_id]
      })
      await queryClient.invalidateQueries({ 
        queryKey: ['lead-account-info', data.lead_id]
      })
      
      // Invalidate all lead-related queries using predicate
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'leads' || 
                 queryKey === 'lead' ||
                 queryKey === 'lead-account-info' ||
                 queryKey === 'leads-by-account' || 
                 queryKey === 'leads-by-status' ||
                 queryKey === 'account-leads'
        },
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['lead-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteLead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: leadApi.deleteLead,
    onSuccess: async () => {
      // Invalidate all lead-related queries using predicate
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'leads' || 
                 queryKey === 'lead' ||
                 queryKey === 'lead-account-info' ||
                 queryKey === 'leads-by-account' || 
                 queryKey === 'leads-by-status' ||
                 queryKey === 'account-leads'
        },
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['lead-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
    },
  })
}

export const useLeadSummary = () => {
  return useQuery({
    queryKey: ['lead-summary'],
    queryFn: leadApi.getLeadSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLeadScoreDistribution = () => {
  return useQuery({
    queryKey: ['lead-score-distribution'],
    queryFn: leadApi.getLeadScoreDistribution,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

export const useTodaysLeads = () => {
  return useQuery({
    queryKey: ['todays-leads'],
    queryFn: leadApi.getTodaysLeads,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent updates for today's data)
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}

export const useLeadAccountInfo = (id: number) => {
  return useQuery({
    queryKey: ['lead-account-info', id],
    queryFn: () => leadApi.getLeadAccountInfo(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLeadsByAccount = (accountId: number) => {
  return useQuery({
    queryKey: ['leads-by-account', accountId],
    queryFn: () => leadApi.getLeadsByAccount(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLeadsByStatus = (status: string) => {
  return useQuery({
    queryKey: ['leads-by-status', status],
    queryFn: () => leadApi.getLeadsByStatus(status),
    enabled: !!status,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useConvertLead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: leadApi.convertLead,
    onSuccess: async () => {
      // Targeted invalidation for lead conversion (performance optimized)
      await queryClient.refetchQueries({ 
        queryKey: ['leads'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['lead-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['accounts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contacts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal-summary'],
        type: 'active'
      })
    },
  })
}

export const useConvertLeadEnhanced = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, conversionData }: { id: number; conversionData: any }) => 
      leadApi.convertLeadEnhanced(id, conversionData),
    onSuccess: async () => {
      // Targeted invalidation for lead conversion (performance optimized)
      await queryClient.refetchQueries({ 
        queryKey: ['leads'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['lead-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['accounts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contacts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal-summary'],
        type: 'active'
      })
    },
  })
}