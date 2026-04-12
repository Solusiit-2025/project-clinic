'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    fetchSettings()
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            padding: '16px 24px',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid #f1f5f9',
            maxWidth: '450px',
            letterSpacing: '-0.01em',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      {children}
    </>
  )
}
