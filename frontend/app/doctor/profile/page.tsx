'use client'

import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiPhone, FiBriefcase, FiCalendar, FiArrowLeft } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function DoctorProfile() {
  const { user } = useAuthStore()
  const router = useRouter()

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
          <div className="p-2 bg-indigo-100 rounded-xl"><FiUser className="text-indigo-600 w-6 h-6" /></div>
          Profile Dokter
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-2">Lihat informasi profil Anda</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {user?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-4">{user?.name || 'Doctor'}</h2>
          <p className="text-sm font-bold text-primary mt-1 uppercase tracking-widest">DOCTOR</p>
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FiMail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
              <p className="font-bold text-gray-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Role</p>
              <p className="font-bold text-gray-900 capitalize">{user?.role === 'DOCTOR' ? 'Dokter' : user?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Member Sejak</p>
              <p className="font-bold text-gray-900">
                {user && (user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString('id-ID') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
          <p className="text-xs font-medium text-blue-700">
            💡 Untuk mengubah informasi profil, silakan hubungi Administrator.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
