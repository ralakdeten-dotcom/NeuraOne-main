import React, { useState } from 'react'
import { Search, Building2, Users, Settings as SettingsIcon, Zap, Globe, AlertTriangle, Plus, Target, UserCheck, Bell } from 'lucide-react'
import { generateSettingRoute } from './utils/crmSettingsRoutes'
import { AllSettingsHeader } from '../../shared/components/AllSettingsHeader'

export const CRMSettingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const settingsGroups = [
    {
      id: 'organization',
      title: 'Organization Settings',
      categories: [
        {
          id: 'organisation',
          title: 'Organisation',
          icon: Building2,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          items: [
            'Profile',
            'Branding',
            'Custom Domain',
            'Branches',
            'Manage Subscription'
          ]
        },
        {
          id: 'users-roles',
          title: 'Users & Roles',
          icon: Users,
          color: 'text-pink-600',
          bgColor: 'bg-pink-50',
          items: [
            'Users',
            'Roles',
            'User Preferences'
          ]
        },
        {
          id: 'customisation',
          title: 'Customisation',
          icon: SettingsIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          items: [
            'Email Notifications',
            'Web Tabs',
            'Field Customization',
            'Page Layouts'
          ]
        },
        {
          id: 'automation',
          title: 'Automation',
          icon: Zap,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          items: [
            'Workflow Rules',
            'Workflow Actions',
            'Workflow Logs',
            'Assignment Rules'
          ]
        }
      ]
    },
    {
      id: 'modules',
      title: 'CRM Module Settings',
      categories: [
        {
          id: 'lead-management',
          title: 'Lead Management',
          icon: Target,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          items: [
            'Lead Settings',
            'Lead Sources',
            'Lead Scoring',
            'Lead Assignment',
            'Conversion Settings'
          ]
        },
        {
          id: 'contact-account',
          title: 'Contacts & Accounts',
          icon: UserCheck,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          items: [
            'Contact Settings',
            'Account Settings',
            'Contact Roles',
            'Account Types',
            'Duplicate Management'
          ]
        },
        {
          id: 'deals-pipeline',
          title: 'Deals & Pipeline',
          icon: Target,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          items: [
            'Pipeline Settings',
            'Deal Stages',
            'Probability Settings',
            'Deal Types',
            'Forecasting'
          ]
        },
        {
          id: 'activities',
          title: 'Activities',
          icon: Bell,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          items: [
            'Task Settings',
            'Call Settings',
            'Meeting Settings',
            'Email Settings',
            'Activity Types'
          ]
        },
        {
          id: 'custom-modules',
          title: 'Custom Modules',
          icon: Plus,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          items: [
            'Overview'
          ]
        }
      ]
    },
    {
      id: 'extensions',
      title: 'Extensions and Developer Data',
      categories: [
        {
          id: 'integrations',
          title: 'Integrations & Marketplace',
          icon: Globe,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-50',
          items: [
            'Email Integrations',
            'Calendar Sync',
            'Social Media',
            'Third-party Apps',
            'Marketplace'
          ]
        },
        {
          id: 'developer',
          title: 'Developer & Data',
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          items: [
            'Incoming Webhooks',
            'Connections',
            'API Usage',
            'Data Administration',
            'Import/Export'
          ]
        }
      ]
    }
  ]

  // Flatten categories for search functionality
  const settingsCategories = settingsGroups.flatMap(group => group.categories)

  const filteredCategories = settingsCategories.filter(category => 
    (category.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (category.items || []).some(item => (item || '').toLowerCase().includes((searchTerm || '').toLowerCase()))
  )

  const handleSettingClick = (categoryId: string, item: string) => {
    if (!categoryId || !item) return
    const route = generateSettingRoute(categoryId, item)
    // For now, we'll handle navigation here
    window.location.href = route
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search your CRM settings"
      />

      {/* Content */}
      <div className="w-full px-6 py-6 pt-24">
        {searchTerm ? (
          // Show filtered results when searching
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-3">
                  {/* Category Header */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`p-1.5 rounded-md ${category.bgColor} dark:bg-gray-700`}>
                      <category.icon className={`w-4 h-4 ${category.color} dark:text-gray-300`} />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {category.title}
                    </h2>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-0.5">
                    {category.items.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => handleSettingClick(category.id, item)}
                        className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-md mx-auto p-8">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No settings found matching "{searchTerm}"
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          // Show grouped results when not searching
          <div className="space-y-8">
            {settingsGroups.map((group) => (
              <div key={group.id}>
                {/* Group Title */}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {group.title}
                </h2>
                
                {/* Group Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {group.categories.map((category) => (
                    <div key={category.id} className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-3">
                      {/* Category Header */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className={`p-1.5 rounded-md ${category.bgColor} dark:bg-gray-700`}>
                          <category.icon className={`w-4 h-4 ${category.color} dark:text-gray-300`} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {category.title}
                        </h3>
                      </div>

                      {/* Category Items */}
                      <div className="space-y-0.5">
                        {category.items.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSettingClick(category.id, item)}
                            className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}