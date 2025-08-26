import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { UserManagementSettings } from '../pages/users/UserManagementSettings'
import { RoleManagementSettings } from '../pages/users/RoleManagementSettings'
import { UserPreferencesSettings } from '../pages/users/UserPreferencesSettings'

// Route mapping for users settings
const routeComponents = {
  'users': UserManagementSettings,
  'roles': RoleManagementSettings,
  'user-preferences': UserPreferencesSettings,
}

export const UsersSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested user setting "{item}" was not found.</p>
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