'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, 
  FiVolume2, FiArrowRight, FiSkipForward, FiMoreHorizontal,
  FiRefreshCw, FiExternalLink, FiUser, FiHome, FiAlertCircle, FiRotateCcw
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'

interface Queue {
  id: string
  queueNo: string
  status: 'waiting' | 'called' | 'ongoing' | 'completed' | 'no-show'
  actualCallTime: string | null
  patient: { name: string; medicalRecordNo: string; gender: string }
  doctor: { name: string; specialization: string } | null
  department: { name: string } | null
}

export default function QueueDashboard() {
  const { token, activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [callingId, setCallingId] = useState<string | null>(null)

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])
  
  const announceQueue = useCallback((queueNo: string, name: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(
        `Nomor antrian, ${queueNo.replace('-', ' ')}, atas nama ${name}, silakan menuju ruang periksa.`
      )
      
      // Mencari suara wanita Indonesia (Gadis, Andini, atau keyword female)
      const voices = window.speechSynthesis.getVoices()
      const idVoice = voices.find(v => v.lang.startsWith('id') && (v.name.includes('Gadis') || v.name.includes('Andini') || v.name.toLowerCase().includes('female'))) || 
                      voices.find(v => v.lang.startsWith('id'))
      
      if (idVoice) utterance.voice = idVoice
      
      utterance.lang = 'id-ID'
      utterance.rate = 0.9
      utterance.pitch = 1.1 // Pitch agak tinggi untuk kesan suara wanita yang lebih ramah
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const fetchQueues = useCallback(async () => {
    if (!token || !activeClinicId) return
    try {
      const { data } = await axios.get(`${API}/queues`, { 
        headers, 
        params: { clinicId: activeClinicId } 
      })
      setQueues(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, activeClinicId, headers])

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 30000) // Auto refresh every 30s
    return () => clearInterval(interval)
  }, [fetchQueues])

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data } = await axios.patch(`${API}/queues/${id}/status`, { status }, { headers })
      setQueues(prev => prev.map(q => q.id === id ? data : q))
      
      if (status === 'called') {
        announceQueue(data.queueNo, data.patient.name)
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
      waiting: { label: 'MENUNGGU', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
      called: { label: 'DIPANGGIL', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      ongoing: { label: 'DIPERIKSA', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      completed: { label: 'SELESAI', cls: 'bg-gray-50 text-gray-400 border-gray-100' },
      'no-show': { label: 'LEWATI', cls: 'bg-red-50 text-red-500 border-red-100' },
    }
    const s = map[status] || map.waiting
    return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
  }

  return (
    <div className="p-6 mx-auto pb-20 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Antrian</h1>
          <p className="text-sm text-gray-500 font-medium">Monitoring Pasien Aktif - {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchQueues} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="h-10 w-px bg-gray-200 mx-2 hidden md:block" />
          <div className="flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Menunggu</p>
              <p className="text-lg font-black text-amber-500 leading-none">{waiting}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Diperiksa</p>
              <p className="text-lg font-black text-emerald-500 leading-none">{ongoing}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* ON PROGRESS / LIVE SECTION */}
          <div className="space-y-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               Sedang Diperiksa (In Progress)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {queues.filter(q => q.status === 'ongoing').map((q, i) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group border border-emerald-400/30"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex flex-col items-center justify-center backdrop-blur-md border border-white/20">
                      <p className="text-[7px] font-black uppercase opacity-60 leading-none mb-1">NO</p>
                      <p className="text-base font-black">{q.queueNo}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">{q.department?.name || 'POLI UMUM'}</p>
                      <h4 className="text-base font-black uppercase truncate tracking-tight mb-0.5">{q.patient.name}</h4>
                      <p className="text-[9px] font-bold opacity-80 flex items-center gap-1"><FiUser className="w-2.5 h-2.5" /> {q.doctor?.name || 'Dokter Jaga'}</p>
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

          {/* TRIAGE / READY SECTION (NEW) */}
          <div className="space-y-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
               <FiActivity className="text-amber-500" /> Tahap Triage & Persiapan (Nurses)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {queues.filter(q => q.status === 'triage' || q.status === 'ready').map((q, i) => (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex flex-col items-center justify-center text-amber-600 border border-amber-100/50">
                      <p className="text-[7px] font-black uppercase opacity-60 leading-none mb-1">NO</p>
                      <p className="text-sm font-black">{q.queueNo}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase truncate tracking-tight text-gray-900">{q.patient.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                         {q.status === 'triage' ? 'Pemeriksaan Vital...' : 'Siap Menunggu Dokter'}
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${q.status === 'ready' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                       <FiCheckCircle className="w-4 h-4" />
                    </div>
                  </motion.div>
               ))}
               {queues.filter(q => q.status === 'triage' || q.status === 'ready').length === 0 && (
                  <p className="col-span-2 text-center py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">Semua Pasien Triage Selesai</p>
               )}
            </div>
          </div>

          {/* WAITING LIST SECTION */}
          <div className="space-y-6">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
               <FiVolume2 className="text-primary" /> Antrian Aktif (Pendaftaran & Panggilan)
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {queues.filter(q => ['waiting', 'called'].includes(q.status)).map((q, i) => (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative bg-white p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    q.status === 'called' ? 'border-primary ring-4 ring-primary/5 shadow-xl' : 'border-gray-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`min-w-[90px] h-20 px-4 rounded-[1.8rem] flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                      q.status === 'called' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-50 text-gray-900 group-hover:bg-primary group-hover:text-white'
                    }`}>
                      <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -mr-4 -mt-4" />
                      <p className="text-[9px] font-black opacity-60 uppercase tracking-[0.2em] leading-none mb-1.5 z-10">Antrian</p>
                      <p className={`text-2xl font-black tracking-tight leading-none z-10 whitespace-nowrap ${q.queueNo.length > 5 ? 'text-xl' : 'text-2xl'}`}>
                        {q.queueNo}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                         <StatusPill status={q.status} />
                         <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><FiClock /> {q.actualCallTime ? new Date(q.actualCallTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      </div>
                      <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{q.patient.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <FiHome className="w-3 h-3" /> {q.department?.name || 'UMUM'}
                        </p>
                        <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                          <FiUser className="w-3 h-3" /> {q.doctor?.name || 'Dokter Jaga'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                     {q.status === 'waiting' && (
                       <button 
                        onClick={() => updateStatus(q.id, 'called')}
                        className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
                       >
                          <FiVolume2 /> PANGGIL
                       </button>
                     )}
                     {q.status === 'called' && (
                       <div className="flex items-center gap-2 flex-1 md:flex-none">
                          <button 
                            onClick={() => updateStatus(q.id, 'called')}
                            className="px-4 py-3 bg-white border border-primary text-primary font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-all shadow-sm"
                            title="Panggil Ulang Antrian"
                          >
                            <FiVolume2 /> ULANG
                          </button>
                          <button 
                            onClick={() => updateStatus(q.id, 'ongoing')}
                            className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <FiArrowRight /> PERIKSA
                          </button>
                       </div>
                     )}
                     <button 
                      onClick={() => updateStatus(q.id, 'no-show')}
                      className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Lewati"
                     >
                        <FiSkipForward className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              ))}

              {queues.filter(q => q.status === 'waiting' || q.status === 'called').length === 0 && !loading && (
                <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <FiUsers className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-300 font-bold">Semua antrian telah diproses</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Status (Summary / History) */}
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <FiCheckCircle className="text-emerald-500" /> Baru Selesai
              </h4>
              <div className="space-y-4">
                 {queues.filter(q => q.status === 'completed').slice(0, 5).map(q => (
                   <div key={q.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all text-xs">
                            {q.queueNo}
                         </div>
                         <div>
                            <p className="text-xs font-black text-gray-900 leading-none">{q.patient.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{q.department?.name || 'Umum'}</p>
                         </div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   </div>
                 ))}
                 {queues.filter(q => q.status === 'completed').length === 0 && (
                   <p className="text-xs text-gray-400 font-medium italic text-center py-4">Belum ada pasien selesai hari ini</p>
                 )}
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <FiAlertCircle className="text-red-500" /> Pasien Terlewati
              </h4>
              <div className="space-y-4">
                 {queues.filter(q => q.status === 'no-show').map(q => (
                   <div key={q.id} className="flex items-center justify-between group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center gap-3 text-left">
                         <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center font-black text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all text-xs border border-red-100/50">
                            {q.queueNo}
                         </div>
                         <div>
                            <p className="text-xs font-black text-gray-900 leading-none">{q.patient.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{q.department?.name || 'Umum'}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => updateStatus(q.id, 'waiting')}
                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all shadow-sm"
                        title="Panggil Kembali ke Antrian Aktif"
                      >
                         <FiRotateCcw className="w-3.5 h-3.5" />
                      </button>
                   </div>
                 ))}
                 {queues.filter(q => q.status === 'no-show').length === 0 && (
                   <p className="text-xs text-gray-400 font-medium italic text-center py-4">Belum ada pasien terlewati</p>
                 )}
              </div>
           </div>

           <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
              <div className="relative z-10 space-y-4">
                <FiActivity className="w-10 h-10 text-primary opacity-80" />
                <h3 className="text-xl font-black leading-tight">Mulai <br />Pelayanan Medis</h3>
                <p className="text-xs text-white/60 font-medium">Buka menu pendaftaran untuk registrasi pasien baru ke sistem antrian.</p>
                <Link href="/admin/transactions/registration" className="inline-flex items-center gap-2 text-xs font-black bg-white text-gray-900 px-5 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all">
                  DAFTAR PASIEN <FiArrowRight />
                </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
