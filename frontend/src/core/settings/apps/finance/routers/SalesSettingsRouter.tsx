import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { InvoiceSettings } from '../pages/sales/InvoiceSettings'
import { QuotesSettings } from '../pages/sales/QuotesSettings'
import { SalesOrdersSettings } from '../pages/sales/SalesOrdersSettings'
import { PaymentsReceivedSettings } from '../pages/sales/PaymentsReceivedSettings'
import { CreditNotesSettings } from '../pages/sales/CreditNotesSettings'
import { DeliveryNotesSettings } from '../pages/sales/DeliveryNotesSettings'
import { PackingSlipsSettings } from '../pages/sales/PackingSlipsSettings'

// Route mapping for sales settings
const routeComponents = {
  'quotes': QuotesSettings,
  'sales-orders': SalesOrdersSettings,
  'invoices': InvoiceSettings,
  'payments-received': PaymentsReceivedSettings,
  'credit-notes': CreditNotesSettings,
  'delivery-notes': DeliveryNotesSettings,
  'packing-slips': PackingSlipsSettings,
}

export const SalesSettingsRouter: React.FC = () => {
  const { item } = useParams<{ item: string }>()
  
  if (!item) {
    return <Navigate to="/finance/settings" replace />
  }
  
  const Component = routeComponents[item as keyof typeof routeComponents]
  
  if (!Component) {
    return (
      <SettingsLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Setting Not Found</h1>
          <p className="text-gray-600">The requested sales setting "{item}" was not found.</p>
        </div>
      </SettingsLayout>
    )
  }
  
  return (
    <SettingsLayout>
      <Component />
    </SettingsLayout>
  )
}