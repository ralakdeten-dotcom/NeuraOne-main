import React, { useState, useRef, useEffect } from 'react'
import { X, Move } from 'lucide-react'

export interface LogContainerProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  initialPosition?: { x: number; y: number }
  width?: string
  height?: string
  className?: string
}

// Helper function to calculate center position
const getCenterPosition = (containerWidth: string, containerHeight: string) => {
  const widthNum = parseInt(containerWidth) || 500
  const heightNum = containerHeight === 'auto' ? 400 : parseInt(containerHeight) || 400
  
  return {
    x: Math.max(0, (window.innerWidth - widthNum) / 2),
    y: Math.max(0, (window.innerHeight - heightNum) / 2)
  }
}

export const LogContainer: React.FC<LogContainerProps> = ({
  title,
  isOpen,
  onClose,
  children,
  initialPosition,
  width = '500px',
  height = 'auto',
  className = ''
}) => {
  // Use center position as default if no initialPosition provided
  const defaultPosition = initialPosition || getCenterPosition(width, height)
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the header, not buttons
    if ((e.target as HTMLElement).closest('button')) return
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragOffset])

  // Reset position when container opens (if no custom initial position)
  useEffect(() => {
    if (isOpen && !initialPosition) {
      setPosition(getCenterPosition(width, height))
    }
  }, [isOpen, initialPosition, width, height])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Movable Container */}
      <div
        ref={containerRef}
        className={`fixed z-30 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 ${className}`}
        style={{
          left: position.x,
          top: position.y,
          width,
          height,
          minWidth: '300px',
          minHeight: '200px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        {/* Header - Exact Sidebar Color */}
        <div
          ref={headerRef}
          className="bg-[#14235f] dark:bg-[#14235f] text-white px-4 py-3 rounded-t-lg cursor-grab active:cursor-grabbing select-none flex items-center justify-between"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move size={16} className="text-gray-300" />
            <h3 className="font-medium text-white">{title}</h3>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 rounded transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area - Main Content Background */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg overflow-auto" style={{
          height: height === 'auto' ? 'auto' : `calc(${height} - 60px)`, // Subtract header height
          maxHeight: 'calc(90vh - 60px)'
        }}>
          {children}
        </div>
      </div>
    </>
  )
}