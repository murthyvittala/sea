'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'

interface KeywordRow {
  id: number
  field: string
  value: string
  date: string
}

interface KeywordsTableProps {
  data: KeywordRow[]
  loading?: boolean
  onRefresh?: () => void
}

export default function KeywordsTable({ data, loading = false, onRefresh }: KeywordsTableProps) {
  const [sortField, setSortField] = useState<'field' | 'value' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(sortedData.map((row) => row.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
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
      <div className="flex gap-4 items-center justify-between flex-wrap">
        <input
          type="text"
          placeholder="Search keywords..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors">
              Delete ({selectedRows.size})
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Refresh
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {sortedData.length} of {data.length} keywords
        {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No keywords match your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('field')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Keyword
                    <span className="text-xs">{getSortIcon('field')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Data
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
                    selectedRows.has(row.id) ? 'bg-blue-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {row.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{row.value}</td>
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