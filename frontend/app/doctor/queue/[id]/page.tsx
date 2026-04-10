'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  FiActivity, FiCheckCircle, FiRefreshCw, FiUser, 
  FiHome, FiAlertCircle, FiClipboard, FiHeart, FiThermometer, FiWind,
  FiEdit3, FiTrash2, FiSearch, FiPackage, FiInfo, FiArrowLeft, FiSave, FiRotateCcw
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { toast } from 'react-hot-toast'

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

interface Service {
  id: string
  serviceCode: string
  serviceName: string
  price: number
  serviceCategory?: { categoryName: string }
}

export default function DoctorConsultationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, token, activeClinicId } = useAuthStore()
  
  const [queue, setQueue] = useState<Queue | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchMedicines, setSearchMedicines] = useState<Medicine[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  
  // Consultation State
  const [medicalRecord, setMedicalRecord] = useState<any>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [labNotes, setLabNotes] = useState('')
  const [labResults, setLabResults] = useState('')
  const [notes, setNotes] = useState('')
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([])
  const [serviceItems, setServiceItems] = useState<any[]>([])
  const [activeSegment, setActiveSegment] = useState<'nurse' | 'diag' | 'tindakan' | 'lab' | 'rx' | 'history'>('nurse')
  const [searchMed, setSearchMed] = useState('')
  const [searchService, setSearchService] = useState('')

  const latestVitals = useMemo(() => {
    return medicalRecord?.vitals?.[0] || null
  }, [medicalRecord])

  const fetchData = useCallback(async () => {
    if (!token || !id) return
    setLoading(true)
    try {
      // Fetch specific queue
      const qRes = await api.get(`transactions/queues/${id}`)
      const qData = qRes.data
      setQueue(qData)

      // Fetch draft medical record
      if (qData.registrationId) {
        const { data } = await api.get(`transactions/medical-records/registration/${qData.registrationId}`)
        setMedicalRecord(data)
        if (data) {
          setDiagnosis(data.diagnosis || '')
          setTreatmentPlan(data.treatmentPlan || '')
          setLabNotes(data.labNotes || '')
          setLabResults(data.labResults || '')
          setNotes(data.notes || '')
          
          if (data.prescriptions && data.prescriptions.length > 0) {
            const savedItems = data.prescriptions.flatMap((rx: any) =>
              rx.items.map((item: any) => ({
                medicineId: item.medicineId,
                name: item.medicine?.medicineName || 'Obat',
                quantity: item.quantity,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions || ''
              }))
            )
            setPrescriptionItems(savedItems)
          }

          if (data.consultationDraft) {
             const draft = data.consultationDraft;
             if (draft.prescriptions) setPrescriptionItems(draft.prescriptions);
             if (draft.services) setServiceItems(draft.services);
          }
        }

        if (qData.patientId) {
          const historyRes = await api.get(`transactions/medical-records/patient/${qData.patientId}`)
          setHistory(historyRes.data.filter((h: any) => h.id !== data?.id))
        }
      }

      // Fetch services for tindakan
      const svcRes = await api.get('master/services', { params: { isActive: true } })
      setAllServices(svcRes.data)

    } catch (e) {
      console.error('Failed to fetch consultation data', e)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Medicine Search Logic
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchMed.length < 2) {
        setSearchMedicines([])
        return
      }
      try {
        const medRes = await api.get('master/products', { params: { isActive: true, search: searchMed } })
        setSearchMedicines(medRes.data.filter((m: any) => m.medicineId))
      } catch (e) {
        console.error('Search aborted')
      }
    }, 300)
    return () => clearTimeout(searchTimeout)
  }, [searchMed])

  const addPrescription = (m: Medicine) => {
    if (!m.medicineId) return
    setPrescriptionItems([...prescriptionItems, {
      medicineId: m.medicineId,
      name: m.masterName,
      quantity: 1,
      dosage: m.medicine?.strength || '',
      frequency: '3x1',
      duration: '5 hari',
      instructions: 'Sesudah makan'
    }])
    setSearchMed('')
  }

  const addServiceItem = (s: Service) => {
    if (serviceItems.find(item => item.serviceId === s.id)) return
    setServiceItems([...serviceItems, {
      serviceId: s.id,
      name: s.serviceName,
      code: s.serviceCode,
      price: s.price,
      quantity: 1
    }])
    setSearchService('')
  }

  const handleSaveConsultation = async (isFinal: boolean = true) => {
    if (!queue || !medicalRecord) return
    setSaving(true)
    const toastId = toast.loading(isFinal ? 'Menyimpan hasil konsultasi...' : 'Menyimpan draft...')
    try {
      await api.post('transactions/medical-records/doctor', {
        queueId: queue.id,
        medicalRecordId: medicalRecord.id,
        diagnosis,
        treatmentPlan,
        labNotes,
        labResults,
        notes,
        services: serviceItems.map(s => ({ serviceId: s.serviceId, quantity: s.quantity, price: s.price })),
        prescriptions: prescriptionItems,
        isFinal
      })
      
      toast.success(isFinal ? 'Pemeriksaan selesai!' : 'Draft disimpan!', { id: toastId })
      if (isFinal) {
        router.push('/doctor/queue')
      }
    } catch (e) {
      toast.error('Gagal menyimpan data', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 lg:ml-64">
        <div className="text-center">
          <FiRefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Inisialisasi Konsultasi...</p>
        </div>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 lg:ml-64">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Pasien Tidak Ditemukan</h2>
          <button onClick={() => router.back()} className="text-primary font-bold hover:underline">Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:ml-64">
      {/* Top Professional Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
              <FiArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">{queue.patient.name}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 uppercase">{queue.patient.medicalRecordNo}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {queue.department?.name || 'UMUM'} • Antrean: {queue.queueNo}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => handleSaveConsultation(false)} disabled={saving} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all">
              SIMPAN DRAFT
            </button>
            <button onClick={() => handleSaveConsultation(true)} disabled={saving} className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
              SELESAI PEMERIKSAAN
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6">
        {/* Navigation Segments */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {[
              { id: 'nurse', label: 'Nurse Handover', icon: <FiClipboard /> },
              { id: 'diag', label: 'SOAP & Diagnosa', icon: <FiActivity /> },
              { id: 'rx', label: 'Resep Obat (Rx)', icon: <FiPackage /> },
              { id: 'tindakan', label: 'Tindakan Medis', icon: <FiCheckCircle /> },
              { id: 'lab', label: 'Laboratorium', icon: <FiThermometer /> },
              { id: 'history', label: 'Riwayat Pasien', icon: <FiRotateCcw /> },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSegment(s.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black transition-all mb-1 ${
                  activeSegment === s.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="uppercase tracking-widest">{s.label}</span>
              </button>
            ))}
          </div>

          {latestVitals && (
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
              <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2 opacity-60">
                <FiActivity className="w-3 h-3" /> Tanda Vital
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">TD</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.bloodPressure || '-'} <span className="text-[9px] opacity-40">mmHg</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">BB/TB</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.weight || '-'}/{latestVitals.height || '-'} <span className="text-[9px] opacity-40">kg/cm</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeSegment === 'nurse' && (
              <motion.div key="nurse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 border-b border-slate-50 pb-6">Keluhan Utama (Handover Perawat)</h3>
                  <div className="p-8 bg-slate-50 rounded-2xl italic text-lg text-slate-600 font-medium leading-relaxed border border-slate-100">
                    "{medicalRecord?.chiefComplaint || 'Tidak ada catatan keluhan.'}"
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'diag' && (
              <motion.div key="diag" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">Diagnosa & Rencana Terapi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diagnosa (ICD-10)</label>
                      <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl min-h-[200px] text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-inner" placeholder="Tuliskan diagnosa medis..." />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rencana Pengobatan</label>
                      <textarea value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl min-h-[200px] text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-inner" placeholder="Rencana tindakan, edukasi, dsb..." />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'rx' && (
              <motion.div key="rx" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Resep Obat (Rx)</h3>
                    <div className="relative w-72">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={searchMed} onChange={(e) => setSearchMed(e.target.value)} placeholder="Cari obat..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:bg-white focus:border-primary" />
                      {searchMedicines.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl mt-2 z-40 max-h-60 overflow-y-auto">
                          {searchMedicines.map(m => (
                            <button key={m.id} onClick={() => addPrescription(m)} className="w-full p-4 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                              <p className="text-xs font-black text-slate-800">{m.masterName}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{m.medicine?.genericName}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {prescriptionItems.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                             <input value={p.frequency} onChange={(e) => { const n = [...prescriptionItems]; n[idx].frequency = e.target.value; setPrescriptionItems(n); }} placeholder="Frekuensi" className="bg-transparent text-[10px] font-black border-b border-slate-200 focus:border-primary outline-none w-16" />
                             <input value={p.instructions} onChange={(e) => { const n = [...prescriptionItems]; n[idx].instructions = e.target.value; setPrescriptionItems(n); }} placeholder="Instruksi" className="bg-transparent text-[10px] font-black border-b border-slate-200 focus:border-primary outline-none w-32" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <input type="number" value={p.quantity} onChange={(e) => { const n = [...prescriptionItems]; n[idx].quantity = e.target.value; setPrescriptionItems(n); }} className="w-16 bg-white border border-slate-200 rounded-lg p-2 text-xs font-black text-center" />
                           <button onClick={() => setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx))} className="text-rose-300 hover:text-rose-600 transition-colors"><FiTrash2 /></button>
                        </div>
                      </div>
                    ))}
                    {prescriptionItems.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <FiPackage className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Daftar Resep Kosong</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other segments omitted for brevity but would follow same pattern */}
            {activeSegment === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">Riwayat Kunjungan</h3>
                   <div className="space-y-6">
                     {history.map((h, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex items-center justify-between mb-4">
                              <p className="text-xs font-black text-indigo-600">{new Date(h.recordDate).toLocaleDateString('id-ID')}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.doctor?.name}</p>
                           </div>
                           <p className="text-sm font-bold text-slate-800">Diagnosa: {h.diagnosis || '-'}</p>
                           <p className="text-xs font-medium text-slate-500 mt-2">Terapi: {h.treatmentPlan || '-'}</p>
                        </div>
                     ))}
                     {history.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300">
                           <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada riwayat kunjungan</p>
                        </div>
                     )}
                   </div>
                </div>
              </motion.div>
            )}
            
            {(activeSegment === 'tindakan' || activeSegment === 'lab') && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-20 rounded-3xl text-center border border-slate-200 text-slate-300">
                  <FiAlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">Modul Sedang Diinisialisasi</p>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
