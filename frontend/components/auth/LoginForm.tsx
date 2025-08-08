'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await login(data.email, data.password)
      onSuccess?.()
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card variant="glass" className="p-6 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold text-forest-600 mb-2">Welcome Back</h2>
        <p className="text-earth-500 text-sm">Sign in to track your rare bird sightings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-terracotta-500" />
            <span className="text-sm text-terracotta-600">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-forest-600 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4" />
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-terracotta-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-forest-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4" />
            <input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-sage-300 bg-white/90 focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition-all placeholder-earth-400 text-forest-700"
              disabled={isLoading}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-terracotta-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="nature"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-earth-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-forest-600 hover:text-forest-700 font-medium transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </form>
    </Card>
  )
}