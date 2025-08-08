'use client'

import { useEffect, useState } from 'react'
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Header } from '../components/Header'
import { SpeciesCard } from '../components/SpeciesCard'
import { BirdCharts } from '../components/BirdCharts'
import { MapPin, Loader2, Search, Bird, X, Filter, Binoculars, Feather, User } from 'lucide-react'
import { preloadBirdPhotos } from '../lib/flickr'
import { birdAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/useAuthModal'

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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
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
  }, [lat, lng])

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
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    const place = data.places[0]
    setLat(parseFloat(place.latitude))
    setLng(parseFloat(place.longitude))
  }

  const displayedBirds = birds.filter(b => {
    if (selectedLoc && b.loc !== selectedLoc) return false
    if (selectedSpecies && b.species !== selectedSpecies) return false
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

  // Get unique locations from displayed birds (respecting filters)
  const filteredLocationCoords = displayedBirds.reduce((acc, b) => {
    if (!acc[b.loc]) acc[b.loc] = { lat: b.lat, lng: b.lng }
    return acc
  }, {} as Record<string, { lat: number; lng: number }>)

  const mapCenter = lat !== null && lng !== null ? { lat, lng } : undefined

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
              
              <Card variant="glass" className="p-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-forest-600 w-4 h-4" />
                    <input
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleZip()}
                      placeholder="Enter ZIP code"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
                      disabled={loading}
                    />
                  </div>
                  <Button variant="nature" onClick={handleZip} disabled={loading || !zip} size="sm" className="whitespace-nowrap">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Finding...</span>
                      </>
                    ) : (
                      <>
                        <Binoculars className="w-4 h-4" />
                        <span>Explore</span>
                      </>
                    )}
                  </Button>
                  {locationLoading && (
                    <span className="text-xs text-earth-500">Detecting location...</span>
                  )}
                </div>
              </Card>
            </div>

            {(selectedLoc || selectedSpecies) && (
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
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedLoc(null)
                      setSelectedSpecies(null)
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
                      <p className="text-xs text-earth-500">Rare Birds</p>
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
                    <Card variant="nature" className="p-0 overflow-hidden h-[500px]">
                      <div className="nature-gradient p-4 flex items-center justify-between">
                        <h3 className="text-white text-lg font-heading font-bold">
                          Locations
                          {(selectedSpecies || selectedLoc) && (
                            <span className="text-sm font-normal ml-2 opacity-90">
                              ({Object.keys(filteredLocationCoords).length} shown)
                            </span>
                          )}
                        </h3>
                        <span className="text-white/80 text-xs">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Click for details
                        </span>
                      </div>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: 'calc(100% - 60px)' }}
                        center={mapCenter}
                        zoom={9}
                        options={{
                          styles: [
                            {
                              featureType: 'water',
                              elementType: 'geometry',
                              stylers: [{ color: '#87CEEB' }, { lightness: 40 }],
                            },
                            {
                              featureType: 'landscape',
                              elementType: 'geometry',
                              stylers: [{ color: '#E6EDE1' }],
                            },
                            {
                              featureType: 'poi.park',
                              elementType: 'geometry',
                              stylers: [{ color: '#A7C299' }],
                            },
                            {
                              featureType: 'road',
                              elementType: 'geometry',
                              stylers: [{ color: '#F5F2ED' }],
                            },
                          ],
                        }}
                      >
                        {Object.entries(filteredLocationCoords).map(([loc, coords]) => (
                          <Marker
                            key={loc}
                            position={coords}
                            onClick={() => setSelectedLoc(loc)}
                            icon={{
                              url: selectedLoc === loc
                                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                                : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                            }}
                          >
                            {selectedLoc === loc && (
                              <InfoWindow onCloseClick={() => setSelectedLoc(null)}>
                                <div className="p-3">
                                  <h4 className="font-heading font-bold text-forest-600 mb-2">{loc}</h4>
                                  <p className="text-sm text-earth-500 mb-3">
                                    <span className="font-semibold text-terracotta-500">{displayedBirds.filter(b => b.loc === loc).length}</span> rare {displayedBirds.filter(b => b.loc === loc).length === 1 ? 'bird' : 'birds'} 
                                    {selectedSpecies && <span className="text-sage-600"> (filtered)</span>}
                                  </p>
                                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                    {displayedBirds
                                      .filter(b => b.loc === loc)
                                      .map((b, i) => (
                                        <div key={i} className="text-sm py-1.5 px-2 rounded hover:bg-sage-50 transition-colors">
                                          <span className="text-forest-600 font-medium">{b.species}</span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </InfoWindow>
                            )}
                          </Marker>
                        ))}
                      </GoogleMap>
                    </Card>
                  )}
                  
                  {/* Charts Section - matching map height */}
                  <div className="h-[500px]">
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
                      date: bird.date,
                      lat: bird.lat,
                      lng: bird.lng
                    })
                    return acc
                  }, {} as Record<string, {species_code: string, sightings: Array<{location: string, date: string, lat: number, lng: number}>}>)
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
    </>
  )
}