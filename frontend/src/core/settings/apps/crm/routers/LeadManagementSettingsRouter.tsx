import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'

// Placeholder components for CRM lead management settings
const LeadSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Lead Settings</h1>
    <p className="text-gray-600">CRM lead settings will be implemented here.</p>
  </div>
)

const LeadSourcesSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Lead Sources</h1>
    <p className="text-gray-600">CRM lead sources management will be implemented here.</p>
  </div>
)

const LeadScoringSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Lead Scoring</h1>
    <p className="text-gray-600">CRM lead scoring configuration will be implemented here.</p>
  </div>
)

const LeadAssignmentSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Lead Assignment</h1>
    <p className="text-gray-600">CRM lead assignment rules will be implemented here.</p>
  </div>
)

const ConversionSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">CRM Conversion Settings</h1>
    <p className="text-gray-600">CRM lead conversion settings will be implemented here.</p>
  </div>
)

// Route mapping for CRM lead management settings
const routeComponents = {
  'lead-settings': LeadSettings,
  'lead-sources': LeadSourcesSettings,
  'lead-scoring': LeadScoringSettings,
  'lead-assignment': LeadAssignmentSettings,
  'conversion-settings': ConversionSettings,
}

export const LeadManagementSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested CRM lead management setting "{item}" was not found.</p>
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