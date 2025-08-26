import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'

// Placeholder components for CRM organisation settings
const ProfileSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Profile Settings</h1>
    <p className="text-gray-600">CRM organization profile settings will be implemented here.</p>
  </div>
)

const BrandingSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Branding Settings</h1>
    <p className="text-gray-600">CRM branding settings will be implemented here.</p>
  </div>
)

const CustomDomainSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Custom Domain Settings</h1>
    <p className="text-gray-600">CRM custom domain settings will be implemented here.</p>
  </div>
)

const BranchSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Branch Settings</h1>
    <p className="text-gray-600">CRM branch settings will be implemented here.</p>
  </div>
)

const SubscriptionSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Subscription Management</h1>
    <p className="text-gray-600">CRM subscription management will be implemented here.</p>
  </div>
)

// Route mapping for CRM organisation settings
const routeComponents = {
  'profile': ProfileSettings,
  'branding': BrandingSettings,
  'custom-domain': CustomDomainSettings,
  'branches': BranchSettings,
  'manage-subscription': SubscriptionSettings,
}

export const OrganisationSettingsRouter: React.FC = () => {
  const { item } = useParams<{ item: string }>()
  
  if (!item) {
    return <Navigate to="/crm/settings" replace />
  }
  
  const Component = routeComponents[item as keyof typeof routeComponents]
  
  if (!Component) {
    return (
      <SettingsLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Setting Not Found</h1>
          <p className="text-gray-600">The requested CRM organisation setting "{item}" was not found.</p>
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