import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'glass' | 'nature'
  hover?: boolean
}

export function Card({ children, className = '', variant = 'default', hover = false }: CardProps) {
  const variantClasses = {
    default: 'bg-white shadow-nature hover:shadow-nature-lg border border-sage-100',
    elevated: 'bg-white shadow-nature-xl hover:shadow-2xl border border-sage-100',
    bordered: 'bg-white border-2 border-sage-300 hover:border-forest-400',
    glass: 'glass-effect shadow-nature hover:shadow-nature-lg',
    nature: 'bg-gradient-to-br from-cream-50 to-sage-50 shadow-nature hover:shadow-nature-lg border border-sage-200'
  }

  const hoverClass = hover ? 'hover-lift' : ''

  return (
    <div className={`p-6 rounded-2xl transition-all duration-300 ${variantClasses[variant]} ${hoverClass} ${className}`}>
      {children}
    </div>
  )
}
