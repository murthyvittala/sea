import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getAuthUser } from '@/lib/supabase'

interface User {
  id: string
  email?: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>('free')
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authUser = await getAuthUser()
        setUser(authUser as User | null)
        if (authUser) {
          // Commented out problematic API calls
          // const res = await fetch(`/api/user-profile?userId=${authUser.id}`)
          // const profile = await res.json()
          // setPlan(profile.plan || 'free')
          // const usageRes = await fetch(`/api/usage?userId=${authUser.id}`)
          // const usageData = await usageRes.json()
          // setUsage(usageData)
        }
      } catch (err: any) {
        setError(err.message)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        setUser(session.user as any)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return { user, loading, error, plan, usage, signOut }
}

export function useRequireAuth() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  return { user, loading }
}