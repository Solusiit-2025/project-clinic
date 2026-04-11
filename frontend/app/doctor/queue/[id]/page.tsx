'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  FiActivity, FiCheckCircle, FiRefreshCw, FiUser, 
  FiHome, FiAlertCircle, FiClipboard, FiHeart, FiThermometer, FiWind,
  FiEdit3, FiTrash2, FiSearch, FiPackage, FiInfo, FiArrowLeft, FiSave, FiRotateCcw,
  FiPlus, FiMinus, FiDollarSign, FiHash, FiClock, FiChevronDown, FiCalendar, FiLock
} from 'react-icons/fi'
import { HiOutlineBeaker } from 'react-icons/hi'
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
  patient: { name: string; medicalRecordNo: string; gender: string; allergies?: string }
  doctor: { name: string; specialization: string } | null
  department: { name: string } | null
}

interface Referral {
  id: string
  type: 'INTERNAL' | 'EXTERNAL'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  toClinicId?: string
  toDepartmentId?: string
  toHospitalName?: string
  notes?: string
  toClinic?: { name: string }
  toDepartment?: { name: string }
  createdAt: string
}

interface Template {
  id: string
  name: string
  type: 'SOAP' | 'PRESCRIPTION'
  content: any
}

interface MedicalRecordAttachment {
  id: string
  fileName: string
  filePath: string
  fileType: string
  createdAt: string
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
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  
  // Consultation State
  const [medicalRecord, setMedicalRecord] = useState<any>(null)
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [labNotes, setLabNotes] = useState('')
  const [labResults, setLabResults] = useState('')
  const [notes, setNotes] = useState('')
  const [hasInformedConsent, setHasInformedConsent] = useState(false)
  
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([])
  const [serviceItems, setServiceItems] = useState<any[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [templates, setTemplates] = useState<Template[]>([])

  const [activeSegment, setActiveSegment] = useState<'nurse' | 'diag' | 'tindakan' | 'lab' | 'rx' | 'history' | 'referral' | 'attachment' | 'consent'>('nurse')
  const [searchMed, setSearchMed] = useState('')
  const [searchService, setSearchService] = useState('')

  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false)
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false)

  const isReadOnly = useMemo(() => queue?.status === 'completed', [queue])

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
          setSubjective(data.subjective || '')
          setObjective(data.objective || '')
          setDiagnosis(data.diagnosis || '')
          setTreatmentPlan(data.treatmentPlan || '')
          setLabNotes(data.labNotes || '')
          setLabResults(data.labResults || '')
          setNotes(data.notes || '')
          setHasInformedConsent(!!data.hasInformedConsent)
          setReferrals(data.referrals || [])
          
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
           // In actual completed items, they should come from actual medical record services if present
           if (data.services && data.services.length > 0 && qData.status === 'completed') {
             setServiceItems(data.services.map((s: any) => ({
                serviceId: s.serviceId,
                name: s.service?.serviceName || 'Layanan',
                code: s.service?.serviceCode || '',
                price: s.price,
                quantity: s.quantity
             })))
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

      // Fetch templates
      const templateRes = await api.get('clinical/templates')
      setTemplates(templateRes.data)

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
    if (isReadOnly) return
    const searchTimeout = setTimeout(async () => {
      if (searchMed.length < 2 && !isMedDropdownOpen) {
        setSearchMedicines([])
        return
      }
      try {
        const medRes = await api.get('master/products', { 
          params: { isActive: true, search: searchMed || undefined, limit: 10 } 
        })
        setSearchMedicines(medRes.data.filter((m: any) => m.medicineId))
      } catch (e) {
        console.error('Search aborted')
      }
    }, 300)
    return () => clearTimeout(searchTimeout)
  }, [searchMed, isMedDropdownOpen, isReadOnly])

  // Service Search Logic
  useEffect(() => {
    if (isReadOnly || (!searchService && !isServiceDropdownOpen)) {
      setFilteredServices([])
      return
    }
    const filtered = allServices.filter(s => 
      !searchService || 
      s.serviceName.toLowerCase().includes(searchService.toLowerCase()) ||
      s.serviceCode.toLowerCase().includes(searchService.toLowerCase())
    )
    setFilteredServices(filtered.slice(0, 10))
  }, [searchService, allServices, isServiceDropdownOpen, isReadOnly])

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMedDropdownOpen(false)
      setIsServiceDropdownOpen(false)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const addPrescription = (m: Medicine) => {
    if (!m.medicineId || isReadOnly) return
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
    if (isReadOnly || serviceItems.find(item => item.serviceId === s.id)) return
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
    if (!queue || !medicalRecord || isReadOnly) return
    setSaving(true)
    const toastId = toast.loading(isFinal ? 'Menyimpan hasil konsultasi...' : 'Menyimpan draft...')
    try {
      await api.post('transactions/medical-records/doctor', {
        queueId: queue.id,
        medicalRecordId: medicalRecord.id,
        subjective,
        objective,
        diagnosis,
        treatmentPlan,
        labNotes,
        labResults,
        notes,
        hasInformedConsent,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiRefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Inisialisasi Konsultasi...</p>
        </div>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Pasien Tidak Ditemukan</h2>
          <button onClick={() => router.back()} className="text-primary font-bold hover:underline">Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Professional Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
              <FiArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{queue.patient.name}</h1>
                <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 uppercase tracking-wider">{queue.patient.medicalRecordNo}</span>
                {queue.patient.gender && (
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border uppercase tracking-wider ${queue.patient.gender === 'L' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {queue.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {queue.department?.name || 'UMUM'} • No. Antrean: <span className="text-slate-900">{queue.queueNo}</span>
                </p>
                {queue.patient.allergies && (
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200"
                  >
                    <FiAlertCircle className="w-3 h-3" /> ALERGI: {queue.patient.allergies}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isReadOnly ? (
              <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-default">
                 <FiLock className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">REKAM MEDIS TERKUNCI</span>
              </div>
            ) : (
              <>
                <button onClick={() => handleSaveConsultation(false)} disabled={saving} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm">
                  <span className="flex items-center gap-2"><FiSave /> SIMPAN DRAFT</span>
                </button>
                <button onClick={() => handleSaveConsultation(true)} disabled={saving} className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20">
                  <span className="flex items-center gap-2"><FiCheckCircle /> SELESAI PEMERIKSAAN</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-12 gap-6 items-start">
        {/* Navigation Segments */}
        <div className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {[
              { id: 'nurse', label: 'Nurse Handover', icon: <FiClipboard /> },
              { id: 'diag', label: 'SOAP & Diagnosa', icon: <FiActivity /> },
              { id: 'referral', label: 'Rujukan Medis', icon: <FiArrowLeft className="rotate-180" /> },
              { id: 'rx', label: 'Resep Obat (Rx)', icon: <FiPackage /> },
              { id: 'tindakan', label: 'Tindakan Medis', icon: <FiCheckCircle /> },
              { id: 'lab', label: 'Laboratorium', icon: <HiOutlineBeaker /> },
              { id: 'attachment', label: 'Lampiran / Media', icon: <FiPackage /> },
              { id: 'consent', label: 'Persetujuan (Consent)', icon: <FiLock /> },
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
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:scale-110" />
              <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2 opacity-60">
                <FiActivity className="w-3 h-3" /> Tanda Vital Terakhir
              </h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tensi</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.bloodPressure || '-'} <span className="text-[9px] opacity-40 font-bold ml-0.5">mmHg</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Suhu</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.temperature || '-'} <span className="text-[9px] opacity-40 font-bold ml-0.5">°C</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">BB/TB</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.weight || '-'}/{latestVitals.height || '-'} <span className="text-[9px] opacity-40 font-bold ml-0.5">kg/cm</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Napas</p>
                  <p className="text-sm font-black text-slate-800">{latestVitals.respiratoryRate || '-'} <span className="text-[9px] opacity-40 font-bold ml-0.5">x/m</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9">
          {isReadOnly && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700">
               <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
               <p className="text-xs font-bold uppercase tracking-tight">Kunjungan ini Telah Selesai. Data rekam medis dalam mode baca-saja dan tidak dapat diubah lagi.</p>
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeSegment === 'nurse' && (
              <motion.div key="nurse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 border-b border-slate-50 pb-6">Keluhan Utama (Handover Perawat)</h3>
                  <div className="p-10 bg-slate-50/50 rounded-3xl italic text-xl text-slate-600 font-medium leading-relaxed border border-slate-100">
                    "{medicalRecord?.chiefComplaint || 'Tidak ada catatan keluhan.'}"
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'diag' && (
              <motion.div key="diag" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[400px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Medical Documentation (S-O-A-P)</h3>
                     <div className="flex items-center gap-2">
                        {templates.length > 0 && (
                          <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black rounded-lg hover:bg-primary hover:text-white transition-all">
                              <FiPackage /> PILIH TEMPLATE
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl invisible group-hover:visible z-50 p-2 overflow-hidden">
                              <div className="p-3 border-b border-slate-50 mb-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Skenario Klinis</p>
                              </div>
                              {templates.filter(t => t.type === 'SOAP').map(t => (
                                <button key={t.id} onClick={() => {
                                  setSubjective(t.content.subjective || '');
                                  setObjective(t.content.objective || '');
                                  setDiagnosis(t.content.diagnosis || '');
                                  setTreatmentPlan(t.content.treatmentPlan || '');
                                }} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700 transition-colors">
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Standardized Format</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* S Quadrant */}
                    <div className="space-y-3 group">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">S</div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-slate-900 transition-colors">Subjective (Anamnesa)</label>
                      </div>
                      <textarea disabled={isReadOnly} value={subjective} onChange={(e) => setSubjective(e.target.value)} className={`w-full p-6 border border-slate-200 rounded-3xl min-h-[160px] text-sm font-bold focus:bg-white focus:border-slate-900 outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Keluhan utama, riwayat penyakit..." />
                    </div>

                    {/* O Quadrant */}
                    <div className="space-y-3 group">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">O</div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-slate-900 transition-colors">Objective (Pemeriksaan)</label>
                      </div>
                      <textarea disabled={isReadOnly} value={objective} onChange={(e) => setObjective(e.target.value)} className={`w-full p-6 border border-slate-200 rounded-3xl min-h-[160px] text-sm font-bold focus:bg-white focus:border-slate-900 outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Pemeriksaan fisik, tanda klinis..." />
                    </div>

                    {/* A Quadrant */}
                    <div className="space-y-3 group">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">A</div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Assessment (Diagnosa)</label>
                      </div>
                      <textarea disabled={isReadOnly} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className={`w-full p-6 border border-slate-200 rounded-3xl min-h-[160px] text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Diagnosa medis, ICD-10..." />
                    </div>

                    {/* P Quadrant */}
                    <div className="space-y-3 group">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">P</div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-emerald-500 transition-colors">Plan (Terapi/Rencana)</label>
                      </div>
                      <textarea disabled={isReadOnly} value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} className={`w-full p-6 border border-slate-200 rounded-3xl min-h-[160px] text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Rencana pengobatan, edukasi..." />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'rx' && (
              <motion.div key="rx" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Resep Obat (Rx)</h3>
                      <p className="text-[10px] font-bold text-slate-400">Daftar obat yang diberikan kepada pasien</p>
                    </div>
                    {!isReadOnly && (
                      <div className="relative w-full md:w-96 group" onClick={(e) => e.stopPropagation()}>
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          value={searchMed} 
                          onChange={(e) => setSearchMed(e.target.value)} 
                          onFocus={() => setIsMedDropdownOpen(true)}
                          placeholder="Cari nama obat atau generic..." 
                          className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-primary shadow-sm group-focus-within:ring-4 group-focus-within:ring-primary/5 transition-all" 
                        />
                        <button 
                          onClick={() => setIsMedDropdownOpen(!isMedDropdownOpen)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors p-1"
                        >
                          <FiChevronDown className={`w-4 h-4 transition-transform ${isMedDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {searchMedicines.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-3xl shadow-2xl mt-3 z-50 max-h-80 overflow-y-auto overflow-x-hidden p-2">
                              {searchMedicines.map(m => (
                                <button key={m.id} onClick={() => addPrescription(m)} className="w-full p-4 hover:bg-slate-50 text-left rounded-2xl transition-all group flex items-start justify-between gap-4 border-b border-slate-50 last:border-0 mb-1">
                                  <div>
                                    <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors uppercase tracking-tight">{m.masterName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">{m.medicine?.genericName} • {m.medicine?.strength}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${m.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      Stok: {m.stock} {m.unit}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {prescriptionItems.map((p, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={idx} 
                        className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-slate-300 transition-all"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                          <div className="flex-1 min-w-[300px]">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                                  <FiPackage />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.dosage}</p>
                               </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 flex-1">
                            <div className="flex-1 min-w-[120px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Frekuensi</label>
                              <input disabled={isReadOnly} value={p.frequency} onChange={(e) => { const n = [...prescriptionItems]; n[idx].frequency = e.target.value; setPrescriptionItems(n); }} placeholder="e.g. 3x1" className={`w-full px-4 py-2 text-xs font-black border border-slate-200 rounded-xl focus:border-primary outline-none ${isReadOnly ? 'bg-slate-50' : 'bg-white'}`} />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Instruksi Khusus</label>
                              <input disabled={isReadOnly} value={p.instructions} onChange={(e) => { const n = [...prescriptionItems]; n[idx].instructions = e.target.value; setPrescriptionItems(n); }} placeholder="e.g. Sesudah makan" className={`w-full px-4 py-2 text-xs font-black border border-slate-200 rounded-xl focus:border-primary outline-none ${isReadOnly ? 'bg-slate-50' : 'bg-white'}`} />
                            </div>
                            <div className="w-24">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Qty</label>
                              <div className={`flex items-center border border-slate-200 rounded-xl overflow-hidden ${isReadOnly ? 'bg-slate-50' : 'bg-white'}`}>
                                 <input disabled={isReadOnly} type="number" value={p.quantity} onChange={(e) => { const n = [...prescriptionItems]; n[idx].quantity = e.target.value; setPrescriptionItems(n); }} className="w-full text-center py-2 text-xs font-black outline-none bg-transparent" />
                              </div>
                            </div>
                            {!isReadOnly && (
                              <div className="flex items-end">
                                 <button onClick={() => setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx))} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                    <FiTrash2 className="w-5 h-5" />
                                 </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {prescriptionItems.length === 0 && (
                      <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/20">
                        <FiPackage className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Daftar Resep Masih Kosong</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'tindakan' && (
              <motion.div key="tindakan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tindakan Medis</h3>
                      <p className="text-[10px] font-bold text-slate-400">Daftar layanan atau tindakan yang diberikan</p>
                    </div>
                    {!isReadOnly && (
                      <div className="relative w-full md:w-96 group" onClick={(e) => e.stopPropagation()}>
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          value={searchService} 
                          onChange={(e) => setSearchService(e.target.value)} 
                          onFocus={() => setIsServiceDropdownOpen(true)}
                          placeholder="Cari tindakan atau kode layanan..." 
                          className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-emerald-500 shadow-sm group-focus-within:ring-4 group-focus-within:ring-emerald-500/5 transition-all" 
                        />
                        <button 
                          onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors p-1"
                        >
                          <FiChevronDown className={`w-4 h-4 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {filteredServices.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-3xl shadow-2xl mt-3 z-50 p-2">
                              {filteredServices.map(s => (
                                <button key={s.id} onClick={() => addServiceItem(s)} className="w-full p-4 hover:bg-slate-50 text-left rounded-2xl transition-all group flex items-center justify-between gap-4 border-b border-slate-50 last:border-0 mb-1">
                                  <div>
                                    <p className="text-xs font-black text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{s.serviceName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.serviceCode}</p>
                                  </div>
                                  <p className="text-xs font-black text-slate-600">
                                    Rp {new Intl.NumberFormat('id-ID').format(s.price)}
                                  </p>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {serviceItems.map((s, idx) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                              <FiCheckCircle />
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.code}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Biaya</p>
                              <p className="text-sm font-black text-slate-800 tracking-tight">Rp {new Intl.NumberFormat('id-ID').format(s.price * s.quantity)}</p>
                           </div>
                           {!isReadOnly && (
                            <button onClick={() => setServiceItems(serviceItems.filter((_, i) => i !== idx))} className="p-3 text-emerald-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all">
                                <FiTrash2 className="w-5 h-5" />
                            </button>
                           )}
                        </div>
                      </motion.div>
                    ))}
                    {serviceItems.length === 0 && (
                      <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/20">
                        <FiCheckCircle className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Belum Ada Tindakan Medis</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'lab' && (
              <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Laboratorium & Diagnostik</h3>
                     <div className="flex items-center gap-2">
                        {isReadOnly && <FiLock className="text-slate-400" />}
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full flex items-center gap-2">
                           <HiOutlineBeaker /> Lab Order
                        </span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-rose-500 transition-colors">Permintaan Pemeriksaan Lab (Order Notes)</label>
                      <textarea disabled={isReadOnly} value={labNotes} onChange={(e) => setLabNotes(e.target.value)} className={`w-full p-8 border border-slate-200 rounded-3xl min-h-[180px] text-base font-bold focus:bg-white focus:border-rose-500 outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Pemeriksaan darah lengkap, urine, dsb..." />
                    </div>
                    <div className="space-y-3 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Hasil Laboratorium (Summary Results)</label>
                      <textarea disabled={isReadOnly} value={labResults} onChange={(e) => setLabResults(e.target.value)} className={`w-full p-8 border border-slate-200 rounded-3xl min-h-[180px] text-base font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner ${isReadOnly ? 'bg-slate-50 opacity-60' : 'bg-slate-50'}`} placeholder="Tuliskan ringkasan hasil pemeriksaan laboratorium jika sudah tersedia..." />
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <FiInfo /> Catatan
                     </p>
                     <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                        Catatan order lab akan diteruskan ke tim laboratorium. Hasil lab yang diinput di sini akan otomatis tersimpan dalam rekam medis permanen pasien.
                     </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'referral' && (
              <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Digital Referral Management</h3>
                     <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Care Coordination</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Buat Rujukan Baru</p>
                         <div className="space-y-4">
                            <div className="flex gap-2">
                               <button onClick={() => {/* Set referral type */}} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">Internal (Klinik)</button>
                               <button onClick={() => {/* Set referral type */}} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all">Eksternal (RS)</button>
                            </div>
                            <textarea placeholder="Catatan medis tambahan untuk dokter rujukan..." className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-bold bg-white focus:border-primary outline-none min-h-[120px]" />
                            <button className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">Cetak & Simpan Rujukan</button>
                         </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Riwayat Rujukan Kunjungan Ini</p>
                       {referrals.length === 0 ? (
                         <div className="py-20 text-center border border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <FiArrowLeft className="w-10 h-10 text-slate-100 mx-auto mb-2 rotate-180" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum Ada Rujukan</p>
                         </div>
                       ) : (
                         referrals.map(r => (
                           <div key={r.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                              <div>
                                 <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{r.type} REFERRAL</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {r.status || 'Pending'}</p>
                              </div>
                              <button className="p-2 text-primary hover:bg-indigo-50 rounded-lg transition-all"><FiInfo /></button>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'attachment' && (
              <motion.div key="attachment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Medical Media & Attachments</h3>
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 tracking-tighter">Clinical Photography</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-slate-50 transition-all group">
                       <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                          <FiPlus className="w-8 h-8" />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unggah Foto / PDF</p>
                       <input type="file" className="hidden" />
                    </label>
                    {/* Placeholder for uploaded items */}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'consent' && (
              <motion.div key="consent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Informed Consent & Verification</h3>
                     <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Legal & Safety</span>
                  </div>
                  
                  <div className="max-w-xl mx-auto py-10">
                    <div className={`p-10 rounded-[2.5rem] border-2 transition-all ${hasInformedConsent ? 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-500/5' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-6 mb-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${hasInformedConsent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                             {hasInformedConsent ? <FiCheckCircle /> : <FiLock />}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Persetujuan Tindakan Medis</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Self-Verified by Practitioner</p>
                          </div>
                       </div>
                       
                       <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-10">
                          Dengan mencentang opsi di bawah ini, saya selaku dokter pemeriksa mengonfirmasi bahwa pasien (atau wali yang sah) telah diberikan penjelasan yang cukup mengenai tindakan medis yang akan dilakukan, termasuk risiko, alternatif, dan konsekuensinya, serta telah memberikan persetujuannya secara lisan maupun tertulis.
                       </p>
                       
                       <button 
                        onClick={() => setHasInformedConsent(!hasInformedConsent)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          hasInformedConsent 
                          ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                          : 'bg-white border border-slate-200 text-slate-400 hover:border-primary hover:text-primary'
                        }`}>
                         {hasInformedConsent ? '✓ PERSETUJUAN TELAH DICATAT' : 'KLIK UNTUK KONFIRMASI PERSETUJUAN'}
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSegment === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 pb-6 border-b border-slate-50">Riwayat Kunjungan</h3>
                   <div className="space-y-8">
                     {history.map((h, idx) => (
                        <div key={idx} className="p-8 bg-slate-50/30 rounded-[2rem] border border-slate-100 relative group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100">
                                    <FiCalendar className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-slate-900">{new Date(h.recordDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.doctor?.name}</p>
                                 </div>
                              </div>
                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest self-start md:self-center">Kunjungan Selesai</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-0 md:pl-14">
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnosa</p>
                                 <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{h.diagnosis || '-'}"</p>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rencana Terapi</p>
                                 <p className="text-sm font-medium text-slate-500 leading-relaxed italic">"{h.treatmentPlan || '-'}"</p>
                              </div>
                           </div>
                        </div>
                     ))}
                     {history.length === 0 && (
                        <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300">
                           <FiRotateCcw className="w-16 h-16 mx-auto mb-4 opacity-30" />
                           <p className="text-xs font-black uppercase tracking-[0.4em]">Tidak Ada Riwayat Medis Sebelumnya</p>
                        </div>
                     )}
                   </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
