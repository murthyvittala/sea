'use client'

import { useEffect, useState } from 'react'
import { supabase, getAuthUser } from '@/lib/supabase'
import { ConnectDataPrompt } from '@/components/dashboard/ConnectDataPrompt'

interface Segment {
  id: string
  name: string
  pattern: string
  gaCount: number
  gscCount: number
  createdAt: string
}

export default function CreateSegmentsPage() {
  const [segmentName, setSegmentName] = useState('')
  const [urlPattern, setUrlPattern] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [loadingSegments, setLoadingSegments] = useState(true)
  const [editingSegment, setEditingSegment] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPattern, setEditPattern] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [hasData, setHasData] = useState<{ ga: boolean; gsc: boolean } | null>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    const user = await getAuthUser()
    if (user) {
      setUserId(user.id)

      // Check if user has any GA or GSC data
      const { count: gaCount } = await supabase
        .from('ga_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: gscCount } = await supabase
        .from('gsc_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setHasData({ ga: (gaCount || 0) > 0, gsc: (gscCount || 0) > 0 })

      if ((gaCount || 0) > 0 || (gscCount || 0) > 0) {
        await loadSegments(user.id)
      } else {
        setLoadingSegments(false)
      }
    } else {
      setLoadingSegments(false)
    }
  }

  const loadSegments = async (uid: string) => {
    try {
      setLoadingSegments(true)

      // Get segments from segments table
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('segments')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (segmentsError) throw segmentsError

      if (!segmentsData || segmentsData.length === 0) {
        setSegments([])
        return
      }

      // Get counts for each segment from ga_data and gsc_data
      const segmentList: Segment[] = await Promise.all(
        segmentsData.map(async (seg) => {
          // Get GA count
          const { count: gaCount } = await supabase
            .from('ga_data')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('segment', seg.name)

          // Get GSC count
          const { count: gscCount } = await supabase
            .from('gsc_data')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', uid)
            .eq('segment', seg.name)

          return {
            id: seg.id,
            name: seg.name,
            pattern: seg.pattern,
            gaCount: gaCount || 0,
            gscCount: gscCount || 0,
            createdAt: seg.created_at,
          }
        })
      )

      setSegments(segmentList)
    } catch (err: any) {
      console.error('Error loading segments:', err)
      setMessage({ type: 'error', text: 'Failed to load segments' })
    } finally {
      setLoadingSegments(false)
    }
  }

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!segmentName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a segment name' })
      return
    }

    if (!urlPattern.trim()) {
      setMessage({ type: 'error', text: 'Please enter a URL pattern' })
      return
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Check if segment name already exists for this user
      const { data: existingSegment } = await supabase
        .from('segments')
        .select('id')
        .eq('user_id', userId)
        .eq('name', segmentName.trim())
        .single()

      if (existingSegment) {
        setMessage({
          type: 'error',
          text: `Segment "${segmentName}" already exists. Please use a different name.`,
        })
        setLoading(false)
        return
      }

      // First check if there are any matching URLs (for user feedback)
      const { count: gaCount, error: gaCountError } = await supabase
        .from('ga_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .ilike('page_path', `%${urlPattern}%`)

      if (gaCountError) throw gaCountError

      const { count: gscCount, error: gscCountError } = await supabase
        .from('gsc_data')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .ilike('page', `%${urlPattern}%`)

      if (gscCountError) throw gscCountError

      const gaMatchCount = gaCount || 0
      const gscMatchCount = gscCount || 0

      if (gaMatchCount === 0 && gscMatchCount === 0) {
        setMessage({
          type: 'error',
          text: `No matching URLs found for pattern "${urlPattern}". Please check your pattern and try again.`,
        })
        setLoading(false)
        return
      }

      // Insert segment into segments table
      const { error: insertError } = await supabase.from('segments').insert({
        user_id: userId,
        name: segmentName.trim(),
        pattern: urlPattern.trim(),
      })

      if (insertError) throw insertError

      // Update ga_data directly with pattern matching
      if (gaMatchCount > 0) {
        const { error: gaUpdateError } = await supabase
          .from('ga_data')
          .update({ segment: segmentName.trim() })
          .eq('user_id', userId)
          .ilike('page_path', `%${urlPattern}%`)

        if (gaUpdateError) throw gaUpdateError
      }

      // Update gsc_data directly with pattern matching
      if (gscMatchCount > 0) {
        const { error: gscUpdateError } = await supabase
          .from('gsc_data')
          .update({ segment: segmentName.trim() })
          .eq('user_id', userId)
          .ilike('page', `%${urlPattern}%`)

        if (gscUpdateError) throw gscUpdateError
      }

      setMessage({
        type: 'success',
        text: `Segment "${segmentName}" created successfully! Updated ${gaMatchCount} GA records and ${gscMatchCount} GSC records.`,
      })

      // Reset form
      setSegmentName('')
      setUrlPattern('')

      // Reload segments
      await loadSegments(userId)
    } catch (err: any) {
      console.error('Error creating segment:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to create segment' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment.id)
    setEditName(segment.name)
    setEditPattern(segment.pattern)
  }

  const handleCancelEdit = () => {
    setEditingSegment(null)
    setEditName('')
    setEditPattern('')
  }

  const handleSaveEdit = async (segment: Segment) => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Segment name cannot be empty' })
      return
    }

    if (!editPattern.trim()) {
      setMessage({ type: 'error', text: 'URL pattern cannot be empty' })
      return
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const oldName = segment.name
      const newName = editName.trim()
      const newPattern = editPattern.trim()

      // Check if new name already exists (if name changed)
      if (oldName !== newName) {
        const { data: existingSegment } = await supabase
          .from('segments')
          .select('id')
          .eq('user_id', userId)
          .eq('name', newName)
          .single()

        if (existingSegment) {
          setMessage({
            type: 'error',
            text: `Segment "${newName}" already exists. Please use a different name.`,
          })
          setLoading(false)
          return
        }
      }

      // Update segment in segments table
      const { error: updateError } = await supabase
        .from('segments')
        .update({ name: newName, pattern: newPattern })
        .eq('id', segment.id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // If name changed, update segment name in ga_data and gsc_data
      if (oldName !== newName) {
        const { error: gaError } = await supabase
          .from('ga_data')
          .update({ segment: newName })
          .eq('user_id', userId)
          .eq('segment', oldName)

        if (gaError) throw gaError

        const { error: gscError } = await supabase
          .from('gsc_data')
          .update({ segment: newName })
          .eq('user_id', userId)
          .eq('segment', oldName)

        if (gscError) throw gscError
      }

      // If pattern changed, need to re-apply segment
      if (segment.pattern !== newPattern) {
        // First, clear old segment assignments
        await supabase
          .from('ga_data')
          .update({ segment: null })
          .eq('user_id', userId)
          .eq('segment', newName)

        await supabase
          .from('gsc_data')
          .update({ segment: null })
          .eq('user_id', userId)
          .eq('segment', newName)

        // Then apply new pattern
        await supabase
          .from('ga_data')
          .update({ segment: newName })
          .eq('user_id', userId)
          .ilike('page_path', `%${newPattern}%`)

        await supabase
          .from('gsc_data')
          .update({ segment: newName })
          .eq('user_id', userId)
          .ilike('page', `%${newPattern}%`)
      }

      setMessage({ type: 'success', text: `Segment updated successfully!` })
      setEditingSegment(null)
      setEditName('')
      setEditPattern('')

      // Reload segments
      await loadSegments(userId)
    } catch (err: any) {
      console.error('Error updating segment:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update segment' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (segment: Segment) => {
    if (
      !confirm(
        `Are you sure you want to delete segment "${segment.name}"? This will remove the segment tag from all associated URLs.`
      )
    ) {
      return
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Delete from segments table
      const { error: deleteError } = await supabase
        .from('segments')
        .delete()
        .eq('id', segment.id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Set segment to null in ga_data
      const { error: gaError } = await supabase
        .from('ga_data')
        .update({ segment: null })
        .eq('user_id', userId)
        .eq('segment', segment.name)

      if (gaError) throw gaError

      // Set segment to null in gsc_data
      const { error: gscError } = await supabase
        .from('gsc_data')
        .update({ segment: null })
        .eq('user_id', userId)
        .eq('segment', segment.name)

      if (gscError) throw gscError

      setMessage({ type: 'success', text: `Segment "${segment.name}" deleted successfully!` })

      // Reload segments
      await loadSegments(userId)
    } catch (err: any) {
      console.error('Error deleting segment:', err)
      setMessage({ type: 'error', text: err.message || 'Failed to delete segment' })
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loadingSegments && hasData === null) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Show connect prompt if no data available
  if (hasData && !hasData.ga && !hasData.gsc) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Segments</h1>
          <p className="text-gray-600 mt-1">
            Create segments to group URLs by pattern for analytics
          </p>
        </div>
        <ConnectDataPrompt
          title="Connect Your Data Sources"
          description="To create segments, you need to import data from Google Analytics or Google Search Console first. Segments help you group URLs by patterns for better analysis."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Segments</h1>
        <p className="text-gray-600 mt-1">
          Create segments to group URLs by pattern for analytics
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Create Segment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Segment</h2>

        <form onSubmit={handleCreateSegment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segment Name
            </label>
            <input
              type="text"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="e.g., Blog Posts, Product Pages"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              A descriptive name for this segment
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Contains
            </label>
            <input
              type="text"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="e.g., /blog/, /products/, /category/"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              URLs containing this pattern will be tagged with the segment name
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Segment
              </>
            )}
          </button>
        </form>
      </div>

      {/* Segments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Segments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your existing segments</p>
        </div>

        {loadingSegments ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading segments...</p>
          </div>
        ) : segments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Segments Yet</h3>
            <p className="text-gray-600">Create your first segment using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Segment Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL Pattern
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GA URLs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GSC URLs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total URLs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segments.map((segment, index) => (
                  <tr key={segment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSegment === segment.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{segment.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSegment === segment.id ? (
                        <input
                          type="text"
                          value={editPattern}
                          onChange={(e) => setEditPattern(e.target.value)}
                          className="px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                        />
                      ) : (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                          {segment.pattern}
                        </code>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {segment.gaCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {segment.gscCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {(segment.gaCount + segment.gscCount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editingSegment === segment.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(segment)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-xs font-medium rounded transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(segment)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(segment)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}