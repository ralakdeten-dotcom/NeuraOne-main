import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { CompactDataTable } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import type { CompactColumnConfig } from '../tables/CompactDataTable'
import type { ColumnConfig } from '../tables/DataTable'
import { DealFormModal } from '@/apps/crm/deals/components/DealFormModal'
import { LeadFormModal } from '@/apps/crm/leads/components/LeadFormModal'

interface Deal {
  deal_id: number
  deal_name: string
  stage: string
  amount: string
  close_date: string
  account_name?: string
  account_id?: number
  owner?: string
  owner_name?: string
  deal_owner_alias?: string
  primary_contact_name?: string
  description?: string
  created_at?: string
}

interface DealsTabProps {
  data?: Deal[] | { deals: Deal[]; count?: number; account_id?: number; account_name?: string; contact_id?: number; contact_name?: string } | { results: Deal[] }
  entityId?: number
  entityType?: string
  entityName?: string
  isLoading?: boolean
}

export const DealsTab: React.FC<DealsTabProps> = ({ data, entityId, entityType, entityName, isLoading }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    deal_name: true,
    amount: true,
    stage: true,
    close_date: true,
    owner_name: true,
  })

  // Ensure data is an array
  const deals = React.useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && 'results' in data && Array.isArray(data.results)) return data.results
    if (typeof data === 'object' && 'deals' in data && Array.isArray(data.deals)) return data.deals
    return []
  }, [data])

  // Extract account and contact info from data if available
  const accountInfo = React.useMemo(() => {
    if (data && typeof data === 'object' && 'account_id' in data && data.account_id) {
      return { id: data.account_id, name: data.account_name || `Account ${data.account_id}` }
    }
    return null
  }, [data])

  const contactInfo = React.useMemo(() => {
    if (data && typeof data === 'object' && 'contact_id' in data && data.contact_id) {
      return { id: data.contact_id, name: data.contact_name || `Contact ${data.contact_id}` }
    }
    return null
  }, [data])

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Analysis':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Proposal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Negotiation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Closed Won':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Closed Lost':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDealClick = (deal: Deal) => {
    navigate(`/crm/deals/${deal.deal_id}`)
  }

  const handleAddDeal = () => {
    setIsDealModalOpen(true)
  }


  const handleLeadSuccess = () => {
    setIsLeadModalOpen(false)
    // Refresh deals data if needed
  }

  const handleDealSuccess = () => {
    setIsDealModalOpen(false)
    // Refresh deals data - this will trigger automatically via React Query
  }

  const handleEditDealSuccess = () => {
    setIsEditDealModalOpen(false)
    setEditingDeal(null)
    // Refresh deals data - this will trigger automatically via React Query
  }


  // Define column configurations for ColumnManager
  const allDealColumns: ColumnConfig[] = [
    { 
      key: 'deal_name', 
      title: 'Deal Name', 
      width: '20%', 
      locked: true,
      render: (value: string, item: Deal) => (
        <button
          onClick={() => handleDealClick(item)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 text-left"
        >
          {value}
        </button>
      )
    },
    { 
      key: 'amount', 
      title: 'Amount', 
      width: '20%',
      render: (value: string, item: Deal) => (
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(value)}
        </div>
      )
    },
    { 
      key: 'stage', 
      title: 'Stage', 
      width: '20%',
      render: (value: string, item: Deal) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(value)}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'close_date', 
      title: 'Close Until', 
      width: '20%',
      render: (value: string, item: Deal) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {formatDate(value)}
        </div>
      )
    },
    { 
      key: 'owner_name', 
      title: 'Deal Owner', 
      width: '20%',
      render: (value: string, item: Deal) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {item.owner_name || item.deal_owner_alias || item.owner || 'Unassigned'}
        </div>
      )
    },
  ]

  // Filter visible columns for CompactDataTable and add sortable functionality
  const visibleDealColumns: CompactColumnConfig[] = allDealColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: true, // All columns are sortable
      searchable: true, // All columns are searchable
      render: column.render || ((value: any, item: Deal) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {value || '-'}
        </div>
      ))
    }))

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      deal_name: true,
      amount: true,
      stage: true,
      close_date: true,
      owner_name: true,
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 pt-2">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-2">
      <CompactDataTable
        data={deals}
        columns={visibleDealColumns}
        keyExtractor={(item) => item.deal_id}
        emptyMessage={`No deals found for this ${entityType || 'entity'}.`}
        showHeader={true}
        showSelection={false}
        showControls={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search deals..."
        controlsActions={
          <>
            <ColumnManager
              columns={allDealColumns}
              visibleColumns={columnVisibility}
              onVisibilityChange={setColumnVisibility}
              onReset={resetColumnVisibility}
            />
            <button
              onClick={handleAddDeal}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Plus size={16} />
              New Deal
            </button>
          </>
        }
      />

      {/* Deal Form Modal */}
      <DealFormModal 
        isOpen={isDealModalOpen}
        onClose={() => setIsDealModalOpen(false)}
        initialAccount={
          entityType === 'account' && entityId 
            ? { id: entityId, name: entityName || `Account ${entityId}` }
            : accountInfo || undefined
        }
        initialContact={
          entityType === 'contact' && entityId 
            ? { id: entityId, name: entityName || `Contact ${entityId}` }
            : contactInfo || undefined
        }
        onSuccess={handleDealSuccess}
      />

      {/* Edit Deal Form Modal */}
      <DealFormModal 
        isOpen={isEditDealModalOpen}
        onClose={() => setIsEditDealModalOpen(false)}
        deal={editingDeal || undefined}
        initialAccount={
          entityType === 'account' && entityId 
            ? { id: entityId, name: entityName || `Account ${entityId}` }
            : accountInfo || undefined
        }
        initialContact={
          entityType === 'contact' && entityId 
            ? { id: entityId, name: entityName || `Contact ${entityId}` }
            : contactInfo || undefined
        }
        onSuccess={handleEditDealSuccess}
      />

      {/* Lead Form Modal */}
      <LeadFormModal 
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        initialAccount={entityType === 'account' && entityId ? { id: entityId, name: `Account ${entityId}` } : undefined}
        onSuccess={handleLeadSuccess}
      />
    </div>
  )
}