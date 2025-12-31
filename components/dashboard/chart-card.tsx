'use client'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
}

export default function ChartCard({
  title,
  description,
  children,
  footer,
  loading = false,
}: ChartCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>

      <div className="mb-4 min-h-64">{children}</div>

      {footer && <div className="border-t border-gray-200 pt-4 mt-4">{footer}</div>}
    </div>
  )
}