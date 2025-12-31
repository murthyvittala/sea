import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for API routes
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ga4PropertyId, ga4PropertyName, gscSiteUrl } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (!ga4PropertyId && !gscSiteUrl) {
      return NextResponse.json({ error: 'At least one property must be selected' }, { status: 400 })
    }

    console.log('💾 Saving selected properties for user:', userId)
    console.log('GA4 Property:', ga4PropertyId, ga4PropertyName)
    console.log('GSC Site:', gscSiteUrl)

    const supabase = getSupabaseAdmin()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (ga4PropertyId) {
      updateData.ga4_property_id = ga4PropertyId
      updateData.ga4_property_name = ga4PropertyName || null
    }

    if (gscSiteUrl) {
      updateData.gsc_site_url = gscSiteUrl
    }

    const { data, error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }

    console.log('✓ Properties saved successfully')

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err: any) {
    console.error('❌ Error saving properties:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to save properties' },
      { status: 500 }
    )
  }
}
