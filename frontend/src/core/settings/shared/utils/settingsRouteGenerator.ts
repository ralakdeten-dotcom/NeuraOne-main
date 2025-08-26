// Shared utility for generating settings routes across all apps
export interface SettingsCategory {
  id: string
  title: string
  routePath: string
}

export interface SettingsItem {
  name: string
  category: string
  routeSlug?: string
}

// Generate route slug from item name
export const generateItemSlug = (item: string): string => {
  if (!item) return ''
  return item
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Generate full settings route for any app
export const generateSettingRoute = (
  appName: string,
  categoryPath: string,
  item: string,
  specialRoutes?: Record<string, string>
): string => {
  // Handle special routes (e.g., taxes/manage, payments/gateways)
  if (specialRoutes && specialRoutes[item]) {
    return `/${appName}/settings/${specialRoutes[item]}`
  }
  
  // Generate item slug
  const itemSlug = generateItemSlug(item)
  
  return `/${appName}/settings/${categoryPath}/${itemSlug}`
}

// Get breadcrumb for settings page
export const generateSettingsBreadcrumb = (
  categoryName: string,
  itemName: string,
  appName?: string
) => {
  const breadcrumbs = [
    { label: 'All Settings' }
  ]
  
  if (appName) {
    breadcrumbs.push({ label: `${appName} Settings` })
  }
  
  breadcrumbs.push(
    { label: categoryName },
    { label: itemName }
  )
  
  return breadcrumbs
}

// Base settings page interface that all apps can implement
export interface SettingsPageProps {
  title: string
  searchPlaceholder?: string
  onNavigateBack?: () => void
  onSettingClick?: (categoryId: string, item: string) => void
}

// Base settings group structure
export interface SettingsGroup {
  id: string
  title: string
  categories: SettingsCategory[]
}