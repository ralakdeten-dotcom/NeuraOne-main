import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Search, ChevronLeft } from 'lucide-react'
import { useNavigation } from '@/core/contexts/NavigationContext'
import { detectAppContext } from '../../config/settingsRegistry'

interface AllSettingsHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
}

export const AllSettingsHeader: React.FC<AllSettingsHeaderProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search your settings"
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getLastNonSettingsPage } = useNavigation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleGoBack = () => {
    const lastPage = getLastNonSettingsPage()
    navigate(lastPage)
  }

  const handleAllSettingsClick = () => {
    const appContext = detectAppContext(location.pathname)
    const settingsRoute = appContext === 'global' ? '/settings' : `/${appContext}/settings`
    navigate(settingsRoute, { state: { fromBackNavigation: true } })
  }

  // Check if we're on a specific settings item page (not the main settings overview)
  const isOnSpecificSettingsPage = () => {
    const appContext = detectAppContext(location.pathname)
    const mainSettingsPath = appContext === 'global' ? '/settings' : `/${appContext}/settings`
    
    // Return true if we're deeper than the main settings page
    return location.pathname !== mainSettingsPath && location.pathname.includes('/settings/')
  }

  const showBackButton = isOnSpecificSettingsPage()

  // Auto-focus search input when component mounts and on main settings page (but not on back navigation)
  useEffect(() => {
    if (!showBackButton && searchInputRef.current) {
      const isFromBackNavigation = location.state?.fromBackNavigation === true
      
      if (!isFromBackNavigation) {
        // Add a small delay to ensure the component is fully rendered
        const timer = setTimeout(() => {
          searchInputRef.current?.focus()
        }, 100)
        
        return () => clearTimeout(timer)
      } else {
        // Explicitly blur the search input on back navigation
        const timer = setTimeout(() => {
          searchInputRef.current?.blur()
        }, 100)
        
        return () => clearTimeout(timer)
      }
    }
  }, [showBackButton, location.state])

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-16 px-8 mx-4">
        {/* Left Side - Title */}
        {showBackButton ? (
          <button 
            onClick={handleAllSettingsClick}
            className="flex items-center space-x-3 flex-shrink-0 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-3 py-2 -mx-3 -my-2 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">All Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">NeuraOne</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">All Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">NeuraOne</p>
            </div>
          </div>
        )}
        
        {/* Center - Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search settings ( / )"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right Side - Close button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors text-sm font-medium"
          >
            <span className="mr-2">Close Settings</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}