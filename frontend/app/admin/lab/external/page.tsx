'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiDroplet, FiRefreshCw, FiSearch, FiPrinter,
  FiCheck, FiPackage, FiAlertCircle,
  FiX, FiCalendar, FiClock, FiHash,
  FiPhone, FiMapPin, FiDollarSign, FiArrowRight,
  FiInfo, FiCheckCircle, FiTruck, FiEdit3, FiTrash2
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
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
  shade?: string
  size?: string
  toothNumber?: string
  estimatedDate?: string
  sentDate?: string
  receivedDate?: string
  fittedDate?: string
  status: WorkOrderStatus
  labFee: number
  notes?: string
  createdAt: string
  updatedAt: string
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

// ──────────────────────── Helpers ────────────────────────

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT:       { label: 'Draft',             color: 'text-gray-500',    bg: 'bg-gray-50',     border: 'border-gray-200', icon: FiEdit3 },
  PENDING_DP:  { label: 'Menunggu DP',       color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200', icon: FiAlertCircle },
  SENT_TO_LAB: { label: 'Di Lab',            color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200', icon: FiTruck },
  RECEIVED:    { label: 'Diterima dari Lab', color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200', icon: FiPackage },
  FITTED:      { label: 'Sudah Dipasang',    color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: FiCheckCircle },
  CANCELLED:   { label: 'Dibatalkan',        color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-200', icon: FiX },
}

const NEXT_STATUS: Partial<Record<WorkOrderStatus, { status: WorkOrderStatus; label: string; color: string }>> = {
  DRAFT:       { status: 'SENT_TO_LAB', label: 'Kirim ke Lab',    color: 'bg-blue-500 text-white hover:bg-blue-600' },
  SENT_TO_LAB: { status: 'RECEIVED',    label: 'Terima Barang',   color: 'bg-violet-500 text-white hover:bg-violet-600' },
  RECEIVED:    { status: 'FITTED',      label: 'Tandai Dipasang', color: 'bg-emerald-500 text-white hover:bg-emerald-600' },
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date?: string) => date
  ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'

const formatDateTime = (date?: string) => date
  ? new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// ──────────────────────── Print Function ────────────────────────

const printWorkOrder = async (wo: WorkOrder) => {
  const printWindow = window.open('', '_blank', 'width=794,height=1123')
  if (!printWindow) return

  const statusLabel = STATUS_CONFIG[wo.status]?.label || wo.status

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>SPK Lab - ${wo.workOrderNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 24px 32px; max-width: 210mm; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: flex-start; gap: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 16px; }
    .clinic-logo { width: 200px; height: auto; object-fit: contain; margin-left: -35px; margin-right: -65px; }
    .clinic-text { display: flex; flex-direction: column; text-align: left; gap: 5px; }
    .clinic-name { font-size: 22px; font-weight: bold; color: #008a45; text-transform: uppercase; white-space: nowrap; font-family: Arial, sans-serif; }
    .clinic-address { font-size: 11px; color: #4b5563; line-height: 1.5; }
    
    .doc-title-centered { text-align: center; margin-bottom: 16px; }
    .doc-title-centered h2 { font-size: 16px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 2px; }
    .doc-title-centered .no { font-size: 11px; font-weight: bold; color: #008a45; background: #eaf4f0; padding: 4px 12px; border-radius: 6px; margin-top: 6px; display: inline-block; border: 1px solid #bbf7d0; }
    .doc-title-centered .date { font-size: 10px; color: #6b7280; margin-top: 6px; font-weight: bold; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    .section-title { font-size: 9px; font-weight: 900; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
    .section-title::before { content: ''; display: block; width: 3px; height: 12px; background: #008a45; border-radius: 2px; }
    .field { margin-bottom: 5px; }
    .field label { font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .field span { font-size: 11px; font-weight: bold; color: #1a1a1a; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; background: #eaf4f0; color: #008a45; text-transform: uppercase; letter-spacing: 0.5px; }
    .item-row { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 4px; }
    .item-row label { font-size: 9px; color: #6b7280; text-transform: uppercase; }
    .item-row span { font-size: 12px; font-weight: bold; }
    .footer { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .sign-box { text-align: center; }
    .sign-box .role { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: bold; margin-bottom: 3px; }
    .sign-space { height: 50px; border-bottom: 1px solid #374151; margin-bottom: 4px; }
    .sign-box .name { font-size: 10px; font-weight: bold; }
    .watermark { text-align: center; margin-top: 24px; font-size: 9px; color: #d1d5db; }
    @page { size: A4; margin: 0; }
    @media print { 
      body { padding: 15mm 20mm; width: 100%; max-width: 210mm; margin: 0 auto; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo-yasfina_web.png" alt="Logo" class="clinic-logo" />
    <div class="clinic-text">
      <div class="clinic-name">LABORATORIUM KLINIK PRATAMA YASFINA</div>
      <div class="clinic-address">
        Villa Bogor Indah Blok BB 2 No. 1 Kedung Halang - Bogor<br/>
        Telp. : 0251-8666169
      </div>
    </div>
  </div>

  <div class="doc-title-centered">
    <h2>SPK Lab Eksternal</h2>
    <div class="no">${wo.workOrderNo}</div>
    <div class="date">Tanggal: ${formatDate(wo.createdAt)}</div>
  </div>

  <div class="grid-2">
    <div class="section">
      <div class="section-title">Data Pasien</div>
      <div class="field"><label>Nama Pasien</label><span>${wo.patient.name}</span></div>
      <div class="field"><label>No. Rekam Medis</label><span>${wo.patient.medicalRecordNo}</span></div>
      <div class="field"><label>Rangkaian Perawatan</label><span>${wo.treatmentPlan?.description || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Data Lab Eksternal</div>
      <div class="field"><label>Nama Lab</label><span>${wo.labName}</span></div>
      <div class="field"><label>Kontak Lab</label><span>${wo.labContact || '—'}</span></div>
      <div class="field"><label>Alamat Lab</label><span>${wo.labAddress || '—'}</span></div>
      <div class="field"><label>Status SPK</label><span class="badge">${statusLabel}</span></div>
    </div>
  </div>

  <div class="section" style="margin-bottom:14px;">
    <div class="section-title">Detail Pekerjaan</div>
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
      <div class="item-row" style="flex-direction:column;"><label>Jenis Pekerjaan</label><span>${wo.itemDescription}</span></div>
      <div class="item-row" style="flex-direction:column;"><label>Nomor Gigi</label><span>${wo.toothNumber || '—'}</span></div>
      <div class="item-row" style="flex-direction:column;"><label>Shade / Warna</label><span>${wo.shade || '—'}</span></div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
      <div class="item-row" style="flex-direction:column;"><label>Ukuran / Cetakan</label><span>${wo.size || '—'}</span></div>
      <div class="item-row" style="flex-direction:column;"><label>Target Selesai</label><span>${formatDate(wo.estimatedDate)}</span></div>
    </div>
    ${wo.notes ? `<div style="margin-top:10px; padding:10px; background:#f0fdf4; border-radius:6px; border-left:3px solid #166534;"><label style="font-size:9px;color:#166534;font-weight:700;display:block;margin-bottom:4px;">CATATAN DOKTER</label><span style="font-size:11px;">${wo.notes}</span></div>` : ''}
  </div>

  <div class="footer">
    <div class="sign-box">
      <div class="role">Dokter Pengirim</div>
      <div class="sign-space"></div>
      <div class="name">( _________________________ )</div>
    </div>
    <div class="sign-box">
      <div class="role">Penerima Lab</div>
      <div class="sign-space"></div>
      <div class="name">( _________________________ )</div>
    </div>
    <div class="sign-box">
      <div class="role">Mengetahui</div>
      <div class="sign-space"></div>
      <div class="name">( _________________________ )</div>
    </div>
  </div>

  <div class="watermark">Dicetak dari Sistem Klinik — ${new Date().toLocaleString('id-ID')} — ${wo.workOrderNo}</div>
</body>
</html>`)
  printWindow.document.close()
  setTimeout(() => printWindow.print(), 500)
}

// ──────────────────────── Component ────────────────────────

export default function DentalLabExternalPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<WorkOrderStatus | null>(null)
  const clinicName = 'Klinik Anda' // Bisa diambil dari store

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [woRes, statsRes] = await Promise.all([
        api.get('/dental-lab/work-orders', {
          params: {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: search || undefined,
            page,
            limit: 15
          }
        }),
        api.get('/dental-lab/stats')
      ])
      setWorkOrders(woRes.data?.data || [])
      if (woRes.data?.meta) {
        setTotalPages(woRes.data.meta.totalPages || 1)
        setTotalItems(woRes.data.meta.total || 0)
      }
      setStats(statsRes.data)
    } catch (e) {
      toast.error('Gagal memuat data Work Order')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => { setPage(1) }, [statusFilter, search])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleUpdateStatus = async () => {
    if (!selectedWO || !pendingStatus) return
    try {
      setProcessing(true)
      await api.patch(`/dental-lab/work-orders/${selectedWO.id}/status`, { status: pendingStatus })
      toast.success(`Status berhasil diubah ke: ${STATUS_CONFIG[pendingStatus]?.label}`)
      setShowStatusModal(false)
      setPendingStatus(null)
      setSelectedWO(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal update status')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (wo: WorkOrder) => {
    if (!confirm(`Hapus Work Order ${wo.workOrderNo}? Aksi ini tidak bisa dibatalkan.`)) return
    try {
      setProcessing(true)
      await api.delete(`/dental-lab/work-orders/${wo.id}`)
      toast.success('Work Order berhasil dihapus')
      setSelectedWO(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus Work Order')
    } finally {
      setProcessing(false)
    }
  }

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
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Lab Eksternal</h1>
              <button onClick={fetchAll} disabled={loading}
                className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg transition-all active:scale-90 group"
                title="Refresh">
                <FiRefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin text-blue-600' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monitoring SPK Dental Lab Eksternal</p>
          </div>
        </div>
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

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT: List Panel */}
        <div className={`${selectedWO ? 'lg:w-[420px]' : 'w-full'} shrink-0 space-y-4 transition-all duration-300`}>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl">
              <FiSearch className="text-gray-400 shrink-0" />
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="CARI PASIEN / NO. SPK / LAB..."
                className="bg-transparent border-none focus:outline-none text-[10px] font-black text-gray-700 w-full uppercase tracking-widest"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${statusFilter === f.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="py-20 text-center">
                <FiRefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3 opacity-30" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat data...</p>
              </div>
            ) : workOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-[3rem] p-16 text-center border-4 border-dashed border-white">
                <FiDroplet className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada Work Order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workOrders.map((wo, idx) => {
                  const cfg = STATUS_CONFIG[wo.status]
                  const StatusIcon = cfg.icon
                  const isSelected = selectedWO?.id === wo.id
                  return (
                    <motion.div
                      key={wo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedWO(wo)}
                      className={`bg-white border rounded-[2rem] p-5 cursor-pointer group transition-all ${isSelected ? 'border-blue-400/60 shadow-xl shadow-blue-100 ring-2 ring-blue-200' : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200/40'}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 uppercase truncate">{wo.patient.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 font-mono">{wo.patient.medicalRecordNo}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0 flex items-center gap-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-600 mb-2 truncate">{wo.itemDescription}</p>
                      <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><FiHash className="w-3 h-3" />{wo.workOrderNo}</span>
                        <span className="flex items-center gap-1"><FiDroplet className="w-3 h-3" />{wo.labName}</span>
                        {wo.estimatedDate && (
                          <span className="flex items-center gap-1 text-blue-500"><FiCalendar className="w-3 h-3" />{formatDate(wo.estimatedDate)}</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))}
                className={`px-4 py-2 bg-gray-50 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${page === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:bg-gray-50'}`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className={`px-4 py-2 bg-gray-50 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}`}>Next</button>
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedWO && (
            <motion.div key={selectedWO.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="flex-1 min-w-0 space-y-5">

              {/* Header Card */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center text-blue-600">
                      <FiDroplet className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{selectedWO.patient.name}</h2>
                      <p className="text-[10px] font-bold text-gray-400 font-mono">{selectedWO.patient.medicalRecordNo} {selectedWO.patient.phone && `• ${selectedWO.patient.phone}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => printWorkOrder(selectedWO)}
                      disabled={selectedWO.status === 'PENDING_DP' || selectedWO.status === 'DRAFT'}
                      className={`p-2.5 rounded-xl transition-all ${
                        selectedWO.status === 'PENDING_DP' || selectedWO.status === 'DRAFT'
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`} 
                      title={selectedWO.status === 'PENDING_DP' || selectedWO.status === 'DRAFT' ? 'Tidak dapat mencetak SPK berstatus Draft / Menunggu DP' : 'Cetak SPK'}
                    >
                      <FiPrinter className="w-5 h-5" />
                    </button>
                    {selectedWO.status === 'DRAFT' && (
                      <button onClick={() => handleDelete(selectedWO)} disabled={processing}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => setSelectedWO(null)}
                      className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status Badge + Number */}
                <div className="flex items-center gap-3 mb-4">
                  {(() => { const cfg = STATUS_CONFIG[selectedWO.status]; const Icon = cfg.icon; return (
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <Icon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                  )})()}
                  <span className="text-[10px] font-bold text-gray-400 font-mono">{selectedWO.workOrderNo}</span>
                </div>

                {(selectedWO.status === 'DRAFT' || selectedWO.status === 'PENDING_DP') && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-orange-700">Tertunda: Menunggu DP Kasir</p>
                      <p className="text-[10px] text-orange-600 mt-0.5">SPK ini masih berstatus <b>Draft</b> karena pasien belum membayar DP di Kasir. SPK ini tidak boleh diproses atau dikirim ke Lab Eksternal sampai pembayaran DP diterima.</p>
                    </div>
                  </div>
                )}

                {/* Treatment Plan Info */}
                {selectedWO.treatmentPlan && (
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Rangkaian Perawatan</p>
                    <p className="text-sm font-bold text-gray-800">{selectedWO.treatmentPlan.description}</p>
                  </div>
                )}

                {/* Next Action Button */}
                {NEXT_STATUS[selectedWO.status] && (
                  <button
                    onClick={() => { setPendingStatus(NEXT_STATUS[selectedWO.status]!.status); setShowStatusModal(true) }}
                    className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${NEXT_STATUS[selectedWO.status]!.color}`}
                  >
                    <FiArrowRight className="w-4 h-4" />
                    {NEXT_STATUS[selectedWO.status]!.label}
                  </button>
                )}
              </div>

              {/* Detail Pekerjaan */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><FiInfo className="w-4 h-4" /></div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Detail Pekerjaan Lab</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Nama Lab', value: selectedWO.labName, icon: FiDroplet },
                    { label: 'Kontak Lab', value: selectedWO.labContact || '—', icon: FiPhone },
                    { label: 'Alamat Lab', value: selectedWO.labAddress || '—', icon: FiMapPin },
                    { label: 'Jenis Item', value: selectedWO.itemDescription, icon: FiPackage },
                    { label: 'Nomor Gigi', value: selectedWO.toothNumber || '—', icon: FiHash },
                    { label: 'Shade / Warna', value: selectedWO.shade || '—', icon: FiEdit3 },
                    { label: 'Ukuran/Cetakan', value: selectedWO.size || '—', icon: FiEdit3 },
                    { label: 'Biaya Lab', value: formatCurrency(selectedWO.labFee), icon: FiDollarSign },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                      <p className="text-sm font-bold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
                {selectedWO.notes && (
                  <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Catatan Dokter</p>
                    <p className="text-sm text-gray-700">{selectedWO.notes}</p>
                  </div>
                )}
              </div>

              {/* Timeline Status */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500"><FiClock className="w-4 h-4" /></div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Timeline Status</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'SPK Dibuat', date: selectedWO.createdAt, done: true },
                    { label: 'Dikirim ke Lab', date: selectedWO.sentDate, done: !!selectedWO.sentDate },
                    { label: 'Diterima dari Lab', date: selectedWO.receivedDate, done: !!selectedWO.receivedDate },
                    { label: 'Dipasang ke Pasien', date: selectedWO.fittedDate, done: !!selectedWO.fittedDate },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${step.done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step.done ? <FiCheck className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-black uppercase tracking-widest ${step.done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>
                        {step.date && <p className="text-[10px] text-gray-400">{formatDateTime(step.date)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimasi Selesai */}
              {selectedWO.estimatedDate && (
                <div className={`rounded-[2rem] p-5 border flex items-center gap-4 ${
                  new Date(selectedWO.estimatedDate) < new Date() && selectedWO.status !== 'FITTED'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <FiCalendar className={`w-6 h-6 shrink-0 ${new Date(selectedWO.estimatedDate) < new Date() && selectedWO.status !== 'FITTED' ? 'text-red-500' : 'text-blue-500'}`} />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Target Selesai Lab</p>
                    <p className="text-sm font-black text-gray-800">{formatDate(selectedWO.estimatedDate)}</p>
                    {new Date(selectedWO.estimatedDate) < new Date() && selectedWO.status !== 'FITTED' && (
                      <p className="text-[10px] text-red-600 font-bold mt-0.5">⚠️ Melewati target estimasi!</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Confirm Status Modal ── */}
      <AnimatePresence>
        {showStatusModal && pendingStatus && selectedWO && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !processing && setShowStatusModal(false)}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8">
              {(() => { const cfg = STATUS_CONFIG[pendingStatus]; const Icon = cfg.icon; return (
                <>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${cfg.bg}`}>
                    <Icon className={`w-7 h-7 ${cfg.color}`} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 text-center uppercase tracking-tight mb-2">
                    Konfirmasi Update Status
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Ubah status Work Order <span className="font-bold text-gray-700">{selectedWO.workOrderNo}</span> menjadi{' '}
                    <span className={`font-black ${cfg.color}`}>{cfg.label}</span>?
                  </p>
                  {pendingStatus === 'RECEIVED' && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
                      <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <FiInfo className="w-3.5 h-3.5" /> Notifikasi Otomatis
                      </p>
                      <p className="text-xs text-violet-600">Sistem akan mengirim notifikasi ke Perawat/Admin untuk segera menghubungi pasien dan menjadwalkan pemasangan.</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => !processing && setShowStatusModal(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                      Batal
                    </button>
                    <button onClick={handleUpdateStatus} disabled={processing}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${cfg.bg.replace('bg-', 'bg-').replace('-50', '-500')} text-white`}>
                      {processing ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                      {processing ? 'Memproses...' : 'Ya, Update'}
                    </button>
                  </div>
                </>
              )})()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
