import React from 'react';
import { Plus } from 'lucide-react';

interface NewButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export const NewButton: React.FC<NewButtonProps> = ({ 
  onClick, 
  label = 'New',
  className = '',
  showIcon = true
}) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors ${className}`}
    >
      {showIcon && <span className="text-lg leading-none">+</span>}
      <span>{label}</span>
    </button>
  );
};