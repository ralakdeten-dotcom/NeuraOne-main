import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  UserCheck, 
  TrendingUp,
  Package,
  MessageSquare,
  Mail,
  Settings,
  FileText,
  Receipt
} from 'lucide-react';

interface UnifiedSidebarProps {
  currentApp: string;
}

const crmNavItems = [
  { path: '/crm', label: 'Dashboard', icon: TrendingUp },
  { path: '/crm/leads', label: 'Leads', icon: UserCheck },
  { path: '/crm/contacts', label: 'Contacts', icon: Users },
  { path: '/crm/accounts', label: 'Accounts', icon: Building2 },
  { path: '/crm/deals', label: 'Deals', icon: TrendingUp },
];

const financeNavItems = [
  { path: '/finance', label: 'Dashboard', icon: TrendingUp },
  { path: '/finance/customers', label: 'Customers', icon: Users },
  { path: '/finance/estimates', label: 'Estimates', icon: FileText },
  { path: '/finance/sales-orders', label: 'Sales Orders', icon: Package },
  { path: '/finance/invoices', label: 'Invoices', icon: Receipt },
];

const inventoryNavItems = [
  { path: '/inventory/products', label: 'Products', icon: Package },
];

const teamInboxNavItems = [
  { path: '/teaminbox', label: 'Inbox', icon: Mail },
  { path: '/teaminbox/conversations', label: 'Conversations', icon: MessageSquare },
  { path: '/teaminbox/templates', label: 'Templates', icon: FileText },
  { path: '/teaminbox/settings', label: 'Settings', icon: Settings },
];

export function UnifiedSidebar({ currentApp }: UnifiedSidebarProps) {
  const location = useLocation();
  
  const getNavItems = () => {
    switch (currentApp) {
      case 'crm': return crmNavItems;
      case 'finance': return financeNavItems;
      case 'inventory': return inventoryNavItems;
      case 'teaminbox': return teamInboxNavItems;
      default: return crmNavItems;
    }
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}