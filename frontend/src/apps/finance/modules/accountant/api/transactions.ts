import { useQuery } from '@tanstack/react-query'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'

// Types for account transactions
export interface AccountTransaction {
  categorized_transaction_id: number
  transaction_id: string
  account: number
  account_name: string
  account_code: string
  transaction_type: string
  transaction_type_display: string
  transaction_status: string
  transaction_status_display: string
  transaction_source: string
  transaction_date: string
  entry_number: string
  currency_code: string
  debit_or_credit: 'debit' | 'credit'
  debit_amount: string
  credit_amount: string
  amount: string
  contact_id: number | null
  payee: string
  description: string
  reference_number: string
  offset_account_name: string
  reconcile_status: string
  created_time: string
  created_by_name: string
}

export interface TransactionResponse {
  count: number
  next: string | null
  previous: string | null
  results: AccountTransaction[]
}

// API URL helper
const getApiUrl = (accountId: number) => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/api/finance/chartofaccounts/${accountId}/transactions/`
}

// API functions
const transactionsApi = {
  // Get transactions for a specific account
  getAccountTransactions: async (accountId: number, page = 1, pageSize = 50): Promise<TransactionResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    const url = `${getApiUrl(accountId)}?${params.toString()}`
    console.log('Fetching transactions from:', url)
    const response = await axios.get(url)
    console.log('Transactions response:', response.data)
    return response.data
  },
}

// React Query hook for fetching account transactions
export const useAccountTransactions = (accountId: number, page = 1, pageSize = 50) => {
  return useQuery({
    queryKey: ['account-transactions', accountId, page, pageSize],
    queryFn: () => transactionsApi.getAccountTransactions(accountId, page, pageSize),
    enabled: !!accountId && accountId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}