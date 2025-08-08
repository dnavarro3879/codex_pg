'use client'

import { useEffect, useState } from 'react'
import { Header } from '../../components/Header'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { authAPI } from '../../lib/api'
import { getBirdPhotoFromWikimedia } from '../../lib/wikimedia'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/useAuthModal'
import { Heart, Trash2, Loader2, Bird, Search, Feather, Calendar, User, Camera } from 'lucide-react'
import Link from 'next/link'

interface FavoriteBird {
  id: number
  species_name: string
  species_code: string
  scientific_name: string | null
  notes: string | null
  added_date: string
}

interface BirdWithPhoto extends FavoriteBird {
  imageUrl: string
  imageAttribution: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<BirdWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const { user } = useAuth()
  const authModal = useAuthModal()

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      const data = await authAPI.getFavorites()
      
      // Load photos for each favorite bird from Wikimedia
      const favoritesWithPhotos = await Promise.all(
        data.map(async (bird: FavoriteBird) => {
          try {
            const photo = await getBirdPhotoFromWikimedia(bird.species_name)
            return { 
              ...bird, 
              imageUrl: photo.url,
              imageAttribution: photo.attribution
            }
          } catch (error) {
            console.error('Error loading photo for', bird.species_name, error)
            return { 
              ...bird, 
              imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&h=400&fit=crop',
              imageAttribution: 'Unsplash'
            }
          }
        })
      )
      
      setFavorites(favoritesWithPhotos)
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId: number) => {
    setRemoving(favoriteId)
    try {
      await authAPI.removeFavorite(favoriteId)
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    } finally {
      setRemoving(null)
    }
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-white bg-nature-pattern">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
              <div className="text-center max-w-md mx-auto">
                <div className="inline-block p-6 bg-forest-50 rounded-full mb-6">
                  <Heart className="w-20 h-20 text-forest-500" />
                </div>
                <h1 className="text-4xl font-heading font-bold text-forest-600 mb-4">
                  Sign In to View Favorites
                </h1>
                <p className="text-lg text-earth-600 mb-8">
                  Keep track of your favorite bird species and build your personal collection.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="nature" 
                    size="lg"
                    onClick={authModal.openLogin}
                    className="min-w-[140px]"
                  >
                    <User className="w-5 h-5" />
                    Sign In
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="lg"
                    onClick={authModal.openRegister}
                    className="min-w-[140px]"
                  >
                    <Feather className="w-5 h-5" />
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-white bg-nature-pattern">
        <div className="relative">
          <div className="absolute inset-0 bg-leaf-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 relative">
            
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-100 rounded-full mb-2">
                    <Heart className="w-3 h-3 text-forest-600" />
                    <span className="text-xs font-heading font-semibold text-forest-600">My Collection</span>
                  </div>
                  <h1 className="text-3xl font-heading font-bold text-forest-600">
                    Favorite Birds
                  </h1>
                  <p className="text-earth-600 mt-1">
                    {favorites.length} {favorites.length === 1 ? 'species' : 'species'} saved
                  </p>
                </div>
                <Link href="/">
                  <Button variant="nature" size="sm">
                    <Search className="w-4 h-4" />
                    Find More Birds
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <Loader2 className="w-16 h-16 animate-spin text-sage-400" />
                  <Bird className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-forest-600" />
                </div>
                <p className="text-earth-600 text-xl mt-6 font-heading">Loading your favorites...</p>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((bird) => (
                  <Card 
                    key={bird.id}
                    variant="nature" 
                    className="overflow-hidden group hover:shadow-nature-xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-sage-50 to-sage-100">
                      <img
                        src={bird.imageUrl}
                        alt={bird.species_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {bird.imageAttribution && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>{bird.imageAttribution}</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveFavorite(bird.id)}
                        disabled={removing === bird.id}
                        className={`absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all duration-200 ${
                          removing === bird.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Remove from favorites"
                      >
                        {removing === bird.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-heading font-bold text-forest-600 line-clamp-1">
                        {bird.species_name}
                      </h3>
                      
                      {bird.scientific_name && (
                        <p className="text-sm italic text-earth-500 line-clamp-1">
                          {bird.scientific_name}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-earth-500">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-sage-100 rounded-full text-xs font-medium">
                          Code: {bird.species_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-earth-500">
                        <Calendar className="w-4 h-4 text-sage-400" />
                        <span>
                          Added {new Date(bird.added_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {bird.notes && (
                        <p className="text-sm text-earth-600 line-clamp-2 pt-2 border-t border-sage-100">
                          {bird.notes}
                        </p>
                      )}

                      <div className="pt-3 border-t border-sage-100">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-heading font-semibold bg-terracotta-100 text-terracotta-600">
                          <Heart className="w-3 h-3 fill-current" />
                          Favorited
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-block p-6 bg-sage-50 rounded-full mb-6">
                  <Heart className="w-16 h-16 text-sage-300" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-forest-600 mb-3">No Favorites Yet</h3>
                <p className="text-earth-500 text-lg mb-6">Start building your collection by favoriting birds from the search page</p>
                <Link href="/">
                  <Button variant="nature">
                    <Search className="w-5 h-5" />
                    <span>Explore Birds</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}