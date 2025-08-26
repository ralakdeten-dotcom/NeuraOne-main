import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Settings, Search, Columns, Scissors, GripVertical, Eye, EyeOff, X, Lock, WrapText } from 'lucide-react';

// Custom Filter/Sort Icon Component
const FilterSortIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    viewBox="0 0 118 118" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M107.853 34.7266C107.853 45.4961 99.1222 54.2266 88.3527 54.2266C78.8272 54.2266 70.8969 47.3966 69.1918 38.3668C69.0801 38.3771 68.9669 38.3823 68.8525 38.3823H15.2275C13.2082 38.3823 11.5713 36.7454 11.5713 34.7261C11.5713 32.7068 13.2082 31.0698 15.2275 31.0698H68.8525C68.967 31.0698 69.0802 31.0751 69.192 31.0854C70.8974 22.056 78.8275 15.2266 88.3527 15.2266C99.1222 15.2266 107.853 23.957 107.853 34.7266ZM100.54 34.7266C100.54 41.4575 95.0836 46.9141 88.3527 46.9141C81.6217 46.9141 76.1652 41.4575 76.1652 34.7266C76.1652 27.9956 81.6217 22.5391 88.3527 22.5391C95.0836 22.5391 100.54 27.9956 100.54 34.7266Z" 
      fill="currentColor"
    />
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M68.6697 87.1333C67.3629 96.6339 59.2123 103.952 49.3525 103.952C39.4928 103.952 31.3422 96.6339 30.0354 87.1333H15.2275C13.2082 87.1333 11.5713 85.4963 11.5713 83.477C11.5713 81.4578 13.2082 79.8208 15.2275 79.8208H30.4057C32.4843 71.2867 40.1786 64.9516 49.3525 64.9516C58.5265 64.9516 66.2208 71.2867 68.2994 79.8208H102.978C104.997 79.8208 106.634 81.4578 106.634 83.477C106.634 85.4963 104.997 87.1333 102.978 87.1333H68.6697ZM61.54 84.4516C61.54 91.1825 56.0835 96.6391 49.3525 96.6391C42.6216 96.6391 37.165 91.1825 37.165 84.4516C37.165 77.7206 42.6216 72.2641 49.3525 72.2641C56.0835 72.2641 61.54 77.7206 61.54 84.4516Z" 
      fill="currentColor"
    />
  </svg>
);

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
  order?: number;
  locked?: boolean; // Prevents hiding this column
}

export interface TableRow {
  id: string | number;
  [key: string]: any;
}

interface DataTableProps {
  columns: TableColumn[];
  data: TableRow[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onRowSelect?: (selectedIds: (string | number)[]) => void;
  onRowAction?: (row: TableRow, action: string) => void;
  showCheckboxes?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
  className?: string;
  // Add controlled sorting props
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  // Column customization props
  onColumnsChange?: (columns: TableColumn[]) => void;
  enableColumnCustomization?: boolean;
  // Controlled selection props
  selectedRowIds?: (string | number)[];
  // Custom render functions
  customCheckboxRender?: (row: TableRow) => React.ReactNode | null;
  customActionsRender?: (row: TableRow) => React.ReactNode | null | undefined;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onSort,
  onRowSelect,
  onRowAction,
  showCheckboxes = true,
  showActions = true,
  emptyMessage = 'No data available',
  className = '',
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  onColumnsChange,
  enableColumnCustomization = true,
  selectedRowIds,
  customCheckboxRender,
  customActionsRender
}) => {
  // Set the first column as default sorted column
  const firstSortableColumn = columns.find(col => col.sortable)?.key || '';
  
  // Use external sort state if provided, otherwise use internal state
  const [internalSortColumn, setInternalSortColumn] = useState<string>(firstSortableColumn);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const sortColumn = externalSortColumn !== undefined ? externalSortColumn : internalSortColumn;
  const sortDirection = externalSortDirection !== undefined ? externalSortDirection : internalSortDirection;
  
  // Use external selection state if provided, otherwise use internal state
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());
  const selectedRowsSet = selectedRowIds !== undefined ? new Set(selectedRowIds) : internalSelectedRows;
  const setSelectedRows = selectedRowIds !== undefined ? 
    (newRows: Set<string | number>) => onRowSelect?.(Array.from(newRows)) :
    setInternalSelectedRows;
  
  const [selectAll, setSelectAll] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);
  
  // New state for column customization and dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [clipText, setClipText] = useState(true);
  const [workingColumns, setWorkingColumns] = useState<TableColumn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync selectAll state when external selectedRowIds change
  useEffect(() => {
    if (selectedRowIds !== undefined) {
      setSelectAll(selectedRowIds.length === data.length && data.length > 0);
    }
  }, [selectedRowIds, data.length]);

  // Trigger initial sort on mount only if not controlled
  useEffect(() => {
    if (firstSortableColumn && externalSortColumn === undefined && onSort) {
      onSort(firstSortableColumn, 'asc');
    }
  }, [firstSortableColumn, externalSortColumn]); // Removed onSort from dependencies

  const handleSort = (columnKey: string) => {
    console.log('DataTable handleSort called:', columnKey);
    console.log('Current sort state:', { sortColumn, sortDirection });
    console.log('External sort props:', { externalSortColumn, externalSortDirection });
    
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) {
      console.log('Column not sortable:', columnKey);
      return;
    }

    let newDirection: 'asc' | 'desc' = 'asc';
    
    // If clicking the same column, toggle direction
    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If clicking a different column, clear previous sort and start with 'asc'
      newDirection = 'asc';
    }

    console.log('New direction will be:', newDirection);

    // Update internal state if not controlled
    if (externalSortColumn === undefined) {
      console.log('Updating internal sort column:', columnKey);
      setInternalSortColumn(columnKey);
    }
    if (externalSortDirection === undefined) {
      console.log('Updating internal sort direction:', newDirection);
      setInternalSortDirection(newDirection);
    }
    
    console.log('Calling onSort:', columnKey, newDirection);
    onSort?.(columnKey, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(data.map(row => row.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (rowId: string | number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRowsSet);
    if (checked) {
      newSelectedRows.add(rowId);
    } else {
      newSelectedRows.delete(rowId);
    }
    
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === data.length);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-gray-400 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-500" />;
  };

  // Initialize columns with visibility
  useEffect(() => {
    console.log('Initializing columns:', columns);
    const initializedColumns = columns.map((col, index) => ({
      ...col,
      visible: col.locked ? true : (col.visible !== undefined ? col.visible : true),
      order: col.order !== undefined ? col.order : index
    }));
    console.log('Initialized columns:', initializedColumns);
    setWorkingColumns(initializedColumns);
  }, [columns]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowColumnModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get visible columns sorted by order
  const visibleColumns = workingColumns
    .filter(col => col.visible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter columns for search in modal
  const filteredColumns = workingColumns.filter(col =>
    col.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleColumnVisibility = (columnKey: string) => {
    console.log('Toggling visibility for column:', columnKey);
    const column = workingColumns.find(col => col.key === columnKey);
    
    // Prevent toggling locked columns
    if (column?.locked) {
      console.log('Cannot hide locked column:', columnKey);
      return;
    }
    
    console.log('Current working columns:', workingColumns);
    const updatedColumns = workingColumns.map(col =>
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    console.log('Updated columns:', updatedColumns);
    setWorkingColumns(updatedColumns);
  };

  const handleReorderColumns = (fromIndex: number, toIndex: number) => {
    console.log('Reordering columns from', fromIndex, 'to', toIndex);
    const newColumns = [...workingColumns];
    const draggedColumn = newColumns[fromIndex];
    
    // Remove the dragged column from its original position
    newColumns.splice(fromIndex, 1);
    // Insert it at the new position
    newColumns.splice(toIndex, 0, draggedColumn);
    
    // Update order values
    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index
    }));
    
    setWorkingColumns(updatedColumns);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    console.log('Drag start:', index);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleReorderColumns(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleSaveColumnChanges = () => {
    onColumnsChange?.(workingColumns);
    setShowColumnModal(false);
  };

  const handleCancelColumnChanges = () => {
    const resetColumns = columns.map((col, index) => ({
      ...col,
      visible: col.visible !== undefined ? col.visible : true,
      order: col.order !== undefined ? col.order : index
    }));
    setWorkingColumns(resetColumns);
    setShowColumnModal(false);
    setSearchTerm('');
  };

  return (
    <div className={`w-full ${className}`}>
      <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 border-collapse border-t border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {showCheckboxes && (
                <th className="px-4 py-3 text-center relative">
                  <div className="relative flex justify-center" ref={dropdownRef}>
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-600 transition-colors p-1"
                      title="Customisations"
                    >
                      <FilterSortIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showFilterDropdown && enableColumnCustomization && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              console.log('Opening column modal');
                              console.log('Working columns when opening modal:', workingColumns);
                              setShowColumnModal(true);
                              setShowFilterDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
                          >
                            <Columns className="w-4 h-4" />
                            Customise Columns
                          </button>
                          <button
                            onClick={() => {
                              const newClipState = !clipText;
                              console.log('Clip text clicked! Current:', clipText, 'New:', newClipState);
                              setClipText(newClipState);
                              setShowFilterDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            {clipText ? (
                              <>
                                <WrapText className="w-4 h-4" />
                                Wrap Text
                              </>
                            ) : (
                              <>
                                <Scissors className="w-4 h-4" />
                                Clip Text
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-max ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ width: column.width, whiteSpace: 'nowrap' }}
                >
                  {column.sortable ? (
                    <button
                      onClick={(e) => {
                        console.log('Button clicked for column:', column.key);
                        e.preventDefault();
                        e.stopPropagation();
                        handleSort(column.key);
                      }}
                      className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none uppercase whitespace-nowrap"
                    >
                      <span className="whitespace-nowrap">{column.label.toUpperCase()}</span>
                      {renderSortIcon(column.key)}
                    </button>
                  ) : (
                    <span className="uppercase whitespace-nowrap">{column.label.toUpperCase()}</span>
                  )}
                </th>
              ))}
              {showActions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Search className="w-4 h-4" />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              emptyMessage ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.length + (showCheckboxes ? 1 : 0) + (showActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : null
            ) : (
              data.map((row, index) => (
                <tr 
                  key={row.id} 
                  className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
                  onClick={() => {
                    const event = new CustomEvent('rowClick', { detail: row });
                    window.dispatchEvent(event);
                  }}
                >
                  {showCheckboxes && (
                    <td className={`px-4 py-4 ${row.is_active === false ? 'opacity-50' : ''}`} onClick={(e) => e.stopPropagation()}>
                      {customCheckboxRender && customCheckboxRender(row) ? (
                        customCheckboxRender(row)
                      ) : (
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedRowsSet.has(row.id)}
                            onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </div>
                      )}
                    </td>
                  )}
                  {visibleColumns.map((column, columnIndex) => {
                    // FIRST COLUMN IS COMPLETELY FIXED - NO CHANGES EVER
                    if (columnIndex === 0) {
                      return (
                        <td 
                          key={column.key} 
                          className={`px-4 py-4 text-sm text-gray-900 dark:text-gray-100 min-w-max ${
                            row.is_active === false ? 'opacity-50' : ''
                          }`}
                          style={{ textAlign: 'left', whiteSpace: 'nowrap' }}
                        >
                          <div style={{ textAlign: 'left', whiteSpace: 'nowrap', display: 'block', width: '100%' }}>
                            {column.render ? (
                              <div style={{ textAlign: 'left', width: '100%', whiteSpace: 'nowrap' }}>
                                {column.render(row[column.key], row)}
                              </div>
                            ) : (
                              <div style={{ textAlign: 'left', width: '100%', whiteSpace: 'nowrap' }}>
                                {row[column.key]}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }
                    
                    // OTHER COLUMNS CAN BE AFFECTED BY CLIP TEXT
                    return (
                      <td 
                        key={column.key} 
                        className={`px-4 py-4 text-sm text-gray-900 dark:text-gray-100 ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 'text-left'
                        } ${row.is_active === false ? 'opacity-50' : ''} ${
                          clipText ? 'min-w-max' : ''
                        }`}
                        style={clipText ? { whiteSpace: 'nowrap' } : {}}
                      >
                        <div 
                          className={(() => {
                            const alignmentClass = column.align === 'center' ? 'text-center' : 
                                                  column.align === 'right' ? 'text-right' : 'text-left';
                            const textClass = clipText ? 'whitespace-nowrap' : 'whitespace-normal';
                            return `${alignmentClass} ${textClass}`;
                          })()}
                          title={clipText ? (column.render ? '' : String(row[column.key] || '')) : ''}
                        >
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      </td>
                    );
                  })}
                  {showActions && (() => {
                    const customActionsResult = customActionsRender ? customActionsRender(row) : undefined;
                    
                    // If customActionsRender returns null, don't render the actions column for this row
                    if (customActionsResult === null) {
                      return (
                        <td className="px-4 py-4 text-left relative" onClick={(e) => e.stopPropagation()}>
                          {/* Empty cell for system accounts */}
                        </td>
                      );
                    }
                    
                    // If customActionsRender returns a component, render that
                    if (customActionsResult !== undefined) {
                      return (
                        <td className="px-4 py-4 text-left relative" onClick={(e) => e.stopPropagation()}>
                          {customActionsResult}
                        </td>
                      );
                    }
                    
                    // Default actions rendering
                    return (
                      <td className="px-4 py-4 text-left relative" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="relative"
                          onMouseEnter={() => setHoveredRow(row.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <button
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Actions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {hoveredRow === row.id && (
                            <div 
                              className="absolute right-0 top-full mt-0 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20"
                              onMouseEnter={() => setHoveredRow(row.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => {
                                    onRowAction?.(row, 'edit');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors font-medium"
                                >
                                  Edit
                                </button>
                                
                                {/* Show Mark as Active/Inactive based on current status */}
                                {row.is_active !== false ? (
                                  <button
                                    onClick={() => {
                                      onRowAction?.(row, 'mark_inactive');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors font-medium"
                                  >
                                    Mark as Inactive
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      onRowAction?.(row, 'mark_active');
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors font-medium"
                                  >
                                    Mark as Active
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    onRowAction?.(row, 'delete');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-500 hover:text-white rounded-md transition-colors font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })()}
                </tr>
              ))
            )}
          </tbody>
        </table>

      {/* Customise Columns Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex justify-center items-start pt-4 pb-4 px-4">
            <div 
              ref={modalRef}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mt-0"
              style={{ marginTop: '32px' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Customise Columns
                  </h3>
                </div>
                <div className="text-sm text-gray-500">
                  {visibleColumns.length} of {workingColumns.length} Selected
                </div>
                <button
                  onClick={handleCancelColumnChanges}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Box */}
              <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Column List */}
              <div className="px-6 py-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredColumns.map((column) => {
                    const actualIndex = workingColumns.findIndex(col => col.key === column.key);
                    return (
                      <div
                        key={column.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, actualIndex)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, actualIndex)}
                        className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-move ${
                          draggedIndex === actualIndex 
                            ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-600' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <button
                          onClick={() => handleToggleColumnVisibility(column.key)}
                          disabled={column.locked}
                          className={`flex items-center gap-2 ${
                            column.locked ? 'cursor-not-allowed' : ''
                          }`}
                        >
                          {column.locked ? (
                            <Lock className="w-4 h-4 text-gray-500" />
                          ) : column.visible ? (
                            <Eye className="w-4 h-4 text-blue-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm ${
                            column.locked 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : column.visible 
                                ? 'text-gray-900 dark:text-gray-100' 
                                : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {column.label}
                          </span>
                        </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleCancelColumnChanges}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveColumnChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};