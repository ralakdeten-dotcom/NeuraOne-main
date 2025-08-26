import React from 'react'
import { ProductForm } from './ProductForm'
import { Product } from '../api'

interface ProductFormSidePanelProps {
  isOpen: boolean
  onClose: () => void
  product?: Product
  onSuccess?: () => void
}

export const ProductFormSidePanel: React.FC<ProductFormSidePanelProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess
}) => {
  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <ProductForm 
      product={product}
      onSuccess={handleSuccess}
      onCancel={onClose}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}