import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  position?: 'left' | 'right'
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  size = 'xl',
  showCloseButton = true,
  closeOnBackdrop = false,
  closeOnEscape = true,
  position = 'right'
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Size classes for width
  const sizeClasses = {
    sm: 'w-full max-w-sm',     // ~384px
    md: 'w-full max-w-md',     // ~448px
    lg: 'w-full max-w-2xl',    // ~672px
    xl: 'w-full max-w-4xl',    // ~896px
    full: 'w-full'             // Full width
  }

  // Position and transform classes
  const positionClasses = {
    left: {
      container: 'left-0',
      transform: isOpen ? 'translate-x-0' : '-translate-x-full'
    },
    right: {
      container: 'right-0',
      transform: isOpen ? 'translate-x-0' : 'translate-x-full'
    }
  }

  const panelClasses = `
    fixed top-0 h-full bg-white dark:bg-gray-900 z-50
    transform transition-all duration-300 ease-out
    shadow-2xl shadow-black/10 dark:shadow-black/30
    border-l border-gray-200/80 dark:border-gray-700/80
    ${sizeClasses[size]} ${positionClasses[position].container}
    ${positionClasses[position].transform}
    ${className}
  `.replace(/\s+/g, ' ').trim()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 dark:bg-black/80 z-40 
                   transition-all duration-300 ease-out"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Side Panel */}
      <div className={`${panelClasses} flex flex-col`} role="dialog" aria-modal="true">
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 
                          border-b border-gray-200/80 dark:border-gray-700/80 
                          px-6 py-4 flex items-center justify-between z-10">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 p-2.5 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                          hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                          active:scale-95"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={`${title || showCloseButton ? 'p-2' : 'pt-6 p-2'}`}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}