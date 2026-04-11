'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  FiUser, FiCalendar, FiPhone, FiInfo, FiActivity, FiRotateCcw, 
  FiClipboard, FiHeart, FiThermometer, FiWind, FiArrowLeft, 
  FiPackage, FiCheckCircle, FiHome, FiClock, FiMapPin, FiSmile
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  gender: string
  dateOfBirth: string
  phone: string
  address?: string
  bloodType?: string
  allergies?: string
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!token || !id) return
    setLoading(true)
    try {
      // Fetch patient basic info
      const pRes = await api.get(`master/patients/${id}`)
      setPatient(pRes.data)

      // Fetch medical history
      const hRes = await api.get(`transactions/medical-records/patient/${id}`)
      setHistory(hRes.data)
    } catch (e) {
      console.error('Failed to fetch patient data', e)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const latestVitals = useMemo(() => {
    if (history.length === 0) return null
    return history[0].vitals?.[0] || null
  }, [history])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Menyusun Profil Medis...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUser className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Profil Tidak Dapat Diakses</h2>
          <p className="text-gray-400 font-medium mb-8 max-w-xs mx-auto">
            Pasien tidak ditemukan atau Anda tidak memiliki izin untuk mengakses data medis ini.
          </p>
          <button 
            onClick={() => router.back()} 
            className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-gray-200"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 min-h-screen pb-24 bg-gray-50/50">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-b-[3rem] shadow-2xl shadow-slate-200">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] -ml-24 -mb-24" />
        
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-emerald-500/20 border-4 border-white/10">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-2">
                    <FiCheckCircle className="w-2.5 h-2.5" /> Pasien Terverifikasi
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    {patient.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <FiClipboard className="w-3 h-3" /> {patient.medicalRecordNo}
                    </span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="flex items-center gap-1.5">
                      <FiSmile className="w-3 h-3 font-black" /> {patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-3xl min-w-[140px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Golongan Darah</p>
                <p className="text-2xl font-black text-white">{patient.bloodType || 'B+'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-3xl min-w-[140px]">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Kunjungan</p>
                <p className="text-2xl font-black text-white">{history.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Stats/Info Grid */}
        <div className="xl:col-span-4 space-y-8">
          {/* Quick Vital Stats */}
          {latestVitals && (
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                  <FiHeart className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tekanan Darah</p>
                <p className="text-xl font-black text-gray-900">{latestVitals.bloodPressure || '-'}</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1 italic leading-none">Terakhir diperiksa</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
                  <FiThermometer className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Suhu Tubuh</p>
                <p className="text-xl font-black text-gray-900">{latestVitals.temperature || '-'}°C</p>
                <p className="text-[9px] font-bold text-gray-400 mt-1 italic leading-none">Sangat Stabil</p>
              </motion.div>
            </div>
          )}

          {/* Demographic Section */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <FiInfo className="w-4 h-4 text-emerald-500" /> Informasi Demografis
              </h3>
            </div>
            
            <div className="p-8 space-y-8">
              {[
                { label: 'Tanggal Lahir', value: patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd MMMM yyyy', { locale: idLocale }) : '-', icon: <FiCalendar />, color: 'text-indigo-500' },
                { label: 'Kontak Telepon', value: patient.phone, icon: <FiPhone />, color: 'text-emerald-500' },
                { label: 'Domisili Saat Ini', value: patient.address || 'Belum diisi', icon: <FiMapPin />, color: 'text-rose-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-5 group">
                  <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{item.label}</p>
                    <p className="font-bold text-gray-900 leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {patient.allergies && (
              <div className="p-8 pt-0">
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FiActivity className="w-3 h-3" /> Alergi & Kontraindikasi
                  </p>
                  <p className="text-sm font-bold text-rose-800">{patient.allergies}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Medical History Timeline */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3">
              <FiRotateCcw className="w-5 h-5 text-indigo-500" /> Log Kunjungan Medis
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Urutkan: <span className="text-gray-900">Terbaru</span>
            </div>
          </div>

          <div className="relative pl-8 space-y-10">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500 via-indigo-200 to-transparent opacity-30" />
            
            {history.length > 0 ? (
              history.map((record, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={record.id} 
                  className="relative"
                >
                  {/* Timeline Node */}
                  <div className="absolute -left-[32px] top-6 w-5 h-5 rounded-full bg-white border-4 border-emerald-500 shadow-xl z-10" />
                  
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
                    {/* Glass Decor */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-50 transition-colors" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-50">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <FiCalendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">
                            {format(new Date(record.recordDate), 'dd MMMM yyyy', { locale: idLocale })}
                          </p>
                          <h4 className="text-xl font-black text-gray-900 mt-1 tracking-tight">
                            Konsultasi • <span className="text-gray-400 font-bold">{record.recordNo}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dokter Pemeriksa</p>
                          <p className="font-black text-gray-900">{record.doctor?.name || 'Dr. Umum'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                           <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                             {(record.doctor?.name || 'D').charAt(0)}
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        {/* S Quadrant */}
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 italic">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-black">S</span> Subjective (Anamnesa)
                          </p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">
                            "{record.subjective || record.chiefComplaint || '-'}"
                          </p>
                        </div>
                        
                        {/* O Quadrant */}
                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-black">O</span> Objective (Pemeriksaan)
                          </p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed italic">
                            {record.objective || record.labResults || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* A Quadrant */}
                        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-black">A</span> Assessment (Diagnosa)
                          </p>
                          <p className="text-sm font-black text-gray-800 leading-relaxed">
                            {record.diagnosis || 'Tidak ada catatan diagnosa spesifik.'}
                          </p>
                        </div>

                        {/* P Quadrant */}
                        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">P</span> Plan (Terapi/Rencana)
                          </p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">
                            {record.treatmentPlan || 'Pemantauan berkala dan istirahat cukup.'}
                          </p>
                        </div>
                      </div>
                    </div>
                        {/* Vitals in record */}
                        <div className="flex flex-wrap gap-2">
                           <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-slate-200">
                             <FiThermometer className="w-3 h-3 text-emerald-400" /> {record.vitals?.[0]?.temperature || '36.5'}°C
                           </div>
                           <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-emerald-100">
                             <FiHeart className="w-3 h-3" /> {record.vitals?.[0]?.bloodPressure || '120/80'}
                           </div>
                        </div>
                        
                        {record.prescriptions?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <FiPackage className="w-3.5 h-3.5" /> Daftar Resep Obat
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {record.prescriptions.flatMap((p: any) => p.items).map((item: any, idx: number) => (
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={idx} 
                                  className="bg-white border border-rose-100 text-rose-600 px-4 py-2 rounded-2xl text-[10px] font-black shadow-sm group-hover:border-rose-300 transition-colors"
                                >
                                  {item.medicine?.medicineName}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Additional Notes */}
                        {record.notes && (
                           <div className="pt-2">
                             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Catatan Tambahan:</p>
                             <p className="text-xs text-gray-400 font-medium italic">"{record.notes}"</p>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-50 flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FiRotateCcw className="w-10 h-10 text-gray-200" />
                </div>
                <h4 className="text-xl font-black text-gray-900 tracking-tight">Belum Ada Kunjungan</h4>
                <p className="text-sm font-medium text-gray-400 mt-2 max-w-xs uppercase tracking-widest leading-relaxed">
                  Pasien ini baru pertama kali terdaftar atau belum memiliki sesi konsultasi yang tersimpan.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
