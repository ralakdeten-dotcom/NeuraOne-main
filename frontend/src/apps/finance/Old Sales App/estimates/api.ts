import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'
import type { EstimateToInvoiceData } from '@/apps/finance/Old Sales App/invoices/api'

// Estimate types
export interface Estimate {
  estimate_id: number
  estimate_number: string
  po_number?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  status_display: string
  customer?: number
  customer_name?: string
  customer_company?: string
  account: number
  account_name: string
  contact?: number
  contact_name?: string
  deal?: number
  deal_name?: string
  owner?: number
  owner_name?: string
  subtotal: string
  total_amount: string
  estimate_date: string
  valid_until: string
  billing_attention?: string
  billing_street?: string
  billing_city?: string
  billing_state_province?: string
  billing_zip_postal_code?: string
  billing_country?: string
  shipping_attention?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state_province?: string
  shipping_zip_postal_code?: string
  shipping_country?: string
  shipping_fee?: string
  shipping_vat_rate?: string
  shipping_vat_amount?: string
  rush_fee?: string
  notes?: string
  terms_conditions?: string
  line_items: EstimateLineItem[]
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface EstimateListItem {
  estimate_id: number
  estimate_number: string
  po_number?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  status_display: string
  customer_name?: string
  account_name: string
  contact_name?: string
  deal_name?: string
  owner_name?: string
  subtotal: string
  total_amount: string
  estimate_date: string
  valid_until: string
  line_items_count: number
  created_at: string
  updated_at: string
}

export interface EstimateCreate {
  estimate_number?: string
  po_number?: string
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  customer?: number
  account: number
  contact?: number
  deal?: number
  owner?: number
  estimate_date: string
  valid_until: string
  billing_attention?: string
  billing_street?: string
  billing_city?: string
  billing_state_province?: string
  billing_zip_postal_code?: string
  billing_country?: string
  shipping_attention?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state_province?: string
  shipping_zip_postal_code?: string
  shipping_country?: string
  shipping_fee?: number
  shipping_vat_rate?: number
  rush_fee?: number
  notes?: string
  terms_conditions?: string
}

export interface EstimateLineItem {
  line_item_id: number
  estimate: number
  product: number
  product_name: string
  product_sku?: string
  product_type: string
  description?: string
  quantity: string
  unit_price: string
  discount_rate: string
  vat_rate: string
  vat_amount: string
  line_subtotal: string
  line_total: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EstimateLineItemCreate {
  estimate?: number
  product: number
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  vat_rate?: number
  sort_order?: number
}

export interface EstimateSummary {
  total_estimates: number
  total_value: string
  avg_estimate_value: string
  estimates_by_status: Record<string, { label: string; count: number }>
  estimates_expiring_soon: number
  recent_estimates: number
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
  const apiUrl = `${baseUrl}/api/finance/estimates/`
  console.log('🔍 Estimates API URL:', apiUrl)
  return apiUrl
}

const getLineItemsApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/finance/estimates/line-items/`
  console.log('🔍 Estimate Line Items API URL:', apiUrl)
  return apiUrl
}

const estimateApi = {
  // Get all estimates
  getEstimates: async (page = 1, pageSize = 20): Promise<PaginatedResponse<EstimateListItem>> => {
    try {
      const url = `${getApiUrl()}?page=${page}&page_size=${pageSize}`
      console.log('🔍 Fetching estimates from:', url)
      
      const response = await axios.get(url)
      
      console.log('🔍 Estimates response status:', response.status)
      console.log('🔍 Estimates data:', response.data)
      return response.data
    } catch (error) {
      console.error('🔍 Estimates API error:', error)
      throw error
    }
  },

  // Get single estimate
  getEstimate: async (id: number): Promise<Estimate> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create estimate
  createEstimate: async (data: EstimateCreate): Promise<Estimate> => {
    console.log('🔍 Creating estimate with data:', data)
    try {
      const response = await axios.post(getApiUrl(), data)
      console.log('✅ Estimate created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error creating estimate:', error.response?.data || error.message)
      throw error
    }
  },

  // Update estimate
  updateEstimate: async (id: number, data: Partial<EstimateCreate>): Promise<Estimate> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete estimate
  deleteEstimate: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get estimate summary
  getEstimateSummary: async (): Promise<EstimateSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Search estimates
  searchEstimates: async (query: string): Promise<EstimateListItem[]> => {
    const response = await axios.get(`${getApiUrl()}search/?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // Duplicate estimate
  duplicateEstimate: async (id: number): Promise<Estimate> => {
    const response = await axios.post(`${getApiUrl()}${id}/duplicate/`)
    return response.data
  },

  // Convert estimate to deal
  convertToDeal: async (id: number): Promise<{ message: string; deal_id: number; deal_name: string }> => {
    const response = await axios.post(`${getApiUrl()}${id}/convert-to-deal/`)
    return response.data
  },

  // Convert estimate to sales order
  convertToSalesOrder: async (id: number): Promise<{ message: string; sales_order_id: number; sales_order_number: string }> => {
    const response = await axios.post(`${getApiUrl()}${id}/convert_to_sales_order/`)
    return response.data
  },

  // Convert estimate to invoice
  convertToInvoice: async (id: number, data: EstimateToInvoiceData): Promise<{ message: string; invoice_id: number; invoice_number: string }> => {
    const response = await axios.post(`${getApiUrl()}${id}/convert_to_invoice/`, data)
    return response.data
  },

  // Line Items API
  getLineItems: async (): Promise<EstimateLineItem[]> => {
    const response = await axios.get(getLineItemsApiUrl())
    return response.data
  },

  createLineItem: async (data: EstimateLineItemCreate): Promise<EstimateLineItem> => {
    const response = await axios.post(getLineItemsApiUrl(), data)
    return response.data
  },

  updateLineItem: async (id: number, data: Partial<EstimateLineItemCreate>): Promise<EstimateLineItem> => {
    const response = await axios.patch(`${getLineItemsApiUrl()}${id}/`, data)
    return response.data
  },

  deleteLineItem: async (id: number): Promise<void> => {
    await axios.delete(`${getLineItemsApiUrl()}${id}/`)
  },

  reorderLineItems: async (lineItems: Array<{ line_item_id: number; sort_order: number }>): Promise<{ message: string }> => {
    const response = await axios.post(`${getLineItemsApiUrl()}reorder/`, { line_items: lineItems })
    return response.data
  },

  bulkUpdateVat: async (lineItemIds: number[], vatRate: number): Promise<{ message: string; vat_rate: number }> => {
    const response = await axios.post(`${getLineItemsApiUrl()}bulk-update-vat/`, {
      line_item_ids: lineItemIds,
      vat_rate: vatRate
    })
    return response.data
  }
}

// React Query hooks
export const useEstimates = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['estimates', page, pageSize],
    queryFn: () => estimateApi.getEstimates(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEstimate = (id: number) => {
  return useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimateApi.getEstimate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.createEstimate,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-summary'],
        type: 'active'
      })
    },
  })
}

export const useUpdateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EstimateCreate> }) => 
      estimateApi.updateEstimate(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate', data.estimate_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.deleteEstimate,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-summary'],
        type: 'active'
      })
    },
  })
}

export const useEstimateSummary = () => {
  return useQuery({
    queryKey: ['estimate-summary'],
    queryFn: estimateApi.getEstimateSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSearchEstimates = (query: string) => {
  return useQuery({
    queryKey: ['search-estimates', query],
    queryFn: () => estimateApi.searchEstimates(query),
    enabled: !!query && query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useDuplicateEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.duplicateEstimate,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
    },
  })
}

export const useConvertToDeal = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.convertToDeal,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['deals'],
        type: 'active'
      })
    },
  })
}

export const useConvertToSalesOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.convertToSalesOrder,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['sales-orders'],
        type: 'active'
      })
    },
  })
}

export const useConvertToInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EstimateToInvoiceData }) => 
      estimateApi.convertToInvoice(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['estimates'] })
      await queryClient.refetchQueries({ queryKey: ['invoices'] })
    }
  })
}

// Line Items hooks
export const useLineItems = () => {
  return useQuery({
    queryKey: ['estimate-line-items'],
    queryFn: estimateApi.getLineItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.createLineItem,
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimate', data.estimate],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-line-items'],
        type: 'active'
      })
    },
  })
}

export const useUpdateLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EstimateLineItemCreate> }) => 
      estimateApi.updateLineItem(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimate', data.estimate],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-line-items'],
        type: 'active'
      })
    },
  })
}

export const useDeleteLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.deleteLineItem,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-line-items'],
        type: 'active'
      })
    },
  })
}

export const useReorderLineItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: estimateApi.reorderLineItems,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-line-items'],
        type: 'active'
      })
    },
  })
}

export const useBulkUpdateVat = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ lineItemIds, vatRate }: { lineItemIds: number[]; vatRate: number }) => 
      estimateApi.bulkUpdateVat(lineItemIds, vatRate),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimate-line-items'],
        type: 'active'
      })
    },
  })
}