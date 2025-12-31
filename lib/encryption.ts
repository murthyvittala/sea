/**
 * AES-256-GCM Encryption for API Keys
 * 
 * Uses Web Crypto API (works in Node.js 18+ and browsers)
 * 
 * Required env var: ENCRYPTION_KEY (32-byte hex string)
 * Generate with: openssl rand -hex 32
 */

// Encryption key from environment (32 bytes = 64 hex chars)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Get crypto key from environment
async function getEncryptionKey(): Promise<CryptoKey> {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be set (32 bytes as hex). Generate with: openssl rand -hex 32'
    )
  }

  const keyData = hexToBytes(ENCRYPTION_KEY)
  // Create a proper ArrayBuffer to avoid TypeScript issues
  const buffer = new ArrayBuffer(keyData.length)
  new Uint8Array(buffer).set(keyData)
  
  return crypto.subtle.importKey(
    'raw',
    buffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns: base64(iv + ciphertext + authTag)
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return ''

  const key = await getEncryptionKey()
  
  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV + ciphertext (auth tag is appended by WebCrypto)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  
  // Return as base64
  return Buffer.from(combined).toString('base64')
}

/**
 * Decrypt a string encrypted with encrypt()
 * Input: base64(iv + ciphertext + authTag)
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  if (!encryptedBase64) return ''

  const key = await getEncryptionKey()
  
  // Decode base64
  const combined = Buffer.from(encryptedBase64, 'base64')
  
  // Extract IV (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return ENCRYPTION_KEY.length === 64
}

/**
 * Mask an API key for display (show first 4 and last 4 chars)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`
}
