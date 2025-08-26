import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from '@/core/layouts/Sidebar';
import { Header } from '@/core/layouts/Header';
import { RightPanel } from '@/core/layouts/RightPanel';

export interface CreateFormModalpageProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
}

export const CreateFormModalpage: React.FC<CreateFormModalpageProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleRightPanelToggle = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
        isMobile={false}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content area */}
      <div className={`flex flex-col flex-1 w-full min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-12' : 'lg:ml-52'
      }`}>
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Page content with right panel layout */}
        <main className="flex flex-1 bg-gray-50 dark:bg-gray-900 w-full min-w-0 overflow-x-auto">
          {/* Form content area */}
          <div className={`flex-1 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
            rightPanelCollapsed ? '' : 'lg:pr-12'
          }`}>
            {/* Form Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-0 flex-shrink-0">
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 px-6 py-6">
              <form onSubmit={onSubmit}>
                <div className="space-y-6 pb-32">
                  {children}
                </div>
              </form>
            </div>

            {/* Footer - Sticky at bottom */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 flex-shrink-0 mt-auto">
              <div className="flex items-center justify-start gap-3 px-6 py-4">
                  <button
                    type="submit"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : submitLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                  >
                    {cancelLabel}
                  </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Finance sidebar */}
          <RightPanel
            isCollapsed={rightPanelCollapsed}
            onToggle={handleRightPanelToggle}
          />
        </main>
      </div>
    </div>
  );
};