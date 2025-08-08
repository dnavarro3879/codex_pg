'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'

interface User {
  id: number
  email: string
  username: string
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Create axios instance with interceptors
const api = axios.create({
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
        window.location.href = '/'
      }
    }
    
    return Promise.reject(error)
  }
)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = Cookies.get('access_token')
      if (token) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          // Token is invalid, remove it
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email) // OAuth2PasswordRequestForm expects 'username'
    formData.append('password', password)
    
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    const { access_token, refresh_token } = response.data
    
    // Store tokens in cookies
    Cookies.set('access_token', access_token, { expires: 1/96 }) // 15 minutes
    Cookies.set('refresh_token', refresh_token, { expires: 7 }) // 7 days
    
    // Get user data
    const userResponse = await api.get('/auth/me')
    setUser(userResponse.data)
  }

  const register = async (email: string, username: string, password: string) => {
    await axios.post(`${API_URL}/auth/register`, {
      email,
      username,
      password,
    })
    
    // Auto-login after registration
    await login(email, password)
  }

  const logout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
  }

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refresh_token')
    if (!refreshToken) throw new Error('No refresh token')
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    
    const { access_token, refresh_token: newRefreshToken } = response.data
    Cookies.set('access_token', access_token, { expires: 1/96 })
    Cookies.set('refresh_token', newRefreshToken, { expires: 7 })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export the api instance for use in other components
export { api }