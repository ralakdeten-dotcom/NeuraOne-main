import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePermissions } from '@/core/auth/usePermissions'
import { LoadingSpinner, ErrorAlert } from '@/shared'
import { useProduct } from '../api'
import { ProductForm } from '../components/ProductForm'

export const EditProductRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const productId = parseInt(id!, 10)
  const { data: product, isLoading, error } = useProduct(productId)
  
  // Permission check
  const canManageProducts = permissions.hasPermission('manage_products') || permissions.hasPermission('all')
  
  if (isNaN(productId)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Product ID
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The product ID in the URL is not valid.
          </p>
          <button 
            onClick={() => navigate('/finance/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
  
  if (!canManageProducts) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to edit products.
          </p>
          <button 
            onClick={() => navigate('/finance/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
  
  const handleSuccess = () => {
    navigate(`/finance/products/${productId}`)
  }
  
  const handleCancel = () => {
    navigate(`/finance/products/${productId}`)
  }
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSpinner />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorAlert message={String(error)} />
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/finance/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The product you're trying to edit doesn't exist or has been deleted.
          </p>
          <button 
            onClick={() => navigate('/finance/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Product Details
        </button>
      </div>
      
      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <ProductForm 
          product={product}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}