import React from 'react'
import { useParams } from 'react-router-dom'
import { InvoiceDetailsPage } from './InvoiceDetailsPage'

export const InvoiceDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <div>Invalid invoice ID</div>
  }

  return <InvoiceDetailsPage invoiceId={Number(id)} />
}

export default InvoiceDetailsRoute