import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeadForm } from '../components/LeadForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

export const CreateLeadPage: React.FC = () => {
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate('/crm/leads')
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate('/crm/leads')
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate('/crm/leads')
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Create Lead"
      subtitle="Add a new potential customer to your pipeline"
      size="xl"
    >
      <LeadForm 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}