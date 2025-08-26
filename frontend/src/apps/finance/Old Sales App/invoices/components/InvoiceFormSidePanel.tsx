import React from 'react'
import { InvoiceForm } from './InvoiceForm'
import { Invoice, InvoiceListItem, InvoiceCreate } from '../api'

interface InvoiceFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  invoice?: Invoice | InvoiceListItem
  onSuccess?: () => void
  initialData?: Partial<InvoiceCreate>
}

export const InvoiceFormSidePanel: React.FC<InvoiceFormSidePanelProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
  initialData
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <InvoiceForm 
      invoice={invoice}
      initialData={initialData}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

export default InvoiceFormSidePanel