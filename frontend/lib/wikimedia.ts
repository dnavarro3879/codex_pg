interface WikipediaPageImage {
  source: string
  width: number
  height: number
}

interface WikipediaPage {
  pageid: number
  title: string
  original?: WikipediaPageImage
  pageimage?: string
}

interface WikimediaImage {
  title: string
  url: string
  thumburl?: string
  descriptionurl: string
  extmetadata?: {
    Artist?: { value: string }
    Credit?: { value: string }
    LicenseShortName?: { value: string }
    ImageDescription?: { value: string }
  }
}

// Cache for bird photos
const photoCache = new Map<string, { url: string; attribution: string }>()

// Fallback images when API fails
const fallbackBirdImages = [
  { url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop', attribution: 'Unsplash' },
  { url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=600&h=400&fit=crop', attribution: 'Unsplash' },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get bird photo from Wikipedia page (most accurate method)
 */
async function getWikipediaPageImage(birdName: string): Promise<{ url: string; attribution: string } | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'pageimages',
      piprop: 'original',
      titles: birdName,
      format: 'json',
      formatversion: '2',
      origin: '*'
    })

    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
    
    if (!response.ok) {
      throw new Error('Wikipedia API request failed')
    }

    const data = await response.json()
    
    if (data.query?.pages?.length > 0) {
      const page: WikipediaPage = data.query.pages[0]
      
      if (page.original?.source) {
        return {
          url: page.original.source,
          attribution: 'Wikipedia'
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Wikipedia page image:', error)
  }
  
  return null
}

/**
 * Search Wikimedia Commons for bird images (fallback method)
 */
async function searchWikimediaCommons(birdName: string): Promise<{ url: string; attribution: string } | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${birdName} bird`,
      gsrnamespace: '6', // File namespace
      gsrlimit: '5',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '800',
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName',
      format: 'json',
      origin: '*'
    })

    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`)
    
    if (!response.ok) {
      throw new Error('Wikimedia Commons API request failed')
    }

    const data = await response.json()
    
    if (data.query?.pages) {
      // Convert pages object to array and find first valid image
      const pages = Object.values(data.query.pages) as any[]
      
      for (const page of pages) {
        if (page.imageinfo?.[0]) {
          const imageInfo = page.imageinfo[0]
          const metadata = imageInfo.extmetadata || {}
          
          // Get attribution from metadata
          let attribution = 'Wikimedia Commons'
          if (metadata.Artist?.value) {
            // Clean HTML from artist field
            attribution = metadata.Artist.value.replace(/<[^>]*>/g, '').trim()
          } else if (metadata.Credit?.value) {
            attribution = metadata.Credit.value.replace(/<[^>]*>/g, '').trim()
          }
          
          return {
            url: imageInfo.thumburl || imageInfo.url,
            attribution: attribution.substring(0, 50) // Limit attribution length
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching Wikimedia Commons:', error)
  }
  
  return null
}

/**
 * Main function to get bird photo from Wikimedia sources
 */
export async function getBirdPhotoFromWikimedia(birdName: string): Promise<{ url: string; attribution: string }> {
  const cacheKey = birdName.toLowerCase()
  
  // Check cache first
  if (photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey)!
  }

  // Try Wikipedia page image first (most accurate)
  let result = await getWikipediaPageImage(birdName)
  
  // If no Wikipedia page image, try Commons search
  if (!result) {
    result = await searchWikimediaCommons(birdName)
  }
  
  // If still no result, try with just the genus (first word)
  if (!result && birdName.includes(' ')) {
    const genus = birdName.split(' ')[0]
    result = await searchWikimediaCommons(`${genus} bird`)
  }
  
  // Final fallback to static images
  if (!result) {
    const index = hashString(birdName) % fallbackBirdImages.length
    result = fallbackBirdImages[index]
  }
  
  // Cache the result
  photoCache.set(cacheKey, result)
  
  return result
}

/**
 * Preload multiple bird photos (with rate limiting)
 */
export function preloadWikimediaBirdPhotos(birdNames: string[]) {
  birdNames.forEach((name, index) => {
    setTimeout(() => {
      getBirdPhotoFromWikimedia(name).catch(() => {})
    }, index * 200) // 200ms delay between requests to be respectful
  })
}