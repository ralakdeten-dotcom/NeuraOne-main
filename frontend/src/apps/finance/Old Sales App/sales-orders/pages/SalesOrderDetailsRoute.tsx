import React from 'react'
import { useParams } from 'react-router-dom'
import { SalesOrderDetailsPage } from './SalesOrderDetailsPage'

export const SalesOrderDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <div>Sales Order ID not found</div>
  }
  
  return <SalesOrderDetailsPage salesOrderId={parseInt(id)} />
}