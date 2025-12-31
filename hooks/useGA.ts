import { useState } from 'react'

interface GAAuthorizationResult {
  authUrl: string
}

export function useGA() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authorize = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ga/authorize?userId=${userId}`)
      const data: GAAuthorizationResult = await response.json()

      if (!data.authUrl) {
        throw new Error('Failed to get authorization URL')
      }

      window.location.href = data.authUrl
    } catch (err: any) {
      setError(err.message)
      console.error('GA authorization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async (userId: string, page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/data/ga?page=${page}`, {
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