import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Invoice types
export interface Invoice {
  invoice_id: number
  invoice_number: string
  po_number?: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  status_display: string
  estimate?: number
  estimate_number?: string
  sales_order?: number
  sales_order_number?: string
  customer?: number
  customer_name?: string
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
  amount_paid: string
  amount_due: string
  invoice_date: string
  due_date: string
  paid_date?: string
  payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  payment_terms_display: string
  custom_payment_terms?: string
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
  rush_fee?: string
  notes?: string
  terms_conditions?: string
  reference_number?: string
  line_items: InvoiceLineItem[]
  payments: InvoicePayment[]
  is_overdue: boolean
  days_overdue: number
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface InvoiceListItem {
  invoice_id: number
  invoice_number: string
  po_number?: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  status_display: string
  estimate_number?: string
  account_name: string
  contact_name?: string
  deal_name?: string
  owner_name?: string
  subtotal: string
  total_amount: string
  amount_paid: string
  amount_due: string
  invoice_date: string
  due_date: string
  paid_date?: string
  payment_terms: string
  line_items_count: number
  payments_count: number
  is_overdue: boolean
  days_overdue: number
  created_at: string
  updated_at: string
}

export interface InvoiceCreate {
  invoice_number?: string
  po_number?: string
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  estimate?: number
  sales_order?: number
  customer?: number
  account: number
  contact?: number
  deal?: number
  owner?: number
  invoice_date: string
  due_date?: string
  payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  custom_payment_terms?: string
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
  rush_fee?: string
  notes?: string
  terms_conditions?: string
  reference_number?: string
  line_items?: InvoiceLineItemCreate[]
}

export interface InvoiceLineItem {
  line_item_id: number
  invoice: number
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

export interface InvoiceLineItemCreate {
  invoice?: number
  product: number
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  vat_rate?: number
  sort_order?: number
}

export interface InvoicePayment {
  payment_id: number
  invoice: number
  amount: string
  payment_date: string
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'other'
  payment_method_display: string
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
}

export interface InvoicePaymentCreate {
  invoice: number
  amount: number
  payment_date: string
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe' | 'other'
  reference_number?: string
  notes?: string
}

export interface InvoiceSummary {
  total_invoices: number
  total_value: string
  total_paid: string
  total_outstanding: string
  avg_invoice_value: string
  invoices_by_status: Record<string, { label: string; count: number }>
  overdue_invoices: number
  overdue_amount: string
  recent_invoices: number
}

export interface EstimateToInvoiceData {
  invoice_number?: string
  invoice_date: string
  due_date?: string
  payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  custom_payment_terms?: string
  po_number?: string
  notes?: string
  terms_conditions?: string
  reference_number?: string
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
}

export interface SalesOrderToInvoiceData {
  invoice_number?: string
  invoice_date: string
  due_date?: string
  payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  custom_payment_terms?: string
  po_number?: string
  notes?: string
  terms_conditions?: string
  reference_number?: string
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
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
  const apiUrl = `${baseUrl}/api/finance/invoices/`
  console.log('🔍 Invoices API URL:', apiUrl)
  return apiUrl
}

const getLineItemsApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/finance/invoices/line-items/`
  console.log('🔍 Invoice Line Items API URL:', apiUrl)
  return apiUrl
}

const getPaymentsApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/finance/invoices/payments/`
  console.log('🔍 Invoice Payments API URL:', apiUrl)
  return apiUrl
}

const invoiceApi = {
  // Get all invoices
  getInvoices: async (page = 1, pageSize = 20): Promise<PaginatedResponse<InvoiceListItem>> => {
    try {
      const url = `${getApiUrl()}?page=${page}&page_size=${pageSize}`
      console.log('🔍 Fetching invoices from:', url)
      
      const response = await axios.get(url)
      
      console.log('🔍 Invoices response status:', response.status)
      console.log('🔍 Invoices data:', response.data)
      return response.data
    } catch (error) {
      console.error('🔍 Invoices API error:', error)
      throw error
    }
  },

  // Get single invoice
  getInvoice: async (id: number): Promise<Invoice> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create invoice
  createInvoice: async (data: InvoiceCreate): Promise<Invoice> => {
    console.log('🔍 Creating invoice with data:', data)
    try {
      const response = await axios.post(getApiUrl(), data)
      console.log('✅ Invoice created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Error creating invoice:', error.response?.data || error.message)
      throw error
    }
  },

  // Update invoice
  updateInvoice: async (id: number, data: Partial<InvoiceCreate>): Promise<Invoice> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete invoice
  deleteInvoice: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Create invoice from estimate
  createFromEstimate: async (estimateId: number, data: EstimateToInvoiceData): Promise<Invoice> => {
    const response = await axios.post(`${getApiUrl()}create_from_estimate/`, {
      estimate_id: estimateId,
      ...data
    })
    return response.data
  },

  // Convert estimate to invoice
  convertFromEstimate: async (estimateId: number, data: EstimateToInvoiceData): Promise<{ message: string; invoice_id: number; invoice_number: string }> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.post(`${baseUrl}/api/finance/estimates/${estimateId}/convert_to_invoice/`, data)
    return response.data
  },

  // Convert sales order to invoice
  convertFromSalesOrder: async (salesOrderId: number, data: SalesOrderToInvoiceData): Promise<{ message: string; invoice_id: number; invoice_number: string }> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.post(`${baseUrl}/api/finance/sales-orders/${salesOrderId}/convert_to_invoice/`, data)
    return response.data
  },

  // Mark invoice as sent
  markSent: async (id: number): Promise<Invoice> => {
    const response = await axios.post(`${getApiUrl()}${id}/mark_sent/`)
    return response.data
  },

  // Mark invoice as paid
  markPaid: async (id: number, amount?: number): Promise<Invoice> => {
    const response = await axios.post(`${getApiUrl()}${id}/mark_paid/`, 
      amount ? { amount } : {}
    )
    return response.data
  },

  // Cancel invoice
  cancelInvoice: async (id: number): Promise<Invoice> => {
    const response = await axios.post(`${getApiUrl()}${id}/cancel/`)
    return response.data
  },

  // Duplicate invoice
  duplicateInvoice: async (id: number): Promise<Invoice> => {
    const response = await axios.post(`${getApiUrl()}${id}/duplicate/`)
    return response.data
  },

  // Get invoice summary
  getInvoiceSummary: async (): Promise<InvoiceSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Search invoices
  searchInvoices: async (query: string): Promise<InvoiceListItem[]> => {
    const response = await axios.get(`${getApiUrl()}search/?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // Get overdue invoices
  getOverdueInvoices: async (): Promise<InvoiceListItem[]> => {
    const response = await axios.get(`${getApiUrl()}overdue/`)
    return response.data
  },

  // Line Items API
  getLineItems: async (): Promise<InvoiceLineItem[]> => {
    const response = await axios.get(getLineItemsApiUrl())
    return response.data
  },

  createLineItem: async (data: InvoiceLineItemCreate): Promise<InvoiceLineItem> => {
    const response = await axios.post(getLineItemsApiUrl(), data)
    return response.data
  },

  updateLineItem: async (id: number, data: Partial<InvoiceLineItemCreate>): Promise<InvoiceLineItem> => {
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
    const response = await axios.post(`${getLineItemsApiUrl()}bulk_update_vat/`, {
      line_item_ids: lineItemIds,
      vat_rate: vatRate
    })
    return response.data
  },

  // Payments API
  getPayments: async (): Promise<InvoicePayment[]> => {
    const response = await axios.get(getPaymentsApiUrl())
    return response.data
  },

  createPayment: async (data: InvoicePaymentCreate): Promise<InvoicePayment> => {
    const response = await axios.post(getPaymentsApiUrl(), data)
    return response.data
  },

  updatePayment: async (id: number, data: Partial<InvoicePaymentCreate>): Promise<InvoicePayment> => {
    const response = await axios.patch(`${getPaymentsApiUrl()}${id}/`, data)
    return response.data
  },

  deletePayment: async (id: number): Promise<void> => {
    await axios.delete(`${getPaymentsApiUrl()}${id}/`)
  }
}

// React Query hooks
export const useInvoices = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['invoices', page, pageSize],
    queryFn: () => invoiceApi.getInvoices(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useInvoice = (id: number) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-summary'],
        type: 'active'
      })
    },
  })
}

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InvoiceCreate> }) => 
      invoiceApi.updateInvoice(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-summary'],
        type: 'active'
      })
    },
  })
}

export const useCreateFromEstimate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ estimateId, data }: { estimateId: number; data: EstimateToInvoiceData }) => 
      invoiceApi.createFromEstimate(estimateId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['estimates'],
        type: 'active'
      })
    },
  })
}

export const useMarkInvoiceSent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.markSent,
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice_id],
        type: 'active'
      })
    },
  })
}

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount?: number }) => 
      invoiceApi.markPaid(id, amount),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice_id],
        type: 'active'
      })
    },
  })
}

export const useCancelInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.cancelInvoice,
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice_id],
        type: 'active'
      })
    },
  })
}

export const useDuplicateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.duplicateInvoice,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
    },
  })
}

export const useInvoiceSummary = () => {
  return useQuery({
    queryKey: ['invoice-summary'],
    queryFn: invoiceApi.getInvoiceSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSearchInvoices = (query: string) => {
  return useQuery({
    queryKey: ['search-invoices', query],
    queryFn: () => invoiceApi.searchInvoices(query),
    enabled: !!query && query.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useOverdueInvoices = () => {
  return useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: invoiceApi.getOverdueInvoices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Line Items hooks
export const useInvoiceLineItems = () => {
  return useQuery({
    queryKey: ['invoice-line-items'],
    queryFn: invoiceApi.getLineItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateInvoiceLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.createLineItem,
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-line-items'],
        type: 'active'
      })
    },
  })
}

export const useUpdateInvoiceLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InvoiceLineItemCreate> }) => 
      invoiceApi.updateLineItem(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-line-items'],
        type: 'active'
      })
    },
  })
}

export const useDeleteInvoiceLineItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.deleteLineItem,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-line-items'],
        type: 'active'
      })
    },
  })
}

// Payments hooks
export const useInvoicePayments = () => {
  return useQuery({
    queryKey: ['invoice-payments'],
    queryFn: invoiceApi.getPayments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateInvoicePayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.createPayment,
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-payments'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
    },
  })
}

export const useUpdateInvoicePayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InvoicePaymentCreate> }) => 
      invoiceApi.updatePayment(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoice', data.invoice],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-payments'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
    },
  })
}

export const useDeleteInvoicePayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: invoiceApi.deletePayment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['invoices'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['invoice-payments'],
        type: 'active'
      })
    },
  })
}

export const useConvertEstimateToInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ estimateId, data }: { estimateId: number; data: EstimateToInvoiceData }) => 
      invoiceApi.convertFromEstimate(estimateId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['invoices'] })
      await queryClient.refetchQueries({ queryKey: ['estimates'] })
    }
  })
}

export const useConvertSalesOrderToInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ salesOrderId, data }: { salesOrderId: number; data: SalesOrderToInvoiceData }) => 
      invoiceApi.convertFromSalesOrder(salesOrderId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['invoices'] })
      await queryClient.refetchQueries({ queryKey: ['sales-orders'] })
    }
  })
}