'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PLANS } from '@/lib/plans'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, getAuthUser } from '@/lib/supabase'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const { plan, usage } = useAuth()
  const allowedPlans = ['free', 'starter', 'pro', 'advanced']
  const safePlan = allowedPlans.includes(plan) ? plan : 'free'
  const planLimits = PLANS[safePlan as keyof typeof PLANS].limits

  // Check if user is at any limit
  function atLimit() {
    if (!usage) return false
    return (
      usage.websites_added >= planLimits.websites ||
      usage.meta_titles_crawled >= planLimits.metaTitles ||
      usage.segments_created >= planLimits.segments ||
      usage.traffic_analytics_weeks >= planLimits.trafficWeeks ||
      usage.ai_agents_viewed >= planLimits.aiAgents
    )
  }

  useEffect(() => {
    const loadUser = async () => {
      const user = await getAuthUser()
      if (user) {
        setUserEmail(user.email || '')
      }
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Upgrade Prompt */}
      {atLimit() && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 font-semibold text-center py-3 px-4 shadow-lg">
          You have reached your plan limits. <Link href="/pricing" className="underline text-yellow-900 font-bold">Upgrade your plan</Link> to unlock more features.
        </div>
      )}
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Title */}
        <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">Dashboard</h1>
        <div className="flex-1 lg:hidden"></div>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{userEmail.split('@')[0]}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}