import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads, useDeleteLead, useLead, type LeadListItem } from '../api'
import { usePermissions } from '@/core/auth/usePermissions'
import { LeadForm } from '../components/LeadForm'
import { LeadFormModal } from '../components/LeadFormModal'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { DataTable, TableControls, ColumnManager, BadgeCell, DateCell, PrimaryLinkCell, useColumnVisibility, type ColumnConfig, type ActionConfig, ExportButton, type ExportColumn, formatDateForExport } from '@/shared'

export const LeadsListPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeadItems, setSelectedLeadItems] = useState<LeadListItem[]>([])
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const permissions = usePermissions()
  
  const { data: leadsData, isLoading, error, refetch } = useLeads(currentPage, pageSize)
  
  // Fetch lead data for editing (only when editingLeadId is set)
  const { data: editingLead } = useLead(editingLeadId || 0, {
    enabled: !!editingLeadId
  })

  // Handle URL-based panel opening
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setPanelOpen(true)
      // Remove the query parameter from URL
      searchParams.delete('create')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])
  const deleteLead = useDeleteLead()
  
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteLead.mutateAsync(id)
        alert('Lead deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting lead: ${errorMessage}`)
      }
    }
  }


  const handleNewLead = () => {
    setPanelOpen(true)
  }

  const handleEditLead = (lead: LeadListItem) => {
    setEditingLeadId(lead.lead_id)
    setEditModalOpen(true)
  }


  const handlePanelClose = () => {
    setPanelOpen(false)
  }

  const handlePanelSuccess = () => {
    setPanelOpen(false)
    refetch()
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setEditingLeadId(null)
  }

  const handleEditModalSuccess = () => {
    setEditModalOpen(false)
    setEditingLeadId(null)
    refetch()
  }

  const handleSelectionChange = (selectedItems: LeadListItem[]) => {
    setSelectedLeadItems(selectedItems)
  }

  const handleBulkDelete = async () => {
    if (selectedLeadItems.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedLeadItems.length} leads?`)) {
      try {
        for (const lead of selectedLeadItems) {
          await deleteLead.mutateAsync(lead.lead_id)
        }
        alert(`${selectedLeadItems.length} leads deleted successfully`)
        setSelectedLeadItems([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting leads: ${errorMessage}`)
      }
    }
  }

  const leads = leadsData?.results || []

  // DataTable column configuration
  const columns: ColumnConfig<LeadListItem>[] = [
    {
      key: 'full_name',
      title: 'Lead Name',
      sortable: true,
      locked: true, // Lock the Lead Name column as it's required for navigation
      render: (_, lead) => (
        <div>
          <PrimaryLinkCell 
            text={lead.full_name}
            onClick={() => navigate(`/crm/leads/${lead.lead_id}`)}
          />
          {lead.company_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {lead.company_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'lead_status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value || 'New'} 
          variant="green"
        />
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (_, lead) => {
        if (lead.email && lead.phone) {
          return (
            <div>
              <div className="text-gray-700 dark:text-gray-300">{lead.email}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lead.phone}</div>
            </div>
          )
        } else if (lead.email) {
          return lead.email
        } else if (lead.phone) {
          return lead.phone
        } else {
          return 'No contact info'
        }
      }
    },
    {
      key: 'lead_source',
      title: 'Source',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value || 'Unknown'} 
          variant="blue"
        />
      )
    },
    {
      key: 'lead_owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]

  // DataTable action configuration
  const actions: ActionConfig<LeadListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (lead) => navigate(`/crm/leads/${lead.lead_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (lead) => handleEditLead(lead),
      variant: 'default',
      hidden: (lead) => !permissions.canManageLeads || lead.lead_status === 'converted'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (lead) => handleDelete(lead.lead_id, lead.full_name),
      variant: 'danger',
      hidden: () => !permissions.canManageLeads
    }
  ]

  const canCreateLeads = permissions.canManageLeads

  // Export configuration
  const exportColumns: ExportColumn<LeadListItem>[] = [
    { key: 'full_name', label: 'Lead Name' },
    { key: 'lead_status', label: 'Status', formatter: (value) => value || 'New' },
    { key: 'email', label: 'Email', formatter: (value) => value || '' },
    { key: 'phone', label: 'Phone', formatter: (value) => value || '' },
    { key: 'company_name', label: 'Company', formatter: (value) => value || '' },
    { key: 'lead_source', label: 'Source', formatter: (value) => value || 'Unknown' },
    { key: 'industry', label: 'Industry', formatter: (value) => value || '' },
    { key: 'lead_owner_name', label: 'Owner', formatter: (value) => value || 'Unassigned' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]

  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility,
    resetToDefault
  } = useColumnVisibility(columns, {
    storageKey: 'leads-list',
    defaultVisible: ['full_name', 'lead_status', 'contact', 'lead_source', 'lead_owner_name', 'created_at']
  })

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search leads..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {leads.length} of {leadsData?.count} leads
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
              onReset={resetToDefault}
            />
            <ExportButton
              data={leads}
              columns={exportColumns}
              filename={`leads_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedLeadItems.length > 0 && permissions.canManageLeads && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedLeadItems.length})
              </button>
            )}
            {canCreateLeads && (
              <button
                onClick={handleNewLead}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                + New Lead
              </button>
            )}
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={leads}
        columns={columns}
        actions={actions}
        keyExtractor={(lead) => lead.lead_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={searchTerm}
        showSelection={true}
        onSelectionChange={handleSelectionChange}
        columnVisibility={columnVisibility}
        emptyMessage="No leads found. Try adjusting your search or filters."
      />

      {/* Pagination */}
      {leadsData && leadsData.count > pageSize && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {Math.ceil(leadsData.count / pageSize)}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(leadsData.count / pageSize)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Lead Form Side Panel */}
      <FormSidePanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        title="Create Lead"
        subtitle="Add a new potential customer to your pipeline"
        size="xl"
      >
        <LeadForm 
          onSuccess={handlePanelSuccess} 
          onCancel={handlePanelClose} 
        />
      </FormSidePanel>

      {/* Edit Lead Modal */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        lead={editingLead}
        onSuccess={handleEditModalSuccess}
      />
    </div>
  )
}