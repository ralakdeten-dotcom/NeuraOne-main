import React from 'react'
import { AccountForm } from './AccountForm'
import { type Account } from '../api'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

interface AccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  account?: Account
  onSuccess?: () => void
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <FormSidePanel 
      isOpen={isOpen} 
      onClose={onClose}
      title={account ? 'Edit Account' : 'Create New Account'}
      subtitle={account ? 'Update account information' : 'Add new account to your database'}
      size="xl"
    >
      <AccountForm 
        account={account}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormSidePanel>
  )
}