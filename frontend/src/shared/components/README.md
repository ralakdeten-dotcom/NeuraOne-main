# Creating Reusable Sub-Components in React

This guide explains how to create reusable sub-components that can be used across different apps in a React application.

## Table of Contents

1. [Basic Patterns](#basic-patterns)
2. [Component Composition](#component-composition)
3. [Data Transformation](#data-transformation)
4. [Variant System](#variant-system)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Basic Patterns

### 1. Shared Base Component

Create a base component with a flexible interface:

```tsx
// shared/components/ui/UserCard.tsx
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
  // Component implementation
}
```

### 2. App-Specific Wrapper

Create app-specific wrappers that transform data and add app-specific functionality:

```tsx
// apps/crm/contacts/components/ContactUserCard.tsx
interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name?: string
  title?: string
}

export const ContactUserCard: React.FC<ContactUserCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onClick
}) => {
  // Transform contact data to match UserCard interface
  const userData = {
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email,
    phone: contact.phone,
    company: contact.company_name,
    role: contact.title
  }

  return (
    <UserCard
      user={userData}
      onClick={() => onClick?.(contact)}
      showActions={true}
      actions={
        <div className="flex space-x-1">
          <button onClick={() => onEdit?.(contact)}>
            <Edit className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete?.(contact)}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      }
    />
  )
}
```

## Component Composition

### 1. Container Components

Create container components that use multiple sub-components:

```tsx
// shared/components/ui/UserList.tsx
export const UserList: React.FC<UserListProps> = ({
  users,
  title = 'Users',
  onUserClick,
  onSearch,
  onFilter,
  variant = 'list'
}) => {
  const renderUserCard = (user: User) => (
    <UserCard
      key={user.id}
      user={user}
      onClick={() => onUserClick?.(user)}
      className={variant === 'grid' ? 'h-full' : ''}
      showActions={true}
      actions={/* app-specific actions */}
    />
  )

  return (
    <div>
      {/* Header with search/filter */}
      {variant === 'grid' ? (
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
```

### 2. Higher-Order Components (HOCs)

Create HOCs to add functionality to base components:

```tsx
// shared/components/hoc/withLoading.tsx
export const withLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & { loading?: boolean }) => {
    if (props.loading) {
      return <LoadingSpinner />
    }
    return <Component {...(props as P)} />
  }
}

// Usage
const UserCardWithLoading = withLoading(UserCard)
```

## Data Transformation

### 1. Adapter Pattern

Create adapters to transform data between different formats:

```tsx
// shared/utils/adapters.ts
export const transformContactToUser = (contact: Contact): User => ({
  id: contact.id,
  name: `${contact.first_name} ${contact.last_name}`,
  email: contact.email,
  phone: contact.phone,
  company: contact.company_name,
  role: contact.title
})

export const transformTeamMemberToUser = (member: TeamMember): User => ({
  id: member.id,
  name: member.name,
  email: member.email,
  phone: member.phone,
  company: member.department,
  role: member.role
})
```

### 2. Render Props Pattern

Use render props for flexible rendering:

```tsx
// shared/components/ui/DataCard.tsx
interface DataCardProps<T> {
  data: T
  renderContent: (data: T) => React.ReactNode
  renderActions?: (data: T) => React.ReactNode
  onClick?: (data: T) => void
}

export const DataCard = <T extends object>({
  data,
  renderContent,
  renderActions,
  onClick
}: DataCardProps<T>) => {
  return (
    <div onClick={() => onClick?.(data)}>
      {renderContent(data)}
      {renderActions && renderActions(data)}
    </div>
  )
}
```

## Variant System

### 1. Variant Props

Use variant props to control component appearance:

```tsx
interface ComponentProps {
  variant?: 'default' | 'compact' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark'
}

const getVariantClasses = (variant: string) => {
  switch (variant) {
    case 'compact': return 'p-3'
    case 'detailed': return 'p-6'
    default: return 'p-4'
  }
}
```

### 2. Compound Components

Create compound components for complex UIs:

```tsx
// shared/components/ui/Card.tsx
interface CardContextValue {
  variant: string
  size: string
}

const CardContext = React.createContext<CardContextValue | null>(null)

export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader
  Body: typeof CardBody
  Footer: typeof CardFooter
} = ({ children, variant = 'default', size = 'md' }) => {
  return (
    <CardContext.Provider value={{ variant, size }}>
      <div className={`card card-${variant} card-${size}`}>
        {children}
      </div>
    </CardContext.Provider>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
```

## Best Practices

### 1. Interface Design

- **Keep interfaces flexible**: Use optional props and sensible defaults
- **Use TypeScript**: Define clear interfaces for props and data
- **Composition over inheritance**: Prefer composition patterns

### 2. File Organization

```
shared/
  components/
    ui/                    # Base UI components
      UserCard.tsx
      Button.tsx
      Modal.tsx
    hoc/                   # Higher-order components
      withLoading.tsx
      withErrorBoundary.tsx
    adapters/              # Data transformation
      userAdapters.ts
    index.ts               # Main exports
```

### 3. Export Strategy

```tsx
// shared/components/index.ts
export * from './ui'
export * from './hoc'
export * from './adapters'

// shared/components/ui/index.ts
export { UserCard } from './UserCard'
export { UserList } from './UserList'
export { Button } from './Button'
```

### 4. Testing Strategy

```tsx
// shared/components/ui/__tests__/UserCard.test.tsx
describe('UserCard', () => {
  it('renders user information correctly', () => {
    const user = { id: 1, name: 'John Doe', email: 'john@example.com' }
    render(<UserCard user={user} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    const user = { id: 1, name: 'John Doe', email: 'john@example.com' }
    render(<UserCard user={user} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

## Examples

### 1. Basic Usage

```tsx
// In any app
import { UserCard } from '@/shared/components/ui/UserCard'

const MyComponent = () => {
  const user = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Developer'
  }

  return (
    <UserCard
      user={user}
      onClick={() => console.log('User clicked')}
      variant="compact"
    />
  )
}
```

### 2. App-Specific Wrapper

```tsx
// In CRM app
import { ContactUserCard } from '@/apps/crm/contacts/components/ContactUserCard'

const ContactsList = () => {
  const contacts = [/* contact data */]

  return (
    <div>
      {contacts.map(contact => (
        <ContactUserCard
          key={contact.id}
          contact={contact}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

### 3. Container Component

```tsx
// In any app
import { UserList } from '@/shared/components/ui/UserList'

const TeamPage = () => {
  const users = [/* user data */]

  return (
    <UserList
      users={users}
      title="Team Members"
      onUserClick={handleUserClick}
      onSearch={handleSearch}
      variant="grid"
    />
  )
}
```

## Key Benefits

1. **Reusability**: Components can be used across different apps
2. **Consistency**: Shared components ensure UI consistency
3. **Maintainability**: Changes to base components propagate everywhere
4. **Type Safety**: TypeScript interfaces ensure correct usage
5. **Flexibility**: Variants and props allow customization
6. **Testing**: Shared components can be thoroughly tested once

## Common Patterns

1. **Base Component + Wrapper**: Create a flexible base component and app-specific wrappers
2. **Data Transformation**: Use adapters to transform data between formats
3. **Variant System**: Use variant props to control appearance
4. **Composition**: Build complex UIs from simple components
5. **Render Props**: Use render props for flexible rendering
6. **HOCs**: Use HOCs to add functionality to components

This approach allows you to create a robust, reusable component system that can scale across multiple applications while maintaining consistency and reducing code duplication. 