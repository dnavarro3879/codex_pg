import { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="p-4 border rounded bg-white shadow-sm">{children}</div>
}
