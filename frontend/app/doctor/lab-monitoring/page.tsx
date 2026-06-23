'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiDroplet, FiRefreshCw, FiSearch,
  FiCheckCircle, FiAlertCircle, FiX, FiCalendar,
  FiHash, FiArrowLeft, FiTruck, FiPackage, FiEdit3,
  FiActivity, FiUser
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'

// ──────────────────────── Types ────────────────────────

type WorkOrderStatus = 'DRAFT' | 'PENDING_DP' | 'SENT_TO_LAB' | 'RECEIVED' | 'FITTED' | 'CANCELLED'

interface WorkOrder {
  id: string
  workOrderNo: string
  treatmentPlanId: string
  patientId: string
  labName: string
  labContact?: string
  labAddress?: string
  itemDescription: string
  jobType?: string
  material?: string
  stage?: string
  shade?: string
  size?: string
  toothNumber?: string
  estimatedDate?: string
  labFee: number
  status: WorkOrderStatus
  notes?: string
  sentDate?: string
  receivedDate?: string
  fittedDate?: string
  createdAt: string
  patient: {
    id: string
    name: string
    medicalRecordNo: string
    phone?: string
  }
  treatmentPlan?: {
    id: string
    description: string
    totalAmount: number
    status: string
    invoices?: { id: string; status: string; total: number; amountPaid: number }[]
    visits?: {
      id: string
      visitDate: string
      status: string
      order: number
      services: {
        id: string
        quantity: number
        price: number
        subtotal: number
        adjustedPrice?: number
        service?: { id: string; serviceName: string; category?: string }
      }[]
    }[]
  }
  doctor?: {
    id: string
    name: string
    specialization: string
  }
}

interface Stats {
  draft: number
  pending: number
  sent: number
  received: number
  fitted: number
  total: number
}

// ──────────────────────── Config ────────────────────────

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT:       { label: 'Draft',             color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',   icon: FiEdit3 },
  PENDING_DP:  { label: 'Menunggu DP',       color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: FiAlertCircle },
  SENT_TO_LAB: { label: 'Di Lab',            color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: FiTruck },
  RECEIVED:    { label: 'Diterima dari Lab', color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: FiPackage },
  FITTED:      { label: 'Sudah Dipasang',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle },
  CANCELLED:   { label: 'Dibatalkan',        color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',    icon: FiX },
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date?: string) => date
  ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

const formatDateTime = (date?: string) => date
  ? new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ──────────────────────── Component ────────────────────────

export default function DoctorLabMonitoringPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const doctorId = (user as any)?.doctor?.id

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [woRes, statsRes] = await Promise.all([
        api.get('/dental-lab/work-orders', {
          params: {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: search || undefined,
            doctorId: doctorId || undefined,
            page,
            limit: 15
          }
        }),
        api.get('/dental-lab/stats', { params: { doctorId: doctorId || undefined } })
      ])
      setWorkOrders(woRes.data?.data || [])
      if (woRes.data?.meta) {
        setTotalPages(woRes.data.meta.totalPages || 1)
        setTotalItems(woRes.data.meta.total || 0)
      }
      setStats(statsRes.data)
    } catch (e) {
      toast.error('Gagal memuat data SPK Lab')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page, doctorId])

  useEffect(() => { setPage(1) }, [statusFilter, search])
  useEffect(() => { fetchAll() }, [fetchAll])

  const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SENT_TO_LAB', label: 'Di Lab' },
    { key: 'RECEIVED', label: 'Diterima' },
    { key: 'FITTED', label: 'Dipasang' },
    { key: 'CANCELLED', label: 'Batal' },
  ]

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-40">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-[2rem] shadow-sm">
            <FiDroplet className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Monitoring Lab</h1>
              <button onClick={fetchAll} disabled={loading}
                className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg transition-all active:scale-90 group"
                title="Refresh">
                <FiRefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin text-blue-600' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Resume Rangkaian SPK Dental Lab Eksternal</p>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-300 active:scale-95 transition-all"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pemeriksaan</span>
        </button>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'Draft', value: stats.draft, color: 'bg-gray-50 text-gray-500 border-gray-200' },
            { label: 'Di Lab', value: stats.sent, color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'Diterima', value: stats.received, color: 'bg-violet-50 text-violet-600 border-violet-100' },
            { label: 'Dipasang', value: stats.fitted, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            { label: 'Pending DP', value: stats.pending, color: 'bg-orange-50 text-orange-600 border-orange-100' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Search & Filter ── */}
      <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 rounded-2xl">
          <FiSearch className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="CARI NO. SPK / PASIEN / LAB / ITEM..."
            className="bg-transparent border-none focus:outline-none text-[10px] font-black text-gray-700 w-full uppercase tracking-widest"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Work Order List ── */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <FiRefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4 opacity-30" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat data SPK...</p>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="bg-gray-50/50 rounded-[3rem] p-16 text-center border-4 border-dashed border-white flex flex-col items-center">
            <FiDroplet className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada SPK Lab</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workOrders.map((wo, idx) => {
              const cfg = STATUS_CONFIG[wo.status]
              const WOIcon = cfg.icon
              const isSelected = selectedWO?.id === wo.id
              return (
                <motion.div
                  key={wo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setSelectedWO(isSelected ? null : wo)}
                  className={`bg-white border rounded-[2rem] p-5 md:p-6 cursor-pointer group transition-all ${
                    isSelected
                      ? 'border-blue-300 shadow-xl shadow-blue-100 ring-2 ring-blue-200'
                      : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <WOIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 uppercase truncate">{wo.itemDescription}</p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {wo.workOrderNo}
                          {wo.jobType && ` • ${wo.jobType}`}
                          {wo.material && ` • ${wo.material}`}
                          {wo.stage && ` • ${wo.stage}`}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shrink-0 flex items-center gap-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <WOIcon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>

                  {/* Patient Info Focus */}
                  <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <FiUser className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-900 uppercase tracking-tight">{wo.patient.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">RM: {wo.patient.medicalRecordNo}</p>
                    </div>
                  </div>

                  {/* Lab info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-bold text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
                    <span className="flex items-center gap-1"><FiDroplet className="w-3 h-3 text-violet-400" />{wo.labName}</span>
                    {wo.toothNumber && <span className="flex items-center gap-1"><FiHash className="w-3 h-3 text-emerald-400" />Gigi {wo.toothNumber}</span>}
                    {wo.shade && <span className="flex items-center gap-1"><FiEdit3 className="w-3 h-3 text-amber-400" />Shade: {wo.shade}</span>}
                    {wo.size && <span className="flex items-center gap-1"><FiPackage className="w-3 h-3 text-violet-400" />Ukuran: {wo.size}</span>}
                    {wo.estimatedDate && <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 text-rose-400" />Est: {formatDate(wo.estimatedDate)}</span>}
                    {wo.labFee > 0 && <span className="flex items-center gap-1"><FiDroplet className="w-3 h-3 text-orange-400" />{formatCurrency(wo.labFee)}</span>}
                  </div>

                  {/* Plan description */}
                  {wo.treatmentPlan && (
                    <p className="text-[10px] text-gray-500 mb-2">
                      Rangkaian: <span className="font-bold text-gray-700">{wo.treatmentPlan.description}</span>
                    </p>
                  )}

                  {/* Expanded detail */}
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
                      {/* Detail Grid — like admin page */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Detail Tahapan Pekerjaan</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jenis Pekerjaan</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.jobType || '—'}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Material</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.material || '—'}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tahapan</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.stage || '—'}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nomor Gigi</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.toothNumber || '—'}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Shade / Warna</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.shade || '—'}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ukuran</p>
                            <p className="text-xs font-black text-gray-800 mt-0.5">{wo.size || '—'}</p>
                          </div>
                        </div>
                        {wo.labContact && (
                          <p className="text-[10px] text-gray-600 mt-1">Kontak Lab: <span className="font-bold">{wo.labContact}</span></p>
                        )}
                        {wo.labAddress && (
                          <p className="text-[10px] text-gray-600">Alamat Lab: <span className="font-bold">{wo.labAddress}</span></p>
                        )}
                      </div>

                      {/* Notes */}
                      {wo.notes && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Catatan</p>
                          <p className="text-xs text-gray-700">{wo.notes}</p>
                        </div>
                      )}

                      {/* ── Visit Timeline with Tindakan ── */}
                      {wo.treatmentPlan?.visits && wo.treatmentPlan.visits.length > 0 && (
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Timeline Kunjungan</p>
                          <div className="space-y-3">
                            {wo.treatmentPlan.visits.map((visit, vIdx) => (
                              <div key={visit.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {/* Visit header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent border-b border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                                      {vIdx + 1}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-gray-800 uppercase">Kunjungan #{vIdx + 1}</p>
                                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                        visit.status === 'SELESAI'
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                          : visit.status === 'DIANTAR'
                                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                      }`}>
                                        {visit.status}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-500">
                                    {new Date(visit.visitDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                                {/* Services list */}
                                {visit.services.length > 0 && (
                                  <div className="p-3 space-y-1">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Tindakan / Layanan</p>
                                    {visit.services.map((svc) => (
                                      <div key={svc.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-[11px] text-gray-700 font-medium">
                                          {svc.service?.serviceName || 'Tindakan'}
                                        </span>
                                        <span className="text-[11px] font-bold text-gray-800 tabular-nums">
                                          {formatCurrency(svc.adjustedPrice || svc.subtotal || (svc.price * (svc.quantity || 1)))}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {visit.services.length === 0 && (
                                  <p className="text-[10px] text-gray-400 italic p-3">Belum ada tindakan</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress Timeline */}
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-5">Progress SPK</p>
                        <div className="relative flex items-start justify-between">
                          {/* Connecting line background */}
                          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 rounded-full" />
                          {/* Active progress line */}
                          <div
                            className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full transition-all duration-500"
                            style={{
                              width: (() => {
                                const steps = [wo.createdAt, wo.sentDate, wo.receivedDate, wo.fittedDate]
                                const done = steps.filter(Boolean).length
                                if (done <= 1) return '0%'
                                const pct = ((done - 1) / 3) * 100
                                return `calc(${pct}% - ${pct > 0 ? '0px' : '0px'})`
                              })()
                            }}
                          />

                          {[
                            { label: 'Dibuat', date: wo.createdAt, icon: FiEdit3, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' },
                            { label: 'Dikirim', date: wo.sentDate, icon: FiTruck, activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-110' },
                            { label: 'Diterima', date: wo.receivedDate, icon: FiPackage, activeClass: 'bg-violet-500 text-white shadow-lg shadow-violet-200 scale-110' },
                            { label: 'Dipasang', date: wo.fittedDate, icon: FiCheckCircle, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110' },
                          ].map((step, i) => {
                            const done = !!step.date
                            const Icon = step.icon
                            return (
                              <div key={i} className="relative z-10 flex flex-col items-center" style={{ width: '25%' }}>
                                {/* Dot */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                  done
                                    ? step.activeClass
                                    : 'bg-white border-2 border-gray-200 text-gray-300'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {/* Label */}
                                <p className={`mt-2.5 text-[9px] font-black uppercase tracking-widest ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                                  {step.label}
                                </p>
                                {/* Date */}
                                <p className={`text-[10px] font-bold mt-0.5 ${done ? 'text-gray-600' : 'text-gray-300'}`}>
                                  {step.date ? new Date(step.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Lab fee */}
                      {wo.labFee > 0 && (
                        <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Biaya Lab</p>
                          <p className="text-sm font-black text-amber-700">{formatCurrency(wo.labFee)}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400">
            Menampilkan <span className="text-gray-700 font-black">{((page - 1) * 15) + 1}–{Math.min(page * 15, totalItems)}</span> dari <span className="text-gray-700 font-black">{totalItems}</span> SPK
          </p>
          <div className="flex items-center gap-1.5">
            {/* First page */}
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${page === 1 ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Halaman pertama"
            >
              &laquo;
            </button>
            {/* Prev */}
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${page === 1 ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Sebelumnya"
            >
              &lsaquo;
            </button>
            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
              .map((p, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span key={`dots-${p}`} className="w-9 h-9 flex items-center justify-center text-[10px] text-gray-300 font-black">…</span>
                  )}
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${
                      p === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                        : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {p}
                  </button>
                </>
              ))}
            {/* Next */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${page === totalPages ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Selanjutnya"
            >
              &rsaquo;
            </button>
            {/* Last page */}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className={`w-9 h-9 rounded-xl text-[10px] font-black flex items-center justify-center transition-all ${page === totalPages ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400' : 'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Halaman terakhir"
            >
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
