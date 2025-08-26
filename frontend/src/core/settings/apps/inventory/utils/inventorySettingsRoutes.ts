import { 
  generateSettingRoute as baseGenerateSettingRoute,
  generateItemSlug,
  generateSettingsBreadcrumb
} from '../../../shared/utils/settingsRouteGenerator'

// Inventory-specific route mapping for settings categories
const inventoryRouteMap: Record<string, string> = {
  // Organization Settings
  'organisation': 'organisation',
  'users-roles': 'users',
  'customisation': 'customisation',
  'automation': 'automation',
  
  // Inventory Module Settings
  'product-management': 'product-management',
  'warehouse-operations': 'warehouse-operations',
  'inventory-control': 'inventory-control',
  'reporting-analytics': 'reporting-analytics',
  'procurement': 'procurement',
  'custom-modules': 'custom-modules',
  
  // Extensions and Developer Data
  'integrations': 'integrations',
  'developer': 'developer'
}

// Inventory-specific special section mappings
const inventorySpecialRoutes: Record<string, string> = {
  // Add inventory-specific special routes if needed
  'Stock Level Reports': 'reporting-analytics/stock-levels',
  'SKU Management': 'product-management/sku-management',
  'Warehouse Locations': 'warehouse-operations/locations'
}

// Generate full settings route for inventory app
export const generateSettingRoute = (categoryId: string, item: string): string => {
  // Handle special sections first
  if (inventorySpecialRoutes[item]) {
    return `/inventory/settings/${inventorySpecialRoutes[item]}`
  }
  
  // Get category route
  const categoryRoute = inventoryRouteMap[categoryId]
  if (!categoryRoute) {
    console.warn(`No route mapping found for inventory category: ${categoryId}`)
    return '/inventory/settings'
  }
  
  return baseGenerateSettingRoute('inventory', categoryRoute, item, inventorySpecialRoutes)
}

// Get breadcrumb for settings page
export const getSettingsBreadcrumb = (categoryId: string, item: string) => {
  const categoryNames: Record<string, string> = {
    'organisation': 'Organisation',
    'users-roles': 'Users & Roles',
    'customisation': 'Customisation',
    'automation': 'Automation',
    'product-management': 'Product Management',
    'warehouse-operations': 'Warehouse Operations',
    'inventory-control': 'Inventory Control',
    'reporting-analytics': 'Reporting & Analytics',
    'procurement': 'Procurement',
    'custom-modules': 'Custom Modules',
    'integrations': 'Integrations & Marketplace',
    'developer': 'Developer & Data'
  }

  const categoryName = categoryNames[categoryId] || 'Settings'

  return [
    { label: 'Settings', href: '/inventory/settings' },
    { label: categoryName },
    { label: item }
  ]
}

// Check if item is in a special section
export const isSpecialSectionItem = (item: string): boolean => {
  return Object.keys(inventorySpecialRoutes).includes(item)
}

// Get all possible routes for settings
export const getAllSettingsRoutes = () => {
  const routes: string[] = []
  
  // Add main category routes
  Object.values(inventoryRouteMap).forEach(category => {
    routes.push(`/inventory/settings/${category}/:item`)
  })
  
  // Add special section routes
  routes.push('/inventory/settings/reporting-analytics/:item')
  routes.push('/inventory/settings/product-management/:item')
  routes.push('/inventory/settings/warehouse-operations/:item')
  
  return routes
}