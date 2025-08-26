import React from 'react'
import { UserCard } from '@/shared/components/ui/UserCard'
import { Edit, Trash2 } from 'lucide-react'

interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name?: string
  title?: string
  avatar?: string
}

interface ContactUserCardProps {
  contact: Contact
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  onClick?: (contact: Contact) => void
  className?: string
}

export const ContactUserCard: React.FC<ContactUserCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onClick,
  className = ''
}) => {
  // Transform contact data to match UserCard interface
  const userData = {
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.phone,
    company: contact.company_name,
    avatar: contact.avatar,
    role: contact.title
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(contact)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(contact)
    }
  }

  const actions = (
    <div className="flex space-x-1">
      {onEdit && (
        <button
          onClick={handleEdit}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
          title="Edit contact"
        >
          <Edit className="w-3 h-3" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
          title="Delete contact"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )

  return (
    <UserCard
      user={userData}
      onClick={() => onClick?.(contact)}
      className={className}
      showActions={true}
      actions={actions}
    />
  )
}

export default ContactUserCard 