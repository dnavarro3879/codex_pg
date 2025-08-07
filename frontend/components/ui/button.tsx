import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
}

export function Button({ className = '', variant = 'default', ...props }: Props) {
  const baseClass =
    variant === 'outline'
      ? 'px-3 py-2 rounded border hover:bg-gray-50'
      : 'px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-800'
  return <button className={`${baseClass} ${className}`} {...props} />
}
