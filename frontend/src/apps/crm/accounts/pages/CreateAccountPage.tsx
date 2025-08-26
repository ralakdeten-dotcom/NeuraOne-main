import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountForm } from '../components/AccountForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate('/crm/accounts')
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate('/crm/accounts')
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate('/crm/accounts')
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Create Account"
      subtitle="Add a new company to your CRM system"
      size="xl"
    >
      <AccountForm 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}