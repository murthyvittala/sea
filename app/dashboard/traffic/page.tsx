'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, getAuthUser } from '@/lib/supabase'

interface GaData {
  id: string
  user_id: string
  date: string
  device_category: string
  channel_group: string
  country: string
  views: number
  active_users: number
  new_users: number
  sessions: number
  bounce_rate: number
  avg_session_duration: number
  pages_per_session: number
  created_at: string
}

interface AggregatedData {
  label: string
  value: number
  percentage: number
  color: string
}

interface DailyMetrics {
  date: string
  views: number
  active_users: number
  new_users: number
  sessions: number
}

// Color palettes for charts
const DEVICE_COLORS = {
  desktop: '#3B82F6',
  mobile: '#10B981',
  tablet: '#F59E0B',
  other: '#6B7280',
}

const CHANNEL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

const COUNTRY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export default function TrafficPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noData, setNoData] = useState(false)
  const [gaData, setGaData] = useState<GaData[]>([])
  
  // Aggregated data for pie charts
  const [deviceData, setDeviceData] = useState<AggregatedData[]>([])
  const [channelData, setChannelData] = useState<AggregatedData[]>([])
  const [countryData, setCountryData] = useState<AggregatedData[]>([])
  
  // Daily metrics for line chart
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const recordsPerPage = 20

  useEffect(() => {
    loadTrafficData()
  }, [currentPage])

  const loadTrafficData = async () => {
    try {
      setLoading(true)
      setError(null)
      setNoData(false)

      const user = await getAuthUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Fetch all data for aggregations
      const { data: allData, error: fetchError } = await supabase
        .from('ga_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      if (!allData || allData.length === 0) {
        setNoData(true)
        return
      }

      setGaData(allData)
      setTotalRecords(allData.length)

      // Process device data
      processDeviceData(allData)
      
      // Process channel data
      processChannelData(allData)
      
      // Process country data
      processCountryData(allData)
      
      // Process daily metrics (last 7 days)
      processDailyMetrics(allData)

    } catch (err: any) {
      console.error('Error loading traffic data:', err)
      setError(err.message || 'Failed to load traffic data')
    } finally {
      setLoading(false)
    }
  }

  const processDeviceData = (data: GaData[]) => {
    const deviceCounts: Record<string, number> = {}
    
    data.forEach(row => {
      const device = (row.device_category || 'other').toLowerCase()
      deviceCounts[device] = (deviceCounts[device] || 0) + (row.sessions || 1)
    })

    const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0)
    
    const processed: AggregatedData[] = Object.entries(deviceCounts)
      .map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: DEVICE_COLORS[label as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value)

    setDeviceData(processed)
  }

  const processChannelData = (data: GaData[]) => {
    const channelCounts: Record<string, number> = {}
    
    data.forEach(row => {
      const channel = row.channel_group || 'Other'
      channelCounts[channel] = (channelCounts[channel] || 0) + (row.sessions || 1)
    })

    const total = Object.values(channelCounts).reduce((a, b) => a + b, 0)
    
    const processed: AggregatedData[] = Object.entries(channelCounts)
      .map(([label, value], index) => ({
        label,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: CHANNEL_COLORS[index % CHANNEL_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 channels

    setChannelData(processed)
  }

  const processCountryData = (data: GaData[]) => {
    const countryCounts: Record<string, number> = {}
    
    data.forEach(row => {
      const country = row.country || 'Unknown'
      countryCounts[country] = (countryCounts[country] || 0) + (row.sessions || 1)
    })

    const total = Object.values(countryCounts).reduce((a, b) => a + b, 0)
    
    const processed: AggregatedData[] = Object.entries(countryCounts)
      .map(([label, value], index) => ({
        label,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 countries

    setCountryData(processed)
  }

  const processDailyMetrics = (data: GaData[]) => {
    // Get last 7 days
    const last7Days: Record<string, DailyMetrics> = {}
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days[dateStr] = {
        date: dateStr,
        views: 0,
        active_users: 0,
        new_users: 0,
        sessions: 0,
      }
    }

    // Aggregate by date
    data.forEach(row => {
      const dateStr = row.date?.split('T')[0]
      if (last7Days[dateStr]) {
        last7Days[dateStr].views += row.views || 0
        last7Days[dateStr].active_users += row.active_users || 0
        last7Days[dateStr].new_users += row.new_users || 0
        last7Days[dateStr].sessions += row.sessions || 0
      }
    })

    setDailyMetrics(Object.values(last7Days))
  }

  // Pagination helpers
  const totalPages = Math.ceil(totalRecords / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const paginatedData = gaData.slice(startIndex, startIndex + recordsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading traffic data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTrafficData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No data available - show message with link to settings
  if (noData) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Traffic Data Available</h2>
          <p className="text-gray-600 mb-6">
            Please connect Google Analytics first to view your traffic data and analytics.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Go to Settings
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Connect your Google Analytics account to start tracking your website traffic.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Traffic Analytics</h1>
        <p className="text-gray-600 mt-1">Analyze your website traffic patterns and user behavior</p>
      </div>

      {/* 3D Pie Charts Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Device Category Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic by Device</h2>
          <Pie3DChart data={deviceData} />
          <div className="mt-4 space-y-2">
            {deviceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Group Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic by Channel</h2>
          <Pie3DChart data={channelData} />
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {channelData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 truncate max-w-[120px]">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Country Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic by Country</h2>
          <Pie3DChart data={countryData} />
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {countryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 truncate max-w-[120px]">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Chart - Daily Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Traffic (Last 7 Days)</h2>
        <LineChart data={dailyMetrics} />
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-gray-600">New Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-600">Sessions</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Traffic Data</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {startIndex + 1} - {Math.min(startIndex + recordsPerPage, totalRecords)} of {totalRecords} records
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Active Users</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">New Users</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bounce Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pages/Session</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.date ? new Date(row.date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      row.device_category?.toLowerCase() === 'desktop' ? 'bg-blue-100 text-blue-700' :
                      row.device_category?.toLowerCase() === 'mobile' ? 'bg-green-100 text-green-700' :
                      row.device_category?.toLowerCase() === 'tablet' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {row.device_category || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap max-w-[150px] truncate">
                    {row.channel_group || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row.country || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.views?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.active_users?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.new_users?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.sessions?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.bounce_rate ? `${(row.bounce_rate * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.avg_session_duration ? formatDuration(row.avg_session_duration) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap">
                    {row.pages_per_session?.toFixed(2) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3D Pie Chart Component
function Pie3DChart({ data }: { data: AggregatedData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  // Calculate pie slices
  let cumulativeAngle = 0
  const slices = data.map(item => {
    const startAngle = cumulativeAngle
    const sliceAngle = (item.percentage / 100) * 360
    cumulativeAngle += sliceAngle
    return {
      ...item,
      startAngle,
      endAngle: cumulativeAngle,
    }
  })

  // SVG path for pie slice
  const createSlicePath = (startAngle: number, endAngle: number, radius: number, cx: number, cy: number) => {
    const start = polarToCartesian(cx, cy, radius, endAngle)
    const end = polarToCartesian(cx, cy, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    }
  }

  const cx = 100
  const cy = 90
  const radius = 70

  return (
    <div className="relative">
      {/* 3D Effect - Bottom layer (shadow) */}
      <svg viewBox="0 0 200 200" className="w-full h-48">
        {/* 3D depth effect */}
        <ellipse cx={cx} cy={cy + 10} rx={radius} ry={radius * 0.3} fill="#e5e7eb" />
        
        {/* 3D side effect */}
        {slices.map((slice, index) => {
          const midAngle = (slice.startAngle + slice.endAngle) / 2
          if (midAngle > 0 && midAngle < 180) {
            return (
              <path
                key={`side-${index}`}
                d={createSlicePath(slice.startAngle, slice.endAngle, radius, cx, cy + 8)}
                fill={adjustColor(slice.color, -30)}
                opacity={0.8}
              />
            )
          }
          return null
        })}
        
        {/* Main pie */}
        {slices.map((slice, index) => (
          <path
            key={index}
            d={createSlicePath(slice.startAngle, slice.endAngle, radius, cx, cy)}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{slice.label}: {slice.value.toLocaleString()} ({slice.percentage.toFixed(1)}%)</title>
          </path>
        ))}
        
        {/* Highlight effect */}
        <ellipse 
          cx={cx - 15} 
          cy={cy - 15} 
          rx={radius * 0.4} 
          ry={radius * 0.2} 
          fill="white" 
          opacity={0.2}
          transform={`rotate(-30 ${cx - 15} ${cy - 15})`}
        />
      </svg>
    </div>
  )
}

// Line Chart Component
function LineChart({ data }: { data: DailyMetrics[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const width = 800
  const height = 300
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find max values for scaling
  const maxViews = Math.max(...data.map(d => d.views), 1)
  const maxActiveUsers = Math.max(...data.map(d => d.active_users), 1)
  const maxNewUsers = Math.max(...data.map(d => d.new_users), 1)
  const maxSessions = Math.max(...data.map(d => d.sessions), 1)
  const maxValue = Math.max(maxViews, maxActiveUsers, maxNewUsers, maxSessions)

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight

  // Generate line paths
  const createLinePath = (values: number[]) => {
    if (values.length === 0) return ''
    return values.map((value, index) => {
      const x = xScale(index)
      const y = yScale(value)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  const viewsPath = createLinePath(data.map(d => d.views))
  const activeUsersPath = createLinePath(data.map(d => d.active_users))
  const newUsersPath = createLinePath(data.map(d => d.new_users))
  const sessionsPath = createLinePath(data.map(d => d.sessions))

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxValue * t))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-64">
        {/* Grid lines */}
        {yTicks.map((tick, index) => (
          <g key={index}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={width - padding.right}
              y2={yScale(tick)}
              stroke="#e5e7eb"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-xs fill-gray-500"
            >
              {tick.toLocaleString()}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, index) => (
          <text
            key={index}
            x={xScale(index)}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}

        {/* Area fills */}
        <path
          d={`${viewsPath} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
          fill="#3B82F6"
          fillOpacity={0.1}
        />

        {/* Lines */}
        <path d={viewsPath} fill="none" stroke="#3B82F6" strokeWidth="3" />
        <path d={activeUsersPath} fill="none" stroke="#10B981" strokeWidth="3" />
        <path d={newUsersPath} fill="none" stroke="#8B5CF6" strokeWidth="3" />
        <path d={sessionsPath} fill="none" stroke="#F97316" strokeWidth="3" />

        {/* Data points */}
        {data.map((d, index) => (
          <g key={index}>
            <circle cx={xScale(index)} cy={yScale(d.views)} r="4" fill="#3B82F6" />
            <circle cx={xScale(index)} cy={yScale(d.active_users)} r="4" fill="#10B981" />
            <circle cx={xScale(index)} cy={yScale(d.new_users)} r="4" fill="#8B5CF6" />
            <circle cx={xScale(index)} cy={yScale(d.sessions)} r="4" fill="#F97316" />
          </g>
        ))}
      </svg>
    </div>
  )
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  const num = parseInt(hex, 16)
  
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount
  
  r = Math.max(Math.min(255, r), 0)
  g = Math.max(Math.min(255, g), 0)
  b = Math.max(Math.min(255, b), 0)
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}