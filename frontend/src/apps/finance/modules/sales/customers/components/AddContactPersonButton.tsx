import React from 'react';
import { Plus } from 'lucide-react';

interface AddContactPersonButtonProps {
  onClick: () => void;
  className?: string;
}

export const AddContactPersonButton: React.FC<AddContactPersonButtonProps> = ({ 
  onClick,
  className = ''
}) => {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors ${className}`}
    >
      <Plus className="w-4 h-4" />
      <span>Add Contact Person</span>
    </button>
  );
};