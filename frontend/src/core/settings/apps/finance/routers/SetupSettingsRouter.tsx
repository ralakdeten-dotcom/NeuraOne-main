import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { CurrencySettings } from '../pages/setup/CurrencySettings'
import { GeneralConfigurationSettings } from '../pages/setup/GeneralConfigurationSettings'
import { OpeningBalancesSettings } from '../pages/setup/OpeningBalancesSettings'
import { ReminderSettings } from '../pages/setup/ReminderSettings'
import { CustomerPortalSettings } from '../pages/setup/CustomerPortalSettings'
import { VendorPortalSettings } from '../pages/setup/VendorPortalSettings'


// Route mapping for setup settings
const routeComponents = {
  'general': GeneralConfigurationSettings,
  'currencies': CurrencySettings,
  'opening-balances': OpeningBalancesSettings,
  'reminders': ReminderSettings,
  'customer-portal': CustomerPortalSettings,
  'vendor-portal': VendorPortalSettings,
}

export const SetupSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested setup setting "{item}" was not found.</p>
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