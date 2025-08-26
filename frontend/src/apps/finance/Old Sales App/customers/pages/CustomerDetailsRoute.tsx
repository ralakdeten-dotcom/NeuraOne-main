import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { CustomerDetailsPage } from './CustomerDetailsPage'

export const CustomerDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  // Validate the ID parameter
  const customerId = parseInt(id || '', 10)
  
  if (!id || isNaN(customerId) || customerId <= 0) {
    return <Navigate to="/finance/customers" replace />
  }
  
  return <CustomerDetailsPage customerId={customerId} />
}