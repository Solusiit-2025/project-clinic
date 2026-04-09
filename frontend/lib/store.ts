import { create } from 'zustand'
import { User, Clinic } from './types'

interface AuthStore {
  user: User | null
  token: string | null
  activeClinicId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setActiveClinicId: (id: string | null) => void
  setIsLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  activeClinicId: typeof window !== 'undefined' ? localStorage.getItem('activeClinicId') : null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => {
    // If user has clinics and no activeClinicId is set, set the first one as default
    if (user?.clinics && user.clinics.length > 0 && !localStorage.getItem('activeClinicId')) {
      const defaultId = user.clinics[0].id
      localStorage.setItem('activeClinicId', defaultId)
      set({ user, isAuthenticated: !!user, activeClinicId: defaultId })
    } else {
      set({ user, isAuthenticated: !!user })
    }
  },
  
  setToken: (token) => set({ token }),
  
  setActiveClinicId: (id) => {
    if (id) {
      localStorage.setItem('activeClinicId', id)
    } else {
      localStorage.removeItem('activeClinicId')
    }
    set({ activeClinicId: id })
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('activeClinicId')
    }
    set({ user: null, token: null, activeClinicId: null, isAuthenticated: false })
  },
}))
