'use client'

import Link from 'next/link'

interface ConnectDataPromptProps {
  title?: string
  description?: string
  showGA?: boolean
  showGSC?: boolean
  gaLink?: string
  gscLink?: string
  gaButtonText?: string
  gscButtonText?: string
}

export function ConnectDataPrompt({
  title = 'Connect Your Data Sources',
  description = 'To use this feature, you need to connect Google Analytics or Google Search Console first.',
  showGA = true,
  showGSC = true,
  gaLink = '/dashboard/settings',
  gscLink = '/dashboard/settings',
  gaButtonText = 'Connect Google Analytics',
  gscButtonText = 'Connect Search Console',
}: ConnectDataPromptProps) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-4">🔗</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {showGA && (
          <Link
            href={gaLink}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.84 2.998v17.998c0 .016-.004.03-.004.047v.008c-.016.32-.14.618-.348.854l-.008.008a1.485 1.485 0 01-.378.298c-.008.004-.012.008-.02.012a1.49 1.49 0 01-.464.168l-.02.004a1.5 1.5 0 01-.288.028H2.69a1.5 1.5 0 01-1.5-1.5v-.024l.004-.072V3.002a1.5 1.5 0 011.5-1.5h18.65a1.5 1.5 0 011.5 1.496zM12.002 18.791a4.29 4.29 0 100-8.58 4.29 4.29 0 000 8.58zM19.144 8.794a2.584 2.584 0 100-5.168 2.584 2.584 0 000 5.168z" />
            </svg>
            {gaButtonText}
          </Link>
        )}
        {showGSC && (
          <Link
            href={gscLink}
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {gscButtonText}
          </Link>
        )}
      </div>
    </div>
  )
}