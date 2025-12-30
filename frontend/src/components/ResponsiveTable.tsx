import { ReactNode } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => ReactNode
  mobileLabel?: string
  hideOnMobile?: boolean
  className?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  emptyMessage?: string
  loading?: boolean
  loadingRows?: number
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = 'Нет данных',
  loading = false,
  loadingRows = 5,
}: ResponsiveTableProps<T>) {
  const getValue = (item: T, key: string): unknown => {
    if (key.includes('.')) {
      const keys = key.split('.')
      let value: unknown = item
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k]
      }
      return value
    }
    return item[key]
  }

  // Loading skeleton
  if (loading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
              {columns.slice(0, 4).map((col) => (
                <div key={String(col.key)} className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  const visibleColumns = columns.filter((col) => !col.hideOnMobile)

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                    {col.render ? col.render(item) : String(getValue(item, String(col.key)) ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={String(item[keyField])}
            onClick={() => onRowClick?.(item)}
            className={`bg-white rounded-lg shadow border border-gray-100 p-4 ${
              onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
            }`}
          >
            {visibleColumns.map((col, index) => (
              <div
                key={String(col.key)}
                className={`flex justify-between items-start ${index > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}
              >
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {col.mobileLabel || col.header}
                </span>
                <span className="text-sm text-gray-900 text-right ml-4">
                  {col.render ? col.render(item) : String(getValue(item, String(col.key)) ?? '-')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// Status badge component for common use
export function StatusBadge({ status, labels }: { status: string; labels?: Record<string, { text: string; className: string }> }) {
  const defaultLabels: Record<string, { text: string; className: string }> = {
    pending: { text: 'Ожидает', className: 'bg-yellow-100 text-yellow-800' },
    submitted: { text: 'Подана', className: 'bg-blue-100 text-blue-800' },
    under_review: { text: 'На рассмотрении', className: 'bg-purple-100 text-purple-800' },
    approved: { text: 'Одобрена', className: 'bg-green-100 text-green-800' },
    rejected: { text: 'Отклонена', className: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Отменена', className: 'bg-gray-100 text-gray-800' },
    draft: { text: 'Черновик', className: 'bg-gray-100 text-gray-600' },
    active: { text: 'Активна', className: 'bg-green-100 text-green-800' },
    inactive: { text: 'Неактивна', className: 'bg-gray-100 text-gray-600' },
  }

  const allLabels = { ...defaultLabels, ...labels }
  const config = allLabels[status] || { text: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.text}
    </span>
  )
}

export default ResponsiveTable
