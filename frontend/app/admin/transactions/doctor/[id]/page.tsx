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
  const { user, activeClinicId } = useAuthStore()
  
  const [queue, setQueue] = useState<Queue | null>(null)
  const [loading, setLoading] = useState(true)
  const [medicines, setMedicines] = useState<Medicine[]>([])
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
  const [services, setServices] = useState<Service[]>([])
  const [activeSegment, setActiveSegment] = useState<'nurse' | 'diag' | 'tindakan' | 'lab' | 'rx' | 'history'>('nurse')
  const [searchMed, setSearchMed] = useState('')
  const [searchService, setSearchService] = useState('')

  const latestVitals = useMemo(() => {
    return medicalRecord?.vitals?.[0] || null
  }, [medicalRecord])


  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      // Fetch specific queue
      const qRes = await api.get(`/transactions/queues/${id}`)
      const qData = qRes.data
      setQueue(qData)

      // Fetch draft medical record
      if (qData.registrationId) {
        const { data } = await api.get(`/transactions/medical-records/registration/${qData.registrationId}`)
        setMedicalRecord(data)
        if (data) {
          setDiagnosis(data.diagnosis || '')
          setTreatmentPlan(data.treatmentPlan || '')
          setLabNotes(data.labNotes || '')
          setLabResults(data.labResults || '')
          setNotes(data.notes || '')
          // Load existing saved prescriptions for review
          if (data.prescriptions && data.prescriptions.length > 0) {
            const savedItems = data.prescriptions.flatMap((rx: any) =>
              rx.items.map((item: any) => ({
                medicineId: item.medicineId,
                name: item.medicine?.medicineName || 'Obat tidak dikenal',
                quantity: item.quantity,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions || ''
              }))
            )
            setPrescriptionItems(savedItems)
          }

          // [NEW] Restore Consultation Draft if exists
          if (data.consultationDraft) {
             const draft = data.consultationDraft;
             if (draft.prescriptions) setPrescriptionItems(draft.prescriptions);
             if (draft.services) setServiceItems(draft.services);
          }
        }

        // [NEW] Fetch patient medical history - Move outside if(data) to always load history
        if (qData.patientId) {
          const historyRes = await api.get(`/transactions/medical-records/patient/${qData.patientId}`)
          // Filter out current session's record if it exists
          setHistory(historyRes.data.filter((h: any) => h.id !== data?.id))
        }
      }

      // Fetch medicines for prescription
      const medRes = await api.get('/master/products', { params: { isActive: true } })
      setMedicines(medRes.data)

      // Fetch services for tindakan
      const svcRes = await api.get('/master/services', { params: { isActive: true } })
      setServices(svcRes.data)

    } catch (e) {
      console.error('Failed to fetch data', e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addPrescription = (m: Medicine) => {
    // Only allow items that are formally registered as clinical medicines
    if (!m.medicineId) return;

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

  const removePrescription = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index))
  }

  const addServiceItem = (s: Service) => {
    // Avoid duplicates
    if (serviceItems.find(item => item.serviceId === s.id)) return;
    setServiceItems([...serviceItems, {
      serviceId: s.id,
      name: s.serviceName,
      code: s.serviceCode,
      price: s.price,
      quantity: 1
    }])
    setSearchService('')
  }

  const removeServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index))
  }

  const handleSaveConsultation = async (isFinal: boolean = true) => {
    if (!queue || !medicalRecord) return
    setSaving(true)
    try {
      await api.post('/transactions/medical-records/doctor', {
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
      
      if (isFinal) {
        router.push('/admin/transactions/doctor')
      } else {
        alert('Draft pemeriksaan berhasil disimpan.')
      }
    } catch (e) {
      alert(isFinal ? 'Gagal menyimpan hasil konsultasi' : 'Gagal menyimpan draft')
    } finally {
      setSaving(false)
    }
  }

  const filteredMedicines = useMemo(() => {
    // Only show products linked to clinical medicine definitions for prescriptions
    const clinicalMedicines = medicines.filter(m => m.medicineId)
    
    if (!searchMed) return []
    const lowerSearch = searchMed.toLowerCase()
    return clinicalMedicines.filter(m => 
      m.masterName.toLowerCase().includes(lowerSearch) || 
      m.masterCode.toLowerCase().includes(lowerSearch) ||
      m.medicine?.genericName?.toLowerCase().includes(lowerSearch)
    )
  }, [medicines, searchMed])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiRefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">Memuat Data Konsultasi...</p>
        </div>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-lg font-black text-gray-900">Pasien Tidak Ditemukan</p>
          <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-bold hover:underline">Kembali ke Daftar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* PROFESSIONAL TOP HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-[6px] h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-[1px] bg-slate-200" />
            <div className="text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">{queue.patient.name}</h1>
                <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 uppercase">
                  {queue.patient.medicalRecordNo}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 uppercase">
                  {queue.patient.gender === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {queue.department?.name || 'UMUM'} • CABANG: {user?.clinics?.find(c => c.id === activeClinicId)?.name || 'Unit Klinik Pusat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {queue.status === 'completed' ? (
               <span className="flex items-center gap-2 px-8 py-3.5 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black tracking-widest uppercase">
                 ✓ KONSULTASI SELESAI — Hanya Baca
               </span>
             ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleSaveConsultation(false)}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black tracking-widest uppercase hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <FiRotateCcw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  SIMPAN DRAFT
                </button>
                <button 
                  onClick={() => handleSaveConsultation(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave className="w-4 h-4" />}
                  SIMPAN HASIL KONSULTASI
                </button>
              </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-[6px] py-8 grid grid-cols-12 gap-8">
        {/* LEFT COLUMN: NAVIGATION & SUMMARY */}
        <div className="col-span-3 space-y-6">
           {/* SEGMENT NAVIGATION */}
           <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-28">
              {[
                { id: 'history', label: 'Riwayat Pasien', icon: <FiRotateCcw /> },
                { id: 'nurse', label: 'Nurse Handover', icon: <FiClipboard /> },
                { id: 'diag', label: 'Diagnosa & SOAP', icon: <FiActivity /> },
                { id: 'tindakan', label: 'Tindakan Medis', icon: <FiCheckCircle /> },
                { id: 'lab', label: 'Laboratorium', icon: <FiThermometer /> },
                { id: 'rx', label: 'Resep Obat (Rx)', icon: <FiPackage /> },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSegment(s.id as any)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black transition-all duration-300 mb-2 relative group ${
                    activeSegment === s.id 
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] scale-[1.02]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <span className={`text-xl transition-transform duration-300 ${activeSegment === s.id ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`}>{s.icon}</span>
                  <span className="uppercase tracking-[0.15em]">{s.label}</span>
                  {activeSegment === s.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                    />
                  )}
                </button>
              ))}
           </div>

           {/* VITALS SUMMARY CARD */}
           {latestVitals && (
             <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50 shadow-inner text-left">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-6 flex items-center gap-2 opacity-60">
                   <FiActivity className="w-3 h-3" /> Ringkasan Vital Sign
                </h4>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tekanan Darah</p>
                       <div className="flex items-center gap-2 text-slate-800">
                          <FiHeart className="w-3 h-3 text-rose-500" />
                          <p className="text-sm font-black">{latestVitals.bloodPressure || '-'} <span className="text-[9px] text-slate-400">mmHg</span></p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Suhu Tubuh</p>
                       <div className="flex items-center gap-2 text-slate-800">
                          <FiThermometer className="w-3 h-3 text-orange-500" />
                          <p className="text-sm font-black">{latestVitals.temperature || '-'} <span className="text-[9px] text-slate-400">°C</span></p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Detak Jantung</p>
                       <div className="flex items-center gap-2 text-slate-800">
                          <FiActivity className="w-3 h-3 text-red-500" />
                          <p className="text-sm font-black">{latestVitals.heartRate || '-'} <span className="text-[9px] text-slate-400">bpm</span></p>
                       </div>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pernapasan</p>
                       <div className="flex items-center gap-2 text-slate-800">
                          <FiWind className="w-3 h-3 text-blue-500" />
                          <p className="text-sm font-black">{latestVitals.respiratoryRate || '-'} <span className="text-[9px] text-slate-400">/m</span></p>
                       </div>
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* RIGHT COLUMN: MAIN WORKSPACE */}
        <div className="col-span-9">
           <AnimatePresence mode="wait">
              {activeSegment === 'nurse' && (
                <motion.div 
                   key="nurse" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-8 text-left"
                >
                   <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-100"><FiClipboard /></div>
                         Laporan Handover Perawat (Triage)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Keluhan Utama Pasien</p>
                            <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 italic text-base text-slate-600 font-medium leading-relaxed relative min-h-[180px]">
                               <div className="absolute top-4 left-4 text-7xl text-slate-100 font-black opacity-40 leading-none">“</div>
                               <div className="relative z-10">{medicalRecord?.chiefComplaint || 'Tidak ada catatan keluhan spesifik dari perawat.'}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
                            {[
                               { label: 'Tinggi Badan', value: latestVitals?.height, unit: 'cm' },
                               { label: 'Berat Badan', value: latestVitals?.weight, unit: 'kg' },
                               { label: 'Saturasi O2', value: latestVitals?.bloodOxygen, unit: '%' },
                               { label: 'Tekanan Darah', value: latestVitals?.bloodPressure, unit: 'mmHg' },
                            ].map((item, i) => (
                               <div key={i}>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{item.value || '-'} <span className="text-[11px] font-bold text-slate-400 opacity-60 ml-1">{item.unit}</span></p>
                                </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSegment === 'diag' && (
                <motion.div 
                   key="diag" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-8 text-left"
                >
                   <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><FiActivity /></div>
                         Diagnosa & Rencana Pengobatan
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-3 px-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Diagnosa Medis (ICD-10)</label>
                            <textarea 
                               value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                               readOnly={queue.status === 'completed'}
                               placeholder={queue.status === 'completed' ? 'Belum diisi saat konsultasi' : 'Tulis diagnosa dokter di sini...'}
                               className={`w-full p-10 border rounded-[2.5rem] text-sm font-bold outline-none transition-all min-h-[250px] shadow-inner ${
                                 queue.status === 'completed'
                                   ? 'bg-slate-50/50 border-slate-100 text-slate-600 cursor-default placeholder:text-slate-300'
                                   : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-200'
                               }`}
                            />
                         </div>
                         <div className="space-y-3 px-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Rencana Tindakan Medis</label>
                            <textarea 
                               value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)}
                               readOnly={queue.status === 'completed'}
                               placeholder={queue.status === 'completed' ? 'Belum diisi saat konsultasi' : 'Rencana pengobatan, edukasi, atau tindakan...'}
                               className={`w-full p-10 border rounded-[2.5rem] text-sm font-bold outline-none transition-all min-h-[250px] shadow-inner ${
                                 queue.status === 'completed'
                                   ? 'bg-slate-50/50 border-slate-100 text-slate-600 cursor-default placeholder:text-slate-300'
                                   : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-200'
                               }`}
                            />
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSegment === 'tindakan' && (
                <motion.div 
                   key="tindakan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-8 text-left"
                >
                   <div className="bg-emerald-50/30 p-12 rounded-[4rem] border border-emerald-100/30">
                      <div className="flex items-center justify-between mb-12 border-b border-emerald-100/50 pb-8">
                         <h3 className="text-sm font-black text-emerald-800 tracking-[0.2em] uppercase flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200"><FiCheckCircle /></div>
                            Tindakan Medis (Billing)
                         </h3>
                         {queue.status !== 'completed' && (
                           <div className="relative">
                              <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[2.5rem] border border-emerald-200 shadow-sm ring-8 ring-emerald-50/30 group focus-within:ring-emerald-100 transition-all">
                                 <FiSearch className="text-emerald-400 w-5 h-5" />
                                 <input 
                                    value={searchService} 
                                    onChange={(e) => setSearchService(e.target.value)}
                                    placeholder="Cari Layanan / Tindakan..." 
                                    className="bg-transparent text-sm font-black focus:outline-none w-[380px] text-emerald-900 placeholder:text-emerald-200" 
                                 />
                                 {searchService && (
                                     <button onClick={() => setSearchService('')} className="text-emerald-300 hover:text-emerald-600 transition-colors"><FiRefreshCw className="w-4 h-4" /></button>
                                 )}
                              </div>
                              <AnimatePresence>
                                {searchService && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-6 w-[520px] bg-white border border-emerald-100 rounded-[3.5rem] shadow-2xl z-20 py-8 divide-y divide-emerald-50 max-h-[450px] overflow-y-auto custom-scrollbar"
                                  >
                                     {services.filter(s => 
                                       s.serviceName.toLowerCase().includes(searchService.toLowerCase()) ||
                                       s.serviceCode.toLowerCase().includes(searchService.toLowerCase())
                                     ).slice(0, 10).map(s => (
                                       <button 
                                          key={s.id} onClick={() => addServiceItem(s)} 
                                          className="w-full flex items-center gap-8 px-10 py-6 hover:bg-emerald-50/50 text-left transition-all group"
                                       >
                                          <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                                             <FiCheckCircle className="w-7 h-7" />
                                          </div>
                                          <div className="flex-1">
                                             <div className="flex items-center justify-between mb-1">
                                                <p className="text-base font-black text-slate-900 uppercase leading-none group-hover:text-emerald-600 transition-colors">{s.serviceName}</p>
                                                <span className="text-[12px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full">
                                                  Rp {s.price.toLocaleString('id-ID')}
                                                </span>
                                             </div>
                                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.serviceCategory?.categoryName || 'Layanan Umum'} • {s.serviceCode}</p>
                                          </div>
                                       </button>
                                     ))}
                                     {services.filter(s => s.serviceName.toLowerCase().includes(searchService.toLowerCase())).length === 0 && (
                                       <div className="py-20 text-center">
                                         <FiAlertCircle className="w-12 h-12 text-emerald-100 mx-auto mb-4"/>
                                         <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Layanan Tidak Ditemukan</p>
                                       </div>
                                     )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                           </div>
                         )}
                      </div>

                      <div className="space-y-4">
                         {serviceItems.map((item, idx) => (
                           <motion.div 
                             key={idx}
                             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                             className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center gap-6 justify-between"
                           >
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                    <FiCheckCircle className="w-6 h-6"/>
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.code}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Qty</span>
                                    {queue.status === 'completed' ? (
                                      <span className="w-16 text-center text-base font-black text-slate-700">{item.quantity}x</span>
                                    ) : (
                                      <input 
                                         type="number" min="1" value={item.quantity}
                                         onChange={(e) => {
                                           const newItems = [...serviceItems];
                                           newItems[idx].quantity = parseInt(e.target.value) || 1;
                                           setServiceItems(newItems);
                                         }}
                                         className="w-16 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-base font-black text-center focus:border-emerald-400 outline-none"
                                      />
                                    )}
                                 </div>
                                 <div className="text-right min-w-[120px]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                                    <p className="text-base font-black text-emerald-600">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                                 </div>
                                 {queue.status !== 'completed' && (
                                   <button onClick={() => removeServiceItem(idx)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100">
                                     <FiTrash2 className="w-4 h-4"/>
                                   </button>
                                 )}
                              </div>
                           </motion.div>
                         ))}

                         {serviceItems.length === 0 && (
                           <div className="py-32 text-center border-4 border-dashed border-emerald-100 rounded-[4rem] bg-white">
                              <FiCheckCircle className="w-16 h-16 mx-auto mb-6 text-emerald-50" />
                              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-200">Belum Ada Tindakan</p>
                              <p className="text-xs font-bold text-slate-400 mt-3">
                                {queue.status === 'completed' ? 'Tidak ada tindakan yang dicatat' : 'Cari dan tambahkan layanan/tindakan di atas'}
                              </p>
                           </div>
                         )}

                         {serviceItems.length > 0 && (
                           <div className="mt-6 p-6 bg-emerald-600 rounded-[2rem] text-white flex items-center justify-between">
                             <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{serviceItems.length} Tindakan • Total Billing</p>
                             <p className="text-2xl font-black">
                               Rp {serviceItems.reduce((sum, s) => sum + s.price * s.quantity, 0).toLocaleString('id-ID')}
                             </p>
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSegment === 'lab' && (
                <motion.div 
                   key="lab" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-8 text-left"
                >
                   <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                         <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100"><FiThermometer /></div>
                         Instrumen Laboratorium
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <div className="space-y-3 px-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Permintaan Laboratorium</label>
                            <textarea 
                               value={labNotes} onChange={(e) => setLabNotes(e.target.value)}
                               readOnly={queue.status === 'completed'}
                               placeholder={queue.status === 'completed' ? 'Belum diisi saat konsultasi' : 'Jenis pemeriksaan laboratorium yang diminta...'}
                               className={`w-full p-10 border rounded-[2.5rem] text-sm font-bold outline-none transition-all min-h-[250px] shadow-inner ${
                                 queue.status === 'completed'
                                   ? 'bg-slate-50/50 border-slate-100 text-slate-600 cursor-default placeholder:text-slate-300'
                                   : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 placeholder:text-slate-200'
                               }`}
                            />
                         </div>
                         <div className="space-y-3 px-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Hasil / Interpretasi Lab</label>
                            <textarea 
                               value={labResults} onChange={(e) => setLabResults(e.target.value)}
                               readOnly={queue.status === 'completed'}
                               placeholder={queue.status === 'completed' ? 'Belum diisi saat konsultasi' : 'Hasil pemeriksaan atau catatan lab...'}
                               className={`w-full p-10 border rounded-[2.5rem] text-sm font-bold outline-none transition-all min-h-[250px] shadow-inner ${
                                 queue.status === 'completed'
                                   ? 'bg-slate-50/50 border-slate-100 text-slate-600 cursor-default placeholder:text-slate-300'
                                   : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 placeholder:text-slate-200'
                               }`}
                            />
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSegment === 'rx' && (
                <motion.div 
                   key="rx" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                   className="space-y-8 text-left"
                >
                   <div className="bg-rose-50/30 p-12 rounded-[4rem] border border-rose-100/30">
                      <div className="flex items-center justify-between mb-12 border-b border-rose-100/50 pb-8">
                         <h3 className="text-sm font-black text-rose-800 tracking-[0.2em] uppercase flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200"><FiPackage /></div>
                            Instruksi Resep Obat (Rx)
                         </h3>
                         <div className="relative">
                            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[2.5rem] border border-rose-200 shadow-sm ring-8 ring-rose-50/30 group focus-within:ring-rose-100 transition-all">
                               <FiSearch className="text-rose-400 w-5 h-5" />
                               <input 
                                  value={searchMed} 
                                  onChange={(e) => setSearchMed(e.target.value)}
                                  placeholder="Ketik Nama Obat / Generik..." 
                                  className="bg-transparent text-sm font-black focus:outline-none w-[400px] text-rose-900 placeholder:text-rose-200" 
                               />
                               {searchMed && (
                                   <button onClick={() => setSearchMed('')} className="text-rose-300 hover:text-rose-600 transition-colors"><FiRefreshCw className="w-4 h-4" /></button>
                               )}
                            </div>
                            
                            <AnimatePresence>
                               {searchMed && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                   className="absolute right-0 top-full mt-6 w-[550px] bg-white border border-rose-100 rounded-[3.5rem] shadow-2xl z-20 py-8 divide-y divide-rose-50 max-h-[500px] overflow-y-auto custom-scrollbar"
                                 >
                                    {filteredMedicines.length > 0 ? (
                                      filteredMedicines.slice(0, 10).map(m => (
                                        <button 
                                           key={m.id} onClick={() => addPrescription(m)} 
                                           className="w-full flex items-center gap-8 px-10 py-8 hover:bg-rose-50/50 text-left transition-all group"
                                        >
                                           <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-sm ${m.stock > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-300 border border-rose-100 opacity-60'}`}>
                                              <FiPackage className="w-10 h-10" />
                                           </div>
                                           <div className="flex-1">
                                              <div className="flex items-center justify-between mb-2">
                                                 <p className="text-lg font-black text-slate-900 uppercase leading-none group-hover:text-rose-600 transition-colors">{m.masterName}</p>
                                                 <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${m.stock > 0 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-300 border-rose-100 bg-rose-50'}`}>
                                                    {m.stock > 0 ? `STOK: ${m.stock} ${m.unit || ''}` : 'STOK KOSONG'}
                                                 </span>
                                              </div>
                                              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4 leading-none">{m.medicine?.genericName || 'Obat Non-Generik'}</p>
                                              <div className="flex items-center gap-4">
                                                 <span className="text-[10px] font-black text-rose-500 bg-rose-100 px-4 py-1.5 rounded-full uppercase tracking-tighter">{m.medicine?.dosageForm || 'Umum'}</span>
                                                 <span className="text-[10px] font-black text-slate-300 uppercase">{m.masterCode}</span>
                                              </div>
                                           </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="py-24 text-center">
                                         <FiAlertCircle className="w-16 h-16 text-rose-100 mx-auto mb-6" />
                                         <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Data Obat Tidak Ditemukan</p>
                                      </div>
                                    )}
                                 </motion.div>
                               )}
                            </AnimatePresence>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                         {prescriptionItems.map((item, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                              key={idx} className="bg-white p-12 rounded-[3.5rem] border border-rose-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                            >
                               <div className="absolute top-6 right-6">
                                  <button onClick={() => removePrescription(idx)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100"><FiTrash2 /></button>
                               </div>

                               <div className="flex gap-8 mb-10">
                                  <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-2xl font-black text-rose-600 border border-rose-100 italic shadow-inner">R /</div>
                                  <div className="pt-2">
                                     <p className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">{item.name}</p>
                                     <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-3">
                                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Jumlah</span>
                                           <input 
                                              type="number" value={item.quantity} 
                                              onChange={(e) => {
                                                const newItems = [...prescriptionItems];
                                                newItems[idx].quantity = e.target.value;
                                                setPrescriptionItems(newItems);
                                              }}
                                              className="w-24 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-base font-black focus:border-rose-400 outline-none transition-all shadow-inner" 
                                           />
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Dosis</span>
                                           <input 
                                              type="text" value={item.dosage} placeholder="500mg"
                                              onChange={(e) => {
                                                const newItems = [...prescriptionItems];
                                                newItems[idx].dosage = e.target.value;
                                                setPrescriptionItems(newItems);
                                              }}
                                              className="w-28 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-base font-black focus:border-rose-400 outline-none transition-all shadow-inner" 
                                           />
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-6 border-t border-rose-50 pt-10 mt-2">
                                  <div className="space-y-3">
                                     <p className="text-[10px] font-black text-rose-800/40 uppercase ml-4 tracking-[0.2em]">Frekuensi</p>
                                     <input 
                                        placeholder="3x1" value={item.frequency}
                                        onChange={(e) => {
                                          const newItems = [...prescriptionItems];
                                          newItems[idx].frequency = e.target.value;
                                          setPrescriptionItems(newItems);
                                        }}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-black focus:border-rose-400 focus:bg-white outline-none transition-all shadow-inner"
                                     />
                                  </div>
                                  <div className="space-y-3">
                                     <p className="text-[10px] font-black text-rose-800/40 uppercase ml-4 tracking-[0.2em]">Durasi</p>
                                     <input 
                                        placeholder="5 hari" value={item.duration}
                                        onChange={(e) => {
                                          const newItems = [...prescriptionItems];
                                          newItems[idx].duration = e.target.value;
                                          setPrescriptionItems(newItems);
                                        }}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-black focus:border-rose-400 focus:bg-white outline-none transition-all shadow-inner"
                                     />
                                  </div>
                                  <div className="space-y-3">
                                     <p className="text-[10px] font-black text-rose-800/40 uppercase ml-4 tracking-[0.2em]">Aturan</p>
                                     <input 
                                        placeholder="Sesudah makan" value={item.instructions}
                                        onChange={(e) => {
                                          const newItems = [...prescriptionItems];
                                          newItems[idx].instructions = e.target.value;
                                          setPrescriptionItems(newItems);
                                        }}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-black focus:border-rose-400 focus:bg-white outline-none transition-all shadow-inner"
                                     />
                                  </div>
                               </div>
                            </motion.div>
                         ))}
                         
                         {prescriptionItems.length === 0 && (
                           <div className="col-span-1 xl:col-span-2 py-40 text-center border-4 border-dashed border-rose-100 rounded-[5rem] bg-white">
                              <FiPackage className="w-20 h-20 mx-auto mb-8 text-rose-50" />
                              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-200">Daftar Resep Kosong</p>
                              <p className="text-xs font-bold text-slate-400 mt-4">Silakan cari obat pada kolom pencarian di atas</p>
                           </div>
                         )}
                      </div>
                   </div>
                </motion.div>
              )}

              {activeSegment === 'history' && (
                <motion.div 
                   key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                   className="space-y-10 text-left"
                >
                   <div className="flex items-center justify-between px-4">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100"><FiRotateCcw /></div>
                         Arsip Riwayat Medis Pasien
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 italic">
                         {history.length} Kunjungan Sebelumnya Ditemukan
                      </p>
                   </div>

                   <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-200 before:via-slate-100 before:to-transparent">
                      {history.map((h, i) => (
                        <motion.div 
                          key={h.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative group"
                        >
                           {/* Timeline Indicator */}
                           <div className="absolute -left-[30px] top-4 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)] z-10 group-hover:scale-125 transition-transform" />
                           
                           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 overflow-hidden relative">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl" />
                              
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-50 pb-6">
                                 <div>
                                    <div className="flex items-center gap-3 mb-1">
                                       <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                          {new Date(h.recordDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                       </p>
                                       <span className="text-[10px] font-bold text-slate-300">•</span>
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.recordNo}</p>
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                       <FiUser className="text-slate-300" /> {h.doctor?.name || 'Dokter Umum'}
                                    </h4>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black border border-slate-100">
                                       BP: {h.vitals?.[0]?.bloodPressure || '-'}
                                    </span>
                                    <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black border border-slate-100">
                                       Suhu: {h.vitals?.[0]?.temperature || '-'}°C
                                    </span>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="space-y-6">
                                    <div className="space-y-4">
                                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Diagnosis & Terapi
                                       </p>
                                       <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                                          <div>
                                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Diagnosa Dokter:</p>
                                             <p className="text-sm font-bold text-slate-800 leading-relaxed">{h.diagnosis || <span className="text-slate-300 italic">Belum ada diagnosa dokter.</span>}</p>
                                          </div>
                                          {h.treatmentPlan && (
                                            <div className="pt-4 border-t border-slate-100">
                                               <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5">Rencana Terapi:</p>
                                               <p className="text-sm font-bold text-slate-800 leading-relaxed">{h.treatmentPlan}</p>
                                            </div>
                                          )}
                                          <div className="pt-4 border-t border-slate-100">
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Keluhan Utama (Nurse Check):</p>
                                             <p className="text-xs font-semibold text-slate-500 italic">"{h.chiefComplaint || 'Tidak ada catatan keluhan.'}"</p>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Laboratorium Section in History */}
                                    {(h.labNotes || h.labResults) && (
                                       <div className="space-y-4">
                                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                             <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" /> Pemeriksaan Laboratorium
                                          </p>
                                          <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100/50 space-y-4">
                                             {h.labNotes && (
                                               <div>
                                                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Instrumen/Permintaan:</p>
                                                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{h.labNotes}</p>
                                               </div>
                                             )}
                                             {h.labResults && (
                                               <div className={h.labNotes ? "pt-4 border-t border-orange-100/50" : ""}>
                                                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Hasil & Interpretasi:</p>
                                                  <p className="text-xs font-black text-slate-900 leading-relaxed">{h.labResults}</p>
                                               </div>
                                             )}
                                          </div>
                                       </div>
                                    )}

                                    {h.notes && (
                                       <div className="pt-2">
                                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                             <FiEdit3 className="w-3 h-3" /> Catatan Tambahan Dokter
                                          </p>
                                          <p className="text-[11px] font-medium text-slate-500 italic bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{h.notes}</p>
                                       </div>
                                    )}
                                 </div>

                                 <div className="space-y-6">
                                    {/* Resep Obat Section */}
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" /> Resep Obat (Rx)
                                       </p>
                                       <div className="grid grid-cols-1 gap-2">
                                          {h.prescriptions?.flatMap((p: any) => p.items).map((item: any, idx: number) => (
                                             <div key={idx} className="flex items-center gap-3 p-3 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-black shadow-sm">R/</div>
                                                <div>
                                                   <p className="text-[11px] font-black text-slate-800 leading-none">{item.medicine?.medicineName || 'Obat'}</p>
                                                   <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{item.frequency} • {item.dosage} • {item.duration}</p>
                                                </div>
                                             </div>
                                          ))}
                                          {(!h.prescriptions || h.prescriptions.length === 0 || h.prescriptions.flatMap((p: any) => p.items).length === 0) && (
                                             <div className="py-4 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tidak Ada Resep</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>

                                    {/* Tindakan Section */}
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Tindakan Medis
                                       </p>
                                       <div className="flex flex-wrap gap-2">
                                          {h.services?.map((s: any, idx: number) => (
                                             <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                <FiActivity className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{s.service?.serviceName}</span>
                                             </div>
                                          ))}
                                          {(!h.services || h.services.length === 0) && (
                                             <div className="w-full py-4 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tidak Ada Tindakan</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                      ))}

                      {history.length === 0 && (
                         <div className="py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                            <FiRotateCcw className="w-16 h-16 text-slate-50 mx-auto mb-6" />
                            <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-200">Tidak Ada Riwayat Medis</p>
                            <p className="text-xs font-bold text-slate-400 mt-4">Ini mungkin merupakan kunjungan pertama pasien di klinik ini.</p>
                         </div>
                      )}
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      <div className="h-32" />
    </div>
  )
}
