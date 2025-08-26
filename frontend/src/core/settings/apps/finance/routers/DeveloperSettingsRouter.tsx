import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { IncomingWebhooksSettings } from '../pages/developer/IncomingWebhooksSettings'
import { ConnectionsSettings } from '../pages/developer/ConnectionsSettings'
import { APIUsageSettings } from '../pages/developer/APIUsageSettings'
import { SignalsSettings } from '../pages/developer/SignalsSettings'
import { DataAdministrationSettings } from '../pages/developer/DataAdministrationSettings'
import { DelugeComponentsUsageSettings } from '../pages/developer/DelugeComponentsUsageSettings'

// Route mapping for developer settings
const routeComponents = {
  'incoming-webhooks': IncomingWebhooksSettings,
  'connections': ConnectionsSettings,
  'api-usage': APIUsageSettings,
  'signals': SignalsSettings,
  'data-administration': DataAdministrationSettings,
  'deluge-components-usage': DelugeComponentsUsageSettings,
}

export const DeveloperSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested developer setting "{item}" was not found.</p>
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