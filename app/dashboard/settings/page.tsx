'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getAuthUser, getUserProfile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PropertySelectionModal from '@/components/PropertySelectionModal'

interface UserProfile {
  id: string
  email?: string
  plan: string
  role: string
  google_auth_token?: any
  openai_api_key?: string
  member_start?: string
  member_end?: string
  website_url?: string
  sitemap_url?: string
  ga4_property_id?: string
  ga4_property_name?: string
  gsc_site_url?: string
  llm_provider?: string
  llm_model?: string
  llm_api_key_encrypted?: string
}

// LLM Provider configurations
const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Budget)' },
    ],
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Recommended)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Most Capable)' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fastest)' },
    ],
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
  },
  google: {
    name: 'Google AI',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Recommended)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Faster)' },
      { id: 'gemini-pro', name: 'Gemini Pro' },
    ],
    keyPlaceholder: 'AIza...',
    keyPrefix: 'AIza',
  },
  groq: {
    name: 'Groq',
    models: [
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Recommended)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fastest)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
  },
}

function isValidUrl(url: string): boolean {
  if (!url) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    plan: 'free',
    role: 'user',
    google_auth_token: undefined,
    openai_api_key: '',
    website_url: '',
    sitemap_url: '',
    llm_provider: 'openai',
    llm_model: 'gpt-4o',
    llm_api_key_encrypted: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [messageShown, setMessageShown] = useState(false)
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  
  // LLM Configuration state
  const [llmProvider, setLlmProvider] = useState<keyof typeof LLM_PROVIDERS>('openai')
  const [llmModel, setLlmModel] = useState('gpt-4o')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmKeySet, setLlmKeySet] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getAuthUser()
        if (user) {
          const userProfile = await getUserProfile(user.id)
          if (userProfile) {
            setProfile(userProfile)
            // Set LLM config from profile
            if (userProfile.llm_provider) {
              setLlmProvider(userProfile.llm_provider as keyof typeof LLM_PROVIDERS)
            }
            if (userProfile.llm_model) {
              setLlmModel(userProfile.llm_model)
            }
            if (userProfile.llm_api_key_encrypted) {
              setLlmKeySet(true)
            }
          } else {
            setProfile(prev => ({
              ...prev,
              id: user.id,
              email: user.email,
            }))
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Handle provider change - reset model to first available
  useEffect(() => {
    const models = LLM_PROVIDERS[llmProvider]?.models
    if (models && models.length > 0) {
      // Check if current model exists in new provider
      const modelExists = models.some(m => m.id === llmModel)
      if (!modelExists) {
        setLlmModel(models[0].id)
      }
    }
  }, [llmProvider])

  // Handle OAuth callback messages - only show once
  useEffect(() => {
    if (messageShown) return

    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'google_connected') {
      setMessage('✅ Google services connected successfully!')
      setMessageShown(true)
      
      // Open property selection modal after successful OAuth
      setTimeout(() => {
        setShowPropertyModal(true)
        router.replace('/dashboard/settings')
      }, 1500)
    } else if (error) {
      const errorMsg = searchParams.get('message') || 'Unknown error'
      setMessage(`❌ Failed to connect: ${decodeURIComponent(errorMsg)}`)
      setMessageShown(true)
      
      setTimeout(() => {
        router.replace('/dashboard/settings')
      }, 2000)
    }
  }, [searchParams, messageShown, router])

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    if (field === 'website_url' || field === 'sitemap_url') {
      if (value && !isValidUrl(value)) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Please enter a valid URL (e.g., https://example.com)',
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (profile.website_url && !isValidUrl(profile.website_url)) {
      newErrors.website_url = 'Please enter a valid Website URL'
    }

    if (profile.sitemap_url && !isValidUrl(profile.sitemap_url)) {
      newErrors.sitemap_url = 'Please enter a valid Sitemap URL'
    }

    // Validate LLM API key if provided
    if (llmApiKey) {
      const provider = LLM_PROVIDERS[llmProvider]
      if (provider && !llmApiKey.startsWith(provider.keyPrefix)) {
        newErrors.llm_api_key = `API key should start with "${provider.keyPrefix}"`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage('❌ Please fix the errors below')
      return
    }

    try {
      setSaving(true)
      setMessage('')

      const user = await getAuthUser()
      if (!user) {
        setMessage('❌ User not authenticated')
        return
      }

      console.log('💾 Saving settings for user:', user.id)

      // Step 1: Save website config (these fields work fine)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          website_url: profile.website_url || null,
          sitemap_url: profile.sitemap_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Website config error:', updateError)
        throw new Error('Failed to save website config: ' + updateError.message)
      }

      console.log('✓ Website config saved')

      // Step 2: Save LLM config via our dedicated API endpoint (NOT RPC)
      console.log('📡 Saving LLM configuration via API...')
      
      const llmResponse = await fetch('/api/settings/save-llm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          llmProvider: llmProvider,
          llmModel: llmModel,
          llmApiKey: llmApiKey || null,
        }),
      })

      const llmResult = await llmResponse.json()
      console.log('LLM save response:', llmResult)

      if (!llmResponse.ok) {
        throw new Error(llmResult.error || 'Failed to save LLM settings')
      }

      console.log('✓ LLM settings saved successfully')
      setMessage('✅ Settings saved successfully!')
      
      // Update UI state
      if (llmApiKey) {
        setLlmKeySet(true)
        setLlmApiKey('') // Clear the input after saving
      }
      
      // Update profile state with new values
      setProfile(prev => ({
        ...prev,
        llm_provider: llmProvider,
        llm_model: llmModel,
      }))
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      console.error('❌ Error saving settings:', err)
      setMessage('❌ Failed to save settings: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const user = await getAuthUser()
      if (!user) {
        setMessage('❌ User not authenticated')
        return
      }

      console.log('🔐 Starting Google OAuth for user:', user.id)

      const response = await fetch(`/api/google/authorize?userId=${user.id}`)
      const data = await response.json()
      
      if (!data.authUrl) {
        throw new Error('Failed to get authorization URL')
      }

      console.log('📱 Redirecting to Google OAuth...')
      window.location.href = data.authUrl
    } catch (err: any) {
      console.error('❌ Error connecting Google:', err)
      setMessage('❌ Failed to connect Google: ' + (err.message || 'Unknown error'))
    }
  }

  const handlePropertySelected = async () => {
    // Refresh profile to show selected properties
    const user = await getAuthUser()
    if (user) {
      const userProfile = await getUserProfile(user.id)
      if (userProfile) {
        setProfile(userProfile)
      }
    }
    setShowPropertyModal(false)
    setMessage('✅ Google properties configured successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handlePropertySave = async (ga4PropertyId: string | null, ga4PropertyName: string | null, gscSiteUrl: string | null) => {
    // Update profile state with selected properties
    setProfile(prev => ({
      ...prev,
      ga4_property_id: ga4PropertyId || undefined,
      ga4_property_name: ga4PropertyName || undefined,
      gsc_site_url: gscSiteUrl || undefined,
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentProvider = LLM_PROVIDERS[llmProvider]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and integrations</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-semibold">
              {profile?.plan?.toUpperCase() || 'FREE'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
              {profile?.role || 'User'}
            </div>
          </div>
          {profile?.member_start && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                {new Date(profile.member_start).toLocaleDateString()}
              </div>
            </div>
          )}
          {profile?.member_end && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membership Expires</label>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                {new Date(profile.member_end).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Website Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Website Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={profile.website_url || ''}
              onChange={(e) => handleChange('website_url', e.target.value)}
              className={`w-full ${errors.website_url ? 'border-red-500' : ''}`}
            />
            {errors.website_url && (
              <p className="text-red-600 text-sm mt-1">{errors.website_url}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sitemap URL</label>
            <Input
              type="url"
              placeholder="https://example.com/sitemap.xml"
              value={profile.sitemap_url || ''}
              onChange={(e) => handleChange('sitemap_url', e.target.value)}
              className={`w-full ${errors.sitemap_url ? 'border-red-500' : ''}`}
            />
            {errors.sitemap_url && (
              <p className="text-red-600 text-sm mt-1">{errors.sitemap_url}</p>
            )}
          </div>
        </div>
      </div>

      {/* Google Integrations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Google Integrations</h2>
        <p className="text-gray-600 text-sm mb-4">Connect your Google account to access Analytics & Search Console data</p>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Google Analytics 4 & Search Console</h3>
              <p className="text-sm text-gray-600">
                {profile?.google_auth_token ? '✓ Connected' : 'Not connected'}
              </p>
            </div>
            <Button
              onClick={handleConnectGoogle}
              className={`${
                profile?.google_auth_token
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } font-medium py-2 px-4 rounded-lg`}
            >
              {profile?.google_auth_token ? '✓ Connected' : 'Connect'}
            </Button>
          </div>

          {/* Selected Properties */}
          {profile?.google_auth_token && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-900">Selected Properties</h4>
                <Button
                  onClick={() => setShowPropertyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                >
                  Change
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">GA4 Property</p>
                  {profile.ga4_property_id ? (
                    <p className="text-sm font-medium text-gray-900">
                      {profile.ga4_property_name || profile.ga4_property_id}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">Not selected</p>
                  )}
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Search Console Site</p>
                  {profile.gsc_site_url ? (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.gsc_site_url}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600">Not selected</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Agent Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Agent Configuration</h2>
        <p className="text-gray-600 text-sm mb-4">Configure your preferred LLM provider for the analytics AI agent</p>
        
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LLM Provider</label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value as keyof typeof LLM_PROVIDERS)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(LLM_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>{provider.name}</option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currentProvider?.models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentProvider?.name} API Key
              {llmKeySet && <span className="ml-2 text-green-600 text-xs">✓ Key saved</span>}
            </label>
            <Input
              type="password"
              placeholder={llmKeySet ? '••••••••••••••••' : currentProvider?.keyPlaceholder}
              value={llmApiKey}
              onChange={(e) => setLlmApiKey(e.target.value)}
              className={`w-full ${errors.llm_api_key ? 'border-red-500' : ''}`}
            />
            {errors.llm_api_key && (
              <p className="text-red-600 text-sm mt-1">{errors.llm_api_key}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {llmKeySet 
                ? 'Enter a new key to replace the existing one' 
                : `Get your API key from ${currentProvider?.name}'s developer portal`}
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>💡 Tip:</strong> Your API key is encrypted before storage using AES-256-GCM encryption. 
              The AI agent uses this key to process your natural language queries about your analytics data.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Property Selection Modal */}
      {profile?.id && (
        <PropertySelectionModal
          isOpen={showPropertyModal}
          onClose={handlePropertySelected}
          onSave={handlePropertySave}
          userId={profile.id}
          currentGa4PropertyId={profile.ga4_property_id}
          currentGscSiteUrl={profile.gsc_site_url}
        />
      )}
    </div>
  )
}