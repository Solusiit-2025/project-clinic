'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUserPlus, FiSearch, FiCalendar, FiClock, 
  FiArrowRight, FiCheckCircle, FiUser, FiActivity,
  FiMapPin, FiCreditCard, FiAlertCircle, FiChevronRight,
  FiPlus, FiChevronDown
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import Link from 'next/link'
import MasterModal from '@/components/admin/master/MasterModal'
import { FiRefreshCw as FiRefresh } from 'react-icons/fi'


interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  phone: string
  gender: string
  dateOfBirth: string
  identityNumber: string
  address: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  departments: { id: string; name: string }[]
}

interface Department {
  id: string
  name: string
}

const EMPTY_PATIENT = { 
  medicalRecordNo: '', 
  name: '', 
  email: '', 
  phone: '', 
  address: '', 
  city: '', 
  province: '', 
  zipCode: '', 
  dateOfBirth: '', 
  gender: 'M', 
  bloodType: '-', 
  identityType: 'KTP', 
  identityNumber: '', 
  emergencyContact: '', 
  emergencyPhone: '', 
  allergies: '', 
  bpjsNumber: '',
  insuranceName: '',
  isActive: true 
}

export default function RegistrationPage() {
  const { activeClinicId } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Select Patient, 2: Select Service/Doctor, 3: Confirmation
  
  // States - Patient Master (Quick Add)
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT)
  const [patientSaving, setPatientSaving] = useState(false)
  const [patientError, setPatientError] = useState('')

  // States - Registration
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isFetchAll, setIsFetchAll] = useState(false)
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [visitType, setVisitType] = useState('outpatient')
  const [referralFrom, setReferralFrom] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [regError, setRegError] = useState('')
  const [result, setResult] = useState<any>(null)
  const fetchedSelectablesRef = useRef<string | null>(null)
  const [isMounted, setIsMounted] = useState(false) // Buat handle Hydration


  // Fetch initial data
  useEffect(() => {
    const fetchSelectables = async () => {
      try {
        const [docsRes, deptsRes] = await Promise.all([
          api.get('/master/doctors', { params: { clinicId: activeClinicId, minimal: true } }),
          api.get('/master/departments', { params: { clinicId: activeClinicId, minimal: true } })
        ])
        console.log('Fetched D&D:', docsRes.data.length, deptsRes.data.length)
        setDoctors(docsRes.data)
        setDepartments(deptsRes.data)
      } catch (e) { console.error(e) }
    }
    if (activeClinicId) {
      fetchSelectables()
    }
  }, [activeClinicId])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Search Patient
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!searchQuery && !isFetchAll) {
        setPatients([])
        return
      }
      setSearching(true)
      try {
        const { data } = await api.get('/master/patients', { 
          params: { search: searchQuery } 
        })
        setPatients(data)
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery, isFetchAll])

  const handleRegistration = async () => {
    if (!selectedPatient || !activeClinicId) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/transactions/registrations', {
        patientId: selectedPatient.id,
        clinicId: activeClinicId,
        doctorId: selectedDoctorId || null,
        departmentId: selectedDeptId || null,
        visitType,
        referralFrom
      })
      
      setResult(data)
      setStep(4) // Success Step
    } catch (e: any) {
      setRegError(e.response?.data?.message || 'Gagal melakukan pendaftaran')
      // Scroll to top of the modal if needed, or just let the user see it
    } finally {
      setSubmitting(false)
    }
  }

  const fetchNextMR = useCallback(async () => {
    try {
      const { data } = await api.get('/master/patients/next-mr')
      setPatientForm(p => ({ ...p, medicalRecordNo: data.nextCode }))
    } catch (e) { console.error('Failed to fetch next MR No', e) }
  }, [])

  const openQuickAddPatient = () => {
    setPatientForm(EMPTY_PATIENT)
    setPatientError('')
    setPatientModalOpen(true)
    fetchNextMR()
  }

  const handleSaveNewPatient = async () => {
    if (!patientForm.name || !patientForm.phone) {
      setPatientError('Nama dan No. HP wajib diisi')
      return
    }
    setPatientSaving(true)
    setPatientError('')
    try {
      const { data } = await api.post('/master/patients', patientForm)
      setSelectedPatient(data)
      setPatientModalOpen(false)
      setStep(2)
    } catch (e: any) {
      setPatientError(e.response?.data?.message || 'Gagal menyimpan pasien')
    } finally {
      setPatientSaving(false)
    }
  }

  const patientInp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input 
        type={type} value={(patientForm as any)[key]} 
        onChange={(e) => setPatientForm(p => ({...p, [key]: e.target.value}))} 
        placeholder={placeholder}
        className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300 text-gray-700" 
      />
    </div>
  )

  // UI Helpers
  const StepIndicator = () => (
    <div className="flex items-center gap-4 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
            step === s ? 'bg-primary text-white shadow-lg' : 
            step > s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {step > s ? <FiCheckCircle className="w-3.5 h-3.5" /> : s}
          </div>
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-widest ${step === s ? 'text-primary' : 'text-gray-400'}`}>
              {s === 1 ? 'Pasien' : s === 2 ? 'Layanan' : 'Konfirmasi'}
            </span>
          </div>
          {s < 3 && <div className={`w-6 h-0.5 rounded-full mx-1 ${step > s ? 'bg-emerald-500' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-4 md:p-6 mx-auto pb-24 md:pb-20 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-lg font-black text-gray-900 tracking-tight uppercase truncate">Pendaftaran</h1>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">Front-Desk & Antrian</p>
        </div>
        <button 
          onClick={openQuickAddPatient}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-primary text-white rounded-xl text-[9px] md:text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
        >
          <FiPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PASIEN BARU</span>
        </button>
      </div>

      <StepIndicator />

      {/* Step 1: Select Patient */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 md:space-y-6">
            <div className="bg-indigo-50/50 p-3 md:p-4 rounded-2xl border border-indigo-100/50 flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <FiSearch className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 leading-tight truncate">Cari Pasien Terdaftar</p>
                <p className="text-[9px] md:text-[10px] text-indigo-600 font-bold mt-0.5 lowercase truncate">Gunakan Nama, RM, atau No HP.</p>
              </div>
            </div>

              <div className="relative group">
                <FiSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4 group-hover:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari Pasien (Nama, No. RM, HP)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 md:pl-10 pr-10 md:pr-12 py-2.5 md:py-3 bg-white border border-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold"
                />
                <button 
                  onClick={() => setIsFetchAll(true)}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-all border border-transparent hover:border-gray-200"
                  title="Tampilkan Semua Pasien"
                >
                  <FiChevronDown className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isFetchAll ? 'rotate-180' : ''}`} />
                </button>
                {searching && (
                  <div className="absolute right-10 md:right-14 top-1/2 -translate-y-1/2">
                     <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {patients.length > 0 ? patients.slice(0, 20).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPatient(p); setStep(2); }}
                  className="flex items-center justify-between p-3 md:p-4 bg-white border border-gray-100 rounded-2xl hover:border-primary hover:shadow-md transition-all group text-left animate-in fade-in slide-in-from-top-1"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all flex-shrink-0">
                      <FiUser className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-gray-900 text-sm md:text-base truncate">{p.name}</p>
                        <span className="text-[9px] md:text-[10px] font-black text-primary bg-primary/5 px-1.5 md:px-2 py-0.5 rounded border border-primary/20 truncate">{p.medicalRecordNo}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-0.5 md:gap-y-1">
                        <p className="text-[10px] md:text-xs text-gray-500 font-medium flex items-center gap-1.5 truncate">
                          <FiUser className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 flex-shrink-0" />
                          {p.gender === 'M' ? 'Laki-laki' : 'Perempuan'} • {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500 font-medium flex items-center gap-1.5 truncate">
                          <FiActivity className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 flex-shrink-0" />
                          {p.phone}
                        </p>
                        <p className="text-[9px] md:text-xs text-gray-400 font-medium md:col-span-2 flex items-start gap-1.5 mt-0.5 md:mt-1 border-t border-gray-50 pt-0.5 md:pt-1 truncate">
                          <FiMapPin className="w-3 h-3 md:w-3.5 md:h-3.5 mt-0.5 text-gray-300 flex-shrink-0" />
                          <span className="italic truncate">{p.address || 'Alamat tidak tersedia'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <span className="text-[9px] md:text-[10px] font-black text-primary bg-primary/10 px-2 md:px-3 py-1 md:py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-primary/20 hidden sm:block">
                      PILIH & DAFTAR
                    </span>
                    <FiChevronRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </button>
              )) : searchQuery && !searching && (
                <div className="py-8 md:py-12 text-center text-gray-400">
                  <FiAlertCircle className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs md:text-sm font-medium">Pasien tidak ditemukan. Pastikan data sudah terdaftar di Master Pasien.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Service/Doctor */}
        {step === 2 && selectedPatient && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 space-y-4 md:space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 md:space-y-4">
                <h3 className="font-black text-xs md:text-sm uppercase tracking-widest text-gray-400 mb-3 md:mb-4 flex items-center gap-2">
                  <FiActivity className="text-primary w-4 h-4 md:w-5 md:h-5" /> Pilih Tujuan Pelayanan
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500">Poli / Departemen</label>
                    <select 
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:bg-white focus:border-primary transition-all"
                    >
                      <option value="">Semua Poli</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500">Dokter (Opsional)</label>
                    <select 
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:bg-white focus:border-primary transition-all"
                    >
                      <option value="">Pilih Dokter</option>
                      {doctors
                        .filter(d => !selectedDeptId || (d.departments && d.departments.some(dept => dept.id === selectedDeptId)))
                        .map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] md:text-xs font-bold text-gray-500">Jenis Kunjungan</label>
                  <div className="flex gap-2 md:gap-4">
                    {['outpatient', 'emergency', 'mcu'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setVisitType(type)}
                        className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-xl border-2 font-bold text-[10px] md:text-xs transition-all ${
                          visitType === type ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500">Asal Rujukan (Opsional)</label>
                    <input 
                      type="text" 
                      value={referralFrom}
                      onChange={(e) => setReferralFrom(e.target.value)}
                      placeholder="Contoh: Puskesmas, Mandiri, dll."
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:bg-white focus:border-primary transition-all"
                    />
                </div>
              </div>

              <div className="flex gap-2 md:gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-xs md:text-sm hover:bg-gray-200 transition-all"
                >
                  Kembali
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!selectedDeptId && !selectedDoctorId}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-primary text-white font-black rounded-xl text-xs md:text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  Lanjut ke Konfirmasi
                </button>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-primary">
                <h4 className="font-black text-xs md:text-sm uppercase tracking-widest text-primary mb-3 md:mb-4 flex items-center gap-2">
                  <FiUser className="w-4 h-4 md:w-5 md:h-5" /> Ringkasan Pasien
                </h4>
                <div className="space-y-2 md:space-y-3">
                  <p className="font-black text-gray-900 leading-tight text-sm md:text-base truncate">{selectedPatient.name}</p>
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 space-y-1 uppercase tracking-wider">
                    <p>No. RM: {selectedPatient.medicalRecordNo}</p>
                    <p>Gender: {selectedPatient.gender === 'M' ? 'Pria' : 'Wanita'}</p>
                    <p>Kontak: {selectedPatient.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedPatient && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-100 text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2 md:mb-3 border border-gray-100">
                  <FiPlus className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <h2 className="text-base md:text-lg font-black text-gray-900 uppercase">Konfirmasi Registrasi</h2>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wide">Periksa kembali detail pendaftaran</p>
              </div>
              
              <div className="p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Data Pasien</label>
                    <p className="text-sm font-bold text-gray-800 mt-1 truncate">{selectedPatient.name}</p>
                    <p className="text-xs text-gray-500 font-medium truncate">{selectedPatient.medicalRecordNo}</p>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Tujuan Layanan</label>
                    <p className="text-sm font-bold text-gray-800 mt-1 truncate">{departments.find(d => d.id === selectedDeptId)?.name || 'Poli Umum'}</p>
                    <p className="text-xs text-gray-500 font-medium truncate">{doctors.find(d => d.id === selectedDoctorId)?.name || 'Dokter Jaga'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Waktu Kedatangan</label>
                    <p className="text-sm font-bold text-gray-800 mt-1 truncate">{isMounted ? new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}</p>
                    <p className="text-xs text-gray-500 font-medium truncate">{isMounted ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'} WIB</p>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Jenis Kunjungan</label>
                    <p className="text-sm font-bold text-gray-800 mt-1 uppercase truncate">{visitType}</p>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 md:p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 md:gap-3 text-red-700 animate-pulse">
                    <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                    <p className="text-xs md:text-sm font-bold truncate">{regError}</p>
                  </div>
                )}

                <div className="pt-4 md:pt-8 flex gap-2 md:gap-4 border-t border-gray-50">
                  <button 
                    onClick={() => setStep(2)}
                    className="px-4 md:px-6 py-3 md:py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs md:text-sm hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleRegistration}
                    disabled={submitting}
                    className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-primary text-white font-black rounded-2xl text-xs md:text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Memproses...' : (
                      <>
                        Simpan & Ambil Antrian <FiArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success Result */}
        {step === 4 && result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-4 md:space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
                <FiCheckCircle className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Pendaftaran Sukses!</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">Silakan berikan nomor antrian ini kepada pasien</p>
              </div>

              <div className="py-4 md:py-6 bg-gray-900 rounded-2xl md:rounded-3xl border border-slate-800">
                <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">Nomor Antrian</p>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{result.queueNumber?.queueNo}</h1>
                <p className="text-[9px] md:text-[10px] font-black text-primary mt-2 bg-primary/10 py-1 px-3 md:px-4 rounded-full w-fit mx-auto border border-primary/20 uppercase tracking-widest">
                  {visitType.toUpperCase()}
                </p>
              </div>

              <div className="space-y-2 md:space-y-3 pt-4 md:pt-6">
                <Link href="/admin/transactions/queue" className="block w-full py-3 md:py-4 bg-primary text-white font-black rounded-2xl text-xs md:text-sm shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all">
                  Pantau di Dashboard Antrian
                </Link>
                <button 
                  onClick={() => { setStep(1); setResult(null); setSelectedPatient(null); setSelectedDoctorId(''); setSelectedDeptId(''); }}
                  className="block w-full py-3 md:py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl text-xs md:text-sm hover:bg-gray-100 transition-all"
                >
                  Pendaftaran Baru
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Patient Modal */}
      <MasterModal 
        isOpen={patientModalOpen} 
        onClose={() => setPatientModalOpen(false)}
        title="Registrasi Pasien Baru" 
        size="lg"
      >
        <div className="space-y-4 md:space-y-6">
          {patientError && (
            <div className="p-2.5 md:p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2">
              <FiAlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> {patientError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Identity Group */}
            <div className="md:col-span-3 pb-2 md:pb-3 border-b border-gray-50 flex items-center gap-2">
              <div className="w-1.5 h-3 md:w-1.5 md:h-4 bg-primary rounded-full" />
              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Identitas Utama</h4>
            </div>

            <div>
              <label className="block text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                <span>No. Rekam Medis *</span>
                <button type="button" onClick={fetchNextMR} className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                  <FiRefresh className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase">Gen</span>
                </button>
              </label>
              <input 
                value={patientForm.medicalRecordNo} 
                onChange={(e) => setPatientForm(p => ({...p, medicalRecordNo: e.target.value}))}
                placeholder="RM-20240409-0001" 
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-black font-mono text-primary" 
              />
            </div>

            <div className="md:col-span-2">{patientInp('Nama Lengkap Pasien *', 'name', 'text', 'Sesuai KTP')}</div>

            <div>
               <label className="block text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</label>
               <div className="grid grid-cols-2 gap-2">
                  {['M', 'F'].map(g => (
                    <button 
                      key={g} type="button" 
                      onClick={() => setPatientForm(p => ({ ...p, gender: g }))}
                      className={`py-2 md:py-2.5 rounded-2xl border text-[9px] md:text-[10px] font-black transition-all ${patientForm.gender === g ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {g === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                    </button>
                  ))}
               </div>
            </div>

            {patientInp('Tanggal Lahir', 'dateOfBirth', 'date')}
            
            <div>
              <label className="block text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Golongan Darah</label>
              <select 
                value={patientForm.bloodType} 
                onChange={(e) => setPatientForm(p => ({...p, bloodType: e.target.value}))}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-black text-gray-700"
              >
                {['-', 'A', 'B', 'AB', 'O'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Contact Group */}
            <div className="md:col-span-3 pb-2 md:pb-3 border-b border-gray-50 mt-4 flex items-center gap-2">
              <div className="w-1.5 h-3 md:w-1.5 md:h-4 bg-primary rounded-full" />
              <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Kontak & Alamat</h4>
            </div>

            {patientInp('No. Handphone (WhatsApp) *', 'phone', 'tel', '0812xxxx')}
            {patientInp('Email (Opsional)', 'email', 'email', 'pasien@mail.com')}
            
            <div className="md:col-span-2">
               <label className="block text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Domisili</label>
               <textarea 
                value={patientForm.address} 
                onChange={(e) => setPatientForm(p => ({...p, address: e.target.value}))} 
                rows={2}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-bold placeholder:text-gray-300 text-gray-700 resize-none" 
                placeholder="Alamat lengkap..." 
              />
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 pt-4 md:pt-6 mt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setPatientModalOpen(false)} 
              className="flex-1 py-3 md:py-3.5 border border-gray-100 rounded-2xl text-[10px] md:text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleSaveNewPatient} 
              disabled={patientSaving} 
              className="flex-1 py-3 md:py-3.5 bg-primary text-white rounded-2xl text-[10px] md:text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 disabled:opacity-60 transition-all"
            >
                {patientSaving ? 'MENYIMPAN...' : 'SIMPAN & LANJUT DAFTAR'}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
