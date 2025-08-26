import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ColumnManager } from './ColumnManager'
import type { ColumnConfig } from './DataTable'

const mockColumns: ColumnConfig[] = [
  {
    key: 'name',
    title: 'Name',
    locked: true
  },
  {
    key: 'email',
    title: 'Email',
    locked: false
  },
  {
    key: 'phone',
    title: 'Phone',
    locked: false
  }
]

const mockVisibleColumns = {
  name: true,
  email: true,
  phone: false
}

const mockOnVisibilityChange = vi.fn()

describe('ColumnManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders locked columns with lock icon and disabled styling', () => {
    render(
      <ColumnManager
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onVisibilityChange={mockOnVisibilityChange}
      />
    )

    // Open the dropdown
    fireEvent.click(screen.getByText('Columns (2)'))

    // Check that locked column has lock icon
    const nameColumn = screen.getByText('Name')
    expect(nameColumn).toBeInTheDocument()
    
    // The lock icon should be present (we can't easily test the icon directly, but we can check the parent structure)
    const nameRow = nameColumn.closest('div')
    expect(nameRow).toHaveClass('cursor-not-allowed')
  })

  it('prevents toggling locked columns', () => {
    render(
      <ColumnManager
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onVisibilityChange={mockOnVisibilityChange}
      />
    )

    // Open the dropdown
    fireEvent.click(screen.getByText('Columns (2)'))

    // Try to click on locked column
    const nameColumn = screen.getByText('Name')
    fireEvent.click(nameColumn)

    // Should not call onVisibilityChange for locked column
    expect(mockOnVisibilityChange).not.toHaveBeenCalled()
  })

  it('allows toggling unlocked columns', () => {
    render(
      <ColumnManager
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onVisibilityChange={mockOnVisibilityChange}
      />
    )

    // Open the dropdown
    fireEvent.click(screen.getByText('Columns (2)'))

    // Click on unlocked column
    const emailColumn = screen.getByText('Email')
    fireEvent.click(emailColumn)

    // Should call onVisibilityChange for unlocked column
    expect(mockOnVisibilityChange).toHaveBeenCalledWith({
      name: true,
      email: false,
      phone: false
    })
  })

  it('ensures locked columns remain visible when hiding all', () => {
    render(
      <ColumnManager
        columns={mockColumns}
        visibleColumns={mockVisibleColumns}
        onVisibilityChange={mockOnVisibilityChange}
      />
    )

    // Open the dropdown
    fireEvent.click(screen.getByText('Columns (2)'))

    // Click "Hide All"
    const hideAllButton = screen.getByText('Hide All')
    fireEvent.click(hideAllButton)

    // Should call onVisibilityChange with locked column still visible
    expect(mockOnVisibilityChange).toHaveBeenCalledWith({
      name: true, // Locked column should remain visible
      email: false,
      phone: false
    })
  })
}) 