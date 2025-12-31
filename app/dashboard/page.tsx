'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser, getUserProfile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  plan: string
  role: string
  google_auth_token?: any
  website_url?: string
  sitemap_url?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getAuthUser()
        if (user) {
          const userProfile = await getUserProfile(user.id)
          setProfile(userProfile as UserProfile)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleConnectGoogle = async () => {
    try {
      setConnecting(true)
      const user = await getAuthUser()
      if (!user) {
        alert('User not authenticated')
        return
      }

      console.log('🔐 Starting Google OAuth for user:', user.id)

      const response = await fetch(
        `/api/google/authorize?userId=${user.id}`
      )
      const data = await response.json()
      window.location.href = data.authUrl
    } catch (err) {
      console.error('Error connecting Google:', err)
      alert('Failed to connect Google services')
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const bothConnected = profile?.google_auth_token
  const setupComplete = profile?.website_url && bothConnected

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to SEO Analytics</h1>
        <p className="text-blue-100 mb-6">
          Monitor your website's SEO performance with real-time analytics
        </p>
        <div className="flex flex-wrap gap-4">
          {!setupComplete ? (
            <Button 
              onClick={() => router.push('/dashboard/settings')}
              className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-2 px-6 rounded-lg"
            >
              ⚙️ Complete Setup
            </Button>
          ) : (
            <div className="text-green-200 font-semibold flex items-center gap-2">
              ✓ All systems connected
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Plan"
          value={profile?.plan?.toUpperCase() || 'FREE'}
          icon="📦"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Website"
          value={profile?.website_url ? '✓ Set' : 'Not Set'}
          icon="🌐"
          color={profile?.website_url ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}
        />
        <StatCard
          title="Google Services"
          value={bothConnected ? '✓ Connected' : 'Not Connected'}
          icon="🔗"
          color={bothConnected ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}
        />
        <StatCard
          title="Setup Status"
          value={setupComplete ? '100%' : '0%'}
          icon="📊"
          color={setupComplete ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}
        />
      </div>

      {/* Google Integrations Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Google Integrations</h2>
            <p className="text-gray-600 text-sm mt-1">
              Connect your Google services for complete analytics
            </p>
          </div>
          {bothConnected && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
              ✓ Fully Connected
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Google Analytics 4 */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📊</span>
                <h3 className="font-semibold text-gray-900">Google Analytics 4</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Track website traffic, user behavior, and conversions
              </p>
              {profile?.google_auth_token && (
                <p className="text-green-600 text-xs mt-2">✓ Connected</p>
              )}
            </div>
            <div className="flex gap-2">
              {profile?.google_auth_token ? (
                <Button
                  onClick={handleConnectGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Reconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>

          {/* Google Search Console */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔍</span>
                <h3 className="font-semibold text-gray-900">Google Search Console</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Monitor search performance, keywords, and site health
              </p>
              {profile?.google_auth_token && (
                <p className="text-green-600 text-xs mt-2">✓ Connected</p>
              )}
            </div>
            <div className="flex gap-2">
              {profile?.google_auth_token ? (
                <Button
                  onClick={handleConnectGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Reconnect
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>💡 Tip:</strong> Click "Connect" to authorize both services with a single Google account. You only need to do this once.
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Configure Website</h3>
              <p className="text-gray-600 text-sm">
                Go to Settings and add your website URL and sitemap.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Connect Google Services</h3>
              <p className="text-gray-600 text-sm">
                Click "Connect" above to authorize Google Analytics and Search Console.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Your Analytics</h3>
              <p className="text-gray-600 text-sm">
                Start monitoring your SEO performance and traffic metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          title="Traffic Analytics"
          description="Real-time GA4 data with sessions, users, and pageviews"
          icon="📈"
        />
        <FeatureCard
          title="Keyword Tracking"
          description="Monitor your rankings with Search Console integration"
          icon="🔍"
        />
        <FeatureCard
          title="Performance Metrics"
          description="Track page speed and Core Web Vitals"
          icon="⚡"
        />
      </div>

      {/* Go to Settings Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => router.push('/dashboard/settings')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-6 rounded-lg"
        >
          ⚙️ Go to Settings
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}