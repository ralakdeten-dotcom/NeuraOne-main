import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

export interface Tenant {
  id: number
  name: string
  schema_name: string
  domain: string | null
  is_active: boolean
  user_count: number
  created_on: string
}

export interface CreateTenantRequest {
  company_name: string
  schema_name: string
  domain_url?: string
  admin_email: string
  admin_password: string
  admin_first_name?: string
  admin_last_name?: string
}

export interface CreateTenantResponse {
  message: string
  tenant: {
    id: number
    name: string
    schema_name: string
    domain: string
    admin_email: string
  }
}

export interface TenantListResponse {
  count: number
  results: Tenant[]
}

export interface SuperAdminStats {
  total_tenants: number
  total_users: number
  active_domains: number
  total_actions: number
  recent_tenants: {
    name: string
    domain: string
    users: number
    status: string
    created: string
  }[]
}

export const superAdminApi = {
  // Dashboard stats
  getDashboardStats: async (): Promise<SuperAdminStats> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.get(`${baseUrl}/api/auth/dashboard/stats/`)
    return response.data
  },

  // Tenant management
  listTenants: async (): Promise<TenantListResponse> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.get(`${baseUrl}/api/auth/tenants/`)
    return response.data
  },

  createTenant: async (data: CreateTenantRequest): Promise<CreateTenantResponse> => {
    const baseUrl = getApiBaseUrl()
    const response = await axios.post(`${baseUrl}/api/auth/tenants/create/`, data)
    return response.data
  },

  // User management (placeholder for future implementation)
  listUsers: async (): Promise<any> => {
    // This would need a new backend endpoint
    throw new Error('Not implemented yet')
  },

  // Application management (placeholder for future implementation)
  listApplications: async (): Promise<any> => {
    // This would need a new backend endpoint
    throw new Error('Not implemented yet')
  },

  assignApplicationToTenant: async (_tenantId: number, _applicationId: number): Promise<any> => {
    // This would need a new backend endpoint
    throw new Error('Not implemented yet')
  }
}