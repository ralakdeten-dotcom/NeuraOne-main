import React from 'react';
import { Settings } from 'lucide-react';

interface EmptyPlaceholderProps {
  title?: string;
}

export const EmptyPlaceholder: React.FC<EmptyPlaceholderProps> = ({ title }) => {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Professional Icon */}
        <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-8">
          <Settings className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Professional Message */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {title || 'Module'} Coming Soon
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
          We are currently developing this feature to enhance your experience.
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Please check back later for updates.
        </p>
      </div>
    </div>
  );
};