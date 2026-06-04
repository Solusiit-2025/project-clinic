'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FiSearch, FiBell, FiUser, FiChevronDown, FiMenu, FiLogOut, FiLock, FiUserCheck, FiSun, FiMoon } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useThemeStore } from '@/lib/store/useThemeStore'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ClinicSwitcher from './ClinicSwitcher'
import api from '@/lib/api'
import { socket, connectSocket } from '@/lib/socket'

interface AdminNavbarProps {
  onMobileMenuOpen?: () => void
}

export default function AdminNavbar({ onMobileMenuOpen }: AdminNavbarProps) {
  const user = useAuthStore(state => state.user)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const logout = useAuthStore(state => state.logout)
  const { theme, toggleTheme } = useThemeStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const clinics = user?.clinics || []
  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0]

  // Preloaded audio from backend static file
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Build the backend base URL (strip /api from API URL)
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5006')
      .replace(/\/api\/?$/, '')
    const soundUrl = `${backendBase}/uploads/sound/sound-notification.mp3`
    const audio = new Audio(soundUrl)
    audio.preload = 'auto'
    audio.volume = 0.8
    audioRef.current = audio

    return () => {
      audioRef.current = null
    }
  }, [])

  // Play notification sound from MP3 file
  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          // Browser blocked autoplay — retry after a short delay
          // (will work after user interaction)
        })
      }
    } catch (e) {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications and connect socket when clinic/user changes
  useEffect(() => {
    if (!activeClinicId || !user) return

    // Fetch initial notifications (role-filtered)
    const fetchNotifications = async () => {
      try {
        // SUPER_ADMIN & ADMIN fetch ALL notifications; other roles fetch only their own
        const isAdminRole = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
        const res = await api.get('notifications', {
          headers: { 'x-clinic-id': activeClinicId },
          params: isAdminRole ? {} : { role: user.role }
        })
        setNotifications(res.data)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      }
    }
    fetchNotifications()

    // Ensure socket is connected and joined to this clinic room
    connectSocket(activeClinicId)

    // Admin/SuperAdmin sees ALL notifications; other roles see only their own
    const isAdminRole = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'

    // Socket listener for real-time notifications
    const handleNewNotification = (notif: any) => {
      // SUPER_ADMIN & ADMIN see everything; others only see their targetRole
      const shouldShow = isAdminRole
        ? true
        : (!notif.targetRole || notif.targetRole === user?.role)
      if (shouldShow) {
        setNotifications(prev => [notif, ...prev].slice(0, 50))
        playNotificationSound()
      }
    }

    socket.on('new-notification', handleNewNotification)

    return () => {
      socket.off('new-notification', handleNewNotification)
    }
  }, [activeClinicId, user, playNotificationSound])

  return (
    <header
      className="h-11 sm:h-12 backdrop-blur-md border-b flex items-center justify-between px-2 sm:px-3 sticky top-0 z-40 shadow-sm"
      style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--navbar-border)' }}
    >
      {/* Left: Hamburger (mobile) + Search + Branch */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger — triggers sidebar drawer */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg transition-all active:scale-95 flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}
          aria-label="Buka menu"
        >
          <FiMenu className="w-4 h-4" />
        </button>

        {/* Search — only on xl+ */}
        <div className="relative hidden xl:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className="w-48 pl-8 pr-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all text-[10px] font-medium placeholder:opacity-50"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Active branch badge */}
        {activeClinic && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-default transition-all min-w-0"
            style={{ backgroundColor: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.12)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <span className="text-[10px] font-extrabold text-primary tracking-tight truncate max-w-[120px] sm:max-w-[160px]">
              {activeClinic.name}
            </span>
          </div>
        )}
      </div>

      {/* Right: Notifications + Theme Toggle + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl transition-all hover:rotate-[15deg] active:scale-90"
          style={{ 
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(14,165,233,0.05)', 
            color: theme === 'dark' ? '#fbbf24' : '#0ea5e9',
            border: theme === 'dark' ? '1px solid rgba(251,191,36,0.1)' : '1px solid rgba(14,165,233,0.1)'
          }}
          title={theme === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl transition-all"
            style={{
              backgroundColor: notifications.filter(n => !n.isRead).length > 0
                ? 'rgba(239,68,68,0.08)'
                : 'var(--bg-surface-2)',
              color: notifications.filter(n => !n.isRead).length > 0
                ? '#ef4444'
                : 'var(--text-muted)',
              boxShadow: notifications.filter(n => !n.isRead).length > 0
                ? '0 0 0 1px rgba(239,68,68,0.25)'
                : 'none'
            }}
          >
            <FiBell className="w-4 h-4" />

            {/* Blinking dot badge with ping + count */}
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                {/* Ping outer ring */}
                <span
                  className="absolute inline-flex rounded-full opacity-75 animate-ping"
                  style={{
                    width: '14px',
                    height: '14px',
                    backgroundColor: '#ef4444',
                  }}
                />
                {/* Inner solid dot with count */}
                <span
                  className="relative inline-flex items-center justify-center rounded-full font-black text-white"
                  style={{
                    minWidth: notifications.filter(n => !n.isRead).length > 9 ? '18px' : '14px',
                    height: '14px',
                    fontSize: '8px',
                    backgroundColor: '#dc2626',
                    boxShadow: '0 0 0 2px white, 0 0 8px rgba(220,38,38,0.6)',
                    paddingInline: notifications.filter(n => !n.isRead).length > 9 ? '3px' : '0',
                  }}
                >
                  {notifications.filter(n => !n.isRead).length > 99
                    ? '99+'
                    : notifications.filter(n => !n.isRead).length}
                </span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', maxHeight: '400px' }}
              >
                <div className="px-4 py-2.5 border-b flex justify-between items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Notifikasi
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <button
                        onClick={async () => {
                          await api.put('notifications/read-all', {}, { headers: { 'x-clinic-id': activeClinicId } })
                          setNotifications(notifications.map(n => ({...n, isRead: true})))
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold whitespace-nowrap"
                      >
                        Tandai dibaca
                      </button>
                    )}
                    {notifications.filter(n => n.isRead).length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.filter(n => !n.isRead))
                        }}
                        title="Sembunyikan notifikasi yang sudah dibaca"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-all whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs p-4" style={{ color: 'var(--text-faint)' }}>Belum ada notifikasi.</p>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={async () => {
                          if (!n.isRead) {
                            await api.put(`notifications/${n.id}/read`)
                            setNotifications(notifications.map(x => x.id === n.id ? {...x, isRead: true} : x))
                          }
                          setIsNotifOpen(false)
                          if (n.type === 'NEW_PRESCRIPTION') router.push('/admin/transactions/pharmacy')
                          if (n.type === 'NEW_LAB_ORDER') router.push('/admin/lab/input')
                          if (n.type === 'NEW_INVOICE') router.push('/admin/finance')
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${!n.isRead ? 'bg-primary/5 border-primary/20' : 'hover:bg-gray-50 dark:hover:bg-white/5 border-transparent'}`}
                      >
                        <p className={`text-xs font-bold ${!n.isRead ? 'text-primary' : ''}`} style={{ color: n.isRead ? 'var(--text-primary)' : undefined }}>
                          {n.title}
                        </p>
                        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                          {n.message}
                        </p>
                        <p className="text-[9px] mt-1.5 font-medium opacity-50" style={{ color: 'var(--text-faint)' }}>
                          {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-5 w-px hidden sm:block" style={{ backgroundColor: 'var(--border)' }} />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 relative overflow-hidden rounded-lg border transition-all flex items-center justify-center shadow-sm"
              style={{ 
                borderColor: 'rgba(255,255,255,0.1)', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #0ea5e9 100%)' 
              }}
            >
              {user?.image ? (
                <img 
                  src={user.image.startsWith('http') ? user.image : `${api.defaults.baseURL?.replace('/api/', '') || ''}${user.image}`} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] sm:text-xs font-black text-white uppercase tracking-tighter">
                  {user?.name?.toLowerCase().startsWith('dr') && user?.name?.split(' ').length > 1
                    ? user?.name?.split(' ')[1]?.charAt(0)
                    : user?.name?.charAt(0) || 'U'}
                </span>
              )}
              {/* Subtle glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
            </div>

            {/* Name + role — hidden on mobile */}
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {user?.name?.toLowerCase().startsWith('dr') && user?.name?.split(' ').length > 1
                  ? user?.name?.split(' ').slice(0, 2).join(' ')
                  : user?.name?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-tight" style={{ color: 'var(--text-faint)' }}>
                {user?.role}
              </p>
            </div>

            <FiChevronDown
              className={`w-3 h-3 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-faint)' }}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border py-2 z-50 overflow-hidden"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                {/* Profile summary */}
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Masuk sebagai</p>
                  <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{user?.role}</p>
                </div>

                <div className="px-2 pt-1">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => setIsDropdownOpen(false)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <FiUserCheck className="w-3.5 h-3.5" />
                    </div>
                    Profil Saya
                  </Link>

                  <div className="h-px my-1.5 mx-2" style={{ backgroundColor: 'var(--border)' }} />

                  <button
                    onClick={() => { setIsDropdownOpen(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                      <FiLogOut className="w-3.5 h-3.5" />
                    </div>
                    Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
