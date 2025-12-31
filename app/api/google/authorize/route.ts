import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      console.error('❌ Missing userId')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('🔐 Generating Google OAuth URL for user:', userId)

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`

    if (!clientId) {
      console.error('❌ Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID')
      return NextResponse.json({ error: 'Missing Google Client ID' }, { status: 500 })
    }

    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ].join(' ')

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: userId,
      access_type: 'offline',
      prompt: 'consent',
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    console.log('✓ Generated auth URL:', authUrl.substring(0, 100) + '...')

    return NextResponse.json({ authUrl })
  } catch (err: any) {
    console.error('❌ Authorization error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
