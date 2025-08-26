import { Routes, Route } from 'react-router-dom';
import { FinanceDashboard } from './Old Sales App/FinanceDashboard';
import { EstimatesListPage } from './Old Sales App/estimates/pages/EstimatesListPage';
import { CreateEstimatePage } from './Old Sales App/estimates/pages/CreateEstimatePage';
import { EstimateDetailsRoute } from './Old Sales App/estimates/pages/EstimateDetailsRoute';
import { EditEstimateRoute } from './Old Sales App/estimates/pages/EditEstimateRoute';
import { SalesOrdersListPage } from './Old Sales App/sales-orders/pages/SalesOrdersListPage';
import { CreateSalesOrderPage } from './Old Sales App/sales-orders/pages/CreateSalesOrderPage';
import { SalesOrderDetailsRoute } from './Old Sales App/sales-orders/pages/SalesOrderDetailsRoute';
import { EditSalesOrderRoute } from './Old Sales App/sales-orders/pages/EditSalesOrderRoute';
import { CustomersListPage } from './Old Sales App/customers/pages/CustomersListPage';
import { CustomerDetailsRoute } from './Old Sales App/customers/pages/CustomerDetailsRoute';
import { VendorsListPage } from './Old Sales App/vendors/pages/VendorsListPage';
import { InvoicesListPage } from './Old Sales App/invoices/pages/InvoicesListPage';
import { CreateInvoicePage } from './Old Sales App/invoices/pages/CreateInvoicePage';
import { InvoiceDetailsRoute } from './Old Sales App/invoices/pages/InvoiceDetailsRoute';
import { EditInvoiceRoute } from './Old Sales App/invoices/pages/EditInvoiceRoute';
import { ProfilePlaceholder } from './Old Sales App/ProfilePlaceholder';
import { PageLayout } from '@/core/layouts/PageLayout';
import { FinanceLayout } from './layouts/FinanceLayout';

import { EmptyPlaceholder } from './components/EmptyPlaceholder';
import { Dashboard } from './Home';
import { AccountsList } from './Accountant/ChartsOfAccounts/AccountsList';
import { AccountDetails } from './Accountant/ChartsOfAccounts/AccountDetails';

import { CustomersList } from './Sales/Customers/CustomersList';
import { CustomerCreate } from './Sales/Customers/CustomerCreate';
import { QuotesList } from './Sales/Quotes/QuotesList';

import { VendorsList } from './Purchases/Vendors/VendorsList';
import { VendorCreate } from './Purchases/Vendors/VendorCreate';

import { ItemsListPage, NewItemPage, ItemDetailPage, PriceListsListPage, NewPriceListPage, EditPriceListPage, InventoryAdjustmentsListPage } from './Items';


import { SettingsPage } from '@/core/settings/SettingsPage'
import {
  OrganisationSettingsRouter,
  UsersSettingsRouter,
  TaxesSettingsRouter,
  SetupSettingsRouter,
  CustomisationSettingsRouter,
  AutomationSettingsRouter,
  GeneralSettingsRouter,
  InventorySettingsRouter,
  PaymentsSettingsRouter,
  SalesSettingsRouter,
  PurchasesSettingsRouter,
  CustomModulesSettingsRouter,
  IntegrationsSettingsRouter,
  DeveloperSettingsRouter,
  FinanceSettingsPage
} from '../../core/settings/apps/finance/routers';


export function FinanceRoutes() {
  return (
    <Routes>
      {/* Settings Routes - Full Page Layout (No PageLayout wrapper) */}
      <Route path="settings" element={<FinanceSettingsPage />} />
      <Route path="settings/organisation/:item" element={<OrganisationSettingsRouter />} />
      <Route path="settings/users/:item" element={<UsersSettingsRouter />} />
      <Route path="settings/taxes/:item" element={<TaxesSettingsRouter />} />
      <Route path="settings/setup/:item" element={<SetupSettingsRouter />} />
      <Route path="settings/customisation/:item" element={<CustomisationSettingsRouter />} />
      <Route path="settings/automation/:item" element={<AutomationSettingsRouter />} />
      <Route path="settings/general/:item" element={<GeneralSettingsRouter />} />
      <Route path="settings/inventory/:item" element={<InventorySettingsRouter />} />
      <Route path="settings/payments/:item" element={<PaymentsSettingsRouter />} />
      <Route path="settings/sales/:item" element={<SalesSettingsRouter />} />
      <Route path="settings/purchases/:item" element={<PurchasesSettingsRouter />} />
      <Route path="settings/custom-modules/:item" element={<CustomModulesSettingsRouter />} />
      <Route path="settings/integrations/:item" element={<IntegrationsSettingsRouter />} />
      <Route path="settings/developer/:item" element={<DeveloperSettingsRouter />} />


      {/* All other routes with PageLayout wrapper */}
      <Route path="*" element={
        <PageLayout>
          <FinanceLayout>
            <Routes>
              {/* New Modules - Empty Canvas */}
              <Route index element={<Dashboard />} />
              <Route path="items/all-items" element={<ItemsListPage />} />
              <Route path="items/new" element={<NewItemPage />} />
              <Route path="items/:id" element={<ItemDetailPage />} />
              <Route path="items/:id/edit" element={<NewItemPage />} />
              <Route path="items/price-lists" element={<PriceListsListPage />} />
              <Route path="items/price-lists/new" element={<NewPriceListPage />} />
              <Route path="items/price-lists/edit/:id" element={<EditPriceListPage />} />
              <Route path="items/inventory-adjustments" element={<InventoryAdjustmentsListPage />} />
              <Route path="items" element={<ItemsListPage />} />
              <Route path="banking" element={<EmptyPlaceholder />} />
              <Route path="banking/*" element={<EmptyPlaceholder />} />
              <Route path="sales" element={<EmptyPlaceholder />} />
              <Route path="sales/customers" element={<CustomersList />} />
              <Route path="sales/customers/new" element={<CustomerCreate />} />
              <Route path="sales/quotes" element={<QuotesList />} />
              <Route path="sales/sales-orders" element={<EmptyPlaceholder />} />
              <Route path="sales/invoices" element={<EmptyPlaceholder />} />
              <Route path="sales/payments-received" element={<EmptyPlaceholder />} />
              <Route path="sales/credit-notes" element={<EmptyPlaceholder />} />
              <Route path="purchases" element={<EmptyPlaceholder />} />
              <Route path="purchases/vendors" element={<VendorsList />} />
              <Route path="purchases/vendors/new" element={<VendorCreate />} />
              <Route path="purchases/*" element={<EmptyPlaceholder />} />
              <Route path="vat" element={<EmptyPlaceholder />} />
              <Route path="vat/*" element={<EmptyPlaceholder />} />
              <Route path="accountant/chart-of-accounts" element={<AccountsList />} />
              <Route path="accountant/chart-of-accounts/:id" element={<AccountDetails />} />
              <Route path="accountant/manual-journals" element={<EmptyPlaceholder />} />
              <Route path="accountant/bulk-update" element={<EmptyPlaceholder />} />
              <Route path="accountant/currency-adjustments" element={<EmptyPlaceholder />} />
              <Route path="accountant/budgets" element={<EmptyPlaceholder />} />
              <Route path="accountant/transaction-locking" element={<EmptyPlaceholder />} />
              <Route path="reports" element={<EmptyPlaceholder />} />
              <Route path="reports/*" element={<EmptyPlaceholder />} />
              <Route path="documents" element={<EmptyPlaceholder />} />
              <Route path="documents/*" element={<EmptyPlaceholder />} />
              
              {/* Old Sales App Routes */}
              <Route path="old-dashboard" element={<FinanceDashboard />} />
              <Route path="customers" element={<CustomersListPage />} />
              <Route path="customers/:id" element={<CustomerDetailsRoute />} />
              <Route path="vendors" element={<VendorsListPage />} />
              <Route path="vendors/:id" element={<CustomerDetailsRoute />} />
              <Route path="estimates" element={<EstimatesListPage />} />
              <Route path="estimates/new" element={<CreateEstimatePage />} />
              <Route path="estimates/:id" element={<EstimateDetailsRoute />} />
              <Route path="estimates/:id/edit" element={<EditEstimateRoute />} />
              <Route path="sales-orders" element={<SalesOrdersListPage />} />
              <Route path="sales-orders/new" element={<CreateSalesOrderPage />} />
              <Route path="sales-orders/:id" element={<SalesOrderDetailsRoute />} />
              <Route path="sales-orders/:id/edit" element={<EditSalesOrderRoute />} />
              <Route path="invoices" element={<InvoicesListPage />} />
              <Route path="invoices/new" element={<CreateInvoicePage />} />
              <Route path="invoices/:id" element={<InvoiceDetailsRoute />} />
              <Route path="invoices/:id/edit" element={<EditInvoiceRoute />} />
              <Route path="profile" element={<ProfilePlaceholder />} />

              {/* Catch all route */}
              <Route path="*" element={<EmptyPlaceholder />} />
            </Routes>
          </FinanceLayout>
        </PageLayout>
      } />
    </Routes>
  );
}