import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Star, ChevronUp, ArrowUpDown, Download, Upload, ArrowUp, ArrowDown, Settings } from 'lucide-react';
import { NewButton, MoreActionsButton } from '@/finance-inventory-shared';

export interface MiniTableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface MiniTableRow {
  id: string | number;
  [key: string]: any;
}

interface MiniDataTableProps {
  columns: MiniTableColumn[];
  data: MiniTableRow[];
  onRowClick?: (row: MiniTableRow) => void;
  onRowAction?: (row: MiniTableRow, action: string) => void;
  emptyMessage?: string;
  className?: string;
  title?: string;
  showHeader?: boolean;
  showActions?: boolean;
  showNewButton?: boolean;
  onNewClick?: () => void;
  moreActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    submenu?: Array<{
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    }>;
  }>;
  // Filtering and view options
  viewOptions?: Array<{
    id: string;
    label: string;
    filter: string;
  }>;
  onViewChange?: (view: string, filter: string) => void;
  activeView?: string;
  // Search functionality  
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  // Selected row highlighting
  selectedRowId?: string | number;
}

export const MiniDataTable: React.FC<MiniDataTableProps> = ({
  columns,
  data,
  onRowClick,
  onRowAction,
  emptyMessage = 'No data available',
  className = '',
  title,
  showHeader = true,
  showActions = true,
  showNewButton = true,
  onNewClick,
  moreActions = [],
  viewOptions = [],
  onViewChange,
  activeView = 'All Items',
  searchTerm = '',
  onSearchChange,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  selectedRowId
}) => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [favoriteViews, setFavoriteViews] = useState<string[]>([]);
  const [showFavoritesSection, setShowFavoritesSection] = useState(true);
  const [showDefaultSection, setShowDefaultSection] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const handleRowClick = (row: MiniTableRow) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable || !onSort) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(columnKey, newDirection);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-gray-400 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
  };

  const toggleFavorite = (viewLabel: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setFavoriteViews(prev => {
      if (prev.includes(viewLabel)) {
        return prev.filter(fav => fav !== viewLabel);
      } else {
        return [...prev, viewLabel];
      }
    });
  };

  const favoriteOptions = viewOptions.filter(option => favoriteViews.includes(option.label));
  const defaultOptions = viewOptions;

  // Default more actions if not provided
  const defaultMoreActions = moreActions.length > 0 ? moreActions : [
    { 
      label: 'Sort by', 
      onClick: () => {},
      icon: <ArrowUpDown className="w-4 h-4" />,
      submenu: columns.filter(col => col.sortable).map(column => ({
        label: column.label,
        onClick: () => handleSort(column.key),
        icon: sortColumn === column.key 
          ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)
          : <ArrowUp className="w-4 h-4" />
      }))
    },
    { 
      label: 'Export', 
      onClick: () => {},
      icon: <Download className="w-4 h-4" />
    }
  ];

  return (
    <div className={`w-full bg-white dark:bg-gray-900 flex flex-col ${className}`}>
      {/* Header Section - Fixed */}
      {showHeader && (
        <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between min-h-[40px]">
              {/* Left side - Title with dropdown */}
              <div className="flex items-center gap-2 relative flex-1 min-w-0">
                {viewOptions.length > 0 ? (
                  <>
                    <button
                      onClick={() => setActiveDropdown(!activeDropdown)}
                      className="flex items-center gap-2 text-gray-900 dark:text-gray-100 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded-md transition-colors min-w-0 flex-1"
                    >
                      <h2 className="text-base font-semibold truncate text-gray-900 dark:text-gray-100">
                        {title || activeView}
                      </h2>
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {activeDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveDropdown(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                          <div className="py-1">
                            {/* Favorites Section */}
                            {favoriteOptions.length > 0 && (
                              <>
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700">
                                  <button
                                    onClick={() => setShowFavoritesSection(!showFavoritesSection)}
                                    className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider hover:text-gray-800 dark:hover:text-gray-100"
                                  >
                                    {showFavoritesSection ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronUp className="w-3 h-3" />
                                    )}
                                    FAVOURITES
                                  </button>
                                  <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                                    {favoriteOptions.length}
                                  </div>
                                </div>
                                {showFavoritesSection && favoriteOptions.map((option) => (
                                  <div key={`fav-${option.id}`} className="flex items-center">
                                    <button 
                                      onClick={() => {
                                        onViewChange?.(option.label, option.filter);
                                        setActiveDropdown(false);
                                      }}
                                      className={`flex-1 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                        activeView === option.label 
                                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                    <button
                                      onClick={(e) => toggleFavorite(option.label, e)}
                                      className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    </button>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Default Filters Section */}
                            <div className={`flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 ${
                              favoriteOptions.length > 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''
                            }`}>
                              <button
                                onClick={() => setShowDefaultSection(!showDefaultSection)}
                                className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider hover:text-gray-800 dark:hover:text-gray-100"
                              >
                                {showDefaultSection ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronUp className="w-3 h-3" />
                                )}
                                DEFAULT FILTERS
                              </button>
                              <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                                {defaultOptions.length}
                              </div>
                            </div>
                            {showDefaultSection && defaultOptions.map((option) => (
                              <div key={`def-${option.id}`} className="flex items-center">
                                <button 
                                  onClick={() => {
                                    onViewChange?.(option.label, option.filter);
                                    setActiveDropdown(false);
                                  }}
                                  className={`flex-1 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                    activeView === option.label 
                                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {option.label}
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(option.label, e)}
                                  className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Star className={`w-4 h-4 ${
                                    favoriteViews.includes(option.label)
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-400 hover:text-yellow-500'
                                  }`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {title || 'Items'}
                  </h2>
                )}
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* New button */}
                {showNewButton && (
                  <button
                    onClick={onNewClick}
                    className="flex items-center justify-center w-7 h-7 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors"
                    title="New"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                )}

                {/* More actions */}
                {showActions && (
                  <MoreActionsButton 
                    actions={defaultMoreActions}
                    className="p-1"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.map((row) => (
                <div
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleRowClick(row)}
                  className={`group px-4 py-3 cursor-pointer transition-colors ${
                    selectedRowId === row.id 
                      ? 'bg-gray-100 dark:bg-gray-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Content */}
                  <div className="w-full">
                    {columns.map((column) => (
                      <div key={column.key}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};