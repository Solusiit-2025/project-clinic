'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, 
  FiVolume2, FiArrowRight, FiRefreshCw, FiUser, 
  FiHome, FiAlertCircle, FiClipboard, FiHeart, FiThermometer, FiWind,
  FiEdit3, FiPlus, FiTrash2, FiSearch, FiPackage, FiInfo
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { announceQueue } from '@/lib/utils/speech'

const API_TRANSACTIONS = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'
const API_MASTER = process.env.NEXT_PUBLIC_API_URL + '/api/master'

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

interface Medicine {
  id: string
  masterName: string
  masterCode: string
  medicineId: string | null
  stock: number
  unit: string
  medicine?: {
    genericName: string
    dosageForm: string
    strength: string
  }
}

export default function DoctorStation() {
  const router = useRouter()
  const { user, token, activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const [toast, setToast] = useState<{ queueNo: string; name: string } | null>(null)

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchQueues = useCallback(async () => {
    if (!token || !activeClinicId) return
    try {
      const { data } = await axios.get(`${API_TRANSACTIONS}/queues`, { 
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
    const interval = setInterval(fetchQueues, 30000)
    return () => clearInterval(interval)
  }, [fetchQueues])

  const handleCallPatient = async (q: Queue) => {
    try {
      // Notify backend (increments callCounter for Monitor)
      await axios.patch(`${API_TRANSACTIONS}/queues/${q.id}/status`, { status: 'called' }, { headers })
      fetchQueues()
      
      // Trigger Toast
      setToast({ queueNo: q.queueNo, name: q.patient.name })
      setTimeout(() => setToast(null), 5000)

      // Local check: if they have medical record from nurse, they go to doctor room
      if (isSoundEnabled) {
        const room = q.hasMedicalRecord ? 'Ruang Pemeriksaan Dokter' : 'Ruang Pra Pemeriksaan'
        announceQueue(q.queueNo, q.patient.name, room)
      }
    } catch (err) {
      console.error('Failed to call patient', err)
      alert('Gagal memanggil pasien')
    }
  }

  // Stats
  const awaitingTriage = queues.filter(q => (q.status === 'waiting' || q.status === 'called') && !q.hasMedicalRecord).length
  const readyForDoctor = queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).length
  const completedToday = queues.filter(q => q.status === 'completed').length

  return (
    <div className="p-6 mx-auto pb-20 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-xl"><FiUser className="text-indigo-600" /></div>
             Doctor Station
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Konsultasi Medis & Pemeriksaan Dokter</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {/* SOUND TOGGLE */}
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              isSoundEnabled 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 scale-[1.02]' 
              : 'bg-white text-gray-400 border-gray-100 shadow-sm opacity-60'
            }`}
          >
            <FiVolume2 className={`w-4 h-4 ${isSoundEnabled ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isSoundEnabled ? 'Suara Aktif' : 'Suara Mati'}</span>
          </button>

          <button onClick={fetchQueues} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TOP-CENTER TOAST: Calling Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] min-w-[320px]"
          >
            <div className="bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 px-6 py-4 flex items-center gap-4 border border-white/10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                <FiVolume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Pemanggilan Pasien</p>
                <p className="text-lg font-black uppercase leading-tight truncate">
                  {toast.queueNo} — {toast.name}
                </p>
              </div>
              <button onClick={() => setToast(null)} className="text-xs font-black opacity-60 hover:opacity-100 transition-opacity">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Menunggu Pra-Pemeriksaan</p>
            <p className="text-xl font-black text-gray-900">{awaitingTriage} Pasien</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center gap-4 ring-4 ring-emerald-50/50">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Siap Diperiksa Dokter</p>
            <p className="text-xl font-black text-gray-900">{readyForDoctor} Pasien</p>
          </div>
        </div>

        <div className="bg-indigo-600 p-5 rounded-[2rem] shadow-lg shadow-indigo-600/20 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Total Selesai Hari Ini</p>
            <p className="text-xl font-black leading-none">{completedToday}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 max-w-4xl">
        
        {/* NEW SECTION: READY FOR DOCTOR */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Siap Diperiksa (Finished Triage)
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              {queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).length} Pasien
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).map((q, i) => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-emerald-600 border border-emerald-100">
                    <p className="text-[7px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">NO</p>
                    <p className="text-lg font-black tracking-tight leading-none">{q.queueNo}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-tighter">SIAP PERIKSA</span>
                       <span className="text-[9px] font-bold text-slate-400">Triage Selesai</span>
                    </div>
                    <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{q.patient.name}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCallPatient(q)}
                    className={`px-5 py-3.5 font-black rounded-2xl text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-widest ${
                      q.status === 'called' ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-white border border-gray-100 text-gray-400 hover:text-primary'
                    }`}
                  >
                    <FiVolume2 className="w-4 h-4" /> {q.status === 'called' ? 'Panggil Ulang' : 'Panggil'}
                  </button>
                  <button 
                    onClick={() => router.push(`/admin/transactions/doctor/${q.id}`)}
                    className="px-6 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white font-black rounded-2xl text-[10px] transition-all uppercase tracking-widest flex items-center gap-2"
                  >
                    Mulai Periksa <FiArrowRight />
                  </button>
                </div>
              </motion.div>
            ))}

            {queues.filter(q => q.status === 'ready' || (q.status === 'called' && q.hasMedicalRecord)).length === 0 && (
              <div className="py-12 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <FiUsers className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Belum ada pasien siap diperiksa</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 px-2">Pemeriksaan Sedang Berjalan & Selesai</h3>

        
        {queues.filter(q => ['ongoing', 'completed'].includes(q.status)).map((q, i) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
              q.status === 'ongoing' ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50' : 
              'border-gray-100 shadow-sm opacity-60'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600">
                <p className="text-[8px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">NO</p>
                <p className="text-xl font-black tracking-tight leading-none">{q.queueNo}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                   {q.status === 'ongoing' && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-tighter">SEDANG DIPERIKSA</span>}
                   {q.status === 'completed' && <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-gray-100 text-gray-400 border-gray-200 uppercase tracking-tighter">✓ SELESAI</span>}
                </div>
                <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{q.patient.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-left">
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <FiHome className="w-3 h-3" /> {q.department?.name || 'UMUM'}
                  </p>
                  <p className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-tighter">
                    <FiActivity className="w-3 h-3" /> Vitals OK
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
               {(user?.role === 'DOCTOR' || user?.role === 'SUPER_ADMIN') ? (
                 <>
                   {q.status === 'ongoing' && (
                     <button 
                       onClick={() => router.push(`/admin/transactions/doctor/${q.id}`)}
                       className="px-6 py-3.5 bg-indigo-600 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                     >
                        <FiEdit3 className="w-4 h-4" /> BUKA REKAM MEDIS
                     </button>
                   )}
                   {q.status === 'completed' && (
                     <button 
                       onClick={() => router.push(`/admin/transactions/doctor/${q.id}`)}
                       className="px-6 py-3.5 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                     >
                        <FiClipboard className="w-4 h-4" /> LIHAT RIWAYAT MEDIS
                     </button>
                   )}
                 </>
               ) : (
                 <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 italic">
                   Akses Terbatas (Hanya Dokter)
                 </div>
               )}
            </div>
          </motion.div>
        ))}

        {queues.filter(q => ['ongoing', 'completed'].includes(q.status)).length === 0 && !loading && (
          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Belum ada pasien yang masuk pemeriksaan</p>
          </div>
        )}
        </section>
      </div>
    </div>
  )
}
