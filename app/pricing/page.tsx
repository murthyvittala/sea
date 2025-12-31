'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthUser, getUserProfile } from '@/lib/supabase'
import { PLANS, PlanType } from '@/lib/plans'
import { Button } from '@/components/ui/button'
import PayPalCheckoutButton from '@/components/payment/PayPalCheckoutButton'

export default function PricingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authUser = await getAuthUser()
        if (authUser) {
          setUser(authUser)
          const profile = await getUserProfile(authUser.id)
          if (profile?.plan) {
            setCurrentPlan(profile.plan as PlanType)
          }
        }
      } catch (err) {
        console.error('Error loading user:', err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const handleSubscriptionSuccess = (subscriptionId: string, plan: string) => {
    console.log('Subscription created:', subscriptionId, plan)
    router.push(`/payment/success?subscription_id=${subscriptionId}&plan=${plan}`)
  }

  const handleSubscriptionError = (error: any) => {
    console.error('Subscription error:', error)
    alert('Failed to create subscription. Please try again.')
  }

  const planOrder: PlanType[] = ['free', 'starter', 'pro', 'advanced']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {planOrder.map((planKey) => {
            const plan = PLANS[planKey]
            const isCurrentPlan = currentPlan === planKey
            const isPopular = plan.popular
            
            return (
              <div
                key={planKey}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-transform hover:scale-105 flex flex-col ${
                  isPopular ? 'border-blue-500 lg:scale-105' : 'border-gray-100'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4 z-10">
                    <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold mb-2 text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-4 text-gray-500">
                    {plan.description}
                  </p>
                  
                    {/* Price */}
                    <div className="mb-5">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.priceDisplay}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500">/month</span>
                      )}
                    </div>

                  {/* Features */}
                  <div className="flex-grow">
                    <ul className="space-y-2.5 mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg 
                            className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button - Always at bottom */}
                  <div className="mt-auto pt-4">
                    {planKey === 'free' ? (
                      <Button
                        onClick={() => router.push('/auth/signup')}
                        disabled={isCurrentPlan}
                        className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-full"
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Get Started Free'}
                      </Button>
                    ) : isCurrentPlan ? (
                      <Button disabled className="w-full bg-green-100 text-green-700 rounded-full">
                        Current Plan
                      </Button>
                    ) : user ? (
                      <PayPalCheckoutButton
                        planId={plan.paypalPlanId!}
                        planName={planKey}
                        onSuccess={(subId) => handleSubscriptionSuccess(subId, planKey)}
                        onError={handleSubscriptionError}
                      />
                    ) : (
                      <Button
                        onClick={() => router.push('/auth/login?redirect=/pricing')}
                        className={`w-full rounded-full ${
                          isPopular 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        Sign Up to Subscribe
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Feature</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Free</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Starter</th>
                  <th className="text-center py-3 px-2 font-medium text-blue-600">Pro</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Advanced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 text-gray-700">Websites</td>
                  <td className="py-3 px-2 text-center">1</td>
                  <td className="py-3 px-2 text-center">1</td>
                  <td className="py-3 px-2 text-center font-medium text-blue-600">3</td>
                  <td className="py-3 px-2 text-center">10</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Data Retention</td>
                  <td className="py-3 px-2 text-center">15 days</td>
                  <td className="py-3 px-2 text-center">60 days</td>
                  <td className="py-3 px-2 text-center font-medium text-blue-600">90 days</td>
                  <td className="py-3 px-2 text-center">90 days</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Records Limit</td>
                  <td className="py-3 px-2 text-center">10k</td>
                  <td className="py-3 px-2 text-center">50k</td>
                  <td className="py-3 px-2 text-center font-medium text-blue-600">100k</td>
                  <td className="py-3 px-2 text-center">100k</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">AI Analytics/day</td>
                  <td className="py-3 px-2 text-center">3</td>
                  <td className="py-3 px-2 text-center">10</td>
                  <td className="py-3 px-2 text-center font-medium text-blue-600">20</td>
                  <td className="py-3 px-2 text-center">50</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">AI Model Choice</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Use Own API Key</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">24/7 Email Support</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                  <td className="py-3 px-2 text-center text-green-500">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Dedicated Manager</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                  <td className="py-3 px-2 text-center text-gray-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="font-medium cursor-pointer">Can I cancel anytime?</summary>
              <p className="mt-2 text-gray-600">Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="font-medium cursor-pointer">Can I upgrade or downgrade my plan?</summary>
              <p className="mt-2 text-gray-600">Absolutely! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="font-medium cursor-pointer">What payment methods do you accept?</summary>
              <p className="mt-2 text-gray-600">We accept PayPal and all major credit cards through PayPal&apos;s secure payment system.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="font-medium cursor-pointer">Can I use my own AI API keys?</summary>
              <p className="mt-2 text-gray-600">Yes! Starting from the Starter plan, you can connect your own API keys from OpenAI, Anthropic, Google, or Groq for unlimited AI analytics at your own cost.</p>
            </details>
            <details className="bg-white rounded-lg border border-gray-200 p-4">
              <summary className="font-medium cursor-pointer">What AI models are available?</summary>
              <p className="mt-2 text-gray-600">Paid plans include access to models from OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and Groq. You can switch between them anytime.</p>
            </details>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Secure payments powered by</p>
          <div className="flex justify-center items-center gap-6">
            <svg className="h-8 text-blue-600" viewBox="0 0 124 33" fill="currentColor">
              <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906z"/>
            </svg>
            <div className="text-gray-400">|</div>
            <span className="text-gray-600 font-medium">256-bit SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}