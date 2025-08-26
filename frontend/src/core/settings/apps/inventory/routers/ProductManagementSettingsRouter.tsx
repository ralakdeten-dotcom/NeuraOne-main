import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { SettingsLayout } from '../components'

// Placeholder components for Inventory product management settings
const ProductSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Product Settings</h1>
    <p className="text-gray-600">Product configuration settings will be implemented here.</p>
  </div>
)

const SKUManagementSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">SKU Management</h1>
    <p className="text-gray-600">SKU management and configuration will be implemented here.</p>
  </div>
)

const ProductCategoriesSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Product Categories</h1>
    <p className="text-gray-600">Product categories management will be implemented here.</p>
  </div>
)

const ProductVariantsSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Product Variants</h1>
    <p className="text-gray-600">Product variants configuration will be implemented here.</p>
  </div>
)

const PricingRulesSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Pricing Rules</h1>
    <p className="text-gray-600">Pricing rules and configuration will be implemented here.</p>
  </div>
)

const ProductImagesSettings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Product Images</h1>
    <p className="text-gray-600">Product images management settings will be implemented here.</p>
  </div>
)

// Route mapping for Inventory product management settings
const routeComponents = {
  'product-settings': ProductSettings,
  'sku-management': SKUManagementSettings,
  'product-categories': ProductCategoriesSettings,
  'product-variants': ProductVariantsSettings,
  'pricing-rules': PricingRulesSettings,
  'product-images': ProductImagesSettings,
}

export const ProductManagementSettingsRouter: React.FC = () => {
  const { item } = useParams<{ item: string }>()
  
  if (!item) {
    return <Navigate to="/inventory/settings" replace />
  }
  
  const Component = routeComponents[item as keyof typeof routeComponents]
  
  if (!Component) {
    return (
      <SettingsLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Setting Not Found</h1>
          <p className="text-gray-600">The requested inventory product management setting "{item}" was not found.</p>
        </div>
      </SettingsLayout>
    )
  }
  
  return (
    <SettingsLayout>
      <Component />
    </SettingsLayout>
  )
}