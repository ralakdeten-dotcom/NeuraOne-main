import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SuperAdminDashboard } from './pages/SuperAdminDashboard'
import { TenantListPage } from './pages/TenantListPage'
import { CreateTenantPage } from './pages/CreateTenantPage'
import { TenantDetailsPage } from './pages/TenantDetailsPage'
import { SuperAdminLayout } from './layouts/SuperAdminLayout'

export const SuperAdminApp: React.FC = () => {
  return (
    <SuperAdminLayout>
      <Routes>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<TenantListPage />} />
        <Route path="tenants/new" element={<CreateTenantPage />} />
        <Route path="tenants/:id" element={<TenantDetailsPage />} />
        {/* Redirect unknown paths to dashboard */}
        <Route path="*" element={<Navigate to="/superadmin" replace />} />
      </Routes>
    </SuperAdminLayout>
  )
}