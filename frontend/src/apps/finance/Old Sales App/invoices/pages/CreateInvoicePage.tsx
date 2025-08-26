import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { InvoiceCreate } from '../api'
import { InvoiceFormSidePanel } from '../components/InvoiceFormSidePanel'

export const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isPanelOpen, setPanelOpen] = useState(true)

  // Extract initial data from URL params (for integration with CRM modules)
  const initialData: Partial<InvoiceCreate> = {
    account: searchParams.get('account') ? parseInt(searchParams.get('account')!) : undefined,
    contact: searchParams.get('contact') ? parseInt(searchParams.get('contact')!) : undefined,
    deal: searchParams.get('deal') ? parseInt(searchParams.get('deal')!) : undefined,
  }

  const handleSuccess = () => {
    navigate('/finance/invoices')
  }

  const handleClose = () => {
    setPanelOpen(false)
    navigate('/finance/invoices')
  }

  return (
    <InvoiceFormSidePanel
      isOpen={isPanelOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialData={initialData}
    />
  )
}

export default CreateInvoicePage