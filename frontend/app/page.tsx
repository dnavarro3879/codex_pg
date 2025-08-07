"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

interface Bird {
  species: string
  loc: string
  date: string
  lat: number
  lng: number
}

export default function Page() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [zip, setZip] = useState('')
  const [birds, setBirds] = useState<Bird[]>([])
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    if (lat === null || lng === null) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      })
    }
  }, [lat, lng])

  useEffect(() => {
    if (lat !== null && lng !== null) {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      fetch(`${base}/birds/rare?lat=${lat}&lng=${lng}`)
        .then(r => r.json())
        .then(setBirds)
        .catch(() => setBirds([]))
    }
  }, [lat, lng])

  const handleZip = async () => {
    if (!zip) return
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return
    const data = await res.json()
    const place = data.places[0]
    setLat(parseFloat(place.latitude))
    setLng(parseFloat(place.longitude))
  }

  const displayedBirds = selectedLoc
    ? birds.filter(b => b.loc === selectedLoc)
    : birds

  const speciesCounts = displayedBirds.reduce((acc, b) => {
    acc[b.species] = (acc[b.species] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const locationCounts = displayedBirds.reduce((acc, b) => {
    acc[b.loc] = (acc[b.loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const locationCoords = birds.reduce((acc, b) => {
    if (!acc[b.loc]) acc[b.loc] = { lat: b.lat, lng: b.lng }
    return acc
  }, {} as Record<string, { lat: number; lng: number }>)

  const speciesOption = {
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll' },
    xAxis: { type: 'category', data: ['Species'] },
    yAxis: { type: 'value' },
    series: Object.entries(speciesCounts).map(([name, count]) => ({
      name,
      type: 'bar',
      stack: 'total',
      data: [count],
    })),
  }

  const locationOption = {
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll' },
    xAxis: { type: 'category', data: ['Locations'] },
    yAxis: { type: 'value' },
    series: Object.entries(locationCounts).map(([name, count]) => ({
      name,
      type: 'bar',
      stack: 'total',
      data: [count],
    })),
  }

  const mapCenter = lat !== null && lng !== null ? { lat, lng } : undefined

  return (
    <main className="container mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Rare birds near you</h1>
      <div className="flex gap-2">
        <input
          value={zip}
          onChange={e => setZip(e.target.value)}
          placeholder="Zip code"
          className="border p-2 rounded w-full"
        />
        <Button onClick={handleZip}>Update</Button>
      </div>
      <div className="font-medium">Found {displayedBirds.length} birds</div>
      {displayedBirds.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-4">
            <ReactECharts option={speciesOption} style={{ height: 300 }} />
          </Card>
          <Card className="p-4">
            <ReactECharts option={locationOption} style={{ height: 300 }} />
          </Card>
          {isLoaded && mapCenter && (
            <Card className="p-4 md:col-span-2">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '400px' }}
                center={mapCenter}
                zoom={8}
              >
                {Object.entries(locationCoords).map(([loc, coords]) => (
                  <Marker
                    key={loc}
                    position={coords}
                    onClick={() => setSelectedLoc(loc)}
                  >
                    {selectedLoc === loc && (
                      <InfoWindow onCloseClick={() => setSelectedLoc(null)}>
                        <div className="space-y-1">
                          <div className="font-medium">{loc}</div>
                          <ul className="list-disc pl-4">
                            {birds
                              .filter(b => b.loc === loc)
                              .map((b, i) => (
                                <li key={i}>{b.species}</li>
                              ))}
                          </ul>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                ))}
              </GoogleMap>
            </Card>
          )}
        </div>
      )}
      {selectedLoc && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing birds at {selectedLoc}
          </div>
          <Button variant="outline" onClick={() => setSelectedLoc(null)}>
            Clear
          </Button>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {displayedBirds.map((b, i) => (
          <Card key={i} className="overflow-hidden">
            <img
              src={`https://source.unsplash.com/400x300/?${encodeURIComponent(
                b.species + ' bird'
              )}&sig=${i}`}
              alt={b.species}
              className="w-full h-40 object-cover"
            />
            <div className="p-2">
              <div className="font-medium">{b.species}</div>
              <div className="text-sm text-gray-600">
                {b.loc} — {new Date(b.date).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
