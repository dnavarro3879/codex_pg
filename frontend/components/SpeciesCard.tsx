'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Eye, X, Camera, Feather, TreePine, Heart } from 'lucide-react'
import { getBirdPhoto } from '../lib/flickr'
import { Button } from './ui/button'
import { authAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Sighting {
  location: string
  date: string
  lat: number
  lng: number
}

interface SpeciesCardProps {
  species: string
  speciesCode: string
  sightings: Sighting[]
}

export function SpeciesCard({ species, speciesCode, sightings }: SpeciesCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageAttribution, setImageAttribution] = useState<string>('')
  const [imageLoading, setImageLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteId, setFavoriteId] = useState<number | null>(null)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    getBirdPhoto(species)
      .then(result => {
        setImageUrl(result.url)
        setImageAttribution(result.attribution)
        setImageLoading(false)
      })
      .catch(() => {
        setImageLoading(false)
      })
  }, [species])

  useEffect(() => {
    if (user && speciesCode) {
      authAPI.checkFavorite(speciesCode)
        .then(result => {
          setIsFavorited(result.is_favorited)
          setFavoriteId(result.favorite_id)
        })
        .catch(() => {
          setIsFavorited(false)
          setFavoriteId(null)
        })
    }
  }, [user, speciesCode])

  const latestSighting = sightings.reduce((latest, current) => 
    new Date(current.date) > new Date(latest.date) ? current : latest
  , sightings[0])

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || favoriteLoading) return
    
    setFavoriteLoading(true)
    try {
      if (isFavorited && favoriteId) {
        await authAPI.removeFavorite(favoriteId)
        setIsFavorited(false)
        setFavoriteId(null)
      } else {
        const result = await authAPI.addFavorite(species, speciesCode)
        setIsFavorited(true)
        setFavoriteId(result.id)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
    setFavoriteLoading(false)
  }

  return (
    <>
      <div 
        className="group relative overflow-hidden rounded-2xl bg-white shadow-nature hover:shadow-nature-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-sage-100"
        onClick={() => setShowDetails(true)}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-sage-50 to-sage-100">
          {imageLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-sage-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <img
                src={imageUrl}
                alt={species}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
          )}
          
          <div className="absolute top-3 right-3 bg-terracotta-500 text-white rounded-full px-3 py-1.5 text-sm font-heading font-semibold shadow-lg">
            {sightings.length} {sightings.length === 1 ? 'sighting' : 'sightings'}
          </div>
          {imageAttribution && imageUrl && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{imageAttribution}</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <h3 className="text-lg font-heading font-bold text-forest-600 line-clamp-1 group-hover:text-forest-700 transition-colors">
            {species}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-earth-500">
              <MapPin className="w-4 h-4 text-sage-400" />
              <span className="line-clamp-1 font-medium">
                {sightings.length === 1 
                  ? latestSighting.location 
                  : `${sightings.length} locations`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-earth-500">
              <Calendar className="w-4 h-4 text-sage-400" />
              <span>
                Latest: {new Date(latestSighting.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-sage-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-terracotta-100 text-terracotta-600">
              <Feather className="w-3 h-3" />
              Rare Species
            </span>
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    isFavorited 
                      ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              )}
              <Eye className="w-4 h-4 text-sage-400 group-hover:text-forest-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-sage-200 animate-slide-up">
            <div className="relative h-72 bg-gradient-to-br from-sage-50 to-sage-100">
              <img
                src={imageUrl}
                alt={species}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                className="absolute top-4 right-4 p-2.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <X className="w-5 h-5 text-forest-600" />
              </button>
              <div className="absolute bottom-6 left-6 text-white">
                <h2 className="text-3xl font-heading font-bold mb-2 drop-shadow-lg">{species}</h2>
                <div className="flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  <p className="text-lg font-medium">{sightings.length} rare {sightings.length === 1 ? 'sighting' : 'sightings'}</p>
                </div>
              </div>
              {imageAttribution && (
                <div className="absolute bottom-6 right-6 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                  <Camera className="w-3 h-3" />
                  <span>Photo: {imageAttribution}</span>
                </div>
              )}
            </div>
            
            <div className="p-8 max-h-[calc(90vh-18rem)] overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-heading font-bold mb-5 text-forest-600 flex items-center gap-2">
                <Feather className="w-5 h-5 text-terracotta-500" />
                All Sightings
              </h3>
              <div className="space-y-3">
                {sightings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((sighting, index) => (
                    <div key={index} className="p-4 bg-sage-50 rounded-xl hover:bg-sage-100 transition-all duration-200 border border-sage-200 hover:border-sage-300">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-forest-600" />
                            <span className="font-heading font-semibold text-forest-700">{sighting.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-earth-500">
                            <Calendar className="w-4 h-4 text-sage-500" />
                            <span>
                              {new Date(sighting.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-heading font-semibold text-terracotta-500 bg-terracotta-100 px-2 py-1 rounded-full">
                          #{sightings.length - index}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}