import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SettingsSidebar } from './InventorySettingsSidebar'
import { SettingsContentArea } from '../../../shared/components/SettingsContentArea'

export interface SettingsLayoutProps {
  children: React.ReactNode
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { item } = useParams<{ item: string }>()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Settings Sidebar */}
      <SettingsSidebar
        currentItem={item}
      />
      
      {/* Main Content Area */}
      <SettingsContentArea>
        {children}
      </SettingsContentArea>
    </div>
  )
}