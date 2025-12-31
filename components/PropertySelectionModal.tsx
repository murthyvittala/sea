'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface GA4Property {
  name: string
  displayName: string
  propertyId: string
  accountName?: string
  timeZone?: string
}

interface GSCSite {
  siteUrl: string
  permissionLevel: string
}

interface PropertySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ga4PropertyId: string | null, ga4PropertyName: string | null, gscSiteUrl: string | null) => void
  userId: string
  currentGa4PropertyId?: string | null
  currentGscSiteUrl?: string | null
}

export default function PropertySelectionModal({
  isOpen,
  onClose,
  onSave,
  userId,
  currentGa4PropertyId,
  currentGscSiteUrl,
}: PropertySelectionModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([])
  const [gscSites, setGscSites] = useState<GSCSite[]>([])
  const [selectedGa4, setSelectedGa4] = useState<string>(currentGa4PropertyId || '')
  const [selectedGsc, setSelectedGsc] = useState<string>(currentGscSiteUrl || '')

  useEffect(() => {
    if (isOpen) {
      fetchProperties()
    }
  }, [isOpen, userId])

  useEffect(() => {
    // Update selections when current values change
    setSelectedGa4(currentGa4PropertyId || '')
    setSelectedGsc(currentGscSiteUrl || '')
  }, [currentGa4PropertyId, currentGscSiteUrl])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/google/properties?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch properties')
      }

      setGa4Properties(data.ga4Properties || [])
      setGscSites(data.gscSites || [])

      // Auto-select if only one property/site exists
      if (data.ga4Properties?.length === 1 && !selectedGa4) {
        setSelectedGa4(data.ga4Properties[0].propertyId)
      }
      if (data.gscSites?.length === 1 && !selectedGsc) {
        setSelectedGsc(data.gscSites[0].siteUrl)
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const selectedGa4Property = ga4Properties.find(p => p.propertyId === selectedGa4)

      const response = await fetch('/api/google/save-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ga4PropertyId: selectedGa4 || null,
          ga4PropertyName: selectedGa4Property?.displayName || null,
          gscSiteUrl: selectedGsc || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save properties')
      }

      onSave(
        selectedGa4 || null,
        selectedGa4Property?.displayName || null,
        selectedGsc || null
      )
      onClose()
    } catch (err: any) {
      console.error('Error saving properties:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const hasOnlyOneOfEach = ga4Properties.length <= 1 && gscSites.length <= 1
  const confirmationMode = hasOnlyOneOfEach && ga4Properties.length + gscSites.length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {confirmationMode ? 'Confirm Your Properties' : 'Select Your Properties'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {confirmationMode
              ? 'Please confirm the property and site to use for analytics'
              : 'Choose which GA4 property and Search Console site to track'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              <p className="font-medium">Error loading properties</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                onClick={fetchProperties}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* GA4 Properties Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Google Analytics 4 Properties
                </h3>
                {ga4Properties.length === 0 ? (
                  <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-sm">
                    No GA4 properties found. Make sure you have GA4 properties in your Google account.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ga4Properties.map((property) => (
                      <label
                        key={property.propertyId}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedGa4 === property.propertyId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ga4Property"
                          value={property.propertyId}
                          checked={selectedGa4 === property.propertyId}
                          onChange={(e) => setSelectedGa4(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{property.displayName}</p>
                          <p className="text-sm text-gray-500">
                            ID: {property.propertyId}
                            {property.accountName && ` • ${property.accountName}`}
                          </p>
                        </div>
                        {selectedGa4 === property.propertyId && currentGa4PropertyId === property.propertyId && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* GSC Sites Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Search Console Sites
                </h3>
                {gscSites.length === 0 ? (
                  <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-sm">
                    No Search Console sites found. Make sure you have verified sites in Google Search Console.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gscSites.map((site) => (
                      <label
                        key={site.siteUrl}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedGsc === site.siteUrl
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gscSite"
                          value={site.siteUrl}
                          checked={selectedGsc === site.siteUrl}
                          onChange={(e) => setSelectedGsc(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{site.siteUrl}</p>
                          <p className="text-sm text-gray-500">
                            Permission: {site.permissionLevel}
                          </p>
                        </div>
                        {selectedGsc === site.siteUrl && currentGscSiteUrl === site.siteUrl && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving || (!selectedGa4 && !selectedGsc)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : confirmationMode ? 'Confirm Selection' : 'Save Selection'}
          </Button>
        </div>
      </div>
    </div>
  )
}
