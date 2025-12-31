'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, getAuthUser } from '@/lib/supabase'
import { ConnectDataPrompt } from '@/components/dashboard/ConnectDataPrompt'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Segment {
  id: string
  name: string
  pattern: string
}

interface TrafficByDevice {
  device: string
  sessions: number
  [key: string]: string | number
}

interface TrafficByChannel {
  channel: string
  sessions: number
  [key: string]: string | number
}

interface TrafficByCountry {
  country: string
  sessions: number
  [key: string]: string | number
}

interface DailyTraffic {
  date: string
  views: number
  activeUsers: number
  newUsers: number
  sessions: number
}

interface TrafficRecord {
  id: string
  date: string
  page_path: string
  device_category: string
  channel_group: string
  country: string
  views: number
  active_users: number
  new_users: number
  sessions: number
  views_per_user: number
  avg_engagement_time: number
  bounce_rate: number
  engagement_rate: number
  segment: string
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

// 3D effect colors (darker shades for depth)
const COLORS_3D = [
  { main: '#3B82F6', shadow: '#1E40AF' },
  { main: '#10B981', shadow: '#047857' },
  { main: '#F59E0B', shadow: '#B45309' },
  { main: '#EF4444', shadow: '#B91C1C' },
  { main: '#8B5CF6', shadow: '#5B21B6' },
  { main: '#EC4899', shadow: '#BE185D' },
  { main: '#06B6D4', shadow: '#0E7490' },
  { main: '#84CC16', shadow: '#4D7C0F' },
  { main: '#F97316', shadow: '#C2410C' },
  { main: '#6366F1', shadow: '#4338CA' },
]

const RADIAN = Math.PI / 180

export default function TrafficBySegmentsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasData, setHasData] = useState<{ ga: boolean; segments: boolean } | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Data states
  const [trafficByDevice, setTrafficByDevice] = useState<TrafficByDevice[]>([])
  const [trafficByChannel, setTrafficByChannel] = useState<TrafficByChannel[]>([])
  const [trafficByCountry, setTrafficByCountry] = useState<TrafficByCountry[]>([])
  const [dailyTraffic, setDailyTraffic] = useState<DailyTraffic[]>([])
  const [trafficRecords, setTrafficRecords] = useState<TrafficRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [dataLoaded, setDataLoaded] = useState(false)

  const recordsPerPage = 20

  // Data loading functions
  const loadTrafficByDevice = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('ga_data')
      .select('device_category, sessions')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (error) throw error

    const deviceMap: Record<string, number> = {}
    data?.forEach((row) => {
      const device = row.device_category || 'Unknown'
      deviceMap[device] = (deviceMap[device] || 0) + (row.sessions || 0)
    })

    const deviceData = Object.entries(deviceMap)
      .map(([device, sessions]) => ({ device, sessions }))
      .sort((a, b) => b.sessions - a.sessions)

    setTrafficByDevice(deviceData)
  }, [])

  const loadTrafficByChannel = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('ga_data')
      .select('channel_group, sessions')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (error) throw error

    const channelMap: Record<string, number> = {}
    data?.forEach((row) => {
      const channel = row.channel_group || 'Unknown'
      channelMap[channel] = (channelMap[channel] || 0) + (row.sessions || 0)
    })

    const channelData = Object.entries(channelMap)
      .map(([channel, sessions]) => ({ channel, sessions }))
      .sort((a, b) => b.sessions - a.sessions)

    setTrafficByChannel(channelData)
  }, [])

  const loadTrafficByCountry = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('ga_data')
      .select('country, sessions')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (error) throw error

    const countryMap: Record<string, number> = {}
    data?.forEach((row) => {
      const country = row.country || 'Unknown'
      countryMap[country] = (countryMap[country] || 0) + (row.sessions || 0)
    })

    const countryData = Object.entries(countryMap)
      .map(([country, sessions]) => ({ country, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10) // Top 10 countries

    setTrafficByCountry(countryData)
  }, [])

  const loadDailyTraffic = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('ga_data')
      .select('date, views, active_users, new_users, sessions')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)
      .order('date')

    if (error) throw error

    const dateMap: Record<string, { views: number; activeUsers: number; newUsers: number; sessions: number }> = {}
    data?.forEach((row) => {
      const date = row.date
      if (!dateMap[date]) {
        dateMap[date] = { views: 0, activeUsers: 0, newUsers: 0, sessions: 0 }
      }
      dateMap[date].views += row.views || 0
      dateMap[date].activeUsers += row.active_users || 0
      dateMap[date].newUsers += row.new_users || 0
      dateMap[date].sessions += row.sessions || 0
    })

    const dailyData = Object.entries(dateMap)
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...values,
      }))

    setDailyTraffic(dailyData)
  }, [])

  const loadTrafficRecords = useCallback(async (uid: string, segment: string, from: string, to: string, page: number) => {
    const offset = (page - 1) * recordsPerPage

    const { count, error: countError } = await supabase
      .from('ga_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (countError) throw countError

    setTotalRecords(count || 0)

    const { data, error } = await supabase
      .from('ga_data')
      .select('id, date, page_path, device_category, channel_group, country, views, active_users, new_users, sessions, views_per_user, avg_engagement_time, bounce_rate, engagement_rate, segment')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .range(offset, offset + recordsPerPage - 1)

    if (error) throw error

    setTrafficRecords(data || [])
  }, [])

  const loadAllData = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    setSubmitting(true)
    setError(null)
    setCurrentPage(1)

    try {
      await Promise.all([
        loadTrafficByDevice(uid, segment, from, to),
        loadTrafficByChannel(uid, segment, from, to),
        loadTrafficByCountry(uid, segment, from, to),
        loadDailyTraffic(uid, segment, from, to),
        loadTrafficRecords(uid, segment, from, to, 1),
      ])
      setDataLoaded(true)
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }, [loadTrafficByDevice, loadTrafficByChannel, loadTrafficByCountry, loadDailyTraffic, loadTrafficRecords])

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      const user = await getAuthUser()
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      // Set default date range (last 30 days)
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const toDateStr = today.toISOString().split('T')[0]
      const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0]

      setToDate(toDateStr)
      setFromDate(fromDateStr)

      // Check if user has GA data
      const { count: gaCount, error: gaCountError } = await supabase
        .from('ga_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (gaCountError) throw gaCountError

      // Check if user has segments
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('segments')
        .select('id, name, pattern')
        .eq('user_id', user.id)
        .order('name')

      if (segmentsError) throw segmentsError

      const hasGAData = (gaCount || 0) > 0
      const hasSegments = (segmentsData?.length || 0) > 0

      setHasData({ ga: hasGAData, segments: hasSegments })
      setSegments(segmentsData || [])

      // Auto-load first segment data
      if (hasGAData && hasSegments && segmentsData && segmentsData.length > 0) {
        const firstSegment = segmentsData[0].name
        setSelectedSegment(firstSegment)
        setLoading(false)
        
        // Load data for first segment automatically
        await loadAllData(user.id, firstSegment, fromDateStr, toDateStr)
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Error initializing:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSegment) {
      setError('Please select a segment')
      return
    }

    if (!fromDate || !toDate) {
      setError('Please select date range')
      return
    }

    if (!userId) {
      setError('User not authenticated')
      return
    }

    await loadAllData(userId, selectedSegment, fromDate, toDate)
  }

  const handlePageChange = async (page: number) => {
    if (!userId || !selectedSegment) return

    setCurrentPage(page)
    await loadTrafficRecords(userId, selectedSegment, fromDate, toDate, page)
  }

  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  // Format engagement time (seconds to readable format)
  const formatEngagementTime = (seconds: number) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  // Custom 3D Pie Chart Cell with shadow effect
  const render3DPieCell = (data: any[], dataKey: string, nameKey: string) => {
    return data.map((entry, index) => {
      const colorSet = COLORS_3D[index % COLORS_3D.length]
      return (
        <Cell
          key={`cell-${index}`}
          fill={colorSet.main}
          stroke={colorSet.shadow}
          strokeWidth={2}
          style={{
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
          }}
        />
      )
    })
  }

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Custom tooltip for Device chart
  const DeviceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.device}</p>
          <p className="text-gray-600">
            Sessions: <span className="font-medium text-blue-600">{data.sessions.toLocaleString()}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for Channel chart
  const ChannelTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.channel}</p>
          <p className="text-gray-600">
            Sessions: <span className="font-medium text-green-600">{data.sessions.toLocaleString()}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for Country chart
  const CountryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.country}</p>
          <p className="text-gray-600">
            Sessions: <span className="font-medium text-purple-600">{data.sessions.toLocaleString()}</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // No GA data - show connect prompt
  if (hasData && !hasData.ga) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Traffic by Segments</h1>
          <p className="text-gray-600 mt-1">
            Analyze traffic performance across different URL segments
          </p>
        </div>
        <ConnectDataPrompt
          title="No Traffic Data Available"
          description="To view traffic by segments, you need to import your Google Analytics data first. Connect your GA account to start analyzing your website traffic."
          showGSC={false}
          gaButtonText="Import Google Analytics Data"
          gaLink="/dashboard/settings"
        />
      </div>
    )
  }

  // No segments - show create segments prompt
  if (hasData && hasData.ga && !hasData.segments) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Traffic by Segments</h1>
          <p className="text-gray-600 mt-1">
            Analyze traffic performance across different URL segments
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Segments Created</h2>
          <p className="text-gray-600 mb-6">
            You have traffic data but no segments defined yet. Create segments to group your URLs by patterns and analyze their performance together.
          </p>
          <a
            href="/dashboard/segments/create"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Segments
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Traffic by Segments</h1>
        <p className="text-gray-600 mt-1">
          Analyze traffic performance across different URL segments
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filter Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Segment
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            >
              <option value="">-- Select Segment --</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.name}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-lg transition-colors h-[42px]"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze
              </>
            )}
          </button>
        </form>
      </div>

      {/* Charts Section - Only show after data is loaded */}
      {dataLoaded && (
        <>
          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Traffic by Device - 3D Effect */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Traffic by Device
              </h3>
              {trafficByDevice.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {COLORS_3D.map((color, index) => (
                          <linearGradient key={`gradient-device-${index}`} id={`gradient-device-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color.main} stopOpacity={1} />
                            <stop offset="100%" stopColor={color.shadow} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={trafficByDevice}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={30}
                        dataKey="sessions"
                        nameKey="device"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {trafficByDevice.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-device-${index % COLORS_3D.length})`}
                            style={{
                              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.25))',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<DeviceTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-gray-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No device data available
                </div>
              )}
            </div>

            {/* Traffic by Channel - 3D Effect */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Traffic by Channel
              </h3>
              {trafficByChannel.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {COLORS_3D.map((color, index) => (
                          <linearGradient key={`gradient-channel-${index}`} id={`gradient-channel-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color.main} stopOpacity={1} />
                            <stop offset="100%" stopColor={color.shadow} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={trafficByChannel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={30}
                        dataKey="sessions"
                        nameKey="channel"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {trafficByChannel.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-channel-${index % COLORS_3D.length})`}
                            style={{
                              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.25))',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChannelTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-gray-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No channel data available
                </div>
              )}
            </div>

            {/* Traffic by Country - 3D Effect */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Traffic by Country (Top 10)
              </h3>
              {trafficByCountry.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {COLORS_3D.map((color, index) => (
                          <linearGradient key={`gradient-country-${index}`} id={`gradient-country-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color.main} stopOpacity={1} />
                            <stop offset="100%" stopColor={color.shadow} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={trafficByCountry}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={30}
                        dataKey="sessions"
                        nameKey="country"
                        paddingAngle={2}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {trafficByCountry.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-country-${index % COLORS_3D.length})`}
                            style={{
                              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.25))',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CountryTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-gray-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No country data available
                </div>
              )}
            </div>
          </div>

          {/* Daily Traffic Line Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Traffic Trend
            </h3>
            {dailyTraffic.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    name="Active Users"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    name="New Users"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                No daily traffic data available
              </div>
            )}
          </div>

          {/* Traffic Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Traffic Records</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} - {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords.toLocaleString()} records
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page Path
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Users
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Users
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views/User
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Engagement
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bounce Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trafficRecords.length > 0 ? (
                    trafficRecords.map((record, index) => (
                      <tr key={record.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={record.page_path}>
                          {record.page_path || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {record.views?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {record.active_users?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {record.new_users?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {record.sessions?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {Number(record.views_per_user || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatEngagementTime(Number(record.avg_engagement_time || 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {(Number(record.bounce_rate || 0) * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {(Number(record.engagement_rate || 0) * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {record.device_category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {record.channel_group || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.country || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-2">
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
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Initial State - Before submitting */}
      {!dataLoaded && !submitting && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Segment to Analyze</h3>
          <p className="text-gray-600">
            Choose a segment and date range above, then click "Analyze" to view traffic data.
          </p>
        </div>
      )}
    </div>
  )
}