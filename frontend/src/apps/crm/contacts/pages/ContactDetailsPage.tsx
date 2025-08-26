import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useContact, useContactDeals, useDeleteContact, useUpdateContact } from '../api'
import { DealFormModal } from '@/apps/crm/deals'
import { ContactFormModal } from '../components/ContactFormModal'
import { TitleBox } from '@/shared/components'
import { TabContainer } from '@/shared/components/templates'
import { WidgetLayout, WidgetConfig } from '@/shared/components/widgets'

import { EmailsTab, CallsTab, MeetingsTab, TasksTab, TimelineTab, DealsTab } from '@/shared/components/tabs'
import { TaskLogContainers } from '@/shared/components/tabs/TaskLogContainers'
import { CallLogContainers } from '@/shared/components/tabs/CallLogContainers'
import { EmailLogContainers } from '@/shared/components/tabs/EmailLogContainers'
import { MeetingLogContainers } from '@/shared/components/tabs/MeetingLogContainers'
import { ContactOverviewTab } from '../components/ContactOverviewTab'
import { AttachmentsTab } from '@/shared/components/attachments'
import { useCreateEntityTask, useUpdateTask, type TaskCreate } from '@/shared/api/tasks'
import { useCreateEntityCall, useUpdateCall, type CallCreate } from '@/shared/api/calls'
import { useCreateEntityEmail, useUpdateEmail, type EmailCreate } from '@/shared/api/emails'
import { useCreateEntityMeeting, useUpdateMeeting, type MeetingCreate } from '@/shared/api/meetings'

import { validateEmail as validateEmailUtil, validatePhone as validatePhoneUtil } from '@/shared/utils/validation'

interface ContactDetailsPageProps {
  contactId: number
}

export const ContactDetailsPage: React.FC<ContactDetailsPageProps> = ({ contactId }) => {

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'attachments' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'timeline'>('overview')

  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [isWidgetSidebarOpen, setIsWidgetSidebarOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const navigate = useNavigate()
  
  // Widget configuration
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    // Contact widgets will be added here in the future
    // { id: 'contactStats', name: 'Contact Stats', isVisible: true }
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
  
  // Meeting modal state
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false)
  const [isEditMeetingOpen, setIsEditMeetingOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<any>(null)
  const [meetingFormData, setMeetingFormData] = useState<MeetingCreate>({
    title: '',
    description: '',
    status: 'logged' as const,
    priority: 'medium' as const,
    contact_name: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: new Date().toTimeString().slice(0, 5),
    duration: undefined,
    tags: [],
  })
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
    direction: 'outbound',
    contact_name: '',
    call_date: new Date().toISOString().split('T')[0], // Today's date
    call_time: new Date().toTimeString().slice(0, 5), // Current time
    duration: undefined,
    tags: [],
  })
  
  const { data: contact, isLoading, error, refetch } = useContact(contactId)
  const { data: deals } = useContactDeals(contactId)
  const deleteContact = useDeleteContact()
  const updateContact = useUpdateContact()
  const createTaskMutation = useCreateEntityTask()
  const updateTaskMutation = useUpdateTask()
  const createCallMutation = useCreateEntityCall()
  const updateCallMutation = useUpdateCall()
  const createEmailMutation = useCreateEntityEmail()
  const updateEmailMutation = useUpdateEmail()
  const createMeetingMutation = useCreateEntityMeeting()
  const updateMeetingMutation = useUpdateMeeting()


  const handleDelete = async () => {
    if (!contact) return
    
    if (window.confirm(`Are you sure you want to delete "${contact.first_name} ${contact.last_name}"?`)) {
      try {
        await deleteContact.mutateAsync(contactId)
        alert('Contact deleted successfully')
        navigate('/crm/contacts')
      } catch (error) {
        alert(`Error deleting contact: ${error}`)
      }
    }
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleDealSuccess = () => {
    setIsDealModalOpen(false)
    // Refresh deals data - this will trigger automatically via React Query
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      // Clean the value - convert empty strings to null for optional fields
      let cleanedValue = value
      if (typeof value === 'string') {
        cleanedValue = value.trim() || null
      }
      
      await updateContact.mutateAsync({ id: contactId, data: { [field]: cleanedValue } })
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error)
      
      // Log more detailed error info
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data)
      }
      
      throw error
    }
  }

  // Call modal handlers
  const handleCreateCall = () => {
    setCallFormData({
      title: '',
      description: '',
      direction: 'outbound',
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : '',
      contact_phone: contact?.phone || '',
      contact_email: contact?.email || '',
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
      contact_name: call.contact_name || '',
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
      email_address: contact?.email || '',
      direction: 'outbound' as const,
      status: 'sent',
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : '',
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
    
    if (!callFormData.title.trim() || !callFormData.direction) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Ensure contact_name is set from contact data
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : callFormData.contact_name || ''
      
      const callData: CallCreate = {
        ...callFormData,
        contact_name: contactName, // Ensure contact_name is always set
        priority: 'medium', // Set default priority since we removed it from UI
        call_date: callFormData.call_date || new Date().toISOString().split('T')[0],
        call_time: callFormData.call_time || new Date().toTimeString().slice(0, 5),
        description: callFormData.description || '',
      }

      await createCallMutation.mutateAsync({
        entityType: 'contact',
        entityId: contactId,
        data: callData
      })

      setIsCreateCallOpen(false)
      setCallFormData({
        title: '',
        description: '',
        direction: 'outbound',
        contact_name: '',
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
    
    if (!callFormData.title.trim() || !callFormData.direction) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingCall) {
      alert('No call selected for editing')
      return
    }

    try {
      // Ensure contact_name is set from contact data
      const contactName = contact ? `${contact.first_name} ${contact.last_name}` : callFormData.contact_name || ''
      
      const callData = {
        ...callFormData,
        contact_name: contactName, // Ensure contact_name is always set
        priority: 'medium' as const, // Set default priority since we removed it from UI
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
        direction: 'outbound',
        contact_name: '',
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
        entity_type: 'contact',
        entity_id: contactId,
      }

      await createEmailMutation.mutateAsync({
        entityType: 'contact',
        entityId: contactId,
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

  // Meeting modal handlers
  const handleCreateMeeting = () => {
    setMeetingFormData({
      title: '',
      description: '',
      status: 'logged' as const,
      priority: 'medium' as const,
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : '',
      meeting_date: new Date().toISOString().split('T')[0],
      meeting_time: new Date().toTimeString().slice(0, 5),
      duration: undefined,
      tags: [],
    })
    setIsCreateMeetingOpen(true)
  }

  const handleEditMeeting = (meeting: any) => {
    setEditingMeeting(meeting)
    setMeetingFormData({
      title: meeting.title || '',
      description: meeting.description || '',
      status: meeting.status || '',
      priority: meeting.priority || '',
      contact_name: meeting.contact_name || '',
      meeting_date: meeting.meeting_date || '',
      meeting_time: meeting.meeting_time || '',
      duration: meeting.duration,
      tags: meeting.tags || [],
    })
    setIsEditMeetingOpen(true)
  }

  const handleCloseCreateMeeting = () => {
    setIsCreateMeetingOpen(false)
  }

  const handleCloseEditMeeting = () => {
    setIsEditMeetingOpen(false)
    setEditingMeeting(null)
  }

  const handleMeetingInputChange = (field: keyof MeetingCreate, value: any) => {
    setMeetingFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!meetingFormData.title.trim() || !meetingFormData.status || !meetingFormData.contact_name?.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const meetingData: MeetingCreate = {
        ...meetingFormData,
        status: meetingFormData.status as "logged" | "scheduled",
        priority: (meetingFormData.priority as string) === '' ? undefined : (meetingFormData.priority as "low" | "medium" | "high" | "urgent"),
        meeting_date: meetingFormData.meeting_date || new Date().toISOString().split('T')[0],
        meeting_time: meetingFormData.meeting_time || new Date().toTimeString().slice(0, 5),
        description: meetingFormData.description || '',
      }

      await createMeetingMutation.mutateAsync({
        entityType: 'contact',
        entityId: contactId,
        data: meetingData
      })

      setIsCreateMeetingOpen(false)
      setMeetingFormData({
        title: '',
        description: '',
        status: 'logged' as const,
        priority: 'medium' as const,
        contact_name: '',
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: new Date().toTimeString().slice(0, 5),
        duration: undefined,
        tags: [],
      })
    } catch (error) {
      console.error('Failed to create meeting:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to create meeting. Please try again.'
      alert(`Failed to schedule meeting: ${errorMessage}`)
    }
  }

  const handleSubmitEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!meetingFormData.title.trim() || !meetingFormData.status || !meetingFormData.contact_name?.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!editingMeeting) {
      alert('No meeting selected for editing')
      return
    }

    try {
      const meetingData = {
        ...meetingFormData,
        status: (meetingFormData.status as string) === '' ? undefined : (meetingFormData.status as "logged" | "scheduled"),
        priority: (meetingFormData.priority as string) === '' ? undefined : (meetingFormData.priority as "low" | "medium" | "high" | "urgent"),
        description: meetingFormData.description || '',
      }

      await updateMeetingMutation.mutateAsync({
        id: editingMeeting.id,
        data: meetingData
      })

      setIsEditMeetingOpen(false)
      setEditingMeeting(null)
      setMeetingFormData({
        title: '',
        description: '',
        status: 'logged' as const,
        priority: 'medium' as const,
        contact_name: '',
        meeting_date: new Date().toISOString().split('T')[0],
        meeting_time: new Date().toTimeString().slice(0, 5),
        duration: undefined,
        tags: [],
      })
    } catch (error) {
      console.error('Failed to update meeting:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || (error as any).message || 'Unknown error occurred'
        : 'Failed to update meeting. Please try again.'
      alert(`Failed to update meeting: ${errorMessage}`)
    }
  }

  // Validation adapters
  const validateEmail = (email: string): boolean | string => {
    const result = validateEmailUtil(email)
    return result.isValid || result.error || 'Invalid email'
  }

  const validatePhone = (phone: string): boolean | string => {
    const result = validatePhoneUtil(phone)
    return result.isValid || result.error || 'Invalid phone'
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
        description: taskFormData.description || undefined,
      }

      await createTaskMutation.mutateAsync({
        entityType: 'contact',
        entityId: contactId,
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
        description: taskFormData.description || undefined,
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

  // Handle widget visibility changes
  const handleWidgetVisibilityChange = (widgetId: string, isVisible: boolean) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, isVisible } : widget
    ))
  }

  if (isLoading) return <div className="p-6">Loading contact...</div>
  if (error) return <div className="p-6 text-red-600">Error loading contact: {error.message}</div>
  if (!contact) return <div className="p-6 text-gray-600">Contact not found</div>

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
          {/* Contact widgets will be rendered here */}
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            <p>Contact widgets coming soon</p>
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
        onCreateMeeting={handleCreateMeeting}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {contact.first_name.charAt(0).toUpperCase()}{contact.last_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contact.first_name} {contact.last_name}
                </h1>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  ({contact.title || 'No title specified'})
                </span>
              </div>
              <div className="mt-1">
                <div className="flex items-center gap-1">
                  <Building2 
                    className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" 
                  />
                  {contact.account && contact.account_name ? (
                    <button
                      onClick={() => navigate(`/crm/accounts/${contact.account}`)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-0.5 underline transition-colors"
                    >
                      {contact.account_name}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      No company specified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TitleBox>

      {/* Tab Container */}
      <div className="mb-6 min-h-[600px]">
        <TabContainer
          preserveTabState={true}
          tabs={[
            { 
              key: 'overview', 
              label: 'Overview', 
              content: (
                <ContactOverviewTab
                  data={contact}
                  onFieldUpdate={handleFieldUpdate}
                  validateEmail={validateEmail}
                  validatePhone={validatePhone}
                  layout="vertical"
                  onAccountClick={(accountId) => navigate(`/crm/accounts/${accountId}`)}
                />
              )
            },
            { 
              key: 'deals', 
              label: 'Deals', 
              content: <DealsTab 
                entityId={contactId} 
                entityType="contact" 
                entityName={contact ? `${contact.first_name} ${contact.last_name}` : undefined} 
                data={{ 
                  deals: deals?.deals || [], 
                  account_id: contact?.account,
                  account_name: contact?.account_name,
                  contact_id: contactId,
                  contact_name: contact ? `${contact.first_name} ${contact.last_name}` : undefined
                }} 
              />
            },
            { 
              key: 'emails', 
              label: 'Emails', 
              content: <EmailsTab 
                entityId={contactId} 
                entityType="contact"
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
                  first_name: contact?.first_name || '',
                  last_name: contact?.last_name || '',
                  email: contact?.email || ''
                }}
              />
            },
            { 
              key: 'calls', 
              label: 'Calls', 
              content: <CallsTab 
                entityId={contactId} 
                entityType="contact"
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
                entityData={contact}
              />
            },
            { 
              key: 'meetings', 
              label: 'Meetings', 
              content: <MeetingsTab 
                entityId={contactId} 
                entityType="contact"
                isCreateMeetingOpen={isCreateMeetingOpen}
                isEditMeetingOpen={isEditMeetingOpen}
                onOpenCreateMeeting={handleCreateMeeting}
                onOpenEditMeeting={handleEditMeeting}
                onCloseCreateMeeting={handleCloseCreateMeeting}
                onCloseEditMeeting={handleCloseEditMeeting}
                meetingFormData={meetingFormData}
                editingMeeting={editingMeeting}
                onMeetingFormDataChange={setMeetingFormData}
                onEditingMeetingChange={setEditingMeeting}
                entityData={contact ? { first_name: contact.first_name, last_name: contact.last_name } : undefined}
              />
            },
            { 
              key: 'tasks', 
              label: 'Tasks', 
              content: <TasksTab 
                entityId={contactId} 
                entityType="contact"
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
              content: <AttachmentsTab entityType="contact" entityId={contactId} />
            },
            { 
              key: 'timeline', 
              label: 'Timeline', 
              content: <TimelineTab 
                data={contact}
                entityId={contactId} 
                entityType="contact" 
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
          onTabChange={(tabKey: string) => setActiveTab(tabKey as 'overview' | 'deals' | 'attachments' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'timeline')}
        />
      </div>


      {/* Deal Modal */}
      {contact?.account && (
        <DealFormModal 
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          initialAccount={contact.account ? { id: contact.account, name: contact.account_name || '' } : undefined}
          initialContact={{ 
            id: contact.contact_id, 
            name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact'
          }}
          onSuccess={handleDealSuccess}
        />
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
        entityData={contact}
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
        entityData={contact ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email || ''
        } : undefined}
        entityType="contact"
        isCreatePending={createEmailMutation.isPending}
        isUpdatePending={updateEmailMutation.isPending}
      />

      {/* Meeting Modals */}
      <MeetingLogContainers
        isCreateMeetingOpen={isCreateMeetingOpen}
        onCloseCreateMeeting={handleCloseCreateMeeting}
        onSubmitCreate={handleSubmitCreateMeeting}
        isEditMeetingOpen={isEditMeetingOpen}
        onCloseEditMeeting={handleCloseEditMeeting}
        onSubmitEdit={handleSubmitEditMeeting}
        formData={meetingFormData}
        onInputChange={handleMeetingInputChange}
        availableContacts={[{
          contact_id: contactId,
          first_name: contact?.first_name || '',
          last_name: contact?.last_name || '',
          email: contact?.email || '',
          phone: contact?.phone || ''
        }]}
        isCreatePending={createMeetingMutation.isPending}
        isUpdatePending={updateMeetingMutation.isPending}
      />

      {/* Edit Modal */}
      <ContactFormModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        contact={contact}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />
      </div>
    </WidgetLayout>
  )
}