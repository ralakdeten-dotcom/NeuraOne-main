import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInvoice } from '../api'
import { InvoiceFormSidePanel } from '../components/InvoiceFormSidePanel'

export const EditInvoiceRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPanelOpen, setPanelOpen] = useState(true)
  
  const { data: invoice, isLoading, error } = useInvoice(Number(id))

  if (!id || isNaN(Number(id))) {
    navigate('/finance/invoices')
    return null
  }

  const handleSuccess = () => {
    navigate(`/finance/invoices/${id}`)
  }

  const handleClose = () => {
    setPanelOpen(false)
    navigate(`/finance/invoices/${id}`)
  }

  if (isLoading) {
    return null // Loading handled by FormSidePanel
  }

  if (error || !invoice) {
    navigate('/finance/invoices')
    return null
  }

  return (
    <InvoiceFormSidePanel
      isOpen={isPanelOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      invoice={invoice}
    />
  )
}

export default EditInvoiceRoute