import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Contact types
export interface Contact {
  contact_id: number
  tenant: number
  tenant_name: string
  account?: number
  account_name?: string
  first_name: string
  last_name: string
  title?: string
  description?: string
  email?: string
  phone?: string
  mailing_street?: string
  mailing_city?: string
  mailing_state_province?: string
  mailing_country?: string
  postal_code?: string
  owner?: number
  owner_name?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_name?: string
  updated_by?: number
  updated_by_name?: string
}

export interface ContactListItem {
  contact_id: number
  first_name: string
  last_name: string
  full_name: string
  title?: string
  email?: string
  phone?: string
  account?: number
  account_name?: string
  tenant_name: string
  owner_name?: string
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  account?: number
  account_name?: string  // For new account creation
  first_name: string
  last_name: string
  title?: string
  description?: string
  email?: string
  phone?: string
  mailing_street?: string
  mailing_city?: string
  mailing_state_province?: string
  mailing_country?: string
  postal_code?: string
  owner?: number
}

export interface ContactSummary {
  total_contacts: number
  contacts_with_accounts: number
  contacts_with_phone: number
  contacts_by_title: Record<string, number>
  tenant: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions - using axios with automatic auth handling

const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const fullUrl = `${baseUrl}/api/crm/contacts/`
  console.log('🔍 Contact API - Building URL:', {
    baseUrl,
    fullUrl,
    hostname: window.location.hostname,
    pathname: window.location.pathname
  })
  return fullUrl
}

const contactApi = {
  // Get all contacts
  getContacts: async (page = 1, pageSize = 20): Promise<PaginatedResponse<ContactListItem>> => {
    const response = await axios.get(`${getApiUrl()}?page=${page}&page_size=${pageSize}`)
    return response.data
  },

  // Get single contact
  getContact: async (id: number): Promise<Contact> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create contact
  createContact: async (data: ContactCreate): Promise<Contact> => {
    const url = getApiUrl()
    console.log('🔍 Contact API - Creating contact:', {
      url,
      data,
      method: 'POST'
    })
    try {
      const response = await axios.post(url, data)
      console.log('✅ Contact API - Creation successful:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ Contact API - Creation failed:', {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      })
      throw error
    }
  },

  // Update contact
  updateContact: async (id: number, data: Partial<ContactCreate>): Promise<Contact> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete contact
  deleteContact: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get contact summary
  getContactSummary: async (): Promise<ContactSummary> => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Get contact account info
  getContactAccountInfo: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/account_info/`)
    return response.data
  },

  // Get contacts by account
  getContactsByAccount: async (accountId: number) => {
    const response = await axios.get(`${getApiUrl()}by_account/?account_id=${accountId}`)
    return response.data
  },

  // Get contact deals
  getContactDeals: async (id: number) => {
    const response = await axios.get(`${getApiUrl()}${id}/deals/`)
    return response.data
  }
}

// React Query hooks
export const useContacts = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['contacts', page, pageSize],
    queryFn: () => contactApi.getContacts(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContact = (id: number) => {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactApi.getContact(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateContact = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contactApi.createContact,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['contacts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-summary'],
        type: 'active'
      })
    },
  })
}

export const useUpdateContact = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContactCreate> }) => 
      contactApi.updateContact(id, data),
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ 
        queryKey: ['contacts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact', data.contact_id],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-summary'],
        type: 'active'
      })
    },
  })
}

export const useDeleteContact = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contactApi.deleteContact,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        queryKey: ['contacts'],
        type: 'active'
      })
      await queryClient.refetchQueries({ 
        queryKey: ['contact-summary'],
        type: 'active'
      })
    },
  })
}

export const useContactSummary = () => {
  return useQuery({
    queryKey: ['contact-summary'],
    queryFn: contactApi.getContactSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactAccountInfo = (id: number) => {
  return useQuery({
    queryKey: ['contact-account-info', id],
    queryFn: () => contactApi.getContactAccountInfo(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactsByAccount = (accountId: number) => {
  return useQuery({
    queryKey: ['contacts-by-account', accountId],
    queryFn: () => contactApi.getContactsByAccount(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useContactDeals = (id: number) => {
  return useQuery({
    queryKey: ['contact-deals', id],
    queryFn: () => contactApi.getContactDeals(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}