import { useState } from 'react'

interface GSCAuthorizationResult {
  authUrl: string
}

export function useGSC() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authorize = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/gsc/authorize?userId=${userId}`)
      const data: GSCAuthorizationResult = await response.json()

      if (!data.authUrl) {
        throw new Error('Failed to get authorization URL')
      }

      window.location.href = data.authUrl
    } catch (err: any) {
      setError(err.message)
      console.error('GSC authorization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async (userId: string, page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/data/gsc?page=${page}`, {
        headers: {
          'x-user-id': userId,
        },
      })

      const data = await response.json()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { authorize, fetchData, loading, error }
}