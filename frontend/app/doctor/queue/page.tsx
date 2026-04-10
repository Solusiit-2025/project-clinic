'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, FiArrowRight, 
  FiRefreshCw, FiAlertCircle, FiEdit3, FiClipboard, FiSearch, FiHome
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'

const API_TRANSACTIONS = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'

interface Queue {
  id: string
  patientId: string
  clinicId: string
  doctorId: string | null
  registrationId: string | null
  queueNo: string
  status: 'waiting' | 'called' | 'triage' | 'ready' | 'ongoing' | 'completed' | 'no-show'
  patient: { name: string; medicalRecordNo: string; gender: string }
  doctor: { name: string; specialization: string } | null
  department: { name: string } | null
  hasMedicalRecord: boolean
}

export default function DoctorQueue() {
  const router = useRouter()
  const { user, token, activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [allQueues, setAllQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed'>('ongoing')

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchQueues = useCallback(async () => {
    if (!token || !activeClinicId) return
    try {
      const { data } = await axios.get(`${API_TRANSACTIONS}/queues`, { 
        headers, 
        params: { clinicId: activeClinicId } 
      })
      setAllQueues(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, activeClinicId, headers])

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 30000)
    return () => clearInterval(interval)
  }, [fetchQueues])

  // Filter queues based on search, status and filter
  const filteredQueues = useMemo(() => {
    let filtered = allQueues

    if (filter === 'ongoing') {
      filtered = filtered.filter(q => q.status === 'ongoing')
    } else if (filter === 'completed') {
      filtered = filtered.filter(q => q.status === 'completed')
    }

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.queueNo.includes(searchTerm) ||
        q.patient.medicalRecordNo.includes(searchTerm)
      )
    }

    return filtered
  }, [allQueues, searchTerm, filter])

  // Stats
  const stats = {
    waiting: allQueues.filter(q => q.status === 'waiting' || q.status === 'called').length,
    ready: allQueues.filter(q => q.status === 'ready').length,
    ongoing: allQueues.filter(q => q.status === 'ongoing').length,
    completed: allQueues.filter(q => q.status === 'completed').length,
  }

  return (
    <div className="space-y-6 lg:ml-64">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl"><FiClock className="text-blue-600 w-6 h-6" /></div>
            Antrian Pasien
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Kelola antrian dan konsultasi medis Anda</p>
        </div>
        <button 
          onClick={fetchQueues} 
          className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm self-start"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 mb-3">
            <FiClock className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Menunggu</p>
          <p className="text-3xl font-black text-gray-900">{stats.waiting}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Siap Diperiksa</p>
          <p className="text-3xl font-black text-gray-900">{stats.ready}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
            <FiActivity className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sedang Diperiksa</p>
          <p className="text-3xl font-black text-gray-900">{stats.ongoing}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-lg shadow-emerald-600/20 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Selesai Hari Ini</p>
          <p className="text-3xl font-black">{stats.completed}</p>
        </motion.div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama pasien, nomor antrian, atau nomor rekam medis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
          />
        </div>

        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === 'ongoing'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sedang Berjalan
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === 'completed'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              filter === 'all'
                ? 'bg-gray-600 text-white shadow-md shadow-gray-600/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredQueues.length > 0 ? (
          <AnimatePresence>
            {filteredQueues.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white p-5 rounded-2xl border-2 transition-all ${
                  q.status === 'ongoing'
                    ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50 hover:shadow-lg'
                    : 'border-gray-100 shadow-sm hover:shadow-md opacity-70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Queue Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Queue Number */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex flex-col items-center justify-center font-black text-indigo-600 border-2 border-indigo-100 flex-shrink-0">
                      <p className="text-[9px] opacity-60 uppercase tracking-widest leading-none">No</p>
                      <p className="text-2xl leading-none">{q.queueNo}</p>
                    </div>

                    {/* Patient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {q.status === 'ongoing' && (
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-tighter border border-indigo-200">
                            Sedang Diperiksa
                          </span>
                        )}
                        {q.status === 'completed' && (
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-tighter border border-emerald-200">
                            ✓ Selesai
                          </span>
                        )}
                      </div>
                      <p className="font-black text-gray-900 text-base truncate">{q.patient.name}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <FiHome className="w-3 h-3" />
                          {q.department?.name || 'UMUM'}
                        </span>
                        <span className="text-primary font-bold">RM: {q.patient.medicalRecordNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0 md:flex-col lg:flex-row">
                    {q.status === 'ongoing' ? (
                      <button
                        onClick={() => router.push(`/doctor/queue/${q.id}`)}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap"
                      >
                        <FiEdit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Buka Medis</span>
                        <span className="sm:hidden">Buka</span>
                      </button>
                    ) : q.status === 'completed' ? (
                      <button
                        onClick={() => router.push(`/doctor/queue/${q.id}`)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-600 font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all whitespace-nowrap"
                      >
                        <FiClipboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Lihat Riwayat</span>
                        <span className="sm:hidden">Lihat</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        Menunggu Triage
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-16 text-center bg-gray-50/80 rounded-2xl border-2 border-dashed border-gray-200">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-sm">
              {searchTerm ? 'Pasien tidak ditemukan' : 'Tidak ada antrian'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-primary font-bold text-sm flex items-center gap-2 justify-center mx-auto"
              >
                Hapus Filter <FiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
