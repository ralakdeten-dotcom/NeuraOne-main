import React from 'react'
import { useReceivableAccounts, usePayableAccounts } from '../accounting/api'

interface ChartOfAccountSelectProps {
  accountType: 'receivable' | 'payable'
  value?: number
  onChange: (accountId: number | undefined) => void
  placeholder?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

export const ChartOfAccountSelect: React.FC<ChartOfAccountSelectProps> = ({
  accountType,
  value,
  onChange,
  placeholder = 'Select account',
  required = false,
  error,
  disabled = false,
}) => {
  // Fetch accounts based on type
  const { data, isLoading } = accountType === 'receivable' 
    ? useReceivableAccounts()
    : usePayableAccounts()

  const accounts = data?.results || []

  // Don't auto-select, let user choose manually

  if (isLoading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900">
        <span className="text-gray-500 dark:text-gray-400">Loading accounts...</span>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900">
        <span className="text-gray-500 dark:text-gray-400">
          No {accountType === 'receivable' ? 'receivable' : 'payable'} accounts found
        </span>
      </div>
    )
  }

  return (
    <>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-md 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
          ${error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        <option value="">{placeholder}</option>
        {accounts.map((account) => (
          <option key={account.account_id} value={account.account_id}>
            {account.account_code ? `${account.account_code} - ` : ''}{account.account_name}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </>
  )
}

// Convenience components for specific account types
export const ReceivableAccountSelect: React.FC<Omit<ChartOfAccountSelectProps, 'accountType'>> = (props) => {
  return <ChartOfAccountSelect accountType="receivable" placeholder="Select Accounts Receivable" {...props} />
}

export const PayableAccountSelect: React.FC<Omit<ChartOfAccountSelectProps, 'accountType'>> = (props) => {
  return <ChartOfAccountSelect accountType="payable" placeholder="Select Accounts Payable" {...props} />
}