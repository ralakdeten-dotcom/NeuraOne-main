import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContact } from '../api'
import { ContactForm } from '../components/ContactForm'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { LoadingSpinner, ErrorAlert } from '@/shared'

export const EditContactRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: contact, isLoading, error } = useContact(parseInt(id!))

  const handleSuccess = () => {
    setPanelOpen(false)
    navigate(`/crm/contacts/${id}`)
  }

  const handleCancel = () => {
    setPanelOpen(false)
    navigate(`/crm/contacts/${id}`)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
    navigate(`/crm/contacts/${id}`)
  }

  if (!id) {
    return <ErrorAlert message="Contact ID is required" />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading contact..." />
  }

  if (error) {
    return <ErrorAlert message={`Error loading contact: ${error.message}`} />
  }

  if (!contact) {
    return <ErrorAlert message="Contact not found" />
  }

  return (
    <FormSidePanel
      isOpen={isPanelOpen}
      onClose={handlePanelClose}
      title="Edit Contact"
      subtitle="Update contact information"
      size="xl"
    >
      <ContactForm 
        contact={contact} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </FormSidePanel>
  )
}