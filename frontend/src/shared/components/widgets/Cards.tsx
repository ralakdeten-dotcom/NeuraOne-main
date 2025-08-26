import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CardProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
  // Expandable props
  expandable?: boolean
  defaultExpanded?: boolean
  onExpandToggle?: (expanded: boolean) => void
  expandedContent?: React.ReactNode
  collapsedContent?: React.ReactNode
  expandButtonPosition?: 'header' | 'title' | 'custom'
  showExpandIcon?: boolean
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  onClick,
  header,
  footer,
  variant = 'default',
  size = 'md',
  expandable = false,
  defaultExpanded = false,
  onExpandToggle,
  expandedContent,
  collapsedContent,
  expandButtonPosition = 'title',
  showExpandIcon = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const handleExpandToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onExpandToggle?.(newExpanded)
  }
  
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg transition-all duration-200'
  
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-600',
    outlined: 'border-2 border-gray-300 dark:border-gray-500',
    elevated: 'shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700'
  }
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const interactiveClasses = onClick && !expandable ? 'cursor-pointer hover:shadow-sm' : ''
  
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${interactiveClasses} ${className}`
  
  const ExpandButton = () => (
    <button
      onClick={handleExpandToggle}
      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={isExpanded ? 'Collapse' : 'Expand'}
    >
      {showExpandIcon && (
        isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )
      )}
    </button>
  )
  
  return (
    <div className={cardClasses} onClick={!expandable ? onClick : undefined}>
      {header && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <div className="flex-1">{header}</div>
          {expandable && expandButtonPosition === 'header' && <ExpandButton />}
        </div>
      )}
      
      {(title || subtitle) && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {expandable && expandButtonPosition === 'title' && <ExpandButton />}
          </div>
        </div>
      )}
      
      {/* Collapsible Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expandable && !isExpanded ? 'max-h-0 opacity-0' : 'max-h-none opacity-100'
        }`}
      >
        {expandable ? (
          <div className="text-gray-700 dark:text-gray-300">
            {isExpanded ? expandedContent : collapsedContent}
          </div>
        ) : (
          children && (
            <div className="text-gray-700 dark:text-gray-300">
              {children}
            </div>
          )
        )}
      </div>
      
      {/* Always visible content when not expanded */}
      {expandable && !isExpanded && collapsedContent && (
        <div className="text-gray-700 dark:text-gray-300">
          {collapsedContent}
        </div>
      )}
      
      {footer && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          {footer}
        </div>
      )}
      
      {/* Custom expand button position */}
      {expandable && expandButtonPosition === 'custom' && (
        <div className="mt-2 flex justify-center">
          <ExpandButton />
        </div>
      )}
    </div>
  )
}

interface CardGroupProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

export const CardGroup: React.FC<CardGroupProps> = ({
  children,
  className = '',
  cols = 1,
  gap = 'md'
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
  
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
  
  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string | number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: React.ReactNode
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  className = ''
}) => {
  const changeColors = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }
  
  return (
    <Card variant="elevated" className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[change.type]}`}>
              {change.type === 'increase' && '↗'} 
              {change.type === 'decrease' && '↘'} 
              {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}