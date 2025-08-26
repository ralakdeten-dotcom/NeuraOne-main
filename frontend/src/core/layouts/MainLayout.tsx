import React from 'react'
import { PageLayout } from './PageLayout'

interface MainLayoutProps {
  children?: React.ReactNode
}

// Legacy MainLayout component - now uses the new PageLayout
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return <PageLayout>{children}</PageLayout>
}