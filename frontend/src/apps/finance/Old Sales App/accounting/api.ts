import { useQuery } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types
export interface ChartOfAccount {
  account_id: number
  account_name: string
  account_code: string
  account_type: string
  is_active: boolean
  is_system_account: boolean
  parent_account?: number
  parent_account_name?: string
  depth: number
  currency_code: string
  current_balance: string
  description?: string
}

export interface ChartOfAccountListResponse {
  results: ChartOfAccount[]
  count: number
  next: string | null
  previous: string | null
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/finance/chartofaccounts/`
}

// API functions
const accountingApi = {
  // Get all chart of accounts
  getChartOfAccounts: async (params?: {
    account_type?: string
    is_active?: boolean
    search?: string
  }): Promise<ChartOfAccountListResponse> => {
    const queryParams = new URLSearchParams()
    
    if (params?.account_type) {
      queryParams.append('account_type', params.account_type)
    }
    if (params?.is_active !== undefined) {
      queryParams.append('is_active', params.is_active.toString())
    }
    if (params?.search) {
      queryParams.append('search', params.search)
    }
    
    const url = queryParams.toString() 
      ? `${getApiUrl()}?${queryParams.toString()}`
      : getApiUrl()
    
    const response = await axios.get(url)
    return response.data
  },

  // Get accounts receivable accounts
  getReceivableAccounts: async (): Promise<ChartOfAccountListResponse> => {
    // First try to get the response with filtering
    try {
      const response = await axios.get(`${getApiUrl()}?account_type=accounts_receivable&is_active=true`)
      // If the backend doesn't support filtering, filter on frontend
      if (response.data.results && response.data.results.length > 0) {
        const filtered = response.data.results.filter((acc: ChartOfAccount) => 
          acc.account_type === 'accounts_receivable'
        )
        if (filtered.length > 0) {
          return { ...response.data, results: filtered }
        }
      }
      return response.data
    } catch (error) {
      // If filtering fails, get all and filter on frontend
      const response = await axios.get(getApiUrl())
      const filtered = response.data.results.filter((acc: ChartOfAccount) => 
        acc.account_type === 'accounts_receivable' && acc.is_active
      )
      return { ...response.data, results: filtered }
    }
  },

  // Get accounts payable accounts
  getPayableAccounts: async (): Promise<ChartOfAccountListResponse> => {
    // First try to get the response with filtering
    try {
      const response = await axios.get(`${getApiUrl()}?account_type=accounts_payable&is_active=true`)
      // If the backend doesn't support filtering, filter on frontend
      if (response.data.results && response.data.results.length > 0) {
        const filtered = response.data.results.filter((acc: ChartOfAccount) => 
          acc.account_type === 'accounts_payable'
        )
        if (filtered.length > 0) {
          return { ...response.data, results: filtered }
        }
      }
      return response.data
    } catch (error) {
      // If filtering fails, get all and filter on frontend
      const response = await axios.get(getApiUrl())
      const filtered = response.data.results.filter((acc: ChartOfAccount) => 
        acc.account_type === 'accounts_payable' && acc.is_active
      )
      return { ...response.data, results: filtered }
    }
  },

  // Get single account
  getAccount: async (id: number): Promise<ChartOfAccount> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },
}

// React Query hooks
export const useChartOfAccounts = (params?: {
  account_type?: string
  is_active?: boolean
  search?: string
}) => {
  return useQuery({
    queryKey: ['chart-of-accounts', params],
    queryFn: () => accountingApi.getChartOfAccounts(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useReceivableAccounts = () => {
  return useQuery({
    queryKey: ['receivable-accounts'],
    queryFn: accountingApi.getReceivableAccounts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePayableAccounts = () => {
  return useQuery({
    queryKey: ['payable-accounts'],
    queryFn: accountingApi.getPayableAccounts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useAccount = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountingApi.getAccount(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}