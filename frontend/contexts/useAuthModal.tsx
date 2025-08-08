'use client'

import { create } from 'zustand'

interface AuthModalStore {
  isOpen: boolean
  defaultTab: 'login' | 'register'
  openLogin: () => void
  openRegister: () => void
  close: () => void
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  defaultTab: 'login',
  openLogin: () => set({ isOpen: true, defaultTab: 'login' }),
  openRegister: () => set({ isOpen: true, defaultTab: 'register' }),
  close: () => set({ isOpen: false }),
}))