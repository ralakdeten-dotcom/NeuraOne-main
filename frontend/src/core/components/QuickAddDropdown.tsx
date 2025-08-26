import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { LeadForm } from '@/apps/crm/leads/components/LeadForm'
import { AccountForm } from '@/apps/crm/accounts/components/AccountForm'
import { ContactForm } from '@/apps/crm/contacts/components/ContactForm'
import { DealForm } from '@/apps/crm/deals/components/DealForm'
import { useQueryClient } from '@tanstack/react-query'
import { useWidgetToggleVisibility } from '@/core/contexts/WidgetContext'

interface QuickAddItem {
  name: string
  href?: string
  icon: string
  permission?: string
  onClick?: () => void
}

export const QuickAddDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Try to use widget context if available
  let hideForPanel: () => void = () => {}
  let showAfterPanel: () => void = () => {}
  
  try {
    const widgetToggle = useWidgetToggleVisibility()
    hideForPanel = widgetToggle.hideForPanel
    showAfterPanel = widgetToggle.showAfterPanel
  } catch (error) {
    // Context not available, functions will be no-ops
  }

  // Hide widget toggle when any form is open
  useEffect(() => {
    const anyFormOpen = showLeadForm || showAccountForm || showContactForm || showDealForm
    if (anyFormOpen) {
      hideForPanel()
    } else {
      showAfterPanel()
    }
  }, [showLeadForm, showAccountForm, showContactForm, showDealForm, hideForPanel, showAfterPanel])

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (!user) return false
    
    // Superadmin has all permissions
    if (user.is_superadmin) return true
    
    // Allow all permissions temporarily for testing
    return true
  }

  // Update items to have onClick for all forms
  const quickAddItems: QuickAddItem[] = [
    {
      name: 'Lead',
      icon: '🎯',
      permission: 'manage_leads',
      onClick: () => {
        setIsOpen(false)
        setShowLeadForm(true)
      }
    },
    {
      name: 'Account',
      icon: '🏢',
      permission: 'manage_accounts',
      onClick: () => {
        setIsOpen(false)
        setShowAccountForm(true)
      }
    },
    {
      name: 'Contact',
      icon: '👤',
      permission: 'manage_contacts',
      onClick: () => {
        setIsOpen(false)
        setShowContactForm(true)
      }
    },
    {
      name: 'Deal',
      icon: '💰',
      permission: 'manage_opportunities',
      onClick: () => {
        setIsOpen(false)
        setShowDealForm(true)
      }
    }
  ]

  const filteredItems = quickAddItems.filter(item => hasPermission(item.permission))

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleLeadFormSuccess = () => {
    setShowLeadForm(false)
    // Invalidate leads query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  }

  const handleLeadFormCancel = () => {
    setShowLeadForm(false)
  }

  const handleAccountFormSuccess = () => {
    setShowAccountForm(false)
    queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }

  const handleAccountFormCancel = () => {
    setShowAccountForm(false)
  }

  const handleContactFormSuccess = () => {
    setShowContactForm(false)
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
  }

  const handleContactFormCancel = () => {
    setShowContactForm(false)
  }

  const handleDealFormSuccess = () => {
    setShowDealForm(false)
    queryClient.invalidateQueries({ queryKey: ['deals'] })
  }

  const handleDealFormCancel = () => {
    setShowDealForm(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-1.5 border border-white border-opacity-20 dark:border-gray-600 rounded-lg text-sm font-medium text-white bg-white bg-opacity-10 dark:bg-gray-700 hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Quick Add
        <svg 
          className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleClose}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-600">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quick Add
              </p>
            </div>
            {filteredItems.map((item) => {
              if (item.onClick) {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span>New {item.name}</span>
                  </button>
                )
              }
              return (
                <Link
                  key={item.name}
                  to={item.href!}
                  onClick={handleClose}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>New {item.name}</span>
                </Link>
              )
            })}
            {filteredItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No items available
              </div>
            )}
          </div>
        </>
      )}

      {/* Lead Form Side Panel */}
      <FormSidePanel
        isOpen={showLeadForm}
        onClose={handleLeadFormCancel}
        title="Create Lead"
        subtitle="Create a new lead quickly"
        size="xl"
      >
        <LeadForm
          onSuccess={handleLeadFormSuccess}
          onCancel={handleLeadFormCancel}
        />
      </FormSidePanel>

      {/* Account Form Side Panel */}
      <FormSidePanel
        isOpen={showAccountForm}
        onClose={handleAccountFormCancel}
        title="Create Account"
        subtitle="Create a new account quickly"
        size="xl"
      >
        <AccountForm
          onSuccess={handleAccountFormSuccess}
          onCancel={handleAccountFormCancel}
        />
      </FormSidePanel>

      {/* Contact Form Side Panel */}
      <FormSidePanel
        isOpen={showContactForm}
        onClose={handleContactFormCancel}
        title="Create Contact"
        subtitle="Create a new contact quickly"
        size="xl"
      >
        <ContactForm
          onSuccess={handleContactFormSuccess}
          onCancel={handleContactFormCancel}
        />
      </FormSidePanel>

      {/* Deal Form Side Panel */}
      <FormSidePanel
        isOpen={showDealForm}
        onClose={handleDealFormCancel}
        title="Create Deal"
        subtitle="Create a new deal quickly"
        size="xl"
      >
        <DealForm
          onSuccess={handleDealFormSuccess}
          onCancel={handleDealFormCancel}
        />
      </FormSidePanel>
    </div>
  )
}