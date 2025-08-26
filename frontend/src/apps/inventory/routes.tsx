import { Routes, Route } from 'react-router-dom';
import { ProductsListPage } from './products/pages/ProductsListPage';
import { ProductDetailsRoute } from './products/pages/ProductDetailsRoute';
import { EditProductRoute } from './products/pages/EditProductRoute';
import { PageLayout } from '@/core/layouts/PageLayout';
// Import shared customer components from finance
import { CustomersListPage } from '@/apps/finance/Old Sales App/customers/pages/CustomersListPage';
import { CustomerDetailsPage } from '@/apps/finance/Old Sales App/customers/pages/CustomerDetailsPage';

import {
  OrganisationSettingsRouter,
  ProductManagementSettingsRouter,
  InventorySettingsPage
} from '../../core/settings/apps/inventory/routers';

export function InventoryRoutes() {
  return (
    <Routes>
      {/* Settings Routes - Full Page Layout (No PageLayout wrapper) */}
      <Route path="settings" element={<InventorySettingsPage />} />
      <Route path="settings/organisation/:item" element={<OrganisationSettingsRouter />} />
      <Route path="settings/product-management/:item" element={<ProductManagementSettingsRouter />} />

      {/* All other routes with PageLayout wrapper */}
      <Route path="*" element={
        <PageLayout>
          <Routes>
            {/* Inventory-specific routes */}
            <Route path="products" element={<ProductsListPage />} />
            <Route path="products/:id" element={<ProductDetailsRoute />} />
            <Route path="products/:id/edit" element={<EditProductRoute />} />
            
            {/* Shared customer routes - using finance components */}
            <Route path="customers" element={<CustomersListPage />} />
            <Route path="customers/:id" element={<CustomerDetailsPage />} />
            
            {/* Default route */}
            <Route index element={<ProductsListPage />} />
            <Route path="*" element={<ProductsListPage />} />
          </Routes>
        </PageLayout>
      } />
    </Routes>
  );
}