'use client'

import { useState } from 'react'

interface ExportButtonProps {
  data: any[]
  filename?: string
  format?: 'csv' | 'json'
}

export default function ExportButton({
  data,
  filename = 'data',
  format = 'csv',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const exportToCSV = () => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            }
            return value
          })
          .join(',')
      ),
    ].join('\n')

    downloadFile(csv, `${filename}.csv`, 'text/csv')
  }

  const exportToJSON = () => {
    if (data.length === 0) return

    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `${filename}.json`, 'application/json')
  }

  const downloadFile = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      if (format === 'csv') {
        exportToCSV()
      } else {
        exportToJSON()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading || data.length === 0}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
    >
      {loading ? '⏳ Exporting...' : `📥 Export as ${format.toUpperCase()}`}
    </button>
  )
}