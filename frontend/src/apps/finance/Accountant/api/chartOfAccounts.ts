import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types matching backend ChartOfAccount model
export interface ChartOfAccount {
  account_id: number
  account_name: string
  account_code: string
  account_type: string
  is_active: boolean
  created_time: string
  last_modified_time: string
  
  // Classification fields
  is_user_created: boolean
  is_system_account: boolean
  is_standalone_account: boolean
  
  // Hierarchy fields
  parent_account: number | null
  parent_account_name: string
  depth: number
  is_child_present: boolean
  child_count: number
  
  // Financial fields
  currency_id: string
  currency_code: string
  current_balance: string
  closing_balance: string
  opening_balance: string
  opening_balance_date: string | null
  opening_balance_type: 'debit' | 'credit' | ''
  
  // Transaction fields
  is_involved_in_transaction: boolean
  has_transaction: boolean
  has_attachment: boolean
  
  // Additional fields
  description: string
  bank_account_number: string
  show_on_dashboard: boolean
  include_in_vat_return: boolean
  can_show_in_ze: boolean
}

export interface ChartOfAccountListItem {
  account_id: number
  account_code: string
  account_name: string
  account_type: string
  account_type_display: string
  account_category: string
  is_active: boolean
  is_user_created: boolean
  is_system_account: boolean
  is_standalone_account: boolean
  is_involved_in_transaction: boolean
  current_balance: string
  parent_account: number | null
  parent_account_name: string
  depth: number
  is_child_present: boolean
  child_count: number
  has_attachment: boolean
  include_in_vat_return: boolean
  created_time: string
  last_modified_time: string
}

export interface ChartOfAccountCreate {
  account_name: string
  account_code?: string
  account_type: string
  currency_id?: string
  currency_code?: string
  description?: string
  parent_account?: number | null
  show_on_dashboard?: boolean
  include_in_vat_return?: boolean
  can_show_in_ze?: boolean
  bank_account_number?: string
  opening_balance?: string
  opening_balance_date?: string
  opening_balance_type?: 'debit' | 'credit'
}

export interface PaginatedResponse<T> {
  code?: number
  message?: string
  chartofaccounts?: T[]
  count?: number
  next?: string | null
  previous?: string | null
  results?: T[]
}

export interface CreateResponse {
  code: number
  message: string
  chart_of_account: ChartOfAccount
}

// Frontend to Backend Account Type Mapping
const FRONTEND_TO_BACKEND_ACCOUNT_TYPES: Record<string, string> = {
  // Assets
  'Other Asset': 'other_asset',
  'Other Current Asset': 'other_current_asset',
  'Cash': 'cash',
  'Bank': 'bank',
  'Fixed Asset': 'fixed_asset',
  'Accounts Receivable': 'accounts_receivable',
  'Stock': 'other_current_asset', // Backend doesn't have stock type, map to current asset
  'Payment Clearing Account': 'other_current_asset', // Map to current asset
  'Intangible Asset': 'intangible_asset',
  'Non Current Asset': 'other_asset', // Map to other asset
  'Deferred Tax Asset': 'other_asset', // Map to other asset
  
  // Liabilities
  'Other Current Liability': 'other_current_liability',
  'Credit Card': 'credit_card',
  'Non Current Liability': 'long_term_liability',
  'Other Liability': 'other_liability',
  'Accounts Payable': 'accounts_payable',
  'Deferred Tax Liability': 'other_liability', // Map to other liability
  
  // Equity
  'Equity': 'equity',
  
  // Income
  'Income': 'income',
  'Other Income': 'other_income',
  
  // Expenses
  'Expense': 'expense',
  'Cost Of Goods Sold': 'cost_of_goods_sold',
  'Other Expense': 'other_expense'
}

// Backend to Frontend Account Type Mapping
const BACKEND_TO_FRONTEND_ACCOUNT_TYPES: Record<string, string> = {
  // Assets
  'other_asset': 'Other Asset',
  'other_current_asset': 'Other Current Asset',
  'cash': 'Cash',
  'bank': 'Bank',
  'fixed_asset': 'Fixed Asset',
  'accounts_receivable': 'Accounts Receivable',
  'intangible_asset': 'Intangible Asset',
  'right_to_use_asset': 'Other Asset', // Map to Other Asset
  'financial_asset': 'Other Asset', // Map to Other Asset
  'contingent_asset': 'Other Asset', // Map to Other Asset
  'contract_asset': 'Other Asset', // Map to Other Asset
  
  // Liabilities
  'other_current_liability': 'Other Current Liability',
  'credit_card': 'Credit Card',
  'long_term_liability': 'Non Current Liability',
  'other_liability': 'Other Liability',
  'accounts_payable': 'Accounts Payable',
  'contract_liability': 'Other Liability', // Map to Other Liability
  'refund_liability': 'Other Liability', // Map to Other Liability
  'loans_and_borrowing': 'Non Current Liability', // Map to Non Current Liability
  'lease_liability': 'Other Liability', // Map to Other Liability
  'employee_benefit_liability': 'Other Liability', // Map to Other Liability
  'contingent_liability': 'Other Liability', // Map to Other Liability
  'financial_liability': 'Other Liability', // Map to Other Liability
  
  // Equity
  'equity': 'Equity',
  
  // Income
  'income': 'Income',
  'other_income': 'Other Income',
  'finance_income': 'Other Income', // Map to Other Income
  'other_comprehensive_income': 'Other Income', // Map to Other Income
  
  // Expenses
  'expense': 'Expense',
  'cost_of_goods_sold': 'Cost Of Goods Sold',
  'other_expense': 'Other Expense',
  'manufacturing_expense': 'Expense', // Map to Expense
  'impairment_expense': 'Expense', // Map to Expense
  'depreciation_expense': 'Expense', // Map to Expense
  'employee_benefit_expense': 'Expense', // Map to Expense
  'lease_expense': 'Expense', // Map to Expense
  'finance_expense': 'Expense', // Map to Expense
  'tax_expense': 'Expense' // Map to Expense
}

// Mapping functions
export const mapFrontendToBackendAccountType = (frontendType: string): string => {
  return FRONTEND_TO_BACKEND_ACCOUNT_TYPES[frontendType] || frontendType
}

export const mapBackendToFrontendAccountType = (backendType: string): string => {
  const mapped = BACKEND_TO_FRONTEND_ACCOUNT_TYPES[backendType];
  if (!mapped) {
    console.warn(`Unknown backend account type: ${backendType}`);
    return backendType; // Return as-is if no mapping found
  }
  return mapped;
}

// API URL helper
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/finance/chartofaccounts/`
}

// API functions
const chartOfAccountsApi = {
  // Get all accounts
  getAccounts: async (page = 1, pageSize = 50, search?: string, filters?: Record<string, string>): Promise<PaginatedResponse<ChartOfAccountListItem>> => {
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
    
    const url = `${getApiUrl()}?${params.toString()}`;
    console.log('Chart of Accounts API - Request URL:', url);
    const response = await axios.get(url);
    console.log('Chart of Accounts API - Response:', response.data);
    return response.data
  },

  // Get single account
  getAccount: async (id: number): Promise<ChartOfAccount> => {
    console.log('chartOfAccountsApi.getAccount - Fetching account with ID:', id);
    const response = await axios.get(`${getApiUrl()}${id}/`)
    console.log('chartOfAccountsApi.getAccount - Response:', response.data);
    return response.data
  },

  // Create account
  createAccount: async (data: ChartOfAccountCreate): Promise<CreateResponse> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update account
  updateAccount: async (id: number, data: Partial<ChartOfAccountCreate>): Promise<ChartOfAccount> => {
    console.log('chartOfAccountsApi.updateAccount - Updating account with ID:', id);
    console.log('chartOfAccountsApi.updateAccount - Update data:', data);
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    console.log('chartOfAccountsApi.updateAccount - Response:', response.data);
    return response.data.chart_of_account || response.data
  },

  // Delete account
  deleteAccount: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get account tree structure
  getAccountTree: async () => {
    const response = await axios.get(`${getApiUrl()}tree/`)
    return response.data
  },

  // Get account summary
  getAccountSummary: async () => {
    const response = await axios.get(`${getApiUrl()}summary/`)
    return response.data
  },

  // Activate account
  activateAccount: async (id: number): Promise<void> => {
    await axios.post(`${getApiUrl()}${id}/activate/`)
  },

  // Deactivate account
  deactivateAccount: async (id: number): Promise<void> => {
    await axios.post(`${getApiUrl()}${id}/deactivate/`)
  }
}

// React Query hooks
export const useChartOfAccounts = (page = 1, pageSize = 50, search?: string, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['chart-of-accounts', page, pageSize, search, filters],
    queryFn: () => chartOfAccountsApi.getAccounts(page, pageSize, search, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useChartOfAccount = (id: number) => {
  return useQuery({
    queryKey: ['chart-of-account', id],
    queryFn: () => chartOfAccountsApi.getAccount(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateChartOfAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartOfAccountsApi.createAccount,
    onSuccess: async (data) => {
      console.log('Chart of Accounts - Account created successfully:', data);
      console.log('Chart of Accounts - Invalidating queries...');
      
      // Invalidate all chart-of-accounts queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-accounts']
      });
      
      console.log('Chart of Accounts - Queries invalidated');
    },
  })
}

export const useUpdateChartOfAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChartOfAccountCreate> }) => 
      chartOfAccountsApi.updateAccount(id, data),
    onSuccess: async (updatedAccount) => {
      console.log('Chart of Accounts - Account updated successfully:', updatedAccount);
      console.log('Chart of Accounts - Invalidating queries...');
      
      // Invalidate all chart-of-accounts queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-accounts']
      });
      
      // Invalidate the specific account query
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-account', updatedAccount.account_id]
      });
      
      console.log('Chart of Accounts - Queries invalidated');
    },
  })
}

export const useDeleteChartOfAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartOfAccountsApi.deleteAccount,
    onSuccess: async (data, variables) => {
      console.log('Delete mutation successful, invalidating queries...');
      console.log('Deleted account ID:', variables);
      
      // Invalidate all chart-of-accounts queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-accounts']
      });
      
      console.log('Chart of accounts queries invalidated');
    },
    onError: (error) => {
      console.error('Delete mutation failed:', error);
    }
  })
}

export const useAccountTree = () => {
  return useQuery({
    queryKey: ['account-tree'],
    queryFn: chartOfAccountsApi.getAccountTree,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useAccountSummary = () => {
  return useQuery({
    queryKey: ['account-summary'],
    queryFn: chartOfAccountsApi.getAccountSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useActivateAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartOfAccountsApi.activateAccount,
    onSuccess: async () => {
      // Invalidate all chart-of-accounts queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-accounts']
      });
    },
  })
}

export const useDeactivateAccount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartOfAccountsApi.deactivateAccount,
    onSuccess: async () => {
      // Invalidate all chart-of-accounts queries to force refresh
      await queryClient.invalidateQueries({ 
        queryKey: ['chart-of-accounts']
      });
    },
  })
}

// Account type options for forms
export const ACCOUNT_TYPE_OPTIONS = [
  // Assets
  { category: 'Asset', value: 'Other Asset', label: 'Other Asset' },
  { category: 'Asset', value: 'Other Current Asset', label: 'Other Current Asset' },
  { category: 'Asset', value: 'Cash', label: 'Cash' },
  { category: 'Asset', value: 'Bank', label: 'Bank' },
  { category: 'Asset', value: 'Fixed Asset', label: 'Fixed Asset' },
  { category: 'Asset', value: 'Accounts Receivable', label: 'Accounts Receivable' },
  { category: 'Asset', value: 'Stock', label: 'Stock' },
  { category: 'Asset', value: 'Payment Clearing Account', label: 'Payment Clearing Account' },
  { category: 'Asset', value: 'Intangible Asset', label: 'Intangible Asset' },
  { category: 'Asset', value: 'Non Current Asset', label: 'Non Current Asset' },
  { category: 'Asset', value: 'Deferred Tax Asset', label: 'Deferred Tax Asset' },
  
  // Liabilities
  { category: 'Liability', value: 'Other Current Liability', label: 'Other Current Liability' },
  { category: 'Liability', value: 'Credit Card', label: 'Credit Card' },
  { category: 'Liability', value: 'Non Current Liability', label: 'Non Current Liability' },
  { category: 'Liability', value: 'Other Liability', label: 'Other Liability' },
  { category: 'Liability', value: 'Accounts Payable', label: 'Accounts Payable' },
  { category: 'Liability', value: 'Deferred Tax Liability', label: 'Deferred Tax Liability' },
  
  // Equity
  { category: 'Equity', value: 'Equity', label: 'Equity' },
  
  // Income
  { category: 'Income', value: 'Income', label: 'Income' },
  { category: 'Income', value: 'Other Income', label: 'Other Income' },
  
  // Expenses
  { category: 'Expense', value: 'Expense', label: 'Expense' },
  { category: 'Expense', value: 'Cost Of Goods Sold', label: 'Cost Of Goods Sold' },
  { category: 'Expense', value: 'Other Expense', label: 'Other Expense' }
]

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'AED', label: 'AED' },
  { value: 'AUD', label: 'AUD' },
  { value: 'CAD', label: 'CAD' },
  { value: 'CNY', label: 'CNY' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
  { value: 'JPY', label: 'JPY' },
  { value: 'SAR', label: 'SAR' },
  { value: 'USD', label: 'USD' },
  { value: 'ZAR', label: 'ZAR' }
]