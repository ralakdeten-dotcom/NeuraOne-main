import React from 'react'
import { useParams } from 'react-router-dom'
import { ProductDetailsPage } from './ProductDetailsPage'

export const ProductDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id!, 10)
  
  if (isNaN(productId)) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Product ID
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The product ID in the URL is not valid.
          </p>
        </div>
      </div>
    )
  }
  
  return <ProductDetailsPage productId={productId} />
}