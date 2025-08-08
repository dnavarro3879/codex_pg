import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'nature'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className = '', variant = 'default', size = 'md', ...props }: Props) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    default: 'bg-forest-500 text-cream-100 hover:bg-forest-600 shadow-nature hover:shadow-nature-lg transform hover:-translate-y-0.5 font-heading font-medium',
    secondary: 'bg-sage-400 text-white hover:bg-sage-500 shadow-nature hover:shadow-nature-lg transform hover:-translate-y-0.5 font-heading font-medium',
    outline: 'border-2 border-forest-500 hover:border-forest-600 hover:bg-forest-50 text-forest-600 hover:text-forest-700 font-heading font-medium',
    ghost: 'hover:bg-sage-100 text-forest-600 hover:text-forest-700 font-heading font-medium',
    nature: 'bg-gradient-to-r from-sage-400 to-forest-500 text-white hover:from-sage-500 hover:to-forest-600 shadow-nature-lg hover:shadow-nature-xl transform hover:-translate-y-1 font-heading font-semibold'
  }

  const baseClass = `${sizeClasses[size]} ${variantClasses[variant]} rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-2 focus:ring-offset-cream-100 inline-flex items-center justify-center gap-2`
  
  return <button className={`${baseClass} ${className}`} {...props} />
}
