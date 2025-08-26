// Simple app detection utility based on URL path
export type AppType = 'crm' | 'finance' | 'inventory' | 'teaminbox';

export function getCurrentApp(pathname: string): AppType {
  // Simple prefix matching - no state needed!
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/teaminbox')) return 'teaminbox';
  if (pathname.startsWith('/crm')) return 'crm';
  
  // Default to CRM for root and other paths
  return 'crm';
}

// Helper to get app display name
export function getAppDisplayName(app: AppType): string {
  const names = {
    crm: 'CRM',
    finance: 'Finance', 
    inventory: 'Inventory',
    teaminbox: 'Team Inbox'
  };
  return names[app] || 'CRM';
}

// Helper to check if a path is active
export function isPathActive(itemPath: string, currentPath: string): boolean {
  // Exact match
  if (itemPath === currentPath) return true;
  
  // For nested routes (e.g., /finance/customers/123 matches /finance/customers)
  if (currentPath.startsWith(itemPath + '/')) return true;
  
  return false;
}