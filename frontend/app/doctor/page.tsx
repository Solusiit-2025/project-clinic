'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { motion } from 'framer-motion'
import { FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'

// Removed hardcoded API URL constant as it is handled by the centralized api client

interface Queue {
  id: string
  queueNumber: string
  patientName: string
  status: string
  registrationTime: string
}

interface Stats {
  totalQueue: number
  completed: number
  inProgress: number
  waiting: number
}

export default function DoctorDashboard() {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ totalQueue: 0, completed: 0, inProgress: 0, waiting: 0 })
  const [todayQueue, setTodayQueue] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)

  // Headers are now handled by centralized api client interceptors


  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('transactions/queues?today=true')
      const queues = data || []
      
      setStats({
        totalQueue: queues.length,
        completed: queues.filter((q: Queue) => q.status === 'completed').length,
        inProgress: queues.filter((q: Queue) => q.status === 'in-progress').length,
        waiting: queues.filter((q: Queue) => q.status === 'waiting').length,
      })
      setTodayQueue(queues.slice(0, 5)) // Show first 5
    } catch (e) {
      console.error('Failed to fetch queue stats', e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchStats])

  const statCards = [
    { 
      label: 'Total Antrian Hari Ini', 
      value: stats.totalQueue, 
      icon: FiUsers, 
      color: 'bg-blue-500',
      subtext: 'pasien terdaftar'
    },
    { 
      label: 'Menunggu', 
      value: stats.waiting, 
      icon: FiClock, 
      color: 'bg-amber-500',
      subtext: 'dalam antrean'
    },
    { 
      label: 'Selesai', 
      value: stats.completed, 
      icon: FiCheckCircle, 
      color: 'bg-emerald-500',
      subtext: 'konsultasi' 
    },
    { 
      label: 'Sedang Ditangani', 
      value: stats.inProgress, 
      icon: FiAlertCircle, 
      color: 'bg-purple-500',
      subtext: 'dalam proses'
    },
  ]

  return (
    <div className="space-y-8 lg:ml-64">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"
        >
          Dashboard Dokter
        </motion.h1>
        <p className="text-gray-600 font-medium">Kelola antrian dan rekam medis pasien Anda hari ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.color} bg-opacity-10 rounded-2xl flex items-center justify-center`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-gray-900 mb-2">{loading ? '-' : stat.value}</p>
            <p className="text-xs font-medium text-gray-400">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900">Antrian Hari Ini</h3>
            <button
              onClick={() => router.push('/doctor/queue')}
              className="text-primary font-black text-sm hover:text-primary/80 transition-colors flex items-center gap-2"
            >
              Lihat Semua <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : todayQueue.length > 0 ? (
            <div className="space-y-3">
              {todayQueue.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group"
                  onClick={() => router.push(`/doctor/queue/${q.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg">
                    {q.queueNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{q.patientName}</p>
                    <p className="text-xs text-gray-500 font-medium">{q.status}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                    {q.status === 'completed' && 'Selesai'}
                    {q.status === 'in-progress' && 'Sedang Berjalan'}
                    {q.status === 'waiting' && 'Menunggu'}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FiCheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-500">Tidak ada antrian hari ini</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all"
        >
          <h3 className="text-lg font-black text-gray-900 mb-6">Aksi Cepat</h3>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/doctor/queue')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FiClock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-gray-900 text-sm">Kelola Antrian</p>
                <p className="text-xs text-gray-500 font-medium mt-1">Lihat dan atur antrian pasien</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
            </button>

            <button
              onClick={() => router.push('/doctor/patients')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-200/50 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <FiUsers className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-gray-900 text-sm">Riwayat Pasien</p>
                <p className="text-xs text-gray-500 font-medium mt-1">Lihat history konsultasi pasien</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
