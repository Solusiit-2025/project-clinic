'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, 
  FiVolume2, FiArrowRight, FiRefreshCw, FiUser, 
  FiHome, FiAlertCircle, FiClipboard, FiHeart, FiThermometer, FiWind,
  FiFilter, FiMonitor
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import MasterModal from '@/components/admin/master/MasterModal'
import { announceQueue } from '@/lib/utils/speech'


interface Queue {
  id: string
  patientId: string
  clinicId: string
  doctorId: string | null
  registrationId: string | null
  queueNo: string
  status: 'waiting' | 'called' | 'triage' | 'ready' | 'ongoing' | 'completed' | 'no-show'
  patient: { name: string; medicalRecordNo: string; gender: string; allergies?: string | null }
  doctor: { name: string; specialization: string } | null
  department: { name: string } | null
  hasMedicalRecord?: boolean
}

export default function NurseStation() {
  const { activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  
  const [form, setForm] = useState({
    chiefComplaint: '',
    allergies: '',
    vitals: {
      weight: '',
      height: '',
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      bloodOxygen: '',
      notes: ''
    }
  })
  const [saving, setSaving] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const [toast, setToast] = useState<{ queueNo: string; name: string } | null>(null)
  const [filterDoctorId, setFilterDoctorId] = useState<string>('all')


  const fetchQueues = useCallback(async () => {
    if (!activeClinicId) return
    try {
      const { data } = await api.get('/transactions/queues', { 
        params: { clinicId: activeClinicId } 
      })
      // Only show patients waiting for triage (waiting, called, active triage, OR already ready but not yet ongoing)
      setQueues(data.filter((q: Queue) => ['waiting', 'called', 'triage', 'ready', 'ongoing'].includes(q.status)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeClinicId])

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 30000)
    return () => clearInterval(interval)
  }, [fetchQueues])

  const handleCallPatient = async (q: Queue) => {
    try {
      // Always notify backend to increment callCounter (triggers Monitor Voice/Overlay)
      await api.patch(`/transactions/queues/${q.id}/status`, { status: 'called' })
      fetchQueues()
      
      // Trigger Toast
      setToast({ queueNo: q.queueNo, name: q.patient.name })
      setTimeout(() => setToast(null), 5000)

      // Local audio feedback (Nurse's computer) - Check if enabled
      if (isSoundEnabled) {
        announceQueue(q.queueNo, q.patient.name, 'Ruang Pra Pemeriksaan')
      }
    } catch (err) {
      console.error('Failed to call patient', err)
      alert('Gagal memanggil pasien')
    }
  }

  const openTriage = async (q: Queue) => {
    setSelectedQueue(q)
    
    // Default empty form
    const defaultForm = {
      chiefComplaint: '',
      allergies: q.patient.allergies || '',
      vitals: {
        weight: '',
        height: '',
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        bloodOxygen: '',
        notes: ''
      }
    }

    // If status is 'ready' or data exists, fetch existing data to edit
    if ((q.status === 'ready' || q.hasMedicalRecord) && q.registrationId) {
      try {
        const { data } = await api.get(`/transactions/medical-records/registration/${q.registrationId}`)
        if (data) {
          const v = data.vitals?.[0] || {}
          setForm({
            chiefComplaint: data.chiefComplaint || '',
            allergies: q.patient.allergies || '',
            vitals: {
              weight: v.weight?.toString() || '',
              height: v.height?.toString() || '',
              temperature: v.temperature?.toString() || '',
              bloodPressure: v.bloodPressure || '',
              heartRate: v.heartRate?.toString() || '',
              respiratoryRate: v.respiratoryRate?.toString() || '',
              bloodOxygen: v.bloodOxygen?.toString() || '',
              notes: v.notes || ''
            }
          })
        }
      } catch (error) {
        console.error('Error fetching medical record for edit:', error)
        setForm(defaultForm)
      }
    } else {
      setForm(defaultForm)
    }

    // Set status to 'triage' when opening the modal so the dashboard knows they are with the nurse
    if (q.status !== 'ready' && q.status !== 'triage') {
        try {
            await api.patch(`/transactions/queues/${q.id}/status`, { status: 'triage' })
            fetchQueues()
        } catch (err) {
            console.error('Failed to update status to triage', err)
        }
    }

    setModalOpen(true)
  }

  const handleSaveVitals = async () => {
    if (!selectedQueue) return
    setSaving(true)
    try {
      await api.post('/transactions/medical-records/nurse', {
        queueId: selectedQueue.id,
        patientId: selectedQueue.patientId,
        clinicId: selectedQueue.clinicId,
        registrationId: selectedQueue.registrationId,
        doctorId: selectedQueue.doctorId,
        chiefComplaint: form.chiefComplaint,
        allergies: form.allergies,
        vitals: form.vitals
      })
      
      setModalOpen(false)
      fetchQueues()
    } catch (e) {
      alert('Gagal menyimpan data vital signs')
    } finally {
      setSaving(false)
    }
  }

  const StatusPill = ({ status }: { status: string }) => {
    const map: any = {
      waiting: { label: 'MENUNGGU', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
      called: { label: 'DIPANGGIL', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
      triage: { label: 'PEMERIKSAAN AWAL', cls: 'bg-primary/10 text-primary border-primary/20' },
      ready: { label: 'SIAP PERIKSA DOKTER', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      ongoing: { label: 'DALAM PEMERIKSAAN', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    }
    const s = map[status] || map.waiting
    return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
  }

  return (
    <div className="p-6 mx-auto pb-20 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl"><FiActivity className="text-primary" /></div>
             Nurse Station / Triage
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Pemeriksaan Tanda Vital & Keluhan Awal Pasien</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {/* SOUND TOGGLE */}
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              isSoundEnabled 
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
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



      {/* FILTER BAR */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <FiFilter className="w-3.5 h-3.5" /> Filter Dokter:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDoctorId('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filterDoctorId === 'all'
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-gray-400 border-gray-100 hover:border-primary/30 hover:text-primary'
            }`}
          >
            Semua Dokter
          </button>
          {Array.from(
            new Map(queues.filter(q => q.doctor).map(q => [q.doctor!.name, q.doctorId])).entries()
          ).map(([name, id]) => (
            <button
              key={id}
              onClick={() => setFilterDoctorId(id || 'all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filterDoctorId === id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {name}
            </button>
          ))}
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
            <div className="bg-primary text-white rounded-2xl shadow-2xl shadow-primary/40 px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiVolume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Pemanggilan</p>
                <p className="text-lg font-black uppercase leading-tight truncate">
                  {toast.queueNo} — {toast.name}
                </p>
              </div>
              <button onClick={() => setToast(null)} className="text-xs font-black opacity-60 hover:opacity-100 transition-opacity">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Kolom Kiri: Data Pasien Triage */}
        <div className="flex-1 w-full grid grid-cols-1 gap-4 max-w-4xl">
        {queues.filter(q => filterDoctorId === 'all' || q.doctorId === filterDoctorId).map((q, i) => (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-900">
                <p className="text-[8px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">NO</p>
                <p className="text-xl font-black tracking-tight leading-none">{q.queueNo}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                   <StatusPill status={q.status} />
                </div>
                <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{q.patient.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <FiHome className="w-3 h-3" /> {q.department?.name || 'UMUM'}
                  </p>
                  <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <FiUser className="w-3 h-3" /> {q.doctor?.name || 'Dokter Jaga'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleCallPatient(q)}
                className={`px-4 py-3.5 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  q.status === 'called' ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-white border border-gray-100 text-gray-400 hover:text-primary'
                }`}
              >
                <FiVolume2 className="w-4 h-4" /> {q.status === 'called' ? 'PANGGIL ULANG' : 'PANGGIL'}
              </button>

              <button 
                onClick={() => openTriage(q)}
                className={`flex-1 px-6 py-3.5 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  (q.status === 'ready' || q.hasMedicalRecord)
                    ? 'bg-amber-400 text-white hover:bg-amber-500 shadow-amber-200/50'
                    : 'bg-primary text-white hover:bg-indigo-700 shadow-primary/20'
                }`}
              >
                 {(q.status === 'ready' || q.hasMedicalRecord) ? (
                   <>
                     <FiActivity className="w-4 h-4" /> EDIT DATA VITAL
                   </>
                 ) : (
                   <>
                     <FiClipboard className="w-4 h-4" /> AMBIL TANDA VITAL
                   </>
                 )}
              </button>
            </div>
          </motion.div>
        ))}

        {queues.length === 0 && !loading && (
          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Tidak ada pasien yang menunggu pemeriksaan awal</p>
          </div>
        )}
        </div>

        {/* Kolom Kanan: Card Shortcut (Sejajar Data Pasien) */}
        <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 lg:sticky lg:top-8">
          <div className="bg-gradient-to-br from-gray-900 to-indigo-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
            <div className="relative z-10 space-y-3 md:space-y-4">
              <FiMonitor className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-80" />
              <h3 className="text-lg md:text-xl font-black leading-tight">Display Monitor <br />Antrean</h3>
              <p className="text-[9px] md:text-xs text-white/60 font-medium">Buka menu layar antrean untuk memanggil pasien dan memantau urutan antrean keseluruhan.</p>
              <Link href="/admin/transactions/queue" className="inline-flex items-center gap-2 text-[9px] md:text-xs font-black bg-white text-gray-900 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl hover:bg-primary hover:text-white transition-all mt-2">
                BUKA LAYAR ANTREAN <FiArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MasterModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="Pemeriksaan Tanda Vital & Keluhan"
        size="3xl"
      >
        <div className="space-y-5">
          {/* Patient Info Header - Compact & Professional */}
          {selectedQueue && (
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xl flex items-center justify-between border-b-4 border-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                  <FiUser className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Identitas Pasien</p>
                  <h3 className="text-sm font-black tracking-tight">{selectedQueue.patient.name}</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{selectedQueue.patient.medicalRecordNo} • {selectedQueue.patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Unit Layanan</p>
                <h3 className="text-sm font-black uppercase">{selectedQueue.department?.name || 'Umum'}</h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Antrean: {selectedQueue.queueNo}</p>
              </div>
            </div>
          )}

          {/* Patient Allergy Warning & Input */}
          {selectedQueue && (
            <div className={`rounded-xl p-4 flex items-start gap-3 border-2 transition-all duration-300 ${
              form.allergies 
                ? 'bg-rose-50 border-rose-200 shadow-sm' 
                : 'bg-amber-50 border-amber-200 border-dashed'
            }`}>
              <FiAlertCircle className={`w-6 h-6 shrink-0 mt-0.5 ${form.allergies ? 'text-rose-600 animate-pulse' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-black uppercase tracking-widest mb-2 ${form.allergies ? 'text-rose-800' : 'text-amber-800'}`}>
                  Riwayat Alergi Pasien
                </h4>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => setForm({...form, allergies: e.target.value})}
                  placeholder="Contoh: Amoxicillin, Seafood, Debu (Kosongkan jika tidak ada)"
                  className={`w-full px-4 py-2.5 text-sm border-2 rounded-xl focus:outline-none focus:ring-4 font-bold placeholder:font-medium transition-all shadow-inner ${
                    form.allergies 
                      ? 'border-rose-200 bg-white text-rose-700 focus:border-rose-400 focus:ring-rose-100 placeholder:text-rose-300' 
                      : 'border-amber-200 bg-white text-amber-900 focus:border-amber-400 focus:ring-amber-100 placeholder:text-amber-300/70'
                  }`}
                />
                {!form.allergies && (
                  <p className="text-xs font-bold text-amber-700 mt-2.5 leading-relaxed bg-amber-100/50 p-2 rounded-lg inline-block">
                    ⚠️ Data alergi belum tercatat. Mohon pastikan dengan menanyakan langsung ke pasien demi keamanan tindakan medis.
                  </p>
                )}
                <p className={`text-[10px] font-bold mt-2.5 ${form.allergies ? 'text-rose-600/80' : 'text-amber-700/80'} leading-relaxed`}>
                  *Catatan: Anda dapat merubah/menambah riwayat alergi di atas. Perubahan akan otomatis tersimpan ke profil pasien dan diteruskan ke dokter pemeriksa saat Anda menyimpan form triage ini.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Chief Complaint Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1 px-1">
                <FiClipboard className="text-primary w-4 h-4" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">Keluhan & Anamnesa Awal</h3>
              </div>
              <textarea 
                value={form.chiefComplaint}
                onChange={(e) => setForm({...form, chiefComplaint: e.target.value})}
                className="w-full px-4 py-3 text-sm border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-slate-300 text-slate-700 resize-none h-20 shadow-inner leading-relaxed"
                placeholder="Tuliskan keluhan utama dan riwayat singkat pasien..."
              />
            </div>

            {/* Vitals Grid - Metric Card Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                <FiActivity className="text-primary w-4 h-4" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">Pemeriksaan Fisik / Tanda Vital</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Weight */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Berat Badan</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.1" value={form.vitals.weight}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, weight: e.target.value}})}
                      className="w-full pl-0 pr-8 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">kg</span>
                  </div>
                </div>

                {/* Height */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tinggi Badan</label>
                  <div className="relative">
                    <input 
                      type="number" value={form.vitals.height}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, height: e.target.value}})}
                      className="w-full pl-0 pr-8 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="0"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">cm</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Suhu Tubuh</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.1" value={form.vitals.temperature}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, temperature: e.target.value}})}
                      className="w-full pl-0 pr-8 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="36.5"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">°C</span>
                  </div>
                </div>

                {/* Blood Pressure */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tekanan Darah</label>
                  <div className="relative">
                    <input 
                      type="text" value={form.vitals.bloodPressure}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, bloodPressure: e.target.value}})}
                      className="w-full pl-0 pr-14 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="120/80"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">mmHg</span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Detak Jantung</label>
                  <div className="relative">
                    <input 
                      type="number" value={form.vitals.heartRate}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, heartRate: e.target.value}})}
                      className="w-full pl-0 pr-10 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="80"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">bpm</span>
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Laju Nafas</label>
                  <div className="relative">
                    <input 
                      type="number" value={form.vitals.respiratoryRate}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, respiratoryRate: e.target.value}})}
                      className="w-full pl-0 pr-12 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="20"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">x/mnt</span>
                  </div>
                </div>

                {/* Blood Oxygen */}
                <div className="group space-y-1.5 p-3.5 bg-white border-2 border-slate-50 rounded-xl hover:border-primary/30 transition-all shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saturasi O2</label>
                  <div className="relative">
                    <input 
                      type="number" value={form.vitals.bloodOxygen}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, bloodOxygen: e.target.value}})}
                      className="w-full pl-0 pr-8 py-1 text-lg font-black text-slate-900 bg-transparent border-none focus:ring-0 outline-none"
                      placeholder="98"
                    />
                    <span className="absolute right-0 bottom-2 text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nurse Notes */}
            <div className="space-y-2 pt-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Catatan Tambahan Perawat</label>
              <textarea 
                value={form.vitals.notes}
                onChange={(e) => setForm({...form, vitals: {...form.vitals, notes: e.target.value}})}
                className="w-full px-4 py-3 text-xs border-2 border-slate-100 bg-slate-50/30 rounded-xl focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-slate-300 text-slate-700 resize-none h-16 shadow-inner"
                placeholder="Catatan tambahan (misal: kondisi sadar, gcs, dll)..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t-2 border-slate-50 mt-4">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleSaveVitals} 
              disabled={saving || !form.chiefComplaint}
              className="flex-[2] py-3 bg-primary text-white rounded-xl text-[11px] font-black tracking-[0.2em] uppercase shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>Simpan & Kirim ke Dokter</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
