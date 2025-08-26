import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/core/api/axios';
import { getApiBaseUrl, isSuperAdminDomain } from '@/utils/tenant';

interface App {
  code: string;
  name: string;
  icon: string;
  url_prefix: string;
}

interface Application {
  code: string;
  name: string;
  description: string;
  icon: string;
  base_url: string;
  color?: string;
}

// API function
async function getUserApplications(): Promise<Application[]> {
  const baseUrl = getApiBaseUrl();
  const response = await axios.get(`${baseUrl}/api/apps/user-applications/`);
  return response.data;
}

export function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get applications from API (only for tenant users, not superadmin)
  const { data: apiApps } = useQuery({
    queryKey: ['user-applications'],
    queryFn: getUserApplications,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !isSuperAdminDomain(), // Disable for superadmin
  });

  // Transform API apps to component format
  const subscribedApps: App[] = (apiApps || []).map(app => ({
    code: app.code,
    name: app.name,
    icon: app.icon,
    url_prefix: app.base_url
  }));

  // Determine current app based on pathname
  const getCurrentApp = () => {
    const path = location.pathname;
    return subscribedApps.find(app => path.startsWith(app.url_prefix)) || subscribedApps[0];
  };

  const currentApp = getCurrentApp();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if no apps are available yet
  if (!subscribedApps.length) {
    return null;
  }

  const handleAppSelect = (app: App) => {
    navigate(app.url_prefix);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <span className="text-base">{currentApp.icon}</span>
        <span>{currentApp.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Switch App</p>
          </div>
          
          {subscribedApps.map((app) => (
            <button
              key={app.code}
              onClick={() => handleAppSelect(app)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                app.code === currentApp.code ? 'bg-gray-50 dark:bg-gray-700/50' : ''
              }`}
            >
              <span className="text-xl">{app.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {app.name}
                </p>
              </div>
              {app.code === currentApp.code && (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
            <button
              onClick={() => {
                navigate('/apps');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">All Apps</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}