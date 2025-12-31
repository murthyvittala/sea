// Sign up with email and password
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Sign in/up with OAuth provider
export async function signInWithOAuth(provider: 'google' | 'facebook' | 'azure') {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider })
  if (error) throw error
  return data
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get the current authenticated user
export async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting auth user:', error)
    return null
  }
  return user
}

// Helper function to get user profile from USERS table
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')  // Changed from 'profiles' to 'users'
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error getting user profile:', error)
    return null
  }

  // Ensure plan defaults to 'free' if not set
  if (data && !data.plan) {
    data.plan = 'free'
  }

  return data
}

// Helper function to update user profile in USERS table
export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
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
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

// Helper function to create user profile in USERS table (for new users)
export async function createUserProfile(userId: string, email: string) {
  const { data, error } = await supabase
    .from('users')  // Changed from 'profiles' to 'users'
    .insert([
      {
        id: userId,
        email: email,
        plan: 'free',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

// Helper function to check if user exists in USERS table
export async function checkUserExists(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking user exists:', error)
    return false
  }

  return !!data
}
