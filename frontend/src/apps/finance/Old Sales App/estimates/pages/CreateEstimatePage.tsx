import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EstimateCreate } from '../api'
import { EstimateFormSidePanel } from '../components/EstimateFormSidePanel'

export const CreateEstimatePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isPanelOpen, setPanelOpen] = useState(true)

  // Extract initial data from URL params (for integration with CRM modules)
  const initialData: Partial<EstimateCreate> = {
    account: searchParams.get('account') ? parseInt(searchParams.get('account')!) : undefined,
    contact: searchParams.get('contact') ? parseInt(searchParams.get('contact')!) : undefined,
    deal: searchParams.get('deal') ? parseInt(searchParams.get('deal')!) : undefined,
  }

  const handleSuccess = () => {
    navigate('/finance/estimates')
  }

  const handleClose = () => {
    setPanelOpen(false)
    navigate('/finance/estimates')
  }

  return (
    <EstimateFormSidePanel
      isOpen={isPanelOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialData={initialData}
    />
  )
}