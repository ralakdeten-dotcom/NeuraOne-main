import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types based on actual backend Item model implementation
export interface FinanceItem {
  // Basic Information Fields
  item_id: string // UUID primary key
  name: string
  description: string | null
  status: 'active' | 'inactive'
  source: string | null
  created_time: string
  last_modified_time: string
  created_by: string | null
  updated_by: string | null

  // Product Classification Fields
  group_id: string | null
  item_type: 'inventory' | 'sales' | 'purchases' | 'sales_and_purchases'
  product_type: 'goods' | 'service'
  is_combo_product: boolean
  is_returnable: boolean

  // Pricing Fields
  rate: number // Sales price (selling_price in backend serializers)
  pricebook_rate: number | null
  purchase_rate: number // Cost price (cost_price in backend serializers)

  // Inventory Management Fields
  unit: string
  reorder_level: number
  initial_stock: number
  initial_stock_rate: number
  stock_on_hand: number
  actual_available_stock: number
  available_stock: number

  // Accounting Fields (ForeignKey to ChartOfAccount)
  account_id: string | null // Sales account
  purchase_account_id: string | null
  inventory_account_id: string | null

  // Product Identifiers Fields  
  sku: string | null // Can be null, but unique when provided
  upc: string | null // 12 digits
  ean: string | null // 13 digits  
  isbn: string | null
  mpn: string | null // Manufacturer Part Number (not part_number)

  // Physical Attributes Fields (actually implemented in backend)
  length: number | null
  width: number | null
  height: number | null
  dimension_unit: 'cm' | 'in' | null
  weight: number | null
  weight_unit: 'kg' | 'lbs' | 'g' | 'oz' | null

  // Sales and Purchase Information
  sales_description: string | null
  purchase_description: string | null

  // Vendor Management Fields
  vendor_id: string | null
  
  // Product Variants & Attributes Fields
  attribute_id1: number | null
  attribute_name1: string | null
  attribute_option_id1: number | null
  attribute_option_name1: string | null

  // Media Fields
  image_id: number | null
  image_name: string | null
  image_type: string | null
  documents: any[] // JSONField

  // Property methods (computed by backend)
  group_name?: string | null
  vendor_name?: string | null
  account_name?: string | null
  purchase_account_name?: string | null
  is_low_stock?: boolean
}

// Lightweight list item interface for performance (matches ItemListSerializer)
export interface FinanceItemListItem {
  item_id: string
  name: string
  sku: string | null
  item_type: 'inventory' | 'sales' | 'purchases' | 'sales_and_purchases'
  product_type: 'goods' | 'service'
  rate: number
  purchase_rate: number // Cost price
  stock_on_hand: number
  status: 'active' | 'inactive'
  group_name: string | null
  vendor_name: string | null
  is_low_stock: boolean
  unit: string
  reorder_level: number
  mpn: string | null // Manufacturer Part Number
  weight: number | null
  weight_unit: string | null
  sales_description?: string | null
  purchase_description?: string | null
  image_name?: string | null
}

// Create/Update item interface based on frontend form needs
export interface CreateFinanceItemData {
  // Basic Information
  name: string
  description?: string
  sku?: string // Optional, but unique when provided
  
  // Classification
  item_type: 'inventory' | 'sales' | 'purchases' | 'sales_and_purchases'
  product_type: 'goods' | 'service'
  group_id?: string
  
  // Pricing
  rate: number // Sales price
  purchase_rate: number // Cost price
  pricebook_rate?: number
  
  // Inventory
  unit?: string
  reorder_level?: number
  initial_stock?: number
  initial_stock_rate?: number
  
  // Accounting
  account_id?: string // sales account
  purchase_account_id?: string
  inventory_account_id?: string
  
  // Vendor
  vendor_id?: string
  
  // Descriptions
  sales_description?: string
  purchase_description?: string
  
  // Product Identifiers
  upc?: string // 12 digits
  ean?: string // 13 digits
  isbn?: string
  mpn?: string // Manufacturer Part Number
  
  // Physical Attributes
  length?: number
  width?: number
  height?: number
  dimension_unit?: 'cm' | 'in'
  weight?: number
  weight_unit?: 'kg' | 'lbs' | 'g' | 'oz'
  
  // Status
  status?: 'active' | 'inactive'
  is_combo_product?: boolean
  is_returnable?: boolean
  
  // Initial locations for stock (backend supports this)
  initial_locations?: Array<{
    location_id: string
    stock: number
    is_primary: boolean
  }>
  
  // Custom fields
  custom_fields?: Record<string, any>
  
  // Media
  images?: File[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API URL helper - using correct items endpoint
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/inventory/items/`
}

// Transform backend item to frontend format
const transformBackendItem = (item: any): FinanceItem => {
  return {
    // Basic Information
    item_id: item.item_id,
    name: item.name,
    description: item.description,
    status: item.status,
    source: item.source,
    created_time: item.created_time,
    last_modified_time: item.last_modified_time,
    created_by: item.created_by,
    updated_by: item.updated_by,
    
    // Classification
    group_id: item.group_id,
    item_type: item.item_type,
    product_type: item.product_type,
    is_combo_product: item.is_combo_product,
    is_returnable: item.is_returnable,
    
    // Pricing
    rate: Number(item.rate) || 0,
    pricebook_rate: item.pricebook_rate ? Number(item.pricebook_rate) : null,
    purchase_rate: Number(item.purchase_rate) || 0,
    
    // Inventory
    unit: item.unit || 'pcs',
    reorder_level: Number(item.reorder_level) || 0,
    initial_stock: Number(item.initial_stock) || 0,
    initial_stock_rate: Number(item.initial_stock_rate) || 0,
    stock_on_hand: Number(item.stock_on_hand) || 0,
    actual_available_stock: Number(item.actual_available_stock) || 0,
    available_stock: Number(item.available_stock) || 0,
    
    // Accounting
    account_id: item.account_id,
    purchase_account_id: item.purchase_account_id,
    inventory_account_id: item.inventory_account_id,
    
    // Product Identifiers
    sku: item.sku,
    upc: item.upc,
    ean: item.ean,
    isbn: item.isbn,
    mpn: item.mpn, // Backend uses mpn not part_number
    
    // Physical Attributes
    length: item.length ? Number(item.length) : null,
    width: item.width ? Number(item.width) : null,
    height: item.height ? Number(item.height) : null,
    dimension_unit: item.dimension_unit,
    weight: item.weight ? Number(item.weight) : null,
    weight_unit: item.weight_unit,
    
    // Descriptions
    sales_description: item.sales_description,
    purchase_description: item.purchase_description,
    
    // Vendor
    vendor_id: item.vendor_id,
    
    // Attributes
    attribute_id1: item.attribute_id1,
    attribute_name1: item.attribute_name1,
    attribute_option_id1: item.attribute_option_id1,
    attribute_option_name1: item.attribute_option_name1,
    
    // Media
    image_id: item.image_id,
    image_name: item.image_name,
    image_type: item.image_type,
    documents: item.documents || [],
    
    // Property methods (from backend)
    group_name: item.group_name,
    vendor_name: item.vendor_name,
    account_name: item.account_name,
    purchase_account_name: item.purchase_account_name,
    is_low_stock: item.is_low_stock
  }
}

// Transform backend item to list item format (matches ItemListSerializer)
const transformToListItem = (item: any): FinanceItemListItem => {
  return {
    item_id: item.item_id,
    name: item.name,
    sku: item.sku,
    item_type: item.item_type,
    product_type: item.product_type,
    rate: Number(item.rate) || 0,
    purchase_rate: Number(item.purchase_rate) || 0,
    stock_on_hand: Number(item.stock_on_hand) || 0,
    status: item.status,
    group_name: item.group_name,
    vendor_name: item.vendor_name,
    is_low_stock: item.is_low_stock,
    unit: item.unit || 'pcs',
    reorder_level: Number(item.reorder_level) || 0,
    mpn: item.mpn,
    weight: item.weight ? Number(item.weight) : null,
    weight_unit: item.weight_unit,
    sales_description: item.sales_description,
    purchase_description: item.purchase_description,
    image_name: item.image_name
  }
}

// Transform frontend create data to backend format (matches backend serializers)
const transformCreateData = (itemData: CreateFinanceItemData) => {
  const payload: any = {
    name: itemData.name,
    description: itemData.description || null,
    sku: itemData.sku || null,
    
    item_type: itemData.item_type,
    product_type: itemData.product_type,
    group_id: itemData.group_id || null,
    
    rate: itemData.rate,
    purchase_rate: itemData.purchase_rate,
    pricebook_rate: itemData.pricebook_rate || null,
    
    unit: itemData.unit || 'pcs',
    reorder_level: itemData.reorder_level || 0,
    initial_stock: itemData.initial_stock || 0,
    initial_stock_rate: itemData.initial_stock_rate || 0,
    
    account_id: itemData.account_id || null,
    purchase_account_id: itemData.purchase_account_id || null,
    inventory_account_id: itemData.inventory_account_id || null,
    
    vendor_id: itemData.vendor_id || null,
    
    sales_description: itemData.sales_description || null,
    purchase_description: itemData.purchase_description || null,
    
    upc: itemData.upc || null,
    ean: itemData.ean || null,
    isbn: itemData.isbn || null,
    mpn: itemData.mpn || null, // Backend uses mpn
    
    length: itemData.length || null,
    width: itemData.width || null,
    height: itemData.height || null,
    dimension_unit: itemData.dimension_unit || null,
    weight: itemData.weight || null,
    weight_unit: itemData.weight_unit || null,
    
    status: itemData.status || 'active',
    is_combo_product: itemData.is_combo_product || false,
    is_returnable: itemData.is_returnable !== undefined ? itemData.is_returnable : true
  }
  
  // Add initial locations if provided (backend supports this)
  if (itemData.initial_locations && itemData.initial_locations.length > 0) {
    payload.initial_locations = itemData.initial_locations
  }
  
  // Add custom fields if provided (backend supports this)
  if (itemData.custom_fields && Object.keys(itemData.custom_fields).length > 0) {
    payload.custom_fields = itemData.custom_fields
  }
  
  return payload
}

// API functions matching backend ItemViewSet
const financeItemsApi = {
  // Get paginated list of items (uses ItemListSerializer)
  getItems: async (page = 1, pageSize = 20, filters: any = {}): Promise<PaginatedResponse<FinanceItemListItem>> => {
    const response = await axios.get(getApiUrl(), {
      params: {
        page,
        page_size: pageSize,
        // Backend supports these filters
        search: filters.search,
        status: filters.status,
        item_type: filters.item_type,
        product_type: filters.product_type,
        group_id: filters.group_id,
        vendor_id: filters.vendor_id,
        low_stock: filters.low_stock,
        ordering: filters.ordering || '-created_time'
      },
      withCredentials: true,
    })
    
    return {
      ...response.data,
      results: response.data.results.map(transformToListItem)
    }
  },

  // Get single item details (uses ItemDetailSerializer)
  getItem: async (itemId: string): Promise<FinanceItem> => {
    const response = await axios.get(`${getApiUrl()}${itemId}/`, {
      withCredentials: true,
    })
    
    return transformBackendItem(response.data)
  },

  // Create new item (uses ItemCreateSerializer)
  createItem: async (itemData: CreateFinanceItemData): Promise<FinanceItem> => {
    const payload = transformCreateData(itemData)
    
    const response = await axios.post(getApiUrl(), payload, {
      withCredentials: true,
    })
    
    return transformBackendItem(response.data)
  },

  // Update existing item (uses ItemUpdateSerializer)
  updateItem: async (itemId: string, itemData: CreateFinanceItemData): Promise<FinanceItem> => {
    const payload = transformCreateData(itemData)
    
    const response = await axios.put(`${getApiUrl()}${itemId}/`, payload, {
      withCredentials: true,
    })
    
    return transformBackendItem(response.data)
  },

  // Partially update item
  patchItem: async (itemId: string, data: Partial<CreateFinanceItemData>): Promise<FinanceItem> => {
    const response = await axios.patch(`${getApiUrl()}${itemId}/`, data, {
      withCredentials: true,
    })
    
    return transformBackendItem(response.data)
  },

  // Soft delete (set status to inactive) - backend overrides destroy method
  deleteItem: async (itemId: string): Promise<void> => {
    await axios.delete(`${getApiUrl()}${itemId}/`, {
      withCredentials: true,
    })
  },

  // Action endpoints from backend ItemViewSet
  activateItem: async (itemId: string): Promise<void> => {
    await axios.post(`${getApiUrl()}${itemId}/active/`, {}, {
      withCredentials: true,
    })
  },

  deactivateItem: async (itemId: string): Promise<void> => {
    await axios.post(`${getApiUrl()}${itemId}/inactive/`, {}, {
      withCredentials: true,
    })
  },

  // Remove item image
  removeImage: async (itemId: string): Promise<void> => {
    await axios.delete(`${getApiUrl()}${itemId}/image/`, {
      withCredentials: true,
    })
  },

  // Get stock across all locations
  getStock: async (itemId: string): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}${itemId}/stock/`, {
      withCredentials: true,
    })
    return response.data
  },

  // Stock adjustment
  adjustStock: async (itemId: string, adjustmentData: {
    adjustment_type: 'increase' | 'decrease'
    quantity: number
    reason?: string
    location_id?: string
  }): Promise<any> => {
    const response = await axios.post(`${getApiUrl()}${itemId}/adjust-stock/`, adjustmentData, {
      withCredentials: true,
    })
    return response.data
  },

  // Get items below reorder level
  getLowStockItems: async (): Promise<FinanceItemListItem[]> => {
    const response = await axios.get(`${getApiUrl()}low-stock/`, {
      withCredentials: true,
    })
    
    return response.data.map(transformToListItem)
  },

  // Custom fields operations
  getCustomFields: async (itemId: string): Promise<any[]> => {
    const response = await axios.get(`${getApiUrl()}${itemId}/customfields/`, {
      withCredentials: true,
    })
    return response.data
  },

  updateCustomFields: async (itemId: string, customFields: Record<string, any>): Promise<any> => {
    const response = await axios.put(`${getApiUrl()}${itemId}/customfields/`, customFields, {
      withCredentials: true,
    })
    return response.data
  },

  // Sales and Purchase information endpoints
  getSalesInfo: async (itemId: string): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}${itemId}/sales-info/`, {
      withCredentials: true,
    })
    return response.data
  },

  updateSalesInfo: async (itemId: string, salesData: any): Promise<any> => {
    const response = await axios.put(`${getApiUrl()}${itemId}/sales-info/`, salesData, {
      withCredentials: true,
    })
    return response.data
  },

  getPurchaseInfo: async (itemId: string): Promise<any> => {
    const response = await axios.get(`${getApiUrl()}${itemId}/purchase-info/`, {
      withCredentials: true,
    })
    return response.data
  },

  updatePurchaseInfo: async (itemId: string, purchaseData: any): Promise<any> => {
    const response = await axios.put(`${getApiUrl()}${itemId}/purchase-info/`, purchaseData, {
      withCredentials: true,
    })
    return response.data
  },

  // Bulk operations (using ItemDetailViewSet)
  bulkFetch: async (itemIds: string[]): Promise<FinanceItem[]> => {
    const response = await axios.get(`${getApiUrl().replace('/items/', '/itemdetails/')}`, {
      params: { item_ids: itemIds.join(',') },
      withCredentials: true,
    })
    
    return response.data.items.map(transformBackendItem)
  }
}

// React Query hooks
export const useFinanceItems = (page = 1, pageSize = 20, filters: any = {}) => {
  return useQuery({
    queryKey: ['finance-items', page, pageSize, filters],
    queryFn: () => financeItemsApi.getItems(page, pageSize, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export const useFinanceItem = (itemId: string) => {
  return useQuery({
    queryKey: ['finance-items', itemId],
    queryFn: () => financeItemsApi.getItem(itemId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!itemId,
  })
}

export const useCreateFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemData: CreateFinanceItemData) => financeItemsApi.createItem(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
    },
  })
}

export const useUpdateFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, itemData }: { itemId: string; itemData: CreateFinanceItemData }) => 
      financeItemsApi.updateItem(itemId, itemData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
      queryClient.invalidateQueries({ queryKey: ['finance-items', variables.itemId] })
    },
  })
}

export const usePatchFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<CreateFinanceItemData> }) => 
      financeItemsApi.patchItem(itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
      queryClient.invalidateQueries({ queryKey: ['finance-items', variables.itemId] })
    },
  })
}

export const useDeleteFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemId: string) => financeItemsApi.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
    },
  })
}

export const useActivateFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemId: string) => financeItemsApi.activateItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
    },
  })
}

export const useDeactivateFinanceItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemId: string) => financeItemsApi.deactivateItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
    },
  })
}

export const useAdjustStock = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, adjustmentData }: { 
      itemId: string; 
      adjustmentData: {
        adjustment_type: 'increase' | 'decrease'
        quantity: number
        reason?: string
        location_id?: string
      }
    }) => financeItemsApi.adjustStock(itemId, adjustmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-items'] })
    },
  })
}

export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['finance-items', 'low-stock'],
    queryFn: () => financeItemsApi.getLowStockItems(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })
}

export const useBulkFetchItems = (itemIds: string[]) => {
  return useQuery({
    queryKey: ['finance-items', 'bulk', itemIds.sort().join(',')],
    queryFn: () => financeItemsApi.bulkFetch(itemIds),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: itemIds.length > 0,
  })
}

export const useItemStock = (itemId: string) => {
  return useQuery({
    queryKey: ['finance-items', itemId, 'stock'],
    queryFn: () => financeItemsApi.getStock(itemId),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
    enabled: !!itemId,
  })
}

export const useItemCustomFields = (itemId: string) => {
  return useQuery({
    queryKey: ['finance-items', itemId, 'custom-fields'],
    queryFn: () => financeItemsApi.getCustomFields(itemId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!itemId,
  })
}

export const useUpdateCustomFields = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, customFields }: { itemId: string; customFields: Record<string, any> }) => 
      financeItemsApi.updateCustomFields(itemId, customFields),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-items', variables.itemId, 'custom-fields'] })
    },
  })
}

export default financeItemsApi