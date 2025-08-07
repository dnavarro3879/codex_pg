import { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 border rounded bg-white shadow-sm ${className}`}>{children}</div>
}
