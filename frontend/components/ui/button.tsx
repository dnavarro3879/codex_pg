import { ButtonHTMLAttributes } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 ${className}`}
      {...props}
    />
  )
}
