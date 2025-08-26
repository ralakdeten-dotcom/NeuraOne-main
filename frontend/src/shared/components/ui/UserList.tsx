import React from 'react'
import { UserCard } from './UserCard'
import { Search, Filter } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  phone?: string
  company?: string
  avatar?: string
  role?: string
}

interface UserListProps {
  users: User[]
  title?: string
  onUserClick?: (user: User) => void
  onSearch?: (query: string) => void
  onFilter?: () => void
  loading?: boolean
  emptyMessage?: string
  className?: string
  variant?: 'grid' | 'list'
}

export const UserList: React.FC<UserListProps> = ({
  users,
  title = 'Users',
  onUserClick,
  onSearch,
  onFilter,
  loading = false,
  emptyMessage = 'No users found',
  className = '',
  variant = 'list'
}) => {
  const handleUserClick = (user: User) => {
    if (onUserClick) {
      onUserClick(user)
    }
  }

  const renderUserCard = (user: User) => (
    <UserCard
      key={user.id}
      user={user}
      onClick={() => handleUserClick(user)}
      className={variant === 'grid' ? 'h-full' : ''}
      showActions={true}
      actions={
        <div className="flex space-x-1">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            <Search className="w-3 h-3" />
          </button>
        </div>
      }
    />
  )

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg mb-3" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title} ({users.length})
        </h2>
        <div className="flex items-center space-x-2">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-8 pr-4 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
          {onFilter && (
            <button
              onClick={onFilter}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>{emptyMessage}</p>
        </div>
      ) : variant === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(renderUserCard)}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(renderUserCard)}
        </div>
      )}
    </div>
  )
}

export default UserList 