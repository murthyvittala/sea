import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state') // userId
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=${encodeURIComponent('GSC authorization failed')}`,
          process.env.NEXT_PUBLIC_SITE_URL
        )
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=Missing code or state', process.env.NEXT_PUBLIC_SITE_URL!)
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/gsc/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      throw new Error('Failed to get access token')
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Save GSC token to profile
    await supabase
      .from('profiles')
      .update({
        gsc_token: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }),
      })
      .eq('id', state)

    return NextResponse.redirect(new URL('/dashboard?gsc=connected', process.env.NEXT_PUBLIC_SITE_URL!))
  } catch (err) {
    console.error('GSC callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard?error=GSC connection failed', process.env.NEXT_PUBLIC_SITE_URL!)
    )
  }
}