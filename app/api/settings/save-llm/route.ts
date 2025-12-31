import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function encrypt(text: string): string {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY not configured')
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export async function POST(request: NextRequest) {
  try {
    const { userId, llmProvider, llmModel, llmApiKey } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updateData: Record<string, any> = {
      llm_provider: llmProvider || 'openai',
      llm_model: llmModel || 'gpt-4o',
      updated_at: new Date().toISOString(),
    }

    if (llmApiKey && llmApiKey.trim()) {
      updateData.llm_api_key_encrypted = encrypt(llmApiKey.trim())
      console.log('✓ API key encrypted')
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, llm_provider, llm_model')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, keyEncrypted: !!llmApiKey })
  } catch (err: any) {
    console.error('Save error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}