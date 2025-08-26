import React, { createContext, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface NavigationContextType {
  getLastNonSettingsPage: () => string
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()

  useEffect(() => {
    const currentPath = location.pathname
    
    // Only store non-settings pages
    if (!currentPath.includes('/settings')) {
      localStorage.setItem('lastNonSettingsPage', currentPath)
    }
  }, [location.pathname])

  const getLastNonSettingsPage = (): string => {
    const lastPage = localStorage.getItem('lastNonSettingsPage')
    
    if (lastPage) {
      return lastPage
    }
    
    // Default fallback - extract app from current settings path
    const currentPath = location.pathname
    if (currentPath.includes('/settings')) {
      const pathParts = currentPath.split('/')
      const settingsIndex = pathParts.findIndex(part => part === 'settings')
      
      if (settingsIndex > 0) {
        const appPath = '/' + pathParts.slice(1, settingsIndex).join('/')
        return appPath
      }
    }
    
    // Final fallback
    return '/apps'
  }

  return (
    <NavigationContext.Provider value={{ getLastNonSettingsPage }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}