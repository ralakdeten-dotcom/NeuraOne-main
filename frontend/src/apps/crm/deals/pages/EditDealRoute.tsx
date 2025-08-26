import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDeal } from '../api'
import { DealForm } from '../components/DealForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { LoadingSpinner, ErrorAlert } from '@/shared'

export const EditDealRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: deal, isLoading, error } = useDeal(parseInt(id!))

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate(`/crm/deals/${id}`)
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate(`/crm/deals/${id}`)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate(`/crm/deals/${id}`)
  }

  if (!id) {
    return <ErrorAlert message="Deal ID is required" />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading deal..." />
  }

  if (error) {
    return <ErrorAlert message={`Error loading deal: ${error.message}`} />
  }

  if (!deal) {
    return <ErrorAlert message="Deal not found" />
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Edit Deal"
      subtitle="Update deal information"
      size="xl"
    >
      <DealForm 
        deal={deal} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}