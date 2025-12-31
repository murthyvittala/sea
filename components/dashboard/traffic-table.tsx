'use client'

import { useState, useMemo } from 'react'
import { formatNumber, formatDate } from '@/lib/utils'

interface TrafficRow {
  id: number
  field: string
  value: string
  date: string
}

interface TrafficTableProps {
  data: TrafficRow[]
  loading?: boolean
  onRefresh?: () => void
}

export default function TrafficTable({ data, loading = false, onRefresh }: TrafficTableProps) {
  const [sortField, setSortField] = useState<'field' | 'value' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const searchTerm = filter.toLowerCase()
      return (
        row.field.toLowerCase().includes(searchTerm) ||
        row.value.toLowerCase().includes(searchTerm)
      )
    })
  }, [data, filter])

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Parse numbers if the field is 'value'
      if (sortField === 'value') {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortField, sortOrder])

  const handleSort = (field: 'field' | 'value' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: 'field' | 'value' | 'date') => {
    if (sortField !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Filter by metric or value..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {sortedData.length} of {data.length} records
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No data matches your filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('field')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Metric
                    <span className="text-xs">{getSortIcon('field')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Value
                    <span className="text-xs">{getSortIcon('value')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Date
                    <span className="text-xs">{getSortIcon('date')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-blue-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {row.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                    {isNaN(parseFloat(row.value)) ? row.value : formatNumber(parseFloat(row.value))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}