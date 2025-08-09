'use client'

import { MapPin } from 'lucide-react'

interface LocationSelectorProps {
  type: 'zip' | 'city'
  value: string
  onTypeChange: (t: 'zip' | 'city') => void
  onValueChange: (v: string) => void
}

export function LocationSelector({ type, value, onTypeChange, onValueChange }: LocationSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <div>
        <label className="block text-xs text-earth-500 mb-1">Location</label>
        <div className="flex gap-1">
          <button
            onClick={() => onTypeChange('zip')}
            className={`px-2 py-1.5 rounded-md border text-xs ${type === 'zip' ? 'bg-sage-100 border-sage-300' : 'bg-white border-sage-200'}`}
          >
            ZIP
          </button>
          <button
            onClick={() => onTypeChange('city')}
            className={`px-2 py-1.5 rounded-md border text-xs ${type === 'city' ? 'bg-sage-100 border-sage-300' : 'bg-white border-sage-200'}`}
          >
            City
          </button>
        </div>
      </div>
      <div className="col-span-2">
        <label className="block text-xs text-earth-500 mb-1">{type === 'zip' ? 'ZIP Code' : 'City'}</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600 w-4 h-4" />
          <input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={type === 'zip' ? 'Enter ZIP code' : 'City[, ST]'}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
          />
        </div>
      </div>
    </div>
  )
}


