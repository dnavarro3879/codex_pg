'use client'

import { Calendar, X } from 'lucide-react'

interface DateFilterProps {
  cutoffDate: string | null
  onChange: (date: string | null) => void
}

export function DateFilter({ cutoffDate, onChange }: DateFilterProps) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-earth-600 font-medium">Since</span>
      <div className="relative">
        <Calendar className="w-4 h-4 text-forest-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="date"
          value={cutoffDate ?? ''}
          onChange={(e) => onChange(e.target.value ? e.target.value : null)}
          max={todayStr}
          className="pl-10 pr-8 py-2 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all text-forest-700 text-sm font-medium"
        />
        {cutoffDate && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-sage-100"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5 text-earth-500" />
          </button>
        )}
      </div>
    </div>
  )
}


