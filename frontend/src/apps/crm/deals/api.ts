import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'


// Deal types
export interface Deal {
  deal_id: number
  tenant: number
  tenant_name: string
  deal_name: string
  stage: string
  amount: string
  close_date: string
  account: number
  account_name?: string
  owner?: number
  owner_name?: string
  primary_contact?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  description?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface DealListItem {
  deal_id: number
  deal_name: string
  tenant_name: string
  stage: string
  amount: string
  close_date: string
  account_name?: string
  owner_name?: string
  primary_contact_name?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface DealCreate {
  deal_name: string
  stage: string
  amount: string
  close_date: string
  account: number
  owner?: number
  primary_contact?: number
  description?: string
}

export interface DealUpdate {
  deal_name?: string
  stage?: string
  amount?: string
  close_date?: string
  account?: number
  owner?: number
  primary_contact?: number
  description?: string
}

export interface DealSummary {
  total_deals: number
  total_value: string
  avg_deal_value: string
  deals_by_stage: Record<string, number>
  deals_closing_this_month: number
  deals_closing_next_month: number
}

export interface DealsByStage {
  deals_by_stage: Record<string, DealListItem[]>
  total_stages: number
  total_deals: number
}

export interface DealsByAccount {
  deals: DealListItem[]
  count: number
  account_filter?: string
}

export interface DealAccountInfo {
  deal_id: number
  deal_name: string
  account: {
    account_id: number
    account_name: string
    industry?: string
    website?: string
    phone?: string
    owner?: string
    billing_city?: string
    billing_country?: string
  }
}

export interface DealContacts {
  deal_id: number
  deal_name: string
  account_id?: number
  account_name?: string
  contacts: Array<{
    contact_id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    title?: string
  }>
  count: number
  error?: string
}

export interface DealsClosingSoon {
  deals: Array<DealListItem & { days_until_close: number }>
  count: number
  days_filter: number
}

export interface DealDateAnalytics {
  total_deals: number
  deals_by_month: Array<{
    month: string
    count: number
    month_key: string
  }>
  deals_by_stage_monthly: Array<{
    month: string
    month_key: string
    [stage: string]: string | number
  }>
  total_value_by_month: Array<{
    month: string
    value: number
    month_key: string
  }>
  avg_deal_value_by_month: Array<{
    month: string
    avg_value: number
    month_key: string
  }>
  available_stages: string[]
  current_year: number
  months_count: number
}

// Generic API response type
interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions - using axios with automatic auth handling

const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/crm/opportunities/`
  console.log('🔍 Deals API URL:', apiUrl)
  return apiUrl
}

const dealApi = {
  // Get all deals
  getDeals: async (): Promise<ApiResponse<DealListItem>> => {
    const url = getApiUrl()
    console.log('🔍 Fetching deals from:', url)
    const response = await axios.get(url)
    console.log('🔍 Deals response:', response.data)
    return response.data
  },

  // Get single deal
  getDeal: async (id: number): Promise<Deal> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create deal
  createDeal: async (data: DealCreate): Promise<Deal> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update deal
  updateDeal: async (id: number, data: DealUpdate): Promise<Deal> => {
    const response = await axios.put(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Partial update deal (PATCH)
  patchDeal: async (id: number, data: Partial<DealUpdate>): Promise<Deal> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete deal
  deleteDeal: async (id: number): Promise<void> => {
    const url = `${getApiUrl()}${id}/`
    console.log('🔍 Deals API - Deleting deal:', {
      url,
      dealId: id,
      method: 'DELETE'
    })
    try {
      const response = await axios.delete(url)
      console.log('✅ Deals API - Deletion successful:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Deals API - Deletion failed:', {
        url,
        dealId: id,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      })
      throw error
    }
  },

  // Get deal summary
  getDealSummary: async (): Promise<DealSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Get deals by stage
  getDealsByStage: async (stage?: string): Promise<DealsByStage> => {
    const url = stage 
      ? `${getApiUrl()}by_stage/?stage=${encodeURIComponent(stage)}`
      : `${getApiUrl()}by_stage/`
    const response = await axios.get(url)
    return response.data
  },

  // Get deals by account
  getDealsByAccount: async (accountId?: number, accountName?: string): Promise<DealsByAccount> => {
    const params = new URLSearchParams()
    if (accountId) params.append('account_id', accountId.toString())
    if (accountName) params.append('account_name', accountName)
    
    const response = await axios.get(`${getApiUrl()}by_account/?${params}`)
    return response.data
  },

  // Get deal account info
  getDealAccountInfo: async (dealId: number): Promise<DealAccountInfo> => {
    const response = await axios.get(`${getApiUrl()}${dealId}/account_info/`)
    return response.data
  },

  // Get deal contacts
  getDealContacts: async (dealId: number): Promise<DealContacts> => {
    const response = await axios.get(`${getApiUrl()}${dealId}/contacts/`)
    return response.data
  },

  // Get deals closing soon
  getDealsClosingSoon: async (days: number = 30): Promise<DealsClosingSoon> => {
    const response = await axios.get(`${getApiUrl()}closing_soon/?days=${days}`)
    return response.data
  },

  // Get deal date analytics for charts
  getDealDateAnalytics: async (): Promise<DealDateAnalytics> => {
    const response = await axios.get(`${getApiUrl()}date_analytics/`)
    return response.data
  }
}

// React Query hooks
export const useDeals = () => {
  return useQuery<ApiResponse<DealListItem>>({
    queryKey: ['deals'],
    queryFn: dealApi.getDeals,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDeal = (dealId: number) => {
  return useQuery<Deal>({
    queryKey: ['deal', dealId],
    queryFn: () => dealApi.getDeal(dealId),
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateDeal = () => {
  const queryClient = useQueryClient()
  
  return useMutation<Deal, Error, DealCreate>({
    mutationFn: dealApi.createDeal,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal-summary'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['account-deals'],
        type: 'active'
      })
    },
  })
}

export const useUpdateDeal = () => {
  const queryClient = useQueryClient()
  
  return useMutation<Deal, Error, { dealId: number; dealData: DealUpdate }>({
    mutationFn: ({ dealId, dealData }) => dealApi.updateDeal(dealId, dealData),
    onSuccess: async (_, { dealId }) => {
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal', dealId],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal-summary'],
        type: 'active'
      })
    },
  })
}

export const usePatchDeal = () => {
  const queryClient = useQueryClient()
  
  return useMutation<Deal, Error, { dealId: number; dealData: Partial<DealUpdate> }>({
    mutationFn: ({ dealId, dealData }) => dealApi.patchDeal(dealId, dealData),
    onSuccess: async (_, { dealId }) => {
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal', dealId],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deal-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteDeal = () => {
  const queryClient = useQueryClient()
  
  return useMutation<void, Error, number>({
    mutationFn: dealApi.deleteDeal,
    onSuccess: async () => {
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

export const useDealSummary = () => {
  return useQuery<DealSummary>({
    queryKey: ['deal-summary'],
    queryFn: dealApi.getDealSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealsByStage = (stage?: string) => {
  return useQuery<DealsByStage>({
    queryKey: ['deals-by-stage', stage],
    queryFn: () => dealApi.getDealsByStage(stage),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealsByAccount = (accountId?: number, accountName?: string) => {
  return useQuery<DealsByAccount>({
    queryKey: ['deals-by-account', accountId, accountName],
    queryFn: () => dealApi.getDealsByAccount(accountId, accountName),
    enabled: !!(accountId || accountName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealAccountInfo = (dealId: number) => {
  return useQuery<DealAccountInfo>({
    queryKey: ['deal-account-info', dealId],
    queryFn: () => dealApi.getDealAccountInfo(dealId),
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealContacts = (dealId: number) => {
  return useQuery<DealContacts>({
    queryKey: ['deal-contacts', dealId],
    queryFn: () => dealApi.getDealContacts(dealId),
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealsClosingSoon = (days: number = 30) => {
  return useQuery<DealsClosingSoon>({
    queryKey: ['deals-closing-soon', days],
    queryFn: () => dealApi.getDealsClosingSoon(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDealDateAnalytics = () => {
  return useQuery<DealDateAnalytics>({
    queryKey: ['deal-date-analytics'],
    queryFn: dealApi.getDealDateAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}