'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, getAuthUser } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { FloatingChatButton } from '@/components/ai-analytics'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  
  // Hide floating button on analytics page (already there)
  const showFloatingButton = !pathname?.includes('/analytics')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getAuthUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Use grid on md+: sidebar column (auto) + content (1fr) */}
      <div className="md:grid md:grid-cols-[auto_1fr]">
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onCollapseToggle={() => setCollapsed(!collapsed)} collapsed={collapsed} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Floating AI Chat Button */}
      {showFloatingButton && <FloatingChatButton />}
    </div>
  )
}