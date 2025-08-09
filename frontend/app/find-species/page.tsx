'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { Header } from '../../components/Header'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { speciesAPI } from '../../lib/api'
import { getBirdPhotoFromWikimedia } from '../../lib/wikimedia'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/useAuthModal'
import { Loader2, Search, Bird as BirdIcon, Camera, ExternalLink } from 'lucide-react'

import { SpeciesAutocomplete, SpeciesSuggestion } from '../../components/find-species/SpeciesAutocomplete'
import { LocationSelector } from '../../components/find-species/LocationSelector'
import { ControlsBar } from '../../components/find-species/ControlsBar'
import { useJsApiLoader } from '@react-google-maps/api'
import { BirdMap } from '../../components/BirdMap'
import { SpeciesDetailsModal } from '../../components/SpeciesDetailsModal'

interface Observation {
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

export default function FindSpeciesPage() {
  const { user } = useAuth()
  const authModal = useAuthModal()

  const [selected, setSelected] = useState<SpeciesSuggestion | null>(null)
  const [locationType, setLocationType] = useState<'zip' | 'city'>('zip')
  const [locationValue, setLocationValue] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [cutoffDate, setCutoffDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Observation[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageAttribution, setImageAttribution] = useState<string | null>(null)
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null)
  type ModalSighting = { location: string; loc_id: string; date: string; lat: number; lng: number }
  const [speciesModal, setSpeciesModal] = useState<{
    species: string
    speciesCode: string
    sightings: ModalSighting[]
  } | null>(null)

  // Load image for selected species
  useEffect(() => {
    if (!selected) {
      setImageUrl(null)
      setImageAttribution(null)
      return
    }
    (async () => {
      try {
        const img = await getBirdPhotoFromWikimedia(selected.species_name)
        setImageUrl(img.url)
        setImageAttribution(img.attribution)
      } catch (e) {
        setImageUrl(null)
        setImageAttribution(null)
      }
    })()
  }, [selected])

  const handleSearch = async () => {
    if (!selected) return
    if (!locationValue) return
    setLoading(true)
    setResults([])
    try {
      const data = await speciesAPI.observations({
        species_code: selected.species_code,
        location_type: locationType,
        location_value: locationValue,
        radius_km: radiusKm,
        cutoff_date: cutoffDate || undefined,
      })
      setResults(data)
      setSelectedLoc(null)
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Google Maps loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  // Compute map center from results
  const mapCenter = useMemo(() => {
    if (results.length > 0) {
      const lat = results.reduce((sum, r) => sum + r.lat, 0) / results.length
      const lng = results.reduce((sum, r) => sum + r.lng, 0) / results.length
      return { lat, lng }
    }
    return undefined
  }, [results])

  const openSpeciesModal = (speciesName: string) => {
    const matching = results.filter(b => b.species === speciesName && (!selectedLoc || b.loc === selectedLoc))
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
          <div className="absolute inset-0 bg-leaf-pattern opacity-5" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 relative">
            <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-100 rounded-full mb-2">
                  <BirdIcon className="w-3 h-3 text-forest-600" />
                  <span className="text-xs font-heading font-semibold text-forest-600">Find Species</span>
                </div>
                <h1 className="text-3xl font-heading font-bold text-forest-600">Find Sightings for a Species</h1>
                <p className="text-earth-600 mt-1">Search up to 100 km from a ZIP code or city and optionally set a date cutoff.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 items-stretch">
              {/* Left: Controls (separate card) */}
              <div className="lg:col-span-8">
                <Card variant="glass" className="p-4 h-full">
                  <div className="space-y-4">
                    {/* Section 1: Species */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-forest-100 text-forest-700 text-xs font-heading">1</span>
                        <span className="text-sm font-heading text-forest-700">Choose species</span>
                      </div>
                      <SpeciesAutocomplete selected={selected} onSelect={setSelected} />
                    </div>

                    <div className="border-t border-sage-200" />

                    {/* Section 2: Location */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-forest-100 text-forest-700 text-xs font-heading">2</span>
                        <span className="text-sm font-heading text-forest-700">Choose location</span>
                      </div>
                      <LocationSelector
                        type={locationType}
                        value={locationValue}
                        onTypeChange={setLocationType}
                        onValueChange={setLocationValue}
                      />
                      <p className="text-xs text-earth-500 mt-1">
                        {locationType === 'zip' ? 'Example: 94105' : 'Example: Denver, CO'}
                      </p>
                    </div>

                    <div className="border-t border-sage-200" />

                    {/* Section 3: Range & Date */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-forest-100 text-forest-700 text-xs font-heading">3</span>
                        <span className="text-sm font-heading text-forest-700">Set range and date</span>
                      </div>
                      <ControlsBar
                        radiusKm={radiusKm}
                        onRadiusChange={setRadiusKm}
                        cutoffDate={cutoffDate}
                        onCutoffChange={setCutoffDate}
                        compact
                      />
                      <p className="text-xs text-earth-500 mt-1">Up to 100 km. Date optional.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-between pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelected(null)
                          setLocationValue('')
                          setCutoffDate(null)
                          setRadiusKm(25)
                          setResults([])
                          setSelectedLoc(null)
                          setImageUrl(null)
                          setImageAttribution(null)
                        }}
                        className="sm:w-auto"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="nature"
                        onClick={handleSearch}
                        disabled={!selected || !locationValue || loading}
                        className="sm:w-auto"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Searching...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Search</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: Selected species preview (separate card) */}
              <div className="lg:col-span-4 flex">
                <Card className="overflow-hidden h-full flex flex-col w-full">
                  {selected ? (
                    <>
                      <div className="p-3 border-b border-sage-200 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-earth-500">Selected species</div>
                          <div className="text-lg font-heading font-bold text-forest-700">{selected.species_name}</div>
                          {selected.scientific_name && (
                            <div className="text-xs text-earth-500 italic">{selected.scientific_name}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(null)
                            setImageUrl(null)
                            setImageAttribution(null)
                          }}
                          className="text-earth-600 hover:text-terracotta-600"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="p-4 flex flex-col items-center gap-3">
                        <div className="aspect-square w-full max-w-[360px] bg-sage-50 rounded-lg overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={selected.species_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-earth-400 text-xs">No image</div>
                          )}
                        </div>
                        <a
                          href={`https://ebird.org/species/${selected.species_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                          title="Open eBird profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open eBird profile</span>
                        </a>
                        {imageAttribution && (
                          <div className="text-[10px] text-earth-500">Photo: {imageAttribution}</div>
                        )}
                      </div>
                      <div className="mt-auto" />
                    </>
                  ) : (
                    <div className="p-4 text-sm text-earth-500">Select a species to see its image and profile here.</div>
                  )}
                </Card>
              </div>
            </div>

            {/* Species preview moved into right pane above */}

            {/* Results Map */}
            <div>
              {loading ? (
                <div className="flex items-center gap-2 text-earth-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading observations...</div>
              ) : results.length === 0 ? (
                <div className="text-earth-500">No observations yet. Try adjusting range or date.</div>
              ) : (
                isLoaded && mapCenter && (
                  <BirdMap
                    birds={results}
                    center={mapCenter}
                    selectedLoc={selectedLoc}
                    selectedSpecies={selected?.species_name || null}
                    onLocationSelect={setSelectedLoc}
                    onSpeciesSelect={openSpeciesModal}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Species Details Modal */}
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


