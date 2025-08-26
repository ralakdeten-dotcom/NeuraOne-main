import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEstimate } from '../api'
import { EstimateFormSidePanel } from '../components/EstimateFormSidePanel'

export const EditEstimateRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: estimate, isLoading, error } = useEstimate(Number(id))

  if (!id || isNaN(Number(id))) {
    navigate('/finance/estimates')
    return null
  }

  const handleSuccess = () => {
    navigate(`/finance/estimates/${id}`)
  }

  const handleClose = () => {
    setPanelOpen(false)
    navigate(`/finance/estimates/${id}`)
  }

  if (isLoading) {
    return null // Loading handled by FormSidePanel
  }

  if (error || !estimate) {
    navigate('/finance/estimates')
    return null
  }

  return (
    <EstimateFormSidePanel
      isOpen={isPanelOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      estimate={estimate}
    />
  )
}