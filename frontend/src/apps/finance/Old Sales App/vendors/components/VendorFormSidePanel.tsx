import React from 'react'
import { CustomerVendorForm } from '../../components/CustomerVendorForm'
import type { Vendor } from '../api'

interface VendorFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  vendor?: Vendor
  onSuccess?: () => void
}

export const VendorFormSidePanel: React.FC<VendorFormSidePanelProps> = ({
  isOpen,
  onClose,
  vendor,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <CustomerVendorForm
      mode="vendor"
      record={vendor}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={handleSuccess}
      onCancel={onClose}
    />
  )
}