'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Camera, AlertCircle } from 'lucide-react'
import { getBirdPhoto } from '../lib/pexels'

interface BirdCardProps {
  species: string
  location: string
  date: string
  index: number
}

export function BirdCard({ species, location, date, index }: BirdCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    getBirdPhoto(species)
      .then(url => {
        setImageUrl(url)
        setImageLoading(false)
      })
      .catch(() => {
        setImageError(true)
        setImageLoading(false)
      })
  }, [species])

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {imageLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Camera className="w-12 h-12 mb-2" />
            <span className="text-sm">No image available</span>
          </div>
        ) : (
          <>
            <img
              src={imageUrl}
              alt={species}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        )}
        
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <AlertCircle className="w-4 h-4 text-orange-600" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {species}
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Rare Sighting
          </span>
        </div>
      </div>
    </div>
  )
}