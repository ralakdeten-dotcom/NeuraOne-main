import React from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { Logo } from '@/shared/components/ui/Logo'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  User
} from 'lucide-react'

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/superadmin', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Tenants', 
    href: '/superadmin/tenants', 
    icon: Building2 
  },
  { 
    name: 'Users', 
    href: '/superadmin/users', 
    icon: Users,
    disabled: true
  },
  { 
    name: 'Applications', 
    href: '/superadmin/applications', 
    icon: Settings,
    disabled: true
  }
]

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isCurrentPath = (path: string) => {
    if (path === '/superadmin') {
      return location.pathname === '/superadmin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Super Admin
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  System Management Console
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              const isDisabled = item.disabled

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="inline-flex items-center px-1 py-4 text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                    <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}