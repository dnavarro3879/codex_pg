import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Create axios instance with interceptors
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = Cookies.get('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          
          const { access_token, refresh_token: newRefreshToken } = response.data
          Cookies.set('access_token', access_token, { expires: 1/96 }) // 15 minutes
          Cookies.set('refresh_token', newRefreshToken, { expires: 7 }) // 7 days
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        // Don't redirect here as it might be called from various places
      }
    }
    
    return Promise.reject(error)
  }
)

// Bird API functions
export const birdAPI = {
  getRareBirds: async (lat: number, lng: number, radius: number = 25) => {
    const response = await api.get('/birds/rare', {
      params: { lat, lng, radius }
    })
    return response.data
  },
}

// Auth API functions
export const authAPI = {
  addFavorite: async (species_name: string, species_code: string, scientific_name?: string, notes?: string) => {
    const response = await api.post('/auth/favorites', {
      species_name,
      species_code,
      scientific_name,
      notes
    })
    return response.data
  },

  getFavorites: async () => {
    const response = await api.get('/auth/favorites')
    return response.data
  },

  checkFavorite: async (species_code: string) => {
    const response = await api.get(`/auth/favorites/check/${species_code}`)
    return response.data
  },

  removeFavorite: async (favoriteId: number) => {
    await api.delete(`/auth/favorites/${favoriteId}`)
  },

  getSearchHistory: async (limit: number = 20) => {
    const response = await api.get('/auth/searches', {
      params: { limit }
    })
    return response.data
  },
}