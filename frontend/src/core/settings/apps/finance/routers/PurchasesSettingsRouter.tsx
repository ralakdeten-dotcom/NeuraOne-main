import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { ExpensesSettings } from '../pages/purchases/ExpensesSettings'
import { RecurringExpensesSettings } from '../pages/purchases/RecurringExpensesSettings'
import { PurchaseOrdersSettings } from '../pages/purchases/PurchaseOrdersSettings'
import { BillsSettings } from '../pages/purchases/BillsSettings'
import { RecurringBillsSettings } from '../pages/purchases/RecurringBillsSettings'
import { PaymentsMadeSettings } from '../pages/purchases/PaymentsMadeSettings'
import { VendorCreditsSettings } from '../pages/purchases/VendorCreditsSettings'

// Route mapping for purchases settings
const routeComponents = {
  'expenses': ExpensesSettings,
  'recurring-expenses': RecurringExpensesSettings,
  'purchase-orders': PurchaseOrdersSettings,
  'bills': BillsSettings,
  'recurring-bills': RecurringBillsSettings,
  'payments-made': PaymentsMadeSettings,
  'vendor-credits': VendorCreditsSettings,
}

export const PurchasesSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested purchase setting "{item}" was not found.</p>
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