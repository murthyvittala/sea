import { useEffect, useState } from 'react'
import { getUserProfile, updateUserProfile } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface UserProfile {
  id: string
  role: string
  plan: string
  website_limit: number
  keyword_limit: number
  ga_token?: string
  gsc_token?: string
  openai_api_key?: string
  member_start?: string
  member_end?: string
  website_url?: string
  sitemap_url?: string
  created_at?: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch (err: any) {
        setError(err.message)
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No authenticated user')

    try {
      const updated = await updateUserProfile(user.id, updates)
      setProfile(updated)
      return updated
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return { profile, loading, error, updateProfile }
}
