'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiActivity, FiUsers, FiClock, FiCheckCircle, 
  FiVolume2, FiArrowRight, FiRefreshCw, FiUser, 
  FiHome, FiAlertCircle, FiClipboard, FiHeart, FiThermometer, FiWind
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import MasterModal from '@/components/admin/master/MasterModal'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/transactions'

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
  hasMedicalRecord?: boolean
}

export default function NurseStation() {
  const { token, activeClinicId } = useAuthStore()
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
  
  const [form, setForm] = useState({
    chiefComplaint: '',
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

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  const fetchQueues = useCallback(async () => {
    if (!token || !activeClinicId) return
    try {
      const { data } = await axios.get(`${API}/queues`, { 
        headers, 
        params: { clinicId: activeClinicId } 
      })
      // Only show patients waiting for triage (waiting, called, active triage, OR already ready but not yet ongoing)
      setQueues(data.filter((q: Queue) => ['waiting', 'called', 'triage', 'ready', 'ongoing'].includes(q.status)))
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

  const openTriage = async (q: Queue) => {
    setSelectedQueue(q)
    
    // Default empty form
    const defaultForm = {
      chiefComplaint: '',
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
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/medical-records/registration/${q.registrationId}`, { headers })
        if (data) {
          const v = data.vitals?.[0] || {}
          setForm({
            chiefComplaint: data.chiefComplaint || '',
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
            await axios.patch(`${API}/queues/${q.id}/status`, { status: 'triage' }, { headers })
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
      await axios.post(`${API}/medical-records/nurse`, {
        queueId: selectedQueue.id,
        patientId: selectedQueue.patientId,
        clinicId: selectedQueue.clinicId,
        registrationId: selectedQueue.registrationId,
        doctorId: selectedQueue.doctorId,
        chiefComplaint: form.chiefComplaint,
        vitals: form.vitals
      }, { headers })
      
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
        <button onClick={fetchQueues} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm self-start">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl">
        {queues.map((q, i) => (
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

            <button 
              onClick={() => openTriage(q)}
              className={`px-6 py-3.5 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
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
          </motion.div>
        ))}

        {queues.length === 0 && !loading && (
          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <FiUsers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Tidak ada pasien yang menunggu pemeriksaan awal</p>
          </div>
        )}
      </div>

      {/* Triage Modal */}
      <MasterModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="Pemeriksaan Tanda Vital & Keluhan"
        size="lg"
      >
        <div className="space-y-6">
          {selectedQueue && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Pasien</p>
                <p className="text-sm font-black text-gray-900">{selectedQueue.patient.name} ({selectedQueue.queueNo})</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Tujuan</p>
                <p className="text-sm font-black text-gray-900">{selectedQueue.department?.name || 'Umum'}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Keluhan Utama (Chief Complaint) *</label>
                <textarea 
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({...form, chiefComplaint: e.target.value})}
                  className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-bold placeholder:text-gray-300 text-gray-700 resize-none h-24"
                  placeholder="Ceritakan keluhan utama pasien..."
                />
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiActivity className="w-3 h-3" /> BB (kg)
                   </label>
                   <input 
                      type="number" step="0.1" value={form.vitals.weight}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, weight: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiActivity className="w-3 h-3" /> TB (cm)
                   </label>
                   <input 
                      type="number" value={form.vitals.height}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, height: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiThermometer className="w-3 h-3" /> Suhu (°C)
                   </label>
                   <input 
                      type="number" step="0.1" value={form.vitals.temperature}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, temperature: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiHeart className="w-3 h-3" /> Tensi (syst/diast)
                   </label>
                   <input 
                      type="text" value={form.vitals.bloodPressure} placeholder="120/80"
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, bloodPressure: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiHeart className="w-3 h-3" /> Nadi (bpm)
                   </label>
                   <input 
                      type="number" value={form.vitals.heartRate}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, heartRate: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiWind className="w-3 h-3" /> Resp (bpm)
                   </label>
                   <input 
                      type="number" value={form.vitals.respiratoryRate}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, respiratoryRate: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 px-1">
                      <FiActivity className="w-3 h-3" /> SpO2 (%)
                   </label>
                   <input 
                      type="number" value={form.vitals.bloodOxygen}
                      onChange={(e) => setForm({...form, vitals: {...form.vitals, bloodOxygen: e.target.value}})}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-xl focus:outline-none focus:border-primary font-black"
                   />
                </div>
             </div>

             <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Catatan Tambahan Perawat</label>
                <textarea 
                  value={form.vitals.notes}
                  onChange={(e) => setForm({...form, vitals: {...form.vitals, notes: e.target.value}})}
                  className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-bold placeholder:text-gray-300 text-gray-700 resize-none h-20"
                  placeholder="Catatan jika ada kondisi khusus..."
                />
             </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all">Batal</button>
            <button 
              onClick={handleSaveVitals} 
              disabled={saving || !form.chiefComplaint}
              className="flex-1 py-3 bg-primary text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
            >
                {saving ? 'MENYIMPAN...' : 'SIMPAN & KIRIM KE ANTREAN DOKTER'}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
