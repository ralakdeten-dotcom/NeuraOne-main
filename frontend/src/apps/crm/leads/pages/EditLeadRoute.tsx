import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../api'
import { LeadForm } from '../components/LeadForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { LoadingSpinner, ErrorAlert } from '@/shared'

export const EditLeadRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: lead, isLoading, error } = useLead(parseInt(id!))

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate(`/crm/leads/${id}`)
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate(`/crm/leads/${id}`)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate(`/crm/leads/${id}`)
  }

  if (!id) {
    return <ErrorAlert message="Lead ID is required" />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading lead..." />
  }

  if (error) {
    return <ErrorAlert message={`Error loading lead: ${error.message}`} />
  }

  if (!lead) {
    return <ErrorAlert message="Lead not found" />
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Edit Lead"
      subtitle="Update lead information"
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