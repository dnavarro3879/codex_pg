'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  if (!mounted || !isOpen) return null

  const handleSuccess = () => {
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md my-8">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-sage-50 transition-colors z-[10000]"
          >
            <X className="w-4 h-4 text-forest-600" />
          </button>

          {activeTab === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setActiveTab('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setActiveTab('login')}
            />
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}