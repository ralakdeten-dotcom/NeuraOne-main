import { 
  generateSettingRoute as baseGenerateSettingRoute,
  generateItemSlug,
  generateSettingsBreadcrumb
} from '../../../shared/utils/settingsRouteGenerator'

// CRM-specific route mapping for settings categories
const crmRouteMap: Record<string, string> = {
  // Organization Settings
  'organisation': 'organisation',
  'users-roles': 'users',
  'customisation': 'customisation',
  'automation': 'automation',
  
  // CRM Module Settings
  'lead-management': 'lead-management',
  'contact-account': 'contact-account',
  'deals-pipeline': 'deals-pipeline',
  'activities': 'activities',
  'custom-modules': 'custom-modules',
  
  // Extensions and Developer Data
  'integrations': 'integrations',
  'developer': 'developer'
}

// CRM-specific special section mappings
const crmSpecialRoutes: Record<string, string> = {
  // Add CRM-specific special routes if needed
  'Lead Sources': 'lead-management/lead-sources',
  'Pipeline Settings': 'deals-pipeline/pipeline-settings'
}

// Generate full settings route for CRM app
export const generateSettingRoute = (categoryId: string, item: string): string => {
  // Handle special sections first
  if (crmSpecialRoutes[item]) {
    return `/crm/settings/${crmSpecialRoutes[item]}`
  }
  
  // Get category route
  const categoryRoute = crmRouteMap[categoryId]
  if (!categoryRoute) {
    console.warn(`No route mapping found for CRM category: ${categoryId}`)
    return '/crm/settings'
  }
  
  return baseGenerateSettingRoute('crm', categoryRoute, item, crmSpecialRoutes)
}

// Get breadcrumb for settings page
export const getSettingsBreadcrumb = (categoryId: string, item: string) => {
  const categoryNames: Record<string, string> = {
    'organisation': 'Organisation',
    'users-roles': 'Users & Roles',
    'customisation': 'Customisation',
    'automation': 'Automation',
    'lead-management': 'Lead Management',
    'contact-account': 'Contacts & Accounts',
    'deals-pipeline': 'Deals & Pipeline',
    'activities': 'Activities',
    'custom-modules': 'Custom Modules',
    'integrations': 'Integrations & Marketplace',
    'developer': 'Developer & Data'
  }

  const categoryName = categoryNames[categoryId] || 'Settings'

  return [
    { label: 'Settings', href: '/crm/settings' },
    { label: categoryName },
    { label: item }
  ]
}

// Check if item is in a special section
export const isSpecialSectionItem = (item: string): boolean => {
  return Object.keys(crmSpecialRoutes).includes(item)
}

// Get all possible routes for settings
export const getAllSettingsRoutes = () => {
  const routes: string[] = []
  
  // Add main category routes
  Object.values(crmRouteMap).forEach(category => {
    routes.push(`/crm/settings/${category}/:item`)
  })
  
  // Add special section routes
  routes.push('/crm/settings/lead-management/:item')
  routes.push('/crm/settings/deals-pipeline/:item')
  
  return routes
}