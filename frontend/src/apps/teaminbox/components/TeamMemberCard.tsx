import React from 'react'
import { UserCard } from '@/shared/components/ui/UserCard'
import { MessageCircle, Phone, Video } from 'lucide-react'

interface TeamMember {
  id: number
  name: string
  email: string
  phone?: string
  department?: string
  avatar?: string
  role?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
}

interface TeamMemberCardProps {
  member: TeamMember
  onMessage?: (member: TeamMember) => void
  onCall?: (member: TeamMember) => void
  onVideoCall?: (member: TeamMember) => void
  onClick?: (member: TeamMember) => void
  className?: string
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onMessage,
  onCall,
  onVideoCall,
  onClick,
  className = ''
}) => {
  // Transform member data to match UserCard interface
  const userData = {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    company: member.department,
    avatar: member.avatar,
    role: member.role
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMessage) {
      onMessage(member)
    }
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onCall) {
      onCall(member)
    }
  }

  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onVideoCall) {
      onVideoCall(member)
    }
  }

  const actions = (
    <div className="flex space-x-1">
      {onMessage && (
        <button
          onClick={handleMessage}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
          title="Send message"
        >
          <MessageCircle className="w-3 h-3" />
        </button>
      )}
      {onCall && (
        <button
          onClick={handleCall}
          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 p-1"
          title="Call"
        >
          <Phone className="w-3 h-3" />
        </button>
      )}
      {onVideoCall && (
        <button
          onClick={handleVideoCall}
          className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-1"
          title="Video call"
        >
          <Video className="w-3 h-3" />
        </button>
      )}
    </div>
  )

  return (
    <div className="relative">
      <UserCard
        user={userData}
        onClick={() => onClick?.(member)}
        className={className}
        showActions={true}
        actions={actions}
      />
      {/* Status indicator */}
      {member.status && (
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(member.status)} border-2 border-white dark:border-gray-800`} />
      )}
    </div>
  )
}

export default TeamMemberCard 