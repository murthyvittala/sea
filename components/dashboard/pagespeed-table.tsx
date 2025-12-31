'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/lib/utils'

interface PageSpeedRow {
  id: number
  url: string
  performance: number
  accessibility: number
  seo: number
  best_practices: number
  created_at: string
}

interface PageSpeedTableProps {
  data: PageSpeedRow[]
  loading?: boolean
  onRefresh?: () => void
}

export default function PageSpeedTable({ data, loading = false, onRefresh }: PageSpeedTableProps) {
  const [sortField, setSortField] = useState<keyof PageSpeedRow>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState('')
  const [metricFilter, setMetricFilter] = useState<'all' | 'good' | 'average' | 'poor'>('all')

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = row.url.toLowerCase().includes(filter.toLowerCase())
      
      if (metricFilter === 'all') return matchesSearch
      
      const getStatus = (score: number) => {
        if (score >= 90) return 'good'
        if (score >= 50) return 'average'
        return 'poor'
      }
      
      const hasScore = [row.performance, row.accessibility, row.seo, row.best_practices].some(
        (score) => getStatus(score) === metricFilter
      )
      
      return matchesSearch && hasScore
    })
  }, [data, filter, metricFilter])

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal as string).toLowerCase()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortField, sortOrder])

  const handleSort = (field: keyof PageSpeedRow) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getScoreBorder = (score: number) => {
    if (score >= 90) return 'border-green-200'
    if (score >= 50) return 'border-yellow-200'
    return 'border-red-200'
  }

  const getSortIcon = (field: keyof PageSpeedRow) => {
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
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search URLs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Scores</option>
            <option value="good">Good (90+)</option>
            <option value="average">Average (50-89)</option>
            <option value="poor">Poor (&lt;50)</option>
          </select>
        </div>
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
        Showing {sortedData.length} of {data.length} pages
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No pages match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('url')}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    URL
                    <span className="text-xs">{getSortIcon('url')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('performance')}
                  className="px-6 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Performance
                    <span className="text-xs">{getSortIcon('performance')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('accessibility')}
                  className="px-6 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Accessibility
                    <span className="text-xs">{getSortIcon('accessibility')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('seo')}
                  className="px-6 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    SEO
                    <span className="text-xs">{getSortIcon('seo')}</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('best_practices')}
                  className="px-6 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Best Practices
                    <span className="text-xs">{getSortIcon('best_practices')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedData.map((row, idx) => (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-xs block"
                      title={row.url}
                    >
                      {row.url.length > 40 ? row.url.substring(0, 40) + '...' : row.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full font-bold text-sm border-2 ${getScoreColor(row.performance)} ${getScoreBorder(row.performance)}`}
                    >
                      {Math.round(row.performance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full font-bold text-sm border-2 ${getScoreColor(row.accessibility)} ${getScoreBorder(row.accessibility)}`}
                    >
                      {Math.round(row.accessibility)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full font-bold text-sm border-2 ${getScoreColor(row.seo)} ${getScoreBorder(row.seo)}`}
                    >
                      {Math.round(row.seo)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full font-bold text-sm border-2 ${getScoreColor(row.best_practices)} ${getScoreBorder(row.best_practices)}`}
                    >
                      {Math.round(row.best_practices)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}