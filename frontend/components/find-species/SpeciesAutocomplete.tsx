'use client'

import { useEffect, useRef, useState } from 'react'
import { speciesAPI } from '../../lib/api'
import { Search, X } from 'lucide-react'

export type SpeciesSuggestion = { species_name: string; species_code: string; scientific_name?: string }

interface SpeciesAutocompleteProps {
  label?: string
  selected: SpeciesSuggestion | null
  onSelect: (s: SpeciesSuggestion) => void
  disabled?: boolean
  onClear?: () => void
}

export function SpeciesAutocomplete({ label = 'Species', selected, onSelect, disabled = false, onClear }: SpeciesAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SpeciesSuggestion[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (disabled) {
      setSuggestions([])
      return
    }
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
          onFocus={() => !disabled && selected && setQuery('')}
          placeholder="Search species name"
          className={`w-full pl-10 ${selected && disabled && onClear ? 'pr-20' : 'pr-3'} py-2 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed`}
          disabled={disabled}
          title={disabled ? 'Selected species locked. Click Clear to change.' : undefined}
        />
        {selected && disabled && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-sage-300 bg-white hover:bg-sage-50 text-earth-700"
            title="Clear selected species"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      {disabled && selected && (
        <div className="mt-1 text-[11px] text-earth-500">Selected species locked. Click Clear to change.</div>
      )}
      {suggestions.length > 0 && !disabled && (
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


