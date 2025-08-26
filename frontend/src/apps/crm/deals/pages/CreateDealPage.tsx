import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DealForm } from '../components/DealForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate('/crm/deals')
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate('/crm/deals')
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate('/crm/deals')
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Create New Deal"
      subtitle="Add new deal to your pipeline"
      size="xl"
    >
      <DealForm 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}