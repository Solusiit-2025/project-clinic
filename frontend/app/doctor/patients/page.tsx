'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiRefreshCw, FiUser, FiActivity, FiChevronRight,
  FiChevronLeft, FiMoreVertical, FiExternalLink, FiFilter, FiCalendar, FiPhone, FiDroplet
} from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface LabOrderSummary {
  id: string
  orderNo: string
  orderDate: string
  status: string
  completedAt?: string | null
  results?: { id: string }[]
}

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  gender: string
  dateOfBirth: string
  phone: string
  isActive: boolean
  createdAt: string
  medicalRecords?: any[]
  labOrders?: LabOrderSummary[]
  _count?: { labOrders: number }
}

function labSummary(p: Patient) {
  const total = p._count?.labOrders ?? p.labOrders?.length ?? 0
  const orders = p.labOrders || []
  const critical = orders.some((o) => (o.results?.length || 0) > 0)
  const last = orders[0]
  return { total, hasLab: total > 0, critical, last }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function DoctorPatients() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [labFilter, setLabFilter] = useState<'all' | 'ever' | 'never' | 'critical'>('all')
  const [searchFocus, setSearchFocus] = useState(false)
  const [debouncedBackendSearch, setDebouncedBackendSearch] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const parsedSearch = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase()
    let lab: 'ever' | 'never' | 'critical' | null = null
    let rest = searchTerm
    const take = (phrases: string[]) => {
      for (const ph of phrases) {
        if (raw.includes(ph)) {
          const idx = rest.toLowerCase().indexOf(ph)
          if (idx >= 0) rest = (rest.slice(0, idx) + ' ' + rest.slice(idx + ph.length)).replace(/\s+/g, ' ').trim()
          return true
        }
      }
      return false
    }
    if (take(['belum pernah lab', 'belum lab', 'belum-lab', 'belumlab', 'tanpa lab', 'tidak ada lab', 'tidak lab', 'belum ada lab'])) lab = 'never'
    else if (take(['lab kritis', 'kritis lab', 'kritis', 'critical'])) lab = 'critical'
    else if (take(['pernah lab', 'pernah-lab', 'pernahlab', 'ada lab', 'sudah lab', 'punya lab'])) lab = 'ever'
    return { labKeyword: lab, backendSearch: rest.trim() }
  }, [searchTerm])

  const effectiveLabFilter = parsedSearch.labKeyword ?? labFilter

  // Debounce: tunggu user selesai mengetik sebelum nembak API.
  // Tanpa ini tiap keystroke = 1 request dan respons bisa datang tidak berurutan
  // (request "B" yang lambat menimpa hasil "Benny") sehingga search terlihat rusak.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedBackendSearch(parsedSearch.backendSearch)
    }, 400)
    return () => clearTimeout(t)
  }, [parsedSearch.backendSearch])

  const fetchPatients = useCallback(async () => {
    // Batalkan request sebelumnya biar hasil basi tidak menimpa hasil terbaru
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const { data } = await api.get('master/patients', {
        params: {
          search: debouncedBackendSearch || undefined,
          page: page,
          limit: 10,
          sort: 'recent'
        },
        signal: controller.signal
      })
      
      // Handle paginated response
      if (data.data) {
        setPatients(data.data)
        setMeta(data.meta)
      } else {
        setPatients(data)
        setMeta({ total: data.length, page: 1, limit: data.length, totalPages: 1 })
      }
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return
      console.error('Failed to fetch patients', e)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [debouncedBackendSearch, page])

  useEffect(() => {
    fetchPatients()
    return () => abortRef.current?.abort()
  }, [fetchPatients])

  // Reset ke halaman 1 setiap kata kunci pencarian yang sudah settle berubah
  useEffect(() => {
    setPage(1)
  }, [debouncedBackendSearch])

  const visiblePatients = useMemo(() => {
    if (effectiveLabFilter === 'all') return patients
    return patients.filter((p) => {
      const s = labSummary(p)
      if (effectiveLabFilter === 'ever') return s.hasLab
      if (effectiveLabFilter === 'never') return !s.hasLab
      if (effectiveLabFilter === 'critical') return s.critical
      return true
    })
  }, [patients, effectiveLabFilter])

  const labCounts = useMemo(() => {
    let ever = 0
    let critical = 0
    patients.forEach((p) => {
      const s = labSummary(p)
      if (s.hasLab) ever++
      if (s.critical) critical++
    })
    return { ever, never: patients.length - ever, critical }
  }, [patients])

  return (
    <div className="space-y-6 pb-24 bg-gray-50/30 min-h-screen">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-slate-200"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 text-[10px] font-black tracking-[0.2em] uppercase text-emerald-400">
              <FiUser className="w-3 h-3" /> Database Pasien Saya
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Pasien Terkait <span className="text-emerald-400">Anda</span></h1>
            <p className="text-slate-400 font-medium text-xs md:text-sm max-w-md">
              Akses cepat ke riwayat medis dan profil pasien yang pernah Anda tangani di Yasfina.
            </p>
          </div>
          <button 
            onClick={fetchPatients} 
            className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all shadow-xl"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder='Cari nama / RM / telepon... atau ketik "PERNAH LAB" / "BELUM LAB"'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
            className="w-full pl-14 pr-12 py-3 md:py-4 bg-white border border-slate-100 rounded-2xl md:rounded-3xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold text-xs md:text-sm shadow-sm placeholder:text-slate-300"
          />
          {searchTerm && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-black"
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}
          {searchFocus && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 z-40">
              <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Pintasan pencarian lab — klik untuk pakai
              </p>
              {[
                { keyword: 'PERNAH LAB', desc: 'Hanya pasien yang pernah order lab', active: parsedSearch.labKeyword === 'ever' },
                { keyword: 'BELUM LAB', desc: 'Hanya pasien yang belum pernah lab', active: parsedSearch.labKeyword === 'never' },
                { keyword: 'LAB KRITIS', desc: 'Ada hasil kritis', active: parsedSearch.labKeyword === 'critical' },
              ].map((s) => (
                <button
                  key={s.keyword}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const rest = parsedSearch.backendSearch
                    setSearchTerm(rest ? `${rest} ${s.keyword}` : s.keyword)
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    s.active ? 'bg-sky-50 text-sky-700' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                    <FiDroplet className="w-3.5 h-3.5" /> {s.keyword}
                    {s.active && <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[9px]">Aktif</span>}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{s.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
           <button className="p-3 text-slate-400 hover:text-emerald-600 transition-colors" title="Filter">
             <FiFilter className="w-5 h-5" />
           </button>
        </div>
      </div>

      {parsedSearch.labKeyword && (
        <div className="flex items-center gap-2 -mt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter dari pencarian:</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest shadow">
            <FiDroplet className="w-3 h-3" />
            {parsedSearch.labKeyword === 'ever' ? 'Pernah Lab' : parsedSearch.labKeyword === 'never' ? 'Belum Lab' : 'Lab Kritis'}
            <button
              onClick={() => setSearchTerm(parsedSearch.backendSearch)}
              className="ml-1 font-black hover:scale-125 transition-transform"
              title="Hapus filter lab dari pencarian"
            >
              ✕
            </button>
          </span>
          {parsedSearch.backendSearch && (
            <span className="text-[10px] font-bold text-slate-400">+ &quot;{parsedSearch.backendSearch}&quot;</span>
          )}
        </div>
      )}

      {/* Filter LAB */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'Semua Pasien' },
          { key: 'ever', label: `Pernah Lab (${labCounts.ever})` },
          { key: 'never', label: `Belum Lab (${labCounts.never})` },
          { key: 'critical', label: `Kritis (${labCounts.critical})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setLabFilter(f.key as typeof labFilter)
              if (parsedSearch.labKeyword) setSearchTerm(parsedSearch.backendSearch)
            }}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              effectiveLabFilter === f.key
                ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-200'
                : 'bg-white text-slate-400 border-slate-100 hover:text-slate-700'
            }`}
          >
            {f.key !== 'all' && <FiDroplet className="inline w-3 h-3 mr-1.5 -mt-0.5" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Compact High-Density Table */}
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        {/* Compact High-Density Table (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Pasien</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">No. Rekam Medis</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Gender</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Kontak</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Lab</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Kunjungan Terakhir</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-slate-50 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : visiblePatients.length > 0 ? (
                visiblePatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          {patient.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none">{patient.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            Lahir: {new Date(patient.dateOfBirth).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg uppercase tracking-widest">
                        {patient.medicalRecordNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-600 italic">
                        {patient.gender === 'M' ? '♂ Laki-laki' : '♀ Perempuan'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <FiPhone className="w-3 h-3 text-slate-300" /> {patient.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const s = labSummary(patient)
                        if (!s.hasLab) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-lg uppercase tracking-widest">
                              <FiDroplet className="w-3 h-3" /> Belum Lab
                            </span>
                          )
                        }
                        return (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-200 rounded-lg uppercase tracking-widest">
                                <FiDroplet className="w-3 h-3" /> Pernah • {s.total}x
                              </span>
                              {s.critical && (
                                <span className="px-2 py-1 text-[9px] font-black text-white bg-rose-500 rounded-lg uppercase tracking-widest">
                                  Kritis
                                </span>
                              )}
                            </div>
                            {s.last && (
                              <p className="text-[10px] font-bold text-slate-400">
                                Terakhir: {new Date(s.last.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' • '}
                                <span className="uppercase">{s.last.status === 'completed' ? 'Selesai' : s.last.status === 'in_progress' ? 'Diproses' : 'Menunggu'}</span>
                              </p>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <FiCalendar className="w-3 h-3 text-emerald-400" />
                        {new Date(patient.medicalRecords?.[0]?.recordDate || patient.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2.5 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                         <FiExternalLink className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <FiUser className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Tidak Ada Data Pasien</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Layout */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-50 rounded w-3/4" />
              </div>
            ))
          ) : visiblePatients.length > 0 ? (
            visiblePatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                className="p-5 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">
                        {patient.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">{patient.name}</p>
                        <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-widest">{patient.medicalRecordNo}</p>
                      </div>
                   </div>
                   {(() => {
                     const s = labSummary(patient)
                     return s.hasLab ? (
                       <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black text-sky-700 bg-sky-50 border border-sky-200 rounded-lg uppercase tracking-widest">
                         <FiDroplet className="w-3 h-3" /> Lab {s.total}x{s.critical ? ' • Kritis' : ''}
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 rounded-lg uppercase tracking-widest">
                         <FiDroplet className="w-3 h-3" /> Belum Lab
                       </span>
                     )
                   })()}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gender & Lahir</p>
                    <p className="text-[10px] font-bold text-slate-600">
                      {patient.gender === 'M' ? 'Laki-laki' : 'Perempuan'} • {new Date(patient.dateOfBirth).getFullYear()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Kunjungan Terakhir</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <FiCalendar className="w-3 h-3 text-emerald-400" />
                      {new Date(patient.medicalRecords?.[0]?.recordDate || patient.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <FiUser className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Kosong</p>
            </div>
          )}
        </div>

        {/* Professional Pagination Footer */}
        <div className="px-6 md:px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 capitalize text-center md:text-left">
            Menampilkan <span className="text-slate-900">{meta.total > 0 ? (page - 1) * meta.limit + 1 : 0}</span> sampai <span className="text-slate-900">{Math.min(page * meta.limit, meta.total)}</span> dari <span className="text-slate-900">{meta.total}</span> pasien
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.totalPages }).map((_, i) => {
                const pNum = i + 1
                // Show only current, first, last, and relative pages if many
                if (
                  meta.totalPages > 7 &&
                  pNum !== 1 &&
                  pNum !== meta.totalPages &&
                  Math.abs(pNum - page) > 1
                ) {
                   if (pNum === 2 || pNum === meta.totalPages - 1) return <span key={pNum} className="px-2 text-slate-300 font-bold">...</span>
                   return null
                }
                
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      page === pNum 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-slate-500 hover:bg-white hover:text-emerald-600'
                    }`}
                  >
                    {pNum}
                  </button>
                )
              })}
            </div>

            <button 
              disabled={page === meta.totalPages || loading}
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
