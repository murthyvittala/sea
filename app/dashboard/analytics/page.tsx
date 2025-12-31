'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: any[]
  chartType?: string
  chartConfig?: {
    xAxis?: string
    yAxis?: string
    title?: string
  }
  sql?: string
  timestamp: Date
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// Format markdown text to JSX
function formatMarkdown(text: string): React.ReactNode {
  if (!text) return null
  
  // Ensure text is a string
  const textStr = typeof text === 'string' ? text : String(text)

  // Split by numbered list items (1. 2. etc.)
  const lines = textStr.split(/(?=\d+\.\s)/g).filter(Boolean)

  return lines.map((line, lineIndex) => {
    // Check if this is a numbered list item
    const numberedMatch = line.match(/^(\d+)\.\s*(.*)$/s)
    
    if (numberedMatch) {
      const [, number, content] = numberedMatch
      return (
        <div key={lineIndex} className="mb-3">
          <span className="font-semibold text-blue-600 mr-2">{number}.</span>
          {formatInlineMarkdown(content.trim())}
        </div>
      )
    }

    // Regular paragraph
    return (
      <p key={lineIndex} className="mb-2">
        {formatInlineMarkdown(line.trim())}
      </p>
    )
  })
}

// Format inline markdown (bold, italic, etc.)
function formatInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  // Match **bold** patterns
  const boldRegex = /\*\*([^*]+)\*\*/g
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      )
    }

    // Add the bold text
    parts.push(
      <strong key={key++} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>{text.slice(lastIndex)}</span>
    )
  }

  return parts.length > 0 ? parts : text
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [showSql, setShowSql] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current result (last assistant message with data)
  const currentResult = messages.filter(m => m.role === 'assistant' && m.data).slice(-1)[0]

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getAuthUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !userId) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          sessionId,
        }),
      })

      const result = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.error || result.summary || 'No response received.',
        data: result.data,
        chartType: result.chartType,
        chartConfig: result.chartConfig,
        sql: result.sql,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const renderChart = (data: any[], chartType: string, config: any) => {
    if (!data || data.length === 0) return null

    const xKey = config?.xAxis || Object.keys(data[0])[0]
    const yKey = config?.yAxis || Object.keys(data[0])[1]

    // Format data for charts
    const chartData = data.slice(0, 20).map(item => ({
      ...item,
      [xKey]: item[xKey]?.toString().substring(0, 20) || 'N/A',
      [yKey]: parseFloat(item[yKey]) || 0,
    }))

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey={xKey} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return null

    const columns = Object.keys(data[0]).filter(col => !['id', 'user_id', 'created_at', 'updated_at'].includes(col))
    const displayData = data.slice(0, 20)

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map(col => (
                  <td key={col} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {typeof row[col] === 'number' 
                      ? row[col].toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : row[col]?.toString().substring(0, 50) || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 20 && (
          <p className="text-sm text-gray-500 mt-2 px-4">
            Showing 20 of {data.length} results
          </p>
        )}
      </div>
    )
  }

  const suggestedQueries = [
    "Show me traffic by country this month",
    "What are my top 10 pages by sessions?",
    "Compare mobile vs desktop traffic",
    "Show me daily sessions for the last 7 days",
    "Which traffic sources bring the most users?",
  ]

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-bold text-gray-900">🤖 AI Analytics Assistant</h1>
          <p className="text-sm text-gray-600">Ask questions about your analytics data in plain English</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Ask me anything about your data</h2>
              <p className="text-gray-500 mb-6">Try one of these questions:</p>
              <div className="space-y-2">
                {suggestedQueries.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(query)}
                    className="block w-full text-left px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-sm text-gray-700"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm">{formatMarkdown(message.content)}</div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                {message.sql && (
                  <button
                    onClick={() => setShowSql(!showSql)}
                    className="text-xs mt-2 text-blue-500 hover:underline"
                  >
                    {showSql ? 'Hide SQL' : 'Show SQL'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Analyzing your data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your analytics data..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? '...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>

      {/* Right Panel - Results */}
      <div className="w-1/2 flex flex-col bg-white overflow-hidden">
        {currentResult ? (
          <div className="flex-1 overflow-y-auto">
            {/* Summary Card */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">📈 AI Insight</h2>
              <div className="text-gray-700 leading-relaxed">
                {formatMarkdown(currentResult.content)}
              </div>
              
              {showSql && currentResult.sql && (
                <div className="mt-3 p-3 bg-gray-900 rounded-lg overflow-x-auto">
                  <code className="text-xs text-green-400 whitespace-pre-wrap">
                    {currentResult.sql}
                  </code>
                </div>
              )}
            </div>

            {/* Chart */}
            {currentResult.data && currentResult.data.length > 0 && currentResult.chartType !== 'table' && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  {currentResult.chartConfig?.title || 'Visualization'}
                </h3>
                {renderChart(currentResult.data, currentResult.chartType || 'bar', currentResult.chartConfig)}
              </div>
            )}

            {/* Data Table */}
            {currentResult.data && currentResult.data.length > 0 && (
              <div className="p-4">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  📋 Data ({currentResult.data.length} rows)
                </h3>
                {renderTable(currentResult.data)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">Your results will appear here</p>
              <p className="text-sm">Ask a question to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
