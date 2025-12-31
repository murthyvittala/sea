'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile } from '@/lib/supabase'
import { PLANS, PlanType } from '@/lib/plans'

// SVG Icons
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const LogOutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CrownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.5 4L12 3l3.5 4L19 3v12a2 2 0 01-2 2H7a2 2 0 01-2-2V3z" />
  </svg>
)

const SparkleIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
)

// Plan badge colors
const planColors: Record<PlanType, { bg: string; text: string; dot: string }> = {
  free: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  starter: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  pro: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  advanced: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  enterprise: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

export function Header({ onCollapseToggle, collapsed }: { onCollapseToggle?: () => void; collapsed?: boolean }) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanType>('free')
  const [planLoading, setPlanLoading] = useState(true)
  const profileRef = useRef<HTMLDivElement>(null)

  // Fetch user plan from USERS table
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id) // This now reads from 'users' table
          if (profile?.plan) {
            setUserPlan(profile.plan as PlanType)
          } else {
            setUserPlan('free')
          }
        } catch (err) {
          console.error('Error fetching user plan:', err)
          setUserPlan('free')
        } finally {
          setPlanLoading(false)
        }
      } else {
        setPlanLoading(false)
      }
    }

    fetchUserPlan()
  }, [user?.id])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const userEmail = user?.email || 'User'
  const userInitials =
    user?.email
      ?.split('@')[0]
      ?.substring(0, 2)
      ?.toUpperCase() || 'U'

  // Get plan config
  const planConfig = PLANS[userPlan] || PLANS.free
  const colors = planColors[userPlan] || planColors.free

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            <MenuIcon />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => onCollapseToggle?.()}
            className="hidden md:inline-flex p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>

          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back to SEO Analytics</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Upgrade Button - Show only for free plan */}
          {!planLoading && userPlan === 'free' && (
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
            >
              <SparkleIcon />
              Upgrade
            </Link>
          )}

          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group text-gray-700 group-hover:text-gray-900">
            <BellIcon />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {userEmail.split('@')[0]}
                </p>
                {planLoading ? (
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                      <span className={`text-xs ${colors.text}`}>
                        {planConfig.name} Plan
                      </span>
                    </div>
                    {userPlan === 'free' && (
                      <Link
                        href="/pricing"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2">
                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                      {planConfig.name} Plan
                    </span>
                    {userPlan === 'free' && (
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <SparkleIcon />
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <UserIcon />
                  Profile Settings
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <SettingsIcon />
                  Account Settings
                </Link>

                <Link
                  href="/pricing"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <CrownIcon />
                  {userPlan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm"
                >
                  <LogOutIcon />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header Info */}
      <div className="md:hidden px-6 py-3 bg-blue-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Plan:</span>{' '}
            <span className={`${colors.text}`}>{planConfig.name}</span>
          </p>
          {userPlan === 'free' && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium"
            >
              <SparkleIcon />
              Upgrade
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
