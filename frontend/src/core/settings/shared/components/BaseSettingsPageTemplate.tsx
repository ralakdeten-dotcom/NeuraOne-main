import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Search } from 'lucide-react'
import type { SettingsGroup } from '../types'

interface BaseSettingsPageTemplateProps {
  appName: string
  title: string
  searchPlaceholder?: string
  settingsGroups: SettingsGroup[]
  onSettingClick: (categoryId: string, item: string) => void
}

export const BaseSettingsPageTemplate: React.FC<BaseSettingsPageTemplateProps> = ({
  appName,
  title,
  searchPlaceholder = 'Search settings',
  settingsGroups,
  onSettingClick
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

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

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-600 hover:text-red-500 transition-colors text-sm font-medium"
            >
              <span className="mr-2">Close Settings</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                                onClick={() => onSettingClick(category.id, item)}
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
                          onClick={() => onSettingClick(category.id, item)}
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
                                    onClick={() => onSettingClick(category.id, item)}
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
                              onClick={() => onSettingClick(category.id, item)}
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