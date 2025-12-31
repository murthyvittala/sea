import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, role, plan, website_limit, keyword_limit, ...updates } = body

    console.log('🔐 API: Creating user with service role:', id)

    // Use service role client to bypass RLS
    const supabaseAdmin = createServerClient()

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id,
          email,
          role: role || 'user',
          plan: plan || 'free',
          website_limit: website_limit || 1,
          keyword_limit: keyword_limit || 100,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✓ User created successfully via API')
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('❌ API error:', err.message)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}