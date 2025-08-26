import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { RightPanel } from '@/core/layouts/RightPanel';

interface FinanceLayoutProps {
  children?: React.ReactNode;
}

export const FinanceLayout: React.FC<FinanceLayoutProps> = ({ children }) => {
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const handleRightPanelToggle = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className={`flex-1 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out ${
        rightPanelCollapsed ? '' : 'lg:pr-12'
      }`}>
        {children || <Outlet />}
      </div>
      
      {/* Right Panel - Always present in finance app */}
      <RightPanel
        isCollapsed={rightPanelCollapsed}
        onToggle={handleRightPanelToggle}
      />
    </div>
  );
};