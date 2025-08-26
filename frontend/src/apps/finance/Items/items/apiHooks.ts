import { useQuery } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Vendors API
export interface Vendor {
  contact_id: number
  name: string
  contact_name: string
  company_name: string
  email: string
  phone: string
  contact_type: 'vendor'
}

export const useVendors = () => {
  return useQuery({
    queryKey: ['finance-vendors'],
    queryFn: async () => {
      const response = await axios.get<{ results: Vendor[] }>(
        `${getApiBaseUrl()}/api/finance/vendors/`
      )
      return response.data.results || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Chart of Accounts API
export interface ChartOfAccount {
  account_id: number
  account_name: string
  account_code: string
  account_type: string
  account_category?: string
  is_active: boolean
}

export const useChartOfAccounts = (accountCategory?: string) => {
  return useQuery({
    queryKey: ['chart-of-accounts', accountCategory],
    queryFn: async () => {
      const params = accountCategory ? { account_category: accountCategory } : {}
      const response = await axios.get<{ results: ChartOfAccount[] }>(
        `${getApiBaseUrl()}/api/finance/chartofaccounts/`,
        { params }
      )
      return response.data.results || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Locations API
export interface Location {
  location_id: number
  location_name: string
  address: string
  city: string
  state: string
  country: string
  is_primary: boolean
}

export const useLocations = () => {
  return useQuery({
    queryKey: ['inventory-locations'],
    queryFn: async () => {
      const response = await axios.get<{ results: Location[] }>(
        `${getApiBaseUrl()}/api/inventory/locations/`
      )
      return response.data.results || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Item Groups API
export interface ItemGroup {
  group_id: number
  group_name: string
  description: string
}

export const useItemGroups = () => {
  return useQuery({
    queryKey: ['item-groups'],
    queryFn: async () => {
      const response = await axios.get<{ results: ItemGroup[] }>(
        `${getApiBaseUrl()}/api/inventory/item-groups/`
      )
      return response.data.results || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Tax Rates API
export interface TaxRate {
  tax_id: string
  tax_name: string
  tax_percentage: string
  tax_type: string
  is_active: boolean
}

export const useTaxRates = () => {
  return useQuery({
    queryKey: ['tax-rates'],
    queryFn: async () => {
      const response = await axios.get<{ taxes: TaxRate[] }>(
        `${getApiBaseUrl()}/api/settings/taxes/`
      )
      // Only return active taxes
      const taxes = response.data.taxes || []
      return taxes.filter(tax => tax.is_active)
    },
    staleTime: 5 * 60 * 1000,
  })
}