import { 
  generateSettingRoute as baseGenerateSettingRoute,
  generateItemSlug,
  generateSettingsBreadcrumb
} from '../../../shared/utils/settingsRouteGenerator'

// Finance-specific route mapping for settings categories
const financeRouteMap: Record<string, string> = {
  // Organization Settings
  'organisation': 'organisation',
  'users-roles': 'users',
  'taxes-compliance': 'taxes',
  'setup-configurations': 'setup',
  'customisation': 'customisation',
  'automation': 'automation',
  
  // Module Settings
  'preferences': 'general',
  'inventory': 'inventory',
  'online-payments': 'payments',
  'sales': 'sales',
  'purchases': 'purchases',
  'custom-modules': 'custom-modules',
  
  // Extensions and Developer Data
  'integrations': 'integrations',
  'developer': 'developer'
}

// Finance-specific special section mappings
const financeSpecialRoutes: Record<string, string> = {
  'Taxes': 'taxes/taxes',
  'Payment Gateways': 'payments/payment-gateways'
}

// Generate full settings route for finance app
export const generateSettingRoute = (categoryId: string, item: string): string => {
  // Handle special sections first
  if (financeSpecialRoutes[item]) {
    return `/finance/settings/${financeSpecialRoutes[item]}`
  }
  
  // Get category route
  const categoryRoute = financeRouteMap[categoryId]
  if (!categoryRoute) {
    console.warn(`No route mapping found for finance category: ${categoryId}`)
    return '/finance/settings'
  }
  
  return baseGenerateSettingRoute('finance', categoryRoute, item, financeSpecialRoutes)
}

// Get breadcrumb for settings page
export const getSettingsBreadcrumb = (categoryId: string, item: string) => {
  const categoryNames: Record<string, string> = {
    'organisation': 'Organisation',
    'users-roles': 'Users & Roles',
    'taxes-compliance': 'Taxes & Compliance',
    'setup-configurations': 'Setup & Configurations',
    'customisation': 'Customisation',
    'automation': 'Automation',
    'preferences': 'General',
    'inventory': 'Inventory',
    'online-payments': 'Online Payments',
    'sales': 'Sales',
    'purchases': 'Purchases',
    'custom-modules': 'Custom Modules',
    'integrations': 'Integrations & Marketplace',
    'developer': 'Developer & Data'
  }

  const categoryName = categoryNames[categoryId] || 'Settings'

  return [
    { label: 'Settings', href: '/finance/settings' },
    { label: categoryName },
    { label: item }
  ]
}

// Check if item is in a special section
export const isSpecialSectionItem = (item: string): boolean => {
  return Object.keys(financeSpecialRoutes).includes(item)
}

// Get all possible routes for settings
export const getAllSettingsRoutes = () => {
  const routes: string[] = []
  
  // Add main category routes
  Object.values(financeRouteMap).forEach(category => {
    routes.push(`/finance/settings/${category}/:item`)
  })
  
  // Add special section routes
  routes.push('/finance/settings/taxes/:item')
  routes.push('/finance/settings/payments/:item')
  
  return routes
}