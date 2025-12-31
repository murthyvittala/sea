'use client'

interface FilterOption {
  label: string
  value: string
}

interface DataFiltersProps {
  onSearch: (value: string) => void
  onFilterChange?: (filter: string) => void
  onDateRangeChange?: (startDate: string, endDate: string) => void
  filterOptions?: FilterOption[]
  searchPlaceholder?: string
}

export default function DataFilters({
  onSearch,
  onFilterChange,
  onDateRangeChange,
  filterOptions = [],
  searchPlaceholder = 'Search...',
}: DataFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdown */}
        {filterOptions.length > 0 && onFilterChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
            <select
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range */}
        {onDateRangeChange && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                onChange={(e) => {
                  const endDate = (document.querySelector('[data-end-date]') as HTMLInputElement)?.value
                  if (endDate) onDateRangeChange(e.target.value, endDate)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                data-end-date
                onChange={(e) => {
                  const startDate = (document.querySelector('[data-start-date]') as HTMLInputElement)?.value
                  if (startDate) onDateRangeChange(startDate, e.target.value)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}