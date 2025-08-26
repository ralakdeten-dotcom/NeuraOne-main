import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { ZohoAppsSettings } from '../pages/integrations/ZohoAppsSettings'
import { WhatsAppSettings } from '../pages/integrations/WhatsAppSettings'
import { SMSIntegrationsSettings } from '../pages/integrations/SMSIntegrationsSettings'
import { PayrollSettings } from '../pages/integrations/PayrollSettings'
import { UberBusinessSettings } from '../pages/integrations/UberBusinessSettings'
import { OtherAppsSettings } from '../pages/integrations/OtherAppsSettings'
import { MarketplaceSettings } from '../pages/integrations/MarketplaceSettings'

// Route mapping for integrations settings
const routeComponents = {
  'zoho-apps': ZohoAppsSettings,
  'sorvia-apps': ZohoAppsSettings, // Using ZohoAppsSettings as placeholder for Sorvia Apps
  'whatsapp': WhatsAppSettings,
  'sms-integrations': SMSIntegrationsSettings,
  'payroll': PayrollSettings,
  'uber-for-business': UberBusinessSettings,
  'other-apps': OtherAppsSettings,
  'marketplace': MarketplaceSettings,
}

export const IntegrationsSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested integration setting "{item}" was not found.</p>
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