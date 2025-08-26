import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Plus, 
  Users, 
  Globe,
  Eye,
  Edit,
  Calendar
} from 'lucide-react'
import { superAdminApi, type Tenant } from '../api'
import { DataTable, type ColumnConfig } from '@/shared/components/tables/DataTable'
import { StatusBadge } from '@/shared/components/badges/StatusBadge'
import { Button } from '@/shared/components/buttons/Button'

// Simple date formatter
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Simple SearchInput component
const SearchInput: React.FC<{
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ placeholder, value, onChange }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
  />
)

export const TenantListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tenantData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: superAdminApi.listTenants,
    refetchInterval: 30000,
  })

  const filteredTenants = tenantData?.results?.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.schema_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const columns: ColumnConfig<Tenant>[] = [
    {
      key: 'name',
      title: 'Company Name',
      render: (_value: any, tenant: Tenant) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building2 className="h-8 w-8 text-blue-500 bg-blue-100 dark:bg-blue-900/20 rounded-lg p-1.5" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {tenant.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {tenant.schema_name}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'domain',
      title: 'Domain',
      render: (_value: any, tenant: Tenant) => (
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {tenant.domain || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'users',
      title: 'Users',
      render: (_value: any, tenant: Tenant) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {tenant.user_count}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_value: any, tenant: Tenant) => (
        <StatusBadge
          status={tenant.is_active ? 'active' : 'inactive'}
          size="sm"
        />
      )
    },
    {
      key: 'created',
      title: 'Created',
      render: (_value: any, tenant: Tenant) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {formatDate(tenant.created_on)}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_value: any, tenant: Tenant) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/superadmin/tenants/${tenant.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary" 
            size="sm"
            onClick={() => navigate(`/superadmin/tenants/${tenant.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading tenants</p>
          <Button 
            onClick={() => refetch()} 
            className="mt-4"
            variant="primary"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tenant Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all tenants and their configurations
          </p>
        </div>
        <button
          onClick={() => navigate('/superadmin/tenants/new')}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Create Tenant</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Total: {tenantData?.count || 0} tenants</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <DataTable<Tenant>
          data={filteredTenants}
          columns={columns}
          loading={isLoading}
          keyExtractor={(tenant) => tenant.id.toString()}
          emptyMessage={searchTerm 
            ? 'No tenants match your search criteria.'
            : 'No tenants found. Get started by creating your first tenant.'
          }
        />
      </div>
    </div>
  )
}