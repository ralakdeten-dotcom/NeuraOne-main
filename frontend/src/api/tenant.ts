import { useQuery } from '@tanstack/react-query'
import { getCurrentTenant } from '../utils/tenant'
import axios from 'axios'

// Base API URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Types
export interface EligibleLeadOwner {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  roles: string[]
  is_current_user?: boolean
}

export interface EligibleUsersResponse {
  success: boolean
  count: number
  users: EligibleLeadOwner[]
  current_user_included: boolean
}

// API functions
const getTenantApiUrl = () => {
  const tenant = getCurrentTenant()
  const baseUrl = tenant ? `http://${tenant}.localhost:8000` : API_BASE
  const apiUrl = `${baseUrl}/api/tenant/`
  return apiUrl
}

const tenantApi = {
  // Get users eligible for assignment (owners, assignees, etc.)
  getEligibleUsers: async (): Promise<EligibleUsersResponse> => {
    const url = `${getTenantApiUrl()}eligible-users/`
    const response = await axios.get(url)
    return response.data
  }
}

// React Query hooks
export const useEligibleUsers = () => {
  return useQuery({
    queryKey: ['eligible-users'],
    queryFn: tenantApi.getEligibleUsers,
    staleTime: 10 * 60 * 1000, // 10 minutes - users don't change frequently
  })
}

// Legacy alias for backward compatibility
export const useEligibleLeadOwners = useEligibleUsers