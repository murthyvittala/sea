import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api.sandbox.paypal.com'
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_SECRET = process.env.PAYPAL_SECRET

const PLAN_MAPPING: Record<string, { id: string; name: string }> = {
  starter: { id: process.env.PAYPAL_PLAN_ID_STARTER!, name: 'Starter Plan' },
  pro: { id: process.env.PAYPAL_PLAN_ID_PRO!, name: 'Pro Plan' },
  advanced: { id: process.env.PAYPAL_PLAN_ID_ADVANCED!, name: 'Advanced Plan' },
}

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId || !PLAN_MAPPING[planId]) {
      return NextResponse.json({ error: 'Invalid plan or user ID' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const accessToken = await getPayPalAccessToken()
    const planDetails = PLAN_MAPPING[planId]

    // Create subscription
    const subscriptionResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planDetails.id,
        custom_id: userId, // Pass user ID for webhook identification
        subscriber: {
          name: {
            given_name: profile.display_name || 'User',
          },
          email_address: profile.email || profile.id,
        },
        application_context: {
          brand_name: 'SEO Analytics',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
        },
      }),
    })

    const subscription = await subscriptionResponse.json()

    if (!subscription.id) {
      throw new Error('Failed to create subscription')
    }

    // Find approval link
    const approvalLink = subscription.links.find(
      (link: any) => link.rel === 'approve'
    )

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalLink: approvalLink?.href,
    })
  } catch (err) {
    console.error('PayPal subscription error:', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}