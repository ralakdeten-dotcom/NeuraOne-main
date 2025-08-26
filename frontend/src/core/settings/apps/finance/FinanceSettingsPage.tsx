import React, { useState } from 'react'
import { Search, Building2, FileText, Settings as SettingsIcon, ShoppingCart, ShoppingBag, Users, CreditCard, Palette, Bell, Zap, Layers, Smartphone, Globe, AlertTriangle, Plus, Cog, Package, Receipt, Wrench } from 'lucide-react'
import { generateSettingRoute, isSpecialSectionItem } from './utils/financeSettingsRoutes'
import { AllSettingsHeader } from '../../shared/components/AllSettingsHeader'

export const FinanceSettingsPage: React.FC = () => {
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
            'Warehouses',
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
          ],
          sections: [
            {
              items: [
                'Users',
                'Roles',
                'User Preferences'
              ]
            },
            {
              title: 'Taxes & Compliance',
              icon: Receipt,
              items: [
                'Taxes'
              ]
            }
          ]
        },
        {
          id: 'setup-configurations',
          title: 'Setup & Configurations',
          icon: Wrench,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          items: [
            'General',
            'Currencies',
            'Opening Balances',
            'Reminders',
            'Customer Portal',
            'Vendor Portal'
          ]
        },
        {
          id: 'customisation',
          title: 'Customisation',
          icon: Palette,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          items: [
            'Transaction Number Series',
            'PDF Templates',
            'Email Notifications',
            'Reporting Tags',
            'Web Tabs'
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
            'Schedules'
          ]
        }
      ]
    },
    {
      id: 'modules',
      title: 'Module Settings',
      categories: [
        {
          id: 'preferences',
          title: 'General',
          icon: SettingsIcon,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          items: [
            'Customers and Vendors',
            'Items',
            'Accountant',
            'Projects',
            'Timesheet'
          ]
        },
        {
          id: 'inventory',
          title: 'Inventory',
          icon: Package,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          items: [
            'Inventory Adjustments',
            'Payment Gateways'
          ],
          sections: [
            {
              items: [
                'Inventory Adjustments'
              ]
            },
            {
              title: 'Online Payments',
              icon: CreditCard,
              items: [
                'Payment Gateways'
              ]
            }
          ]
        },
        {
          id: 'sales',
          title: 'Sales',
          icon: ShoppingCart,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          items: [
            'Quotes',
            'Sales Orders',
            'Invoices',
            'Payments Received',
            'Credit Notes',
            'Delivery Notes',
            'Packing Slips'
          ]
        },
        {
          id: 'purchases',
          title: 'Purchases',
          icon: ShoppingBag,
          color: 'text-teal-600',
          bgColor: 'bg-teal-50',
          items: [
            'Expenses',
            'Recurring Expenses',
            'Purchase Orders',
            'Bills',
            'Recurring Bills',
            'Payments Made',
            'Vendor Credits'
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
            'Sorvia Apps',
            'WhatsApp',
            'SMS Integrations',
            'Payroll',
            'Uber for Business',
            'Other Apps',
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
            'Signals',
            'Data Administration',
            'Deluge Components Usage'
          ]
        }
      ]
    }
  ]

  // Flatten categories for search functionality
  const settingsCategories = settingsGroups.flatMap(group => group.categories)

  const filteredCategories = settingsCategories.filter(category => 
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category.sections && category.sections.some(section => 
      (section.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      section.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  )

  const handleSettingClick = (categoryId: string, item: string) => {
    const route = generateSettingRoute(categoryId, item)
    // For now, we'll handle navigation here
    window.location.href = route
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search your settings"
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
                    {category.sections ? (
                      // Render sections for combined cards
                      category.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-4 last:mb-0">
                          {section.title && (
                            <div className="flex items-center space-x-2 mb-3">
                              {section.icon && (
                                <div className={`p-1.5 rounded-md ${category.bgColor} dark:bg-gray-700`}>
                                  <section.icon className={`w-4 h-4 ${category.color} dark:text-gray-300`} />
                                </div>
                              )}
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {section.title}
                              </h3>
                            </div>
                          )}
                          <div className="space-y-0.5">
                            {section.items.map((item, itemIndex) => (
                              <button
                                key={itemIndex}
                                onClick={() => handleSettingClick(category.id, item)}
                                className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Render regular items for normal cards
                      category.items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSettingClick(category.id, item)}
                          className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {item}
                        </button>
                      ))
                    )}
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
                        {category.sections ? (
                          // Render sections for combined cards
                          category.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="mb-4 last:mb-0">
                              {section.title && (
                                <div className="flex items-center space-x-2 mb-3">
                                  {section.icon && (
                                    <div className={`p-1.5 rounded-md ${category.bgColor} dark:bg-gray-700`}>
                                      <section.icon className={`w-4 h-4 ${category.color} dark:text-gray-300`} />
                                    </div>
                                  )}
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {section.title}
                                  </h4>
                                </div>
                              )}
                              <div className="space-y-0.5">
                                {section.items.map((item, itemIndex) => (
                                  <button
                                    key={itemIndex}
                                    onClick={() => handleSettingClick(category.id, item)}
                                    className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Render regular items for normal cards
                          category.items.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleSettingClick(category.id, item)}
                              className="block w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              {item}
                            </button>
                          ))
                        )}
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