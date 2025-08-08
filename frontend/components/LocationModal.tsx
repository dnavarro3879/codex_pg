'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { authAPI } from '../lib/api'
import { 
  X, MapPin, Star, Edit2, Trash2, Plus, Loader2, 
  Check, Home, Building, Navigation 
} from 'lucide-react'

interface Location {
  id: number
  name: string
  location_type: 'zip' | 'city'
  location_value: string
  lat: number
  lng: number
  is_default: boolean
  created_at: string
}

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect?: (location: Location) => void
  currentLocationId?: number | null
}

export function LocationModal({ 
  isOpen, 
  onClose, 
  onLocationSelect,
  currentLocationId 
}: LocationModalProps) {
  const [mounted, setMounted] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    locationType: 'zip' as 'zip' | 'city',
    locationValue: '',
    isDefault: false
  })
  const [formLoading, setFormLoading] = useState(false)
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadLocations()
    }
  }, [isOpen])

  const loadLocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await authAPI.getLocations()
      setLocations(data)
    } catch (err) {
      setError('Failed to load locations')
      console.error('Error loading locations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.locationValue) return

    setFormLoading(true)
    setError(null)
    try {
      await authAPI.addLocation(
        formData.name,
        formData.locationType,
        formData.locationValue,
        formData.isDefault
      )
      await loadLocations()
      setFormData({
        name: '',
        locationType: 'zip',
        locationValue: '',
        isDefault: false
      })
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add location')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateName = async (locationId: number) => {
    if (!editName.trim()) return

    try {
      await authAPI.updateLocation(locationId, { name: editName })
      await loadLocations()
      setEditingId(null)
      setEditName('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update location')
    }
  }

  const handleSetDefault = async (locationId: number) => {
    try {
      await authAPI.setDefaultLocation(locationId)
      await loadLocations()
    } catch (err) {
      setError('Failed to set default location')
    }
  }

  const handleDelete = async (locationId: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      await authAPI.deleteLocation(locationId)
      await loadLocations()
    } catch (err) {
      setError('Failed to delete location')
    }
  }

  const handleSelectLocation = (location: Location) => {
    if (onLocationSelect) {
      onLocationSelect(location)
      onClose()
    }
  }

  const getLocationIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('home')) return Home
    if (lowerName.includes('work') || lowerName.includes('office')) return Building
    return MapPin
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl my-8">
          <Card className="bg-white shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-sage-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-forest-100 rounded-lg">
                    <Navigation className="w-5 h-5 text-forest-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-bold text-forest-600">
                      Manage Locations
                    </h2>
                    <p className="text-sm text-earth-500">
                      Save your favorite birding spots for quick access
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-forest-600" />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg">
                <p className="text-sm text-terracotta-600">{error}</p>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-sage-400" />
                  <p className="mt-3 text-earth-500">Loading locations...</p>
                </div>
              ) : (
                <>
                  {/* Saved Locations */}
                  {locations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-forest-600 mb-3">
                        Saved Locations
                      </h3>
                      <div className="space-y-2">
                        {locations.map((location) => {
                          const Icon = getLocationIcon(location.name)
                          const isCurrent = location.id === currentLocationId
                          const isEditing = editingId === location.id

                          return (
                            <div
                              key={location.id}
                              className={`
                                flex items-center justify-between p-3 rounded-lg border
                                ${isCurrent ? 'bg-sage-50 border-sage-300' : 'bg-white border-sage-200'}
                                hover:shadow-sm transition-all
                              `}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-sage-200' : 'bg-sage-100'}`}>
                                  <Icon className="w-4 h-4 text-forest-600" />
                                </div>
                                
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleUpdateName(location.id)
                                          if (e.key === 'Escape') {
                                            setEditingId(null)
                                            setEditName('')
                                          }
                                        }}
                                        className="px-2 py-1 text-sm border border-sage-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-400"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleUpdateName(location.id)}
                                        className="p-1 text-forest-600 hover:bg-sage-100 rounded"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingId(null)
                                          setEditName('')
                                        }}
                                        className="p-1 text-earth-500 hover:bg-sage-100 rounded"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-forest-700">
                                          {location.name}
                                        </span>
                                        {location.is_default && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                            <Star className="w-3 h-3 fill-current" />
                                            Default
                                          </span>
                                        )}
                                        {isCurrent && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sage-200 text-forest-600 rounded-full text-xs">
                                            <Check className="w-3 h-3" />
                                            Current
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm text-earth-500">
                                        {location.location_type === 'zip' ? 'ZIP: ' : ''}
                                        {location.location_value}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {!isCurrent && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSelectLocation(location)}
                                    className="text-xs"
                                  >
                                    Use
                                  </Button>
                                )}
                                
                                {!location.is_default && (
                                  <button
                                    onClick={() => handleSetDefault(location.id)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Set as default"
                                  >
                                    <Star className="w-4 h-4" />
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    setEditingId(location.id)
                                    setEditName(location.name)
                                  }}
                                  className="p-1.5 text-earth-600 hover:bg-sage-100 rounded-lg transition-colors"
                                  title="Edit name"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(location.id)}
                                  className="p-1.5 text-terracotta-500 hover:bg-terracotta-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Location Form */}
                  {showAddForm ? (
                    <div className="border-t border-sage-200 pt-4">
                      <h3 className="text-sm font-semibold text-forest-600 mb-3">
                        Add New Location
                      </h3>
                      <form onSubmit={handleAddLocation} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-earth-600 mb-1">
                            Location Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Home, Office, Vacation Spot"
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-earth-600 mb-1">
                              Type
                            </label>
                            <select
                              value={formData.locationType}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                locationType: e.target.value as 'zip' | 'city' 
                              })}
                              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400"
                            >
                              <option value="zip">ZIP Code</option>
                              <option value="city">City</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-earth-600 mb-1">
                              {formData.locationType === 'zip' ? 'ZIP Code' : 'City Name'}
                            </label>
                            <input
                              type="text"
                              value={formData.locationValue}
                              onChange={(e) => setFormData({ ...formData, locationValue: e.target.value })}
                              placeholder={formData.locationType === 'zip' ? '80301' : 'Boulder, CO'}
                              className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-400"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="setDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-4 h-4 text-forest-600 border-sage-300 rounded focus:ring-forest-400"
                          />
                          <label htmlFor="setDefault" className="text-sm text-earth-600">
                            Set as default location
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            variant="nature"
                            disabled={formLoading}
                            className="flex-1"
                          >
                            {formLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Add Location
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowAddForm(false)
                              setFormData({
                                name: '',
                                locationType: 'zip',
                                locationValue: '',
                                isDefault: false
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <Button
                      variant="nature"
                      onClick={() => setShowAddForm(true)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Location
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}