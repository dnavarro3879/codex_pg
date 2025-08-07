'use client'

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

interface Bird {
  species: string
  loc: string
  date: string
}

export default function Page() {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [zip, setZip] = useState('')
  const [birds, setBirds] = useState<Bird[]>([])

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

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
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
