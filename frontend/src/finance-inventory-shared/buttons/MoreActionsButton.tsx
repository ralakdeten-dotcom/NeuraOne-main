import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ArrowUpDown, Download, Upload, Settings, RefreshCw, RotateCcw, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

// Helper types for sortable columns
export interface SortableColumn {
  key: string;
  label: string;
}

export interface SortState {
  column?: string;
  direction?: 'asc' | 'desc';
}

// Helper function to create sort submenu items with direction indicators
export const createSortSubmenuItems = (
  columns: SortableColumn[],
  currentSort: SortState,
  onSort: (column: string, direction: 'asc' | 'desc') => void
) => {
  return columns.map(column => ({
    label: column.label,
    onClick: () => {
      const newDirection = currentSort.column === column.key && currentSort.direction === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newDirection);
    },
    icon: currentSort.column === column.key 
      ? (currentSort.direction === 'asc' 
          ? <ArrowUp className="w-4 h-4 stroke-2 text-gray-800 dark:text-white" /> 
          : <ArrowDown className="w-4 h-4 stroke-2 text-gray-800 dark:text-white" />
        )
      : null
  }));
};

interface MoreActionsButtonProps {
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: string | React.ReactNode;
    className?: string;
    hasChevron?: boolean;
    highlighted?: boolean;
    submenu?: Array<{
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    }>;
  }>;
  className?: string;
}

// Icon mapping
const getIconComponent = (iconName: string | React.ReactNode) => {
  if (typeof iconName === 'string') {
    switch (iconName) {
      case 'sort':
        return <ArrowUpDown className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      case 'refresh':
        return <RefreshCw className="w-4 h-4" />;
      case 'rotate':
        return <RotateCcw className="w-4 h-4" />;
      default:
        return null;
    }
  }
  return iconName;
};

export const MoreActionsButton: React.FC<MoreActionsButtonProps> = ({ 
  actions = [],
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleClick}
        className={`p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors ${className}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      
      {isOpen && actions.length > 0 && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
          <div className="py-1">
            {actions.map((action, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => action.submenu && setHoveredSubmenu(index)}
                onMouseLeave={() => setHoveredSubmenu(null)}
              >
                <button
                  onClick={() => {
                    if (!action.submenu) {
                      action.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white flex items-center justify-between group ${action.highlighted ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''} ${action.className || ''}`}
                >
                  <div className="flex items-center gap-2">
                    {action.icon && getIconComponent(action.icon)}
                    <span>{action.label}</span>
                  </div>
                  {action.hasChevron && <ChevronRight className="w-4 h-4" />}
                </button>
                
                {/* Submenu */}
                {action.submenu && hoveredSubmenu === index && (
                  <div className="absolute left-0 top-0 -translate-x-full w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-30">
                    <div className="py-1">
                      {action.submenu.map((submenuItem, submenuIndex) => (
                        <button
                          key={submenuIndex}
                          onClick={() => {
                            submenuItem.onClick();
                            setIsOpen(false);
                            setHoveredSubmenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white flex items-center justify-between"
                        >
                          <span>{submenuItem.label}</span>
                          {submenuItem.icon && <span className="ml-2">{submenuItem.icon}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};