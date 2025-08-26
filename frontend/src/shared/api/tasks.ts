import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiBaseUrl } from '@/utils/tenant'
import axios from '@/core/api/axios'

// Task types
export interface Task {
  id: number
  serial_number: number
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  status: 'pending' | 'completed'
  status_display: string
  deadline?: string
  completed_at?: string
  created_by: number
  created_by_name: string
  created_by_email: string
  content_type?: number
  object_id?: number
  entity_type?: string
  entity_id?: number
  estimated_hours?: number
  actual_hours?: number
  tags: string[]
  created_at: string
  updated_at: string
  is_active: boolean
  is_overdue: boolean
  days_until_deadline?: number
  comments?: TaskComment[]
  comment_count: number
}

export interface TaskComment {
  id: number
  content: string
  author: number
  author_name: string
  author_email: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface TaskListItem {
  id: number
  serial_number: number
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_display: string
  status: 'pending' | 'completed'
  status_display: string
  deadline?: string
  created_by_name: string
  entity_type?: string
  entity_id?: number
  created_at: string
  updated_at: string
  is_overdue: boolean
  days_until_deadline?: number
}

export interface TaskCreate {
  title: string
  description?: string
  priority: '' | 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'completed'
  deadline?: string
  estimated_hours?: number
  tags?: string[]
  entity_type?: string
  entity_id?: number
}

export interface TaskUpdate {
  title?: string
  description?: string
  priority?: '' | 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'completed'
  deadline?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  is_active?: boolean
}

export interface TaskStats {
  total_tasks: number
  pending_tasks: number
  completed_tasks: number
  overdue_tasks: number
  high_priority_tasks: number
  my_tasks: number
  created_by_me: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API functions
const getApiUrl = () => {
  const baseUrl = getApiBaseUrl()
  const apiUrl = `${baseUrl}/api/tasks/`
  console.log('🔍 Tasks API URL:', apiUrl)
  
  // Debug auth tokens
  const tokens = localStorage.getItem('auth_tokens')
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens)
      console.log('🔑 Auth tokens available:', {
        has_access_token: !!parsed.access_token,
        token_preview: parsed.access_token ? parsed.access_token.substring(0, 20) + '...' : 'none'
      })
    } catch (e) {
      console.error('🚫 Error parsing auth tokens:', e)
    }
  } else {
    console.warn('🚫 No auth tokens found in localStorage')
  }
  
  return apiUrl
}

const taskApi = {
  // Get all tasks with filters
  getTasks: async (params?: {
    page?: number
    pageSize?: number
    status?: string
    priority?: string
    created_by?: string | number
    entity_type?: string
    entity_id?: number
    overdue?: boolean
    search?: string
  }): Promise<PaginatedResponse<TaskListItem>> => {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.created_by) searchParams.append('created_by', params.created_by.toString())
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type)
    if (params?.entity_id) searchParams.append('entity_id', params.entity_id.toString())
    if (params?.overdue) searchParams.append('overdue', 'true')
    if (params?.search) searchParams.append('search', params.search)

    const url = `${getApiUrl()}?${searchParams.toString()}`
    console.log('🔍 Fetching tasks from:', url)
    const response = await axios.get(url)
    console.log('🔍 Tasks response:', response.data)
    
    // Ensure we return the correct paginated format
    if (response.data && typeof response.data === 'object') {
      return response.data
    } else {
      console.warn('Unexpected API response format:', response.data)
      return { count: 0, next: null, previous: null, results: [] }
    }
  },

  // Get single task
  getTask: async (id: number): Promise<Task> => {
    const response = await axios.get(`${getApiUrl()}${id}/`)
    return response.data
  },

  // Create task
  createTask: async (data: TaskCreate): Promise<Task> => {
    const response = await axios.post(getApiUrl(), data)
    return response.data
  },

  // Update task
  updateTask: async (id: number, data: TaskUpdate): Promise<Task> => {
    const response = await axios.patch(`${getApiUrl()}${id}/`, data)
    return response.data
  },

  // Delete task (soft delete)
  deleteTask: async (id: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}${id}/`)
  },

  // Get my tasks
  getMyTasks: async (status?: string): Promise<TaskListItem[]> => {
    const url = status 
      ? `${getApiUrl()}my-tasks/?status=${status}`
      : `${getApiUrl()}my-tasks/`
    const response = await axios.get(url)
    // Handle both paginated and direct array responses
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    } else {
      console.warn('Unexpected API response format:', response.data)
      return []
    }
  },

  // Get tasks for specific entity
  getEntityTasks: async (entityType: string, entityId: number): Promise<TaskListItem[]> => {
    const response = await axios.get(`${getApiUrl()}${entityType}/${entityId}/`)
    // Handle both paginated and direct array responses
    if (response.data && Array.isArray(response.data)) {
      return response.data
    } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results
    } else {
      console.warn('Unexpected API response format:', response.data)
      return []
    }
  },

  // Create task for entity
  createEntityTask: async (entityType: string, entityId: number, data: TaskCreate): Promise<Task> => {
    // Remove entity linking fields since the backend gets them from URL path
    const { entity_type, entity_id, ...taskData } = data
    const response = await axios.post(`${getApiUrl()}${entityType}/${entityId}/`, taskData)
    return response.data
  },

  // Complete task
  completeTask: async (id: number): Promise<Task> => {
    const response = await axios.post(`${getApiUrl()}${id}/complete/`)
    return response.data
  },


  // Get task statistics
  getTaskStats: async (): Promise<TaskStats> => {
    const response = await axios.get(`${getApiUrl()}stats/`)
    return response.data
  },

  // Task comments
  getTaskComments: async (taskId: number): Promise<TaskComment[]> => {
    const response = await axios.get(`${getApiUrl()}${taskId}/comments/`)
    return response.data
  },

  createTaskComment: async (taskId: number, content: string): Promise<TaskComment> => {
    const response = await axios.post(`${getApiUrl()}${taskId}/comments/`, { content })
    return response.data
  },

  updateTaskComment: async (commentId: number, content: string): Promise<TaskComment> => {
    const response = await axios.patch(`${getApiUrl()}comments/${commentId}/`, { content })
    return response.data
  },

  deleteTaskComment: async (commentId: number): Promise<void> => {
    await axios.delete(`${getApiUrl()}comments/${commentId}/`)
  }
}

// React Query hooks
export const useTasks = (params?: Parameters<typeof taskApi.getTasks>[0]) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskApi.getTasks(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTask = (id: number) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getTask(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'tasks' || 
                 queryKey === 'task' ||
                 queryKey === 'my-tasks' ||
                 queryKey === 'entity-tasks' ||
                 queryKey === 'task-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdate }) => 
      taskApi.updateTask(id, data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['task', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'tasks' || 
                 queryKey === 'task' ||
                 queryKey === 'my-tasks' ||
                 queryKey === 'entity-tasks' ||
                 queryKey === 'task-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'tasks' || 
                 queryKey === 'task' ||
                 queryKey === 'my-tasks' ||
                 queryKey === 'entity-tasks' ||
                 queryKey === 'task-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useMyTasks = (status?: string) => {
  return useQuery({
    queryKey: ['my-tasks', status],
    queryFn: () => taskApi.getMyTasks(status),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useEntityTasks = (entityType: string, entityId: number) => {
  return useQuery({
    queryKey: ['entity-tasks', entityType, entityId],
    queryFn: () => taskApi.getEntityTasks(entityType, entityId),
    enabled: !!entityType && !!entityId && entityType !== 'standalone',
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateEntityTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { 
      entityType: string; 
      entityId: number; 
      data: TaskCreate 
    }) => taskApi.createEntityTask(entityType, entityId, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'tasks' || 
                 queryKey === 'task' ||
                 queryKey === 'my-tasks' ||
                 queryKey === 'entity-tasks' ||
                 queryKey === 'task-stats'
        },
        type: 'active'
      })
    },
  })
}

export const useCompleteTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taskApi.completeTask,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['task', data.id]
      })
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'tasks' || 
                 queryKey === 'task' ||
                 queryKey === 'my-tasks' ||
                 queryKey === 'entity-tasks' ||
                 queryKey === 'task-stats'
        },
        type: 'active'
      })
    },
  })
}


export const useTaskStats = () => {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: taskApi.getTaskStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTaskComments = (taskId: number) => {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => taskApi.getTaskComments(taskId),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateTaskComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: number; content: string }) => 
      taskApi.createTaskComment(taskId, content),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ 
        queryKey: ['task-comments', variables.taskId]
      })
      await queryClient.invalidateQueries({ 
        queryKey: ['task', variables.taskId]
      })
    },
  })
}

export const useUpdateTaskComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) => 
      taskApi.updateTaskComment(commentId, content),
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'task-comments' || queryKey === 'task'
        },
        type: 'active'
      })
    },
  })
}

export const useDeleteTaskComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: taskApi.deleteTaskComment,
    onSuccess: async () => {
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string
          return queryKey === 'task-comments' || queryKey === 'task'
        },
        type: 'active'
      })
    },
  })
}

export default taskApi