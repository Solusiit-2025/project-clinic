'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useThemeStore, applyTheme, getSystemTheme } from '@/lib/store/useThemeStore'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    fetchSettings()
    checkAuth()

    // Init theme: check localStorage first, fall back to OS preference
    const stored = localStorage.getItem('clinic-theme')
    let parsed: string | null = null
    try {
      parsed = stored ? JSON.parse(stored)?.state?.theme : null
    } catch {
      parsed = null
    }

    if (parsed === 'light' || parsed === 'dark') {
      setTheme(parsed)
    } else {
      // No stored preference → default to light
      setTheme('light')
    }

    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Always keep DOM in sync with store
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          className: '',
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            padding: '16px 24px',
            borderRadius: '18px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid var(--border)',
            maxWidth: '450px',
            letterSpacing: '-0.01em',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />
      {children}
    </>
  )
}
