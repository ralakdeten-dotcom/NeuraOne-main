import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { NumberSeriesSettings } from '../pages/customisation/NumberSeriesSettings'
import { PDFTemplateSettings } from '../pages/customisation/PDFTemplateSettings'
import { EmailNotificationSettings } from '../pages/customisation/EmailNotificationSettings'
import { ReportingTagsSettings } from '../pages/customisation/ReportingTagsSettings'
import { WebTabsSettings } from '../pages/customisation/WebTabsSettings'

// Route mapping for customisation settings
const routeComponents = {
  'transaction-number-series': NumberSeriesSettings,
  'pdf-templates': PDFTemplateSettings,
  'email-notifications': EmailNotificationSettings,
  'reporting-tags': ReportingTagsSettings,
  'web-tabs': WebTabsSettings,
}

export const CustomisationSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested customisation setting "{item}" was not found.</p>
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