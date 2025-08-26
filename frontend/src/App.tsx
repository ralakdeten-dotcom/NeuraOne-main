import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/core/auth/AuthProvider'
import { AppThemeProvider } from '@/core/contexts/ThemeProvider'
import { WidgetProvider } from '@/core/contexts/WidgetContext'
import { NavigationProvider } from '@/core/contexts/NavigationContext'
import { ProtectedRoute } from '@/core/auth/ProtectedRoute'
import { LoginPage } from '@/core/auth/LoginPage'
import { ErrorBoundary } from '@/core/components/ErrorBoundary'
import { AppLauncher } from '@/platform/AppLauncher'
// import { IntegratedLayout } from '@/platform/IntegratedLayout'
import { SuperAdminApp } from '@/platform/superadmin'
import { RoleBasedRoute } from '@/core/auth/RoleBasedRoute'
import { CRMApp } from '@/apps/crm/CRMApp'
import { TeamInboxRoutes } from '@/apps/teaminbox/routes'
import { FinanceRoutes } from '@/apps/finance/routes'
import { InventoryRoutes } from '@/apps/inventory/routes'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <WidgetProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Router>
                <NavigationProvider>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                  <Routes>
                  {/* Authentication */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Super Admin Application */}
                  <Route 
                    path="/superadmin/*" 
                    element={
                      <ProtectedRoute>
                        <RoleBasedRoute requiredRole="superadmin">
                          <SuperAdminApp />
                        </RoleBasedRoute>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* CRM Application - moved before /apps to ensure it matches first */}
                  <Route 
                    path="/crm/*" 
                    element={
                      <ProtectedRoute>
                        <CRMApp />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* TeamInbox Application */}
                  <Route 
                    path="/teaminbox/*" 
                    element={
                      <ProtectedRoute>
                        <TeamInboxRoutes />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Finance Application */}
                  <Route 
                    path="/finance/*" 
                    element={
                      <ProtectedRoute>
                        <FinanceRoutes />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Inventory Application */}
                  <Route 
                    path="/inventory/*" 
                    element={
                      <ProtectedRoute>
                        <InventoryRoutes />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* App Launcher */}
                  <Route 
                    path="/apps" 
                    element={
                      <ProtectedRoute>
                        <AppLauncher />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Default redirect to apps */}
                  <Route path="/" element={<Navigate to="/apps" replace />} />
                  
                  {/* Catch all redirect - only for truly unmatched paths */}
                  <Route path="*" element={<Navigate to="/apps" replace />} />
                </Routes>

                <Toaster 
                  position="top-center"
                  toastOptions={{
                    style: {
                      marginTop: '48px', // Header height is h-12 (48px)
                    },
                  }}
                />
                </div>
                </NavigationProvider>
              </Router>
            </ErrorBoundary>
          </AuthProvider>
        </WidgetProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  )
}

export default App