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
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </>
  )
}
