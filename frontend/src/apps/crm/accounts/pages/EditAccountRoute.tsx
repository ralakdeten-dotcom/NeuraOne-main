import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from '../api'
import { AccountForm } from '../components/AccountForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { LoadingSpinner, ErrorAlert } from '@/shared'

export const EditAccountRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: account, isLoading, error } = useAccount(parseInt(id!))

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate(`/crm/accounts/${id}`)
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate(`/crm/accounts/${id}`)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate(`/crm/accounts/${id}`)
  }

  if (!id) {
    return <ErrorAlert message="Account ID is required" />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading account..." />
  }

  if (error) {
    return <ErrorAlert message={`Error loading account: ${error.message}`} />
  }

  if (!account) {
    return <ErrorAlert message="Account not found" />
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Edit Account"
      subtitle="Update account information"
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