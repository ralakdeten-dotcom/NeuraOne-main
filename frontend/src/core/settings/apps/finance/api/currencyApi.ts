import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types based on backend serializers
export interface Currency {
  id: number
  currency_id: string
  currency_code: string
  currency_name: string
  currency_symbol: string
  price_precision: number
  currency_format: string
  is_base_currency: boolean
  exchange_rate: string
  effective_date?: string
  created_at: string
  updated_at: string
}

export interface CurrencyCreate {
  currency_code: string
  currency_name?: string
  currency_symbol: string
  price_precision?: number
  currency_format?: string
  is_base_currency?: boolean
  exchange_rate?: string
  effective_date?: string
}

export interface CurrencyUpdate {
  currency_code?: string
  currency_name?: string
  currency_symbol?: string
  price_precision?: number
  currency_format?: string
  is_base_currency?: boolean
  exchange_rate?: string
  effective_date?: string
}

export interface CurrencyResponse {
  code: number
  message: string
  currency?: Currency
  currencies?: Currency[]
  page?: number
  per_page?: number
  has_more_page?: boolean
  total_count?: number
  report_name?: string
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/settings/currencies/`
}

// API functions
const currencyApi = {
  // Get all currencies
  getCurrencies: async (search?: string): Promise<Currency[]> => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    
    const response = await axios.get(`${getApiUrl()}?${params.toString()}`)
    return response.data.currencies || response.data.results || []
  },

  // Get single currency
  getCurrency: async (currencyId: string): Promise<Currency> => {
    const response = await axios.get(`${getApiUrl()}${currencyId}/`)
    return response.data.currency || response.data
  },

  // Create currency
  createCurrency: async (data: CurrencyCreate): Promise<Currency> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data.currency || response.data
  },

  // Update currency
  updateCurrency: async (currencyId: string, data: CurrencyUpdate): Promise<Currency> => {
    const response = await axios.patch(`${getApiUrl()}${currencyId}/`, data)
    return response.data.currency || response.data
  },

  // Delete currency
  deleteCurrency: async (currencyId: string): Promise<void> => {
    await axios.delete(`${getApiUrl()}${currencyId}/`)
  },

  // Get base currency
  getBaseCurrency: async (): Promise<Currency | null> => {
    const response = await axios.get(`${getApiUrl()}base_currency/`)
    return response.data.currency || null
  },

  // Set as base currency
  setBaseCurrency: async (currencyId: string): Promise<Currency> => {
    const response = await axios.post(`${getApiUrl()}${currencyId}/set_as_base/`)
    return response.data.currency || response.data
  }
}

// React Query hooks
export const useCurrencies = (search?: string) => {
  return useQuery({
    queryKey: ['currencies', search],
    queryFn: () => currencyApi.getCurrencies(search),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCurrency = (currencyId: string) => {
  return useQuery({
    queryKey: ['currency', currencyId],
    queryFn: () => currencyApi.getCurrency(currencyId),
    enabled: !!currencyId,
  })
}

export const useBaseCurrency = () => {
  return useQuery({
    queryKey: ['baseCurrency'],
    queryFn: currencyApi.getBaseCurrency,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCreateCurrency = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: currencyApi.createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['baseCurrency'] })
    },
  })
}

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ currencyId, data }: { currencyId: string; data: CurrencyUpdate }) =>
      currencyApi.updateCurrency(currencyId, data),
    onSuccess: (updatedCurrency) => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['currency', updatedCurrency.currency_id] })
      queryClient.invalidateQueries({ queryKey: ['baseCurrency'] })
    },
  })
}

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: currencyApi.deleteCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['baseCurrency'] })
    },
  })
}

export const useSetBaseCurrency = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: currencyApi.setBaseCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      queryClient.invalidateQueries({ queryKey: ['baseCurrency'] })
    },
  })
}