'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { useAuthStore } from '@/lib/store/useAuthStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    fetchSettings()
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
