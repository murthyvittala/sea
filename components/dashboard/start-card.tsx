'use client'

interface StatsCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  loading = false,
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  const trendColorClass = trend && trend > 0 ? 'text-green-600' : 'text-red-600'

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-sm font-semibold ${trendColorClass}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
            </div>
          )}
        </div>

        {icon && <div className={`text-3xl ${colorClasses[color]} p-3 rounded-lg`}>{icon}</div>}
      </div>
    </div>
  )
}