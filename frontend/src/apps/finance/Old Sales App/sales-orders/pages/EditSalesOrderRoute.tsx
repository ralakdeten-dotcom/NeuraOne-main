import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSalesOrder } from '../api'
import { SalesOrderForm } from '../components/SalesOrderForm'
import { LoadingSpinner, ErrorAlert } from '@/shared'

export const EditSalesOrderRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const salesOrderId = id ? parseInt(id) : 0
  
  const { data: salesOrder, isLoading, error } = useSalesOrder(salesOrderId)

  const handleSuccess = () => {
    navigate(`/finance/sales-orders/${salesOrderId}`)
  }

  const handleCancel = () => {
    navigate(`/finance/sales-orders/${salesOrderId}`)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert message="Failed to load sales order" />
  if (!salesOrder) return <ErrorAlert message="Sales order not found" />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SalesOrderForm
        salesOrder={salesOrder}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        isOpen={true}
        onClose={handleCancel}
      />
    </div>
  )
}