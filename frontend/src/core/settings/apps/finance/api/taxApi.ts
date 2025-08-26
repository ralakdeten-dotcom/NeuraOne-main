import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types based on backend serializers
export interface Tax {
  tax_id: string
  tax_name: string
  tax_percentage: string
  tax_type: 'tax' | 'compound_tax'
  is_value_added: boolean
  is_default_tax: boolean
  is_editable: boolean
  is_active: boolean
  country?: string
  country_code?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface TaxCreate {
  tax_name: string
  tax_percentage: string
  tax_type?: 'tax' | 'compound_tax'
  is_value_added?: boolean
  is_editable?: boolean
  is_active?: boolean
  country?: string
  country_code?: string
  description?: string
  update_recurring_invoice?: boolean
  update_recurring_expense?: boolean
  update_draft_invoice?: boolean
  update_recurring_bills?: boolean
  update_draft_so?: boolean
  update_subscription?: boolean
  update_project?: boolean
}

export interface TaxUpdate extends TaxCreate {}

export interface TaxGroup {
  tax_group_id: string
  tax_group_name: string
  tax_group_percentage: string
  taxes: Tax[]
  created_at: string
  updated_at: string
}

export interface TaxGroupCreate {
  tax_group_name: string
  taxes: string // Comma-separated tax IDs
}

export interface TaxGroupUpdate extends TaxGroupCreate {}

export interface TaxResponse {
  code: number
  message: string
  tax?: Tax
  taxes?: Tax[]
  tax_group?: TaxGroup
  tax_groups?: TaxGroup[]
  page?: number
  per_page?: number
  has_more_page?: boolean
  total_count?: number
}

// API URL helpers
const getTaxApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/settings/taxes/`
}

const getTaxGroupApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/settings/taxes/groups/`
}

// API functions
const taxApi = {
  // Tax endpoints
  getTaxes: async (search?: string, isActive?: boolean): Promise<Tax[]> => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (isActive !== undefined) params.append('is_active', isActive.toString())
    
    const response = await axios.get(`${getTaxApiUrl()}?${params.toString()}`)
    return response.data.taxes || response.data.results || []
  },

  getTax: async (taxId: string): Promise<Tax> => {
    const response = await axios.get(`${getTaxApiUrl()}${taxId}/`)
    return response.data.tax || response.data
  },

  createTax: async (data: TaxCreate): Promise<Tax> => {
    const response = await axios.post(getTaxApiUrl(), data)
    return response.data.tax || response.data
  },

  updateTax: async (taxId: string, data: TaxUpdate): Promise<Tax> => {
    const response = await axios.patch(`${getTaxApiUrl()}${taxId}/`, data)
    return response.data.tax || response.data
  },

  deleteTax: async (taxId: string): Promise<void> => {
    await axios.delete(`${getTaxApiUrl()}${taxId}/`)
  },

  markAsInactive: async (taxId: string): Promise<Tax> => {
    const response = await axios.post(`${getTaxApiUrl()}${taxId}/mark_as_inactive/`)
    return response.data.tax || response.data
  },

  markAsActive: async (taxId: string): Promise<Tax> => {
    const response = await axios.post(`${getTaxApiUrl()}${taxId}/mark_as_active/`)
    return response.data.tax || response.data
  },

  bulkMarkInactive: async (taxIds: string[]): Promise<void> => {
    await axios.post(`${getTaxApiUrl()}bulk_mark_inactive/`, { tax_ids: taxIds })
  },

  // Tax Group endpoints
  getTaxGroups: async (search?: string): Promise<TaxGroup[]> => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    
    const response = await axios.get(`${getTaxGroupApiUrl()}?${params.toString()}`)
    return response.data.tax_groups || response.data.results || []
  },

  getTaxGroup: async (groupId: string): Promise<TaxGroup> => {
    const response = await axios.get(`${getTaxGroupApiUrl()}${groupId}/`)
    return response.data.tax_group || response.data
  },

  createTaxGroup: async (data: TaxGroupCreate): Promise<TaxGroup> => {
    const response = await axios.post(getTaxGroupApiUrl(), data)
    return response.data.tax_group || response.data
  },

  updateTaxGroup: async (groupId: string, data: TaxGroupUpdate): Promise<TaxGroup> => {
    const response = await axios.patch(`${getTaxGroupApiUrl()}${groupId}/`, data)
    return response.data.tax_group || response.data
  },

  deleteTaxGroup: async (groupId: string): Promise<void> => {
    await axios.delete(`${getTaxGroupApiUrl()}${groupId}/`)
  }
}

// React Query hooks for Taxes
export const useTaxes = (search?: string, isActive?: boolean) => {
  return useQuery({
    queryKey: ['taxes', search, isActive],
    queryFn: () => taxApi.getTaxes(search, isActive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTax = (taxId: string) => {
  return useQuery({
    queryKey: ['tax', taxId],
    queryFn: () => taxApi.getTax(taxId),
    enabled: !!taxId,
  })
}

export const useCreateTax = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.createTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
    },
  })
}

export const useUpdateTax = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taxId, data }: { taxId: string; data: TaxUpdate }) =>
      taxApi.updateTax(taxId, data),
    onSuccess: (updatedTax) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['tax', updatedTax.tax_id] })
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
    },
  })
}

export const useDeleteTax = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.deleteTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
    },
  })
}

export const useMarkTaxAsInactive = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.markAsInactive,
    onSuccess: (updatedTax) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['tax', updatedTax.tax_id] })
    },
  })
}

export const useMarkTaxAsActive = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.markAsActive,
    onSuccess: (updatedTax) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['tax', updatedTax.tax_id] })
    },
  })
}

export const useBulkMarkTaxesInactive = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.bulkMarkInactive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
    },
  })
}

// React Query hooks for Tax Groups
export const useTaxGroups = (search?: string) => {
  return useQuery({
    queryKey: ['taxGroups', search],
    queryFn: () => taxApi.getTaxGroups(search),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTaxGroup = (groupId: string) => {
  return useQuery({
    queryKey: ['taxGroup', groupId],
    queryFn: () => taxApi.getTaxGroup(groupId),
    enabled: !!groupId,
  })
}

export const useCreateTaxGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.createTaxGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
    },
  })
}

export const useUpdateTaxGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: TaxGroupUpdate }) =>
      taxApi.updateTaxGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
      queryClient.invalidateQueries({ queryKey: ['taxGroup', updatedGroup.tax_group_id] })
    },
  })
}

export const useDeleteTaxGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taxApi.deleteTaxGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxGroups'] })
    },
  })
}