import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { TaxSettings } from '../pages/taxes/TaxSettings'

// Route mapping for taxes settings
const routeComponents = {
  'manage': TaxSettings,
  'taxes': TaxSettings,
}

export const TaxesSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested tax setting "{item}" was not found.</p>
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