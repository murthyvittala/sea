'use client'

import { useEffect, useState } from 'react'
import { supabase, getAuthUser } from '@/lib/supabase'
import { ConnectDataPrompt } from '@/components/dashboard/ConnectDataPrompt'

interface PageSpeedData {
  url: string
  performance_score: number
  fcp: number
  lcp: number
  cls: number
  tbt: number
  speed_index: number
  created_at: string
}

export default function PageSpeedPage() {
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [pageSpeedData, setPageSpeedData] = useState<PageSpeedData[]>([])
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

      // Check if user has PageSpeed data
      const { count, error: countError } = await supabase
        .from('pagespeed_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) throw countError

      const hasPageSpeedData = (count || 0) > 0
      setHasData(hasPageSpeedData)

      if (hasPageSpeedData) {
        await loadPageSpeedData(user.id)
      }
    } catch (err: any) {
      console.error('Error initializing:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPageSpeedData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pagespeed_data')
        .select('url, performance_score, fcp, lcp, cls, tbt, speed_index, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setPageSpeedData(data || [])
    } catch (err: any) {
      console.error('Error loading pagespeed data:', err)
      setError(err.message)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
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
          <h1 className="text-3xl font-bold text-gray-900">PageSpeed Insights</h1>
          <p className="text-gray-600 mt-1">
            Monitor your website performance and Core Web Vitals
          </p>
        </div>
        <ConnectDataPrompt
          title="No PageSpeed Data Available"
          description="To view PageSpeed insights, you need to run a performance audit on your pages first. This will analyze your Core Web Vitals and provide optimization recommendations."
          showGA={false}
          showGSC={false}
        />
        {/* Run Audit Button */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard/pagespeed/audit"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run PageSpeed Audit
          </a>
        </div>
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PageSpeed Insights</h1>
          <p className="text-gray-600 mt-1">
            Monitor your website performance and Core Web Vitals
          </p>
        </div>
        <a
          href="/dashboard/pagespeed/audit"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Audit
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Performance</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {pageSpeedData.length > 0
              ? Math.round(pageSpeedData.reduce((sum, row) => sum + (row.performance_score || 0), 0) / pageSpeedData.length)
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg LCP</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {pageSpeedData.length > 0
              ? (pageSpeedData.reduce((sum, row) => sum + (row.lcp || 0), 0) / pageSpeedData.length / 1000).toFixed(2)
              : 0}s
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg CLS</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {pageSpeedData.length > 0
              ? (pageSpeedData.reduce((sum, row) => sum + (row.cls || 0), 0) / pageSpeedData.length).toFixed(3)
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Pages Audited</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pageSpeedData.length}</p>
        </div>
      </div>

      {/* PageSpeed Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">PageSpeed Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FCP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LCP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CLS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TBT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audited
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageSpeedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {row.url}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(row.performance_score)}`}>
                      {row.performance_score} - {getScoreBadge(row.performance_score)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {(row.fcp / 1000).toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {(row.lcp / 1000).toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.cls?.toFixed(3) || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {row.tbt}ms
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(row.created_at).toLocaleDateString()}
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