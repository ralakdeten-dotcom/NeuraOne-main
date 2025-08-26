import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useDeal, useDealAccountInfo, useDeleteDeal, useUpdateDeal, usePatchDeal } from '../api'
import { useAccountContacts } from '@/apps/crm/accounts/api'
import { TitleBox } from '@/shared/components/templates/TitleBox'
import { Pipeline, TabContainer } from '@/shared/components/templates'
import { WidgetLayout, WidgetConfig } from '@/shared/components/widgets'

import { EmailsTab, CallsTab, MeetingsTab, TasksTab, TimelineTab } from '@/shared/components/tabs'
import { TaskLogContainers } from '@/shared/components/tabs/TaskLogContainers'
import { CallLogContainers } from '@/shared/components/tabs/CallLogContainers'
import { EmailLogContainers } from '@/shared/components/tabs/EmailLogContainers'
import { AttachmentsTab } from '@/shared/components/attachments'
import { InlineEditableField } from '@/shared/components'
import { useCreateEntityTask, useUpdateTask, type TaskCreate } from '@/shared/api/tasks'

import { DealFormModal } from '../components/DealFormModal'
import { useCreateEntityCall, useUpdateCall, type CallCreate } from '@/shared/api/calls'
import { useCreateEntityEmail, useUpdateEmail, useEntityEmails, type EmailCreate } from '@/shared/api/emails'

export const DealDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dealIdNum = id ? parseInt(id) : 0
  const [showClosureModal, setShowClosureModal] = useState(false)
  const [isWidgetSidebarOpen, setIsWidgetSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'attachments' | 'timeline'>('overview')
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  
  // Widget configuration
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    // Deal widgets will be added here in the future
    // { id: 'dealStats', name: 'Deal Stats', isVisible: true }
  ])
  
  // Task modal state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [taskFormData, setTaskFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    priority: '',
    status: 'pending',
    deadline: '',
    tags: [],
  })

  // Call modal state
  const [isCreateCallOpen, setIsCreateCallOpen] = useState(false)
  const [isEditCallOpen, setIsEditCallOpen] = useState(false)
  const [editingCall, setEditingCall] = useState<any>(null)
  
  // Email modal state
  const [isCreateEmailOpen, setIsCreateEmailOpen] = useState(false)
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<any>(null)
  const [emailFormData, setEmailFormData] = useState<EmailCreate>({
    subject: '',
    content: '',
    email_address: '',
    direction: 'outbound',
    status: 'sent',
    contact_name: '',
    email_date: new Date().toISOString().split('T')[0],
    email_time: new Date().toTimeString().slice(0, 5),
    tags: [],
  })
  const [callFormData, setCallFormData] = useState<CallCreate>({
    title: '',
    description: '',
    direction: 'inbound' as const,
    priority: 'medium' as const,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    call_date: new Date().toISOString().split('T')[0], // Today's date
    call_time: new Date().toTimeString().slice(0, 5), // Current time
    duration: undefined,
    tags: [],
  })

  const { data: deal, isLoading, error, refetch } = useDeal(dealIdNum)
  const { data: accountInfo } = useDealAccountInfo(dealIdNum)
  
  // For contactless deals, fetch account contacts to show as suggestions
  const { data: accountContacts } = useAccountContacts(deal?.account || 0)
  
  // For contactless deals with no account contacts, fetch account emails for suggestions
  const { data: accountEmails } = useEntityEmails('account', deal?.account || 0)
  const deleteDeal = useDeleteDeal()
  const updateDeal = useUpdateDeal()
  const patchDeal = usePatchDeal()
  const createTaskMutation = useCreateEntityTask()
  const updateTaskMutation = useUpdateTask()
  const createCallMutation = useCreateEntityCall()
  const updateCallMutation = useUpdateCall()
  const createEmailMutation = useCreateEntityEmail()
  const updateEmailMutation = useUpdateEmail()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteDeal.mutateAsync(dealIdNum)
        navigate('/crm/deals')
      } catch (error) {
        console.error('Error deleting deal:', error)
      }
    }
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handlePipelineStageClick = async (stageId: string) => {
    console.log('Pipeline stage clicked:', stageId)
    console.log('Deal ID:', dealIdNum)
    console.log('Current deal:', deal)
    
    // Safety checks
    if (!deal) {
      alert('Deal not loaded yet. Please wait and try again.')
      return
    }
    
    if (!dealIdNum || dealIdNum === 0) {
      alert('Invalid deal ID. Please refresh the page.')
      return
    }
    
    if (deal.stage === stageId) {
      console.log('Stage is already set to:', stageId)
      return // No need to update if it's already the current stage
    }

    // Handle Closed stage with modal
    if (stageId === 'Closed') {
      setShowClosureModal(true)
      return
    }
    
    // Create a more complete update payload with current deal data
    const updateData = {
      deal_name: deal.deal_name,
      stage: stageId,
      amount: String(deal.amount),
      close_date: deal.close_date,
      account: deal.account,
      owner: deal.owner || undefined,
      primary_contact: deal.primary_contact || undefined
    }
    
    // Remove undefined values to avoid sending them
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })
    
    console.log('Update payload:', { dealId: dealIdNum, dealData: updateData })
    console.log('API URL would be:', `/api/crm/deals/${dealIdNum}/`)
    console.log('Request data would be:', updateData)
    console.log('Request data JSON:', JSON.stringify(updateData, null, 2))
    
    try {
      // First try PATCH with just stage (partial update)
      console.log('Attempting PATCH with stage only...')
      const result = await patchDeal.mutateAsync({
        dealId: dealIdNum,
        dealData: { stage: stageId }
      })
      console.log('PATCH update successful:', result)
    } catch (patchError: any) {
      console.log('PATCH update failed, trying PUT with full data...')
      console.error('PATCH error:', patchError.response?.data)
      
      try {
        // If PATCH fails, try PUT with full data
        const result = await updateDeal.mutateAsync({
          dealId: dealIdNum,
          dealData: updateData
        })
        console.log('PUT update successful:', result)
      } catch (error: any) {
      console.error('Error updating deal stage:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error headers:', error.response?.headers)
      console.error('Full error object:', error)
      
      // Log the full response data structure
      if (error.response?.data) {
        console.error('Detailed error data:', JSON.stringify(error.response.data, null, 2))
      }
      
      let errorMessage = 'Unknown error occurred'
      const responseData = error.response?.data
      
      if (responseData) {
        // Handle different error response formats
        if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (responseData.detail) {
          errorMessage = responseData.detail
        } else if (responseData.error) {
          errorMessage = responseData.error
        } else if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.non_field_errors) {
          errorMessage = Array.isArray(responseData.non_field_errors) 
            ? responseData.non_field_errors.join(', ')
            : responseData.non_field_errors
        } else {
          // Handle field-specific validation errors
          const fieldErrors = []
          for (const [field, errors] of Object.entries(responseData)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`)
            } else if (typeof errors === 'string') {
              fieldErrors.push(`${field}: ${errors}`)
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ')
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
        alert(`Failed to update deal stage: ${errorMessage}`)
      }
    }
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      await patchDeal.mutateAsync({
        dealId: dealIdNum,
        dealData: { [field]: value }
      })
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      throw error
    }
  }

  const handleClosureChoice = async (action: 'won' | 'lost') => {
    setShowClosureModal(false)
    
    const finalStage = action === 'won' ? 'Closed Won' : 'Closed Lost'
    
    try {
      const result = await patchDeal.mutateAsync({
        dealId: dealIdNum,
        dealData: { stage: finalStage }
      })
      
      console.log('Deal closure successful:', result)
      
      if (action === 'won') {
        alert('🎉 Congratulations! Deal marked as Won successfully!')
      } else {
        alert('😔 Deal marked as Lost. Better luck next time!')
      }
    } catch (error: any) {
      console.error('Error closing deal:', error)
      alert(`Failed to close deal: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
    }
  }


  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  const calculateDaysToClose = (closeDateString: string) => {
    const closeDate = new Date(closeDateString)
    const today = new Date()
    const timeDiff = closeDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  // Task modal handlers
  const handleCreateTask = () => {
    setTaskFormData({
      title: '',
      description: '',
      priority: '',
      status: 'pending',
      deadline: '',
      tags: [],
    })
    setIsCreateTaskOpen(true)
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || '',
      status: task.status || 'todo',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      tags: task.tags || [],
    })
    setIsEditTaskOpen(true)
  }

  const handleCloseCreateTask = () => {
    setIsCreateTaskOpen(false)
  }

  const handleCloseEditTask = () => {
    setIsEditTaskOpen(false)
    setEditingTask(null)
  }

  const handleTaskInputChange = (field: keyof TaskCreate, value: any) => {
    setTaskFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!taskFormData.title.trim()) {
      alert('Task title is required')
      return
    }

    try {
      const taskData: TaskCreate = {
        ...taskFormData,
        deadline: taskFormData.deadline || undefined,
        description: taskFormData.description || '', // Keep empty string for description
      }

      await createTaskMutation.mutateAsync({
        entityType: 'deal',
        entityId: dealIdNum,
        data: taskData
      })

      setIsCreateTaskOpen(false)
      setTaskFormData({
        title: '',
        description: '',
        priority: '',
        status: 'pending',
        deadline: '',
        tags: [],
      })
    } catch (error) {
      console.error('Failed to create task:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to create task. Please try again.'
      alert(`Failed to create task: ${errorMessage}`)
    }
  }

  const handleSubmitEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!taskFormData.title.trim()) {
      alert('Task title is required')
      return
    }

    if (!editingTask) {
      alert('No task selected for editing')
      return
    }

    try {
      const taskData = {
        ...taskFormData,
        deadline: taskFormData.deadline || undefined,
        description: taskFormData.description || '', // Keep empty string for description
      }

      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        data: taskData
      })

      setIsEditTaskOpen(false)
      setEditingTask(null)
      setTaskFormData({
        title: '',
        description: '',
        priority: '',
        status: 'pending',
        deadline: '',
        tags: [],
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to update task. Please try again.'
      alert(`Failed to update task: ${errorMessage}`)
    }
  }

  // Call modal handlers
  const handleCreateCall = () => {
    setCallFormData({
      title: '',
      description: '',
      direction: '',
      priority: '',
      contact_name: deal?.primary_contact_name || '',
      contact_phone: deal?.primary_contact_phone || '',
      contact_email: deal?.primary_contact_email || '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().slice(0, 5),
      duration: undefined,
      tags: [],
    })
    setIsCreateCallOpen(true)
  }

  const handleEditCall = (call: any) => {
    setEditingCall(call)
    setCallFormData({
      title: call.title || '',
      description: call.description || '',
      direction: call.direction || '',
      priority: call.priority || '',
      contact_name: call.contact_name || deal?.primary_contact_name || '',
      contact_phone: call.contact_phone || deal?.primary_contact_phone || '',
      contact_email: call.contact_email || deal?.primary_contact_email || '',
      call_date: call.call_date || '',
      call_time: call.call_time || '',
      duration: call.duration,
      tags: call.tags || [],
    })
    setIsEditCallOpen(true)
  }

  const handleCloseCreateCall = () => {
    setIsCreateCallOpen(false)
  }

  const handleCloseEditCall = () => {
    setIsEditCallOpen(false)
    setEditingCall(null)
  }

  const handleCallInputChange = (field: keyof CallCreate, value: any) => {
    setCallFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Email modal handlers
  const handleCreateEmail = () => {
    setEmailFormData({
      subject: '',
      content: '',
      email_address: deal?.contact?.email || '',
      direction: 'outbound' as const,
      status: 'sent',
      contact_name: deal?.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : '',
      email_date: new Date().toISOString().split('T')[0],
      email_time: new Date().toTimeString().slice(0, 5),
      tags: [],
    })
    setIsCreateEmailOpen(true)
  }

  const handleEditEmail = (email: any) => {
    setEditingEmail(email)
    setEmailFormData({
      subject: email.subject || '',
      content: email.content || '',
      email_address: email.email_address || '',
      direction: email.direction || 'outbound',
      status: email.status || 'sent',
      contact_name: email.contact_name || '',
      email_date: email.email_date || '',
      email_time: email.email_time || '',
      cc_addresses: email.cc_addresses || '',
      bcc_addresses: email.bcc_addresses || '',
      message_id: email.message_id || '',
      thread_id: email.thread_id || '',
      tags: email.tags || [],
    })
    setIsEditEmailOpen(true)
  }

  const handleCloseCreateEmail = () => {
    setIsCreateEmailOpen(false)
  }

  const handleCloseEditEmail = () => {
    setIsEditEmailOpen(false)
    setEditingEmail(null)
  }

  const handleEmailInputChange = (field: keyof EmailCreate, value: any) => {
    setEmailFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitCreateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have a contact name from form data or can get it from deal's primary contact
    const contactName = callFormData.contact_name?.trim() || 
                       deal?.primary_contact_name || ''
    
    if (!callFormData.title.trim() || !callFormData.direction || (callFormData.direction as string) === '' || !contactName) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const callData: CallCreate = {
        ...callFormData,
        contact_name: contactName, // Use the validated contact name
        direction: callFormData.direction as 'inbound' | 'outbound', // Required field, validation ensures it's not empty
        priority: (callFormData.priority as string) === '' ? undefined : (callFormData.priority as 'low' | 'medium' | 'high' | 'urgent'),
        call_date: callFormData.call_date || new Date().toISOString().split('T')[0],
        call_time: callFormData.call_time || new Date().toTimeString().slice(0, 5),
        description: callFormData.description || '',
      }

      await createCallMutation.mutateAsync({
        entityType: 'deal',
        entityId: dealIdNum,
        data: callData
      })

      setIsCreateCallOpen(false)
      setCallFormData({
        title: '',
        description: '',
        direction: 'inbound' as const,
        priority: 'medium' as const,
        contact_name: deal?.primary_contact_name || '',
        contact_phone: deal?.primary_contact_phone || '',
        contact_email: deal?.primary_contact_email || '',
        call_date: new Date().toISOString().split('T')[0],
        call_time: new Date().toTimeString().slice(0, 5),
        duration: undefined,
        tags: [],
      })
    } catch (error) {
      console.error('Failed to create call:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to create call. Please try again.'
      alert(`Failed to log call: ${errorMessage}`)
    }
  }

  const handleSubmitEditCall = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have a contact name from form data or can get it from deal's primary contact
    const contactName = callFormData.contact_name?.trim() || 
                       deal?.primary_contact_name || ''
    
    if (!callFormData.title.trim() || !callFormData.direction || (callFormData.direction as string) === '' || !contactName) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingCall) {
      alert('No call selected for editing')
      return
    }

    try {
      const callData = {
        ...callFormData,
        contact_name: contactName, // Use the validated contact name
        direction: (callFormData.direction as string) === '' ? undefined : (callFormData.direction as 'inbound' | 'outbound'),
        priority: (callFormData.priority as string) === '' ? undefined : (callFormData.priority as 'low' | 'medium' | 'high' | 'urgent'),
        description: callFormData.description || '',
      }

      await updateCallMutation.mutateAsync({
        id: editingCall.id,
        data: callData
      })

      setIsEditCallOpen(false)
      setEditingCall(null)
      setCallFormData({
        title: '',
        description: '',
        direction: 'inbound' as const,
        priority: 'medium' as const,
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        call_date: new Date().toISOString().split('T')[0],
        call_time: new Date().toTimeString().slice(0, 5),
        duration: undefined,
        tags: [],
      })
    } catch (error) {
      console.error('Failed to update call:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to update call. Please try again.'
      alert(`Failed to update call: ${errorMessage}`)
    }
  }

  const handleSubmitCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailFormData.subject.trim() || !emailFormData.content.trim() || !emailFormData.email_address.trim() || !emailFormData.contact_name?.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const emailData = {
        ...emailFormData,
        entity_type: 'deal',
        entity_id: dealIdNum,
      }

      await createEmailMutation.mutateAsync({
        entityType: 'deal',
        entityId: dealIdNum,
        data: emailData
      })

      setIsCreateEmailOpen(false)
      setEmailFormData({
        subject: '',
        content: '',
        email_address: '',
        direction: 'outbound',
        status: 'sent',
        contact_name: '',
        email_date: new Date().toISOString().split('T')[0],
        email_time: new Date().toTimeString().slice(0, 5),
        tags: [],
      })
    } catch (error) {
      console.error('Failed to create email:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to create email. Please try again.'
      alert(`Failed to log email: ${errorMessage}`)
    }
  }

  const handleSubmitEditEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailFormData.subject.trim() || !emailFormData.content.trim() || !emailFormData.email_address.trim() || !emailFormData.contact_name?.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingEmail) {
      alert('No email selected for editing')
      return
    }

    try {
      await updateEmailMutation.mutateAsync({
        id: editingEmail.id,
        data: emailFormData
      })

      setIsEditEmailOpen(false)
      setEditingEmail(null)
      setEmailFormData({
        subject: '',
        content: '',
        email_address: '',
        direction: 'outbound',
        status: 'sent',
        contact_name: '',
        email_date: new Date().toISOString().split('T')[0],
        email_time: new Date().toTimeString().slice(0, 5),
        tags: [],
      })
    } catch (error) {
      console.error('Failed to update email:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to update email. Please try again.'
      alert(`Failed to update email: ${errorMessage}`)
    }
  }

  // Handle widget visibility changes
  const handleWidgetVisibilityChange = (widgetId: string, isVisible: boolean) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, isVisible } : widget
    ))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading deal: {error?.message || 'Deal not found'}</p>
        </div>
      </div>
    )
  }


  return (
    <WidgetLayout
      isOpen={isWidgetSidebarOpen}
      onToggle={() => setIsWidgetSidebarOpen(!isWidgetSidebarOpen)}
      title="Widgets"
      width="400px"
      widgets={widgets}
      onWidgetVisibilityChange={handleWidgetVisibilityChange}
      sidebarContent={
        <>
          {/* Deal widgets will be rendered here */}
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            <p>Deal widgets coming soon</p>
          </div>
        </>
      }
    >
      <div className="w-full p-6">
      {/* Title Box */}
      <TitleBox
        showActions={true}
        showQuickActions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateTask={handleCreateTask}
        onCreateCall={handleCreateCall}
        onCreateEmail={handleCreateEmail}
        onCreateMeeting={() => {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {deal.deal_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {deal.deal_name}
                </h1>
                {deal.primary_contact_name && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    ({deal.primary_contact_name ? (
                      <Link
                        to={`/crm/contacts/${deal.primary_contact}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                      >
                        {deal.primary_contact_name}
                      </Link>
                    ) : (
                      'No contact specified'
                    )})
                  </span>
                )}
              </div>
              <div className="mt-1">
                <div className="flex items-center gap-1">
                  <Building2 
                    className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" 
                  />
                  {accountInfo ? (
                    <Link
                      to={`/crm/accounts/${accountInfo.account.account_id}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-0.5 underline transition-colors"
                    >
                      {accountInfo.account.account_name}
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      No account specified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TitleBox>

      {/* Pipeline */}
      <div className="mb-6">
        <Pipeline 
          stages={[
            { id: 'Prospecting', title: 'Prospecting', isActive: deal.stage === 'Prospecting' },
            { id: 'Analysis', title: 'Analysis', isActive: deal.stage === 'Analysis' },
            { id: 'Proposal', title: 'Proposal', isActive: deal.stage === 'Proposal' },
            { id: 'Negotiation', title: 'Negotiation', isActive: deal.stage === 'Negotiation' },
            { 
              id: 'Closed', 
              title: deal.stage === 'Closed Won' ? 'Closed Won' : deal.stage === 'Closed Lost' ? 'Closed Lost' : 'Close', 
              isActive: deal.stage === 'Closed' || deal.stage === 'Closed Won' || deal.stage === 'Closed Lost',
              customColor: deal.stage === 'Closed Won' ? 'bg-green-600 dark:bg-green-700' : deal.stage === 'Closed Lost' ? 'bg-red-600 dark:bg-red-700' : undefined
            }
          ]}
          onStageClick={handlePipelineStageClick}
        />
      </div>

      {/* Tab Container */}
      <div className="mb-6 min-h-[600px]">
        <TabContainer
          preserveTabState={true}
          tabs={[
            { 
              key: 'overview', 
              label: 'Overview', 
              content: (
                <div className="space-y-8">
                  {/* Deal Information Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Deal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {/* First row: Deal Name and Deal Amount */}
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Deal Name</label>
                        <div className="flex-1">
                          <InlineEditableField
                            label=""
                            value={deal?.deal_name || ''}
                            onSave={(value: string) => handleFieldUpdate('deal_name', value)}
                            required
                            className="inline-field-horizontal"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Deal Amount</label>
                        <div className="flex-1">
                          <InlineEditableField
                            label=""
                            value={deal?.amount || ''}
                            type="number"
                            onSave={(value: string) => handleFieldUpdate('amount', parseFloat(value))}
                            formatter={(val) => val ? formatCurrency(val) : ''}
                            className="inline-field-horizontal"
                          />
                        </div>
                      </div>
                      
                      {/* Second row: Contact and Account */}
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Contact</label>
                        <div className="flex-1">
                          {deal?.primary_contact_name ? (
                            <Link
                              to={`/crm/contacts/${deal.primary_contact}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                            >
                              {deal.primary_contact_name}
                            </Link>
                          ) : (
                            <span className="text-gray-900 dark:text-white">No contact</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Account</label>
                        <div className="flex-1">
                          {accountInfo?.account ? (
                            <Link
                              to={`/crm/accounts/${accountInfo.account.account_id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                            >
                              {accountInfo.account.account_name}
                            </Link>
                          ) : (
                            <span className="text-gray-900 dark:text-white">No account</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Third row: Close Until and Deal Owner */}
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Close Until</label>
                        <div className="flex-1">
                          <InlineEditableField
                            label=""
                            value={deal?.close_date || ''}
                            type="text"
                            onSave={(value: string) => handleFieldUpdate('close_date', value)}
                            formatter={(val) => val ? formatDate(val) : ''}
                            className="inline-field-horizontal"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-0.5">Deal Owner</label>
                        <div className="flex-1">
                          <span className="text-gray-900 dark:text-white">{deal?.owner_name || 'Not assigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Additional Information</h3>
                    
                    {/* Description field */}
                    <div>
                      <div className="flex items-start space-x-4 py-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-28 flex-shrink-0 mt-1">Description</label>
                        <div className="flex-1">
                          <InlineEditableField
                            label=""
                            value={deal?.description || ''}
                            type="textarea"
                            onSave={(value: string) => handleFieldUpdate('description', value)}
                            placeholder="-"
                            className="inline-field-horizontal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            { 
              key: 'emails', 
              label: 'Emails', 
              content: <EmailsTab 
                entityId={dealIdNum} 
                entityType="deal"
                isCreateEmailOpen={isCreateEmailOpen}
                isEditEmailOpen={isEditEmailOpen}
                onOpenCreateEmail={handleCreateEmail}
                onOpenEditEmail={handleEditEmail}
                onCloseCreateEmail={handleCloseCreateEmail}
                onCloseEditEmail={handleCloseEditEmail}
                emailFormData={emailFormData}
                editingEmail={editingEmail}
                onEmailFormDataChange={setEmailFormData}
                onEditingEmailChange={setEditingEmail}
                entityData={{
                  first_name: deal?.contact?.first_name || '',
                  last_name: deal?.contact?.last_name || '',
                  email: deal?.contact?.email || ''
                }}
              />
            },
            { 
              key: 'calls', 
              label: 'Calls', 
              content: <CallsTab 
                entityId={dealIdNum} 
                entityType="deal"
                isCreateCallOpen={isCreateCallOpen}
                isEditCallOpen={isEditCallOpen}
                onOpenCreateCall={handleCreateCall}
                onOpenEditCall={handleEditCall}
                onCloseCreateCall={handleCloseCreateCall}
                onCloseEditCall={handleCloseEditCall}
                callFormData={callFormData}
                editingCall={editingCall}
                onCallFormDataChange={setCallFormData}
                onEditingCallChange={setEditingCall}
              />
            },
            { 
              key: 'meetings', 
              label: 'Meetings', 
              content: <MeetingsTab 
                entityId={dealIdNum} 
                entityType="deal"
                entityData={deal?.primary_contact_first_name && deal?.primary_contact_last_name ? {
                  first_name: deal.primary_contact_first_name,
                  last_name: deal.primary_contact_last_name
                } : undefined}
              />
            },
            { 
              key: 'tasks', 
              label: 'Tasks', 
              content: <TasksTab 
                entityId={dealIdNum} 
                entityType="deal"
                isCreateTaskOpen={isCreateTaskOpen}
                isEditTaskOpen={isEditTaskOpen}
                onOpenCreateTask={handleCreateTask}
                onOpenEditTask={handleEditTask}
                onCloseCreateTask={handleCloseCreateTask}
                onCloseEditTask={handleCloseEditTask}
                taskFormData={taskFormData}
                editingTask={editingTask}
                onTaskFormDataChange={setTaskFormData}
                onEditingTaskChange={setEditingTask}
              />
            },
            { 
              key: 'attachments', 
              label: 'Attachments', 
              content: <AttachmentsTab entityType="deal" entityId={dealIdNum} />
            },
            { 
              key: 'timeline', 
              label: 'Timeline', 
              content: <TimelineTab 
                data={deal}
                entityId={dealIdNum} 
                entityType="deal" 
                auditFields={{
                  createdAt: 'created_at',
                  createdBy: 'created_by_name',
                  updatedAt: 'updated_at',
                  updatedBy: 'updated_by_name'
                }}
              />
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabKey: string) => setActiveTab(tabKey as 'overview' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'attachments' | 'timeline')}
        />
      </div>


      {/* Deal Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                Deal Closure
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
                What was the outcome?
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
                You're marking this deal as closed. Please select the final outcome:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleClosureChoice('won')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span className="mr-2">🎉</span>
                  Deal Won
                </button>
                
                <button
                  onClick={() => handleClosureChoice('lost')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span className="mr-2">💔</span>
                  Deal Lost
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-center">
                <button
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modals */}
      <TaskLogContainers
        isCreateTaskOpen={isCreateTaskOpen}
        onCloseCreateTask={handleCloseCreateTask}
        onSubmitCreate={handleSubmitCreateTask}
        isEditTaskOpen={isEditTaskOpen}
        onCloseEditTask={handleCloseEditTask}
        onSubmitEdit={handleSubmitEditTask}
        formData={taskFormData}
        onInputChange={handleTaskInputChange}
        isCreatePending={createTaskMutation.isPending}
        isUpdatePending={updateTaskMutation.isPending}
      />

      {/* Edit Modal */}
      <DealFormModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        deal={deal}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />

      {/* Call Modals */}
      <CallLogContainers
        isCreateCallOpen={isCreateCallOpen}
        onCloseCreateCall={handleCloseCreateCall}
        onSubmitCreate={handleSubmitCreateCall}
        isEditCallOpen={isEditCallOpen}
        onCloseEditCall={handleCloseEditCall}
        onSubmitEdit={handleSubmitEditCall}
        formData={callFormData}
        onInputChange={handleCallInputChange}
        entityData={deal?.primary_contact_name ? {
          name: deal.primary_contact_name
        } : undefined}
        entityType="contact"
        isCreatePending={createCallMutation.isPending}
        isUpdatePending={updateCallMutation.isPending}
      />

      {/* Email Modals */}
      <EmailLogContainers
        isCreateEmailOpen={isCreateEmailOpen}
        onCloseCreateEmail={handleCloseCreateEmail}
        onSubmitCreate={handleSubmitCreateEmail}
        isEditEmailOpen={isEditEmailOpen}
        onCloseEditEmail={handleCloseEditEmail}
        onSubmitEdit={handleSubmitEditEmail}
        formData={emailFormData}
        onInputChange={handleEmailInputChange}
        entityData={deal?.primary_contact_name && deal?.primary_contact_email ? {
          first_name: deal.primary_contact_name.split(' ')[0] || '',
          last_name: deal.primary_contact_name.split(' ').slice(1).join(' ') || '',
          email: deal.primary_contact_email
        } : undefined}
        entityType="deal"
        availableContacts={
          // For contactless deals, show account contacts as suggestions
          (!deal?.primary_contact && accountContacts?.contacts) ? 
            accountContacts.contacts.map(contact => ({
              contact_id: contact.contact_id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone
            })) : undefined
        }
        emailSuggestions={
          // For contactless deals with no account contacts, show email suggestions from account emails
          (!deal?.primary_contact && (!accountContacts?.contacts || accountContacts.contacts.length === 0) && accountEmails) ?
            accountEmails
              .filter(email => email.email_address && email.contact_name) // Only emails with both address and name
              .reduce((unique, email) => {
                // Remove duplicates based on email_address
                if (!unique.find(u => u.email_address === email.email_address)) {
                  unique.push({
                    email_address: email.email_address,
                    contact_name: email.contact_name || email.contact_display_name || 'Unknown Contact'
                  })
                }
                return unique
              }, [] as Array<{email_address: string, contact_name: string}>)
            : undefined
        }
        isCreatePending={createEmailMutation.isPending}
        isUpdatePending={updateEmailMutation.isPending}
      />
      </div>
    </WidgetLayout>
  )
}