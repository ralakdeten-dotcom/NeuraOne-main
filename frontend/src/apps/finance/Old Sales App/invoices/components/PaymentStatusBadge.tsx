import React from 'react'
import { StatusBadge } from '@/shared'

interface PaymentStatusBadgeProps {
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  isOverdue?: boolean
  className?: string
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ 
  status, 
  isOverdue = false, 
  className 
}) => {
  // Override status with overdue if the invoice is overdue
  const displayStatus = isOverdue && (status === 'sent' || status === 'partial') ? 'overdue' : status

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          label: 'Draft'
        }
      case 'sent':
        return {
          variant: 'info' as const,
          label: 'Sent'
        }
      case 'paid':
        return {
          variant: 'success' as const,
          label: 'Paid'
        }
      case 'partial':
        return {
          variant: 'warning' as const,
          label: 'Partially Paid'
        }
      case 'overdue':
        return {
          variant: 'destructive' as const,
          label: 'Overdue'
        }
      case 'cancelled':
        return {
          variant: 'outline' as const,
          label: 'Cancelled'
        }
      default:
        return {
          variant: 'secondary' as const,
          label: status
        }
    }
  }

  const config = getStatusConfig(displayStatus)

  return (
    <StatusBadge 
      status={config.label}
      variant="pill"
      className={className}
      customColors={
        config.variant === 'success' ? { bg: 'bg-green-100 text-green-800', text: 'text-green-800' } :
        config.variant === 'info' ? { bg: 'bg-blue-100 text-blue-800', text: 'text-blue-800' } :
        config.variant === 'warning' ? { bg: 'bg-yellow-100 text-yellow-800', text: 'text-yellow-800' } :
        config.variant === 'destructive' ? { bg: 'bg-red-100 text-red-800', text: 'text-red-800' } :
        config.variant === 'outline' ? { bg: 'bg-gray-100 text-gray-800', text: 'text-gray-800' } :
        { bg: 'bg-gray-100 text-gray-600', text: 'text-gray-600' }
      }
    />
  )
}

export default PaymentStatusBadge