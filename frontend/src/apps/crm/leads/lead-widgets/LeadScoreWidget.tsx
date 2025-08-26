import React from 'react'
import { Card } from '@/shared/components/widgets'

interface LeadScoreWidgetProps {
  score?: number
  maxScore?: number
  className?: string
}

export const LeadScoreWidget: React.FC<LeadScoreWidgetProps> = ({
  score = 0,
  maxScore = 100,
  className = ''
}) => {
  // Calculate percentage for the speedometer
  const percentage = Math.min((score / maxScore) * 100, 100)
  
  // Calculate rotation angle (-90 to 90 degrees for semicircle)
  const angle = (percentage / 100) * 180 - 90
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e' // green
    if (score >= 60) return '#eab308' // yellow
    if (score >= 40) return '#f97316' // orange
    return '#ef4444' // red
  }
  
  const scoreColor = getScoreColor(percentage)
  
  return (
    <Card
      title="Lead Score"
      variant="elevated"
      className={className}
    >
      <div className="flex items-center justify-center space-x-6">
        {/* Left side - Score display and status */}
        <div className="space-y-3">
          {/* Score display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              out of {maxScore}
            </div>
          </div>
          
          {/* Score status (below score) */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: scoreColor }}
            />
            <span className="text-sm font-medium" style={{ color: scoreColor }}>
              {percentage >= 80 ? 'Excellent' : 
               percentage >= 60 ? 'Good' : 
               percentage >= 40 ? 'Fair' : 
               'Poor'}
            </span>
          </div>
        </div>
        
        {/* Right side - Speedometer */}
        <div className="relative w-32 h-20 overflow-hidden flex-shrink-0">
          {/* Background arc */}
          <svg
            className="w-full h-full"
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background semicircle */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              className="dark:stroke-gray-600"
            />
            
            {/* Progress arc */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={`${(percentage / 100) * 251.3} 251.3`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            
            {/* Center dot */}
            <circle
              cx="100"
              cy="80"
              r="4"
              fill="#374151"
              className="dark:fill-gray-400"
            />
            
            {/* Needle */}
            <line
              x1="100"
              y1="80"
              x2="100"
              y2="25"
              stroke="#374151"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${angle} 100 80)`}
              className="transition-all duration-500 dark:stroke-gray-400"
            />
          </svg>
          
          {/* Score markers */}
          <div className="absolute inset-0 flex items-end justify-between px-2 pb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">0</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{maxScore}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}