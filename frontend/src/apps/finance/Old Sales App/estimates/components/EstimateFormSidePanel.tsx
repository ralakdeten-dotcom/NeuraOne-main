import React from 'react'
import { EstimateForm } from './EstimateForm'
import { Estimate, EstimateListItem, EstimateCreate } from '../api'

interface EstimateFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  estimate?: Estimate | EstimateListItem
  onSuccess?: () => void
  initialData?: Partial<EstimateCreate>
}

export const EstimateFormSidePanel: React.FC<EstimateFormSidePanelProps> = ({
  isOpen,
  onClose,
  estimate,
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
    <EstimateForm 
      estimate={estimate}
      initialData={initialData}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}