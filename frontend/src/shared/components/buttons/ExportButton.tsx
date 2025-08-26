import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportToCSV, type ExportColumn } from '../../utils/export'

export interface ExportButtonProps<T> {
  data: T[]
  columns: ExportColumn<T>[]
  filename?: string
  searchTerm?: string
  disabled?: boolean
  className?: string
}

export const ExportButton = <T,>({
  data,
  columns,
  filename,
  searchTerm,
  disabled = false,
  className = ''
}: ExportButtonProps<T>): JSX.Element => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (disabled || isExporting) return

    setIsExporting(true)
    try {
      exportToCSV({
        data,
        columns,
        filename,
        searchTerm
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !data?.length}
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
        bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600
        text-white rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={data?.length ? `Export ${data.length} records` : 'No data to export'}
    >
      <Download size={16} className={isExporting ? 'animate-pulse' : ''} />
      {isExporting ? 'Exporting...' : 'Export'}
    </button>
  )
}