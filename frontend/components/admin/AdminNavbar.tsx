'use client'

import { useState, useRef, useEffect } from 'react'
import { FiSearch, FiBell, FiUser, FiChevronDown, FiMenu, FiLogOut, FiLock, FiUserCheck, FiSun, FiMoon } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useThemeStore } from '@/lib/store/useThemeStore'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ClinicSwitcher from './ClinicSwitcher'

export default function AdminNavbar() {
  const user = useAuthStore(state => state.user)
  const activeClinicId = useAuthStore(state => state.activeClinicId)
  const logout = useAuthStore(state => state.logout)
  const { theme, toggleTheme } = useThemeStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const clinics = user?.clinics || []
  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0]

  const getImageUrl = (path?: string) => {
    if (!path || path === "null" || path === "undefined") return null
    if (path.startsWith('http')) return path
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5004'
    const baseUrl = apiBase.split('/api')[0].replace(/\/$/, '')
    if (path.startsWith('/uploads/')) return `${baseUrl}${path}`
    const cleanPath = path.replace(/^\//, '')
    return `${baseUrl}/uploads/${cleanPath}`
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
    <header className="h-12 backdrop-blur-md border-b flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm"
      style={{
        backgroundColor: 'var(--navbar-bg)',
        borderColor: 'var(--navbar-border)',
      }}
    >
      {/* Left: Search & Active Branch */}
      <div className="flex items-center gap-4">
        <div className="relative hidden xl:block">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className="w-48 pl-8 pr-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all text-[10px] font-medium placeholder:opacity-50"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-secondary)',
            }}
          />
        </div>

        {activeClinic && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-default transition-all"
            style={{
              backgroundColor: 'rgba(14,165,233,0.07)',
              border: '1px solid rgba(14,165,233,0.12)',
            }}
          >
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Cabang:</span>
              <span className="text-[10px] font-extrabold text-primary tracking-tight">{activeClinic.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <button
          className="p-1.5 rounded-lg hover:bg-primary/10 transition-all text-primary"
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
        >
          <FiMenu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Theme Toggle + Notifications + Profile */}
      <div className="flex items-center gap-2">

        {/* Notification Bell */}
        <button
          className="relative p-1.5 rounded-lg transition-all hover:text-primary"
          style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
        >
          <FiBell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border-2" style={{ borderColor: 'var(--bg-surface)' }} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-1.5 rounded-lg transition-all overflow-hidden group"
          style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <FiSun className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-500" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <FiMoon className="w-3.5 h-3.5 group-hover:text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Divider */}
        <div className="h-5 w-px" style={{ backgroundColor: 'var(--border)' }} />

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-7 h-7 relative overflow-hidden rounded-lg border transition-all bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shadow-sm"
              style={{ borderColor: 'rgba(14,165,233,0.15)' }}
            >
              {user?.image ? (
                <img
                  src={getImageUrl(user.image) || ''}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.onerror = null
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&bold=true`
                  }}
                />
              ) : (
                <FiUser className="w-3 h-3 text-primary" />
              )}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-black uppercase group-hover:text-primary transition-colors leading-none" style={{ color: 'var(--text-primary)' }}>
                {user?.name?.split(' ')[0] || 'Admin'}
              </p>
              <p className="text-[8px] font-bold tracking-widest mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {user?.role || 'SYSTEM'}
              </p>
            </div>

            <FiChevronDown className={`w-3 h-3 group-hover:text-primary transition-all duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-faint)' }} />
          </div>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                }}
              >
                {/* User info header */}
                <div className="px-4 py-3 mb-1 border-b" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Masuk sebagai</p>
                  <p className="text-sm font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{user?.role}</p>
                </div>

                <div className="flex flex-col px-2">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all group hover:bg-primary/5 hover:text-primary"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors group-hover:bg-primary/10" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <FiUserCheck className="w-3.5 h-3.5" />
                    </div>
                    Profil Saya
                  </Link>

                  <Link
                    href="/admin/profile?tab=security"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all group hover:bg-primary/5 hover:text-primary"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors group-hover:bg-primary/10" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                      <FiLock className="w-3.5 h-3.5" />
                    </div>
                    Ganti Password
                  </Link>

                  {/* Theme Toggle Row */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group hover:bg-primary/5"
                    onClick={() => { toggleTheme(); setIsDropdownOpen(false) }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                        {theme === 'dark'
                          ? <FiSun className="w-3.5 h-3.5 text-amber-400" />
                          : <FiMoon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        }
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                      </span>
                    </div>

                    {/* Toggle pill */}
                    <div
                      className="relative w-9 h-5 rounded-full transition-all duration-300"
                      style={{ backgroundColor: theme === 'dark' ? '#0ea5e9' : 'var(--bg-surface-3)' }}
                    >
                      <motion.div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                        animate={{ x: theme === 'dark' ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>

                  <div className="h-px my-1.5 mx-3" style={{ backgroundColor: 'var(--border)' }} />

                  <button
                    onClick={() => { setIsDropdownOpen(false); logout() }}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 flex items-center justify-center transition-colors text-red-500">
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
