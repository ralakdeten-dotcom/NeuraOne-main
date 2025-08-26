export interface ExportColumn<T> {
  key: keyof T | string
  label: string
  formatter?: (value: any, item: T) => string
}

export interface ExportOptions<T> {
  data: T[]
  columns: ExportColumn<T>[]
  filename?: string
  searchTerm?: string
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return ''
  }
  
  if (typeof value === 'string') {
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
  if (typeof value === 'number') {
    return value.toString()
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  
  return String(value)
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

export const exportToCSV = <T>({ data, columns, filename, searchTerm }: ExportOptions<T>): void => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Filter data by search term if provided
  let filteredData = data
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim()
    filteredData = data.filter(item => {
      return columns.some(column => {
        const value = getNestedValue(item, column.key as string)
        const formattedValue = column.formatter 
          ? column.formatter(value, item)
          : formatValue(value)
        return formattedValue.toLowerCase().includes(searchLower)
      })
    })
  }

  if (filteredData.length === 0) {
    alert('No data matches the current search criteria')
    return
  }

  // Create CSV content
  const headers = columns.map(col => col.label).join(',')
  const rows = filteredData.map(item => {
    return columns.map(column => {
      const value = getNestedValue(item, column.key as string)
      const formattedValue = column.formatter 
        ? column.formatter(value, item)
        : formatValue(value)
      return formattedValue
    }).join(',')
  })

  const csvContent = [headers, ...rows].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const defaultFilename = `export_${timestamp}.csv`
    link.setAttribute('download', filename || defaultFilename)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

// Utility function to format date strings
export const formatDateForExport = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Utility function to format currency
export const formatCurrencyForExport = (amount: number | string): string => {
  if (!amount) return '0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(num) ? '0' : num.toFixed(2)
}