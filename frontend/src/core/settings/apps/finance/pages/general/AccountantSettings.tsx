import React, { useState } from 'react'
import { Plus, MoreHorizontal, Calculator, FileText, TrendingUp, BarChart } from 'lucide-react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'
import { Button } from '@/shared/components/buttons/Button'


export const AccountantSettings: React.FC = () => {
  const [settings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'General' },
    { label: 'Accountant' }
  ]

  const categories = ['all', ...new Set(settings.map(s => s.category))]
  
  // Filter by search and category
  const filteredSettings = settings.filter(setting => {
    const matchesSearch = searchTerm === '' || 
      setting.setting.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || setting.category === categoryFilter
    return matchesSearch && matchesCategory
  })
  
  const enabledSettings = settings.filter(s => s.value === 'Enabled').length

  const handleNewSetting = () => {
    console.log('New accountant setting clicked')
  }

  const rightActions = (
    <div className="flex items-center space-x-3">
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {categories.map(category => (
          <option key={category} value={category}>
            {category === 'all' ? 'All Categories' : category}
          </option>
        ))}
      </select>
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
      New Setting
    </Button>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search accountant settings..."
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calculator className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Settings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{settings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enabled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{enabledSettings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length - 1}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              <div>SETTING</div>
              <div>CATEGORY</div>
              <div>VALUE</div>
              <div>DESCRIPTION</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSettings.map((setting) => (
              <div
                key={setting.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {setting.setting}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {setting.category}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      setting.value === 'Enabled'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : setting.value === 'Disabled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {setting.value}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    {setting.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Accounting & Financial Management
              </h3>
              <div className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                <p>
                  Configure core accounting settings including fiscal year, automation rules, 
                  currency support, and compliance requirements for financial reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}