'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSettings, FiArrowLeft, FiBell, FiLock, FiEye, FiToggleRight, FiToggleLeft } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function DoctorSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    twoFactor: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 lg:ml-64 max-w-2xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        Kembali
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-xl"><FiSettings className="text-gray-600 w-6 h-6" /></div>
          Pengaturan
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-2">Kelola preferensi dan keamanan akun Anda</p>
      </div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiBell className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Notifikasi</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900">Notifikasi Email</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Terima update via email</p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className="text-3xl transition-all"
            >
              {settings.emailNotifications ? (
                <FiToggleRight className="text-primary w-6 h-6" />
              ) : (
                <FiToggleLeft className="text-gray-400 w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900">Notifikasi Push</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Notifikasi browser real-time</p>
            </div>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className="text-3xl transition-all"
            >
              {settings.pushNotifications ? (
                <FiToggleRight className="text-primary w-6 h-6" />
              ) : (
                <FiToggleLeft className="text-gray-400 w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <FiLock className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Keamanan</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiLock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Ubah Password</p>
                <p className="text-xs text-gray-500 font-medium mt-1">Perbarui password akun Anda</p>
              </div>
            </div>
            <div className="text-gray-400 hover:text-primary transition-colors">→</div>
          </button>

          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900">Autentikasi Dua Faktor</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Tambahan lapisan keamanan</p>
            </div>
            <button
              onClick={() => handleToggle('twoFactor')}
              className="text-3xl transition-all"
            >
              {settings.twoFactor ? (
                <FiToggleRight className="text-primary w-6 h-6" />
              ) : (
                <FiToggleLeft className="text-gray-400 w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preferences Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiEye className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Preferensi</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900">Mode Gelap</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Aktifkan tema gelap</p>
            </div>
            <button
              onClick={() => handleToggle('darkMode')}
              className="text-3xl transition-all"
            >
              {settings.darkMode ? (
                <FiToggleRight className="text-primary w-6 h-6" />
              ) : (
                <FiToggleLeft className="text-gray-400 w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl"
      >
        <p className="text-xs font-medium text-blue-700">
          💡 Pengaturan akan disimpan secara otomatis. Hubungi support jika ada masalah.
        </p>
      </motion.div>
    </div>
  )
}
