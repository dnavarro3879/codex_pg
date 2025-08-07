'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api'
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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    if (!lat || !lng) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      })
    }
  }, [lat, lng])

  useEffect(() => {
    if (lat && lng) {
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

  const speciesCounts = birds.reduce((acc, b) => {
    acc[b.species] = (acc[b.species] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const locationCounts = birds.reduce((acc, b) => {
    acc[b.loc] = (acc[b.loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const speciesOption = {
    xAxis: { type: 'category', data: Object.keys(speciesCounts) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: Object.values(speciesCounts) }],
  }

  const locationOption = {
    xAxis: { type: 'category', data: Object.keys(locationCounts) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: Object.values(locationCounts) }],
  }

  const mapCenter = lat && lng ? { lat, lng } : undefined

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Rare birds near you</h1>
      <div className="flex gap-2">
        <input
          value={zip}
          onChange={e => setZip(e.target.value)}
          placeholder="Zip code"
          className="border p-2 rounded w-full"
        />
        <Button onClick={handleZip}>Update</Button>
      </div>
      <div className="font-medium">Found {birds.length} birds</div>
      {birds.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-2">
            <ReactECharts option={speciesOption} style={{ height: 300 }} />
          </Card>
          <Card className="p-2">
            <ReactECharts option={locationOption} style={{ height: 300 }} />
          </Card>
        </div>
      )}
      {isLoaded && mapCenter && (
        <Card className="p-2">
          <GoogleMap mapContainerStyle={{ width: '100%', height: '400px' }} center={mapCenter} zoom={8}>
            {birds.map((b, i) => (
              <Marker key={i} position={{ lat: b.lat, lng: b.lng }} />
            ))}
          </GoogleMap>
        </Card>
      )}
      <div className="space-y-2">
        {birds.map((b, i) => (
          <Card key={i}>
            <div className="font-medium">{b.species}</div>
            <div className="text-sm text-gray-600">
              {b.loc} — {new Date(b.date).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
