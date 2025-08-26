import React from 'react'
import { ContactForm } from './ContactForm'
import { type Contact } from '../api'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  contact?: Contact
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  contact,
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
      title={contact ? 'Edit Contact' : 'Create New Contact'}
      subtitle={contact ? 'Update contact information' : 'Add new contact to your database'}
      size="xl"
    >
      <ContactForm 
        contact={contact}
        initialAccount={initialAccount}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </FormSidePanel>
  )
} 