import React from 'react'

interface LogoProps {
  variant?: 'dark' | 'white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'dark', 
  size = 'md', 
  showText = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/favicon.svg" 
        alt="NeuraCRM Logo" 
        className={`${sizeClasses[size]} flex-shrink-0`}
      />
      {showText && (
        <span className={`ml-2 font-semibold tracking-wide ${
          variant === 'white' 
            ? 'text-white' 
            : 'text-gray-900 dark:text-white'
        } ${textSizes[size]}`}>
          NeuraCRM
        </span>
      )}
    </div>
  )
}

export default Logo 