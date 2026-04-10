'use client'

import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { FiUser, FiSettings, FiLogOut, FiClock } from 'react-icons/fi'
import { useState, useEffect } from 'react'

export default function DoctorNavbar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm lg:left-64">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Greeting */}
        <div className="flex-1">
          <h2 className="text-lg font-black text-gray-900">
            Selamat Datang, Dr. {user?.name?.split(' ')[0] || 'Dokter'}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
            <FiClock className="w-3.5 h-3.5" />
            {currentTime}
          </p>
        </div>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.[0] || 'D'}
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-gray-900">{user?.name || 'Doctor'}</span>
              <span className="text-[9px] text-gray-500 font-medium">DOCTOR</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-black text-gray-900 uppercase tracking-wide">{user?.name}</p>
                <p className="text-[9px] text-gray-500 mt-1">{user?.email}</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    router.push('/doctor/profile')
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  <FiUser className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    router.push('/doctor/settings')
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  <FiSettings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="py-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleLogout()
                    setDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all font-medium"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
