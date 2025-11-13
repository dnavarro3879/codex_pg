'use client'

import { Card } from '../ui/card'
import { MapPin, Calendar, ExternalLink, Map } from 'lucide-react'

export interface Observation {
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

interface ObservationListProps {
  observations: Observation[]
  onOpenLocation: (loc: string) => void
}

export function ObservationList({ observations, onOpenLocation }: ObservationListProps) {
  if (!observations || observations.length === 0) {
    return null
  }

  // Sort by date descending for readability
  const sorted = [...observations].sort((a, b) => {
    const da = new Date(a.date.replace(' ', 'T')).getTime()
    const db = new Date(b.date.replace(' ', 'T')).getTime()
    return db - da
  })

  return (
    <div className="space-y-2">
      {sorted.map((obs, idx) => (
        <Card key={`${obs.loc_id}-${idx}`} className="px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                <div className="text-forest-700 font-medium text-sm truncate">{obs.loc}</div>
                {typeof obs.how_many === 'number' && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-sage-100 text-forest-700 border border-sage-200">{obs.how_many}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-earth-500 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span className="truncate">{new Date(obs.date.replace(' ', 'T')).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {obs.loc_id && (
                <a
                  href={`https://ebird.org/hotspot/${obs.loc_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-[11px] font-medium transition-colors border border-sky-200"
                  title="View location on eBird"
                >
                  <ExternalLink className="w-3 h-3" />
                  eBird
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${obs.lat},${obs.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sage-50 hover:bg-sage-100 text-forest-600 rounded text-[11px] font-medium transition-colors border border-sage-200"
                title="Open in Google Maps"
              >
                <Map className="w-3 h-3" />
                Maps
              </a>
              <button
                onClick={() => onOpenLocation(obs.loc)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded text-[11px] font-medium transition-colors border border-forest-200"
                title="Show on map"
              >
                Details
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}


