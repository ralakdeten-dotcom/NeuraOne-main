import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getSettingsForApp, detectAppContext, generateSettingRoute } from './config/settingsRegistry'
import { AllSettingsHeader } from './shared/components/AllSettingsHeader'

export const SettingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const location = useLocation()

  // Detect current app context and get appropriate settings
  const appContext = detectAppContext(location.pathname)
  const appSettings = getSettingsForApp(appContext)

  // Flatten categories for search functionality
  const settingsCategories = appSettings.groups.flatMap(group => group.categories)

  const filteredCategories = settingsCategories.filter(category => 
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category.sections && category.sections.some(section => 
      (section.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      section.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  )

  const handleSettingClick = (categoryId: string, item: string) => {
    const route = generateSettingRoute(appContext, categoryId, item)
    // For now, we'll handle navigation here
    window.location.href = route
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={appSettings.searchPlaceholder}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6">
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
            {appSettings.groups.map((group) => (
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