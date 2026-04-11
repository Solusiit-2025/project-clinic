'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiArrowRight, 
  FiCalendar, FiActivity, FiUser, FiZap 
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Queue {
  id: string
  queueNo: string
  patient: {
    id: string
    name: string
    medicalRecordNo: string
    gender: string
  }
  status: string
  createdAt: string
  hasMedicalRecord: boolean
}

interface Stats {
  totalQueue: number
  completed: number
  inProgress: number
  waiting: number
}

export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ totalQueue: 0, completed: 0, inProgress: 0, waiting: 0 })
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data } = await api.get('transactions/queues?today=true')
      const allQueues = data || []
      
      setQueues(allQueues)
      setStats({
        totalQueue: allQueues.length,
        completed: allQueues.filter((q: any) => q.status === 'completed').length,
        inProgress: allQueues.filter((q: any) => q.status === 'ongoing').length,
        waiting: allQueues.filter((q: any) => q.status === 'waiting' || q.status === 'ready' || q.status === 'triage' || q.status === 'called').length,
      })
    } catch (e) {
      console.error('Failed to fetch dashboard data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    
    const hour = new Date().getHours()
    if (hour < 11) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 19) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const currentPatient = useMemo(() => {
    return queues.find(q => q.status === 'ongoing')
  }, [queues])

  const nextPatient = useMemo(() => {
    // Priority: 'ready' first, then 'triage', then 'waiting/called'
    return queues.find(q => q.status === 'ready') || 
           queues.find(q => q.status === 'triage') || 
           queues.find(q => q.status === 'waiting' || q.status === 'called')
  }, [queues])

  const statCards = [
    { 
      label: 'Antrian Hari Ini', 
      value: stats.totalQueue, 
      icon: FiUsers, 
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Menunggu', 
      value: stats.waiting, 
      icon: FiClock, 
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    { 
      label: 'Dalam Proses', 
      value: stats.inProgress, 
      icon: FiActivity, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Selesai', 
      value: stats.completed, 
      icon: FiCheckCircle, 
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600' 
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Greeting Section - Slimmed down for Laptop */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-900/20"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -mr-15 -mt-15"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase text-indigo-200">
              <FiZap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              Station Active
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">Dr. {user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-indigo-100/70 font-medium max-w-md text-sm">
              Anda memiliki {stats.waiting} pasien dalam antrian.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end text-right">
            <div className="flex items-center gap-2 text-indigo-100 font-bold text-sm mb-0.5">
              <FiCalendar className="w-3.5 h-3.5" />
              {format(new Date(), 'EEEE, d MMM yyyy', { locale: id })}
            </div>
            <p className="text-indigo-100/40 text-[9px] font-black uppercase tracking-[0.2em]">Yasfina Management</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Smaller padding */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} ${stat.textColor} flex items-center justify-center shadow-inner`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <span className="text-2xl font-black text-gray-900 leading-none">
                  {loading ? <span className="inline-block w-6 h-6 bg-gray-100 animate-pulse rounded" /> : stat.value}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content: Slimmer Now Serving */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white overflow-hidden rounded-[2rem] border border-indigo-50 shadow-lg shadow-indigo-50/50"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-primary px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                  <FiActivity className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">Pemeriksaan Berjalan</h3>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md border border-white/10">Active</div>
            </div>
            
            <div className="p-6">
              {currentPatient ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary font-black text-3xl border-2 border-indigo-100 lg:w-28 lg:h-28">
                      {currentPatient.queueNo}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Data Pasien</p>
                    <h4 className="text-xl md:text-2xl font-black text-gray-900">{currentPatient.patient.name}</h4>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">RM: {currentPatient.patient.medicalRecordNo} • {currentPatient.patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
                    
                    <button
                      onClick={() => router.push(`/doctor/queue/${currentPatient.id}`)}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary/90 hover:shadow-lg transition-all group"
                    >
                      Buka Rekam Medis <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-3 border-2 border-dashed border-gray-200">
                    <FiUser className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-gray-400">Belum Ada Pasien Aktif</h4>
                  {nextPatient && (
                    <button
                      onClick={() => router.push(`/doctor/queue`)}
                      className="mt-4 flex items-center gap-2 text-primary font-black text-xs hover:underline"
                    >
                      Panggil Antrian {nextPatient.queueNo} <FiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-2 mb-3">
                <FiZap className="text-amber-500 w-3.5 h-3.5" /> Tips Station
              </h3>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 border-l-4 border-l-amber-400">
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                  Lakukan sinkronisasi data rekam medis secara berkala untuk memastikan data tersimpan.
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-2 mb-3">
                <FiUsers className="text-indigo-500 w-3.5 h-3.5" /> Pasien Terakhir
              </h3>
              <div className="space-y-2">
                {queues.filter(q => q.status === 'completed').slice(0, 2).map((q, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[9px]">
                      {q.patient.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-900 truncate">{q.patient.name}</p>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold">{format(new Date(q.createdAt), 'HH:mm')}</p>
                  </div>
                ))}
                {queues.filter(q => q.status === 'completed').length === 0 && (
                  <p className="text-[9px] text-gray-400 font-medium italic py-1 text-center">Belum ada pasien selesai</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Compact Queue List */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/40"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-gray-900">Antrian Masuk</h3>
                <p className="text-[8px] font-black text-indigo-500 tracking-widest uppercase mt-0.5">Queue Today</p>
              </div>
              <button
                onClick={() => router.push('/doctor/queue')}
                className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all group"
              >
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {queues.filter(q => ['waiting', 'ready', 'triage', 'called'].includes(q.status)).length > 0 ? (
                  queues.filter(q => ['waiting', 'ready', 'triage', 'called'].includes(q.status)).slice(0, 5).map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => router.push(`/doctor/queue`)}
                      className="group p-3 bg-gray-50/50 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-primary text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                          {q.queueNo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate group-hover:text-primary transition-colors">{q.patient.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                            <FiClock className="w-2.5 h-2.5" /> 
                            {format(new Date(q.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <FiCheckCircle className="w-8 h-8 text-emerald-200 mx-auto" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Antrian Kosong</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
