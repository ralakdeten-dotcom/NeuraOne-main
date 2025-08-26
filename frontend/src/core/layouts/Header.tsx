import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { QuickAddDropdown } from '@/core/components/QuickAddDropdown'
import { NotificationDropdown } from '@/core/components/NotificationDropdown'
import { ThemeToggle } from '@/core/components/ThemeToggle'
import { AppSwitcher } from '@/platform/AppSwitcher'
import { useAuth } from '@/core/auth/AuthProvider'
import { User, LogOut, ChevronDown, Settings } from 'lucide-react'
import { getCurrentApp, getAppDisplayName } from '@/utils/appContext'

// Helper function to capitalize first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

interface HeaderProps {
  onMenuClick: () => void
  rightPanelOpen?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, rightPanelOpen = false }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [rightPanelState, setRightPanelState] = useState(false)

  // Listen for right panel state changes
  useEffect(() => {
    const handleRightPanelStateChange = (event: any) => {
      setRightPanelState(event.detail.isOpen);
    };

    window.addEventListener('rightPanelStateChange', handleRightPanelStateChange);
    return () => {
      window.removeEventListener('rightPanelStateChange', handleRightPanelStateChange);
    };
  }, []);

  const shouldShowBackButton = () => {
    const path = location.pathname
    // Show back button on detail pages, edit pages, and create pages
    return path.includes('/new') || 
           path.match(/\/\d+$/) || 
           path.includes('/edit') ||
           path.match(/\/\d+\/edit$/)
  }

  const getPageTitle = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    const currentApp = getCurrentApp(path)
    
    // Remove app prefix from segments
    if (segments[0] && ['crm', 'finance', 'inventory', 'teaminbox'].includes(segments[0])) {
      segments.shift()
    }
    
    // Dashboard pages
    if (path === `/${currentApp}` || path === `/${currentApp}/`) {
      if (currentApp === 'finance') {
        return 'Home'
      }
      return `${getAppDisplayName(currentApp)} Dashboard`
    }
    
    // Finance app dynamic title logic
    if (currentApp === 'finance') {
      return getFinancePageTitle(segments, path)
    }
    
    // Create/Edit/Details pages for other apps
    if (path.includes('/new')) {
      const segment = segments[0]?.slice(0, -1) || 'Item'
      return `Create ${capitalize(segment)}`
    }
    if (path.includes('/edit')) {
      const segment = segments[0]?.slice(0, -1) || 'Item'
      return `Edit ${capitalize(segment)}`
    }
    
    if (path.match(/\/\d+$/)) {
      const segment = segments[0]?.slice(0, -1) || 'Item'
      return `${capitalize(segment)} Details`
    }
    
    // Common page titles based on last segment
    const lastSegment = segments[segments.length - 1]
    const pageTitles: Record<string, string> = {
      'leads': 'Leads',
      'contacts': 'Contacts',
      'accounts': 'Accounts',
      'deals': 'Deals',
      'products': 'Products',
      'customers': 'Customers',
      'estimates': 'Estimates',
      'invoices': 'Invoices',
      'sales-orders': 'Sales Orders',
      'purchase-orders': 'Purchase Orders',
      'vendors': 'Vendors',
      'bills': 'Bills',
      'shipments': 'Shipments',
      'profile': 'Profile',
      'reports': 'Reports',
      'settings': 'Settings',
      'templates': 'Templates',
      'conversations': 'Conversations',
      'stock-levels': 'Stock Levels',
      'adjustments': 'Inventory Adjustments',
      'payments': 'Payments',
    }
    
    return pageTitles[lastSegment] || 'Dashboard'
  }

  const getFinancePageTitle = (segments: string[], path: string) => {
    // Define finance modules and their sub-modules
    const financeModules: Record<string, Record<string, string> | string> = {
      // Modules with sub-modules
      'items': {
        'all-items': 'All Items',
        'price-lists': 'Price Lists', 
        'inventory-adjustments': 'Inventory Adjustments',
        '': 'All Items' // Default when just /items
      },
      'sales': {
        'customers': 'Customers',
        'quotes': 'Quotes',
        'sales-orders': 'Sales Orders',
        'invoices': 'Invoices',
        'payments-received': 'Payments Received',
        'credit-notes': 'Credit Notes',
        '': 'Sales' // Default when just /sales
      },
      'purchases': {
        'vendors': 'Vendors',
        'bills': 'Bills',
        'purchase-orders': 'Purchase Orders',
        'payments-made': 'Payments Made',
        'debit-notes': 'Debit Notes',
        '': 'Purchases' // Default when just /purchases
      },
      'accountant': {
        'chart-of-accounts': 'Chart of Accounts',
        'manual-journals': 'Manual Journals',
        'bulk-update': 'Bulk Update',
        'currency-adjustments': 'Currency Adjustments',
        'budgets': 'Budgets',
        'transaction-locking': 'Transaction Locking',
        '': 'Accountant' // Default when just /accountant
      },
      'vat': {
        'vat-return': 'VAT Return',
        'vat-adjustments': 'VAT Adjustments',
        '': 'VAT' // Default when just /vat
      },
      'reports': {
        'profit-loss': 'Profit & Loss',
        'balance-sheet': 'Balance Sheet',
        'cash-flow': 'Cash Flow',
        'trial-balance': 'Trial Balance',
        '': 'Reports' // Default when just /reports
      },
      'documents': {
        'templates': 'Templates',
        'attachments': 'Attachments',
        '': 'Documents' // Default when just /documents
      },
      // Modules without sub-modules (return module name directly)
      'banking': 'Banking',
      'old-dashboard': 'Old Dashboard',
      'customers': 'Customers',
      'vendors': 'Vendors',
      'estimates': 'Estimates',
      'invoices': 'Invoices',
      'sales-orders': 'Sales Orders',
      'profile': 'Profile'
    }

    // If no segments, return Home
    if (segments.length === 0) {
      return 'Home'
    }

    const mainModule = segments[0]
    const subModule = segments[1] || ''

    // Check if this is a module with sub-modules
    const moduleConfig = financeModules[mainModule]
    
    if (typeof moduleConfig === 'object') {
      // Module has sub-modules, return sub-module title
      const subModuleTitle = moduleConfig[subModule] || moduleConfig['']
      return subModuleTitle
    } else if (typeof moduleConfig === 'string') {
      // Module without sub-modules, return module title
      return moduleConfig
    }

    // Handle special cases for create/edit/detail pages
    if (path.includes('/new')) {
      if (typeof moduleConfig === 'object' && subModule) {
        const subModuleTitle = moduleConfig[subModule]
        return subModuleTitle || capitalize(subModule)
      }
      return capitalize(mainModule)
    }

    if (path.includes('/edit') || path.match(/\/\d+$/)) {
      if (typeof moduleConfig === 'object' && subModule) {
        const subModuleTitle = moduleConfig[subModule]
        return subModuleTitle || capitalize(subModule)
      }
      return capitalize(mainModule)
    }

    // Fallback to capitalize the last relevant segment
    return capitalize(subModule || mainModule)
  }

  const handleBackClick = () => {
    navigate(-1)
  }

  return (
    <div className={`sticky top-0 z-10 bg-[#14235f] dark:bg-gray-800 h-12 flex items-center justify-between pl-2 pr-6 shadow-md ${rightPanelState ? 'relative' : 'border-b border-gray-200 dark:border-gray-700'}`}>
      {/* Bottom border that stops before right panel - only when panel is open */}
      {rightPanelState && (
        <div className="absolute bottom-0 left-0 right-12 border-b border-gray-200 dark:border-gray-700"></div>
      )}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-white hover:text-gray-200 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-md hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Back Button - Shows on detail/edit pages */}
          <div className="flex items-center">
            {shouldShowBackButton() && (
              <button
                onClick={handleBackClick}
                className="flex items-center px-2 py-1.5 text-sm font-medium text-white hover:text-gray-200 dark:text-gray-300 dark:hover:text-white hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            
            {/* Page Title */}
            <h1 className="text-xl font-bold text-white dark:text-white ml-2">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Page Title */}
        {/* <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {getCurrentPageTitle()}
          </h1>
        </div> */}

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* App Switcher Dropdown */}
          <AppSwitcher />
          
          {/* Quick Add */}
          <QuickAddDropdown />
          
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search..."
              className="w-40 pl-8 pr-3 py-1.5 border border-white border-opacity-20 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white bg-opacity-10 dark:bg-gray-700 dark:text-white text-sm text-white placeholder-white placeholder-opacity-70"
            />
            <svg className="absolute left-2.5 top-2 w-4 h-4 text-white text-opacity-70 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <button
            onClick={() => navigate(`/${getCurrentApp(location.pathname)}/settings`)}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white text-opacity-70 dark:text-gray-300 hover:text-white dark:hover:text-white" />
          </button>

          {/* User Profile */}
          <div className="relative">
            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <Link
                    to={`/${getCurrentApp(location.pathname)}/profile`}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center shadow-sm border border-white border-opacity-20">
                <span className="text-white font-semibold text-xs">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-white text-opacity-70 transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <NotificationDropdown />
        </div>

    </div>
  )
} 