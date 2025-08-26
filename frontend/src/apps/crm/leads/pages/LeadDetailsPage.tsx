import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useLead, useLeadAccountInfo, useDeleteLead, useConvertLeadEnhanced, useUpdateLead } from '../api'
import { LeadConversionModal } from '../components/LeadConversionModal'
import { LeadFormModal } from '../components/LeadFormModal'
import { TitleBox } from '@/shared/components'
import { Pipeline, TabContainer } from '@/shared/components/templates'
import { WidgetLayout, WidgetConfig } from '@/shared/components/widgets'
import { LeadScoreWidget } from '../lead-widgets'

import { EmailsTab, CallsTab, MeetingsTab, TasksTab, TimelineTab } from '@/shared/components/tabs'
import { TaskLogContainers } from '@/shared/components/tabs/TaskLogContainers'
import { CallLogContainers } from '@/shared/components/tabs/CallLogContainers'
import { EmailLogContainers } from '@/shared/components/tabs/EmailLogContainers'
import { MeetingLogContainers } from '@/shared/components/tabs/MeetingLogContainers'
import { LeadOverviewTab } from '../components/LeadOverviewTab'
import { AttachmentsTab } from '@/shared/components/attachments'
import { useCreateEntityTask, useUpdateTask, type TaskCreate } from '@/shared/api/tasks'
import { useCreateEntityCall, useUpdateCall, type CallCreate } from '@/shared/api/calls'
import { useCreateEntityEmail, useUpdateEmail, type EmailCreate } from '@/shared/api/emails'
import { useCreateEntityMeeting, useUpdateMeeting, type MeetingCreate } from '@/shared/api/meetings'

import { validateEmail as validateEmailUtil, validatePhone as validatePhoneUtil } from '@/shared/utils/validation'

interface LeadDetailsPageProps {
  leadId: number
}

export const LeadDetailsPage: React.FC<LeadDetailsPageProps> = ({ leadId }) => {

  const [activeTab, setActiveTab] = useState<'overview' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'attachments' | 'timeline'>('overview')

  const [showConversionModal, setShowConversionModal] = useState(false)
  const [showClosureModal, setShowClosureModal] = useState(false)
  const [isWidgetSidebarOpen, setIsWidgetSidebarOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  
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
  
  // Meeting modal state
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false)
  const [isEditMeetingOpen, setIsEditMeetingOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<any>(null)
  const [meetingFormData, setMeetingFormData] = useState<MeetingCreate>({
    title: '',
    description: '',
    status: '',
    priority: '',
    contact_name: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: new Date().toTimeString().slice(0, 5),
    duration: undefined,
    tags: [],
  })
  const [editingCall, setEditingCall] = useState<any>(null)
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
  
  // Widget configuration
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'leadScore', name: 'Lead Score', isVisible: true }
  ])
  const navigate = useNavigate()
  
  const { data: lead, isLoading, error, refetch } = useLead(leadId)
  const { data: companyInfo } = useLeadAccountInfo(leadId)
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLeadEnhanced()
  const updateLead = useUpdateLead()
  const createTaskMutation = useCreateEntityTask()
  const updateTaskMutation = useUpdateTask()
  const createCallMutation = useCreateEntityCall()
  const updateCallMutation = useUpdateCall()
  const createEmailMutation = useCreateEntityEmail()
  const updateEmailMutation = useUpdateEmail()
  const createMeetingMutation = useCreateEntityMeeting()
  const updateMeetingMutation = useUpdateMeeting()

  const handleDelete = async () => {
    if (!lead) return
    
    if (window.confirm(`Are you sure you want to delete "${lead.first_name} ${lead.last_name}"?`)) {
      try {
        await deleteLead.mutateAsync(leadId)
        alert('Lead deleted successfully')
        navigate('/crm/leads')
      } catch (error) {
        alert(`Error deleting lead: ${error}`)
      }
    }
  }

  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleConvert = () => {
    setShowConversionModal(true)
  }

  const handleConversionSubmit = async (conversionData: any) => {
    try {
      const result = await convertLead.mutateAsync({ 
        id: leadId, 
        conversionData 
      })
      
      alert(`Lead converted successfully! Created: ${result.account?.account_name || result.lead_name}${result.deal ? `, ${result.deal.deal_name}` : ''}`)
      navigate('/crm/leads')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      alert(`Error converting lead: ${errorMessage}`)
      console.error('Conversion error:', error)
    } finally {
      setShowConversionModal(false)
    }
  }

  const handlePipelineStageClick = async (stageId: string) => {
    if (stageId === 'closed') {
      // Show custom closure modal
      setShowClosureModal(true)
    } else {
      // For other stages, just update the status
      try {
        await handleFieldUpdate('lead_status', stageId)
      } catch (error) {
        console.error('Error updating lead status:', error)
      }
    }
  }

  const handleClosureChoice = async (action: 'convert' | 'close' | 'delete') => {
    setShowClosureModal(false)
    
    if (action === 'convert') {
      setShowConversionModal(true)
    } else if (action === 'close') {
      try {
        await handleFieldUpdate('lead_status', 'closed')
      } catch (error) {
        console.error('Error updating lead status:', error)
      }
    } else if (action === 'delete') {
      await handleDelete()
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'proposal': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      await updateLead.mutateAsync({ id: leadId, data: { [field]: value } })
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      throw error
    }
  }

  const leadStatusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closed', label: 'Closed' }
  ]

  const leadSourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'email_campaign', label: 'Email Campaign' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'trade_show', label: 'Trade Show' },
    { value: 'other', label: 'Other' }
  ]

  // Validation adapters
  const validateEmail = (email: string): boolean | string => {
    const result = validateEmailUtil(email)
    return result.isValid || result.error || 'Invalid email'
  }

  const validatePhone = (phone: string): boolean | string => {
    const result = validatePhoneUtil(phone)
    return result.isValid || result.error || 'Invalid phone'
  }

  // Handle widget visibility changes
  const handleWidgetVisibilityChange = (widgetId: string, isVisible: boolean) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, isVisible } : widget
    ))
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
        entityType: 'lead',
        entityId: leadId,
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
      
      // Log detailed error information
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Full API Error Response:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            data: axiosError.config?.data,
          }
        })
      }
      
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as any).response?.data?.detail || (error as any).response?.data?.message || JSON.stringify((error as any).response?.data) || (error as any).message || 'Unknown error occurred'
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
      contact_name: lead ? `${lead.first_name} ${lead.last_name}` : '',
      contact_phone: lead?.phone || '',
      contact_email: lead?.email || '',
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
      contact_name: call.contact_name || '',
      contact_phone: call.contact_phone || '',
      contact_email: call.contact_email || '',
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

  // Email modal handlers
  const handleCreateEmail = () => {
    setEmailFormData({
      subject: '',
      content: '',
      email_address: lead?.email || '',
      direction: 'outbound' as const,
      status: 'sent',
      contact_name: lead ? `${lead.first_name} ${lead.last_name}` : '',
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

  const handleCallInputChange = (field: keyof CallCreate, value: any) => {
    setCallFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitCreateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have a contact name from form data or can get it from lead's name
    const contactName = callFormData.contact_name?.trim() || 
                       (lead ? `${lead.first_name} ${lead.last_name}` : '')
    
    if (!callFormData.title.trim() || !callFormData.direction || (callFormData.direction as string) === '' || !contactName) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const callData: CallCreate = {
        ...callFormData,
        contact_name: contactName, // Use the validated contact name
        direction: callFormData.direction as 'inbound' | 'outbound', // Required field, validation ensures it's not empty
        priority: (callFormData.priority as string) === '' ? undefined : callFormData.priority,
        call_date: callFormData.call_date || new Date().toISOString().split('T')[0],
        call_time: callFormData.call_time || new Date().toTimeString().slice(0, 5),
        description: callFormData.description || '',
      }

      await createCallMutation.mutateAsync({
        entityType: 'lead',
        entityId: leadId,
        data: callData
      })

      setIsCreateCallOpen(false)
      setCallFormData({
        title: '',
        description: '',
        direction: '',
        priority: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
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
    
    // Check if we have a contact name from form data or can get it from lead's name
    const contactName = callFormData.contact_name?.trim() || 
                       (lead ? `${lead.first_name} ${lead.last_name}` : '')
    
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
        direction: (callFormData.direction as string) === '' ? undefined : callFormData.direction,
        priority: (callFormData.priority as string) === '' ? undefined : callFormData.priority,
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
        direction: '',
        priority: '',
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
        entity_type: 'lead',
        entity_id: leadId,
      }

      await createEmailMutation.mutateAsync({
        entityType: 'lead',
        entityId: leadId,
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
      status: '',
      priority: '',
      contact_name: lead ? `${lead.first_name} ${lead.last_name}` : '',
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
        entityType: 'lead',
        entityId: leadId,
        data: meetingData
      })

      setIsCreateMeetingOpen(false)
      setMeetingFormData({
        title: '',
        description: '',
        status: '',
        priority: '',
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
        status: '',
        priority: '',
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

  // Memoize tabs to prevent recreation on every render
  const tabs = useMemo(() => [
    { 
      key: 'overview', 
      label: 'Overview', 
      content: (
        <LeadOverviewTab
          data={lead}
          onFieldUpdate={handleFieldUpdate}
          validateEmail={validateEmail}
          validatePhone={validatePhone}
          layout="vertical"
          onAccountClick={(accountId) => navigate(`/crm/accounts/${accountId}`)}
        />
      )
    },
    { 
      key: 'emails', 
      label: 'Emails', 
      content: <EmailsTab 
        entityId={leadId} 
        entityType="lead"
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
          first_name: lead?.first_name || '',
          last_name: lead?.last_name || '',
          email: lead?.email || ''
        }}
      />
    },
    { 
      key: 'calls', 
      label: 'Calls', 
      content: <CallsTab 
        entityId={leadId} 
        entityType="lead"
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
        entityId={leadId} 
        entityType="lead"
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
        entityData={lead ? { first_name: lead.first_name, last_name: lead.last_name } : undefined}
      />
    },
    { 
      key: 'tasks', 
      label: 'Tasks', 
      content: <TasksTab 
        entityId={leadId} 
        entityType="lead"
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
      content: <AttachmentsTab entityType="lead" entityId={leadId} />
    },
    { 
      key: 'timeline', 
      label: 'Timeline', 
      content: <TimelineTab 
        data={lead}
        entityId={leadId} 
        entityType="lead" 
        auditFields={{
          createdAt: 'created_at',
          createdBy: 'created_by_name',
          updatedAt: 'updated_at',
          updatedBy: 'updated_by_name'
        }}
      />
    }
  ], [lead, leadId, handleFieldUpdate, validateEmail, validatePhone, navigate, isCreateTaskOpen, isEditTaskOpen, taskFormData, editingTask, handleCreateTask, handleEditTask, handleCloseCreateTask, handleCloseEditTask, isCreateCallOpen, isEditCallOpen, callFormData, editingCall, handleCreateCall, handleEditCall, handleCloseCreateCall, handleCloseEditCall, isCreateEmailOpen, isEditEmailOpen, emailFormData, editingEmail, handleCreateEmail, handleEditEmail, handleCloseCreateEmail, handleCloseEditEmail])

  if (isLoading) return <div className="p-6">Loading lead...</div>
  if (error) return <div className="p-6 text-red-600">Error loading lead: {error.message}</div>
  if (!lead) return <div className="p-6 text-gray-600">Lead not found</div>

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
          {widgets.find(w => w.id === 'leadScore')?.isVisible && (
            <LeadScoreWidget score={lead?.score || 0} maxScore={100} />
          )}
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
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {lead.first_name.charAt(0).toUpperCase()}{lead.last_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lead.first_name} {lead.last_name}
                  </h1>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    ({lead.title || 'No title specified'})
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex items-center gap-1">
                    <Building2 
                      className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" 
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {lead.account ? lead.company_name : (lead.company_name || 'No company specified')}
                    </p>
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
            { id: 'new', title: 'New', isActive: lead.lead_status === 'new' },
            { id: 'contacted', title: 'Contacted', isActive: lead.lead_status === 'contacted' },
            { id: 'qualified', title: 'Qualified', isActive: lead.lead_status === 'qualified' },
            { id: 'proposal', title: 'Proposal', isActive: lead.lead_status === 'proposal' },
            { id: 'closed', title: 'Close', isActive: lead.lead_status === 'closed' }
          ]}
          onStageClick={handlePipelineStageClick}
        />
      </div>

      {/* Tab Container */}
      <div className="mb-6 min-h-[600px]">
        <TabContainer
          preserveTabState={true}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabKey: string) => setActiveTab(tabKey as 'overview' | 'attachments' | 'emails' | 'calls' | 'meetings' | 'tasks' | 'timeline')}
        />
      </div>

      {/* Lead Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
                Lead Closure
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
                You're marking this lead as closed. What would you like to do?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleClosureChoice('convert')}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Convert Lead
                </button>
                
                <button
                  onClick={() => handleClosureChoice('delete')}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete Lead
                </button>
              </div>
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Modal */}
      {lead && (
        <LeadConversionModal
          lead={lead}
          companyName={lead.company_name}
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConvert={handleConversionSubmit}
          isConverting={convertLead.isPending}
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

      {/* Edit Modal */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        lead={lead}
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
        entityData={lead ? { first_name: lead.first_name, last_name: lead.last_name } : undefined}
        entityType="lead"
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
        entityData={lead ? {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email || ''
        } : undefined}
        entityType="lead"
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
          contact_id: leadId,
          first_name: lead?.first_name || '',
          last_name: lead?.last_name || '',
          email: lead?.email || '',
          phone: lead?.phone || ''
        }]}
        isCreatePending={createMeetingMutation.isPending}
        isUpdatePending={updateMeetingMutation.isPending}
      />
      </div>
    </WidgetLayout>
  )
}