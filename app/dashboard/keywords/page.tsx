'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, getAuthUser } from '@/lib/supabase'
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

const COLORS_3D = [
  { main: '#3B82F6', shadow: '#1E40AF' }, // blue
  { main: '#10B981', shadow: '#047857' }, // green
  { main: '#F59E0B', shadow: '#B45309' }, // yellow
  { main: '#EF4444', shadow: '#B91C1C' }, // red
  { main: '#8B5CF6', shadow: '#5B21B6' }, // purple
]

const RADIAN = Math.PI / 180

export default function KeywordsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Data states
  const [keywordsByPosition, setKeywordsByPosition] = useState([
    { name: 'Position 1-5', count: 0 },
    { name: 'Position 6-10', count: 0 },
    { name: 'Position >10', count: 0 },
  ])
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([])
  const [positionStats, setPositionStats] = useState([
    { count: 0, clicks: 0, impressions: 0, avgCtr: 0 },
    { count: 0, clicks: 0, impressions: 0, avgCtr: 0 },
    { count: 0, clicks: 0, impressions: 0, avgCtr: 0 },
  ])
  const [keywordRecords, setKeywordRecords] = useState<any[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 20

  // Pie chart label
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
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
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Pie chart tooltip
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

  // Data loading
  const loadAllData = useCallback(async (uid: string, from: string, to: string, page = 1) => {
    setSubmitting(true)
    setError(null)
    setCurrentPage(page)
    try {
      // 1. Keywords by position
      const { data: allData, error: allError } = await supabase
        .from('gsc_data')
        .select('query, position, clicks, impressions, ctr')
        .eq('user_id', uid)
        .gte('date', from)
        .lte('date', to)
      if (allError) throw allError

      // Unique keywords and best position
      const keywordMap: Record<string, { position: number, clicks: number, impressions: number, ctr: number }> = {}
      allData?.forEach((row) => {
        const query = row.query || ''
        const position = Number(row.position) || 100
        if (!keywordMap[query] || position < keywordMap[query].position) {
          keywordMap[query] = {
            position,
            clicks: Number(row.clicks) || 0,
            impressions: Number(row.impressions) || 0,
            ctr: Number(row.ctr) || 0,
          }
        }
      })

      // Count and stats by position
      let pos1to5 = 0, pos6to10 = 0, posAbove10 = 0
      let clicks1to5 = 0, clicks6to10 = 0, clicksAbove10 = 0
      let impr1to5 = 0, impr6to10 = 0, imprAbove10 = 0
      let ctr1to5 = 0, ctr6to10 = 0, ctrAbove10 = 0

      Object.values(keywordMap).forEach(({ position, clicks, impressions, ctr }) => {
        if (position >= 1 && position <= 5) {
          pos1to5++; clicks1to5 += clicks; impr1to5 += impressions; ctr1to5 += ctr
        } else if (position > 5 && position <= 10) {
          pos6to10++; clicks6to10 += clicks; impr6to10 += impressions; ctr6to10 += ctr
        } else {
          posAbove10++; clicksAbove10 += clicks; imprAbove10 += impressions; ctrAbove10 += ctr
        }
      })

      setKeywordsByPosition([
        { name: 'Position 1-5', count: pos1to5 },
        { name: 'Position 6-10', count: pos6to10 },
        { name: 'Position >10', count: posAbove10 },
      ])
      setPositionStats([
        {
          count: pos1to5,
          clicks: clicks1to5,
          impressions: impr1to5,
          avgCtr: pos1to5 ? (ctr1to5 / pos1to5) * 100 : 0,
        },
        {
          count: pos6to10,
          clicks: clicks6to10,
          impressions: impr6to10,
          avgCtr: pos6to10 ? (ctr6to10 / pos6to10) * 100 : 0,
        },
        {
          count: posAbove10,
          clicks: clicksAbove10,
          impressions: imprAbove10,
          avgCtr: posAbove10 ? (ctrAbove10 / posAbove10) * 100 : 0,
        },
      ])

      // 2. Daily metrics
      const { data: dailyData, error: dailyError } = await supabase
        .from('gsc_data')
        .select('date, clicks, impressions, ctr, position')
        .eq('user_id', uid)
        .gte('date', from)
        .lte('date', to)
        .order('date')
      if (dailyError) throw dailyError

      // Aggregate by date
      const dateMap: Record<string, { clicks: number; impressions: number; ctrSum: number; positionSum: number; count: number }> = {}
      dailyData?.forEach((row) => {
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
      setDailyMetrics(Object.entries(dateMap).map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: values.clicks,
        impressions: values.impressions,
        ctr: values.count > 0 ? Number((values.ctrSum / values.count * 100).toFixed(2)) : 0,
        position: values.count > 0 ? Number((values.positionSum / values.count).toFixed(1)) : 0,
      })))

      // 3. Table data with pagination
      const offset = (page - 1) * recordsPerPage
      const { count, error: countError } = await supabase
        .from('gsc_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('date', from)
        .lte('date', to)
      if (countError) throw countError
      setTotalRecords(count || 0)

      const { data: tableData, error: tableError } = await supabase
        .from('gsc_data')
        .select('id, date, query, page, device, country, clicks, impressions, ctr, position')
        .eq('user_id', uid)
        .gte('date', from)
        .lte('date', to)
        .order('clicks', { ascending: false })
        .range(offset, offset + recordsPerPage - 1)
      if (tableError) throw tableError
      setKeywordRecords(tableData || [])

      setDataLoaded(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    (async () => {
      const user = await getAuthUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      // Default last 30 days
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      setToDate(today.toISOString().split('T')[0])
      setFromDate(thirtyDaysAgo.toISOString().split('T')[0])
      await loadAllData(user.id, thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
    })()
  }, [loadAllData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromDate || !toDate || !userId) return
    await loadAllData(userId, fromDate, toDate)
  }

  const handlePageChange = async (page: number) => {
    if (!userId) return
    setCurrentPage(page)
    await loadAllData(userId, fromDate, toDate, page)
  }

  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Keywords Overview</h1>
        <p className="text-gray-600 mt-1">
          Analyze keyword performance by position for your site
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filter Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
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

      {/* Pie Charts */}
      {dataLoaded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Position 1-5 */}
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Position 1-5
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">Top performing keywords</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <defs>
                  <linearGradient id="gradient-pos1-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[1].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[1].shadow} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[0].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[0].shadow} stopOpacity={1} />
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
                  <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(59,130,246,0.3))' }} />
                </Pie>
                <Tooltip content={<PositionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold" style={{ color: COLORS_3D[1].main }}>{keywordsByPosition[0]?.count?.toLocaleString() || 0}</span>
              <p className="text-sm text-gray-500">keywords</p>
            </div>
          </div>
          {/* Position 6-10 */}
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Position 6-10
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">Keywords with potential</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <defs>
                  <linearGradient id="gradient-pos2-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[2].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[2].shadow} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[0].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[0].shadow} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Pie
                  data={[
                    { name: 'Position 6-10', value: keywordsByPosition[1]?.count || 0 },
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
                  <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(59,130,246,0.3))' }} />
                </Pie>
                <Tooltip content={<PositionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold" style={{ color: COLORS_3D[2].main }}>{keywordsByPosition[1]?.count?.toLocaleString() || 0}</span>
              <p className="text-sm text-gray-500">keywords</p>
            </div>
          </div>
          {/* Position >10 */}
          <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Position &gt;10
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">Keywords needing improvement</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <defs>
                  <linearGradient id="gradient-pos3-main" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[3].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[3].shadow} stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradient-others-blue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS_3D[0].main} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS_3D[0].shadow} stopOpacity={1} />
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
                  <Cell fill="url(#gradient-others-blue)" style={{ filter: 'drop-shadow(2px 4px 6px rgba(59,130,246,0.3))' }} />
                </Pie>
                <Tooltip content={<PositionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold" style={{ color: COLORS_3D[3].main }}>{keywordsByPosition[2]?.count?.toLocaleString() || 0}</span>
              <p className="text-sm text-gray-500">keywords</p>
            </div>
          </div>
        </div>
      )}

      {/* 3 Grids for stats */}
      {dataLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Position 1-5', 'Position 6-10', 'Position >10'].map((label, i) => (
            <div key={label} className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold" style={{ color: COLORS_3D[i + 1].main }}>
                {positionStats[i].count.toLocaleString()} keywords
              </p>
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-sm text-gray-700">
                  <b>Clicks:</b> {positionStats[i].clicks.toLocaleString()}
                </span>
                <span className="text-sm text-gray-700">
                  <b>Impressions:</b> {positionStats[i].impressions.toLocaleString()}
                </span>
                <span className="text-sm text-gray-700">
                  <b>Avg CTR:</b> {positionStats[i].avgCtr.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Line Chart */}
      {dataLoaded && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Performance Metrics
          </h3>
          {dailyMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
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
      )}

      {/* Table */}
      {dataLoaded && (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
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
      )}
    </div>
  )
}