'use client'

import Link from 'next/link'

export default function FloatingChatButton() {
  return (
    <Link
      href="/dashboard/analytics"
      className="fixed bottom-6 left-6 z-50 group"
      title="AI Analytics Agent"
    >
      <div className="relative">
        {/* Pulse animation */}
        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
        
        {/* Main button */}
        <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
          {/* AI Icon */}
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-2.063.352a18.062 18.062 0 01-6.144 0l-2.063-.352c-1.716-.293-2.299-2.379-1.067-3.611L5 14.5"
            />
          </svg>
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          AI Analytics Agent
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    </Link>
  )
}
