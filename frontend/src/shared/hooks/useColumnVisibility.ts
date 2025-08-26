import { useState, useEffect, useCallback } from 'react'
import type { ColumnConfig } from '../components/tables/DataTable'
import type { ColumnVisibility } from '../components/tables/ColumnManager'

interface UseColumnVisibilityOptions {
  storageKey?: string
  defaultVisible?: string[]
}

export const useColumnVisibility = <T = any>(
  columns: ColumnConfig<T>[],
  options: UseColumnVisibilityOptions = {}
) => {
  const { storageKey, defaultVisible } = options
  
  // Initialize visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    // If storage key provided, try to load from localStorage
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`column-visibility-${storageKey}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Ensure locked columns are always visible
          columns.forEach(column => {
            if (column.locked) {
              parsed[column.key] = true
            }
          })
          return parsed
        }
      } catch (error) {
        console.warn('Failed to load column visibility from localStorage:', error)
      }
    }
    
    // Default: show all columns, or only specified columns if defaultVisible provided
    const initialVisibility: ColumnVisibility = {}
    columns.forEach(column => {
      // If defaultVisible is provided, use it; otherwise show all columns
      initialVisibility[column.key] = defaultVisible ? defaultVisible.includes(column.key) : true
      // Ensure locked columns are always visible
      if (column.locked) {
        initialVisibility[column.key] = true
      }
    })
    
    return initialVisibility
  })

  // Save to localStorage when visibility changes
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(
          `column-visibility-${storageKey}`,
          JSON.stringify(columnVisibility)
        )
      } catch (error) {
        console.warn('Failed to save column visibility to localStorage:', error)
      }
    }
  }, [columnVisibility, storageKey])

  // Update visibility when columns change
  useEffect(() => {
    setColumnVisibility(current => {
      const updated = { ...current }
      let hasChanges = false
      
      // Add new columns (visible by default)
      columns.forEach(column => {
        if (!(column.key in updated)) {
          updated[column.key] = defaultVisible ? defaultVisible.includes(column.key) : true
          hasChanges = true
        }
      })
      
      // Remove columns that no longer exist
      Object.keys(updated).forEach(key => {
        if (!columns.some(col => col.key === key)) {
          delete updated[key]
          hasChanges = true
        }
      })
      
      return hasChanges ? updated : current
    })
  }, [columns, defaultVisible])

  const updateColumnVisibility = useCallback((visibility: ColumnVisibility) => {
    // Ensure locked columns remain visible
    const updatedVisibility = { ...visibility }
    columns.forEach(column => {
      if (column.locked) {
        updatedVisibility[column.key] = true
      }
    })
    setColumnVisibility(updatedVisibility)
  }, [columns])

  const toggleColumn = useCallback((columnKey: string) => {
    setColumnVisibility(current => ({
      ...current,
      [columnKey]: !current[columnKey]
    }))
  }, [])

  const showAllColumns = useCallback(() => {
    const allVisible = columns.reduce((acc, column) => {
      acc[column.key] = true
      return acc
    }, {} as ColumnVisibility)
    setColumnVisibility(allVisible)
  }, [columns])

  const hideAllColumns = useCallback(() => {
    const allHidden = columns.reduce((acc, column) => {
      acc[column.key] = false
      return acc
    }, {} as ColumnVisibility)
    
    // Ensure locked columns remain visible
    columns.forEach(column => {
      if (column.locked) {
        allHidden[column.key] = true
      }
    })
    
    setColumnVisibility(allHidden)
  }, [columns])

  const resetToDefault = useCallback(() => {
    const defaultVisibility = columns.reduce((acc, column) => {
      // If defaultVisible is provided, use it; otherwise show all columns
      acc[column.key] = defaultVisible ? defaultVisible.includes(column.key) : true
      return acc
    }, {} as ColumnVisibility)
    
    // Ensure locked columns remain visible
    columns.forEach(column => {
      if (column.locked) {
        defaultVisibility[column.key] = true
      }
    })
    
    setColumnVisibility(defaultVisibility)
  }, [columns, defaultVisible])

  // Get visible columns
  const visibleColumns = columns.filter(column => 
    columnVisibility[column.key] !== false
  )

  // Get visibility stats
  const visibilityStats = {
    visible: Object.values(columnVisibility).filter(Boolean).length,
    total: columns.length,
    hidden: columns.length - Object.values(columnVisibility).filter(Boolean).length
  }

  return {
    columnVisibility,
    visibleColumns,
    visibilityStats,
    updateColumnVisibility,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
    resetToDefault
  }
}