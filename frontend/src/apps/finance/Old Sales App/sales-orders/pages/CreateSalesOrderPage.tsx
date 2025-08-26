import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SalesOrderForm } from '../components/SalesOrderForm'

export const CreateSalesOrderPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate('/finance/sales-orders')
  }

  const handleCancel = () => {
    navigate('/finance/sales-orders')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SalesOrderForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        isOpen={true}
        onClose={handleCancel}
      />
    </div>
  )
}