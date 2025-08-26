import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'
import type { SalesOrderToInvoiceData } from '@/apps/finance/Old Sales App/invoices/api'

// Sales Order types
export interface SalesOrder {
  sales_order_id: number
  sales_order_number: string
  reference_number?: string
  po_number?: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled'
  status_display: string
  estimate?: number
  estimate_number?: string
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
  sales_order_date: string
  expected_shipment_date?: string
  actual_shipment_date?: string
  delivery_date?: string
  payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  payment_terms_display: string
  custom_payment_terms?: string
  delivery_method: 'standard' | 'express' | 'overnight' | 'pickup' | 'custom'
  delivery_method_display: string
  custom_delivery_method?: string
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
  customer_notes?: string
  terms_conditions?: string
  internal_notes?: string
  line_items: SalesOrderLineItem[]
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
  total_fees?: string
  fees_subtotal?: string
}

export interface SalesOrderListItem {
  sales_order_id: number
  sales_order_number: string
  reference_number?: string
  po_number?: string
  status: 'draft' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled'
  status_display: string
  customer_name?: string
  account_name: string
  contact_name?: string
  deal_name?: string
  owner_name?: string
  subtotal: string
  total_amount: string
  sales_order_date: string
  expected_shipment_date?: string
  line_items_count: number
  created_at: string
  updated_at: string
}

export interface SalesOrderCreate {
  sales_order_number?: string
  reference_number?: string
  po_number?: string
  status?: 'draft' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled'
  estimate?: number
  customer?: number
  account: number
  contact?: number
  deal?: number
  owner?: number
  sales_order_date: string
  expected_shipment_date?: string
  payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom'
  custom_payment_terms?: string
  delivery_method?: 'standard' | 'express' | 'overnight' | 'pickup' | 'custom'
  custom_delivery_method?: string
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
  customer_notes?: string
  terms_conditions?: string
  internal_notes?: string
}

export interface SalesOrderLineItem {
  line_item_id: number
  sales_order: number
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

export interface SalesOrderLineItemCreate {
  sales_order?: number
  product: number
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  vat_rate?: number
  sort_order?: number
}

export interface SalesOrderSummary {
  total_sales_orders: number
  total_value: string
  avg_order_value: string
  orders_by_status: Record<string, { label: string; count: number }>
  orders_pending_shipment: number
  recent_orders: number
  orders_this_month: number
  orders_last_month: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions
const fetchSalesOrders = async (page: number, pageSize: number): Promise<PaginatedResponse<SalesOrderListItem>> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.get(`${baseUrl}/api/finance/sales-orders/`, {
    params: {
      page,
      page_size: pageSize,
    },
  })
  return data
}

const fetchSalesOrder = async (id: number): Promise<SalesOrder> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.get(`${baseUrl}/api/finance/sales-orders/${id}/`)
  return data
}

const createSalesOrder = async (salesOrder: SalesOrderCreate): Promise<SalesOrder> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.post(`${baseUrl}/api/finance/sales-orders/`, salesOrder)
  return data
}

const updateSalesOrder = async ({ id, ...salesOrder }: { id: number } & Partial<SalesOrderCreate>): Promise<SalesOrder> => {
  const baseUrl = getApiBaseUrl()
  console.log('🔄 Updating sales order:', { id, data: salesOrder })
  try {
    const { data } = await axios.patch(`${baseUrl}/api/finance/sales-orders/${id}/`, salesOrder)
    console.log('✅ Sales order updated successfully:', data)
    return data
  } catch (error: any) {
    console.error('❌ Sales order update failed:', {
      status: error.response?.status,
      data: error.response?.data,
      payload: salesOrder
    })
    throw error
  }
}

const deleteSalesOrder = async (id: number): Promise<void> => {
  const baseUrl = getApiBaseUrl()
  await axios.delete(`${baseUrl}/api/finance/sales-orders/${id}/`)
}

const fetchSalesOrderSummary = async (): Promise<SalesOrderSummary> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.get(`${baseUrl}/api/finance/sales-orders/summary/`)
  return data
}

const duplicateSalesOrder = async (id: number): Promise<SalesOrder> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.post(`${baseUrl}/api/finance/sales-orders/${id}/duplicate/`)
  return data
}

const updateSalesOrderStatus = async ({ id, status }: { id: number; status: string }): Promise<SalesOrder> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/finance/sales-orders/${id}/update_status/`
  
  console.log('🔄 Calling update_status API:', {
    url,
    payload: { status },
    headers: axios.defaults.headers
  })
  
  try {
    const { data } = await axios.post(url, { status })
    console.log('✅ Update status API response:', data)
    return data
  } catch (error: any) {
    console.error('❌ Update status API error:', {
      url,
      error: error.response?.data || error.message,
      status: error.response?.status,
      headers: error.response?.headers
    })
    throw error
  }
}

// Line items API
const createSalesOrderLineItem = async (lineItem: SalesOrderLineItemCreate): Promise<SalesOrderLineItem> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.post(`${baseUrl}/api/finance/sales-orders/line-items/`, lineItem)
  return data
}

const updateSalesOrderLineItem = async ({ id, data: lineItemData }: { id: number; data: Partial<SalesOrderLineItemCreate> }): Promise<SalesOrderLineItem> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.patch(`${baseUrl}/api/finance/sales-orders/line-items/${id}/`, lineItemData)
  return data
}

const deleteSalesOrderLineItem = async (id: number): Promise<void> => {
  const baseUrl = getApiBaseUrl()
  await axios.delete(`${baseUrl}/api/finance/sales-orders/line-items/${id}/`)
}

const addLineItems = async ({ salesOrderId, lineItems }: { salesOrderId: number; lineItems: SalesOrderLineItemCreate[] }): Promise<SalesOrderLineItem[]> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.post(`${baseUrl}/api/finance/sales-orders/${salesOrderId}/add_line_items/`, lineItems)
  return data
}

const updateLineItem = async ({ id, ...lineItem }: { id: number } & Partial<SalesOrderLineItemCreate>): Promise<SalesOrderLineItem> => {
  const baseUrl = getApiBaseUrl()
  const { data } = await axios.patch(`${baseUrl}/api/finance/sales-orders/line-items/${id}/`, lineItem)
  return data
}

const deleteLineItem = async (id: number): Promise<void> => {
  const baseUrl = getApiBaseUrl()
  await axios.delete(`${baseUrl}/api/finance/sales-orders/line-items/${id}/`)
}

// Convert sales order to invoice
const convertToInvoice = async (id: number, data: SalesOrderToInvoiceData): Promise<{ message: string; invoice_id: number; invoice_number: string }> => {
  const baseUrl = getApiBaseUrl()
  const response = await axios.post(`${baseUrl}/api/finance/sales-orders/${id}/convert_to_invoice/`, data)
  return response.data
}

// React Query hooks
export const useSalesOrders = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['salesOrders', page, pageSize],
    queryFn: () => fetchSalesOrders(page, pageSize),
  })
}

export const useSalesOrder = (id: number) => {
  return useQuery({
    queryKey: ['salesOrder', id],
    queryFn: () => fetchSalesOrder(id),
    enabled: !!id,
  })
}

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
      queryClient.invalidateQueries({ queryKey: ['salesOrderSummary'] })
    },
  })
}

export const useUpdateSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSalesOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
      queryClient.invalidateQueries({ queryKey: ['salesOrder', data.sales_order_id] })
      queryClient.invalidateQueries({ queryKey: ['salesOrderSummary'] })
    },
  })
}

export const useDeleteSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
      queryClient.invalidateQueries({ queryKey: ['salesOrderSummary'] })
    },
  })
}

export const useSalesOrderSummary = () => {
  return useQuery({
    queryKey: ['salesOrderSummary'],
    queryFn: fetchSalesOrderSummary,
  })
}

export const useDuplicateSalesOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: duplicateSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
      queryClient.invalidateQueries({ queryKey: ['salesOrderSummary'] })
    },
  })
}

export const useUpdateSalesOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSalesOrderStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] })
      queryClient.invalidateQueries({ queryKey: ['salesOrder', data.sales_order_id] })
    },
  })
}

export const useAddLineItems = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addLineItems,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder', variables.salesOrderId] })
    },
  })
}

export const useUpdateLineItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLineItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] })
    },
  })
}

export const useDeleteLineItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLineItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] })
    },
  })
}

// New hooks for SalesOrderLineItemsList component
export const useCreateSalesOrderLineItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSalesOrderLineItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] })
    },
  })
}

export const useUpdateSalesOrderLineItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSalesOrderLineItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] })
    },
  })
}

export const useDeleteSalesOrderLineItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSalesOrderLineItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] })
    },
  })
}

export const useConvertToInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SalesOrderToInvoiceData }) => 
      convertToInvoice(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['sales-orders'] })
      await queryClient.refetchQueries({ queryKey: ['invoices'] })
    }
  })
}