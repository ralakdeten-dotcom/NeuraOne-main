import React from 'react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { superAdminApi } from '../api'
import { StatsCard } from '@/shared/components/cards'
import { 
  Users, 
  Settings, 
  Activity,
  Plus,
  Building2,
  Globe
} from 'lucide-react'

export const SuperAdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: superAdminApi.getDashboardStats,
    refetchInterval: 30000,
    enabled: isAuthenticated && user?.is_superadmin,
  })

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              System-wide management and monitoring
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/superadmin/tenants/new')}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Tenant
          </button>
          <button 
            onClick={() => navigate('/superadmin/tenants')}
            className="inline-flex items-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Manage Tenants
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tenants</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.total_tenants || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.total_users || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Domains</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.active_domains || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Actions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {stats?.total_actions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Tenants
            </h3>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              View all →
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {stats?.recent_tenants && stats.recent_tenants.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {stats.recent_tenants.map((tenant, index) => (
                  <li key={index}>
                    <div className={`relative ${index !== stats.recent_tenants.length - 1 ? 'pb-8' : ''}`}>
                      {index !== stats.recent_tenants.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-600" aria-hidden="true"></span>
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-slate-800">
                            <Building2 className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Tenant <span className="font-medium text-slate-900 dark:text-white">{tenant.name}</span> was created
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <Globe className="h-3 w-3" />
                                <span>{tenant.domain}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <Users className="h-3 w-3" />
                                <span>{tenant.users} users</span>
                              </div>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                tenant.status === 'Active' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                              }`}>
                                {tenant.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
                            <time>{tenant.created}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No recent tenant activity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}