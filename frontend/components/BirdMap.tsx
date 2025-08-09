'use client'

import { useState, useMemo } from 'react'
import { GoogleMap, Marker, OverlayView } from '@react-google-maps/api'
import { MapPin, ExternalLink, Map, Navigation, X } from 'lucide-react'
import { Card } from './ui/card'

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

interface BirdMapProps {
  birds: ObservedBird[]
  center: { lat: number; lng: number }
  selectedLoc: string | null
  selectedSpecies: string | null
  onLocationSelect: (location: string | null) => void
}

interface LocationDataItem {
  coords: { lat: number; lng: number }
  loc_id: string
  species: Map<string, number>
}

const mapStyles = [
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
]

export function BirdMap({ 
  birds, 
  center, 
  selectedLoc, 
  selectedSpecies,
  onLocationSelect 
}: BirdMapProps) {
  const [infoWindowLoc, setInfoWindowLoc] = useState<string | null>(null)

  // Filter birds based on selection
  const displayedBirds = useMemo(() => {
    return birds.filter(b => {
      if (selectedLoc && b.loc !== selectedLoc) return false
      if (selectedSpecies && b.species !== selectedSpecies) return false
      return true
    })
  }, [birds, selectedLoc, selectedSpecies])

  // Get unique locations with their coordinates and location ID
  const locationData = useMemo(() => {
    const locMap = new globalThis.Map<string, LocationDataItem>()

    displayedBirds.forEach(bird => {
      if (!locMap.has(bird.loc)) {
        locMap.set(bird.loc, {
          coords: { lat: bird.lat, lng: bird.lng },
          loc_id: bird.loc_id,
          species: new globalThis.Map<string, number>()
        })
      }
      
      const location = locMap.get(bird.loc)!
      const currentCount = location.species.get(bird.species) || 0
      location.species.set(bird.species, currentCount + 1)
    })

    return locMap
  }, [displayedBirds])

  const handleMarkerClick = (loc: string) => {
    setInfoWindowLoc(loc)
    onLocationSelect(loc)
  }

  const handleInfoWindowClose = () => {
    setInfoWindowLoc(null)
    onLocationSelect(null)
  }

  // Convert Map to array for rendering
  const locationEntries: Array<[string, LocationDataItem]> = Array.from(locationData.entries())

  return (
    <Card variant="nature" className="p-0 overflow-hidden h-[500px]">
      <div className="nature-gradient p-4 flex items-center justify-between">
        <h3 className="text-white text-lg font-heading font-bold">
          Locations
          {(selectedSpecies || selectedLoc) && (
            <span className="text-sm font-normal ml-2 opacity-90">
              ({locationData.size} shown)
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
        center={center}
        zoom={9}
        options={{ styles: mapStyles }}
      >
        {locationEntries.map(([loc, data]) => (
          <Marker
            key={loc}
            position={data.coords}
            onClick={() => handleMarkerClick(loc)}
            icon={{
              url: (selectedLoc === loc || infoWindowLoc === loc)
                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            }}
          >
            {infoWindowLoc === loc && (
              <OverlayView
                position={data.coords}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={() => ({
                  x: -140, // Center horizontally (half of 280px width)
                  y: -40,  // Position above marker
                })}
              >
                <div 
                  className="relative"
                  style={{ width: '280px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Custom Popup */}
                  <div className="bg-white rounded-lg shadow-lg border border-sage-200 p-2 w-full">
                    {/* Header with location name and buttons in single row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-heading font-bold text-forest-600 text-sm flex-1">{loc}</h4>
                      
                      {/* All buttons in header */}
                      <div className="flex gap-0.5 items-center">
                        <a
                          href={`https://ebird.org/hotspot/${data.loc_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-xs transition-colors border border-sky-200"
                          title="View location on eBird"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${data.coords.lat},${data.coords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-1.5 py-0.5 bg-sage-50 hover:bg-sage-100 text-forest-600 rounded text-xs transition-colors border border-sage-200"
                          title="Open in Google Maps"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Map className="w-2.5 h-2.5" />
                        </a>
                        <a
                          href={`https://maps.apple.com/?ll=${data.coords.lat},${data.coords.lng}&q=${encodeURIComponent(loc)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-1.5 py-0.5 bg-earth-50 hover:bg-earth-100 text-earth-700 rounded text-xs transition-colors border border-earth-200"
                          title="Open in Apple Maps"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation className="w-2.5 h-2.5" />
                        </a>
                        <button
                          onClick={handleInfoWindowClose}
                          className="inline-flex items-center px-1 py-0.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded text-xs transition-colors ml-1"
                          title="Close"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-earth-500 mb-2">
                      <span className="font-semibold text-terracotta-500">
                        {data.species.size}
                      </span> unique {data.species.size === 1 ? 'species' : 'species'}
                      {selectedSpecies && <span className="text-sage-600"> (filtered)</span>}
                    </p>
                    
                    {/* Species List */}
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {Array.from(data.species.entries())
                        .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                        .map(([species, count]: [string, number]) => (
                          <div 
                            key={species} 
                            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-sage-50 transition-colors"
                          >
                            <span className="text-forest-600 font-medium flex-1 mr-2">
                              {species}
                            </span>
                            <span className="text-earth-500 text-xs font-semibold bg-sage-100 px-1.5 py-0.5 rounded">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Pointer arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-[9px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-sage-200"></div>
                </div>
              </OverlayView>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </Card>
  )
}