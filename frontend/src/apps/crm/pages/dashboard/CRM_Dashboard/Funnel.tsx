import React, { useState } from 'react'
import { useDealsByStage } from '@/apps/crm/deals/api'
import { FormModal } from '@/shared/components/modals/FormModal'
import { DealListItem } from '@/apps/crm/deals/api'
import { TrendingUp, Users, Target, Handshake, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FunnelStage {
  name: string
  key: string
  color: string
  bgColor: string
  icon: React.ReactNode
  width: string
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    name: 'Prospecting',
    key: 'Prospecting',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    icon: <Users className="w-4 h-4" />,
    width: 'w-64'
  },
  {
    name: 'Analysis',
    key: 'Analysis',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    icon: <TrendingUp className="w-4 h-4" />,
    width: 'w-56'
  },
  {
    name: 'Proposal',
    key: 'Proposal',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    icon: <Target className="w-4 h-4" />,
    width: 'w-48'
  },
  {
    name: 'Negotiation',
    key: 'Negotiation',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    icon: <Handshake className="w-4 h-4" />,
    width: 'w-40'
  },
  {
    name: 'Closed',
    key: 'Closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    icon: <AlertCircle className="w-4 h-4" />,
    width: 'w-32'
  },
  {
    name: 'Closed Won',
    key: 'Closed Won',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: <CheckCircle className="w-4 h-4" />,
    width: 'w-24'
  },
  {
    name: 'Closed Lost',
    key: 'Closed Lost',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    icon: <XCircle className="w-4 h-4" />,
    width: 'w-20'
  }
]

export const Funnel: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: dealsByStage } = useDealsByStage()

  const handleStageClick = (stage: FunnelStage) => {
    setSelectedStage(stage)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStage(null)
  }

  const getStageDeals = (stageKey: string): DealListItem[] => {
    if (!dealsByStage?.deals_by_stage) return []
    return dealsByStage.deals_by_stage[stageKey] || []
  }

  const getStageCount = (stageKey: string): number => {
    return getStageDeals(stageKey).length
  }

  const formatCurrency = (amount: string): string => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const calculateStageValue = (deals: DealListItem[]): string => {
    const total = deals.reduce((sum, deal) => sum + parseFloat(deal.amount || '0'), 0)
    return formatCurrency(total.toString())
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Sales Funnel
      </h3>
      
      {/* Funnel Visualization */}
      <div className="flex items-start justify-center space-x-8">
        {/* Funnel Shape */}
        <div className="flex flex-col items-center space-y-0.5">
          {FUNNEL_STAGES.map((stage, index) => {
            const count = getStageCount(stage.key)
            
            return (
              <div
                key={stage.key}
                className={`
                  ${stage.width} h-8 relative cursor-pointer transform transition-all duration-200 
                  hover:scale-105 hover:shadow-lg group
                `}
                onClick={() => handleStageClick(stage)}
                style={{
                  clipPath: index === FUNNEL_STAGES.length - 1 
                    ? 'polygon(15% 0%, 85% 0%, 70% 100%, 30% 100%)'
                    : 'polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%)'
                }}
              >
                {/* Stage Background */}
                <div 
                  className={`
                    w-full h-full ${stage.bgColor} border-2 border-transparent 
                    group-hover:border-gray-300 dark:group-hover:border-gray-500
                    flex items-center justify-center relative overflow-hidden
                  `}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
                  </div>
                  
                  {/* Just the count */}
                  <div className="relative z-10 text-center">
                    <span className={`font-bold text-sm ${stage.color}`}>
                      {count}
                    </span>
                  </div>
                </div>
                
                {/* Hover Indicator */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200"></div>
              </div>
            )
          })}
        </div>
        
        {/* External Labels */}
        <div className="flex flex-col justify-start space-y-0.5">
          {FUNNEL_STAGES.map((stage, index) => {
            const count = getStageCount(stage.key)
            const deals = getStageDeals(stage.key)
            const stageValue = calculateStageValue(deals)
            
            return (
              <div 
                key={`${stage.key}-label`} 
                className="flex items-center space-x-3 h-8 cursor-pointer group"
                onClick={() => handleStageClick(stage)}
              >
                {/* Connecting Line */}
                <div className="w-6 h-0.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400"></div>
                
                {/* Stage Info */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">
                      {index + 1}.
                    </span>
                    <span className={stage.color}>{stage.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {stage.name}
                      </h4>
                      {count > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {count} deal{count !== 1 ? 's' : ''} • {stageValue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Stage Details Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedStage ? `${selectedStage.name} Stage` : ''}
        subtitle={selectedStage ? `Deals currently in ${selectedStage.name.toLowerCase()} stage` : ''}
        size="xl"
      >
        {selectedStage && (
          <div className="space-y-4">
            {/* Stage Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${selectedStage.bgColor}`}>
                  <span className={selectedStage.color}>{selectedStage.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedStage.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getStageCount(selectedStage.key)} deals • {calculateStageValue(getStageDeals(selectedStage.key))} total value
                  </p>
                </div>
              </div>
            </div>
            
            {/* Deals List */}
            <div className="space-y-3">
              {getStageDeals(selectedStage.key).length > 0 ? (
                getStageDeals(selectedStage.key).map((deal) => (
                  <div
                    key={deal.deal_id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {deal.deal_name}
                        </h4>
                        <div className="mt-1 space-y-1">
                          {deal.account_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Account:</span> {deal.account_name}
                            </p>
                          )}
                          {deal.owner_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Owner:</span> {deal.owner_name}
                            </p>
                          )}
                          {deal.primary_contact_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Contact:</span> {deal.primary_contact_name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Close Date:</span> {new Date(deal.close_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(deal.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {deal.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {deal.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className={selectedStage.color}>{selectedStage.icon}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No deals in {selectedStage.name.toLowerCase()} stage
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </FormModal>
    </div>
  )
}