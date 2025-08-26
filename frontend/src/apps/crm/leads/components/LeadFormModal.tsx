import React from 'react'
import { LeadForm } from './LeadForm'
import { type Lead } from '../api'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  lead?: Lead
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  lead,
  initialAccount,
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
      title={lead ? 'Edit Lead' : 'Create New Lead'}
      subtitle={lead ? 'Update lead information' : 'Add new lead to your pipeline'}
      size="xl"
    >
      <LeadForm 
        lead={lead}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormSidePanel>
  )
}