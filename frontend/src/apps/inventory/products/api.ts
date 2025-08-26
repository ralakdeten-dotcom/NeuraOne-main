import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getApiBaseUrl } from '@/utils/tenant'


// Types
export interface Product {
  product_id: number
  tenant: number
  name: string
  sku?: string
  description?: string
  manufacturer?: string
  category?: string
  part_number?: string
  unit?: string
  price: number
  current_price?: number
  unit_cost?: number
  type: 'inventory' | 'non-inventory' | 'service'
  billing_frequency: 'one-time' | 'monthly' | 'yearly'
  term?: string
  stock: number
  vendor_name?: string
  vendor_price?: number
  product_condition: 'new' | 'used' | 'refurbished' | 'damaged'
  url?: string
  image_url?: string
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
  margin?: number
  margin_percentage?: number
}

export interface ProductListItem {
  product_id: number
  name: string
  sku?: string
  manufacturer?: string
  category?: string
  part_number?: string
  unit?: string
  type: 'inventory' | 'non-inventory' | 'service'
  price: number
  current_price?: number
  unit_cost?: number
  billing_frequency: 'one-time' | 'monthly' | 'yearly'
  stock: number
  vendor_name?: string
  product_condition: 'new' | 'used' | 'refurbished' | 'damaged'
  margin?: number
  margin_percentage?: number
  created_at: string
}

export interface ProductCreate {
  name: string
  sku?: string
  description?: string
  manufacturer?: string
  category?: string
  part_number?: string
  unit?: string
  price?: number
  current_price?: number
  unit_cost?: number
  type: 'inventory' | 'non-inventory' | 'service'
  stock?: number
  vendor_name?: string
  vendor_price?: number
  product_condition?: 'new' | 'used' | 'refurbished' | 'damaged'
  url?: string
  image_url?: string
}

export interface ProductSummary {
  total_products: number
  inventory_products: number
  service_products: number
  non_inventory_products: number
  total_value: number
  avg_price: number
  avg_margin?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/inventory/products/`
}

// API functions
const productApi = {
  getProducts: async (page = 1, pageSize = 20): Promise<PaginatedResponse<ProductListItem>> => {
    try {
      console.log('Fetching products:', { page, pageSize })
      const response = await axios.get(getApiUrl(), {
        params: {
          page,
          page_size: pageSize,
        },
        withCredentials: true,
      })
      console.log('Products fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error fetching products:', error)
      const message = error.response?.data?.error || error.message || 'Failed to fetch products'
      throw new Error(message)
    }
  },

  getProduct: async (id: number): Promise<Product> => {
    try {
      console.log('Fetching product:', id)
      const response = await axios.get(`${getApiUrl()}${id}/`, {
        withCredentials: true,
      })
      console.log('Product fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error fetching product:', error)
      const message = error.response?.data?.error || error.message || 'Failed to fetch product'
      throw new Error(message)
    }
  },

  createProduct: async (data: ProductCreate): Promise<Product> => {
    try {
      console.log('Creating product:', data)
      const response = await axios.post(getApiUrl(), data, {
        withCredentials: true,
      })
      console.log('Product created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error creating product:', error)
      const message = error.response?.data?.error || error.message || 'Failed to create product'
      throw new Error(message)
    }
  },

  updateProduct: async ({ id, data }: { id: number; data: Partial<ProductCreate> }): Promise<Product> => {
    try {
      console.log('Updating product:', { id, data })
      const response = await axios.patch(`${getApiUrl()}${id}/`, data, {
        withCredentials: true,
      })
      console.log('Product updated successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error updating product:', error)
      const message = error.response?.data?.error || error.message || 'Failed to update product'
      throw new Error(message)
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    try {
      console.log('Deleting product:', id)
      await axios.delete(`${getApiUrl()}${id}/`, {
        withCredentials: true,
      })
      console.log('Product deleted successfully')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      const message = error.response?.data?.error || error.message || 'Failed to delete product'
      throw new Error(message)
    }
  },

  getProductSummary: async (): Promise<ProductSummary> => {
    try {
      console.log('Fetching product summary')
      const response = await axios.get(`${getApiUrl()}summary/`, {
        withCredentials: true,
      })
      console.log('Product summary fetched successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error fetching product summary:', error)
      const message = error.response?.data?.error || error.message || 'Failed to fetch product summary'
      throw new Error(message)
    }
  },
}

// React Query hooks
export const useProducts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['inventory-products', page, pageSize],
    queryFn: () => productApi.getProducts(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['inventory-products', id],
    queryFn: () => productApi.getProduct(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!id && id > 0,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: async () => {
      console.log('Product created, invalidating queries...')
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-products'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-product-summary'],
        type: 'active'
      })
    },
    onError: (error) => {
      console.error('Create product mutation failed:', error)
    }
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.updateProduct,
    onSuccess: async (data) => {
      console.log('Product updated, invalidating queries...')
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-products'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-products', data.product_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-product-summary'],
        type: 'active'
      })
    },
    onError: (error) => {
      console.error('Update product mutation failed:', error)
    }
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: async () => {
      console.log('Product deleted, invalidating queries...')
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-products'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['inventory-product-summary'],
        type: 'active'
      })
    },
    onError: (error) => {
      console.error('Delete product mutation failed:', error)
    }
  })
}

export const useProductSummary = () => {
  return useQuery({
    queryKey: ['product-summary'],
    queryFn: productApi.getProductSummary,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

// Constants for form options
export const PRODUCT_TYPE_OPTIONS = [
  { value: 'inventory', label: 'Inventory' },
  { value: 'non-inventory', label: 'Non-Inventory' },
  { value: 'service', label: 'Service' }
] as const

export const PRODUCT_CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'damaged', label: 'Damaged' }
] as const

export const BILLING_FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
] as const

export const UNIT_OPTIONS = [
  { value: 'box', label: 'Box' },
  { value: 'cm', label: 'cm' },
  { value: 'dz', label: 'dz' },
  { value: 'ft', label: 'ft' },
  { value: 'g', label: 'g' },
  { value: 'in', label: 'in' },
  { value: 'kg', label: 'kg' },
  { value: 'km', label: 'km' },
  { value: 'lb', label: 'lb' },
  { value: 'mg', label: 'mg' },
  { value: 'ml', label: 'ml' },
  { value: 'm', label: 'm' },
  { value: 'pcs', label: 'pcs' },
] as const