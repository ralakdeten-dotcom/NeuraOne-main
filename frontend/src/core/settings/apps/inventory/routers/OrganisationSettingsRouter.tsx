import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'

// Placeholder components for Inventory organisation settings
const ProfileSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Profile Settings</h1>
    <p className="text-gray-600">Inventory organization profile settings will be implemented here.</p>
  </div>
)

const WarehouseSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Warehouse Settings</h1>
    <p className="text-gray-600">Warehouse management settings will be implemented here.</p>
  </div>
)

const BrandingSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Branding Settings</h1>
    <p className="text-gray-600">Inventory branding settings will be implemented here.</p>
  </div>
)

const CustomDomainSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Custom Domain Settings</h1>
    <p className="text-gray-600">Inventory custom domain settings will be implemented here.</p>
  </div>
)

const BranchSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Branch Settings</h1>
    <p className="text-gray-600">Inventory branch settings will be implemented here.</p>
  </div>
)

const SubscriptionSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Subscription Management</h1>
    <p className="text-gray-600">Inventory subscription management will be implemented here.</p>
  </div>
)

// Route mapping for Inventory organisation settings
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
    return <Navigate to="/inventory/settings" replace />
  }
  
  const Component = routeComponents[item as keyof typeof routeComponents]
  
  if (!Component) {
    return (
      <SettingsLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Setting Not Found</h1>
          <p className="text-gray-600">The requested inventory organisation setting "{item}" was not found.</p>
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