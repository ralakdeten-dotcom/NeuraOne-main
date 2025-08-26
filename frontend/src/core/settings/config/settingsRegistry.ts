import { 
  Building2, 
  FileText, 
  Settings as SettingsIcon, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Palette, 
  Bell, 
  Zap, 
  Layers, 
  Globe, 
  AlertTriangle, 
  Plus,
  Package,
  Warehouse,
  BarChart3,
  Receipt,
  Wrench
} from 'lucide-react'

export interface SettingsItem {
  name: string
  routeSlug?: string
}

export interface SettingsSection {
  title?: string
  icon?: any
  items: string[]
}

export interface SettingsCategory {
  id: string
  title: string
  icon: any
  color: string
  bgColor: string
  items: string[]
  sections?: SettingsSection[]
  routePath?: string
}

export interface SettingsGroup {
  id: string
  title: string
  categories: SettingsCategory[]
}

export interface AppSettings {
  title: string
  searchPlaceholder: string
  groups: SettingsGroup[]
}

// Global settings - comprehensive list for all apps
const GLOBAL_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'organisation',
    title: 'Organization & Platform',
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
          'Currencies',
          'Opening Balances',
          'Manage Subscription'
        ]
      },
      {
        id: 'taxes',
        title: 'Taxes & Compliance',
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        items: [
          'Taxes'
        ]
      },
      {
        id: 'users',
        title: 'Users & Roles',
        icon: Users,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        items: [
          'Users',
          'Roles',
          'User Preferences'
        ]
      }
    ]
  },
  {
    id: 'applications',
    title: 'Applications & Features',
    categories: [
      {
        id: 'crm-settings',
        title: 'CRM',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        items: [
          'General',
          'Lead Management',
          'Contact Management',
          'Account Management',
          'Deal Management',
          'Pipeline Settings'
        ]
      },
      {
        id: 'finance-settings',
        title: 'Finance',
        icon: Receipt,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        items: [
          'Customers and Vendors',
          'Items',
          'Accountant',
          'Projects',
          'Timesheet'
        ]
      },
      {
        id: 'inventory-settings',
        title: 'Inventory',
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        items: [
          'Product Catalog',
          'SKU Management',
          'Product Categories',
          'Warehouse Operations',
          'Stock Levels'
        ]
      }
    ]
  },
  {
    id: 'business-modules',
    title: 'Business Operations',
    categories: [
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
          'Bills',
          'Recurring Bills',
          'Payments Made',
          'Purchase Orders',
          'Vendor Credits'
        ]
      },
      {
        id: 'items',
        title: 'Items & Inventory',
        icon: Layers,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        items: [
          'Items',
          'Inventory Adjustments'
        ]
      },
      {
        id: 'online-payments',
        title: 'Online Payments',
        icon: CreditCard,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        items: [
          'Payment Gateways'
        ]
      }
    ]
  },
  {
    id: 'system-config',
    title: 'System Configuration',
    categories: [
      {
        id: 'preferences',
        title: 'Preferences',
        icon: SettingsIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        items: [
          'General',
          'Customers and Vendors',
          'Accountant',
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
          'Reporting Tags',
          'Web Tabs',
          'Transaction Number Series',
          'PDF Templates'
        ]
      },
      {
        id: 'reminders',
        title: 'Reminders & Notifications',
        icon: Bell,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        items: [
          'Reminders',
          'Email Notifications'
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
    id: 'extensions',
    title: 'Extensions & Development',
    categories: [
      {
        id: 'custom-modules',
        title: 'Custom Modules',
        icon: Plus,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        items: [
          'Overview'
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
      },
      {
        id: 'integrations',
        title: 'Integrations & Marketplace',
        icon: Globe,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        items: [
          'SMS Integrations',
          'Payroll',
          'Sorvia Apps',
          'Other Apps',
          'Uber for Business',
          'WhatsApp'
        ]
      }
    ]
  }
]

// Finance-specific settings
const FINANCE_SETTINGS_GROUPS: SettingsGroup[] = [
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
        id: 'users-taxes',
        title: 'Users & Roles',
        icon: Users,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        items: [
          'Users',
          'Roles',
          'User Preferences'
        ],
        sections: [
          {
            items: [
              'Users',
              'Roles',
              'User Preferences'
            ]
          },
          {
            title: 'Taxes & Compliance',
            icon: Receipt,
            items: [
              'Taxes'
            ]
          }
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
        id: 'inventory-payments',
        title: 'Inventory',
        icon: Package,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        items: [
          'Inventory Adjustments',
          'Payment Gateways'
        ],
        sections: [
          {
            items: [
              'Inventory Adjustments'
            ]
          },
          {
            title: 'Online Payments',
            icon: CreditCard,
            items: [
              'Payment Gateways'
            ]
          }
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

// CRM-specific settings
const CRM_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'crm-main',
    title: 'CRM Settings',
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
        id: 'users',
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
        id: 'preferences',
        title: 'Preferences',
        icon: SettingsIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        items: [
          'General',
          'Lead Management',
          'Contact Management',
          'Account Management',
          'Deal Management',
          'Pipeline Settings'
        ]
      },
      {
        id: 'reminders',
        title: 'Reminders & Notifications',
        icon: Bell,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        items: [
          'Reminders',
          'Email Notifications',
          'Follow-up Alerts'
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
          'Lead Assignment Rules'
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
          'Data Administration'
        ]
      },
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
          'Third-party Apps'
        ]
      }
    ]
  }
]

// Inventory-specific settings
const INVENTORY_SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'inventory-core',
    title: 'Inventory Management',
    categories: [
      {
        id: 'products',
        title: 'Product Management',
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        items: [
          'Product Catalog',
          'SKU Management',
          'Product Categories',
          'Product Variants',
          'Pricing Rules'
        ]
      },
      {
        id: 'warehouse',
        title: 'Warehouse Operations',
        icon: Warehouse,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        items: [
          'Warehouse Locations',
          'Stock Movements',
          'Bin Management',
          'Pick Lists',
          'Cycle Counting'
        ]
      },
      {
        id: 'reporting',
        title: 'Inventory Reports',
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        items: [
          'Stock Levels',
          'Valuation Reports',
          'Movement History',
          'Low Stock Alerts',
          'ABC Analysis'
        ]
      }
    ]
  }
]

// Settings registry mapping app contexts to their specific settings
export const SETTINGS_REGISTRY: Record<string, AppSettings> = {
  global: {
    title: 'All Settings',
    searchPlaceholder: 'Search your settings',
    groups: GLOBAL_SETTINGS_GROUPS
  },
  finance: {
    title: 'Finance Settings',
    searchPlaceholder: 'Search finance settings',
    groups: FINANCE_SETTINGS_GROUPS
  },
  crm: {
    title: 'CRM Settings',
    searchPlaceholder: 'Search CRM settings',
    groups: CRM_SETTINGS_GROUPS
  },
  inventory: {
    title: 'Inventory Settings',
    searchPlaceholder: 'Search inventory settings',
    groups: INVENTORY_SETTINGS_GROUPS
  },
  teaminbox: {
    title: 'TeamInbox Settings',
    searchPlaceholder: 'Search TeamInbox settings',
    groups: [] // Placeholder for future implementation
  }
}

// Utility function to get settings for current app context
export const getSettingsForApp = (appContext: string): AppSettings => {
  return SETTINGS_REGISTRY[appContext] || SETTINGS_REGISTRY.global
}

// Utility function to detect app context from current route
export const detectAppContext = (pathname: string): string => {
  if (pathname.includes('/finance')) return 'finance'
  if (pathname.includes('/crm')) return 'crm'
  if (pathname.includes('/inventory')) return 'inventory'
  if (pathname.includes('/teaminbox')) return 'teaminbox'
  return 'global'
}

// Generate route for setting item based on app context
export const generateSettingRoute = (appContext: string, categoryId: string, item: string): string => {
  const baseRoute = appContext === 'global' ? '/settings' : `/${appContext}/settings`
  
  // Handle special routes for specific apps
  const specialRoutes: Record<string, Record<string, string>> = {
    finance: {
      'Taxes': 'taxes/manage',
      'Payment Gateways': 'payments/gateways'
    }
  }
  
  if (specialRoutes[appContext] && specialRoutes[appContext][item]) {
    return `${baseRoute}/${specialRoutes[appContext][item]}`
  }
  
  // Generate item slug
  const itemSlug = item
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  return `${baseRoute}/${categoryId}/${itemSlug}`
}