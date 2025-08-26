import { Routes, Route } from 'react-router-dom';
import { PageLayout } from '@/core/layouts/PageLayout';
import { UserDashboard } from './pages/dashboard/CRM_Dashboard/UserDashboard';
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
import { LeadScoreReport } from './pages/dashboard/Report';
import { SettingsPage } from '../../core/settings/SettingsPage';

export function CRMApp() {
  return (
    <PageLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<UserDashboard />} />
        
        {/* Reports */}
        <Route path="/reports" element={<LeadScoreReport />} />
        
        {/* Leads */}
        <Route path="/leads" element={<LeadsListPage />} />
        <Route path="/leads/new" element={<CreateLeadPage />} />
        <Route path="/leads/:id" element={<LeadDetailsRoute />} />
        <Route path="/leads/:id/edit" element={<EditLeadRoute />} />
        
        {/* Contacts */}
        <Route path="/contacts" element={<ContactsListPage />} />
        <Route path="/contacts/new" element={<CreateContactPage />} />
        <Route path="/contacts/:id" element={<ContactDetailsRoute />} />
        <Route path="/contacts/:id/edit" element={<EditContactRoute />} />
        
        {/* Accounts */}
        <Route path="/accounts" element={<AccountsListPage />} />
        <Route path="/accounts/new" element={<CreateAccountPage />} />
        <Route path="/accounts/:id" element={<AccountDetailsRoute />} />
        <Route path="/accounts/:id/edit" element={<EditAccountRoute />} />
        
        {/* Deals */}
        <Route path="/deals" element={<DealsListPage />} />
        <Route path="/deals/new" element={<CreateDealPage />} />
        <Route path="/deals/:id" element={<DealDetailsRoute />} />
        <Route path="/deals/:id/edit" element={<EditDealRoute />} />
        
        
        {/* Profile */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<UserDashboard />} />
      </Routes>
    </PageLayout>
  );
}