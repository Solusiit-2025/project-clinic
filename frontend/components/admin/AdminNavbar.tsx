'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSearch, FiBell, FiUser, FiChevronDown, FiMenu, FiLogOut, FiLock, FiUserCheck, FiSun, FiMoon } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ClinicSwitcher from './ClinicSwitcher'

interface AdminNavbarProps {
  onMobileMenuOpen?: () => void
}

export default function AdminNavbar({ onMobileMenuOpen }: AdminNavbarProps) {
  const user = useAuthStore(state => state.user)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const logout = useAuthStore(state => state.logout)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const clinics = user?.clinics || []
  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0]

  const getImageUrl = (path?: string) => {
    if (!path || path === 'null' || path === 'undefined') return null
    if (path.startsWith('http')) return path
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5004'
    const baseUrl = apiBase.split('/api')[0].replace(/\/$/, '')
    if (path.startsWith('/uploads/')) return `${baseUrl}${path}`
    return `${baseUrl}/uploads/${path.replace(/^\//, '')}`
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl transition-all"
          style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
        >
          <FiBell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="h-5 w-px hidden sm:block" style={{ backgroundColor: 'var(--border)' }} />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 group"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 relative overflow-hidden rounded-lg border transition-all flex items-center justify-center"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface-2)' }}
            >
              {user?.image ? (
                <img
                  src={getImageUrl(user.image) || ''}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget
                    t.onerror = null
                    t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0D8ABC&color=fff&bold=true`
                  }}
                />
              ) : (
                <FiUser className="w-3.5 h-3.5 text-primary" />
              )}
            </div>

            {/* Name + role — hidden on mobile */}
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {user?.name?.split(' ')[0] || 'Admin'}
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

                  <Link
                    href="/admin/profile?tab=security"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => setIsDropdownOpen(false)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <FiLock className="w-3.5 h-3.5" />
                    </div>
                    Ganti Password
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
