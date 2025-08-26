import React from 'react'
import { SalesOrderForm } from './SalesOrderForm'
import { SalesOrder, SalesOrderListItem, SalesOrderCreate } from '../api'

interface SalesOrderFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  salesOrder?: SalesOrder | SalesOrderListItem
  onSuccess?: () => void
  initialData?: Partial<SalesOrderCreate>
}

export const SalesOrderFormSidePanel: React.FC<SalesOrderFormSidePanelProps> = ({
  isOpen,
  onClose,
  salesOrder,
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
    <SalesOrderForm 
      salesOrder={salesOrder}
      initialData={initialData}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}