interface FlickrPhoto {
  id: string
  owner: string
  secret: string
  server: string
  farm: number
  title: string
  ispublic: number
  isfriend: number
  isfamily: number
  ownername?: string
}

interface FlickrSearchResponse {
  photos: {
    page: number
    pages: number
    perpage: number
    total: number
    photo: FlickrPhoto[]
  }
  stat: string
}

const FLICKR_API_KEY = process.env.NEXT_PUBLIC_FLICKR_API_KEY || ''
const FLICKR_API_URL = 'https://api.flickr.com/services/rest/'

// Cache multiple photos per species for variety
const photoCache = new Map<string, Array<{ url: string; attribution: string }>>()
const photoIndexMap = new Map<string, number>()

// High-quality bird photography fallbacks
const fallbackBirdImages = [
  { url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1555169062-013468b47731?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=600&h=400&fit=crop', attribution: 'Unsplash' },
]

function constructFlickrPhotoUrl(photo: FlickrPhoto, size: string = 'z'): string {
  // Size options: s=75x75, q=150x150, m=240, n=320, z=640, c=800, b=1024
  return `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_${size}.jpg`
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export async function getBirdPhoto(species: string): Promise<{ url: string; attribution: string }> {
  const cacheKey = species.toLowerCase()
  
  // Check if we have cached photos for this species
  if (photoCache.has(cacheKey)) {
    const cachedPhotos = photoCache.get(cacheKey)!
    const currentIndex = photoIndexMap.get(cacheKey) || 0
    const photo = cachedPhotos[currentIndex % cachedPhotos.length]
    
    // Rotate to next photo for next request
    photoIndexMap.set(cacheKey, (currentIndex + 1) % cachedPhotos.length)
    return photo
  }

  if (!FLICKR_API_KEY) {
    // Use deterministic fallback based on species name
    const index = hashString(species) % fallbackBirdImages.length
    return fallbackBirdImages[index]
  }

  try {
    // Search for bird photos on Flickr
    const params = new URLSearchParams({
      method: 'flickr.photos.search',
      api_key: FLICKR_API_KEY,
      format: 'json',
      nojsoncallback: '1',
      text: `"${species}" bird`,
      tags: 'bird,birds,wildlife,ornithology,birding,birdwatching',
      tag_mode: 'any',
      sort: 'relevance',
      per_page: '15',
      license: '1,2,3,4,5,6,7,8,9,10', // Creative Commons licenses
      content_type: '1', // Photos only
      media: 'photos',
      extras: 'owner_name',
      safe_search: '1'
    })

    const response = await fetch(`${FLICKR_API_URL}?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Flickr')
    }

    const data: FlickrSearchResponse = await response.json()
    
    if (data.stat === 'ok' && data.photos.photo.length > 0) {
      // Get up to 5 different photos for variety
      const photos = data.photos.photo.slice(0, 5).map(photo => ({
        url: constructFlickrPhotoUrl(photo, 'z'), // 640px wide
        attribution: photo.ownername || 'Flickr'
      }))
      
      photoCache.set(cacheKey, photos)
      photoIndexMap.set(cacheKey, 1) // Start at 1 since we're returning the first one
      return photos[0]
    }
    
    // If no exact match, try a broader search
    const broaderParams = new URLSearchParams({
      method: 'flickr.photos.search',
      api_key: FLICKR_API_KEY,
      format: 'json',
      nojsoncallback: '1',
      text: species.split(' ')[0] + ' bird', // Use just first word (genus)
      tags: 'bird,wildlife',
      tag_mode: 'any',
      sort: 'interestingness-desc',
      per_page: '10',
      license: '1,2,3,4,5,6,7,8,9,10',
      content_type: '1',
      media: 'photos',
      extras: 'owner_name',
      safe_search: '1'
    })

    const broaderResponse = await fetch(`${FLICKR_API_URL}?${broaderParams}`)
    const broaderData: FlickrSearchResponse = await broaderResponse.json()
    
    if (broaderData.stat === 'ok' && broaderData.photos.photo.length > 0) {
      const photos = broaderData.photos.photo.slice(0, 3).map(photo => ({
        url: constructFlickrPhotoUrl(photo, 'z'),
        attribution: photo.ownername || 'Flickr'
      }))
      
      photoCache.set(cacheKey, photos)
      photoIndexMap.set(cacheKey, 1)
      return photos[0]
    }
  } catch (error) {
    console.error('Error fetching bird photo from Flickr:', error)
  }

  // Deterministic fallback
  const index = hashString(species) % fallbackBirdImages.length
  const fallback = fallbackBirdImages[index]
  photoCache.set(cacheKey, [fallback])
  return fallback
}

export function preloadBirdPhotos(birdSpecies: string[]) {
  // Stagger requests to avoid rate limiting
  birdSpecies.forEach((species, index) => {
    setTimeout(() => {
      getBirdPhoto(species).catch(() => {})
    }, index * 100) // 100ms delay between requests
  })
}