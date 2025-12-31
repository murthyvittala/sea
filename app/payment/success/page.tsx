'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your subscription has been activated. You'll be redirected to your dashboard shortly.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            ✓ Account upgraded
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            ✓ All features unlocked
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            ✓ Subscription active
          </div>
        </div>

        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
        >
          Go to Dashboard
        </Button>

        <p className="text-sm text-gray-500 mt-4">Redirecting in 3 seconds...</p>
      </div>
    </div>
  )
}