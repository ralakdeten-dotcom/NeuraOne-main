import { Outlet } from 'react-router-dom';
import { AppSwitcher } from '../../../platform/AppSwitcher';
import { ThemeToggle } from '@/core/components/ThemeToggle';

export function TeamInboxLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            TeamInbox
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* App Switcher Dropdown */}
          <AppSwitcher />
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}