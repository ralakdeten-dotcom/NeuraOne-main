import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { 
  Home,
  Package,
  Landmark,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  UserCircle,
  BarChart2,
  BarChart3,
  FileText,
  X,
  ChevronDown,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Building2,
  CreditCard,
  Repeat,
  ClipboardList,
  HandCoins,
  Truck,
  Mail,
  MessageSquare,
  Settings,
  Luggage
} from 'lucide-react'
import { Logo } from '@/shared/components/ui/Logo'
import { getCurrentApp, isPathActive } from '@/utils/appContext'

// Get navigation based on current app
const getNavigationForApp = (app: string) => {
  switch(app) {
    case 'finance':
      return [
        {
          segment: 'home',
          title: 'Home',
          icon: Home,
          href: '/finance',
        },
        {
          kind: 'divider',
        },
        {
          segment: 'items',
          title: 'Items',
          icon: Package,
          isDropdown: true,
          children: [
            {
              segment: 'all-items',
              title: 'All Items',
              href: '/finance/items/all-items',
              permission: 'manage_products',
            },
            {
              segment: 'price-lists',
              title: 'Price Lists',
              href: '/finance/items/price-lists',
              permission: 'manage_products',
            },
          ],
        },
        {
          segment: 'inventory',
          title: 'Inventory',
          icon: Luggage,
          isDropdown: true,
          children: [
            {
              segment: 'inventory-adjustments',
              title: 'Inventory Adjustments',
              href: '/finance/inventory/inventory-adjustments',
              permission: 'manage_inventory',
            },
          ],
        },
        {
          kind: 'divider',
        },
        {
          segment: 'banking',
          title: 'Banking',
          icon: Landmark,
          href: '/finance/banking',
          permission: 'manage_banking',
        },
        {
          kind: 'divider',
        },
        {
          segment: 'sales',
          title: 'Sales',
          icon: ShoppingCart,
          isDropdown: true,
          children: [
            {
              segment: 'customers',
              title: 'Customers',
              href: '/finance/sales/customers',
              permission: 'manage_customers',
            },
            {
              segment: 'quotes',
              title: 'Quotes',
              href: '/finance/sales/quotes',
              permission: 'manage_opportunities',
            },
            {
              segment: 'sales-orders',
              title: 'Sales Orders',
              href: '/finance/sales/sales-orders',
              permission: 'manage_opportunities',
            },
            {
              segment: 'invoices',
              title: 'Invoices',
              href: '/finance/sales/invoices',
              permission: 'manage_opportunities',
            },
            {
              segment: 'payments-received',
              title: 'Payments Received',
              href: '/finance/sales/payments-received',
              permission: 'manage_opportunities',
            },
            {
              segment: 'credit-notes',
              title: 'Credit Notes',
              href: '/finance/sales/credit-notes',
              permission: 'manage_opportunities',
            },
          ],
        },
        {
          kind: 'divider',
        },
        {
          segment: 'purchases',
          title: 'Purchases',
          icon: ShoppingBag,
          isDropdown: true,
          children: [
            {
              segment: 'vendors',
              title: 'Vendors',
              href: '/finance/purchases/vendors',
              permission: 'manage_purchases',
            },
            {
              segment: 'expenses',
              title: 'Expenses',
              href: '/finance/purchases/expenses',
              permission: 'manage_purchases',
            },
            {
              segment: 'recurring-expenses',
              title: 'Recurring Expenses',
              href: '/finance/purchases/recurring-expenses',
              permission: 'manage_purchases',
            },
            {
              segment: 'purchase-orders',
              title: 'Purchase Orders',
              href: '/finance/purchases/purchase-orders',
              permission: 'manage_purchases',
            },
            {
              segment: 'bills',
              title: 'Bills',
              href: '/finance/purchases/bills',
              permission: 'manage_purchases',
            },
            {
              segment: 'payments-made',
              title: 'Payments Made',
              href: '/finance/purchases/payments-made',
              permission: 'manage_purchases',
            },
            {
              segment: 'recurring-bills',
              title: 'Recurring Bills',
              href: '/finance/purchases/recurring-bills',
              permission: 'manage_purchases',
            },
            {
              segment: 'vendor-credits',
              title: 'Vendor Credits',
              href: '/finance/purchases/vendor-credits',
              permission: 'manage_purchases',
            },
          ],
        },
        {
          kind: 'divider',
        },
        {
          segment: 'vat',
          title: 'VAT',
          icon: Receipt,
          href: '/finance/vat',
          permission: 'manage_vat',
        },
        {
          kind: 'divider',
        },
        {
          segment: 'accountant',
          title: 'Accountant',
          icon: UserCircle,
          isDropdown: true,
          children: [
            {
              segment: 'manual-journals',
              title: 'Manual Journals',
              href: '/finance/accountant/manual-journals',
              permission: 'manage_accounting',
            },
            {
              segment: 'bulk-update',
              title: 'Bulk Update',
              href: '/finance/accountant/bulk-update',
              permission: 'manage_accounting',
            },
            {
              segment: 'currency-adjustments',
              title: 'Currency Adjustments',
              href: '/finance/accountant/currency-adjustments',
              permission: 'manage_accounting',
            },
            {
              segment: 'chart-of-accounts',
              title: 'Chart of Accounts',
              href: '/finance/accountant/chart-of-accounts',
              permission: 'manage_accounting',
            },
            {
              segment: 'budgets',
              title: 'Budget',
              href: '/finance/accountant/budgets',
              permission: 'manage_accounting',
            },
            {
              segment: 'transaction-locking',
              title: 'Transaction Locking',
              href: '/finance/accountant/transaction-locking',
              permission: 'manage_accounting',
            },
          ],
        },
        {
          kind: 'divider',
        },
        {
          segment: 'reports',
          title: 'Reports',
          icon: BarChart3,
          href: '/finance/reports',
          permission: 'manage_reports',
        },
        {
          kind: 'divider',
        },
        {
          segment: 'documents',
          title: 'Documents',
          icon: FileText,
          href: '/finance/documents',
          permission: 'manage_documents',
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'OLD SALES APP',
        },
        {
          segment: 'old-dashboard',
          title: 'Dashboard',
          icon: Home,
          href: '/finance/old-dashboard',
        },
        {
          segment: 'old-customers',
          title: 'Customers',
          icon: Users,
          href: '/finance/customers',
          permission: 'manage_customers',
        },
        {
          segment: 'old-vendors',
          title: 'Vendors',
          icon: Building2,
          href: '/finance/vendors',
          permission: 'manage_customers',
        },
        {
          segment: 'old-estimates',
          title: 'Estimates',
          icon: FileText,
          href: '/finance/estimates',
          permission: 'manage_opportunities',
        },
        {
          segment: 'old-sales-orders',
          title: 'Sales Orders',
          icon: ShoppingCart,
          href: '/finance/sales-orders',
          permission: 'manage_opportunities',
        },
        {
          segment: 'old-invoices',
          title: 'Invoices',
          icon: Receipt,
          href: '/finance/invoices',
          permission: 'manage_opportunities',
        },
      ];
      
    case 'inventory':
      return [
        {
          kind: 'header',
          title: 'ANALYTICS',
        },
        {
          segment: 'dashboard',
          title: 'Dashboard',
          icon: BarChart3,
          href: '/inventory',
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'INVENTORY',
        },
        {
          segment: 'products',
          title: 'Products',
          icon: Package,
          href: '/inventory/products',
          permission: 'manage_products',
        },
        {
          segment: 'stock-levels',
          title: 'Stock Levels',
          icon: BarChart2,
          href: '/inventory/stock-levels',
          permission: 'manage_inventory',
          disabled: true,
        },
        {
          segment: 'adjustments',
          title: 'Adjustments',
          icon: FileText,
          href: '/inventory/adjustments',
          permission: 'manage_inventory',
          disabled: true,
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'SALES',
        },
        {
          segment: 'customers',
          title: 'Customers',
          icon: Users,
          href: '/inventory/customers',
          permission: 'manage_customers',
        },
        {
          segment: 'sales-orders',
          title: 'Sales Orders',
          icon: ShoppingCart,
          href: '/inventory/sales-orders',
          permission: 'manage_opportunities',
          disabled: true,
        },
        {
          segment: 'shipments',
          title: 'Shipments',
          icon: Truck,
          href: '/inventory/shipments',
          permission: 'manage_shipments',
          disabled: true,
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'PURCHASES',
        },
        {
          segment: 'vendors',
          title: 'Vendors',
          icon: Building2,
          href: '/inventory/vendors',
          permission: 'manage_vendors',
          disabled: true,
        },
        {
          segment: 'purchase-orders',
          title: 'Purchase Orders',
          icon: ClipboardList,
          href: '/inventory/purchase-orders',
          permission: 'manage_purchases',
          disabled: true,
        },
      ];
      
    case 'teaminbox':
      return [
        {
          kind: 'header',
          title: 'COMMUNICATION',
        },
        {
          segment: 'inbox',
          title: 'Inbox',
          icon: Mail,
          href: '/teaminbox',
        },
        {
          segment: 'conversations',
          title: 'Conversations',
          icon: MessageSquare,
          href: '/teaminbox/conversations',
          permission: 'manage_communications',
          disabled: true,
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'CONFIGURATION',
        },
        {
          segment: 'templates',
          title: 'Templates',
          icon: FileText,
          href: '/teaminbox/templates',
          permission: 'manage_templates',
          disabled: true,
        },
        {
          segment: 'settings',
          title: 'Settings',
          icon: Settings,
          href: '/teaminbox/settings',
          permission: 'manage_settings',
          disabled: true,
        },
      ];
      
    case 'crm':
    default:
      return [
        {
          kind: 'header',
          title: 'ANALYTICS',
        },
        {
          segment: 'dashboard',
          title: 'Dashboard',
          icon: BarChart3,
          href: '/crm',
        },
        {
          segment: 'reports',
          title: 'Reports',
          icon: TrendingUp,
          href: '/crm/reports',
          permission: 'manage_reports',
        },
        {
          kind: 'divider',
        },
        {
          kind: 'header',
          title: 'MODULES',
        },
        {
          segment: 'leads',
          title: 'Leads',
          icon: Target,
          href: '/crm/leads',
          permission: 'manage_leads',
        },
        {
          segment: 'accounts',
          title: 'Accounts',
          icon: Building2,
          href: '/crm/accounts',
          permission: 'manage_accounts',
        },
        {
          segment: 'contacts',
          title: 'Contacts',
          icon: Users,
          href: '/crm/contacts',
          permission: 'manage_contacts',
        },
        {
          segment: 'deals',
          title: 'Deals',
          icon: DollarSign,
          href: '/crm/deals',
          permission: 'manage_opportunities',
        }
      ];
  }
};

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  isMobile = false, 
  collapsed = false,
  onToggleCollapse: _onToggleCollapse
}) => {
  const location = useLocation()
  
  // Detect current app from URL path - simple and clean!
  const currentApp = getCurrentApp(location.pathname)
  const NAVIGATION = getNavigationForApp(currentApp)
  
  // Initialize with the correct active item based on current path
  const getActiveSegment = (pathname: string, forCollapsed = false) => {
    // Check dropdown children first for exact matches
    for (const item of NAVIGATION) {
      if ('isDropdown' in item && item.isDropdown && 'children' in item && item.children) {
        for (const child of item.children) {
          if (child.href && pathname.startsWith(child.href)) {
            // In collapsed mode, return parent dropdown segment for indicator
            return forCollapsed ? item.segment : child.segment;
          }
        }
      }
    }
    
    // Then try to find an exact match in top-level items
    const exactMatch = NAVIGATION.find(item => 
      'href' in item && item.href && pathname === item.href
    )?.segment;
    
    if (exactMatch) return exactMatch;
    
    // For nested routes, find the most specific match
    // Sort by href length (longest first) to prioritize more specific routes
    const matchingItems = NAVIGATION
      .filter(item => 'href' in item && item.href && pathname.startsWith(item.href + '/'))
      .sort((a, b) => (('href' in b && b.href?.length) || 0) - (('href' in a && a.href?.length) || 0));
    
    return matchingItems[0]?.segment || null;
  }
  
  const [activeItem, setActiveItem] = useState<string | null>(() => 
    getActiveSegment(location.pathname)
  );
  
  // Separate active item for collapsed mode (shows parent dropdown)
  const [collapsedActiveItem, setCollapsedActiveItem] = useState<string | null>(() => 
    getActiveSegment(location.pathname, true)
  );
  
  // State for managing expanded dropdowns
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Initialize with expanded items based on current path
    const initial = new Set<string>();
    NAVIGATION.forEach(item => {
      if ('isDropdown' in item && item.isDropdown && 'children' in item && item.children) {
        const hasActiveChild = item.children.some((child: any) => 
          'href' in child && child.href && location.pathname.startsWith(child.href)
        );
        if (hasActiveChild && item.segment) {
          initial.add(item.segment);
        }
      }
    });
    return initial;
  });

  // State for collapsed dropdown hover
  const [collapsedHoveredItem, setCollapsedHoveredItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);

  useEffect(() => {
    const newActiveSegment = getActiveSegment(location.pathname);
    const newCollapsedActiveSegment = getActiveSegment(location.pathname, true);
    setActiveItem(newActiveSegment);
    setCollapsedActiveItem(newCollapsedActiveSegment || newActiveSegment); // Fallback to regular segment if no specific collapsed segment
  }, [location.pathname]);

  const filteredNavigation = NAVIGATION.filter(item => {
    if (item.kind === 'header' || item.kind === 'divider') return true
    
    // Temporarily disable permission checks for testing
    console.log('Navigation item:', item.title, 'permission:', item.permission)
    
    // For now, allow all items to test if the issue is with permissions
    return true
 
  })

  // Helper function for consistent navigation item styles
  const getNavItemStyles = (isActive: boolean, isCollapsed: boolean) => {
    const baseStyles = `group flex items-center text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative transform-gpu ${
      isCollapsed ? 'justify-center p-2 mx-auto mb-1 w-10 h-10' : 'px-3 py-2 mx-2'
    }`;

    const activeStyles = 'bg-white bg-opacity-10 dark:bg-gray-700 dark:bg-opacity-50 text-white dark:text-gray-200 shadow-lg hover:text-white dark:hover:text-gray-200';

    const inactiveStyles = 'text-neutral-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-5 dark:hover:bg-opacity-50';

    return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
  }

  const renderNavigationItem = (item: any, index: number) => {
    if (item.kind === 'header') {
      return (
        <div 
          key={`header-${index}`} 
          className={`transition-all duration-500 ease-out overflow-hidden ${
            collapsed && !isMobile 
              ? 'max-h-0 opacity-0 px-1.5 py-0 mt-0' 
              : 'max-h-8 opacity-100 px-2.5 py-1 mt-2 mb-1 first:mt-1'
          }`}
          style={{ 
            transitionDelay: collapsed && !isMobile ? '0ms' : '150ms' 
          }}
          onMouseEnter={() => {
            if (collapsed && !isMobile && collapsedHoveredItem) {
              setCollapsedHoveredItem(null);
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }
          }}
        >
          <h3 className="text-xs font-semibold text-white dark:text-gray-300 text-opacity-50 dark:text-opacity-70 uppercase tracking-wide whitespace-nowrap w-full">
            {item.title}
          </h3>
        </div>
      )
    }

    if (item.kind === 'divider') {
      return (
        <div
          key={`divider-${index}`} 
          className={`transition-all duration-300 overflow-hidden ${
            collapsed && !isMobile 
              ? 'max-h-0.5 opacity-100 my-0.5 flex justify-center' 
              : 'max-h-3 opacity-100 my-2'
          }`}
          style={{ 
            transitionDelay: collapsed && !isMobile ? '0ms' : '100ms' 
          }}
          onMouseEnter={() => {
            if (collapsed && !isMobile && collapsedHoveredItem) {
              setCollapsedHoveredItem(null);
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }
          }}
        >
          {collapsed && !isMobile ? (
            <div className="w-10 border-t border-white dark:border-gray-600 border-opacity-15" />
          ) : (
            <hr className="border-white dark:border-gray-600 border-opacity-15" />
          )}
        </div>
      )
    }

    const isActive = activeItem === item.segment
    const IconComponent = item.icon
    const isDisabled = item.disabled || (!item.href && !item.isDropdown)
    
    // Handle dropdown items
    if ('isDropdown' in item && item.isDropdown && 'children' in item && item.children) {
      const isExpanded = expandedItems.has(item.segment || '');
      const hasActiveChild = item.children.some((child: any) => 
        'href' in child && child.href && (location.pathname.startsWith(child.href) || activeItem === child.segment)
      );
      
      return (
        <div key={item.segment} className={`${collapsed && !isMobile ? 'relative' : 'mx-2'} ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (collapsed && !isMobile) {
                // In collapsed mode, show/hide hover dropdown
                setCollapsedHoveredItem(collapsedHoveredItem === item.segment ? null : item.segment);
              } else {
                // In expanded mode, toggle normal dropdown (accordion behavior - only one open at a time)
                setExpandedItems(prev => {
                  const newSet = new Set<string>();
                  if (!prev.has(item.segment || '')) {
                    // If this item is not expanded, close all others and open this one
                    newSet.add(item.segment || '');
                  }
                  // If this item was already expanded, close it (newSet remains empty)
                  return newSet;
                });
              }
            }}
            onMouseEnter={(e) => {
              if (collapsed && !isMobile) {
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  top: rect.top,
                  left: rect.right + 6 // 6px to the right of the left sidebar border
                });
                setCollapsedHoveredItem(item.segment);
              }
            }}
            className={`group flex items-center text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative transform-gpu ${
              collapsed && !isMobile 
                ? 'justify-center p-2 mb-1 w-10 h-10' 
                : 'justify-between px-3 py-2 w-full'
            } ${
              hasActiveChild 
                ? 'bg-white bg-opacity-10 dark:bg-gray-700 dark:bg-opacity-50 text-white dark:text-gray-200 shadow-lg hover:text-white dark:hover:text-gray-200'
                : 'text-neutral-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-5 dark:hover:bg-opacity-50'
            }`}
            title={collapsed && !isMobile ? item.title : undefined}
            data-dropdown-id={item.segment}
          >
            <div className="flex items-center">
              <IconComponent 
                className={`transition-all duration-150 ease-out ${
                  collapsed && !isMobile 
                    ? 'w-5 h-5' 
                    : 'w-5 h-5 mr-3'
                } ${
                  hasActiveChild 
                    ? 'text-white dark:text-gray-200 scale-105' 
                    : 'text-white dark:text-gray-400 text-opacity-70'
                }`}
              />
              {!collapsed && !isMobile && (
                <span className="font-medium truncate whitespace-nowrap">
                  {item.title}
                </span>
              )}
            </div>
            {!collapsed && !isMobile && (
              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </span>
            )}
            
            {/* Active indicator for collapsed dropdown button */}
            {(collapsed && !isMobile) && (collapsedActiveItem === item.segment || hasActiveChild) && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white dark:bg-gray-300 rounded-l opacity-90 shadow-lg transition-all duration-150 ease-out transform-gpu z-10"></div>
            )}
          </button>
          
          {/* Render children when expanded */}
          {!collapsed && !isMobile && isExpanded && (
            <div className="w-full mt-1 space-y-1">
              {item.children.map((child: any, childIndex: number) => {
                const isChildActive = activeItem === child.segment;
                
                return (
                  <Link
                    key={`${item.segment}-${child.segment}`}
                    to={child.href}
                    className={`group flex items-center text-sm font-medium rounded-md transition-all duration-200 px-1.5 py-1 ml-3 mr-0 ${
                      isChildActive
                        ? 'bg-white bg-opacity-10 dark:bg-gray-700 dark:bg-opacity-50 text-white dark:text-gray-200'
                        : 'text-neutral-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:bg-opacity-5 dark:hover:bg-opacity-50'
                    }`}
                    onClick={() => {
                      setActiveItem(child.segment);
                      if (isMobile) onClose();
                    }}
                  >
                    <span className="text-xs whitespace-nowrap">{child.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
          
          {/* Collapsed dropdown menu - appears outside the sidebar to the right */}
          {(collapsed && !isMobile) && collapsedHoveredItem === item.segment && menuPosition && (
            <div 
              className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl w-48 py-1 z-[9999]"
              style={{
                left: `${menuPosition.left}px`,
                top: `${menuPosition.top}px`,
              }}
              onMouseEnter={() => {
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                setCollapsedHoveredItem(item.segment);
              }}
            >
              {item.children.map((child: any) => {
                const isChildActive = activeItem === child.segment;
                return (
                  <Link
                    key={`collapsed-${item.segment}-${child.segment}`}
                    to={child.href}
                    className={`block px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md mx-1 ${
                      isChildActive
                        ? 'bg-[#14235f] dark:bg-gray-800 text-white dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    onClick={() => {
                      setActiveItem(child.segment);
                      setCollapsedActiveItem(item.segment); // Set parent as active in collapsed mode
                      setCollapsedHoveredItem(null);
                      if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        setHoverTimeout(null);
                      }
                      if (isMobile) onClose();
                    }}
                  >
                    {child.title}
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      );
    }
    
    // Handle disabled items differently
    if (isDisabled) {
      return (
        <div
          key={item.segment}
          className={`${getNavItemStyles(false, collapsed && !isMobile)} opacity-50 cursor-not-allowed`}
          title={collapsed && !isMobile ? `${item.title} (Coming Soon)` : undefined}
          onMouseEnter={() => {
            if (collapsed && !isMobile && collapsedHoveredItem) {
              setCollapsedHoveredItem(null);
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
            }
          }}
        >
          <div className="flex items-center">
            <IconComponent 
              className={`transition-all duration-150 ease-out ${
                collapsed && !isMobile 
                  ? 'w-5 h-5' 
                  : 'w-5 h-5 mr-3'
              } text-white dark:text-gray-400 text-opacity-50`}
            />
            {!collapsed && !isMobile && (
              <span className="font-medium truncate whitespace-nowrap">{item.title}</span>
            )}
          </div>
          {!collapsed && !isMobile && (
            <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
              Soon
            </span>
          )}
        </div>
      )
    }
    
    return (
      <Link
        key={item.segment}
        to={item.href}
        className={getNavItemStyles(isActive, collapsed && !isMobile)}
        onClick={() => {
          // Provide immediate visual feedback
          console.log('Clicked item:', item.segment, 'Current active:', activeItem)
          setActiveItem(item.segment)
          setCollapsedActiveItem(item.segment) // Also set for collapsed mode
          if (isMobile) onClose()
        }}
        onMouseEnter={() => {
          if (collapsed && !isMobile && collapsedHoveredItem) {
            setCollapsedHoveredItem(null);
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
          }
        }}
        title={collapsed && !isMobile ? item.title : undefined}
      >
        <div className="flex items-center">
          <IconComponent 
            className={`transition-all duration-150 ease-out ${
              collapsed && !isMobile 
                ? 'w-5 h-5' 
                : 'w-5 h-5 mr-3'
            } ${
              isActive 
                ? 'text-white dark:text-gray-200 scale-105 group-hover:text-white dark:group-hover:text-gray-200 drop-shadow-sm transform-gpu' 
                : 'text-white dark:text-gray-400 text-opacity-70 group-hover:scale-105 group-hover:text-white dark:group-hover:text-gray-200 transform-gpu'
            }`}
          />
          {!collapsed && !isMobile && (
            <span className="font-medium truncate whitespace-nowrap">{item.title}</span>
          )}
        </div>
        {isActive && (collapsed && !isMobile) && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white dark:bg-gray-300 rounded-l opacity-90 shadow-lg transition-all duration-150 ease-out transform-gpu"></div>
        )}
      </Link>
    )
  }

  const sidebarContent = (
    <div 
      className={`flex min-h-0 flex-1 flex-col bg-[#14235f] dark:bg-gray-800 shadow-lg transition-all duration-300 ease-out overflow-hidden relative ${
        collapsed && !isMobile ? 'items-center' : ''
      }`}
      onMouseLeave={() => {
        // Hide dropdown when leaving the sidebar container entirely
        if (collapsed && !isMobile && collapsedHoveredItem) {
          const timeout = setTimeout(() => {
            setCollapsedHoveredItem(null);
          }, 100);
          setHoverTimeout(timeout);
        }
      }}
    >
      {/* Branding */}
      <div 
        className={`flex h-14 items-center bg-[#14235f] dark:bg-gray-800 ${
          collapsed && !isMobile ? 'justify-center px-2' : 'px-4'
        }`}
        onMouseEnter={() => {
          if (collapsed && !isMobile && collapsedHoveredItem) {
            setCollapsedHoveredItem(null);
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
          }
        }}
      >
        {collapsed && !isMobile ? (
          /* Centered logo for collapsed state */
          <div className="flex items-center justify-center w-full">
            <Logo 
              variant="white" 
              size="sm"
              showText={false}
              className="-mt-2"
            />
          </div>
        ) : (
          /* Normal layout for expanded state */
          <>
            <div className="flex items-center justify-center w-full relative">
              <Logo 
                variant="white" 
                size="sm"
                showText={true}
                className="-mt-2"
              />
              
              {/* Mobile close button */}
              {isMobile && (
                <button
                  onClick={onClose}
                  className="ml-auto text-white dark:text-gray-200 hover:text-white dark:hover:text-gray-300 hover:text-opacity-70 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Full-width divider line - positioned to align with header border */}
      <div 
        className="w-full border-b border-gray-400 dark:border-gray-600 border-opacity-40" 
        style={{ marginTop: '-0.575rem' }}
      ></div>

      {/* Subtle right separator */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-400 dark:bg-gray-600 bg-opacity-40"></div>

      {/* Navigation */}
      <nav className={`flex-1 py-1 overflow-y-auto ${
        collapsed && !isMobile ? 'px-1 space-y-0.5' : 'px-2.5 space-y-0.5'
      }`}>
        {filteredNavigation.map((item, index) => renderNavigationItem(item, index))}
      </nav>

      {/* Toggle button at bottom of sidebar */}
      {!isMobile && (
        <div className={`${
          collapsed ? 'px-1 py-1' : 'px-2.5 py-2'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={_onToggleCollapse}
              className="text-white dark:text-gray-200 hover:text-white dark:hover:text-gray-300 hover:text-opacity-70 p-2 transition-colors rounded-lg border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar (overlay) */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
          onClick={onClose} 
        />
        <div 
          className={`fixed inset-y-0 left-0 flex w-56 flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar (fixed) */}
      <div className={`hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col transition-all duration-300 ease-out ${
        collapsed ? 'lg:w-12' : 'lg:w-52'
      }`}>
        {sidebarContent}
      </div>
    </>
  )
} 