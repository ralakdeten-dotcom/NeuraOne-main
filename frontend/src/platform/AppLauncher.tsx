import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthProvider';
import axios from '@/core/api/axios';
import { getApiBaseUrl } from '@/utils/tenant';
import { Building2, Users, Mail, Handshake, User, Target, Briefcase, type LucideIcon } from 'lucide-react';

// Types
interface Application {
  code: string;
  name: string;
  description: string;
  icon: string;
  base_url: string;
  color?: string;
  status?: 'active' | 'maintenance' | 'beta';
}

interface UserPreferences {
  favorites: string[];
}

// API function
async function getUserApplications(): Promise<Application[]> {
  const baseUrl = getApiBaseUrl();
  const response = await axios.get(`${baseUrl}/api/apps/user-applications/`);
  return response.data;
}

// Skeleton Loading Component
function AppTileSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status?: 'active' | 'maintenance' | 'beta' }) {
  if (!status || status === 'active') return null;
  
  const variants = {
    maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
    beta: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status]}`}>
      {status === 'beta' && '🧪'} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Professional App Tile Component
function AppTile({ 
  app, 
  onClick, 
  isFavorite, 
  onToggleFavorite 
}: { 
  app: Application; 
  onClick: () => void; 
  isFavorite: boolean; 
  onToggleFavorite: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer p-6 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 ${
        isHovered ? 'ring-1 ring-blue-100' : ''
      }`}
    >
      {/* Header with Icon, Content and Favorite */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              getAppColor(app.code)
            } transform transition-transform group-hover:scale-105`}
          >
            {(() => {
              const IconComponent = getAppIcon(app.icon, app.code);
              return <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
                <StatusBadge status={app.status} />
              </div>
              {/* Launch Arrow */}
              <div className={`transition-all duration-200 ${isHovered ? 'translate-x-1' : ''}`}>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
              {app.description}
            </p>
          </div>
        </div>
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
            isFavorite 
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
              : 'text-gray-400 hover:text-amber-500 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// User Preferences Hooks
function useUserPreferences(): [UserPreferences, (prefs: UserPreferences) => void] {
  const [preferences, setPreferences] = useState<UserPreferences>({
    favorites: JSON.parse(localStorage.getItem('neura-app-favorites') || '[]'),
  });

  const updatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('neura-app-favorites', JSON.stringify(newPrefs.favorites));
  };

  return [preferences, updatePreferences];
}

// Time-based greeting function
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

// Get background color for application
function getAppColor(appCode: string): string {
  const colorMap: Record<string, string> = {
    crm: 'bg-gradient-to-br from-blue-500 to-blue-600',
    finance: 'bg-gradient-to-br from-green-500 to-green-600', 
    teaminbox: 'bg-gradient-to-br from-purple-500 to-purple-600',
  };
  
  return colorMap[appCode] || 'bg-gradient-to-br from-gray-500 to-gray-600';
}

// Get React icon for application - maps emoji icons to React icons
function getAppIcon(iconString: string, appCode: string): LucideIcon {
  // First try to map by emoji icon
  const emojiToIconMap: Record<string, LucideIcon> = {
    '📊': Users, // CRM - chart bar icon maps to Users for customer management
    '📧': Mail,  // TeamInbox - email icon maps to Mail
    '📈': Handshake, // Finance - handshake represents deals and partnerships
  };
  
  // Then try to map by app code as fallback
  const codeToIconMap: Record<string, LucideIcon> = {
    crm: Users,
    teaminbox: Mail,
    finance: Handshake,
  };
  
  return emojiToIconMap[iconString] || codeToIconMap[appCode] || Building2;
}

// Main App Launcher Component
export function AppLauncher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferences, setPreferences] = useUserPreferences();
  
  const { data: apps, isLoading, error } = useQuery({
    queryKey: ['user-applications'],
    queryFn: getUserApplications,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if API endpoint doesn't exist
    refetchOnWindowFocus: false,
  });

  // Enhanced applications with status
  const applications: Application[] = (apps || []).map(app => ({
    ...app,
    status: app.code === 'teaminbox' ? 'beta' as const : 'active' as const
  }));

  // Handle app launch
  const handleAppLaunch = (app: Application) => {
    navigate(app.base_url);
  };

  // Toggle favorite
  const toggleFavorite = (appCode: string) => {
    const newFavorites = preferences.favorites.includes(appCode)
      ? preferences.favorites.filter(code => code !== appCode)
      : [...preferences.favorites, appCode];
    
    setPreferences({
      ...preferences,
      favorites: newFavorites
    });
  };

  // Organize applications
  const favoriteApps = applications.filter(app => preferences.favorites.includes(app.code));
  const otherApps = applications.filter(app => !preferences.favorites.includes(app.code));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Professional Loading Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-64 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded-lg w-48"></div>
            </div>
          </div>
        </div>
        
        {/* Loading Grid */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <AppTileSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Unavailable</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">We're having trouble loading your applications. This might be a temporary issue.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enterprise Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Welcome to NeuraOne</h1>
                <p className="text-lg text-gray-600 mt-1">
                  {getTimeBasedGreeting()}, <span className="font-medium">{user?.full_name || user?.email}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
                <div>{applications.length} apps available</div>
              </div>
              <button
                onClick={() => navigate('/crm/profile')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Account Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Applications Available</h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
              Contact your system administrator to get access to business applications for your role.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Favorites Section */}
            {favoriteApps.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-gray-900">Favorites</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {favoriteApps.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {favoriteApps.map((app) => (
                    <AppTile
                      key={app.code}
                      app={app}
                      onClick={() => handleAppLaunch(app)}
                      isFavorite={true}
                      onToggleFavorite={() => toggleFavorite(app.code)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Applications Section */}
            {otherApps.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-gray-900">Applications</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {otherApps.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {otherApps.map((app) => (
                    <AppTile
                      key={app.code}
                      app={app}
                      onClick={() => handleAppLaunch(app)}
                      isFavorite={preferences.favorites.includes(app.code)}
                      onToggleFavorite={() => toggleFavorite(app.code)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Sleek Quick Actions */}
        {applications.some(app => app.code === 'crm') && (
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: User, label: 'New Contact', path: '/crm/contacts/new', color: 'from-green-500 to-green-600' },
                    { icon: Target, label: 'New Lead', path: '/crm/leads/new', color: 'from-blue-500 to-blue-600' },
                    { icon: Briefcase, label: 'New Deal', path: '/crm/deals/new', color: 'from-purple-500 to-purple-600' },
                    { icon: Building2, label: 'Accounts', path: '/crm/accounts', color: 'from-orange-500 to-orange-600' },
                  ].map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left border border-transparent hover:border-gray-200 hover:shadow-sm"
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// App Switcher Component (for header/sidebar)
export function AppSwitcher() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  const currentApp = pathname.split('/')[1] || 'apps';
  
  // Get applications from API (same query as AppLauncher)
  const { data: apiApps } = useQuery({
    queryKey: ['user-applications'],
    queryFn: getUserApplications,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  // Build apps list with launcher + API apps
  const apps = [
    { code: 'apps', name: 'App Launcher', path: '/apps' },
    ...(apiApps || []).map(app => ({
      code: app.code,
      name: app.name,
      path: app.base_url
    }))
  ];

  return (
    <div className="relative">
      <select
        value={currentApp}
        onChange={(e) => navigate(e.target.value)}
        className="appearance-none bg-gray-800 text-white pl-3 pr-8 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {apps.map(app => (
          <option key={app.code} value={app.path}>
            {app.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}