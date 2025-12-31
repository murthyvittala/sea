import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state') // userId
    const error = request.nextUrl.searchParams.get('error')

    console.log('📍 Google callback received')
    console.log('Code:', code ? '✓ Present' : '✗ Missing')
    console.log('State (userId):', state ? '✓ Present' : '✗ Missing')
    console.log('Error:', error || '✗ None')

    if (error) {
      console.error('❌ Google OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=${error}`
      )
    }

    if (!code || !state) {
      console.error('❌ Missing code or state')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=missing_params`
      )
    }

    console.log('🔄 Exchanging authorization code for token...')

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ Token exchange failed:', errorData)
      throw new Error(`Token exchange failed: ${errorData.error}`)
    }

    const tokenData = await tokenResponse.json()

    console.log('✓ Token received')
    console.log('Access token:', tokenData.access_token?.substring(0, 20) + '...')
    console.log('Refresh token:', tokenData.refresh_token ? '✓ Present' : '✗ Missing')

    // Save token to Supabase using service role client
    console.log('💾 Saving token to Supabase for user:', state)

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error: dbError } = await supabase
      .from('users')
      .update({
        google_auth_token: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          saved_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', state)
      .select()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }

    console.log('✓ Token saved successfully to database')
    console.log('Updated record:', data)

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?success=google_connected`
    )
  } catch (err: any) {
    console.error('❌ Callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?error=callback_failed&message=${encodeURIComponent(err.message)}`
    )
  }
}
