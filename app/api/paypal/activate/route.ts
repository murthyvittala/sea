// app/api/paypal/activate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, plan, subscriptionId, orderId } = body

    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('💳 Activating plan for user:', userId, 'Plan:', plan)

    const supabase = getSupabaseAdmin()

    // Update 'users' table (not 'profiles')
    const { data, error } = await supabase
      .from('users')
      .update({
        plan: plan,
        subscription_id: subscriptionId || null,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('✓ Plan activated successfully:', data)

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to activate plan'
    console.error('❌ Activation error:', err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
