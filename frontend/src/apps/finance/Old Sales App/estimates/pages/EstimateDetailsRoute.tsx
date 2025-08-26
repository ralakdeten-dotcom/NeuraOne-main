import React from 'react'
import { useParams } from 'react-router-dom'
import { EstimateDetailsPage } from './EstimateDetailsPage'

export const EstimateDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  if (!id || isNaN(Number(id))) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Estimate ID
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The estimate ID provided is not valid.
          </p>
        </div>
      </div>
    )
  }

  return <EstimateDetailsPage estimateId={Number(id)} />
}