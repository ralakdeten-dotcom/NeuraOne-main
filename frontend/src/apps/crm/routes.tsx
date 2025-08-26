import { Route, Routes } from 'react-router-dom';
import { PageLayout } from '../../core/layouts/PageLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeadsListPage } from './leads/pages/LeadsListPage';
import { CreateLeadPage } from './leads/pages/CreateLeadPage';
import { LeadDetailsRoute } from './leads/pages/LeadDetailsRoute';
import { EditLeadRoute } from './leads/pages/EditLeadRoute';
import { ContactsListPage } from './contacts/pages/ContactsListPage';
import { CreateContactPage } from './contacts/pages/CreateContactPage';
import { ContactDetailsRoute } from './contacts/pages/ContactDetailsRoute';
import { EditContactRoute } from './contacts/pages/EditContactRoute';
import { AccountsListPage } from './accounts/pages/AccountsListPage';
import { CreateAccountPage } from './accounts/pages/CreateAccountPage';
import { AccountDetailsRoute } from './accounts/pages/AccountDetailsRoute';
import { EditAccountRoute } from './accounts/pages/EditAccountRoute';
import { DealsListPage } from './deals/pages/DealsListPage';
import { CreateDealPage } from './deals/pages/CreateDealPage';
import { DealDetailsRoute } from './deals/pages/DealDetailsRoute';
import { EditDealRoute } from './deals/pages/EditDealRoute';

import {
  OrganisationSettingsRouter,
  UsersSettingsRouter,
  LeadManagementSettingsRouter,
  CRMSettingsPage
} from '../../core/settings/apps/crm/routers';

export function CRMRoutes() {
  console.log('CRMRoutes component rendered');
  return (
    <Routes>
      {/* Settings Routes - Full Page Layout (No PageLayout wrapper) */}
      <Route path="settings" element={<CRMSettingsPage />} />
      <Route path="settings/organisation/:item" element={<OrganisationSettingsRouter />} />
      <Route path="settings/users/:item" element={<UsersSettingsRouter />} />
      <Route path="settings/lead-management/:item" element={<LeadManagementSettingsRouter />} />

      {/* All other routes with PageLayout wrapper */}
      <Route path="*" element={
        <PageLayout>
          <Routes>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />
            
            {/* Leads */}
            <Route path="leads" element={<LeadsListPage />} />
            <Route path="leads/new" element={<CreateLeadPage />} />
            <Route path="leads/:id" element={<LeadDetailsRoute />} />
            <Route path="leads/:id/edit" element={<EditLeadRoute />} />
            
            {/* Contacts */}
            <Route path="contacts" element={<ContactsListPage />} />
            <Route path="contacts/new" element={<CreateContactPage />} />
            <Route path="contacts/:id" element={<ContactDetailsRoute />} />
            <Route path="contacts/:id/edit" element={<EditContactRoute />} />
            
            {/* Accounts */}
            <Route path="accounts" element={<AccountsListPage />} />
            <Route path="accounts/new" element={<CreateAccountPage />} />
            <Route path="accounts/:id" element={<AccountDetailsRoute />} />
            <Route path="accounts/:id/edit" element={<EditAccountRoute />} />
            
            {/* Deals */}
            <Route path="deals" element={<DealsListPage />} />
            <Route path="deals/new" element={<CreateDealPage />} />
            <Route path="deals/:id" element={<DealDetailsRoute />} />
            <Route path="deals/:id/edit" element={<EditDealRoute />} />
            
            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Catch all route */}
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </PageLayout>
      } />
    </Routes>
  );
}