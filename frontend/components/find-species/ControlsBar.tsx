'use client'

import { Calendar, Ruler } from 'lucide-react'

interface ControlsBarProps {
  radiusKm: number
  onRadiusChange: (v: number) => void
  cutoffDate: string | null
  onCutoffChange: (v: string | null) => void
  compact?: boolean
}

export function ControlsBar({ radiusKm, onRadiusChange, cutoffDate, onCutoffChange, compact = false }: ControlsBarProps) {
  if (compact) {
    return (
      <div className="flex items-end gap-3">
        <div className="min-w-[200px]">
          <label className="block text-xs text-earth-500 mb-1">Range (km)</label>
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-forest-600" />
            <input
              type="range"
              min={1}
              max={100}
              value={radiusKm}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs w-8 text-right">{radiusKm}</span>
          </div>
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs text-earth-500 mb-1">Since</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600 w-4 h-4" />
            <input
              type="date"
              value={cutoffDate ?? ''}
              onChange={(e) => onCutoffChange(e.target.value || null)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
      <div>
        <label className="block text-xs text-earth-500 mb-1">Range (km)</label>
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-forest-600" />
          <input
            type="range"
            min={1}
            max={100}
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-10 text-right">{radiusKm}</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-earth-500 mb-1">Since</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600 w-4 h-4" />
          <input
            type="date"
            value={cutoffDate ?? ''}
            onChange={(e) => onCutoffChange(e.target.value || null)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>
    </div>
  )
}


