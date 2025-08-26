import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'

// Placeholder components for CRM users settings
const UserManagementSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM User Management</h1>
    <p className="text-gray-600">CRM user management settings will be implemented here.</p>
  </div>
)

const RoleManagementSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Role Management</h1>
    <p className="text-gray-600">CRM role management settings will be implemented here.</p>
  </div>
)

const UserPreferencesSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM User Preferences</h1>
    <p className="text-gray-600">CRM user preferences settings will be implemented here.</p>
  </div>
)

// Route mapping for CRM users settings
const routeComponents = {
  'users': UserManagementSettings,
  'roles': RoleManagementSettings,
  'user-preferences': UserPreferencesSettings,
}

export const UsersSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested CRM users setting "{item}" was not found.</p>
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