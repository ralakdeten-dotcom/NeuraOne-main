import React, { useState } from 'react'
import { Plus, MoreHorizontal, FileText, Settings } from 'lucide-react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'
import { Button } from '@/shared/components/buttons/Button'


export const InvoiceSettings: React.FC = () => {
  const [settings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [autoSend, setAutoSend] = useState(true)

  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Sales' },
    { label: 'Invoices' }
  ]

  const handleNewSetting = () => {
    // TODO: Open custom invoice setting modal
    alert('Custom Invoice Setting functionality will be implemented with backend integration')
  }

  const handleResetDefaults = () => {
    // TODO: Reset all invoice settings to system defaults with confirmation
    if (confirm('Are you sure you want to reset all invoice settings to defaults?')) {
      alert('Reset functionality will be implemented with backend integration')
    }
  }

  const handleToggleAutoSend = () => {
    setAutoSend(!autoSend)
  }

  const rightActions = (
    <div className="flex items-center space-x-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleToggleAutoSend}
      >
        {autoSend ? 'Disable' : 'Enable'} Auto Send
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleResetDefaults}
      >
        Reset Defaults
      </Button>
      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  )

  const actions = (
    <Button
      onClick={handleNewSetting}
      className="bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      <Plus className="w-4 h-4 mr-2" />
      Custom Setting
    </Button>
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Numbering':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Terms':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Currency':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Tax':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Pricing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, typeof settings>)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search settings..."
        title="Invoice Settings"
        breadcrumbs={breadcrumbs}
        actions={actions}
        rightActions={rightActions}
      />

      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              <div>SETTING</div>
              <div>VALUE</div>
              <div>CATEGORY</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          {setting.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {setting.value}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(setting.category)}`}>
                      {setting.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state if no settings */}
          {settings.length === 0 && (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No invoice settings configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure your invoice settings to customize how invoices are generated and processed.
              </p>
              <Button
                onClick={handleNewSetting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Setting
              </Button>
            </div>
          )}
        </div>

        {/* Invoice Number Preview */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Invoice Number Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded border p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Current Format</div>
              <div className="text-sm font-mono text-gray-900 dark:text-white">INV-{new Date().getFullYear()}-####</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded border p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Next Invoice</div>
              <div className="text-sm font-mono text-gray-900 dark:text-white">INV-2024-0012</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded border p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Example Future</div>
              <div className="text-sm font-mono text-gray-900 dark:text-white">INV-2024-0025</div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Invoice Configuration
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  {autoSend 
                    ? 'Auto-send is enabled. Invoices will be automatically sent to customers upon generation.'
                    : 'Auto-send is disabled. Invoices must be manually sent to customers.'
                  } Changes to numbering formats will only affect new invoices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}