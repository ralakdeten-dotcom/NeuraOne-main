import React from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'
import { WorkflowRulesSettings } from '../pages/automation/WorkflowRulesSettings'
import { WorkflowActionsSettings } from '../pages/automation/WorkflowActionsSettings'
import { WorkflowLogsSettings } from '../pages/automation/WorkflowLogsSettings'
import { ScheduleSettings } from '../pages/automation/ScheduleSettings'

// Route mapping for automation settings
const routeComponents = {
  'workflow-rules': WorkflowRulesSettings,
  'workflow-actions': WorkflowActionsSettings,
  'workflow-logs': WorkflowLogsSettings,
  'schedules': ScheduleSettings,
}

export const AutomationSettingsRouter: React.FC = () => {
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
          <p className="text-gray-600">The requested automation setting "{item}" was not found.</p>
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