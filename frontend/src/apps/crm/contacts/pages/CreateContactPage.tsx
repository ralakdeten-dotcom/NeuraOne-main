import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

export const CreateContactPage: React.FC = () => {
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate('/crm/contacts')
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate('/crm/contacts')
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate('/crm/contacts')
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Create Contact"
      subtitle="Add a new contact to your CRM system"
      size="xl"
    >
      <ContactForm 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}