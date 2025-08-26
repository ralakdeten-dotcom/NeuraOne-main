import React from 'react'
import { ProductForm } from './ProductForm'
import { Product } from '../api'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product
  onSuccess?: () => void
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
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