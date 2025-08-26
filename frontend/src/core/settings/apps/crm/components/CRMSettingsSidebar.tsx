import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Building2, Users, Settings as SettingsIcon, Bell, Zap, Globe, AlertTriangle, Plus, Target, UserCheck } from 'lucide-react'
import { generateSettingRoute } from '../utils/crmSettingsRoutes'
import { generateItemSlug } from '../../../shared/utils/settingsRouteGenerator'

interface SettingsSidebarProps {
  currentItem?: string
}

// Settings groups for CRM - tailored for CRM functionality
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
        icon: Settings as SettingsIcon,
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
      'customisation': 'customisation',
      'automation': 'automation',
      'lead-management': 'lead-management',
      'contact-account': 'contact-account',
      'deals-pipeline': 'deals-pipeline',
      'activities': 'activities',
      'custom-modules': 'custom-modules',
      'integrations': 'integrations',
      'developer': 'developer'
    }
    
    return pathToCategoryMap[urlPath] || null
  }

  // Auto-expand the relevant category when on a specific settings page (only if no manual toggle)
  useEffect(() => {
    if (!hasManualToggle) {
      if (location.pathname !== '/crm/settings' && location.pathname.includes('/settings/')) {
        // Extract category from path (e.g., /crm/settings/users/users -> users -> users-roles)
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
    if (location.pathname === '/crm/settings') {
      setHasManualToggle(false)
    }
  }, [location.pathname])

  const handleSettingClick = (categoryId: string, item: string) => {
    if (!categoryId || !item) return
    // Ensure the category is expanded when clicking an item
    setExpandedCategories([categoryId])
    setHasManualToggle(true)
    const route = generateSettingRoute(categoryId, item)
    navigate(route)
  }

  const isItemActive = (categoryId: string, item: string) => {
    if (!categoryId || !item) return false
    const itemSlug = generateItemSlug(item)
    return location.pathname.includes(`/${categoryId}/`) && location.pathname.includes(`/${itemSlug}`)
  }

  const isCategoryActive = (categoryId: string) => {
    if (!categoryId) return false
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