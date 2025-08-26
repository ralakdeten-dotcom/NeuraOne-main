import React from 'react';
import { X } from 'lucide-react';

export interface NewFormModalboxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  rightPanelContent?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  showErrorBanner?: boolean;
  errorMessage?: string;
  isLoadingContent?: boolean;
  loadingMessage?: string;
}

export const NewFormModalbox: React.FC<NewFormModalboxProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  rightPanelContent,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  showErrorBanner = false,
  errorMessage,
  isLoadingContent = false,
  loadingMessage = 'Loading...'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-inter">
      {/* Semi-transparent dark overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal Container - Positioned from top */}
      <div className="flex justify-center pt-12 pb-4 px-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          
          {/* Modal Header - Light grey background */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-100 rounded-t-lg">
            <h2 className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content - White background with padding */}
          <div className="p-6">
            {/* Show loading state */}
            {isLoadingContent ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">{loadingMessage}</div>
              </div>
            ) : (
              <div className={`grid ${rightPanelContent ? 'grid-cols-3' : 'grid-cols-1'} gap-8`}>
                {/* Left Column or Full Width - Form Fields */}
                <div className={rightPanelContent ? 'col-span-2' : 'col-span-1'}>
                  <form onSubmit={onSubmit} className="space-y-4">
                    
                    {/* Error display */}
                    {showErrorBanner && errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">
                          {errorMessage}
                        </p>
                      </div>
                    )}
                    
                    {/* Form Fields */}
                    {children}

                    {/* Action Buttons - Bottom left */}
                    <div className="flex justify-start gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? `${submitLabel.replace('Save', 'Saving').replace('Update', 'Updating').replace('Create', 'Creating')}...` : submitLabel}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelLabel}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Panel Content */}
                {rightPanelContent && (
                  <div className="relative">
                    {rightPanelContent}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};