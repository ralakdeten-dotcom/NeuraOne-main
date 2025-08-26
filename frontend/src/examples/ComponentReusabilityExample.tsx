import React, { useState } from 'react'
import { UserCard } from '@/shared/components/ui/UserCard'
import { UserList } from '@/shared/components/ui/UserList'
import { ContactUserCard } from '@/apps/crm/contacts/components/ContactUserCard'
import { TeamMemberCard } from '@/apps/teaminbox/components/TeamMemberCard'

// Example data
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    role: 'Software Engineer',
    avatar: undefined
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    company: 'Tech Solutions',
    role: 'Product Manager',
    avatar: undefined
  }
]

const mockContacts = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company_name: 'Acme Corp',
    title: 'Software Engineer'
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    company_name: 'Tech Solutions',
    title: 'Product Manager'
  }
]

const mockTeamMembers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    department: 'Engineering',
    role: 'Senior Developer',
    status: 'online' as const
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    department: 'Product',
    role: 'Product Manager',
    status: 'away' as const
  }
]

export const ComponentReusabilityExample: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleUserClick = (user: any) => {
    setSelectedUser(user)
    console.log('User clicked:', user)
  }

  const handleContactEdit = (contact: any) => {
    console.log('Edit contact:', contact)
  }

  const handleContactDelete = (contact: any) => {
    console.log('Delete contact:', contact)
  }

  const handleTeamMemberMessage = (member: any) => {
    console.log('Message member:', member)
  }

  const handleTeamMemberCall = (member: any) => {
    console.log('Call member:', member)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    console.log('Search query:', query)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Component Reusability Examples
      </h1>

      {/* Example 1: Basic UserCard Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Example 1: Basic UserCard Usage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onClick={() => handleUserClick(user)}
              variant="default"
            />
          ))}
        </div>
      </section>

      {/* Example 2: UserList with Search */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Example 2: UserList with Search and Filter
        </h2>
        <UserList
          users={mockUsers}
          title="Team Members"
          onUserClick={handleUserClick}
          onSearch={handleSearch}
          onFilter={() => console.log('Filter clicked')}
          variant="grid"
        />
      </section>

      {/* Example 3: CRM Contact Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Example 3: CRM Contact Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockContacts.map(contact => (
            <ContactUserCard
              key={contact.id}
              contact={contact}
              onEdit={handleContactEdit}
              onDelete={handleContactDelete}
              onClick={handleUserClick}
            />
          ))}
        </div>
      </section>

      {/* Example 4: Team Management Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Example 4: Team Management Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTeamMembers.map(member => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onMessage={handleTeamMemberMessage}
              onCall={handleTeamMemberCall}
              onVideoCall={handleTeamMemberCall}
              onClick={handleUserClick}
            />
          ))}
        </div>
      </section>

      {/* Example 5: Different Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Example 5: Different UserCard Variants
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Compact Variant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockUsers.slice(0, 3).map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  variant="compact"
                  onClick={() => handleUserClick(user)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Detailed Variant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockUsers.slice(0, 2).map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  variant="detailed"
                  onClick={() => handleUserClick(user)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Selected User Display */}
      {selectedUser && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Selected User
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 dark:text-gray-300">
              {JSON.stringify(selectedUser, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  )
}

export default ComponentReusabilityExample 