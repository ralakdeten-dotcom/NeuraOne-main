import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types matching backend serializers
export interface Customer {
  contact_id: number
  customer_number?: string  // Auto-generated CUST-XXXX
  vendor_number?: string    // Auto-generated VEND-XXXX
  contact_type?: 'customer' | 'vendor'
  display_name: string
  contact_name?: string
  company_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  customer_type: 'business' | 'individual'
  customer_status: 'active' | 'inactive' | 'suspended'
  currency: 'USD' | 'EUR' | 'GBP'
  payment_terms: 'immediate' | 'net15' | 'net30' | 'net60' | 'net90'
  credit_limit?: string
  vat_treatment?: 'uk' | 'overseas'
  vat_registration_number?: string
  outstanding_receivable_amount?: string
  receivable_account?: number
  payable_account?: number
  
  // Address fields
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
  
  // Related data
  account?: number  // Now optional for vendors
  primary_contact?: number
  owner?: number
  
  // Display fields (from serializer)
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  owner_name?: string
  receivable_account_name?: string
  payable_account_name?: string
  
  // Computed addresses
  billing_address?: {
    attention?: string
    street?: string
    city?: string
    state_province?: string
    zip_postal_code?: string
    country?: string
  }
  shipping_address?: {
    attention?: string
    street?: string
    city?: string
    state_province?: string
    zip_postal_code?: string
    country?: string
  }
  
  // New JSON fields
  tags?: string[]
  social_media?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    [key: string]: string | undefined
  }
  portal_status?: 'enabled' | 'disabled'
  portal_language?: string
  contact_persons?: Array<{
    name?: string
    email?: string
    phone?: string
    designation?: string
  }>
  custom_fields?: any[]
  documents?: any[]
  
  // Linking fields (Zoho-style)
  is_linked?: boolean
  linked_entity?: {
    id: number
    type: 'customer' | 'vendor'
    customer_number?: string
    vendor_number?: string
    display_name: string
    receivable_amount?: number
    payable_amount?: number
    unused_credits?: number
  }
  net_balance?: {
    amount: number
    type: 'receivable' | 'payable'
  }
  link_created_at?: string
  link_created_by?: number
  
  // Audit fields
  source?: 'finance' | 'crm'
  customer_since: string
  last_transaction_date?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface CustomerListItem {
  contact_id: number
  customer_number?: string
  vendor_number?: string
  contact_type?: 'customer' | 'vendor'
  display_name: string
  contact_name?: string
  company_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  customer_type: 'business' | 'individual'
  customer_status: 'active' | 'inactive' | 'suspended'
  currency: 'USD' | 'EUR' | 'GBP'
  payment_terms: 'immediate' | 'net15' | 'net30' | 'net60' | 'net90'
  credit_limit?: string
  outstanding_receivable_amount?: string
  primary_contact?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  account?: number
  owner?: number
  owner_name?: string
  receivable_account?: number
  receivable_account_name?: string
  payable_account?: number
  payable_account_name?: string
  customer_since: string
  last_transaction_date?: string
  billing_address?: any
  shipping_address?: any
  source?: 'finance' | 'crm'
  created_at: string
  updated_at: string
  
  // Linking fields
  is_linked?: boolean
  linked_entity_id?: number
  linked_entity_name?: string
  linked_entity_number?: string
  net_balance?: string
}

export interface CustomerCreate {
  display_name: string
  contact_name?: string
  company_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  customer_type: 'business' | 'individual'
  customer_status: 'active' | 'inactive' | 'suspended'
  currency: 'USD' | 'EUR' | 'GBP'
  payment_terms: 'immediate' | 'net15' | 'net30' | 'net60' | 'net90'
  credit_limit?: string
  vat_treatment?: 'uk' | 'overseas'
  vat_registration_number?: string
  
  // Input fields for auto-create logic
  company_name_input: string
  primary_contact_name_input?: string
  primary_contact_email_input?: string
  primary_contact_phone_input?: string
  primary_contact_id?: number  // ID of existing contact to link
  
  // Address fields
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
  
  // New JSON fields
  tags?: string[]
  social_media?: {
    linkedin?: string
    twitter?: string
    facebook?: string
    [key: string]: string | undefined
  }
  portal_status?: 'enabled' | 'disabled'
  portal_language?: string
  contact_persons?: Array<{
    name?: string
    email?: string
    phone?: string
    designation?: string
  }>
  custom_fields?: any[]
  documents?: any[]
  
  // Assignment
  owner?: number
  source?: 'finance' | 'crm'
  notes?: string
  
  // Chart of Accounts
  receivable_account?: number
  payable_account?: number
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  inactive_customers: number
  suspended_customers: number
  business_customers: number
  individual_customers: number
  by_currency: Record<string, number>
  by_payment_terms: Record<string, number>
  recent_customers: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Linking types
export interface LinkEntityRequest {
  vendor_id?: number
  contact_id?: number
}

export interface LinkEntityResponse {
  message: string
  vendor?: {
    id: number
    vendor_number: string
    display_name: string
  }
  customer?: {
    id: number
    customer_number: string
    display_name: string
  }
  net_balance?: number
}

export interface BalanceSummary {
  customer?: {
    id: number
    number: string
    name: string
    receivable: number
    unused_credits?: number
  }
  vendor?: {
    id: number
    number: string
    name: string
    payable: number
  }
  net_balance?: number
  net_position?: 'receivable' | 'payable'
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/finance/customers/`
}

// API functions
const customerApi = {
  // Get all customers
  getCustomers: async (page = 1, pageSize = 20, search?: string, filters?: Record<string, string>): Promise<PaginatedResponse<CustomerListItem>> => {
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

  // Get single customer
  getCustomer: async (id: number): Promise<Customer> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create customer
  createCustomer: async (data: CustomerCreate): Promise<Customer> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update customer
  updateCustomer: async (id: number, data: Partial<CustomerCreate>): Promise<Customer> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get customer stats
  getCustomerStats: async (): Promise<CustomerStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },
  
  // Linking endpoints
  linkToVendor: async (customerId: number, vendorId: number): Promise<LinkEntityResponse> => {
    const response = await axios.post(`${getApiUrl()}${customerId}/link_to_vendor/`, {
      vendor_id: vendorId
    })
    return response.data
  },
  
  unlinkVendor: async (customerId: number): Promise<{ message: string }> => {
    const response = await axios.delete(`${getApiUrl()}${customerId}/unlink_vendor/`)
    return response.data
  },
  
  getBalanceSummary: async (customerId: number): Promise<BalanceSummary> => {
    const response = await axios.get(`${getApiUrl()}${customerId}/balance_summary/`)
    return response.data
  }
}

// React Query hooks
export const useCustomers = (page = 1, pageSize = 20, search?: string, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['customers', page, pageSize, search, filters],
    queryFn: () => customerApi.getCustomers(page, pageSize, search, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCustomer = (id: number) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['customers'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['customer-stats'],
        type: 'active'
      })
    },
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerCreate> }) => 
      customerApi.updateCustomer(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['customers'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['customer', data.contact_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['customer-stats'],
        type: 'active'
      })
    },
  })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: customerApi.deleteCustomer,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['customers'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['customer-stats'],
        type: 'active'
      })
    },
  })
}

export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: customerApi.getCustomerStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Linking hooks
export const useLinkToVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ customerId, vendorId }: { customerId: number; vendorId: number }) =>
      customerApi.linkToVendor(customerId, vendorId),
    onSuccess: async (data, variables) => {
      // Refetch customer data
      await queryClient.refetchQueries({
        queryKey: ['customer', variables.customerId],
        type: 'active'
      })
      // Refetch customers list
      await queryClient.refetchQueries({
        queryKey: ['customers'],
        type: 'active'
      })
      // Refetch balance summary
      await queryClient.refetchQueries({
        queryKey: ['balance-summary', variables.customerId],
        type: 'active'
      })
    },
  })
}

export const useUnlinkVendor = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (customerId: number) =>
      customerApi.unlinkVendor(customerId),
    onSuccess: async (data, customerId) => {
      // Refetch customer data
      await queryClient.refetchQueries({
        queryKey: ['customer', customerId],
        type: 'active'
      })
      // Refetch customers list
      await queryClient.refetchQueries({
        queryKey: ['customers'],
        type: 'active'
      })
      // Invalidate balance summary
      queryClient.removeQueries({
        queryKey: ['balance-summary', customerId]
      })
    },
  })
}

export const useBalanceSummary = (customerId: number) => {
  return useQuery({
    queryKey: ['balance-summary', customerId],
    queryFn: () => customerApi.getBalanceSummary(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Constants for form options
export const CUSTOMER_TYPE_OPTIONS = [
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' }
] as const

export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
] as const

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' }
] as const

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'net90', label: 'Net 90 Days' }
] as const

export const VAT_TREATMENT_OPTIONS = [
  { value: 'uk', label: 'UK' },
  { value: 'overseas', label: 'Overseas' }
] as const