import { Routes, Route } from 'react-router-dom';

// Import existing modules
import { AccountsListPage } from './accounts/pages/AccountsListPage';
import { AccountDetailsRoute } from './accounts/pages/AccountDetailsRoute';
import { CreateAccountPage } from './accounts/pages/CreateAccountPage';
import { EditAccountRoute } from './accounts/pages/EditAccountRoute';

import { ContactsListPage } from './contacts/pages/ContactsListPage';
import { ContactDetailsRoute } from './contacts/pages/ContactDetailsRoute';
import { CreateContactPage } from './contacts/pages/CreateContactPage';
import { EditContactRoute } from './contacts/pages/EditContactRoute';

import { LeadsListPage } from './leads/pages/LeadsListPage';
import { LeadDetailsRoute } from './leads/pages/LeadDetailsRoute';
import { CreateLeadPage } from './leads/pages/CreateLeadPage';
import { EditLeadRoute } from './leads/pages/EditLeadRoute';

import { DealsListPage } from './deals/pages/DealsListPage';
import { DealDetailsRoute } from './deals/pages/DealDetailsRoute';
import { CreateDealPage } from './deals/pages/CreateDealPage';
import { EditDealRoute } from './deals/pages/EditDealRoute';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';

export default function CRMApp() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      
      {/* Profile */}
      <Route path="profile" element={<ProfilePage />} />
      
      {/* Accounts */}
      <Route path="accounts" element={<AccountsListPage />} />
      <Route path="accounts/new" element={<CreateAccountPage />} />
      <Route path="accounts/:id" element={<AccountDetailsRoute />} />
      <Route path="accounts/:id/edit" element={<EditAccountRoute />} />
      
      {/* Contacts */}
      <Route path="contacts" element={<ContactsListPage />} />
      <Route path="contacts/new" element={<CreateContactPage />} />
      <Route path="contacts/:id" element={<ContactDetailsRoute />} />
      <Route path="contacts/:id/edit" element={<EditContactRoute />} />
      
      {/* Leads */}
      <Route path="leads" element={<LeadsListPage />} />
      <Route path="leads/new" element={<CreateLeadPage />} />
      <Route path="leads/:id" element={<LeadDetailsRoute />} />
      <Route path="leads/:id/edit" element={<EditLeadRoute />} />
      
      {/* Deals */}
      <Route path="deals" element={<DealsListPage />} />
      <Route path="deals/new" element={<CreateDealPage />} />
      <Route path="deals/:id" element={<DealDetailsRoute />} />
      <Route path="deals/:id/edit" element={<EditDealRoute />} />
    </Routes>
  );
}