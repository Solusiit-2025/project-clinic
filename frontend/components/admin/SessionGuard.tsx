'use client'

/**
 * SessionGuard — mounts inside the admin layout.
 * Periodically pings /auth/me to detect session expiry proactively,
 * and shows a warning banner 2 minutes before the access token expires.
 *
 * Access token lifetime: 15 minutes
 * Warning shown at: 13 minutes (2 min before expiry)
 * Check interval: 60 seconds
 */

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { FiAlertCircle, FiRefreshCw, FiLogOut } from 'react-icons/fi'
import api from '@/lib/api'

const ACCESS_TOKEN_MINUTES = 15
const WARNING_BEFORE_MINUTES = 2
const CHECK_INTERVAL_MS = 60 * 1000 // 1 minute

export default function SessionGuard() {
  const { logout, checkAuth } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(WARNING_BEFORE_MINUTES * 60)
  const [extending, setExtending] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track user activity to reset inactivity timer
  useEffect(() => {
    const updateActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('click', updateActivity)
    return () => {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
    }
  }, [])

  // Periodic session check
  useEffect(() => {
    warningTimerRef.current = setInterval(async () => {
      try {
        await api.get('auth/me')
        // Session still valid — hide warning if showing
        setShowWarning(false)
      } catch (err: any) {
        const code = err?.response?.data?.code
        if (code === 'TOKEN_EXPIRED') {
          // api.ts interceptor will auto-refresh — if it fails, forceLogout is called
          // If we reach here, refresh succeeded — no warning needed
          setShowWarning(false)
        }
        // Other errors (SESSION_EXPIRED) are handled by api.ts → forceLogout
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current)
    }
  }, [])

  // Countdown timer when warning is shown
  useEffect(() => {
    if (showWarning) {
      setCountdown(WARNING_BEFORE_MINUTES * 60)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [showWarning, logout])

  const handleExtend = async () => {
    setExtending(true)
    try {
      // Calling /auth/me will trigger auto-refresh via api.ts interceptor if needed
      await checkAuth()
      setShowWarning(false)
    } catch {
      logout()
    } finally {
      setExtending(false)
    }
  }

  if (!showWarning) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 flex items-center gap-3 border-b border-amber-100">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiAlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Sesi Hampir Berakhir</p>
            <p className="text-[10px] text-amber-600 font-medium">
              Otomatis logout dalam{' '}
              <span className="font-black text-amber-700">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </p>
          </div>
        </div>
        <div className="px-4 py-3 flex gap-2">
          <button
            onClick={handleExtend}
            disabled={extending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${extending ? 'animate-spin' : ''}`} />
            Perpanjang Sesi
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
