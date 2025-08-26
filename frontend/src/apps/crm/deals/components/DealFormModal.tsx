import React from 'react'
import { DealForm } from './DealForm'
import { type Deal } from '../api'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

interface DealFormModalProps {
  isOpen: boolean
  onClose: () => void
  deal?: Deal
  initialAccount?: { id: number; name: string }
  initialContact?: { id: number; name: string }
  onSuccess?: () => void
}

export const DealFormModal: React.FC<DealFormModalProps> = ({
  isOpen,
  onClose,
  deal,
  initialAccount,
  initialContact,
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
      title={deal ? 'Edit Deal' : 'Create New Deal'}
      subtitle={deal ? 'Update deal information' : 'Add new deal to your pipeline'}
      size="xl"
    >
      <DealForm 
        deal={deal}
        initialAccount={initialAccount}
        initialContact={initialContact}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormSidePanel>
  )
} 