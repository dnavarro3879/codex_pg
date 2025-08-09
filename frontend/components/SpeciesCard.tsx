'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Eye, X, Camera, Feather, TreePine, Heart, ExternalLink, Map, Navigation } from 'lucide-react'
import { getBirdPhoto } from '../lib/flickr'
import { Button } from './ui/button'
import { authAPI } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface Sighting {
  location: string
  loc_id: string
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-terracotta-100 text-terracotta-600">
                <Feather className="w-3 h-3" />
                Rare Species
              </span>
              <a
                href={`https://ebird.org/species/${speciesCode}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-heading font-semibold text-sky-600 hover:bg-sky-50 transition-colors"
                title="View on eBird"
              >
                <ExternalLink className="w-3 h-3" />
                eBird
              </a>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-cream-50 rounded-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-sage-200 animate-slide-up">
            {/* Modern Header with Grid Layout */}
            <div className="relative bg-gradient-to-br from-sage-50 via-cream-50 to-sage-100 border-b border-sage-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Section */}
                <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={species}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden"></div>
                  {imageAttribution && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-earth-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Camera className="w-3 h-3" />
                      <span className="font-medium">{imageAttribution}</span>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-6 sm:p-8 lg:py-12 flex flex-col justify-center">
                  <div className="space-y-4">
                    {/* Species Name & Badge */}
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-terracotta-100 text-terracotta-600 rounded-full text-xs font-semibold mb-3 uppercase tracking-wide">
                        <Feather className="w-3 h-3" />
                        Rare Species
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-forest-700 mb-2 font-heading">{species}</h2>
                      <p className="text-earth-600">Species Code: <span className="font-mono font-semibold text-forest-600">{speciesCode}</span></p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-white/80 rounded-xl p-4 border border-sage-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-sage-500" />
                          <span className="text-xs text-earth-500 font-medium uppercase tracking-wide">Sightings</span>
                        </div>
                        <p className="text-2xl font-bold text-forest-600 font-heading">{sightings.length}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 border border-sage-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-sage-500" />
                          <span className="text-xs text-earth-500 font-medium uppercase tracking-wide">Latest</span>
                        </div>
                        <p className="text-sm font-semibold text-forest-600">
                          {new Date(sightings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <a
                        href={`https://ebird.org/species/${speciesCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on eBird
                      </a>
                      {user && (
                        <button
                          onClick={handleFavoriteToggle}
                          disabled={favoriteLoading}
                          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                            isFavorited 
                              ? 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200 border border-terracotta-200' 
                              : 'bg-sage-100 text-forest-600 hover:bg-sage-200 border border-sage-200'
                          } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(false)
                }}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all shadow-sm border border-sage-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-forest-600" />
              </button>
            </div>
            
            {/* Sightings List with Modern Cards */}
            <div className="p-6 sm:p-8 max-h-[50vh] overflow-y-auto bg-gradient-to-b from-cream-50 to-white custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-forest-700 font-heading">
                  Recent Observations
                </h3>
                <span className="text-xs text-earth-500 font-medium uppercase tracking-wide">
                  {sightings.length} Total
                </span>
              </div>
              
              <div className="space-y-3">
                {sightings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((sighting, index) => (
                    <div key={index} className="group bg-white rounded-xl p-5 border border-sage-200 hover:border-sage-300 hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Location & Date Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-terracotta-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-forest-700 leading-tight">{sighting.location}</p>
                                <p className="text-xs text-earth-500 mt-0.5">
                                  {new Date(sighting.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`https://ebird.org/hotspot/${sighting.loc_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-medium transition-colors border border-sky-200"
                              title="View location on eBird"
                            >
                              <ExternalLink className="w-3 h-3" />
                              eBird
                            </a>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${sighting.lat},${sighting.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 hover:bg-sage-100 text-forest-600 rounded-lg text-xs font-medium transition-colors border border-sage-200"
                              title="Open in Google Maps"
                            >
                              <Map className="w-3 h-3" />
                              Google
                            </a>
                            <a
                              href={`https://maps.apple.com/?ll=${sighting.lat},${sighting.lng}&q=${encodeURIComponent(sighting.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-earth-50 hover:bg-earth-100 text-earth-700 rounded-lg text-xs font-medium transition-colors border border-earth-200"
                              title="Open in Apple Maps"
                            >
                              <Navigation className="w-3 h-3" />
                              Apple
                            </a>
                          </div>
                        </div>
                        
                        {/* Index Badge */}
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <span className="text-xs font-medium text-earth-400">
                            {index === 0 ? 'Most Recent' : `${index + 1} of ${sightings.length}`}
                          </span>
                        </div>
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