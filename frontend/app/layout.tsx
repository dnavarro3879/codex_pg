import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-cream-100 text-earth-600 min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
