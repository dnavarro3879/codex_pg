'use client'

import { useEffect, useRef, useState } from 'react'
import { speciesAPI } from '../../lib/api'
import { Search } from 'lucide-react'

export type SpeciesSuggestion = { species_name: string; species_code: string; scientific_name?: string }

interface SpeciesAutocompleteProps {
  label?: string
  selected: SpeciesSuggestion | null
  onSelect: (s: SpeciesSuggestion) => void
}

export function SpeciesAutocomplete({ label = 'Species', selected, onSelect }: SpeciesAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SpeciesSuggestion[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      try {
        const data = await speciesAPI.suggest(query, 8)
        setSuggestions(data)
      } catch (e) {
        setSuggestions([])
      }
    }, 200)
  }, [query])

  return (
    <div className="relative">
      <label className="block text-xs text-earth-500 mb-1">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600 w-4 h-4" />
        <input
          value={selected ? selected.species_name : query}
          onChange={(e) => {
            setQuery(e.target.value)
          }}
          onFocus={() => selected && setQuery('')}
          placeholder="Search species name"
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-sage-200 shadow-lg max-h-72 overflow-auto">
          {suggestions.map((s) => (
            <button
              key={s.species_code}
              className="w-full text-left px-3 py-2 hover:bg-sage-50"
              onClick={() => {
                onSelect(s)
                setQuery('')
                setSuggestions([])
              }}
            >
              <div className="text-sm font-medium text-forest-700">{s.species_name}</div>
              {s.scientific_name && <div className="text-xs text-earth-500">{s.scientific_name}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


