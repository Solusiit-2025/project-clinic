'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, 
  FiVolume2, FiArrowRight, FiSkipForward, FiMoreHorizontal,
  FiRefreshCw, FiExternalLink, FiUser, FiHome, FiAlertCircle, FiRotateCcw,
  FiMonitor
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Link from 'next/link'
import { announceQueue } from '@/lib/utils/speech'

// API endpoint for transactions
const TX_API = 'transactions'

interface Queue {
  id: string
  queueNo: string
  status: 'waiting' | 'called' | 'triage' | 'ready' | 'ongoing' | 'completed' | 'no-show'
  actualCallTime: string | null
  doctorId: string | null
  departmentId: string | null
  patient: { name: string; medicalRecordNo: string; gender: string }
  doctor: { name: string; specialization: string } | null
  department: { name: string } | null
  hasMedicalRecord: boolean
}

export default function QueueDashboard() {
  const { user, activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [callingId, setCallingId] = useState<string | null>(null)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const [toast, setToast] = useState<{ queueNo: string; name: string; room: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  

  const fetchQueues = useCallback(async () => {
    if (!activeClinicId) return
    try {
      const { data } = await api.get(`${TX_API}/queues`, { 
        params: { clinicId: activeClinicId } 
      })
      setQueues(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeClinicId])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 30000) // Auto refresh every 30s
    return () => clearInterval(interval)
  }, [fetchQueues])

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch(`${TX_API}/queues/${id}/status`, { status })
      setQueues(prev => prev.map(q => q.id === id ? data : q))
      
      if (status === 'called') {
        const room = data.hasMedicalRecord ? 'Ruang Pemeriksaan Dokter' : 'Ruang Pra-Pemeriksaan'
        
        // Synchronized Voice & Toast
        if (isSoundEnabled) {
          announceQueue(
            data.queueNo, 
            data.patient.name, 
            room,
            () => setToast({ queueNo: data.queueNo, name: data.patient.name, room }), // On Start
            () => setToast(null) // On End
          )
        } else {
          // If sound is disabled, just show toast for 5s
          setToast({ queueNo: data.queueNo, name: data.patient.name, room })
          setTimeout(() => setToast(null), 5000)
        }
      }
    } catch (e) {
      alert('Gagal memperbarui antrian')
    }
  }

  // Stats
  const waiting = queues.filter(q => q.status === 'waiting').length
  const ongoing = queues.filter(q => q.status === 'ongoing').length
  const completed = queues.filter(q => q.status === 'completed').length

  const StatusPill = ({ status }: { status: string }) => {
    const map: any = {
      waiting: { label: 'MENUNGGU TRIAGE', cls: 'bg-amber-50 text-amber-600 border-amber-100 opacity-60' },
      called: { label: 'DIPANGGIL', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      ready: { label: 'SIAP PERIKSA', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      ongoing: { label: 'DIPERIKSA', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
      completed: { label: 'SELESAI', cls: 'bg-gray-50 text-gray-400 border-gray-100' },
      'no-show': { label: 'LEWATI', cls: 'bg-red-50 text-red-500 border-red-100' },
    }
    const s = map[status] || map.waiting
    return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
  }
  // Get Current Clinic Code for the monitor link
  const activeClinicCode = useMemo(() => {
    return user?.clinics?.find((c: any) => c.id === activeClinicId)?.code
  }, [user, activeClinicId])

  // Memoize active doctors list for the monitor dropdown to prevent re-calculating on every render
  const activeDoctors = useMemo(() => {
    return Array.from(
      new Map(
        queues
          .filter(q => q.doctor && q.doctorId)
          .map(q => [q.doctorId!, { id: q.doctorId!, name: q.doctor!.name, dept: q.department?.name }])
      ).values()
    )
  }, [queues])

  return (
    <div className="p-4 md:p-6 mx-auto pb-24 md:pb-20 w-full">

      {/* TOP-CENTER TOAST: Calling Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] min-w-[380px] max-w-[500px]"
          >
            <div className="bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiVolume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Pemanggilan Sedang Berjalan</p>
                <p className="text-lg font-black uppercase leading-tight">
                  <span className="opacity-70">{toast.queueNo}</span> — {toast.name}
                </p>
                <p className="text-[10px] font-medium opacity-60 mt-0.5">→ {toast.room}</p>
              </div>
              <button onClick={() => setToast(null)} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0">
                <span className="text-xs font-black">✕</span>
              </button>
            </div>
            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-white/40 rounded-full mt-1 origin-left"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight truncate">Dashboard Antrian</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium truncate">{isMounted ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* MONITOR LINK BUTTONS */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-100 rounded-xl text-slate-600 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
              <FiMonitor className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">Buka Monitor</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="p-2 space-y-1">
                <Link 
                  href={`/display/queue${activeClinicCode ? `?clinic=${activeClinicCode}` : ''}`}
                  target="_blank"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-all group/item"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                    <FiMonitor className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Semua Antrian</p>
                    <p className="text-[9px] text-gray-400 font-medium">Monitor ruang tunggu pusat</p>
                  </div>
                </Link>
                {activeDoctors.map((doc: any) => (
                  <Link
                    key={doc.id}
                    href={`/display/queue${activeClinicCode ? `?clinic=${activeClinicCode}` : '?'}${doc.id ? `&doctor=${doc.id}` : ''}`}
                    target="_blank"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 transition-all"
                  >
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 flex-shrink-0 text-[10px] font-black">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{doc.name}</p>
                      {doc.dept && <p className="text-[9px] text-gray-400 font-medium">{doc.dept}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <button onClick={fetchQueues} className="p-2 md:p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          
          <div className="h-8 md:h-10 w-px bg-gray-200 mx-1 hidden md:block" />
          
          {/* SOUND TOGGLE */}
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2 rounded-xl border transition-all ${
              isSoundEnabled 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
              : 'bg-white text-gray-400 border-gray-100 shadow-sm opacity-60'
            }`}
          >
            <FiVolume2 className={`w-4 h-4 md:w-5 md:h-5 ${isSoundEnabled ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isSoundEnabled ? 'Suara Aktif' : 'Suara Mati'}</span>
            <div className={`w-7 md:w-8 h-3 md:h-4 rounded-full relative transition-colors ${isSoundEnabled ? 'bg-white/30' : 'bg-gray-100'}`}>
              <div className={`absolute top-0.5 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-white transition-all ${isSoundEnabled ? 'left-4 md:left-4.5' : 'left-0.5'}`} />
              <div className={`absolute top-0.5 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full transition-all ${isSoundEnabled ? 'right-0.5 bg-white' : 'left-0.5 bg-gray-300'}`} />
            </div>
          </button>
          <div className="h-8 md:h-10 w-px bg-gray-200 mx-2 hidden md:block" />
          <div className="flex gap-2">
            <div className="bg-white px-3 md:px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Menunggu</p>
              <p className="text-base md:text-lg font-black text-amber-500 leading-none">{waiting}</p>
            </div>
            <div className="bg-white px-3 md:px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Diperiksa</p>
              <p className="text-base md:text-lg font-black text-emerald-500 leading-none">{ongoing}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
          
          {/* ON PROGRESS / LIVE SECTION */}
          <div className="space-y-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               Sedang Diperiksa (In Progress)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {queues.filter(q => q.status === 'ongoing').sort((a, b) => a.queueNo.localeCompare(b.queueNo)).map((q, i) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-600 p-4 md:p-5 rounded-2xl md:rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group border border-emerald-400/30"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="min-w-[3.5rem] h-14 bg-white/20 rounded-xl flex flex-col items-center justify-center backdrop-blur-md border border-white/20 px-2">
                      <p className="text-[7px] font-black uppercase opacity-60 leading-none mb-1">NO</p>
                      <p className="text-lg font-black tracking-tighter">{q.queueNo}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">{q.department?.name || 'POLI UMUM'}</p>
                      <h4 className="text-base font-black uppercase truncate tracking-tight mb-0.5">{q.patient.name}</h4>
                      <p className="text-[9px] font-bold opacity-80 flex items-center gap-1"><FiUser className="w-2.5 h-2.5" /> {q.doctor?.name ? (q.doctor.name.toLowerCase().startsWith('dr') ? q.doctor.name : `Dr. ${q.doctor.name}`) : 'Dokter Jaga'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                     <span className="text-[9px] font-black bg-white/20 px-2.5 py-1 rounded-full uppercase">Pemeriksaan Dokter</span>
                     <button 
                        onClick={() => updateStatus(q.id, 'completed')}
                        className="p-2 bg-white text-emerald-600 rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg"
                        title="Selesaikan Pemeriksaan"
                     >
                        <FiCheckCircle className="w-5 h-5" />
                     </button>
                  </div>
                </motion.div>
              ))}

              {queues.filter(q => q.status === 'ongoing').length === 0 && (
                <div className="col-span-2 py-10 border-2 border-dashed border-emerald-100 rounded-[2.5rem] flex flex-col items-center justify-center bg-white/50">
                   <FiActivity className="w-10 h-10 text-emerald-100 mb-2" />
                   <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Tidak ada pemeriksaan aktif</p>
                </div>
              )}
            </div>
          </div>

          {/* KANBAN FLOW SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. ANTREAN PRA-PEMERIKSAAN (Waiting, Called, or In Triage) */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-black text-[9px] md:text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 px-2">
                 <FiVolume2 className="text-primary w-3.5 h-3.5 md:w-4 md:h-4" /> Ruang Pra Pemeriksaan (Vital Sign)
              </h3>
              <div className="space-y-2 md:space-y-3">
                {queues.filter(q => ['waiting', 'called', 'triage'].includes(q.status) && !q.hasMedicalRecord).map((q) => (
                  <motion.div 
                    key={q.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`p-5 rounded-3xl border bg-white transition-all ${
                      q.status === 'triage' ? 'border-amber-100 bg-amber-50/20 shadow-sm' : 
                      q.status === 'called' ? 'border-primary ring-4 ring-primary/5 shadow-xl' : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1.5 rounded-xl font-black text-xs ${
                        q.status === 'triage' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {q.queueNo}
                      </div>
                      <StatusPill status={q.status} />
                    </div>
                    
                    <div className="space-y-1">
                       <h4 className="text-base font-black text-gray-900 uppercase truncate tracking-tight">{q.patient.name}</h4>
                       <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{q.department?.name || 'POLI UMUM'}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                             <FiUser className="w-2.5 h-2.5" /> {q.doctor?.name ? (q.doctor.name.toLowerCase().startsWith('dr') ? q.doctor.name : `Dr. ${q.doctor.name}`) : 'DOKTER JAGA'}
                          </p>
                       </div>
                    </div>

                    {q.status === 'triage' ? (
                       <div className="mt-4 py-2.5 px-4 bg-amber-100/50 rounded-2xl flex items-center gap-3 border border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-tighter italic">Sedang diperiksa perawat...</p>
                       </div>
                    ) : (
                       <button 
                         onClick={() => updateStatus(q.id, 'called')}
                         className="w-full mt-5 py-3.5 bg-primary text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest"
                       >
                         {q.status === 'called' ? 'PANGGIL ULANG' : 'PANGGIL KE PRA-PEMERIKSAAN'}
                       </button>
                    )}
                  </motion.div>
                ))}
                {queues.filter(q => ['waiting', 'called', 'triage'].includes(q.status) && !q.hasMedicalRecord).length === 0 && (
                  <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                     <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Semua Pasien Telah Triage</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. RUANG DOKTER (To Doctor) */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-black text-[9px] md:text-xs uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2 px-2">
                 <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5 md:w-4 md:h-4" /> Ruang Pemeriksaan Dokter
              </h3>
              <div className="space-y-2 md:space-y-3">
                {queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).map((q) => (
                  <motion.div 
                    key={q.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-6 rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-500/5 group hover:border-emerald-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs border border-emerald-100">
                        {q.queueNo}
                      </div>
                      <div className="flex items-center gap-1">
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-[10px] font-black text-emerald-500 uppercase">Input Selesai</span>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                       <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{q.patient.name}</h4>
                       <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">Diperiksa oleh: Dr. {q.doctor?.name || 'Jaga'}</p>
                    </div>

                    <div className="flex gap-2">
                       {q.status === 'called' ? (
                         <>
                           <button 
                            onClick={() => updateStatus(q.id, 'called')} 
                            className="flex-1 py-4 bg-white border border-emerald-500 text-emerald-600 text-xs font-black rounded-2xl hover:bg-emerald-50 transition-all shadow-sm uppercase tracking-widest flex items-center justify-center gap-2"
                           >
                              <FiVolume2 className="w-4 h-4" /> ULANG
                           </button>
                           <button 
                            onClick={() => updateStatus(q.id, 'ongoing')} 
                            className="flex-[2] py-4 bg-emerald-500 text-white text-xs font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest flex items-center justify-center gap-2"
                           >
                              <FiArrowRight className="w-4 h-4" /> PERIKSA
                           </button>
                         </>
                       ) : (
                         <button 
                          onClick={() => updateStatus(q.id, 'called')} 
                          className="flex-1 py-4 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest flex items-center justify-center gap-2"
                         >
                            <FiVolume2 className="w-4 h-4" /> PANGGIL KE RUANG DOKTER
                         </button>
                       )}
                    </div>
                  </motion.div>
                ))}
                {queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).length === 0 && (
                  <div className="text-center py-20 bg-emerald-50/20 rounded-[2.5rem] border-2 border-dashed border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em]">Belum ada pasien siap</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Status (Summary / History) */}
        <div className="space-y-6 md:space-y-8">
           <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3 md:space-y-4">
              <h4 className="font-black text-[9px] md:text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <FiCheckCircle className="text-emerald-500 w-3.5 h-3.5 md:w-4 md:h-4" /> Baru Selesai
              </h4>
              <div className="space-y-3 md:space-y-4">
                 {queues.filter(q => q.status === 'completed').slice(0, 5).map(q => (
                   <div key={q.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 md:gap-3">
                         <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all text-xs">
                            {q.queueNo}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-900 leading-none truncate">{q.patient.name}</p>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                               <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase truncate">{q.department?.name || 'Umum'}</p>
                               <span className="text-[8px] md:text-[9px] text-gray-300 flex-shrink-0">•</span>
                               <p className="text-[8px] md:text-[9px] font-bold text-indigo-400 uppercase truncate">{q.doctor?.name ? (q.doctor.name.toLowerCase().startsWith('dr') ? q.doctor.name : `Dr. ${q.doctor.name}`) : 'Jaga'}</p>
                            </div>
                         </div>
                      </div>
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                   </div>
                 ))}
                 {queues.filter(q => q.status === 'completed').length === 0 && (
                   <p className="text-[9px] md:text-xs text-gray-400 font-medium italic text-center py-3 md:py-4">Belum ada pasien selesai hari ini</p>
                 )}
              </div>
           </div>

           <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3 md:space-y-4">
              <h4 className="font-black text-[9px] md:text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <FiAlertCircle className="text-red-500 w-3.5 h-3.5 md:w-4 md:h-4" /> Pasien Terlewati
              </h4>
              <div className="space-y-3 md:space-y-4">
                 {queues.filter(q => q.status === 'no-show').map(q => (
                   <div key={q.id} className="flex items-center justify-between group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center gap-2 md:gap-3 text-left">
                         <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 rounded-xl flex items-center justify-center font-black text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all text-xs border border-red-100/50">
                            {q.queueNo}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-900 leading-none truncate">{q.patient.name}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight truncate">{q.department?.name || 'Umum'}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => updateStatus(q.id, 'waiting')}
                        className="p-2 md:p-2.5 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all shadow-sm flex-shrink-0"
                        title="Panggil Kembali ke Antrian Aktif"
                      >
                         <FiRotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                   </div>
                 ))}
                 {queues.filter(q => q.status === 'no-show').length === 0 && (
                   <p className="text-[9px] md:text-xs text-gray-400 font-medium italic text-center py-3 md:py-4">Belum ada pasien terlewati</p>
                 )}
              </div>
           </div>

           <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
              <div className="relative z-10 space-y-3 md:space-y-4">
                <FiActivity className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-80" />
                <h3 className="text-lg md:text-xl font-black leading-tight">Mulai <br />Pelayanan Medis</h3>
                <p className="text-[9px] md:text-xs text-white/60 font-medium">Buka menu pendaftaran untuk registrasi pasien baru ke sistem antrian.</p>
                <Link href="/admin/transactions/registration" className="inline-flex items-center gap-2 text-[9px] md:text-xs font-black bg-white text-gray-900 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl hover:bg-primary hover:text-white transition-all">
                  DAFTAR PASIEN <FiArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
