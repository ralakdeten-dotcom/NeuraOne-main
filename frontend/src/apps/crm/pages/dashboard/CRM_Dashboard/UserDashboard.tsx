import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/core/auth/api'
import { useDealSummary, useDeals } from '@/apps/crm/deals/api'
import { useLeadSummary, useTodaysLeads } from '@/apps/crm/leads/api'
import { useAccountSummary } from '@/apps/crm/accounts/api'
import { useContactSummary } from '@/apps/crm/contacts/api'
import { Target, CheckCircle, MoreVertical, Plus, ArrowUpDown, Maximize2, X, ChevronLeft, ChevronRight, GripHorizontal, Edit, Trash2, TrendingUp, Users, Calendar, FileText, BarChart3, PieChart, Activity, Clock, Star, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { Funnel } from './Funnel'

// Closing Deals Component
interface ClosingDealsComponentProps {
  componentId: string
  wrapperClasses: string
  commonProps: any
  isReorderMode: boolean
  renderComponentMenu: (componentId: string) => React.ReactNode
}

// This will be moved inside the switch case, since we need access to the main component's state

export const UserDashboard: React.FC = () => {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [showAddComponentModal, setShowAddComponentModal] = useState(false)
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [componentName, setComponentName] = useState('')
  const [componentType, setComponentType] = useState('')
  const [isPermanent, setIsPermanent] = useState(true) // Default to permanent for all components
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Today's Leads state
  const [leadsHeight, setLeadsHeight] = useState(400) // Default min height
  const [isDragging, setIsDragging] = useState(false)
  const [currentLeadPage, setCurrentLeadPage] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showDetailBar, setShowDetailBar] = useState(false)
  const [detailBarHeight, setDetailBarHeight] = useState(200)
  const [isDetailDragging, setIsDetailDragging] = useState(false)
  const [detailDragStartY, setDetailDragStartY] = useState(0)
  const [detailDragStartHeight, setDetailDragStartHeight] = useState(0)
  const leadsPerPage = 5
  
  // Closing Deals state - Same pattern as Today's Leads
  const [dealsHeight, setDealsHeight] = useState(400) // Default min height
  const [isDealsResizing, setIsDealsResizing] = useState(false)
  const [currentDealPage, setCurrentDealPage] = useState(0)
  const [dealDragStartY, setDealDragStartY] = useState(0)
  const [dealDragStartHeight, setDealDragStartHeight] = useState(0)
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [showDealDetailBar, setShowDealDetailBar] = useState(false)
  const [dealDetailBarHeight, setDealDetailBarHeight] = useState(200)
  const [isDealDetailDragging, setIsDealDetailDragging] = useState(false)
  const [dealDetailDragStartY, setDealDetailDragStartY] = useState(0)
  const [dealDetailDragStartHeight, setDealDetailDragStartHeight] = useState(0)
  const dealsPerPage = 5
  
  // Fullscreen instruction tooltip state
  const [showFullscreenTip, setShowFullscreenTip] = useState(false)
  
  // Component order state and custom components
  const [componentOrder, setComponentOrder] = useState<string[]>([])
  const [customComponents, setCustomComponents] = useState<Record<string, { name: string, type: string, isPermanent?: boolean }>>({})
  const [deletedComponents, setDeletedComponents] = useState<Record<string, { name: string, type: string, originalPosition: number }>>({})
  const [componentMenus, setComponentMenus] = useState<Record<string, boolean>>({})
  const menuRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({})

  // Permanent components that cannot be deleted and persist after refresh 
  // Now only custom permanent components are truly permanent - all built-in components are deletable
  const PERMANENT_COMPONENTS: string[] = [] // No built-in permanent components anymore
  // All built-in components (funnel, leads, tasks, wishlist, reports, activities, charts) can now be deleted
  const isPermanentComponent = (componentId: string) => {
    return PERMANENT_COMPONENTS.includes(componentId) || 
           (componentId.startsWith('permanent-') && customComponents[componentId]?.isPermanent)
  }

  // Get component name helper function
  const getComponentName = (componentId: string) => {
    if ((componentId.startsWith('custom-') || componentId.startsWith('permanent-')) && customComponents[componentId]) {
      return customComponents[componentId].name
    }
    
    switch (componentId) {
      case 'funnel': return 'Sales Funnel'
      case 'leads': return "Today's Leads"
      case 'tasks': return 'Open Tasks'
      case 'reports': return 'Performance Reports'
      case 'activities': return 'Recent Activities'
      case 'charts': return 'Sales Charts'
      case 'closing-deals': return 'Closing Deals'
      default: return 'Component'
    }
  }

  // Available components library (like other CRM software)
  // All built-in components are now deletable and restorable
  const AVAILABLE_COMPONENTS = [
    {
      id: 'funnel',
      name: 'Sales Funnel',
      description: 'Visual pipeline with stage-wise deal progression',
      icon: <TrendingUp className="h-6 w-6" />,
      category: 'Sales',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'leads',
      name: "Today's Leads",
      description: 'Real-time lead tracking with interactive sidebar',
      icon: <Users className="h-6 w-6" />,
      category: 'Lead Management',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'tasks',
      name: 'Open Tasks',
      description: 'Task management and productivity tracking',
      icon: <CheckCircle className="h-6 w-6" />,
      category: 'Productivity',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'reports',
      name: 'Performance Reports',
      description: 'Sales metrics and performance analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      category: 'Analytics',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'activities',
      name: 'Recent Activities',
      description: 'Timeline of recent CRM activities',
      icon: <Activity className="h-6 w-6" />,
      category: 'Activity',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'charts',
      name: 'Sales Charts',
      description: 'Visual charts and graphs for sales data',
      icon: <PieChart className="h-6 w-6" />,
      category: 'Analytics',
      isPermanent: false,
      isBuiltIn: true
    },
    {
      id: 'closing-deals',
      name: 'Closing Deals',
      description: 'Deals that are close to closing (not closed yet)',
      icon: <Target className="h-6 w-6" />,
      category: 'Sales',
      isPermanent: false,
      isBuiltIn: true
    }
  ]

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: authApi.getUserDashboard,
    refetchInterval: 30000,
  })

  const { data: dealSummary } = useDealSummary()
  const { data: leadSummary } = useLeadSummary()
  const { data: accountSummary } = useAccountSummary()
  const { data: contactSummary } = useContactSummary()
  const { data: todaysLeads, isLoading: isLoadingTodaysLeads, error: todaysLeadsError } = useTodaysLeads()
  
  // Fetch deals data for closing deals component
  const { data: dealsData, isLoading: dealsLoading, error: dealsError } = useDeals(1, 50)
  
  // Filter deals that are in closing stages (not closed)
  const closingDeals = dealsData?.results?.filter(deal => {
    const stage = deal.stage?.toLowerCase() || ''
    return stage.includes('negotiation') || 
           stage.includes('proposal') || 
           stage.includes('closing') ||
           (stage.includes('close') && !stage.includes('closed') && !stage.includes('won') && !stage.includes('lost'))
  }) || []

  // Deals pagination variables - Same pattern as leads
  const totalClosingDeals = closingDeals.length
  const totalDealPages = Math.ceil(totalClosingDeals / dealsPerPage)
  const currentDeals = closingDeals.slice(
    currentDealPage * dealsPerPage,
    (currentDealPage + 1) * dealsPerPage
  )

  // Helper functions for deals
  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Clean up resize listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleLeadsResize)
      document.removeEventListener('mouseup', handleLeadsResizeEnd)
      document.removeEventListener('mousemove', handleDetailResize)
      document.removeEventListener('mouseup', handleDetailResizeEnd)
      document.removeEventListener('mousemove', handleDealsResize)
      document.removeEventListener('mouseup', handleDealsResizeEnd)
      document.removeEventListener('mousemove', handleDealDetailResize)
      document.removeEventListener('mouseup', handleDealDetailResizeEnd)
    }
  }, [])

  // Leads component resize handlers
  const handleLeadsResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartY(e.clientY)
    setDragStartHeight(leadsHeight)
    document.addEventListener('mousemove', handleLeadsResize)
    document.addEventListener('mouseup', handleLeadsResizeEnd)
    e.preventDefault()
  }

  const handleLeadsResize = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaY = e.clientY - dragStartY
    const newHeight = Math.max(400, Math.min(800, dragStartHeight + deltaY))
    setLeadsHeight(newHeight)
  }

  const handleLeadsResizeEnd = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleLeadsResize)
    document.removeEventListener('mouseup', handleLeadsResizeEnd)
  }

  // Leads pagination handlers
  const totalLeads = todaysLeads?.results?.length || 0
  const totalPages = Math.ceil(totalLeads / leadsPerPage)
  const currentLeads = todaysLeads?.results?.slice(
    currentLeadPage * leadsPerPage,
    (currentLeadPage + 1) * leadsPerPage
  ) || []

  const handlePrevLeads = () => {
    setCurrentLeadPage(prev => Math.max(0, prev - 1))
  }

  const handleNextLeads = () => {
    setCurrentLeadPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  // Lead selection and detail handlers
  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead)
    setShowDetailBar(true)
  }

  const handleCloseDetailBar = () => {
    setShowDetailBar(false)
    setSelectedLead(null)
  }

  // Deals pagination handlers - Same pattern as leads
  const handlePrevDeals = () => {
    setCurrentDealPage(prev => Math.max(0, prev - 1))
  }

  const handleNextDeals = () => {
    const totalDealPages = Math.ceil((closingDeals?.length || 0) / dealsPerPage)
    setCurrentDealPage(prev => Math.min(totalDealPages - 1, prev + 1))
  }

  // Detail bar resize handlers
  const handleDetailResizeStart = (e: React.MouseEvent) => {
    setIsDetailDragging(true)
    setDetailDragStartY(e.clientY)
    setDetailDragStartHeight(detailBarHeight)
    document.addEventListener('mousemove', handleDetailResize)
    document.addEventListener('mouseup', handleDetailResizeEnd)
    e.preventDefault()
  }

  const handleDetailResize = (e: MouseEvent) => {
    if (!isDetailDragging) return
    const deltaY = detailDragStartY - e.clientY // Inverted for bottom bar
    const newHeight = Math.max(150, Math.min(400, detailDragStartHeight + deltaY))
    setDetailBarHeight(newHeight)
  }

  const handleDetailResizeEnd = () => {
    setIsDetailDragging(false)
    document.removeEventListener('mousemove', handleDetailResize)
    document.removeEventListener('mouseup', handleDetailResizeEnd)
  }

  // Deals component resize handlers - Same pattern as leads
  const handleDealsResizeStart = (e: React.MouseEvent) => {
    setIsDealsResizing(true)
    setDealDragStartY(e.clientY)
    setDealDragStartHeight(dealsHeight)
    document.addEventListener('mousemove', handleDealsResize)
    document.addEventListener('mouseup', handleDealsResizeEnd)
    e.preventDefault()
  }

  const handleDealsResize = (e: MouseEvent) => {
    if (!isDealsResizing) return
    const deltaY = e.clientY - dealDragStartY
    const newHeight = Math.max(400, Math.min(800, dealDragStartHeight + deltaY))
    setDealsHeight(newHeight)
  }

  const handleDealsResizeEnd = () => {
    setIsDealsResizing(false)
    document.removeEventListener('mousemove', handleDealsResize)
    document.removeEventListener('mouseup', handleDealsResizeEnd)
  }

  // Deal selection and detail handlers
  const handleSelectDeal = (deal: any) => {
    setSelectedDeal(deal)
    setShowDealDetailBar(true)
  }

  const handleCloseDealDetailBar = () => {
    setShowDealDetailBar(false)
    setSelectedDeal(null)
  }

  // Deal detail bar resize handlers
  const handleDealDetailResizeStart = (e: React.MouseEvent) => {
    setIsDealDetailDragging(true)
    setDealDetailDragStartY(e.clientY)
    setDealDetailDragStartHeight(dealDetailBarHeight)
    document.addEventListener('mousemove', handleDealDetailResize)
    document.addEventListener('mouseup', handleDealDetailResizeEnd)
    e.preventDefault()
  }

  const handleDealDetailResize = (e: MouseEvent) => {
    if (!isDealDetailDragging) return
    const deltaY = dealDetailDragStartY - e.clientY // Inverted for bottom bar
    const newHeight = Math.max(150, Math.min(400, dealDetailDragStartHeight + deltaY))
    setDealDetailBarHeight(newHeight)
  }

  const handleDealDetailResizeEnd = () => {
    setIsDealDetailDragging(false)
    document.removeEventListener('mousemove', handleDealDetailResize)
    document.removeEventListener('mouseup', handleDealDetailResizeEnd)
  }

  // Load saved components and order from localStorage on mount
  useEffect(() => {
    console.log('Loading dashboard data from localStorage...')
    try {
      const savedOrder = localStorage.getItem('dashboard-component-order')
      const savedCustomComponents = localStorage.getItem('dashboard-custom-components')
      
      console.log('Saved order from localStorage:', savedOrder)
      console.log('Saved custom components from localStorage:', savedCustomComponents)
      
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder)
        console.log('Setting component order to:', parsedOrder)
        
        // Remove calendar and wishlist components if they exist
        const filteredOrder = parsedOrder.filter((comp: string) => comp !== 'calendar' && comp !== 'wishlist')
        
        // Since all components are now deletable, we don't auto-add any missing components
        // Users can add components they want from the Component Library
        
        setComponentOrder(filteredOrder)
        // Save updated order immediately (without calendar)
        localStorage.setItem('dashboard-component-order', JSON.stringify(filteredOrder))
      } else {
        // Default order if nothing saved - start with core components
        console.log('No saved order, using defaults')
        const defaultOrder = ['funnel', 'leads', 'tasks'] // Core components without wishlist
        setComponentOrder(defaultOrder)
        // Save default order immediately
        localStorage.setItem('dashboard-component-order', JSON.stringify(defaultOrder))
      }
      
      if (savedCustomComponents) {
        const parsedComponents = JSON.parse(savedCustomComponents)
        console.log('Setting custom components to:', parsedComponents)
        setCustomComponents(parsedComponents)
      } else {
        console.log('No saved custom components')
        // Save empty object immediately
        localStorage.setItem('dashboard-custom-components', JSON.stringify({}))
      }

      // Clean up any calendar and wishlist components from localStorage
      const cleanupRemovedComponents = () => {
        const order = localStorage.getItem('dashboard-component-order')
        if (order) {
          const parsedOrder = JSON.parse(order)
          const filteredOrder = parsedOrder.filter((comp: string) => comp !== 'calendar' && comp !== 'wishlist')
          if (filteredOrder.length !== parsedOrder.length) {
            localStorage.setItem('dashboard-component-order', JSON.stringify(filteredOrder))
            console.log('Removed calendar and wishlist components from localStorage')
          }
        }
      }
      cleanupRemovedComponents()
    } catch (error) {
      console.error('Error loading dashboard components from localStorage:', error)
      // Fallback to default order with core components
      const defaultOrder = ['funnel', 'leads', 'tasks']
      setComponentOrder(defaultOrder)
      setCustomComponents({})
    }
  }, [])

  // Save component order to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (componentOrder.length > 0) {
      console.log('Saving component order to localStorage:', componentOrder)
      try {
        localStorage.setItem('dashboard-component-order', JSON.stringify(componentOrder))
        console.log('Component order saved successfully')
      } catch (error) {
        console.error('Error saving component order to localStorage:', error)
      }
    }
  }, [componentOrder])

  // Save custom components to localStorage whenever they change
  useEffect(() => {
    console.log('Saving custom components to localStorage:', customComponents)
    try {
      localStorage.setItem('dashboard-custom-components', JSON.stringify(customComponents))
      console.log('Custom components saved successfully')
    } catch (error) {
      console.error('Error saving custom components to localStorage:', error)
    }
  }, [customComponents])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      
      // Close component menus when clicking outside
      Object.entries(menuRefs.current).forEach(([componentId, ref]) => {
        if (ref?.current && !ref.current.contains(event.target as Node)) {
          setComponentMenus(prev => ({ ...prev, [componentId]: false }))
        }
      })
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle fullscreen change events (ESC key, browser controls, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullScreen(isCurrentlyFullscreen)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle F11 key for fullscreen toggle
      if (event.key === 'F11') {
        event.preventDefault()
        handleFullScreen()
      }
      // Handle ESC key when in fullscreen - show confirmation
      else if (event.key === 'Escape' && isFullScreen) {
        event.preventDefault()
        const confirmExit = window.confirm(
          '🖥️ Exit Full Screen Mode?\n\n' +
          'Press ESC again or click "OK" to exit fullscreen.\n\n' +
          '💡 Other options:\n' +
          '• F11 to toggle fullscreen\n' +
          '• Click Exit button in top-right corner\n' +
          '• Use browser controls'
        )
        if (confirmExit) {
          handleFullScreen()
        }
      }
    }

    // Listen for fullscreen changes and keyboard events
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullScreen])

  // Show fullscreen tip when entering fullscreen mode
  useEffect(() => {
    if (isFullScreen) {
      setShowFullscreenTip(true)
      const timer = setTimeout(() => {
        setShowFullscreenTip(false)
      }, 5000) // Hide after 5 seconds
      
      return () => clearTimeout(timer)
    } else {
      setShowFullscreenTip(false)
    }
  }, [isFullScreen])

  // Handle fullscreen toggle using browser's Fullscreen API
  const handleFullScreen = async () => {
    try {
      if (!isFullScreen) {
        // Enter fullscreen mode
        const element = document.documentElement
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen()
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen()
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen()
        }
        setIsFullScreen(true)
      } else {
        // Exit fullscreen mode directly without confirmation
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
        setIsFullScreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      // Fallback to window-based fullscreen
      setIsFullScreen(!isFullScreen)
    }
    setShowMenu(false)
  }

  // Handle reorder mode toggle
  const handleReorder = () => {
    setIsReorderMode(!isReorderMode)
    setShowMenu(false)
  }

  // Handle add component modal
  const handleAddComponent = () => {
    setShowAddComponentModal(true)
    setComponentName('')
    setComponentType('')
    setShowMenu(false)
  }

  // Handle adding component from library
  const handleAddFromLibrary = (componentData: any) => {
    if (componentOrder.includes(componentData.id)) {
      alert(`${componentData.name} is already on your dashboard!`)
      return
    }

    // For all built-in components, just add the component ID directly
    if (componentData.isBuiltIn) {
      setComponentOrder(prev => [...prev, componentData.id])
    } else {
      // Create placeholder component only for truly custom components (not from library)
      const timestamp = Date.now()
      const componentId = componentData.isPermanent ? `permanent-${timestamp}` : `custom-${timestamp}`
      
      const newComponent = {
        name: componentData.name,
        type: componentData.description,
        isPermanent: componentData.isPermanent
      }
      
      setCustomComponents(prev => ({
        ...prev,
        [componentId]: newComponent
      }))
      
      setComponentOrder(prev => [...prev, componentId])
    }
    
    setShowComponentLibrary(false)
  }

  // Create new custom component
  const createCustomComponent = () => {
    if (!componentName.trim() || !componentType.trim()) {
      alert('Please enter both component name and type')
      return
    }

    // Generate component ID based on permanent status
    const timestamp = Date.now()
    const componentId = isPermanent ? `permanent-${timestamp}` : `custom-${timestamp}`
    const newComponent = { 
      name: componentName.trim(), 
      type: componentType.trim(),
      isPermanent: isPermanent
    }
    
    console.log('Creating new component:', { componentId, newComponent, isPermanent })
    
    // Add to custom components - this will automatically save to localStorage via useEffect
    setCustomComponents(prev => {
      const updated = {
        ...prev,
        [componentId]: newComponent
      }
      console.log('Updated custom components:', updated)
      return updated
    })

    // Add to component order - this will automatically save to localStorage via useEffect
    setComponentOrder(prev => {
      const updated = [...prev, componentId]
      console.log('Updated component order:', updated)
      return updated
    })

    // Close modal and reset form
    setShowAddComponentModal(false)
    setComponentName('')
    setComponentType('')
    setIsPermanent(true) // Reset to default permanent
    
    // Double-check localStorage immediately after state updates
    setTimeout(() => {
      console.log('Checking localStorage after component creation:')
      console.log('Order in localStorage:', localStorage.getItem('dashboard-component-order'))
      console.log('Components in localStorage:', localStorage.getItem('dashboard-custom-components'))
    }, 100)
  }

  // Delete custom component (only non-permanent custom components)
  const deleteCustomComponent = (componentId: string) => {
    if (!componentId.startsWith('custom-') && !componentId.startsWith('permanent-')) return
    
    // Check if component is permanent
    if (isPermanentComponent(componentId)) {
      console.log(`Cannot delete permanent component: ${componentId}`)
      return
    }
    
    // Remove from custom components
    setCustomComponents(prev => {
      const newComponents = { ...prev }
      delete newComponents[componentId]
      return newComponents
    })

    // Remove from component order
    setComponentOrder(prev => prev.filter(id => id !== componentId))
  }

  // Handle component deletion (hide from dashboard)
  const handleDeleteComponent = (componentId: string) => {
    const currentPosition = componentOrder.indexOf(componentId)
    if (currentPosition === -1) return
    
    const componentName = getComponentName(componentId)
    
    // Get component type for recovery
    let componentType = ''
    if ((componentId.startsWith('custom-') || componentId.startsWith('permanent-')) && customComponents[componentId]) {
      componentType = customComponents[componentId].type
    } else {
      // Built-in components
      switch (componentId) {
        case 'funnel': componentType = 'sales-tracking'; break
        case 'leads': componentType = 'lead-management'; break
        case 'tasks': componentType = 'task-management'; break
        case 'reports': componentType = 'analytics'; break
        case 'activities': componentType = 'activity'; break
        case 'charts': componentType = 'analytics'; break
        case 'closing-deals': componentType = 'sales-pipeline'; break
      }
    }
    
    // Move to deleted components with original position
    setDeletedComponents(prev => ({
      ...prev,
      [componentId]: { name: componentName, type: componentType, originalPosition: currentPosition }
    }))
    
    // Remove from component order immediately
    setComponentOrder(prev => prev.filter(id => id !== componentId))
    
    // Close the component menu
    setComponentMenus(prev => ({ ...prev, [componentId]: false }))
  }

  // Handle component recovery (restore to dashboard)
  const handleRecoverComponent = (componentId: string) => {
    if (!deletedComponents[componentId]) return
    
    const { originalPosition } = deletedComponents[componentId]
    
    // Insert back at original position (or at end if position is out of bounds)
    setComponentOrder(prev => {
      const newOrder = [...prev]
      const insertAt = Math.min(originalPosition, newOrder.length)
      newOrder.splice(insertAt, 0, componentId)
      return newOrder
    })
    
    // Remove from deleted components
    setDeletedComponents(prev => {
      const newDeleted = { ...prev }
      delete newDeleted[componentId]
      return newDeleted
    })
  }

  // Toggle component menu
  const toggleComponentMenu = (componentId: string) => {
    setComponentMenus(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }))
  }

  // Handle component edit
  const handleEditComponent = (componentId: string) => {
    console.log('Edit component:', componentId)
    
    // Close the menu
    setComponentMenus(prev => ({ ...prev, [componentId]: false }))
    
    // For built-in components, show info modal instead of edit
    if (!componentId.startsWith('custom-') && !componentId.startsWith('permanent-')) {
      alert(
        `📋 "${getComponentName(componentId)}" Component\n\n` +
        `This is a built-in component with pre-configured functionality.\n\n` +
        `Available actions:\n` +
        `• Move component using reorder mode\n` +
        `• Delete component (if not permanent)\n` +
        `• View component data and interact with features\n\n` +
        `To create custom components, use the "+ Components" button and select "Create Custom Component".`
      )
      return
    }
    
    // For custom components, open edit modal
    if (customComponents[componentId]) {
      setEditingComponentId(componentId)
      setComponentName(customComponents[componentId].name)
      setComponentType(customComponents[componentId].type)
      setIsPermanent(customComponents[componentId].isPermanent || false)
      setShowEditModal(true)
    }
  }

  // Save edited component
  const saveEditedComponent = () => {
    if (!editingComponentId || !componentName.trim() || !componentType.trim()) {
      alert('Please enter both component name and type')
      return
    }

    const updatedComponent = {
      name: componentName.trim(),
      type: componentType.trim(),
      isPermanent: isPermanent
    }

    console.log('Updating component:', { editingComponentId, updatedComponent })

    // Update custom components
    setCustomComponents(prev => ({
      ...prev,
      [editingComponentId]: updatedComponent
    }))

    // Close modal and reset form
    setShowEditModal(false)
    setEditingComponentId(null)
    setComponentName('')
    setComponentType('')
    setIsPermanent(true)

    // Show success message
    setTimeout(() => {
      alert(`✅ "${updatedComponent.name}" has been updated successfully!`)
    }, 100)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, componentId: string) => {
    setDraggedItem(componentId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', componentId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (componentId: string) => {
    setDragOverItem(componentId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const newOrder = [...componentOrder]
    const draggedIndex = newOrder.indexOf(draggedItem)
    const targetIndex = newOrder.indexOf(targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item
      newOrder.splice(draggedIndex, 1)
      // Insert at new position
      newOrder.splice(targetIndex, 0, draggedItem)
      
      // Update state - this will automatically save to localStorage via useEffect
      setComponentOrder(newOrder)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Render component dot menu
  const renderComponentMenu = (componentId: string) => {
    // Don't show menu in reorder mode
    if (isReorderMode) return null
    
    // Create ref for this component if it doesn't exist
    if (!menuRefs.current[componentId]) {
      menuRefs.current[componentId] = React.createRef<HTMLDivElement>()
    }
    
    return (
      <div className="absolute top-2 right-2 z-10" ref={menuRefs.current[componentId]}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleComponentMenu(componentId)
          }}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-70 hover:opacity-100"
          aria-label="Component options"
        >
          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        
        {componentMenus[componentId] && (
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditComponent(componentId)
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </button>
            
            {/* Delete button - delete immediately without confirmation */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteComponent(componentId)
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  // Render component based on type
  const renderComponent = (componentId: string) => {
    const isDragged = draggedItem === componentId
    const isDraggedOver = dragOverItem === componentId
    
    const wrapperClasses = `
      ${isReorderMode ? 'border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-2 cursor-move' : ''}
      ${isDragged ? 'opacity-50' : ''}
      ${isDraggedOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
      transition-all duration-200
    `

    const commonProps = isReorderMode ? {
      draggable: true,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, componentId),
      onDragOver: handleDragOver,
      onDragEnter: () => handleDragEnter(componentId),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent) => handleDrop(e, componentId),
      onDragEnd: handleDragEnd
    } : {}

    switch (componentId) {
      case 'funnel':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Sales Funnel</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="relative">
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              <Funnel />
            </div>
          </div>
        )

      case 'leads':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Today's Leads</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative z-0" style={{ minHeight: `${leadsHeight}px` }}>
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Today's Leads
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {isLoadingTodaysLeads && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                    {todaysLeads && (
                      <span>{todaysLeads.results?.length || 0} leads today</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area with Sidebar */}
              <div className="flex h-full">
                {/* Main Lead List */}
                <div className="flex-1 p-6 pr-3" style={{ height: showDetailBar ? `${leadsHeight - detailBarHeight - 100}px` : `${leadsHeight - 100}px` }}>
                  {/* Error State */}
                  {todaysLeadsError && (
                    <div className="text-center py-8">
                      <div className="text-red-500 dark:text-red-400 mb-2">
                        Failed to load today's leads
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoadingTodaysLeads && (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading today's leads...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingTodaysLeads && !todaysLeadsError && (!todaysLeads?.results || todaysLeads.results.length === 0) && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-6 bg-gray-200 dark:bg-gray-600 rounded border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center">
                          <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-500 rounded"></div>
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No leads created today.</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New leads will appear here automatically.</p>
                    </div>
                  )}

                  {/* Leads List */}
                  {!isLoadingTodaysLeads && !todaysLeadsError && todaysLeads?.results && todaysLeads.results.length > 0 && (
                    <div className="space-y-2 overflow-y-auto h-full">
                      {currentLeads.map((lead) => (
                        <div
                          key={lead.lead_id}
                          onClick={() => handleSelectLead(lead)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedLead?.lead_id === lead.lead_id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {lead.full_name || `${lead.first_name} ${lead.last_name}`}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {lead.company_name || 'No Company'} {lead.title && `• ${lead.title}`}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="inline-flex px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {lead.lead_status || 'New'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar for Remaining Leads */}
                {!isLoadingTodaysLeads && totalLeads > leadsPerPage && (
                  <div className="w-16 bg-gray-50 dark:bg-gray-700/30 border-l border-gray-200 dark:border-gray-700 p-2">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                        {totalPages > 1 && (
                          <div className="mb-2">
                            <span>{currentLeadPage + 1}/{totalPages}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Navigation Buttons */}
                      <button
                        onClick={handlePrevLeads}
                        disabled={currentLeadPage === 0}
                        className="p-2 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      
                      <div className="flex flex-col items-center space-y-1 my-2">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const pageIndex = Math.max(0, currentLeadPage - 2) + i
                          if (pageIndex >= totalPages) return null
                          return (
                            <button
                              key={pageIndex}
                              onClick={() => setCurrentLeadPage(pageIndex)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                pageIndex === currentLeadPage
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-400'
                              }`}
                            />
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={handleNextLeads}
                        disabled={currentLeadPage >= totalPages - 1}
                        className="p-2 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                        {totalLeads - (currentLeadPage + 1) * leadsPerPage > 0 && (
                          <span>+{totalLeads - (currentLeadPage + 1) * leadsPerPage}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Detail Bar */}
              {showDetailBar && selectedLead && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10"
                  style={{ height: `${detailBarHeight}px` }}
                >
                  {/* Detail Bar Header with Resize Handle */}
                  <div 
                    className={`h-8 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-ns-resize flex items-center justify-between px-4 ${
                      isDetailDragging ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onMouseDown={handleDetailResizeStart}
                  >
                    <div className="flex items-center space-x-2">
                      <GripHorizontal className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lead Details
                      </span>
                    </div>
                    <button
                      onClick={handleCloseDetailBar}
                      className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>

                  {/* Detail Content */}
                  <div className="p-4 overflow-y-auto" style={{ height: `${detailBarHeight - 32}px` }}>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                            {selectedLead.full_name || `${selectedLead.first_name} ${selectedLead.last_name}`}
                          </h4>
                          {selectedLead.title && (
                            <p className="text-gray-600 dark:text-gray-400">{selectedLead.title}</p>
                          )}
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Contact Information</h5>
                          <div className="space-y-1 text-sm">
                            {selectedLead.email && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                <span className="text-blue-600 dark:text-blue-400">{selectedLead.email}</span>
                              </div>
                            )}
                            {selectedLead.phone && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                <span>{selectedLead.phone}</span>
                              </div>
                            )}
                            {selectedLead.website && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Website:</span>
                                <span className="text-blue-600 dark:text-blue-400">{selectedLead.website}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Company Details</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 dark:text-gray-400">Company:</span>
                              <span>{selectedLead.company_name || 'Not specified'}</span>
                            </div>
                            {selectedLead.industry && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Industry:</span>
                                <span>{selectedLead.industry}</span>
                              </div>
                            )}
                            {selectedLead.number_of_employees && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                                <span>{selectedLead.number_of_employees}</span>
                              </div>
                            )}
                            {selectedLead.average_revenue && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                                <span>${selectedLead.average_revenue.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Lead Status</h5>
                          <div className="space-y-2">
                            <span className="inline-flex px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {selectedLead.lead_status || 'New'}
                            </span>
                            {selectedLead.score && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Score:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{selectedLead.score}/100</span>
                              </div>
                            )}
                            {selectedLead.lead_source && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Source:</span>
                                <span>{selectedLead.lead_source}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Location</h5>
                          <div className="space-y-1 text-sm">
                            {selectedLead.street && <div>{selectedLead.street}</div>}
                            {(selectedLead.city || selectedLead.state) && (
                              <div>
                                {selectedLead.city && selectedLead.state
                                  ? `${selectedLead.city}, ${selectedLead.state}`
                                  : selectedLead.city || selectedLead.state
                                }
                              </div>
                            )}
                            {selectedLead.postal_code && <div>{selectedLead.postal_code}</div>}
                            {selectedLead.country && <div>{selectedLead.country}</div>}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span>{new Date(selectedLead.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                              <span>{new Date(selectedLead.updated_at).toLocaleString()}</span>
                            </div>
                            {selectedLead.lead_owner_name && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                                <span>{selectedLead.lead_owner_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedLead.description && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                              {selectedLead.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Component Resize Bar (only when detail bar is not shown) */}
              {!showDetailBar && (
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center group ${
                    isDragging ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onMouseDown={handleLeadsResizeStart}
                >
                  <GripHorizontal className="h-3 w-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </div>
              )}
            </div>
          </div>
        )

      case 'tasks':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Open Tasks</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px] relative">
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Open Tasks
              </h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No open tasks</p>
              </div>
            </div>
          </div>
        )



      case 'reports':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Performance Reports</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px] relative">
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Reports
              </h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No reports generated yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Sales metrics and analytics will appear here</p>
              </div>
            </div>
          </div>
        )

      case 'activities':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Recent Activities</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px] relative">
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activities
              </h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">CRM activity timeline will appear here</p>
              </div>
            </div>
          </div>
        )

      case 'charts':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Sales Charts</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px] relative">
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales Charts
              </h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Visual sales data charts will appear here</p>
              </div>
            </div>
          </div>
        )

      case 'closing-deals':
        return (
          <div key={componentId} className={wrapperClasses} {...commonProps}>
            {isReorderMode && (
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="text-blue-700 dark:text-blue-300">Closing Deals</span>
                <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative z-0" style={{ minHeight: `${dealsHeight}px` }}>
              {/* Component Menu */}
              {renderComponentMenu(componentId)}
              
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Closing Deals
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {dealsLoading && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                    {closingDeals && (
                      <span>{closingDeals.length} deals closing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content Area with Sidebar */}
              <div className="flex h-full">
                {/* Main Deals List */}
                <div className="flex-1 p-6 pr-3" style={{ height: showDealDetailBar ? `${dealsHeight - dealDetailBarHeight - 100}px` : `${dealsHeight - 100}px` }}>
                  {/* Error State */}
                  {dealsError && (
                    <div className="text-center py-8">
                      <div className="text-red-500 dark:text-red-400 mb-2">
                        Failed to load closing deals
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {/* Loading State */}
                  {dealsLoading && (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading closing deals...</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!dealsLoading && !dealsError && closingDeals.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Target className="h-8 w-8 text-green-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No deals are currently closing</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Deals in negotiation or proposal stage will appear here automatically.</p>
                    </div>
                  )}

                  {/* Deals List */}
                  {!dealsLoading && !dealsError && currentDeals.length > 0 && (
                    <div className="space-y-2 overflow-y-auto h-full">
                      {currentDeals.map((deal) => (
                        <div
                          key={deal.deal_id}
                          onClick={() => handleSelectDeal(deal)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedDeal?.deal_id === deal.deal_id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {deal.deal_name}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {deal.account_name || 'No Account'} {deal.contact_name && `• ${deal.contact_name}`}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="inline-flex px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                  {deal.stage || 'New'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(deal.close_date)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 text-right flex-shrink-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(deal.amount)}
                              </p>
                              {deal.probability && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {deal.probability}% probability
                                </p>
                              )}
                              <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar for Remaining Deals */}
                {!dealsLoading && totalClosingDeals > dealsPerPage && (
                  <div className="w-16 bg-gray-50 dark:bg-gray-700/30 border-l border-gray-200 dark:border-gray-700 p-2">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                        {totalDealPages > 1 && (
                          <div className="mb-2">
                            <span>{currentDealPage + 1}/{totalDealPages}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Navigation Buttons */}
                      <button
                        onClick={handlePrevDeals}
                        disabled={currentDealPage === 0}
                        className="p-2 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      
                      <div className="flex flex-col items-center space-y-1 my-2">
                        {[...Array(Math.min(3, totalDealPages))].map((_, index) => {
                          const pageIndex = currentDealPage + index - 1
                          if (pageIndex < 0 || pageIndex >= totalDealPages) return null
                          return (
                            <div key={pageIndex} className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={handleNextDeals}
                        disabled={currentDealPage >= totalDealPages - 1}
                        className="p-2 rounded-full bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                        {totalClosingDeals - (currentDealPage + 1) * dealsPerPage > 0 && (
                          <span>+{totalClosingDeals - (currentDealPage + 1) * dealsPerPage}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Detail Bar */}
              {showDealDetailBar && selectedDeal && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10"
                  style={{ height: `${dealDetailBarHeight}px` }}
                >
                  {/* Detail Bar Header with Resize Handle */}
                  <div 
                    className={`h-8 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-ns-resize flex items-center justify-between px-4 ${
                      isDealDetailDragging ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onMouseDown={handleDealDetailResizeStart}
                  >
                    <div className="flex items-center space-x-2">
                      <GripHorizontal className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Deal Details
                      </span>
                    </div>
                    <button
                      onClick={handleCloseDealDetailBar}
                      className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>

                  {/* Detail Content */}
                  <div className="p-4 overflow-y-auto" style={{ height: `${dealDetailBarHeight - 32}px` }}>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                            {selectedDeal.deal_name}
                          </h4>
                          {selectedDeal.account_name && (
                            <p className="text-gray-600 dark:text-gray-400">{selectedDeal.account_name}</p>
                          )}
                          {selectedDeal.contact_name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Contact: {selectedDeal.contact_name}</p>
                          )}
                        </div>
                        {selectedDeal.description && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Description</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedDeal.description}</p>
                          </div>
                        )}
                      </div>
                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Amount</h5>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedDeal.amount)}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Stage</h5>
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                              {selectedDeal.stage}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Close Date</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(selectedDeal.close_date)}</p>
                          </div>
                          {selectedDeal.probability && (
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Probability</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedDeal.probability}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Component Resize Bar (only when detail bar is not shown) */}
              {!showDealDetailBar && (
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center group ${
                    isDealsResizing ? 'bg-blue-200 dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onMouseDown={handleDealsResizeStart}
                >
                  <GripHorizontal className="h-3 w-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </div>
              )}
            </div>
          </div>
        )

      default:
        // Handle custom and permanent components
        if ((componentId.startsWith('custom-') || componentId.startsWith('permanent-')) && customComponents[componentId]) {
          const component = customComponents[componentId]
          const isPermComponent = isPermanentComponent(componentId)
          
          return (
            <div key={componentId} className={wrapperClasses} {...commonProps}>
              {isReorderMode && (
                <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <span className="text-blue-700 dark:text-blue-300">
                    {component.name} {isPermComponent && '📌'}
                  </span>
                  <ArrowUpDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative">
                {/* Component Menu */}
                {renderComponentMenu(componentId)}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  {component.name}
                  {isPermComponent && (
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400" title="Permanent component">
                      📌
                    </span>
                  )}
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-2xl">📊</div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {component.type}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {isPermComponent ? 'Permanent' : 'Custom'} component created for {component.type.toLowerCase()}
                  </p>
                  {isPermComponent && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✨ This component persists after refresh and cannot be deleted
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        }
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-modal bg-white dark:bg-gray-900 overflow-auto' : ''} p-6 space-y-6`}>
      {/* Full Screen Exit Button and Instructions */}
      {isFullScreen && (
        <>
          <div className="fixed top-4 right-4 z-tooltip">
            <button
              onClick={handleFullScreen}
              className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors animate-pulse"
            >
              <X className="h-5 w-5 mr-2" />
              Exit Full Screen
            </button>
          </div>
          {showFullscreenTip && (
            <div className="fixed top-4 left-4 z-tooltip animate-fade-in">
              <div className="bg-black bg-opacity-90 text-white px-5 py-3 rounded-lg text-sm max-w-sm shadow-2xl border border-gray-600">
                <div className="flex items-center mb-3">
                  <span className="text-xl mr-3">🖥️</span>
                  <strong className="text-base">Full Screen Mode Active</strong>
                </div>
                <div className="text-xs space-y-2 text-gray-200">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    Press <kbd className="bg-white text-black px-2 py-1 rounded text-xs mx-1 font-mono">ESC</kbd> to exit
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    Press <kbd className="bg-white text-black px-2 py-1 rounded text-xs mx-1 font-mono">F11</kbd> to toggle
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    Click the <span className="text-red-400 font-semibold">Exit</span> button →
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-600">
                  This tip will disappear in a few seconds
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Page Header with Three-dot Menu */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {
              ((dashboardData?.user_name || user?.full_name) || '')
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            }
          </h1>
          
          {/* Debug button and Three-dot Menu */}
          {!isFullScreen && (
            <div className="flex items-center space-x-2">
              {/* Debug localStorage button */}
              <button
                onClick={() => {
                  console.log('=== DEBUGGING DASHBOARD STATE ===')
                  console.log('Component Order:', componentOrder)
                  console.log('Custom Components:', customComponents)
                  console.log('Deleted Components:', deletedComponents)
                  console.log('localStorage Order:', localStorage.getItem('dashboard-component-order'))
                  console.log('localStorage Components:', localStorage.getItem('dashboard-custom-components'))
                  console.log('=== END DEBUG ===')
                  alert(`Components in order: ${componentOrder.join(', ')}\nCustom: ${Object.keys(customComponents).length}\nDeleted: ${Object.keys(deletedComponents).length}\nCheck console for full details`)
                }}
                className="p-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Debug
              </button>

              {/* Add Components button */}
              <button
                onClick={() => setShowComponentLibrary(true)}
                className="p-1 px-2 rounded text-xs bg-green-100 dark:bg-green-700 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600 flex items-center space-x-1"
                title="Add components to dashboard"
              >
                <Plus className="h-3 w-3" />
                <span>Components</span>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Dashboard options"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-dropdown">
                    <div className="py-1">
                      <button
                        onClick={handleAddComponent}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Plus className="h-4 w-4 mr-3" />
                        Add Component
                      </button>
                      <button
                        onClick={handleReorder}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ArrowUpDown className="h-4 w-4 mr-3" />
                        {isReorderMode ? 'Exit Reorder' : 'Reorder'}
                      </button>
                      <button
                        onClick={handleFullScreen}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Maximize2 className="h-4 w-4 mr-3" />
                        {isFullScreen ? 'Exit Full Screen' : 'View in Full Screen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Reorder Mode Indicator */}
        {isReorderMode && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <ArrowUpDown className="h-4 w-4 inline mr-2" />
                Reorder mode is active. Drag and drop components to reorganize your dashboard.
              </p>
              <button
                onClick={() => setIsReorderMode(false)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {componentOrder.length > 0 ? (
          componentOrder.map(componentId => renderComponent(componentId))
        ) : (
          // Loading placeholder while components are being loaded from localStorage
          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
            Loading dashboard components...
          </div>
        )}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leadSummary?.total_leads || '0'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Leads</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {accountSummary?.total_accounts || '0'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Accounts</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contactSummary?.total_contacts || '0'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Contacts</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {dealSummary?.total_deals || '0'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Deals</div>
        </div>
      </div>
      

      {/* Add Component Modal */}
      {showAddComponentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Custom Component</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="componentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Component Name
                </label>
                <input
                  id="componentName"
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., Monthly Sales"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="componentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What is this component for?
                </label>
                <input
                  id="componentType"
                  type="text"
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  placeholder="e.g., Today Leads, Performance Tracking, Team Analytics"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="isPermanent"
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isPermanent" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Make this component permanent (Recommended)</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    📌 Permanent components persist after refresh and cannot be deleted (like all built-in components)
                  </p>
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Best Practice:</strong> All custom components are automatically made permanent by default to prevent accidental deletion and ensure consistency with built-in components.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Example: Component Name: "Weekly Pipeline" | For: "Today Leads tracking and conversion rates"
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddComponentModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createCustomComponent}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!componentName.trim() || !componentType.trim()}
              >
                Create Component
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Library Modal */}
      {showComponentLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Component Library</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose components to add to your dashboard
                </p>
              </div>
              <button
                onClick={() => setShowComponentLibrary(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_COMPONENTS.map((component) => {
                  const isAlreadyAdded = componentOrder.includes(component.id)
                  
                  return (
                    <div
                      key={component.id}
                      className={`relative bg-gray-50 dark:bg-gray-700 border-2 rounded-lg p-4 transition-all duration-200 ${
                        isAlreadyAdded
                          ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer'
                      }`}
                      onClick={() => !isAlreadyAdded && handleAddFromLibrary(component)}
                    >
                      {/* Already added indicator */}
                      {isAlreadyAdded && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Component icon and info */}
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isAlreadyAdded 
                            ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400'
                            : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          {component.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold ${
                            isAlreadyAdded
                              ? 'text-green-800 dark:text-green-200'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {component.name}
                            <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">🗑️</span>
                          </h4>
                          <p className={`text-sm mt-1 ${
                            isAlreadyAdded
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {component.description}
                          </p>
                          
                          {/* Category badge */}
                          <div className="flex items-center justify-between mt-3">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              isAlreadyAdded
                                ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            }`}>
                              {component.category}
                            </span>
                            
                            {isAlreadyAdded ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                ✓ Added
                              </span>
                            ) : (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Click to add
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom component option */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Create Custom Component
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Need something specific? Create your own custom dashboard component
                    </p>
                    <button
                      onClick={() => {
                        setShowComponentLibrary(false)
                        setShowAddComponentModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Custom Component
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> All components (🗑️) can be deleted and re-added anytime from this Component Library
              </div>
              <button
                onClick={() => setShowComponentLibrary(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Component Modal */}
      {showEditModal && editingComponentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Component: {customComponents[editingComponentId]?.name || 'Component'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="editComponentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Component Name
                </label>
                <input
                  id="editComponentName"
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., Monthly Sales"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="editComponentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What is this component for?
                </label>
                <input
                  id="editComponentType"
                  type="text"
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  placeholder="e.g., Today Leads, Performance Tracking, Team Analytics"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="editIsPermanent"
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="editIsPermanent" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Make this component permanent</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    📌 Permanent components persist after refresh and cannot be deleted
                  </p>
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Editing:</strong> Changes will be saved immediately and reflected on your dashboard.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingComponentId(null)
                  setComponentName('')
                  setComponentType('')
                  setIsPermanent(true)
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedComponent}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!componentName.trim() || !componentType.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}