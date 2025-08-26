import React, { createContext, useContext, useState, ReactNode } from 'react'

interface WidgetContextType {
  isWidgetToggleVisible: boolean
  setWidgetToggleVisible: (visible: boolean) => void
  hideWidgetToggle: () => void
  showWidgetToggle: () => void
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined)

export const WidgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isWidgetToggleVisible, setWidgetToggleVisible] = useState(true)

  const hideWidgetToggle = () => setWidgetToggleVisible(false)
  const showWidgetToggle = () => setWidgetToggleVisible(true)

  return (
    <WidgetContext.Provider
      value={{
        isWidgetToggleVisible,
        setWidgetToggleVisible,
        hideWidgetToggle,
        showWidgetToggle,
      }}
    >
      {children}
    </WidgetContext.Provider>
  )
}

export const useWidgetContext = () => {
  const context = useContext(WidgetContext)
  if (context === undefined) {
    throw new Error('useWidgetContext must be used within a WidgetProvider')
  }
  return context
}

// Optional: Hook for managing widget visibility with form panels
export const useWidgetToggleVisibility = () => {
  const { hideWidgetToggle, showWidgetToggle } = useWidgetContext()
  
  return {
    hideForPanel: hideWidgetToggle,
    showAfterPanel: showWidgetToggle,
  }
}