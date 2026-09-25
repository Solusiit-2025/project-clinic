'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import {
  FiUser, FiCalendar, FiPhone, FiInfo, FiActivity, FiRotateCcw,
  FiClipboard, FiHeart, FiThermometer, FiWind, FiArrowLeft,
  FiPackage, FiCheckCircle, FiHome, FiClock, FiMapPin,
  FiAlertCircle, FiDroplet, FiSearch, FiFileText, FiPaperclip,
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

type TabKey = 'clinical' | 'lab'

const LAB_STATUS: Record<string, { label: string; classes: string }> = {
  completed: { label: 'Selesai', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'Diproses', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending: { label: 'Menunggu', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function labStatusOf(order: any): string {
  return String(order?.status || 'pending').toLowerCase()
}

function flagResult(result: any): { label: string; classes: string } {
  if (result?.isCritical) {
    return { label: 'Kritis', classes: 'bg-rose-500 text-white' }
  }
  const tm = result?.testMaster
  const raw = String(result?.resultValue ?? '').replace(',', '.').trim()
  const num = Number(raw)
  if (raw !== '' && !Number.isNaN(num) && (tm?.minNormal != null || tm?.maxNormal != null)) {
    if (tm?.minNormal != null && num < Number(tm.minNormal)) {
      return { label: 'Rendah', classes: 'bg-amber-100 text-amber-700' }
    }
    if (tm?.maxNormal != null && num > Number(tm.maxNormal)) {
      return { label: 'Tinggi', classes: 'bg-amber-100 text-amber-700' }
    }
    return { label: 'Normal', classes: 'bg-emerald-100 text-emerald-700' }
  }
  return { label: 'Hasil', classes: 'bg-slate-100 text-slate-600' }
}

export default function PatientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [labOrders, setLabOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [labLoading, setLabLoading] = useState(false)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('clinical')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [labSearch, setLabSearch] = useState('')
  const [labStatusFilter, setLabStatusFilter] = useState<string>('all')
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    try {
      const pRes = await api.get(`master/patients/${id}`)
      setPatient(pRes.data)

      const hRes = await api.get(`transactions/medical-records/patient/${id}`)
      const records = Array.isArray(hRes.data) ? hRes.data : []
      setHistory(records)

      // Kumpulkan lab dari tiap record (backend baru menyertakan labOrders)
      const embedded = records.flatMap((r: any) =>
        (r.labOrders || []).map((o: any) => ({ ...o, _recordNo: r.recordNo, _recordDate: r.recordDate }))
      )
      if (embedded.length > 0) setLabOrders(embedded)
    } catch (e: any) {
      console.error('Failed to fetch patient data', e)
      setErrorStatus(e.response?.status || 500)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  const fetchLabHistory = useCallback(async () => {
    if (!id) return
    setLabLoading(true)
    try {
      const res = await api.get(`master/patients/${id}/history`)
      const remote = Array.isArray(res.data?.labOrders) ? res.data.labOrders : []
      setLabOrders((prev) => {
        const map = new Map<string, any>()
        ;[...remote, ...prev].forEach((o: any) => {
          if (o?.id && !map.has(o.id)) map.set(o.id, o)
        })
        return Array.from(map.values()).sort(
          (a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        )
      })
    } catch (e) {
      // Fallback: tetap pakai labOrders dari medical-records, jangan blokir UI
      console.warn('Lab history fallback ke data rekam medis', e)
    } finally {
      setLabLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (patient) fetchLabHistory()
  }, [patient, fetchLabHistory])

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return '-'
    const birthDate = new Date(patient.dateOfBirth)
    const today = new Date()
    let a = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--
    return a
  }, [patient])

  const latestVitals = useMemo(() => {
    if (history.length === 0) return null
    return history[0].vitals?.[0] || null
  }, [history])

  const sortedHistory = useMemo(() => {
    const arr = [...history]
    arr.sort((a: any, b: any) => {
      const ta = new Date(a.recordDate).getTime()
      const tb = new Date(b.recordDate).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })
    return arr
  }, [history, sortOrder])

  const labStats = useMemo(() => {
    const total = labOrders.length
    const done = labOrders.filter((o) => labStatusOf(o) === 'completed').length
    const process = labOrders.filter((o) => ['pending', 'in_progress'].includes(labStatusOf(o))).length
    const critical = labOrders.filter((o) =>
      (o.results || []).some((r: any) => r.isCritical)
    ).length
    return { total, done, process, critical }
  }, [labOrders])

  const filteredLab = useMemo(() => {
    const q = labSearch.trim().toLowerCase()
    return labOrders.filter((o) => {
      if (labStatusFilter === 'critical') {
        if (!(o.results || []).some((r: any) => r.isCritical)) return false
      } else if (labStatusFilter !== 'all' && labStatusOf(o) !== labStatusFilter) {
        return false
      }
      if (!q) return true
      const hay = [
        o.orderNo,
        o.doctor?.name,
        o.clinicalNotes,
        ...(o.results || []).map((r: any) => r.testMaster?.name || ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [labOrders, labSearch, labStatusFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-16 h-16 border-[6px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Menyinkronkan Rekam Medis...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    const isForbidden = errorStatus === 403
    const title = isForbidden ? 'Akses Dibatasi' : 'Data Tidak Ditemukan'
    const message = isForbidden
      ? 'Anda tidak memiliki akses ke data pasien ini karena belum pernah menangani pasien tersebut.'
      : 'Identitas pasien tidak terdaftar di sistem atau terjadi kesalahan jaringan.'

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center mx-auto mb-8 shadow-sm">
            {isForbidden ? (
              <FiAlertCircle className="w-10 h-10 text-rose-400" />
            ) : (
              <FiUser className="w-10 h-10 text-slate-300" />
            )}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{title}</h2>
          <p className="text-slate-400 font-bold mb-10 max-w-xs mx-auto uppercase text-[10px] tracking-widest leading-relaxed">
            {message}
          </p>
          <button
            onClick={() => router.back()}
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            Kembali ke Antrean
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 min-h-screen pb-32 bg-[#F8FAFC]">
      {/* Dynamic Glass Header */}
      <div className="relative pt-12 px-6 lg:px-12 pb-24 overflow-hidden bg-slate-900 rounded-b-[4rem] shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[140px] -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] -ml-32 -mb-32" />

        <div className="relative max-w-8xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.back()}
                className="w-14 h-14 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-white flex items-center justify-center hover:bg-white/10 transition-all group"
              >
                <FiArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[3rem] bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/10">
                    {patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-slate-900 flex items-center justify-center text-white shadow-lg">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                      RM: {patient.medicalRecordNo}
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                      Usia: {age} Tahun
                    </span>
                    <span className="px-3 py-1 bg-sky-500/20 backdrop-blur-md border border-sky-500/20 rounded-full text-[9px] font-black text-sky-300 uppercase tracking-widest">
                      Lab: {labStats.total} Order
                    </span>
                    {patient.allergies && (
                      <span className="px-3 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-500/20 rounded-full text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <FiAlertCircle className="w-3 h-3" /> Ada Alergi
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
                    {patient.name}
                  </h1>
                  <p className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em]">
                    <FiMapPin className="text-emerald-500 w-3.5 h-3.5" /> {patient.address || 'Alamat tidak lengkap'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center px-8 border-r border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Gol. Darah</p>
                <p className="text-3xl font-black text-white">{patient.bloodType || '?'}</p>
              </div>
              <div className="text-center px-8 border-r border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Kunjungan</p>
                <p className="text-3xl font-black text-white">{history.length}</p>
              </div>
              <div className="text-center px-8">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Gender</p>
                <p className="text-3xl font-black text-white">{patient.gender === 'M' ? 'L' : 'P'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 grid grid-cols-1 xl:grid-cols-12 gap-12 -mt-14">
        {/* Sidebar Info */}
        <div className="xl:col-span-4 space-y-10">
          {/* Medical Snapshot Vitals */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-0" />
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Vital Signs</h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FiClock className="w-3 h-3" /> Terakhir diperiksa
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiHeart className="text-rose-500" /> Tensi (BP)
                </p>
                <p className="text-2xl font-black text-slate-900">{latestVitals?.bloodPressure || '-'}</p>
                <p className="text-[9px] font-bold text-slate-300">mmHg</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiThermometer className="text-amber-500" /> Suhu (Temp)
                </p>
                <p className="text-2xl font-black text-slate-900">{latestVitals?.temperature || '-'}°C</p>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Stabil</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiWind className="text-blue-500" /> Pernapasan
                </p>
                <p className="text-2xl font-black text-slate-900">{latestVitals?.respirationRate || '-'}</p>
                <p className="text-[9px] font-bold text-slate-300">x / Menit</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiActivity className="text-emerald-500" /> Detak Nadi
                </p>
                <p className="text-2xl font-black text-slate-900">{latestVitals?.heartRate || '-'}</p>
                <p className="text-[9px] font-bold text-slate-300">bpm</p>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Berat Badan</p>
                <p className="text-lg font-black text-slate-800">{latestVitals?.weight || '-'} <span className="text-xs text-slate-400">kg</span></p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tinggi Badan</p>
                <p className="text-lg font-black text-slate-800">{latestVitals?.height || '-'} <span className="text-xs text-slate-400">cm</span></p>
              </div>
            </div>
          </div>

          {/* Lab ringkas */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl" />
            <div className="relative flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <FiDroplet className="text-sky-400 w-4 h-4" /> Ringkasan Lab
              </h3>
              <button
                onClick={() => setActiveTab('lab')}
                className="text-[10px] font-black uppercase tracking-widest text-sky-300 hover:text-white transition-colors"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="relative grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: labStats.total },
                { label: 'Selesai', value: labStats.done },
                { label: 'Kritis', value: labStats.critical },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black">{labLoading ? '…' : s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {labStats.critical > 0 && (
              <p className="relative mt-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-300">
                <FiAlertCircle className="w-4 h-4" /> Ada {labStats.critical} order dengan hasil kritis
              </p>
            )}
          </div>

          {/* Allergy Warning Card */}
          {patient.allergies && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-500 p-8 rounded-[3rem] text-white shadow-2xl shadow-rose-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <FiAlertCircle className="w-8 h-8 mb-4 animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-2">Riwayat Alergi & Reaksi</h4>
              <p className="text-lg font-black leading-tight">{patient.allergies}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase">
                <FiInfo className="w-3 h-3" /> High Alert
              </div>
            </motion.div>
          )}

          {/* Demographic Section */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
              <FiInfo className="text-emerald-500 w-4 h-4" /> Personal Profile
            </h3>

            <div className="space-y-8">
              {[
                { label: 'Tanggal Lahir', value: patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd MMMM yyyy', { locale: idLocale }) : '-', icon: <FiCalendar />, color: 'text-indigo-500' },
                { label: 'Nomor Telepon', value: patient.phone, icon: <FiPhone />, color: 'text-emerald-500' },
                { label: 'Tempat Tinggal', value: patient.address || 'Belum Terdaftar', icon: <FiHome />, color: 'text-rose-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{item.label}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Tabs + Content */}
        <div className="xl:col-span-8 space-y-8">
          {/* Tab bar modern */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2 flex flex-col sm:flex-row gap-2 sm:items-center sticky top-4 z-30">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setActiveTab('clinical')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'clinical'
                    ? 'bg-slate-900 text-white shadow-xl'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FiRotateCcw className="w-4 h-4" />
                Riwayat Klinis
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'clinical' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {history.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === 'lab'
                    ? 'bg-sky-600 text-white shadow-xl shadow-sky-200'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FiDroplet className="w-4 h-4" />
                Riwayat Lab
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'lab' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {labStats.total}
                </span>
              </button>
            </div>
            {activeTab === 'clinical' ? (
              <div className="flex items-center gap-3 px-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Urutkan:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-[10px] font-black text-slate-800 uppercase tracking-widest focus:ring-2 focus:ring-emerald-200 outline-none cursor-pointer"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 flex-1 min-w-[200px]">
                  <FiSearch className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    value={labSearch}
                    onChange={(e) => setLabSearch(e.target.value)}
                    placeholder="CARI TES / NO. ORDER..."
                    className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
                  />
                </div>
              </div>
            )}
          </div>

          {activeTab === 'clinical' ? (
            <div>
              <div className="flex items-center justify-between px-6 mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                  <FiRotateCcw className="w-6 h-6 text-emerald-500" /> Medical History Log
                </h3>
              </div>

              <div className="relative pl-10 space-y-12">
                <div className="absolute left-[13px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-emerald-500 via-slate-100 to-transparent" />

                {sortedHistory.length > 0 ? (
                  sortedHistory.map((record, i) => {
                    const orderCount = (record.labOrders || []).length
                    const doneCount = (record.labOrders || []).filter((o: any) => labStatusOf(o) === 'completed').length
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(i, 3) * 0.08 }}
                        key={record.id}
                        className="relative group"
                      >
                        <div className="absolute -left-[35px] top-6 w-8 h-8 rounded-2xl bg-white border-4 border-emerald-500 shadow-xl z-10 group-hover:scale-125 transition-transform flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>

                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-50">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-xl shrink-0">
                                <FiCalendar className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                    {format(new Date(record.recordDate), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                                  </p>
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-md text-[9px] font-black tracking-widest flex items-center gap-1">
                                    <FiClock className="w-2.5 h-2.5" /> {format(new Date(record.recordDate), 'HH:mm')}
                                  </span>
                                  {orderCount > 0 && (
                                    <button
                                      onClick={() => setActiveTab('lab')}
                                      className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 hover:bg-sky-100 transition-colors"
                                      title="Lihat di Riwayat Lab"
                                    >
                                      <FiDroplet className="w-2.5 h-2.5" /> Lab: {doneCount}/{orderCount}
                                    </button>
                                  )}
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                  Rekam Medis <span className="text-slate-300 font-bold ml-1">#{record.recordNo}</span>
                                </h4>
                              </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-right">Pemeriksa</p>
                              <p className="font-black text-slate-800 text-sm">{record.doctor?.name || 'Dokter Jaga'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                              <div className="space-y-6">
                                <div className="relative">
                                  <div className="absolute -left-6 top-0 w-1.5 h-10 bg-indigo-500 rounded-full opacity-50" />
                                  <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-[9px] font-black">S</span> Subjective (Anamnesa)
                                  </h5>
                                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                    &quot;{record.subjective || record.chiefComplaint || 'Tidak ada keluhan utama yang dicatat.'}&quot;
                                  </p>
                                </div>

                                <div className="relative">
                                  <div className="absolute -left-6 top-0 w-1.5 h-10 bg-emerald-500 rounded-full opacity-50" />
                                  <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">O</span> Objective (Pemeriksaan)
                                  </h5>
                                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                    {record.objective || 'Hasil pemeriksaan fisik normal.'}
                                  </p>
                                  {record.vitals?.[0] && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-tighter">
                                        Tensi: {record.vitals[0].bloodPressure}
                                      </span>
                                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-tighter">
                                        Suhu: {record.vitals[0].temperature}°C
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200">
                                <div className="mb-8">
                                  <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-400 text-slate-900 flex items-center justify-center text-[9px] font-black">A</span> Assessment (Diagnosa)
                                  </h5>
                                  <div className="space-y-3">
                                    {record.icd10 && (
                                      <div className="flex flex-col gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black bg-emerald-400 text-slate-900 px-2 py-0.5 rounded">{record.icd10.code}</span>
                                          <span className="text-xs font-black text-emerald-400 uppercase tracking-tight">{record.icd10.nameId || record.icd10.nameEn}</span>
                                        </div>
                                        {record.icd10.description && (
                                          <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">{record.icd10.description}</p>
                                        )}
                                      </div>
                                    )}
                                    {record.secondaryIcd10s && record.secondaryIcd10s.length > 0 && (
                                      <div className="flex flex-col gap-2 mt-2">
                                        {record.secondaryIcd10s.map((sec: any) => (
                                          <div key={sec.id} className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{sec.code}</span>
                                            <span className="text-[11px] font-bold text-slate-400">{sec.nameId || sec.nameEn}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-md font-black text-white leading-relaxed">
                                      {record.diagnosis || (record.icd10 ? '' : 'Observasi Klinis')}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-400 text-slate-900 flex items-center justify-center text-[9px] font-black">P</span> Plan (Terapi)
                                  </h5>
                                  <p className="text-sm font-bold text-slate-400 leading-relaxed">
                                    {record.treatmentPlan || 'Monitoring berkala.'}
                                  </p>
                                </div>
                              </div>

                              {record.services?.length > 0 && (
                                <div className="p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50">
                                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                    <FiActivity className="w-4 h-4" /> Tindakan & Layanan
                                  </h5>
                                  <div className="space-y-4">
                                    {record.services.map((s: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                          <p className="text-sm font-black text-slate-800">{s.service?.serviceName}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-white border border-emerald-100 rounded-full text-[9px] font-black text-emerald-500 uppercase">
                                          {s.quantity}x
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.prescriptions?.length > 0 && (
                                <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100">
                                  <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                    <FiPackage className="w-4 h-4" /> Resep & Instruksi Obat
                                  </h5>
                                  <div className="space-y-5">
                                    {record.prescriptions.flatMap((p: any) => p.items).map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-rose-50 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
                                          <FiPackage className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-black text-slate-800">{item.medicine?.medicineName}</p>
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                              {item.quantity} {item.medicine?.dosageForm || 'Unit'}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                              {item.dosage}
                                            </span>
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                              {item.frequency}
                                            </span>
                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                              Selama {item.duration}
                                            </span>
                                          </div>
                                          {item.instructions && (
                                            <p className="mt-2 text-[10px] text-slate-400 font-bold italic leading-relaxed">
                                              Note: {item.instructions}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {record.notes && (
                            <div className="mt-10 pt-8 border-t border-slate-50">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 italic">Clinical Notes:</p>
                              <p className="text-xs text-slate-400 font-bold leading-relaxed">&quot;{record.notes}&quot;</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                    <FiClipboard className="w-20 h-20 text-slate-100 mx-auto mb-8" />
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Data Riwayat Kosong</h4>
                    <p className="text-slate-400 font-bold mt-4 max-w-xs mx-auto uppercase text-[10px] tracking-widest leading-relaxed">
                      Pasien belum memiliki riwayat pemeriksaan atau konsultasi medis yang tersimpan di sistem.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter status lab */}
              <div className="flex flex-wrap items-center gap-2 px-1">
                {[
                  { key: 'all', label: `Semua (${labStats.total})` },
                  { key: 'completed', label: `Selesai (${labStats.done})` },
                  { key: 'in_progress', label: 'Diproses' },
                  { key: 'pending', label: 'Menunggu' },
                  { key: 'critical', label: `Kritis (${labStats.critical})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setLabStatusFilter(f.key)}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      labStatusFilter === f.key
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-200'
                        : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                {labLoading && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Memuat lab…</span>
                )}
              </div>

              {filteredLab.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                  <FiDroplet className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Belum Ada Riwayat Lab</h4>
                  <p className="text-slate-400 font-bold mt-3 max-w-sm mx-auto uppercase text-[10px] tracking-widest leading-relaxed">
                    {labOrders.length === 0
                      ? 'Pasien ini belum pernah memiliki order laboratorium di sistem.'
                      : 'Tidak ada hasil yang cocok dengan pencarian / filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredLab.map((order: any, i: number) => {
                    const st = labStatusOf(order)
                    const cfg = LAB_STATUS[st] || LAB_STATUS.pending
                    const expanded = expandedLabId === order.id
                    const criticalCount = (order.results || []).filter((r: any) => r.isCritical).length
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: Math.min(i, 4) * 0.05 }}
                        className={`bg-white rounded-[2rem] border shadow-sm overflow-hidden transition-all hover:shadow-xl ${
                          expanded ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-100'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedLabId(expanded ? null : order.id)}
                          className="w-full text-left p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5"
                        >
                          <div className="w-13 h-13 p-3.5 rounded-2xl bg-sky-500/10 text-sky-600 shrink-0">
                            <FiDroplet className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-mono text-[11px] font-black text-slate-500">{order.orderNo}</span>
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.classes}`}>
                                {cfg.label}
                              </span>
                              {criticalCount > 0 && (
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500 text-white">
                                  {criticalCount} Kritis
                                </span>
                              )}
                              {order.priority === 'urgent' && (
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500 text-white">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <p className="font-black text-slate-900 truncate">
                              {(order.results || []).length} parameter
                              {order.doctor?.name ? ` • dr. ${order.doctor.name}` : ''} •{' '}
                              {order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
                            </p>
                            {order.clinicalNotes && (
                              <p className="text-xs text-slate-400 font-bold truncate mt-1">{order.clinicalNotes}</p>
                            )}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors shrink-0 ${expanded ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>
                            {expanded ? 'Tutup' : 'Detail Hasil'}
                          </span>
                        </button>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 md:px-7 pb-7 space-y-5">
                                {(order.results || []).length === 0 ? (
                                  <p className="text-xs font-bold text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center uppercase tracking-widest">
                                    Hasil belum diinput petugas lab
                                  </p>
                                ) : (
                                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm min-w-[560px]">
                                        <thead>
                                          <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest">
                                            <th className="text-left px-5 py-3.5 font-black">Parameter</th>
                                            <th className="text-left px-4 py-3.5 font-black">Hasil</th>
                                            <th className="text-left px-4 py-3.5 font-black">Rujukan</th>
                                            <th className="text-left px-4 py-3.5 font-black">Flag</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {(order.results || []).map((r: any) => {
                                            const flag = flagResult(r)
                                            return (
                                              <tr key={r.id} className={r.isCritical ? 'bg-rose-50/50' : 'bg-white'}>
                                                <td className="px-5 py-3.5">
                                                  <p className="font-black text-slate-800">{r.testMaster?.name || '—'}</p>
                                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {r.testMaster?.category || ''} {r.testMaster?.unit ? `• ${r.testMaster.unit}` : ''}
                                                  </p>
                                                </td>
                                                <td className="px-4 py-3.5 font-black text-slate-900 whitespace-nowrap">
                                                  {r.resultValue || '—'}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                  {r.testMaster?.normalRangeText || '—'}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${flag.classes}`}>
                                                    {flag.label}
                                                  </span>
                                                  {r.notes && (
                                                    <p className="text-[11px] text-slate-400 italic mt-1">{r.notes}</p>
                                                  )}
                                                </td>
                                              </tr>
                                            )
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                      <FiFileText className="w-3 h-3" /> Catatan Klinis
                                    </p>
                                    <p className="font-bold text-slate-700">{order.clinicalNotes || '—'}</p>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                      <FiClock className="w-3 h-3" /> Selesai
                                    </p>
                                    <p className="font-bold text-slate-700">
                                      {order.completedAt ? format(new Date(order.completedAt), 'dd MMM yyyy HH:mm', { locale: idLocale }) : 'Belum selesai'}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                                      <FiPaperclip className="w-3 h-3" /> Lampiran ({(order.attachments || []).length})
                                    </p>
                                    {(order.attachments || []).length === 0 ? (
                                      <p className="font-bold text-slate-400">Tidak ada file</p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {(order.attachments || []).map((a: any) => (
                                          <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="block font-bold text-sky-600 hover:underline truncate">
                                            {a.fileName}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
