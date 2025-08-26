import { Routes, Route } from 'react-router-dom';
import { TeamInboxComingSoon } from './ComingSoon';
import { TeamInboxLayout } from './layout/TeamInboxLayout';
import { SettingsPage } from '@/core/settings/SettingsPage';

export function TeamInboxRoutes() {
  return (
    <Routes>
      <Route element={<TeamInboxLayout />}>
        <Route index element={<TeamInboxComingSoon />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<TeamInboxComingSoon />} />
      </Route>
    </Routes>
  );
}