import React, { useState } from 'react';
import { DataTable, type TableColumn, type TableRow } from '@/finance-inventory-shared';

const sampleColumns: TableColumn[] = [
  { key: 'name', label: 'Account Name', sortable: true, locked: true },
  { key: 'code', label: 'Account Code', sortable: true, locked: true },
  { key: 'type', label: 'Type', sortable: true, locked: true },
  { key: 'description', label: 'Description', sortable: false },
];

const sampleData: TableRow[] = [
  { 
    id: 1, 
    name: 'Cash in Hand - This is a super long account name that should definitely be clipped when clip text is enabled', 
    code: '1001', 
    type: 'Cash Account Type', 
    description: 'This is an extremely long description that should definitely be truncated when clip text is enabled and should wrap to multiple lines when clip text is disabled. It contains a lot of text to make sure the functionality is visible.' 
  },
  { 
    id: 2, 
    name: 'Bank Account - Another very long name to test clipping functionality', 
    code: '1002', 
    type: 'Bank', 
    description: 'Another exceptionally long description to thoroughly test the clip and wrap functionality. This text should be long enough to see the difference between clipped and wrapped states.' 
  },
  { 
    id: 3, 
    name: 'Accounts Receivable', 
    code: '1100', 
    type: 'Receivable', 
    description: 'Short description' 
  },
  { 
    id: 4, 
    name: 'Office Supplies and Equipment - A very long account name for testing purposes', 
    code: '2001', 
    type: 'Expense Category', 
    description: 'Office supplies, equipment, and materials for daily business operations and administrative tasks' 
  },
];

export const DataTableEnhancedTest: React.FC = () => {
  const [columns, setColumns] = useState<TableColumn[]>(sampleColumns);

  const handleColumnsChange = (updatedColumns: TableColumn[]) => {
    console.log('Columns changed:', updatedColumns);
    setColumns(updatedColumns);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Enhanced DataTable Test</h1>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Test Instructions:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Click the filter/sort button (first cell header) to see dropdown</li>
          <li>Try "Customise Columns" to show/hide columns</li>
          <li>Try "Clip Text" to toggle text wrapping</li>
          <li>Drag columns by the grip icon to reorder them</li>
        </ul>
      </div>
      
      <DataTable
        columns={columns}
        data={sampleData}
        enableColumnCustomization={true}
        onColumnsChange={handleColumnsChange}
        showCheckboxes={true}
        showActions={true}
      />
    </div>
  );
};

export default DataTableEnhancedTest;