import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface GA4Property {
  name: string
  displayName: string
  propertyId: string
  createTime: string
  updateTime: string
  parent: string
  timeZone: string
  currencyCode: string
}

interface GSCSite {
  siteUrl: string
  permissionLevel: string
}

// Create Supabase client with service role for API routes
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('📊 Fetching Google properties for user:', userId)

    // Get user's Google token from database
    const supabase = getSupabaseAdmin()
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('google_auth_token')
      .eq('id', userId)
      .single()

    if (dbError || !user?.google_auth_token) {
      console.error('❌ No Google token found:', dbError)
      return NextResponse.json({ error: 'Google account not connected' }, { status: 401 })
    }

    const token = user.google_auth_token
    let accessToken = token.access_token

    // Check if token needs refresh (simple check based on saved_at)
    const savedAt = new Date(token.saved_at).getTime()
    const expiresIn = (token.expires_in || 3600) * 1000 // Convert to ms
    const now = Date.now()

    if (now > savedAt + expiresIn - 60000) { // Refresh if expires in less than 1 minute
      console.log('🔄 Token expired, refreshing...')
      accessToken = await refreshAccessToken(userId, token.refresh_token, supabase)
    }

    // Fetch both GA4 properties and GSC sites in parallel
    const [ga4Properties, gscSites] = await Promise.all([
      fetchGA4Properties(accessToken),
      fetchGSCSites(accessToken),
    ])

    console.log('✓ GA4 Properties found:', ga4Properties.length)
    console.log('✓ GSC Sites found:', gscSites.length)

    return NextResponse.json({
      ga4Properties,
      gscSites,
    })
  } catch (err: any) {
    console.error('❌ Error fetching properties:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}

async function refreshAccessToken(userId: string, refreshToken: string, supabase: any): Promise<string> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh token')
  }

  const newToken = await tokenResponse.json()

  // Update token in database
  await supabase
    .from('users')
    .update({
      google_auth_token: {
        access_token: newToken.access_token,
        refresh_token: refreshToken, // Keep the original refresh token
        expires_in: newToken.expires_in,
        token_type: newToken.token_type,
        scope: newToken.scope,
        saved_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return newToken.access_token
}

async function fetchGA4Properties(accessToken: string): Promise<GA4Property[]> {
  try {
    // First, get all accounts
    const accountsResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!accountsResponse.ok) {
      const error = await accountsResponse.json()
      console.error('GA4 accounts error:', error)
      return []
    }

    const accountsData = await accountsResponse.json()
    const accounts = accountsData.accounts || []

    if (accounts.length === 0) {
      return []
    }

    // Fetch properties for each account in parallel
    const propertiesPromises = accounts.map(async (account: any) => {
      const propertiesResponse = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!propertiesResponse.ok) {
        console.error('GA4 properties error for account:', account.name)
        return []
      }

      const propertiesData = await propertiesResponse.json()
      return (propertiesData.properties || []).map((prop: any) => ({
        name: prop.name,
        displayName: prop.displayName,
        propertyId: prop.name.replace('properties/', ''),
        createTime: prop.createTime,
        updateTime: prop.updateTime,
        parent: prop.parent,
        timeZone: prop.timeZone,
        currencyCode: prop.currencyCode,
        accountName: account.displayName,
      }))
    })

    const allProperties = await Promise.all(propertiesPromises)
    return allProperties.flat()
  } catch (err) {
    console.error('Error fetching GA4 properties:', err)
    return []
  }
}

async function fetchGSCSites(accessToken: string): Promise<GSCSite[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('GSC sites error:', error)
      return []
    }

    const data = await response.json()
    return (data.siteEntry || []).map((site: any) => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel,
    }))
  } catch (err) {
    console.error('Error fetching GSC sites:', err)
    return []
  }
}
