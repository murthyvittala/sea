'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, checkUserExists, createUserProfile } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const ecode = searchParams.get('error_code')

      if (error) {
        const decoded = decodeURIComponent(errorDescription || error)
        console.warn('OAuth/error callback:', decoded)
        setErrorMsg(decoded)
        setErrorCode(ecode)
        return
      }

      try {
        // Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        
        if (existingSession?.user) {
          await ensureUserProfile(existingSession.user.id, existingSession.user.email || '')
          router.push('/dashboard')
          return
        }

        // Check for code param (OAuth/PKCE flows)
        const code = searchParams.get('code')
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setErrorMsg(exchangeError.message)
            return
          }
          
          if (data?.session?.user) {
            await ensureUserProfile(data.session.user.id, data.session.user.email || '')
            router.push('/dashboard')
            return
          }
        }

        // Check URL hash for token (magic link flows)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (setSessionError) {
              console.error('Set session error:', setSessionError)
              setErrorMsg(setSessionError.message)
              return
            }
            
            if (data?.session?.user) {
              await ensureUserProfile(data.session.user.id, data.session.user.email || '')
              router.push('/dashboard')
              return
            }
          }
        }

        // No session found, redirect to login
        router.push('/auth/login?message=verification_complete')
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
        console.error('Callback error:', err)
        setErrorMsg(errorMessage)
      }
    }

    handleCallback()
  }, [searchParams, router])

  // Ensure user exists in USERS table with default free plan
  const ensureUserProfile = async (userId: string, email: string) => {
    try {
      const exists = await checkUserExists(userId)
      
      if (!exists) {
        await createUserProfile(userId, email)
        console.log('Created new user profile in users table')
      }
    } catch (innerErr) {
      console.warn('User profile creation/check failed:', innerErr)
    }
  }

  // Resend magic link function
  const handleResend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setResendMessage(null)
    setResendLoading(true)
    
    try {
      if (!resendEmail) {
        setResendMessage('Please enter your email to resend the verification link.')
        setResendLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      setResendMessage('Verification link resent. Check your inbox.')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification link.'
      setResendMessage(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md text-center">
        {!errorMsg && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Completing authentication...</p>
          </>
        )}

        {errorMsg && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Issue</h2>
            <p className="text-sm text-gray-700 mb-4">{errorMsg}</p>

            {errorCode === 'otp_expired' || errorMsg.toLowerCase().includes('expired') ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Your email link has expired. Enter your email to resend a new verification link.
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={resendLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded transition-colors"
                    >
                      {resendLoading ? 'Sending...' : 'Resend Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/auth/login')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
                {resendMessage && (
                  <p className={`mt-3 text-sm ${resendMessage.includes('resent') ? 'text-green-600' : 'text-red-600'}`}>
                    {resendMessage}
                  </p>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}