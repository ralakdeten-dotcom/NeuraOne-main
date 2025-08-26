import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Users, 
  Calendar,
  Settings,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { superAdminApi } from '../api'
import { Button } from '@/shared/components/buttons/Button'
import { StatsCard } from '@/shared/components/cards'
import { StatusBadge } from '@/shared/components/badges/StatusBadge'

// Simple Card component for layout
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

// Simple date formatter
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const TenantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: superAdminApi.listTenants,
  })

  const tenant = tenantData?.results?.find(t => t.id.toString() === id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading tenant details...</p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {error ? 'Error loading tenant details' : 'Tenant not found'}
          </p>
          <Button 
            onClick={() => navigate('/superadmin/tenants')} 
            className="mt-4"
            variant="primary"
          >
            Back to Tenants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/superadmin/tenants')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tenants</span>
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenant.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Schema: {tenant.schema_name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge
            status={tenant.is_active ? 'active' : 'inactive'}
            size="lg"
          />
          <Button
            variant="secondary"
            onClick={() => navigate(`/superadmin/tenants/${id}/edit`)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={tenant.user_count}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          variant="primary"
          size="md"
        />
        <StatsCard
          title="Domain"
          value={tenant.domain || 'Default'}
          icon={<Globe className="h-6 w-6 text-green-500" />}
          variant="success"
          size="md"
        />
        <StatsCard
          title="Created"
          value={formatDate(tenant.created_on)}
          icon={<Calendar className="h-6 w-6 text-purple-500" />}
          variant="default"
          size="md"
        />
        <StatsCard
          title="Status"
          value={tenant.is_active ? 'Active' : 'Inactive'}
          icon={<Activity className="h-6 w-6 text-yellow-500" />}
          variant="warning"
          size="md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Company Name
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {tenant.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Schema Name
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {tenant.schema_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Domain
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {tenant.domain || 'Using default domain'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created Date
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(tenant.created_on)}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {/* TODO: Implement user management */}}
                disabled
              >
                <Users className="h-4 w-4 mr-3" />
                Manage Users
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {/* TODO: Implement application management */}}
                disabled
              >
                <Settings className="h-4 w-4 mr-3" />
                Manage Applications
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {/* TODO: Implement domain management */}}
                disabled
              >
                <Globe className="h-4 w-4 mr-3" />
                Configure Domain
              </Button>
              <Button
                variant={tenant.is_active ? 'danger' : 'success'}
                className="w-full justify-start"
                onClick={() => {/* TODO: Implement activate/deactivate */}}
                disabled
              >
                {tenant.is_active ? (
                  <>
                    <XCircle className="h-4 w-4 mr-3" />
                    Deactivate Tenant
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-3" />
                    Activate Tenant
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Log - Placeholder */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Activity logs will be available in a future update
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}