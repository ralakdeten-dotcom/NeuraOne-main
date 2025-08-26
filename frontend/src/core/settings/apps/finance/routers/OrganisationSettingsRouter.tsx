import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { ProfileSettings } from '../pages/organisation/ProfileSettings'
import { WarehouseSettings } from '../pages/organisation/WarehouseSettings'
import { BrandingSettings } from '../pages/organisation/BrandingSettings'
import { CustomDomainSettings } from '../pages/organisation/CustomDomainSettings'
import { BranchSettings } from '../pages/organisation/BranchSettings'


const SubscriptionSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Subscription Management</h1>
    <p className="text-gray-600">Subscription management will be implemented here.</p>
  </div>
)

// Route mapping for organisation settings
const routeComponents = {
  'profile': ProfileSettings,
  'warehouses': WarehouseSettings,
  'branding': BrandingSettings,
  'custom-domain': CustomDomainSettings,
  'branches': BranchSettings,
  'manage-subscription': SubscriptionSettings,
}

export const OrganisationSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested organisation setting "{item}" was not found.</p>
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