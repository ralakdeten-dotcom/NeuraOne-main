import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'
import type { 
  Customer, 
  CustomerListItem, 
  CustomerCreate, 
  PaginatedResponse,
  LinkEntityResponse,
  BalanceSummary
} from '../customers/api'

// Re-export types with vendor-specific aliases
export type Vendor = Customer
export type VendorListItem = CustomerListItem
export type VendorCreate = CustomerCreate

export interface VendorStats {
  total_vendors: number
  active_vendors: number
  inactive_vendors: number
  business_vendors: number
  individual_vendors: number
  by_currency: Record<string, number>
  recent_vendors: number
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/finance/vendors/`
}

// API functions
const vendorApi = {
  // Get all vendors
  getVendors: async (page = 1, pageSize = 20, search?: string, filters?: Record<string, string>): Promise<PaginatedResponse<VendorListItem>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    if (search) params.append('search', search)
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    
    const response = await axios.get(`${getApiUrl()}?${params.toString()}`)
    return response.data
  },

  // Get single vendor
  getVendor: async (id: number): Promise<Vendor> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create vendor
  createVendor: async (data: VendorCreate): Promise<Vendor> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update vendor
  updateVendor: async (id: number, data: Partial<VendorCreate>): Promise<Vendor> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete vendor
  deleteVendor: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get vendor stats
  getVendorStats: async (): Promise<VendorStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },
  
  // Linking endpoints
  linkToCustomer: async (vendorId: number, customerId: number): Promise<LinkEntityResponse> => {
    const response = await axios.post(`${getApiUrl()}${vendorId}/link_to_customer/`, {
      contact_id: customerId
    })
    return response.data
  },
  
  unlinkCustomer: async (vendorId: number): Promise<{ message: string }> => {
    const response = await axios.delete(`${getApiUrl()}${vendorId}/unlink_customer/`)
    return response.data
  },
  
  getBalanceSummary: async (vendorId: number): Promise<BalanceSummary> => {
    const response = await axios.get(`${getApiUrl()}${vendorId}/balance_summary/`)
    return response.data
  }
}

// React Query hooks
export const useVendors = (page = 1, pageSize = 20, search?: string, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['vendors', page, pageSize, search, filters],
    queryFn: () => vendorApi.getVendors(page, pageSize, search, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useVendor = (id: number) => {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorApi.getVendor(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vendorApi.createVendor,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['vendors'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['vendor-stats'],
        type: 'active'
      })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VendorCreate> }) => 
      vendorApi.updateVendor(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['vendors'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['vendor', data.contact_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['vendor-stats'],
        type: 'active'
      })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vendorApi.deleteVendor,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['vendors'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['vendor-stats'],
        type: 'active'
      })
    },
  })
}

export const useVendorStats = () => {
  return useQuery({
    queryKey: ['vendor-stats'],
    queryFn: vendorApi.getVendorStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Linking hooks
export const useLinkToCustomer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ vendorId, customerId }: { vendorId: number; customerId: number }) =>
      vendorApi.linkToCustomer(vendorId, customerId),
    onSuccess: async (_data, variables) => {
      // Refetch vendor data
      await queryClient.refetchQueries({
        queryKey: ['vendor', variables.vendorId],
        type: 'active'
      })
      // Refetch vendors list
      await queryClient.refetchQueries({
        queryKey: ['vendors'],
        type: 'active'
      })
      // Refetch balance summary
      await queryClient.refetchQueries({
        queryKey: ['vendor-balance-summary', variables.vendorId],
        type: 'active'
      })
    },
  })
}

export const useUnlinkCustomer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (vendorId: number) =>
      vendorApi.unlinkCustomer(vendorId),
    onSuccess: async (_data, vendorId) => {
      // Refetch vendor data
      await queryClient.refetchQueries({
        queryKey: ['vendor', vendorId],
        type: 'active'
      })
      // Refetch vendors list
      await queryClient.refetchQueries({
        queryKey: ['vendors'],
        type: 'active'
      })
      // Invalidate balance summary
      queryClient.removeQueries({
        queryKey: ['vendor-balance-summary', vendorId]
      })
    },
  })
}

export const useVendorBalanceSummary = (vendorId: number) => {
  return useQuery({
    queryKey: ['vendor-balance-summary', vendorId],
    queryFn: () => vendorApi.getBalanceSummary(vendorId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Re-export constants from customer API
export { 
  CUSTOMER_TYPE_OPTIONS,
  CUSTOMER_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  VAT_TREATMENT_OPTIONS
} from '../customers/api'