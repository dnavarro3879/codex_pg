'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useJsApiLoader } from '@react-google-maps/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Header } from '../components/Header'
import { SpeciesCard } from '../components/SpeciesCard'
import { BirdCharts } from '../components/BirdCharts'
import { BirdMap } from '../components/BirdMap'
import { Loader2, Search, Bird, X, Filter, Binoculars, Feather, User, ChevronDown, Settings, Save, Star, MapPin } from 'lucide-react'
import { preloadBirdPhotos } from '../lib/flickr'
import { birdAPI, authAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/useAuthModal'
import { LocationModal } from '../components/LocationModal'
import { DateFilter } from '../components/DateFilter'
import { SpeciesDetailsModal } from '../components/SpeciesDetailsModal'

interface ObservedBird {
  species: string
  species_code: string
  loc: string
  loc_id: string
  date: string
  lat: number
  lng: number
  how_many: number | null
  user_display_name: string | null
}

interface SavedLocation {
  id: number
  name: string
  location_type: 'zip' | 'city'
  location_value: string
  lat: number
  lng: number
  is_default: boolean
  created_at: string
}

export default function Page() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [zip, setZip] = useState('')
  const [birds, setBirds] = useState<ObservedBird[]>([])
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(true)
  const { user } = useAuth()
  const authModal = useAuthModal()
  
  // Location management state
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [currentLocation, setCurrentLocation] = useState<SavedLocation | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [lastSearchedZip, setLastSearchedZip] = useState<string | null>(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const dropdownButtonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Date filter (inclusive cutoff)
  const [cutoffDate, setCutoffDate] = useState<string | null>(null)

  // Species details modal state
  type ModalSighting = { location: string; loc_id: string; date: string; lat: number; lng: number }
  const [speciesModal, setSpeciesModal] = useState<{
    species: string
    speciesCode: string
    sightings: ModalSighting[]
  } | null>(null)

  const parseObservationDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    // Normalize to ISO-like string for safer parsing (Safari compatibility)
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T')
    const d = new Date(normalized)
    return isNaN(d.getTime()) ? null : d
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  // Load saved locations and default location on mount
  useEffect(() => {
    if (user) {
      loadSavedLocations()
    }
  }, [user])

  const loadSavedLocations = async () => {
    try {
      const locations = await authAPI.getLocations()
      setSavedLocations(locations)
      
      // Auto-load default location if exists
      const defaultLocation = locations.find((loc: SavedLocation) => loc.is_default)
      if (defaultLocation) {
        setLat(defaultLocation.lat)
        setLng(defaultLocation.lng)
        setCurrentLocation(defaultLocation)
        setLocationLoading(false)
      } else {
        // No default, try to get current location
        getCurrentLocation()
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      getCurrentLocation()
    }
  }

  const getCurrentLocation = () => {
    if (lat === null || lng === null) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          setLocationLoading(false)
        },
        () => {
          setLocationLoading(false)
        }
      )
    }
  }

  useEffect(() => {
    if (!user && lat === null && lng === null) {
      getCurrentLocation()
    }
  }, [user, lat, lng])

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setLoading(true)
      birdAPI.getRareBirds(lat, lng)
        .then(data => {
          setBirds(data)
          const species = data.map((b: ObservedBird) => b.species)
          preloadBirdPhotos(species)
        })
        .catch(() => setBirds([]))
        .finally(() => setLoading(false))
    }
  }, [lat, lng])

  const handleZip = async () => {
    if (!zip) return
    setLoading(true)
    setCurrentLocation(null) // Clear current saved location when searching new
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    const place = data.places[0]
    setLat(parseFloat(place.latitude))
    setLng(parseFloat(place.longitude))
    
    // Show save prompt if user is logged in and this ZIP isn't already saved
    if (user && !savedLocations.some(loc => loc.location_value === zip)) {
      setLastSearchedZip(zip)
      setShowSavePrompt(true)
    }
  }

  const handleLocationSelect = (location: SavedLocation) => {
    setCurrentLocation(location)
    setLat(location.lat)
    setLng(location.lng)
    setZip('') // Clear manual ZIP input
  }

  const handleSaveLocation = async () => {
    if (!lastSearchedZip) return
    
    try {
      const name = prompt('Name this location (e.g., "Home", "Office"):') || `ZIP ${lastSearchedZip}`
      if (name) {
        await authAPI.addLocation(name, 'zip', lastSearchedZip, false)
        await loadSavedLocations()
        setShowSavePrompt(false)
        setLastSearchedZip(null)
      }
    } catch (error) {
      console.error('Error saving location:', error)
    }
  }

  const displayedBirds = birds.filter(b => {
    if (selectedLoc && b.loc !== selectedLoc) return false
    if (selectedSpecies && b.species !== selectedSpecies) return false
    if (cutoffDate) {
      const obsDate = parseObservationDate(b.date)
      const cutoffStart = new Date(`${cutoffDate}T00:00:00`)
      if (!obsDate || obsDate < cutoffStart) return false
    }
    return true
  })

  const speciesCounts = displayedBirds.reduce((acc, b) => {
    acc[b.species] = (acc[b.species] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const locationCounts = displayedBirds.reduce((acc, b) => {
    acc[b.loc] = (acc[b.loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  
  const mapCenter = lat !== null && lng !== null ? { lat, lng } : undefined

  const openSpeciesModal = (speciesName: string) => {
    const matching = displayedBirds.filter(b => b.species === speciesName)
    if (matching.length === 0) return
    const speciesCode = matching[0].species_code
    const sightings: ModalSighting[] = matching.map(b => ({
      location: b.loc,
      loc_id: b.loc_id,
      date: b.date,
      lat: b.lat,
      lng: b.lng,
    }))
    setSpeciesModal({ species: speciesName, speciesCode, sightings })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-white bg-nature-pattern">
        <div className="relative">
          <div className="absolute inset-0 bg-leaf-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 relative">

            {!user ? (
              // Not authenticated - show login prompt
              <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="text-center max-w-md mx-auto">
                  <div className="inline-block p-6 bg-forest-50 rounded-full mb-6">
                    <Bird className="w-20 h-20 text-forest-500" />
                  </div>
                  <h1 className="text-4xl font-heading font-bold text-forest-600 mb-4">
                    Welcome to BirdSpotter
                  </h1>
                  <p className="text-lg text-earth-600 mb-8">
                    Sign in to start discovering rare birds in your area and track your favorite sightings.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="nature" 
                      size="lg"
                      onClick={authModal.openLogin}
                      className="min-w-[140px]"
                    >
                      <User className="w-5 h-5" />
                      Sign In
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="lg"
                      onClick={authModal.openRegister}
                      className="min-w-[140px]"
                    >
                      <Feather className="w-5 h-5" />
                      Create Account
                    </Button>
                  </div>
                  <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-terracotta-500">100+</div>
                      <div className="text-sm text-earth-500">Rare Species</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-sage-500">Live</div>
                      <div className="text-sm text-earth-500">Updates</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-sky-500">GPS</div>
                      <div className="text-sm text-earth-500">Tracking</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Authenticated - show the full app
              <>

            {/* Compact Hero with Search */}
            <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-100 rounded-full mb-2">
                  <Feather className="w-3 h-3 text-forest-600 bird-animation" />
                  <span className="text-xs font-heading font-semibold text-forest-600">Rare Bird Finder</span>
                </div>
                <h1 className="text-3xl font-heading font-bold text-forest-600">
                  Find Rare Birds Near You
                </h1>
              </div>
              
              <Card variant="glass" className="p-4 flex-shrink-0 min-w-[400px]">
                <div className="flex flex-col gap-3">
                  {/* Improved Location Selector */}
                  <div className="flex gap-2">
                    {/* Location Button/Selector */}
                    {currentLocation ? (
                      <>
                        {/* Set as Default Button */}
                        {!currentLocation.is_default && (
                          <button
                            onClick={async () => {
                              try {
                                await authAPI.setDefaultLocation(currentLocation.id)
                                // Update the location to show it's now default
                                setCurrentLocation({ ...currentLocation, is_default: true })
                                // Reload locations to update the list
                                loadSavedLocations()
                              } catch (error) {
                                console.error('Error setting default location:', error)
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                            title="Set as default location"
                          >
                            <Star className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700 whitespace-nowrap">Set Default</span>
                          </button>
                        )}
                        
                        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-sage-50 rounded-lg border border-sage-200">
                          <MapPin className="w-4 h-4 text-forest-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-forest-700 text-sm truncate">
                                {currentLocation.name}
                              </span>
                              {currentLocation.is_default && (
                                <span title="Default location">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-earth-500">
                              {currentLocation.location_type === 'zip' ? 'ZIP ' : ''}{currentLocation.location_value}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentLocation(null)
                              setZip('')
                            }}
                            className="p-1 hover:bg-sage-100 rounded transition-colors"
                            title="Clear location"
                          >
                            <X className="w-3 h-3 text-earth-500" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        {/* Quick Location Picker */}
                        {savedLocations.length > 0 && (
                          <>
                            <button
                              ref={dropdownButtonRef}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-sage-300 bg-white hover:bg-sage-50 transition-colors"
                              onClick={() => {
                                if (!showLocationDropdown && dropdownButtonRef.current) {
                                  const rect = dropdownButtonRef.current.getBoundingClientRect()
                                  setDropdownPosition({
                                    top: rect.bottom + window.scrollY + 4,
                                    left: rect.left + window.scrollX
                                  })
                                }
                                setShowLocationDropdown(!showLocationDropdown)
                              }}
                              onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                            >
                              <MapPin className="w-4 h-4 text-forest-600" />
                              <span className="text-sm font-medium text-forest-700">My Locations</span>
                              <ChevronDown className={`w-3 h-3 text-forest-600 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {/* Dropdown Menu - Rendered as Portal */}
                            {showLocationDropdown && typeof window !== 'undefined' && createPortal(
                              <div 
                                className="fixed w-64 bg-white rounded-lg shadow-lg border border-sage-200 py-1 z-[10000] animate-in fade-in slide-in-from-top-1"
                                style={{ 
                                  top: `${dropdownPosition.top}px`, 
                                  left: `${dropdownPosition.left}px` 
                                }}
                              >
                                {savedLocations.map(loc => (
                                  <button
                                    key={loc.id}
                                    onClick={() => {
                                      handleLocationSelect(loc)
                                      setShowLocationDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sage-50 transition-colors text-left"
                                  >
                                    <MapPin className="w-4 h-4 text-forest-500 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-forest-700">
                                          {loc.name}
                                        </span>
                                        {loc.is_default && (
                                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-earth-500">
                                        {loc.location_type === 'zip' ? 'ZIP ' : ''}{loc.location_value}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                                <div className="border-t border-sage-200 mt-1 pt-1">
                                  <button
                                    onClick={() => {
                                      setShowLocationModal(true)
                                      setShowLocationDropdown(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-sage-50 transition-colors text-left"
                                  >
                                    <Settings className="w-4 h-4 text-earth-500" />
                                    <span className="text-sm text-earth-600">Manage Locations</span>
                                  </button>
                                </div>
                              </div>,
                              document.body
                            )}
                          </>
                        )}
                        
                        {/* Manual ZIP Entry */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-600 w-4 h-4" />
                          <input
                            value={zip}
                            onChange={e => setZip(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleZip()}
                            placeholder={savedLocations.length > 0 ? "Or enter ZIP" : "Enter ZIP code"}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Search/Change Button */}
                    {currentLocation ? (
                      <Button 
                        variant="nature" 
                        onClick={() => {
                          // Clear current location to show location selector
                          setCurrentLocation(null)
                          setZip('')
                        }}
                        size="sm" 
                        className="whitespace-nowrap"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Change</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="nature" 
                        onClick={handleZip}
                        disabled={loading || !zip}
                        size="sm" 
                        className="whitespace-nowrap"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Finding...</span>
                          </>
                        ) : (
                          <>
                            <Binoculars className="w-4 h-4" />
                            <span>Search</span>
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Settings Button (only if no saved locations) */}
                    {savedLocations.length === 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowLocationModal(true)}
                        title="Manage Locations"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {locationLoading && (
                    <span className="text-xs text-earth-500 text-center">Detecting your location...</span>
                  )}
                </div>
                
                {/* Save Location Prompt */}
                {showSavePrompt && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">
                          Save ZIP {lastSearchedZip} for quick access?
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSavePrompt(false)
                            setLastSearchedZip(null)
                          }}
                          className="text-xs"
                        >
                          No
                        </Button>
                        <Button
                          variant="nature"
                          size="sm"
                          onClick={handleSaveLocation}
                          className="text-xs"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {(selectedLoc || selectedSpecies || cutoffDate) && (
              <div className="mb-4 p-3 bg-sage-100 rounded-lg border border-sage-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-forest-600" />
                    <span className="text-sm text-earth-600 font-medium">
                      {displayedBirds.length} {displayedBirds.length === 1 ? 'result' : 'results'}
                    </span>
                    {selectedLoc && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs">
                        <MapPin className="w-3 h-3 text-forest-600" />
                        <strong className="text-forest-600">{selectedLoc.length > 20 ? selectedLoc.substring(0, 20) + '...' : selectedLoc}</strong>
                        <button
                          onClick={() => setSelectedLoc(null)}
                          className="ml-1 hover:text-terracotta-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedSpecies && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs">
                        <Feather className="w-3 h-3 text-forest-600" />
                        <strong className="text-forest-600">{selectedSpecies.length > 20 ? selectedSpecies.substring(0, 20) + '...' : selectedSpecies}</strong>
                        <button
                          onClick={() => setSelectedSpecies(null)}
                          className="ml-1 hover:text-terracotta-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {cutoffDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-full text-xs">
                        {/* Calendar icon inline to avoid importing again here */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-forest-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <strong className="text-forest-600">Since {new Date(`${cutoffDate}T00:00:00`).toLocaleDateString()}</strong>
                        <button
                          onClick={() => setCutoffDate(null)}
                          className="ml-1 hover:text-terracotta-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedLoc(null)
                      setSelectedSpecies(null)
                      setCutoffDate(null)
                    }}
                    className="py-1 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <Loader2 className="w-16 h-16 animate-spin text-sage-400" />
                  <Bird className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-forest-600 bird-animation" />
                </div>
                <p className="text-earth-600 text-xl mt-6 font-heading">Searching for rare birds...</p>
                <p className="text-earth-400 text-sm mt-2">This won't take long</p>
              </div>
            ) : displayedBirds.length > 0 ? (
              <>
                {/* Compact Stats Bar */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-sage-200 flex items-center gap-3">
                    <div className="p-2 bg-terracotta-100 rounded-lg">
                      <Bird className="w-5 h-5 text-terracotta-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-forest-600">{displayedBirds.length}</p>
                      <p className="text-xs text-earth-500">Rare Birds Spotted</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-sage-200 flex items-center gap-3">
                    <div className="p-2 bg-sage-100 rounded-lg">
                      <Feather className="w-5 h-5 text-sage-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-forest-600">{Object.keys(speciesCounts).length}</p>
                      <p className="text-xs text-earth-500">Species</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-sage-200 flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-heading font-bold text-forest-600">{Object.keys(locationCounts).length}</p>
                      <p className="text-xs text-earth-500">Locations</p>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid - Map and Charts Side by Side */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  {/* Map Section */}
                  {isLoaded && mapCenter && (
                    <BirdMap
                      birds={displayedBirds}
                      center={mapCenter}
                      selectedLoc={selectedLoc}
                      selectedSpecies={selectedSpecies}
                      onLocationSelect={setSelectedLoc}
                      onSpeciesSelect={openSpeciesModal}
                    />
                  )}
                  
                  {/* Charts Section - matching map height */}
                  <div className="h-[500px]">
                    {/* Date Filter Control */}
                    <div className="mb-3 flex items-center justify-end">
                      <DateFilter cutoffDate={cutoffDate} onChange={setCutoffDate} />
                    </div>
                    <BirdCharts 
                    speciesData={speciesCounts} 
                    locationData={locationCounts}
                    onSpeciesClick={(species) => {
                      if (selectedSpecies === species) {
                        setSelectedSpecies(null)
                      } else {
                        setSelectedSpecies(species)
                      }
                    }}
                    onLocationClick={(location) => {
                      if (selectedLoc === location) {
                        setSelectedLoc(null)
                      } else {
                        setSelectedLoc(location)
                      }
                    }}
                    activeFilter={
                      selectedSpecies 
                        ? { type: 'species', value: selectedSpecies }
                        : selectedLoc 
                        ? { type: 'location', value: selectedLoc }
                        : null
                    }
                    />
                  </div>
                </div>

                {/* Species Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-heading font-bold text-forest-600">
                      Species Gallery
                      <span className="text-sm font-normal text-earth-500 ml-2">
                        ({Object.keys(speciesCounts).length} species)
                      </span>
                    </h2>
                    <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-terracotta-100 rounded-full">
                      <Feather className="w-3 h-3 text-terracotta-500" />
                      <span className="text-xs font-heading font-semibold text-terracotta-600">Rare</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(
                  displayedBirds.reduce((acc, bird) => {
                    if (!acc[bird.species]) {
                      acc[bird.species] = {
                        species_code: bird.species_code,
                        sightings: []
                      }
                    }
                    acc[bird.species].sightings.push({
                      location: bird.loc,
                      loc_id: bird.loc_id,
                      date: bird.date,
                      lat: bird.lat,
                      lng: bird.lng
                    })
                    return acc
                  }, {} as Record<string, {species_code: string, sightings: Array<{location: string, loc_id: string, date: string, lat: number, lng: number}>}>)
                ).map(([species, data]) => (
                  <SpeciesCard
                    key={species}
                    species={species}
                    speciesCode={data.species_code}
                    sightings={data.sightings}
                  />
                ))}
                  </div>
                </div>
              </>
            ) : (
              !locationLoading && (
                <div className="text-center py-20">
                  <div className="inline-block p-6 bg-sage-50 rounded-full mb-6">
                    <Bird className="w-16 h-16 text-sage-300" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-forest-600 mb-3">No Rare Birds Found</h3>
                  <p className="text-earth-500 text-lg mb-6">Try searching in a different location</p>
                  <Button variant="nature" onClick={() => setZip('')}>
                    <Search className="w-5 h-5" />
                    <span>Search Again</span>
                  </Button>
                </div>
              )
            )}
            </>
            )}
          </div>
        </div>
      </main>
      
      {/* Location Management Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          loadSavedLocations() // Refresh locations after modal closes
        }}
        onLocationSelect={handleLocationSelect}
        currentLocationId={currentLocation?.id || null}
      />

      {/* Species Details Modal (shared) */}
      <SpeciesDetailsModal
        isOpen={!!speciesModal}
        onClose={() => setSpeciesModal(null)}
        species={speciesModal?.species || ''}
        speciesCode={speciesModal?.speciesCode || ''}
        sightings={speciesModal?.sightings || []}
      />
    </>
  )
}