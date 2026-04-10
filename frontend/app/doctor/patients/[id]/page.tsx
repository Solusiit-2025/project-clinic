'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  FiUser, FiCalendar, FiPhone, FiInfo, FiActivity, FiRotateCcw, 
  FiClipboard, FiHeart, FiThermometer, FiWind, FiArrowLeft, FiPackage, FiCheckCircle, FiHome
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  gender: string
  dateOfBirth: string
  phone: string
  address?: string
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 lg:ml-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Memuat Riwayat Pasien...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 lg:ml-64">
        <div className="text-center">
          <FiUser className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Pasien Tidak Ditemukan</h2>
          <button onClick={() => router.back()} className="text-primary font-bold hover:underline underline-offset-4">Kembali ke Daftar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 lg:ml-64 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-primary transition-all shadow-sm"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {patient.name}
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">No. RM: {patient.medicalRecordNo}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Patient Profile Info */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <FiUser className="w-4 h-4" /> Profil Pasien
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Jenis Kelamin', value: patient.gender === 'M' ? 'Laki-laki' : 'Perempuan', icon: <FiUser /> },
                { label: 'Tanggal Lahir', value: new Date(patient.dateOfBirth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), icon: <FiCalendar /> },
                { label: 'Telepon', value: patient.phone, icon: <FiPhone /> },
                { label: 'Alamat', value: patient.address || 'Alamat belum diinput', icon: <FiHome /> },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Medical History Timeline */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <FiRotateCcw className="w-4 h-4 text-indigo-500" /> Arisip Riwayat Medis
            </h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">
              {history.length} Kunjungan
            </span>
          </div>

          <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-200 before:via-gray-100 before:to-transparent">
            {history.length > 0 ? (
              history.map((record, i) => (
                <div key={record.id} className="relative group">
                  <div className="absolute -left-[30px] top-4 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)] z-10" />
                  
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                      <div>
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                          {new Date(record.recordDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <h4 className="font-black text-gray-900 mt-1 flex items-center gap-2 capitalize">
                          {record.doctor?.name || 'Dokter Umum'} • {record.recordNo}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Diagnosa:</p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{record.diagnosis || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5">Rencana Terapi:</p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{record.treatmentPlan || '-'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                           <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black border border-gray-100">BP: {record.vitals?.[0]?.bloodPressure || '-'}</span>
                           <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black border border-gray-100">Temp: {record.vitals?.[0]?.temperature || '-'}°C</span>
                        </div>
                        
                        {record.prescriptions?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resep:</p>
                            <div className="flex flex-wrap gap-2">
                              {record.prescriptions.flatMap((p: any) => p.items).map((item: any, idx: number) => (
                                <span key={idx} className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black border border-rose-100">
                                  {item.medicine?.medicineName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                <FiRotateCcw className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-200">Belum Ada Riwayat Medis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
