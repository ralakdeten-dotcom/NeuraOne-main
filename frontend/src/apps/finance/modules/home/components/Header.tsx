import React from 'react';
import { Home, BarChart3, BookOpen, Bell } from 'lucide-react';

interface HeaderProps {
  activeSection?: 'dashboard' | 'getting-started' | 'recent-updates';
  onSectionChange?: (section: 'dashboard' | 'getting-started' | 'recent-updates') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeSection = 'dashboard', 
  onSectionChange 
}) => {
  const sections = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'getting-started' as const, label: 'Getting Started', icon: BookOpen },
    { id: 'recent-updates' as const, label: 'Recent Updates', icon: Bell },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Header Title */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Finance Home
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your financial operations and stay updated
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6">
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange?.(section.id)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Header;