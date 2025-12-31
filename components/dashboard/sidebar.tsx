'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PLANS } from '@/lib/plans'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// SVG Icons
const BarChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const ZapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SegmentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
)

const ChevronRightIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const AIAgentIcon = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
    <circle cx="12" cy="12" r="4" fill="currentColor" className="text-purple-500" />
    <path stroke="currentColor" strokeWidth={2} d="M8 16c1.5-2 6.5-2 8 0" />
    <circle cx="9" cy="10" r="1" fill="white" />
    <circle cx="15" cy="10" r="1" fill="white" />
  </svg>
)

interface SidebarLink {
  label: string
  href: string
  icon: React.ReactNode
  active: boolean
  disabled?: boolean
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [segmentsOpen, setSegmentsOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const { plan, usage } = useAuth()
  const planLimits = PLANS[(plan || 'free') as keyof typeof PLANS]?.limits || PLANS['free'].limits

  // Check if any segment or content page is active
  const isSegmentActive = pathname?.includes('/segments')
  const isContentActive = pathname?.includes('/content')

  // Auto-expand segments if a segment page is active
  React.useEffect(() => {
    if (isSegmentActive) {
      setSegmentsOpen(true)
    }
  }, [isSegmentActive])

  // Auto-expand content if a content page is active
  React.useEffect(() => {
    if (isContentActive) {
      setContentOpen(true)
    }
  }, [isContentActive])

  // Helper to check if feature is over limit
  function isDisabled(feature: string) {
    if (!usage) return false
    switch (feature) {
      case 'settings':
        return usage.websites_added >= planLimits.websites
      case 'meta':
        return usage.meta_titles_crawled >= planLimits.metaTitles
      case 'segments':
        return usage.segments_created >= planLimits.segments
      case 'traffic':
        return usage.traffic_analytics_weeks >= planLimits.trafficWeeks
      case 'ai-agents':
        return usage.ai_agents_viewed >= planLimits.aiAgents
      default:
        return false
    }
  }

  const sidebarLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <BarChartIcon />,
      active: pathname === '/dashboard',
      disabled: false,
    },
  ]

  const contentSubLinks = [
    {
      label: 'Meta Titles & Descriptions',
      href: '/dashboard/content/meta',
      active: pathname === '/dashboard/content/meta',
    },
  ];

  const segmentSubLinks = [
    {
      label: 'Create Segments',
      href: '/dashboard/segments/create',
      active: pathname === '/dashboard/segments/create',
    },
    {
      label: 'Traffic by Segments',
      href: '/dashboard/segments/traffic',
      active: pathname === '/dashboard/segments/traffic',
    },
    {
      label: 'Keywords by Segments',
      href: '/dashboard/segments/keywords',
      active: pathname === '/dashboard/segments/keywords',
    },
  ]

  const bottomLinks: SidebarLink[] = [
    {
      label: 'Traffic Analytics',
      href: '/dashboard/traffic',
      icon: <TrendingUpIcon />,
      active: pathname.includes('/traffic') && !pathname.includes('/segments'),
    },
    {
      label: 'Keywords',
      href: '/dashboard/keywords',
      icon: <ZapIcon />,
      active: pathname.includes('/keywords') && !pathname.includes('/segments'),
    },
    {
      label: 'PageSpeed',
      href: '/dashboard/pagespeed',
      icon: <BarChartIcon />,
      active: pathname.includes('/pagespeed'),
    },
    // --- AI Agents menu item ---
    {
      label: 'AI Agents',
      href: '/dashboard/ai-agents',
      icon: (
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-400 opacity-30 blur-sm"></span>
          <AIAgentIcon />
        </span>
      ),
      active: pathname.includes('/ai-agents'),
    },
    // --- end AI Agents ---
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: <SettingsIcon />,
      active: pathname.includes('/settings'),
    },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-700"
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-auto md:overflow-visible ${collapsed ? 'md:w-16' : 'md:w-auto'} w-auto shadow-lg overflow-y-auto`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
              SEO
            </div>
            <span className={`text-xl font-bold block ${collapsed ? 'md:hidden' : 'md:block'}`}>SEO Analytics</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-6 space-y-2">
          {/* Dashboard Link */}
          {sidebarLinks.map((link) => {
            const baseState = link.active ? 'bg-blue-500 text-white shadow-lg' : link.disabled ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            const linkClass = `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 ${baseState}`
            return (
              <div key={link.label} className="relative">
                <Link
                  href={link.href}
                  onClick={e => {
                    if (link.disabled) {
                      e.preventDefault()
                      return
                    }
                    if (window.innerWidth < 768) {
                      setIsOpen(false)
                    }
                  }}
                  className={linkClass}
                  tabIndex={link.disabled ? -1 : 0}
                  aria-disabled={link.disabled}
                >
                  {link.icon}
                  <span className={`${collapsed ? 'block md:hidden' : 'block'}`}>{link.label}</span>
                  {link.active && (
                    <div className="ml-auto transform -rotate-90">
                      <ChevronDownIcon />
                    </div>
                  )}
                </Link>
                {link.disabled && (
                  <div className="absolute left-0 right-0 top-full mt-1 text-xs text-yellow-400 bg-slate-900 rounded shadow-lg px-2 py-1 font-semibold z-10">
                    Upgrade your plan to unlock this feature
                  </div>
                )}
              </div>
            )
          })}


          {/* Content - Collapsible Menu */}
          <div>
            <button
              onClick={() => setContentOpen && setContentOpen((prev: boolean) => !prev)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                pathname?.includes('/content')
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BarChartIcon />
              <span className={`${collapsed ? 'block md:hidden' : 'block'}`}>Content</span>
              {!collapsed && (
                <div className="ml-auto">
                  <ChevronRightIcon open={typeof contentOpen !== 'undefined' ? contentOpen : false} />
                </div>
              )}
            </button>

            {/* Sub-menu items */}
            {typeof contentOpen !== 'undefined' && contentOpen && !collapsed && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-600 space-y-1">
                {contentSubLinks.map((subLink) => (
                  <Link
                    key={subLink.label}
                    href={subLink.href}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setIsOpen(false)
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      subLink.active
                        ? 'bg-blue-500/50 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{subLink.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Segments - Collapsible Menu */}
          <div>
            <button
              onClick={() => setSegmentsOpen(!segmentsOpen)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 ${
                isSegmentActive
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <SegmentsIcon />
              <span className={`${collapsed ? 'block md:hidden' : 'block'}`}>Segments</span>
              {!collapsed && (
                <div className="ml-auto">
                  <ChevronRightIcon open={segmentsOpen} />
                </div>
              )}
            </button>

            {/* Sub-menu items */}
            {segmentsOpen && !collapsed && (
              <div className="mt-1 ml-4 pl-4 border-l border-slate-600 space-y-1">
                {segmentSubLinks.map((subLink) => (
                  <Link
                    key={subLink.label}
                    href={subLink.href}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setIsOpen(false)
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      subLink.active
                        ? 'bg-blue-500/50 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{subLink.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Rest of the links */}
          {bottomLinks.map((link) => {
            // Special styling for AI Agents
            const isAIAgent = link.label === 'AI Agents'
            const baseState = link.active
              ? isAIAgent
                ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white shadow-xl ring-2 ring-purple-400'
                : 'bg-blue-500 text-white shadow-lg'
              : isAIAgent
                ? 'text-purple-200 hover:bg-gradient-to-r hover:from-purple-700 hover:via-pink-600 hover:to-blue-600 hover:text-white ring-1 ring-purple-700'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            const linkClass = `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 font-semibold ${baseState} ${isAIAgent ? 'mt-2 border-2 border-purple-500/40 shadow-lg' : ''}`
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsOpen(false)
                  }
                }}
                className={linkClass}
              >
                {link.icon}
                <span className={`${collapsed ? 'block md:hidden' : 'block'} ${isAIAgent ? 'tracking-wide text-purple-100 drop-shadow' : ''}`}>
                  {link.label}
                </span>
                {link.active && (
                  <div className="ml-auto transform -rotate-90">
                    <ChevronDownIcon />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Help Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700 bg-slate-800 bg-opacity-50 md:relative md:bg-transparent md:border-t-0">
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-3">Need help?</p>
            <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200">
              Contact Support
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
