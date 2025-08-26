import React from 'react'
import { CustomerVendorForm } from '../../components/CustomerVendorForm'
import type { Customer } from '../api'

interface CustomerFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer
  onSuccess?: () => void
}

export const CustomerFormSidePanel: React.FC<CustomerFormSidePanelProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <CustomerVendorForm
      mode="customer"
      record={customer}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={handleSuccess}
      onCancel={onClose}
    />
  )
}