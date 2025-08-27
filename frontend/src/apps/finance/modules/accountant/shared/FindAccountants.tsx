import React from 'react';
import { UserPlus } from 'lucide-react';

interface FindAccountantsProps {
  onClick?: () => void;
  className?: string;
}

export const FindAccountants: React.FC<FindAccountantsProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior - could open a modal, navigate, etc.
      console.log('Find Accountants clicked');
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors ${className}`}
    >
      <UserPlus className="w-4 h-4" />
      <span>Find Accountants</span>
    </button>
  );
};

export default FindAccountants;