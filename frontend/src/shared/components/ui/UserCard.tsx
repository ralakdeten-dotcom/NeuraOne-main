import React from 'react'
import { Mail, Phone, Building2 } from 'lucide-react'

interface UserCardProps {
  user: {
    id: number
    name: string
    email: string
    phone?: string
    company?: string
    avatar?: string
    role?: string
  }
  variant?: 'default' | 'compact' | 'detailed'
  onClick?: () => void
  className?: string
  showActions?: boolean
  actions?: React.ReactNode
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'default',
  onClick,
  className = '',
  showActions = false,
  actions
}) => {
  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3'
      case 'detailed':
        return 'p-6'
      default:
        return 'p-4'
    }
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 ${getVariantClasses()} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {getAvatarInitials(user.name)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </h3>
              {user.role && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role}
                </p>
              )}
            </div>
            {showActions && actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            
            {user.phone && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{user.phone}</span>
              </div>
            )}
            
            {user.company && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{user.company}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserCard 