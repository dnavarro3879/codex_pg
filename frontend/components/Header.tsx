'use client'

import { Bird, Map, User, Menu, X, LogOut, Heart } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './auth/AuthModal'
import { useAuthModal } from '../contexts/useAuthModal'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const authModal = useAuthModal()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-forest-100 rounded-xl">
              <Bird className="w-6 h-6 text-forest-600" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-forest-600">BirdSpotter</h1>
              <p className="text-xs text-earth-500">Discover Rare Birds</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`flex items-center gap-2 transition-colors font-heading font-medium ${
                pathname === '/' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Explore</span>
            </Link>
            <Link 
              href="/find-species" 
              className={`flex items-center gap-2 transition-colors font-heading font-medium ${
                pathname === '/find-species' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
              }`}
            >
              <Bird className="w-4 h-4" />
              <span>Find Species</span>
            </Link>
            {user && (
              <>
                <Link 
                  href="/favorites" 
                  className={`flex items-center gap-2 transition-colors font-heading font-medium ${
                    pathname === '/favorites' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-100 rounded-lg">
                  <User className="w-3.5 h-3.5 text-forest-600" />
                  <span className="text-sm font-medium text-forest-600">{user.username}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="text-earth-600 hover:text-terracotta-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={authModal.openLogin}
                >
                  Sign In
                </Button>
                <Button 
                  variant="nature" 
                  size="sm"
                  onClick={authModal.openRegister}
                >
                  Register
                </Button>
              </div>
            )}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-sage-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-forest-600" />
            ) : (
              <Menu className="w-6 h-6 text-forest-600" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-sage-200 animate-slide-up">
            <div className="flex flex-col gap-3">
              <Link 
                href="/" 
                className={`flex items-center gap-2 transition-colors font-heading font-medium py-2 ${
                  pathname === '/' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Map className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              <Link 
                href="/find-species" 
                className={`flex items-center gap-2 transition-colors font-heading font-medium py-2 ${
                  pathname === '/find-species' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bird className="w-4 h-4" />
                <span>Find Species</span>
              </Link>
              {user && (
                <>
                  <Link 
                    href="/favorites" 
                    className={`flex items-center gap-2 transition-colors font-heading font-medium py-2 ${
                      pathname === '/favorites' ? 'text-forest-600' : 'text-earth-600 hover:text-forest-600'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Favorites</span>
                  </Link>
                  <div className="pt-2 pb-1 px-3 bg-sage-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-forest-600" />
                      <span className="text-sm font-medium text-forest-600">{user.username}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-earth-600 hover:text-terracotta-500"
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </>
              )}
              {!user && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      authModal.openLogin()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="nature" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      authModal.openRegister()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultTab={authModal.defaultTab}
      />
    </header>
  )
}