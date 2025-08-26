import React from 'react'

interface PipelineStageProps {
  title: string
  onClick?: () => void
  isActive?: boolean
  isCompleted?: boolean
  className?: string
  customColor?: string
}

export const PipelineStage: React.FC<PipelineStageProps> = ({
  title,
  onClick,
  isActive = false,
  isCompleted = false,
  className = '',
  customColor
}) => {
  const getStageClasses = () => {
    if (customColor && (isActive || isCompleted)) {
      return customColor
    }
    if (isActive || isCompleted) {
      return 'bg-[#14225f] dark:bg-gray-800' // Light: #14225f, Dark: same as TitleBox
    }
    return 'bg-gray-400 dark:bg-gray-600' // Light: light gray, Dark: darker gray
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative inline-block h-8 flex-1 text-white font-medium text-sm
        transition-all duration-100 ease-out
        hover:opacity-80 focus:outline-none focus:ring-0 border-0
        ${getStageClasses()}
        ${className}
      `}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)'
      }}
    >
      <span className="relative z-10">{title}</span>
    </button>
  )
}

interface PipelineProps {
  stages: Array<{
    id: string
    title: string
    isActive?: boolean
    customColor?: string
  }>
  onStageClick?: (stageId: string) => void
  className?: string
}

export const Pipeline: React.FC<PipelineProps> = ({
  stages,
  onStageClick,
  className = ''
}) => {
  // Find the index of the active stage
  const activeStageIndex = stages.findIndex(stage => stage.isActive)

  return (
    <div className={`flex items-center ${className}`}>
      {stages.map((stage, index) => (
        <PipelineStage
          key={stage.id}
          title={stage.title}
          isActive={stage.isActive}
          isCompleted={activeStageIndex !== -1 && index < activeStageIndex}
          onClick={() => onStageClick?.(stage.id)}
          className={index > 0 ? '-ml-4' : ''}
          customColor={stage.customColor}
        />
      ))}
    </div>
  )
}