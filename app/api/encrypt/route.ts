import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const encrypted = encrypt(text)

    return NextResponse.json({ encrypted })
  } catch (err: any) {
    console.error('Encryption error:', err)
    return NextResponse.json(
      { error: 'Encryption failed: ' + err.message },
      { status: 500 }
    )
  }
}
