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

interface KeywordsByPosition {
  name: string
  count: number
  range: string
}

interface DailyMetrics {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface KeywordRecord {
  id: string
  date: string
  query: string
  page: string
  device: string
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  segment: string
}

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

export default function KeywordsBySegmentsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasData, setHasData] = useState<{ gsc: boolean; segments: boolean } | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Data states
  const [keywordsByPosition, setKeywordsByPosition] = useState<KeywordsByPosition[]>([])
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [keywordRecords, setKeywordRecords] = useState<KeywordRecord[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [dataLoaded, setDataLoaded] = useState(false)

  const recordsPerPage = 20

  // Load keywords by position ranges
  const loadKeywordsByPosition = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('gsc_data')
      .select('query, position')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (error) throw error

    // Get unique keywords and their best position
    const keywordBestPosition: Record<string, number> = {}
    data?.forEach((row) => {
      const query = row.query || ''
      const position = Number(row.position) || 100
      if (!keywordBestPosition[query] || position < keywordBestPosition[query]) {
        keywordBestPosition[query] = position
      }
    })

    // Count keywords by position range
    let pos1to5 = 0
    let pos5to10 = 0
    let posAbove10 = 0

    Object.values(keywordBestPosition).forEach((position) => {
      if (position >= 1 && position <= 5) {
        pos1to5++
      } else if (position > 5 && position <= 10) {
        pos5to10++
      } else {
        posAbove10++
      }
    })

    const positionData: KeywordsByPosition[] = [
      { name: 'Position 1-5', count: pos1to5, range: '1-5' },
      { name: 'Position 5-10', count: pos5to10, range: '5-10' },
      { name: 'Position >10', count: posAbove10, range: '>10' },
    ]

    setKeywordsByPosition(positionData)
  }, [])

  // Load daily aggregated metrics
  const loadDailyMetrics = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    const { data, error } = await supabase
      .from('gsc_data')
      .select('date, clicks, impressions, ctr, position')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)
      .order('date')

    if (error) throw error

    // Aggregate by date
    const dateMap: Record<string, { clicks: number; impressions: number; ctrSum: number; positionSum: number; count: number }> = {}
    data?.forEach((row) => {
      const date = row.date
      if (!dateMap[date]) {
        dateMap[date] = { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0, count: 0 }
      }
      dateMap[date].clicks += row.clicks || 0
      dateMap[date].impressions += row.impressions || 0
      dateMap[date].ctrSum += Number(row.ctr) || 0
      dateMap[date].positionSum += Number(row.position) || 0
      dateMap[date].count += 1
    })

    const dailyData = Object.entries(dateMap)
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: values.clicks,
        impressions: values.impressions,
        ctr: values.count > 0 ? Number((values.ctrSum / values.count * 100).toFixed(2)) : 0,
        position: values.count > 0 ? Number((values.positionSum / values.count).toFixed(1)) : 0,
      }))

    setDailyMetrics(dailyData)
  }, [])

  // Load keyword records with pagination
  const loadKeywordRecords = useCallback(async (uid: string, segment: string, from: string, to: string, page: number) => {
    const offset = (page - 1) * recordsPerPage

    const { count, error: countError } = await supabase
      .from('gsc_data')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)

    if (countError) throw countError

    setTotalRecords(count || 0)

    const { data, error } = await supabase
      .from('gsc_data')
      .select('id, date, query, page, device, country, clicks, impressions, ctr, position, segment')
      .eq('user_id', uid)
      .eq('segment', segment)
      .gte('date', from)
      .lte('date', to)
      .order('clicks', { ascending: false })
      .range(offset, offset + recordsPerPage - 1)

    if (error) throw error

    setKeywordRecords(data || [])
  }, [])

  // Load all data
  const loadAllData = useCallback(async (uid: string, segment: string, from: string, to: string) => {
    setSubmitting(true)
    setError(null)
    setCurrentPage(1)

    try {
      await Promise.all([
        loadKeywordsByPosition(uid, segment, from, to),
        loadDailyMetrics(uid, segment, from, to),
        loadKeywordRecords(uid, segment, from, to, 1),
      ])
      setDataLoaded(true)
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }, [loadKeywordsByPosition, loadDailyMetrics, loadKeywordRecords])

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

      // Check if user has GSC data
      const { count: gscCount, error: gscCountError } = await supabase
        .from('gsc_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (gscCountError) throw gscCountError

      // Check if user has segments
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('segments')
        .select('id, name, pattern')
        .eq('user_id', user.id)
        .order('name')

      if (segmentsError) throw segmentsError

      const hasGSCData = (gscCount || 0) > 0
      const hasSegments = (segmentsData?.length || 0) > 0

      setHasData({ gsc: hasGSCData, segments: hasSegments })
      setSegments(segmentsData || [])

      // Auto-load first segment data
      if (hasGSCData && hasSegments && segmentsData && segmentsData.length > 0) {
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
    await loadKeywordRecords(userId, selectedSegment, fromDate, toDate, page)
  }

  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
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
        fontSize={14}
        fontWeight="bold"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Custom tooltip for Position chart
  const PositionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">
            Keywords: <span className="font-medium text-blue-600">{(data.value ?? data.count ?? 0).toLocaleString()}</span>
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

  // No GSC data - show connect prompt
  if (hasData && !hasData.gsc) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Keywords by Segments</h1>
          <p className="text-gray-600 mt-1">
            Analyze keyword performance across different URL segments
          </p>
        </div>
        <ConnectDataPrompt
          title="No Search Console Data Available"
          description="To view keywords by segments, you need to import your Google Search Console data first. Connect your GSC account to start analyzing your keyword performance."
          showGA={false}
          gscButtonText="Import Search Console Data"
          gscLink="/dashboard/settings"
        />
      </div>
    )
  }

  // No segments - show create segments prompt
  if (hasData && hasData.gsc && !hasData.segments) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Keywords by Segments</h1>
          <p className="text-gray-600 mt-1">
            Analyze keyword performance across different URL segments
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Segments Created</h2>
          <p className="text-gray-600 mb-6">
            You have keyword data but no segments defined yet. Create segments to group your URLs by patterns and analyze their keyword performance together.
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
        <h1 className="text-3xl font-bold text-gray-900">Keywords by Segments</h1>
        <p className="text-gray-600 mt-1">
          Analyze keyword performance across different URL segments
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          {/* Position Distribution Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Position 1-5 */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Position 1-5
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">Top performing keywords</p>
              {keywordsByPosition.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <defs>
                        <linearGradient id="gradient-pos1-main" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4d29a0ff" stopOpacity={1} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-pos1-other" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D1FAE5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#A7F3D0" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { name: 'Position 1-5', value: keywordsByPosition[0]?.count || 0 },
                          { name: 'Others', value: (keywordsByPosition[1]?.count || 0) + (keywordsByPosition[2]?.count || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={90}
                        innerRadius={35}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        <Cell fill="url(#gradient-pos1-main)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(16,185,129,0.4))' }} />
                        <Cell fill="url(#gradient-pos1-other)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                        <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                      </Pie>
                      <Tooltip content={<PositionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold" style={{ color: '#10B981' }}>{keywordsByPosition[0]?.count?.toLocaleString() || 0}</span>
                    <p className="text-sm text-gray-500">keywords</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Position 5-10 */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Position 5-10
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">Keywords with potential</p>
              {keywordsByPosition.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <defs>
                        <linearGradient id="gradient-pos2-main" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                          <stop offset="100%" stopColor="#B45309" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-pos2-other" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FEF3C7" stopOpacity={1} />
                          <stop offset="100%" stopColor="#FDE68A" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { name: 'Position 5-10', value: keywordsByPosition[1]?.count || 0 },
                          { name: 'Others', value: (keywordsByPosition[0]?.count || 0) + (keywordsByPosition[2]?.count || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={90}
                        innerRadius={35}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        <Cell fill="url(#gradient-pos2-main)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(245,158,11,0.4))' }} />
                        <Cell fill="url(#gradient-pos2-other)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                        <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                      </Pie>
                      <Tooltip content={<PositionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold" style={{ color: '#F59E0B' }}>{keywordsByPosition[1]?.count?.toLocaleString() || 0}</span>
                    <p className="text-sm text-gray-500">keywords</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Position >10 */}
            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Position &gt;10
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">Keywords needing improvement</p>
              {keywordsByPosition.length > 0 ? (
                <div style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <defs>
                        <linearGradient id="gradient-pos3-main" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                          <stop offset="100%" stopColor="#B91C1C" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-pos3-other" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FEE2E2" stopOpacity={1} />
                          <stop offset="100%" stopColor="#FECACA" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { name: 'Position >10', value: keywordsByPosition[2]?.count || 0 },
                          { name: 'Others', value: (keywordsByPosition[0]?.count || 0) + (keywordsByPosition[1]?.count || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={90}
                        innerRadius={35}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        <Cell fill="url(#gradient-pos3-main)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(239,68,68,0.4))' }} />
                        <Cell fill="url(#gradient-pos3-other)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                        <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.1))' }} />
                      </Pie>
                      <Tooltip content={<PositionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-3xl font-bold" style={{ color: '#EF4444' }}>{keywordsByPosition[2]?.count?.toLocaleString() || 0}</span>
                    <p className="text-sm text-gray-500">keywords</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Total Keywords</p>
              <p className="text-2xl font-bold text-gray-900">
                {keywordsByPosition.reduce((acc, item) => acc + item.count, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Top 5 Positions</p>
              <p className="text-2xl font-bold" style={{ color: COLORS_3D[1].main }}>
                {keywordsByPosition[0]?.count?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Position 5-10</p>
              <p className="text-2xl font-bold" style={{ color: COLORS_3D[2].main }}>
                {keywordsByPosition[1]?.count?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Below Top 10</p>
              <p className="text-2xl font-bold" style={{ color: COLORS_3D[3].main }}>
                {keywordsByPosition[2]?.count?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* Daily Metrics Line Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Performance Metrics
            </h3>
            {dailyMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'CTR') return [`${value.toFixed(2)}%`, name]
                      if (name === 'Avg Position') return [value.toFixed(1), name]
                      return [value.toLocaleString(), name]
                    }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke={COLORS_3D[0].main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="impressions"
                    name="Impressions"
                    stroke={COLORS_3D[1].main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ctr"
                    name="CTR"
                    stroke={COLORS_3D[2].main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="position"
                    name="Avg Position"
                    stroke={COLORS_3D[4].main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                No daily metrics available
              </div>
            )}
          </div>

          {/* Keyword Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Keyword Records</h3>
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
                      Query
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Page
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywordRecords.length > 0 ? (
                    keywordRecords.map((record, index) => (
                      <tr key={record.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={record.query}>
                          {record.query || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={record.page}>
                          {record.page || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {record.clicks?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {record.impressions?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {(Number(record.ctr || 0) * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            Number(record.position) <= 5 
                              ? 'bg-green-100 text-green-800'
                              : Number(record.position) <= 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {Number(record.position || 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {record.device || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.country || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
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
                                              className={`px-3 py-1 text-sm font-medium rounded ${
                                                currentPage === pageNum
                                                  ? 'bg-blue-600 text-white'
                                                  : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                                              }`}
                                            >
                                              {pageNum}
                                            </button>
                                          )
                                        })}
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
                          </div>
                        )
                      }
