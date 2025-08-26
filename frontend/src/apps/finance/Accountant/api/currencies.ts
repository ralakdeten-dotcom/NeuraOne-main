import { useQuery } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types for currencies
export interface Currency {
  currency_id: string
  currency_code: string
  currency_name: string
  currency_symbol: string
  price_precision: number
  currency_format: string
  is_base_currency: boolean
  exchange_rate: string
  effective_date: string | null
  created_at: string
  updated_at: string
}

export interface CurrenciesResponse {
  code: number
  message: string
  currencies: Currency[]
  page: number
  per_page: number
  has_more_page: boolean
  report_name: string
  total_count?: number
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/settings/currencies/`
}

// API functions
const currenciesApi = {
  // Get all currencies
  getCurrencies: async (): Promise<CurrenciesResponse> => {
    const response = await axios.get(getApiUrl())
    return response.data
  },
  
  // Get currency by code
  getCurrencyByCode: async (code: string): Promise<Currency | undefined> => {
    const response = await axios.get(getApiUrl())
    const data: CurrenciesResponse = response.data
    return data.currencies.find(c => c.currency_code === code)
  },
  
  // Get base currency
  getBaseCurrency: async (): Promise<Currency | null> => {
    const response = await axios.get(`${getApiUrl()}base_currency/`)
    return response.data.currency
  }
}

// React Query hooks
export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: currenciesApi.getCurrencies,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useCurrencyByCode = (code: string) => {
  return useQuery({
    queryKey: ['currency', code],
    queryFn: () => currenciesApi.getCurrencyByCode(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useBaseCurrency = () => {
  return useQuery({
    queryKey: ['base-currency'],
    queryFn: currenciesApi.getBaseCurrency,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Helper function to get currency symbol
export const getCurrencySymbol = (currencyCode: string, currencies: Currency[]): string => {
  const currency = currencies.find(c => c.currency_code === currencyCode)
  return currency?.currency_symbol || currencyCode
}