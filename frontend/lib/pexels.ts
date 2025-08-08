interface PexelsPhoto {
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
  photographer: string
  photographer_url: string
}

interface PexelsResponse {
  photos: PexelsPhoto[]
  total_results: number
  page: number
  per_page: number
}

const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || ''
const PEXELS_API_URL = 'https://api.pexels.com/v1'

const photoCache = new Map<string, string>()

const fallbackBirdImages = [
  'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=400&h=300&fit=crop',
]

export async function getBirdPhoto(species: string): Promise<string> {
  const cacheKey = species.toLowerCase()
  
  if (photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey)!
  }

  if (!PEXELS_API_KEY) {
    const fallback = fallbackBirdImages[Math.floor(Math.random() * fallbackBirdImages.length)]
    photoCache.set(cacheKey, fallback)
    return fallback
  }

  try {
    const searchQuery = `${species} bird wildlife`
    const response = await fetch(
      `${PEXELS_API_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch from Pexels')
    }

    const data: PexelsResponse = await response.json()
    
    if (data.photos && data.photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, data.photos.length))
      const photoUrl = data.photos[randomIndex].src.medium
      photoCache.set(cacheKey, photoUrl)
      return photoUrl
    }
  } catch (error) {
    console.error('Error fetching bird photo:', error)
  }

  const fallback = fallbackBirdImages[Math.floor(Math.random() * fallbackBirdImages.length)]
  photoCache.set(cacheKey, fallback)
  return fallback
}

export function preloadBirdPhotos(birdSpecies: string[]) {
  birdSpecies.forEach(species => {
    getBirdPhoto(species).catch(() => {})
  })
}