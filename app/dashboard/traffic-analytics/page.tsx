'use client'

import { useEffect, useState } from 'react'
import { supabase, getAuthUser } from '@/lib/supabase'
import { ConnectDataPrompt } from '@/components/dashboard/ConnectDataPrompt'

interface TrafficData {
  page_path: string
  sessions: number
  users: number
  pageviews: number
  bounce_rate: number
  avg_session_duration: number
}

export default function TrafficAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [error, setError] = useState<string | null>(null)

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

      // Check if user has GA data
      const { count, error: countError } = await supabase
        .from('ga_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) throw countError

      const hasGAData = (count || 0) > 0
      setHasData(hasGAData)

      if (hasGAData) {
        await loadTrafficData(user.id)
      }
    } catch (err: any) {
      console.error('Error initializing:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTrafficData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ga_data')
        .select('page_path, sessions, users, pageviews, bounce_rate, avg_session_duration')
        .eq('user_id', userId)
        .order('sessions', { ascending: false })
        .limit(100)

      if (error) throw error

      setTrafficData(data || [])
    } catch (err: any) {
      console.error('Error loading traffic data:', err)
      setError(err.message)
    }
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

  // No data - show connect prompt
  if (!hasData) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Traffic Analytics</h1>
          <p className="text-gray-600 mt-1">
            Analyze your website traffic patterns and user behavior
          </p>
        </div>
        <ConnectDataPrompt
          title="No Traffic Data Available"
          description="To view traffic analytics, you need to import your Google Analytics data first. Connect your GA account to start analyzing your website traffic."
          showGSC={false}
          gaButtonText="Import Google Analytics Data"
          gaLink="/dashboard/settings"
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Traffic Analytics</h1>
        <p className="text-gray-600 mt-1">
          Analyze your website traffic patterns and user behavior
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {trafficData.reduce((sum, row) => sum + (row.sessions || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {trafficData.reduce((sum, row) => sum + (row.users || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Pageviews</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {trafficData.reduce((sum, row) => sum + (row.pageviews || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Bounce Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {trafficData.length > 0
              ? (trafficData.reduce((sum, row) => sum + (row.bounce_rate || 0), 0) / trafficData.length).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      {/* Traffic Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Pages by Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Path
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pageviews
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bounce Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trafficData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {row.page_path}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.sessions?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.users?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.pageviews?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.bounce_rate?.toFixed(1) || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}