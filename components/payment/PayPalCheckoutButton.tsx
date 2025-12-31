// components/PayPalCheckoutButton.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface PayPalCheckoutButtonProps {
  planId: string
  planName: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: any) => void
}

declare global {
  interface Window {
    paypal?: any
  }
}

export default function PayPalCheckoutButton({
  planId,
  planName,
  onSuccess,
  onError,
}: PayPalCheckoutButtonProps) {
  const paypalContainerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no-planid'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const renderedRef = useRef(false)

  useEffect(() => {
    console.log('PayPalCheckoutButton mounted:', { planId, planName })
    
    if (!planId) {
      console.error('No planId provided')
      setStatus('no-planid')
      return
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    console.log('PayPal Client ID exists:', !!clientId)

    if (!clientId) {
      setErrorMsg('PayPal not configured')
      setStatus('error')
      return
    }

    renderedRef.current = false

    const loadPayPalScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.paypal) {
          console.log('PayPal SDK already loaded')
          resolve()
          return
        }

        const existingScript = document.getElementById('paypal-sdk-script')
        if (existingScript) {
          const checkPayPal = setInterval(() => {
            if (window.paypal) {
              clearInterval(checkPayPal)
              resolve()
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkPayPal)
            if (window.paypal) resolve()
            else reject(new Error('PayPal SDK timeout'))
          }, 10000)
          return
        }

        console.log('Loading PayPal SDK...')
        const script = document.createElement('script')
        script.id = 'paypal-sdk-script'
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
        script.setAttribute('data-sdk-integration-source', 'button-factory')
        script.async = true

        script.onload = () => {
          console.log('PayPal SDK loaded')
          setTimeout(() => {
            if (window.paypal) resolve()
            else reject(new Error('PayPal not available'))
          }, 500)
        }

        script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
        document.body.appendChild(script)
      })
    }

    const renderButton = async () => {
      try {
        await loadPayPalScript()

        if (!window.paypal || !paypalContainerRef.current) {
          throw new Error('PayPal SDK or container not available')
        }

        if (renderedRef.current) return

        paypalContainerRef.current.innerHTML = ''
        console.log('Rendering PayPal button for plan:', planId)

        const buttons = window.paypal.Buttons({
          // Style matching PayPal's button generator output
          style: {
            shape: 'pill',
            color: 'blue',
            layout: 'horizontal',
            label: 'subscribe',
            tagline: false
          },
          
          createSubscription: function(data: any, actions: any) {
            console.log('Creating subscription for plan:', planId)
            return actions.subscription.create({
              plan_id: planId
            })
          },

          onApprove: async function(data: any) {
            console.log('Subscription approved:', data.subscriptionID)

            try {
              const response = await fetch('/api/paypal/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscriptionId: data.subscriptionID,
                  plan: planName,
                }),
              })

              if (response.ok) {
                onSuccess(data.subscriptionID)
              } else {
                // Still proceed - webhook will handle activation
                console.warn('Activation API failed, webhook will handle it')
                onSuccess(data.subscriptionID)
              }
            } catch (err) {
              console.error('Activation error:', err)
              // Still proceed - webhook will handle activation
              onSuccess(data.subscriptionID)
            }
          },

          onError: function(err: any) {
            console.error('PayPal error:', err)
            setErrorMsg('Payment failed')
            onError(err)
          },

          onCancel: function() {
            console.log('User cancelled subscription')
          },
        })

        if (buttons.isEligible()) {
          await buttons.render(paypalContainerRef.current)
          renderedRef.current = true
          setStatus('ready')
          console.log('PayPal button rendered successfully')
        } else {
          throw new Error('PayPal not available')
        }
      } catch (err: any) {
        console.error('PayPal setup error:', err)
        setErrorMsg(err.message || 'Setup failed')
        setStatus('error')
      }
    }

    const timeoutId = setTimeout(renderButton, 300)
    return () => clearTimeout(timeoutId)
  }, [planId, planName, onSuccess, onError])

  if (status === 'no-planid') {
    return (
      <Button disabled className="w-full bg-gray-200 text-gray-500 rounded-full">
        Plan not available
      </Button>
    )
  }

  if (status === 'error') {
    return (
      <Button
        onClick={() => window.location.reload()}
        className="w-full bg-red-100 text-red-700 hover:bg-red-200 rounded-full"
      >
        {errorMsg} - Retry
      </Button>
    )
  }

  return (
    <div className="w-full">
      {status === 'loading' && (
        <div className="flex justify-center items-center py-3 bg-blue-50 rounded-full">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-blue-600">Loading PayPal...</span>
        </div>
      )}
      <div 
        ref={paypalContainerRef}
        id={`paypal-button-container-${planId}`}
        className={status === 'loading' ? 'hidden' : 'min-h-[45px]'}
      />
    </div>
  )
}