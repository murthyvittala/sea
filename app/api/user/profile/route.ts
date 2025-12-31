import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET user profile from 'users' table
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('users')  // Changed from 'profiles' to 'users'
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ensure plan defaults to 'free'
    if (data && !data.plan) {
      data.plan = 'free'
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// UPDATE user profile in 'users' table
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('users')  // Changed from 'profiles' to 'users'
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}