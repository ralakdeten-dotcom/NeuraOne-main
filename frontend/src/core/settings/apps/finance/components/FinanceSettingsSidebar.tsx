import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Building2, Users, Receipt, Wrench, Palette, Zap, Settings as SettingsIcon, Package, CreditCard, ShoppingCart, ShoppingBag, Plus, Globe, AlertTriangle } from 'lucide-react'
import { generateSettingRoute } from '../utils/financeSettingsRoutes'
import { generateItemSlug } from '../../../shared/utils/settingsRouteGenerator'

interface SettingsSidebarProps {
  currentItem?: string
}

// Settings groups from FinanceSettingsPage - exact same structure
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
        ]
      },
      {
        id: 'taxes-compliance',
        title: 'Taxes & Compliance',
        icon: Receipt,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        items: [
          'Taxes'
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
          'Inventory Adjustments'
        ]
      },
      {
        id: 'online-payments',
        title: 'Online Payments',
        icon: CreditCard,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        items: [
          'Payment Gateways'
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

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  currentItem
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [hasManualToggle, setHasManualToggle] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleCategoryToggle = (categoryId: string) => {
    setHasManualToggle(true) // Mark that user has manually toggled
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? [] // Close the currently expanded category
        : [categoryId] // Open only the clicked category, closing all others
    )
  }

  // Helper function to find category ID from URL path
  const findCategoryIdFromPath = (urlPath: string): string | null => {
    // Create reverse mapping from URL path to category ID
    const pathToCategoryMap: Record<string, string> = {
      'organisation': 'organisation',
      'users': 'users-roles',
      'taxes': 'taxes-compliance', 
      'setup': 'setup-configurations',
      'customisation': 'customisation',
      'automation': 'automation',
      'general': 'preferences',
      'inventory': 'inventory',
      'payments': 'online-payments',
      'sales': 'sales',
      'purchases': 'purchases',
      'custom-modules': 'custom-modules',
      'integrations': 'integrations',
      'developer': 'developer'
    }
    
    return pathToCategoryMap[urlPath] || null
  }

  // Auto-expand the relevant category when on a specific settings page (only if no manual toggle)
  useEffect(() => {
    if (!hasManualToggle) {
      if (location.pathname !== '/finance/settings' && location.pathname.includes('/settings/')) {
        // Extract category from path (e.g., /finance/settings/users/users -> users -> users-taxes)
        const pathParts = location.pathname.split('/settings/')
        if (pathParts.length > 1) {
          const categoryPath = pathParts[1].split('/')[0]
          const categoryId = findCategoryIdFromPath(categoryPath)
          if (categoryId) {
            setExpandedCategories([categoryId])
          }
        }
      } else {
        // Clear expanded categories when on main settings page
        setExpandedCategories([])
      }
    }
  }, [location.pathname, hasManualToggle])

  // Reset manual toggle flag only when navigating to main settings page
  useEffect(() => {
    if (location.pathname === '/finance/settings') {
      setHasManualToggle(false)
    }
  }, [location.pathname])

  const handleSettingClick = (categoryId: string, item: string) => {
    // Ensure the category is expanded when clicking an item
    setExpandedCategories([categoryId])
    setHasManualToggle(true)
    const route = generateSettingRoute(categoryId, item)
    navigate(route)
  }

  const isItemActive = (categoryId: string, item: string) => {
    const itemSlug = generateItemSlug(item)
    return location.pathname.includes(`/${categoryId}/`) && location.pathname.includes(`/${itemSlug}`)
  }

  const isCategoryActive = (categoryId: string) => {
    return location.pathname.includes(`/settings/${categoryId}/`)
  }

  const filteredGroups = settingsGroups

  return (
    <div className="
      relative bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      w-64 h-screen flex flex-col overflow-hidden pt-16
    ">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 max-h-full">
        {filteredGroups.map((group) => (
          <div key={group.id} className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            
            <div className="space-y-1">
              {group.categories.map((category) => {
                const isExpanded = expandedCategories.includes(category.id)
                const hasItems = category.items.length > 0
                
                return (
                  <div key={category.id}>
                    {/* Category Header */}
                    <button
                      onClick={() => hasItems && handleCategoryToggle(category.id)}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg mx-2
                        transition-colors group overflow-hidden
                        ${isCategoryActive(category.id)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${!hasItems ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      {hasItems && (
                        <ChevronRight className={`
                          w-4 h-4 transition-transform mr-2
                          ${isExpanded ? 'transform rotate-90' : ''}
                        `} />
                      )}
                      
                      <span className="flex-1 text-left truncate">
                        {category.title}
                      </span>
                    </button>

                    {/* Category Items */}
                    {isExpanded && hasItems && (
                      <div className="mt-1 ml-6">
                        {category.sections ? (
                          // Render sections
                          category.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="mb-3">
                              {section.title && (
                                <div className="px-4 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {section.title}
                                </div>
                              )}
                              {section.items.map((item, itemIndex) => (
                                <button
                                  key={itemIndex}
                                  onClick={() => handleSettingClick(category.id, item)}
                                  className={`
                                    w-full text-left px-3 py-1.5 text-xs rounded-lg mx-2 mb-1
                                    transition-colors truncate overflow-hidden
                                    ${isItemActive(category.id, item)
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                  `}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          // Render regular items
                          category.items.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleSettingClick(category.id, item)}
                              className={`
                                w-full text-left px-3 py-1.5 text-xs rounded-lg mx-2 mb-1
                                transition-colors truncate overflow-hidden
                                ${isItemActive(category.id, item)
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              {item}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}