export const getTenantFromHost = (): string | null => {
  const hostname = window.location.hostname
  
  // Handle tenant.localhost pattern first (before checking plain localhost)
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    return parts[0] !== 'localhost' ? parts[0] : null
  }
  
  // Handle localhost development - return null for superadmin access
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Return null for superadmin access (public schema)
    console.log('🔍 Using public schema for localhost superadmin access')
    return null
  }
  
  // Handle production domain pattern (tenant.domain.com)
  if (hostname.includes('.')) {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      return parts[0]
    }
  }
  
  return null
}

export const getApiBaseUrl = (): string => {
  const tenant = getTenantFromHost()
  const protocol = window.location.protocol
  
  // Debug logging
  console.log('🔍 getApiBaseUrl Debug:', {
    hostname: window.location.hostname,
    port: window.location.port,
    tenant,
    protocol,
    fullUrl: window.location.href
  })
  
  if (tenant) {
    // Use port 8000 for tenant-specific backend API
    // Map demo_company to demo subdomain for backwards compatibility
    const tenantHost = tenant === 'demo_company' ? 'demo' : tenant
    const apiUrl = `${protocol}//${tenantHost}.localhost:8000`
    console.log('🔍 Using tenant API URL:', apiUrl)
    return apiUrl
  }
  
  // No tenant means superadmin access via public schema
  const apiUrl = `${protocol}//127.0.0.1:8000`
  console.log('🔍 Using superadmin API URL (public schema):', apiUrl)
  return apiUrl
}

export const isSuperAdminDomain = (): boolean => {
  const hostname = window.location.hostname
  return hostname === '127.0.0.1' || hostname === 'localhost'
}

export const getCurrentTenant = (): string | null => {
  return getTenantFromHost()
}