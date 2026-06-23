'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FiLayers, FiPlus, FiSearch, FiRefreshCw, FiUser, FiCalendar,
  FiCheckCircle, FiClock, FiDollarSign, FiFileText, FiX,
  FiChevronRight, FiActivity, FiCreditCard, FiEye, FiTrash2, FiUserCheck,
  FiArrowRight, FiHash, FiDroplet, FiPrinter, FiAlertCircle,
  FiPackage, FiTruck, FiEdit3, FiPhone, FiMapPin, FiUploadCloud
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'
import TreatmentStepModal from '@/components/doctor/TreatmentStepModal'

// ──────────────────────── Types ────────────────────────

interface Patient {
  id: string
  name: string
  medicalRecordNo: string
  phone?: string
  gender?: string
  dateOfBirth?: string
  address?: string
}

interface Visit {
  id: string
  order: number
  visitDate: string
  notes?: string
  status?: string
  services?: any[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  subtotal: number
  serviceId?: string
  service?: { id: string; serviceCode: string; serviceName: string }
}

interface PaymentRecord {
  id: string
  paymentNo: string
  amount: number
  paymentMethod: string
  paymentDate: string
  notes?: string
}

interface Invoice {
  id: string
  invoiceNo: string
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  status: string
  items: InvoiceItem[]
  payments: PaymentRecord[]
}

interface TreatmentPlanItem {
  id: string
  description: string
  quantity: number
  price: number
  subtotal: number
}

type WorkOrderStatus = 'DRAFT' | 'PENDING_DP' | 'SENT_TO_LAB' | 'RECEIVED' | 'FITTED' | 'CANCELLED'

interface WorkOrder {
  id: string
  workOrderNo: string
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
}

const WO_STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DRAFT:       { label: 'Draft',             color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',   icon: FiEdit3 },
  PENDING_DP:  { label: 'Menunggu DP',       color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: FiAlertCircle },
  SENT_TO_LAB: { label: 'Di Lab',            color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: FiTruck },
  RECEIVED:    { label: 'Diterima dari Lab', color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: FiPackage },
  FITTED:      { label: 'Sudah Dipasang',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: FiCheckCircle },
  CANCELLED:   { label: 'Dibatalkan',        color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',    icon: FiX },
}

interface TreatmentPlan {
  id: string
  description: string
  totalAmount: number
  calculatedTotalAmount?: number
  status: 'ACTIVE' | 'COMPLETED'
  createdAt: string
  patient: Patient
  visits: Visit[]
  invoices?: Invoice[]
  items?: TreatmentPlanItem[]
  workOrders?: WorkOrder[]
  doctor?: { id: string; name: string }
  doctorProfitSharePercent?: number
  doctorProfitShareAmount?: number
  isProfitSharePosted?: boolean
}

// ──────────────────────── Helpers ────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// ──────────────────────── Component ────────────────────────

export default function TreatmentPlansPage() {
  const { activeClinicId, user } = useAuthStore()

  // List state
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Detail state
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Create form
  const [createForm, setCreateForm] = useState<{
    patientSearch: string;
    patientId: string;
    description: string;
    doctorId: string;
    items: { id: string; description: string; quantity: number; price: number }[];
  }>({ 
    patientSearch: '', 
    patientId: '', 
    description: '',
    doctorId: '',
    items: [] 
  })
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)

  // Visit form — #12: now uses TreatmentStepModal for service selection
  const [showStepModal, setShowStepModal] = useState(false)

  const [editingScheduleVisitId, setEditingScheduleVisitId] = useState<string | null>(null)
  const [editScheduleDate, setEditScheduleDate] = useState('')
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editServicePrice, setEditServicePrice] = useState<number>(0)
  const [editServiceQty, setEditServiceQty] = useState<number>(1)

  const handleUpdateVisitSchedule = async (visitId: string) => {
    if (!selectedPlan) return
    try {
      setProcessing(true)
      await api.put(`/treatment-plans/${selectedPlan.id}/visits/${visitId}/schedule`, { visitDate: editScheduleDate || null })
      toast.success('Jadwal kunjungan berhasil diperbarui')
      setEditingScheduleVisitId(null)
      fetchDetail(selectedPlan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah jadwal')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateServicePrice = async (visitId: string, serviceId: string) => {
    if (!selectedPlan) return
    try {
      setProcessing(true)
      await api.patch(`/treatment-plans/${selectedPlan.id}/visits/${visitId}/services/${serviceId}/price`, { price: editServicePrice, quantity: editServiceQty })
      toast.success('Harga dan kuantitas berhasil diperbarui')
      setEditingServiceId(null)
      fetchDetail(selectedPlan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah harga layanan')
    } finally {
      setProcessing(false)
    }
  }

  const [profitSharePercent, setProfitSharePercent] = useState<number>(40)
  const [isPostingProfit, setIsPostingProfit] = useState(false)

  const handlePostProfitShare = async () => {
    if (!selectedPlan) return
    if (!window.confirm('Apakah Anda yakin ingin mem-posting Profit Sharing ini ke Laporan Keuangan?\nJurnal Akrual akan otomatis dibuat dan tidak dapat dibatalkan melalui halaman ini.')) return
    try {
      setIsPostingProfit(true)
      await api.post(`/treatment-plans/${selectedPlan.id}/post-profit-share`, { percent: profitSharePercent })
      toast.success('Profit Sharing berhasil di-posting ke laporan keuangan')
      fetchDetail(selectedPlan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mem-posting profit sharing')
    } finally {
      setIsPostingProfit(false)
    }
  }

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState<{ description: string, price: number, isLabDeposit?: boolean }>({ description: 'DP / Termin', price: 0, isLabDeposit: false })

  // Work Order state
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false)
  const [woLoading, setWoLoading] = useState(false)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [woForm, setWoForm] = useState({
    labName: '',
    labContact: '',
    labAddress: '',
    itemDescription: '',
    jobType: '',
    material: '',
    stage: '',
    doctorId: '',
    shade: '',
    size: '',
    toothNumber: '',
    estimatedDate: '',
    labFee: 0,
    notes: '',
  })
  const [woAttachments, setWoAttachments] = useState<File[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  // Fetch WOs for selected plan
  const fetchWorkOrders = useCallback(async (planId: string) => {
    try {
      setWoLoading(true)
      const res = await api.get('/dental-lab/work-orders', { params: { treatmentPlanId: planId } })
      // Filter client-side untuk treatmentPlan yang dipilih
      const allWOs = res.data?.data || []
      setWorkOrders(allWOs.filter((wo: WorkOrder & { treatmentPlanId: string }) => wo.treatmentPlanId === planId))
    } catch {
      setWorkOrders([])
    } finally {
      setWoLoading(false)
    }
  }, [])


  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/treatment-plans', {
        params: {
          search: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          limit: 10
        }
      })
      const data = res.data?.data || []
      setPlans(data)
      if (res.data?.meta) {
        setTotalPages(res.data.meta.totalPages || 1)
        setTotalItems(res.data.meta.total || data.length)
      }
    } catch (error) {
      console.error('Fetch TreatmentPlans Error:', error)
      toast.error('Gagal mengambil data rangkaian perawatan')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, activeClinicId])

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/master/doctors')
      // Filter hanya dokter gigi (Dokter Gigi / Sp.KG / Sp.BM dll)
      const allDocs = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      const dentistDocs = allDocs.filter((d: any) => 
        d.specialization?.toLowerCase().includes('gigi') || 
        d.specialization?.toLowerCase().includes('sp.kg') || 
        d.specialization?.toLowerCase().includes('sp.bm') ||
        d.specialization?.toLowerCase().includes('sp.ort') ||
        d.specialization?.toLowerCase().includes('dent')
      )
      
      setDoctors(dentistDocs)
      
      // Auto-fill for doctor
      if (user?.role === 'DOCTOR') {
        const myDoc = dentistDocs.find((d: any) => d.userId === user.id)
        if (myDoc) {
          setWoForm(f => ({ ...f, doctorId: myDoc.id }))
          setCreateForm(f => ({ ...f, doctorId: myDoc.id }))
        }
      }
    } catch {
      // ignore
    }
  }, [user])

  useEffect(() => { setPage(1) }, [search, statusFilter])
  useEffect(() => { 
    fetchPlans() 
    fetchDoctors()
  }, [fetchPlans, fetchDoctors])

  // ── Fetch detail ──
  const fetchDetail = async (id: string) => {
    try {
      setDetailLoading(true)
      const res = await api.get(`/treatment-plans/${id}`)
      setSelectedPlan(res.data)
      if (res.data?.doctorProfitSharePercent !== undefined) {
        setProfitSharePercent(res.data.doctorProfitSharePercent)
      } else {
        setProfitSharePercent(40)
      }
      fetchWorkOrders(id) // Load WOs for this plan
    } catch {
      toast.error('Gagal mengambil detail')
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Search patients ──
  const searchPatients = async (q: string) => {
    setCreateForm(f => ({ ...f, patientSearch: q }))
    if (q.length < 2) { setPatientResults([]); return }
    try {
      setSearchingPatients(true)
      const res = await api.get('/master/patients', { params: { search: q, limit: 5 } })
      setPatientResults(res.data?.data || res.data || [])
    } catch {
      setPatientResults([])
    } finally {
      setSearchingPatients(false)
    }
  }

  // ── Create treatment plan ──
  const handleCreate = async () => {
    if (!createForm.patientId || !createForm.description) {
      return toast.error('Pilih pasien dan isi deskripsi perawatan')
    }
    try {
      setProcessing(true)
      await api.post('/treatment-plans', {
        patientId: createForm.patientId,
        doctorId: createForm.doctorId || undefined,
        description: createForm.description,
        items: createForm.items
      })
      toast.success('Rangkaian Perawatan berhasil dibuat!')
      setShowCreateModal(false)
      setCreateForm(f => ({ ...f, patientSearch: '', patientId: '', description: '', items: [] }))
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat rangkaian perawatan')
    } finally {
      setProcessing(false)
    }
  }

  // ── Create Work Order (SPK Lab) ──
  const handleCreateWorkOrder = async () => {
    if (!selectedPlan || !woForm.labName) {
      return toast.error('Nama Lab wajib diisi')
    }
    if (!woForm.itemDescription && (!woForm.jobType || !woForm.material)) {
      return toast.error('Deskripsi Item atau Jenis Pekerjaan & Material wajib diisi')
    }
    try {
      setProcessing(true)
      
      const formData = new FormData()
      formData.append('treatmentPlanId', selectedPlan.id)
      Object.entries(woForm).forEach(([key, val]) => {
        if (key === 'labFee') {
          formData.append(key, String(parseFloat(String(val)) || 0))
        } else if (val) {
          formData.append(key, String(val))
        }
      })
      
      woAttachments.forEach(file => {
        formData.append('attachments', file)
      })

      await api.post('/dental-lab/work-orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('🧪 SPK Lab berhasil dibuat!')
      setShowWorkOrderModal(false)
      setWoForm({ labName: '', labContact: '', labAddress: '', itemDescription: '', jobType: '', material: '', stage: '', doctorId: '', shade: '', size: '', toothNumber: '', estimatedDate: '', labFee: 0, notes: '' })
      setWoAttachments([])
      fetchWorkOrders(selectedPlan.id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal membuat SPK Lab'
      if (err?.response?.data?.errorCode === 'NO_DP_FOUND') {
        toast.error('❌ SPK belum bisa dibuat — Pasien belum bayar DP!', { duration: 5000 })
      } else {
        toast.error(msg)
      }
    } finally {
      setProcessing(false)
    }
  }



  // ── Edit treatment plan ──
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState('')

  const handleUpdatePlan = async () => {
    if (!selectedPlan || !editDesc.trim()) return
    try {
      setProcessing(true)
      await api.put(`/treatment-plans/${selectedPlan.id}`, { description: editDesc })
      toast.success('Deskripsi berhasil diubah')
      setIsEditingDesc(false)
      fetchDetail(selectedPlan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal merubah deskripsi')
    } finally {
      setProcessing(false)
    }
  }

  // ── Delete treatment plan ──
  const handleDeletePlan = async () => {
    if (!selectedPlan) return
    if (!confirm('Apakah Anda yakin ingin menghapus rangkaian perawatan ini?')) return
    try {
      setProcessing(true)
      await api.delete(`/treatment-plans/${selectedPlan.id}`)
      toast.success('Rangkaian perawatan berhasil dihapus')
      setSelectedPlan(null)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus rangkaian perawatan')
    } finally {
      setProcessing(false)
    }
  }

  // ── Add visit — now handled by TreatmentStepModal ──

  // ── Create Invoice ──
  const handleCreateInvoice = async () => {
    if (!selectedPlan || !invoiceForm.description || !invoiceForm.price) {
      return toast.error('Isi deskripsi tagihan dan jumlah')
    }
    try {
      setProcessing(true)
      await api.post(`/treatment-plans/${selectedPlan.id}/invoices`, {
        items: [{ description: invoiceForm.description, price: invoiceForm.price }],
        isLabDeposit: invoiceForm.isLabDeposit
      })
      toast.success('Tagihan berhasil dibuat! Silakan selesaikan di modul Finance.')
      setShowInvoiceModal(false)
      setInvoiceForm({ description: 'DP / Termin', price: 0, isLabDeposit: false })
      fetchDetail(selectedPlan.id)
      fetchPlans()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat tagihan')
    } finally {
      setProcessing(false)
    }
  }

  // ⚡ Computed ⚡
  const totalPlanAmount = useMemo(() => selectedPlan?.calculatedTotalAmount || selectedPlan?.totalAmount || 0, [selectedPlan])
  const totalLabFee = useMemo(() => {
    if (!selectedPlan?.workOrders) return 0;
    return selectedPlan.workOrders.reduce((sum: number, wo: any) => sum + (Number(wo.labFee) || 0), 0);
  }, [selectedPlan])
  const totalInvoiced = useMemo(() => selectedPlan?.invoices?.reduce((sum, inv) => sum + inv.total, 0) || 0, [selectedPlan])
  const totalPaid = useMemo(() => selectedPlan?.invoices?.reduce((sum, inv) => sum + inv.amountPaid, 0) || 0, [selectedPlan])
  const remainingToInvoice = useMemo(() => Math.max(0, totalPlanAmount - totalInvoiced), [totalPlanAmount, totalInvoiced])
  
  // Backward compatibility variables for existing UI, or update the UI
  const totalBilled = totalPlanAmount
  const remaining = useMemo(() => totalBilled - totalPaid, [totalBilled, totalPaid])

  const pageNumbers = useMemo(() => {
    const range = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }, [page, totalPages])

  // ──────────────────────── RENDER ────────────────────────

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-40">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-[2rem] shadow-sm">
            <FiLayers className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Rangkaian Perawatan</h1>
              <button
                onClick={() => fetchPlans()}
                disabled={loading}
                className="p-2.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-90 group"
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              </button>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Visit Treatment Plans &amp; Down Payment</p>
          </div>
        </div>
        {user?.role === 'DOCTOR' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Buat Rangkaian Baru</span>
          </button>
        )}
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: List Panel ── */}
        <div className={`${selectedPlan ? 'lg:w-[420px] xl:w-[480px]' : 'w-full'} shrink-0 space-y-4 transition-all duration-300`}>

          {/* Filter bar */}
          <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 rounded-2xl">
              <FiSearch className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="CARI NAMA PASIEN / DESKRIPSI..."
                className="bg-transparent border-none focus:outline-none text-[10px] font-black text-gray-700 w-full uppercase tracking-widest"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {['all', 'ACTIVE', 'COMPLETED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === 'all' ? 'Semua' : s === 'ACTIVE' ? 'Aktif' : 'Selesai'}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <FiRefreshCw className="w-10 h-10 text-primary animate-spin mb-4 opacity-30" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat data...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="bg-gray-50/50 rounded-[3rem] p-16 text-center border-4 border-dashed border-white flex flex-col items-center">
                <FiLayers className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada rangkaian perawatan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan, idx) => {
                  const isSelected = selectedPlan?.id === plan.id
                  const invs = plan.invoices || []
                  const total = plan.calculatedTotalAmount || plan.totalAmount || invs.reduce((sum, inv) => sum + inv.total, 0)
                  const paid = invs.reduce((sum, inv) => sum + inv.amountPaid, 0)
                  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0
                  
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => fetchDetail(plan.id)}
                      className={`bg-white border rounded-[2rem] p-5 md:p-6 cursor-pointer group transition-all ${
                        isSelected
                          ? 'border-primary/40 shadow-xl shadow-primary/10 ring-2 ring-primary/20'
                          : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20'
                      }`}
                    >
                      {/* Patient & Plan info */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/5 group-hover:text-primary'
                          }`}>
                            <FiUser className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 uppercase truncate">{plan.patient.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 tracking-widest font-mono">
                              {plan.patient.medicalRecordNo} 
                              {plan.doctor && ` • dr. ${plan.doctor.name}`}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0 ${
                          plan.status === 'ACTIVE'
                            ? 'bg-sky-50 text-sky-600 border-sky-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {plan.status === 'ACTIVE' ? 'Aktif' : 'Selesai'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs font-bold text-gray-700 mb-3 line-clamp-2">{plan.description}</p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          {plan.visits?.length || 0} Visit
                        </span>
                        <span className="flex items-center gap-1">
                          <FiDollarSign className="w-3 h-3" />
                          {formatCurrency(total)}
                        </span>
                        {total > 0 && (
                          <span className={`flex items-center gap-1 ${paid >= total ? 'text-emerald-500' : 'text-amber-500'}`}>
                            <FiCreditCard className="w-3 h-3" />
                            {paidPercent}%
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {total > 0 && (
                        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${paidPercent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              paidPercent >= 100 ? 'bg-emerald-500' : paidPercent > 0 ? 'bg-amber-400' : 'bg-gray-200'
                            }`}
                          />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className={`px-4 py-2 bg-gray-50 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/5 hover:text-primary'}`}
              >Prev</button>
              {pageNumbers.map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${page === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}>{p}</button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className={`px-4 py-2 bg-gray-50 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/5 hover:text-primary'}`}
              >Next</button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Detail Panel ── */}
        <AnimatePresence mode="wait">
          {selectedPlan && (
            <motion.div
              key={selectedPlan.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex-1 min-w-0 space-y-5"
            >
              {detailLoading ? (
                <div className="bg-white rounded-[3rem] border border-gray-100 p-16 text-center">
                  <FiRefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3 opacity-30" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Patient Header Card */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center text-primary">
                          <FiUser className="w-7 h-7" />
                        </div>
                        <div>
                          <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">{selectedPlan.patient.name}</h2>
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest font-mono">{selectedPlan.patient.medicalRecordNo} {selectedPlan.patient.phone && `• ${selectedPlan.patient.phone}`}</p>
                          {selectedPlan.doctor && (
                            <p className="text-[10px] font-black text-primary mt-1 flex items-center gap-1 uppercase tracking-widest">
                              <FiUserCheck className="w-3 h-3" /> Ditangani oleh: dr. {selectedPlan.doctor.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPlan.status === 'ACTIVE' && selectedPlan.visits.length === 0 && (!selectedPlan.invoices || selectedPlan.invoices.every(inv => !inv.payments || inv.payments.length === 0)) && (
                          <button onClick={handleDeletePlan} disabled={processing} className="p-2 text-gray-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all">
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => { setSelectedPlan(null); setIsEditingDesc(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deskripsi Perawatan</p>
                        {!isEditingDesc && selectedPlan.status === 'ACTIVE' && (
                          <button onClick={() => { setEditDesc(selectedPlan.description); setIsEditingDesc(true); }} className="text-[9px] font-bold text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit Deskripsi
                          </button>
                        )}
                      </div>
                      
                      {isEditingDesc ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-primary/40"
                            autoFocus
                          />
                          <button onClick={handleUpdatePlan} disabled={processing} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90">Simpan</button>
                          <button onClick={() => setIsEditingDesc(false)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300">Batal</button>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{selectedPlan.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        selectedPlan.status === 'ACTIVE' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {selectedPlan.status === 'ACTIVE' ? '● Aktif' : '✓ Selesai'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 tracking-widest">
                        Dibuat: {formatDate(selectedPlan.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Visit Timeline */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
                          <FiActivity className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Timeline Kunjungan</h3>
                      </div>
                      {selectedPlan.status === 'ACTIVE' && (
                        <button
                          onClick={() => setShowStepModal(true)}
                          disabled={user?.role !== 'DOCTOR'}
                          title={user?.role !== 'DOCTOR' ? 'Hanya Dokter yang dapat menambah kunjungan' : ''}
                          className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                            user?.role === 'DOCTOR' 
                              ? 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Visit
                        </button>
                      )}
                    </div>

                    {selectedPlan.visits.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Belum ada kunjungan</p>
                    ) : (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/30 via-violet-200 to-gray-100" />

                        <div className="space-y-4">
                          {selectedPlan.visits.map((visit, idx) => (
                            <div key={visit.id} className="flex items-start gap-4 relative">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 text-xs font-black ${
                                idx === selectedPlan.visits.length - 1
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {visit.order || idx + 1}
                              </div>
                              <div className="flex-1 bg-gray-50 rounded-xl p-3.5 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Kunjungan #{visit.order || idx + 1}</p>
                                  {/* #11: Inline schedule edit for admin/receptionist */}
                                  <div className="flex items-center gap-1.5">
                                    {editingScheduleVisitId === visit.id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="date"
                                          value={editScheduleDate}
                                          onChange={e => setEditScheduleDate(e.target.value)}
                                          className="border border-gray-200 rounded-lg px-2 py-1 text-[9px] font-bold text-gray-700 focus:outline-none focus:border-primary/40"
                                        />
                                        <button onClick={() => handleUpdateVisitSchedule(visit.id)} disabled={processing} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"><FiCheckCircle className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setEditingScheduleVisitId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><FiX className="w-3.5 h-3.5" /></button>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-[9px] font-bold text-gray-400 tracking-widest">
                                          {visit.visitDate ? formatDate(visit.visitDate) : <span className="text-amber-500">Belum dijadwalkan</span>}
                                        </p>
                                        {selectedPlan.status === 'ACTIVE' && visit.status !== 'SELESAI' && (
                                          <button
                                            onClick={() => { setEditingScheduleVisitId(visit.id); setEditScheduleDate(visit.visitDate ? new Date(visit.visitDate).toISOString().slice(0,10) : '') }}
                                            className="p-1 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Ubah Jadwal"
                                          >
                                            <FiCalendar className="w-3 h-3" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                {/* Status badge */}
                                {visit.status && (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-1.5 ${
                                    visit.status === 'SELESAI' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    visit.status === 'BERJALAN' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}>
                                    {visit.status === 'SELESAI' ? 'Selesai' : visit.status === 'BERJALAN' ? 'Berjalan' : 'Belum'}
                                  </span>
                                )}
                                {visit.notes && <p className="text-xs text-gray-600 mb-2">{visit.notes}</p>}
                                {visit.services && visit.services.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-1">Tindakan / Layanan</p>
                                    {visit.services.map((svc: any) => {
                                      const currentPrice = svc.adjustedPrice || svc.subtotal || (svc.price * (svc.quantity || 1))
                                      return (
                                        <div key={svc.id} className="flex items-center justify-between text-xs py-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700">{svc.service?.serviceName || svc.service?.name || 'Layanan Medis'}</span>
                                            {svc.quantity > 1 && <span className="text-[10px] font-black text-gray-400 bg-white px-1.5 py-0.5 rounded-md border">{svc.quantity}x</span>}
                                          </div>
                                          
                                          {editingServiceId === svc.id ? (
                                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border-2 border-primary/20 shadow-md">
                                              <div className="flex items-center gap-1 bg-gray-50 px-2 rounded border border-gray-200 focus-within:border-primary/50 focus-within:bg-white transition-all">
                                                <input
                                                  type="number"
                                                  value={editServiceQty}
                                                  onChange={e => setEditServiceQty(Number(e.target.value))}
                                                  className="w-12 text-center bg-transparent border-0 py-1 text-sm font-black text-gray-800 focus:outline-none"
                                                  min="1"
                                                  title="Kuantitas (Qty)"
                                                />
                                                <span className="text-[10px] font-bold text-gray-400">x</span>
                                              </div>
                                              <span className="text-[10px] font-bold text-gray-400 pl-1">Rp</span>
                                              <input
                                                type="number"
                                                value={editServicePrice}
                                                onChange={e => setEditServicePrice(Number(e.target.value))}
                                                className="w-32 text-right border-0 border-b-2 border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-sm font-black text-gray-800 focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                                                autoFocus
                                                title="Harga Satuan"
                                              />
                                              <button onClick={() => handleUpdateServicePrice(visit.id, svc.id)} disabled={processing} className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm active:scale-95 transition-all">
                                                <FiCheckCircle className="w-3.5 h-3.5" /> Simpan
                                              </button>
                                              <button onClick={() => setEditingServiceId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all">
                                                <FiX className="w-3.5 h-3.5" /> Batal
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3">
                                              <div className="flex flex-col items-end justify-center">
                                                <span className="font-black text-gray-900 text-sm">{formatCurrency(currentPrice)}</span>
                                                <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1 rounded border border-gray-100 mt-0.5">{svc.quantity || 1} x {formatCurrency(svc.price)}</span>
                                              </div>
                                              {remaining > 0 && selectedPlan.status !== 'COMPLETED' && visit.status !== 'SELESAI' && (
                                                <button
                                                  onClick={() => {
                                                    setEditingServiceId(svc.id)
                                                    setEditServicePrice(svc.price)
                                                    setEditServiceQty(svc.quantity || 1)
                                                  }}
                                                  className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                                  title="Ubah Harga"
                                                >
                                                  <FiEdit3 className="w-3.5 h-3.5" /> Ubah Harga
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan Items List */}
                  {selectedPlan.items && selectedPlan.items.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <FiLayers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Item Perawatan</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedPlan.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{item.description}</p>
                              <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
                            </div>
                            <p className="text-sm font-black text-primary">{formatCurrency(item.subtotal)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        {selectedPlan.totalAmount > 0 && selectedPlan.calculatedTotalAmount !== undefined && selectedPlan.calculatedTotalAmount !== selectedPlan.totalAmount && (
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Estimasi (Item)</p>
                            <p className="text-sm font-bold text-gray-500 line-through">{formatCurrency(selectedPlan.totalAmount)}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                            {selectedPlan.calculatedTotalAmount !== undefined && selectedPlan.calculatedTotalAmount !== selectedPlan.totalAmount
                              ? 'Total Aktual (Kunjungan)'
                              : 'Total Biaya Perawatan'}
                          </p>
                          <p className="text-lg font-black text-primary">{formatCurrency(totalPlanAmount)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoices List */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <FiFileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Daftar Tagihan / Termin</h3>
                        </div>
                      </div>
                      {selectedPlan.status === 'ACTIVE' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setInvoiceForm({ description: 'DP Perawatan', price: 0, isLabDeposit: true })
                              setShowInvoiceModal(true)
                            }}
                            className="px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-1.5"
                          >
                            <FiPlus className="w-3.5 h-3.5" /> Bayar DP
                          </button>
                          <button
                            onClick={() => {
                              setInvoiceForm({ description: 'Pelunasan Perawatan', price: remainingToInvoice, isLabDeposit: false })
                              setShowInvoiceModal(true)
                            }}
                            className="px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" /> Pelunasan
                          </button>
                        </div>
                      )}
                    </div>

                    {!selectedPlan.invoices || selectedPlan.invoices.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada tagihan diterbitkan</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-5">
                          {selectedPlan.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-bold text-gray-800">{inv.items?.[0]?.description || 'Tagihan Perawatan'}</p>
                                  <p className="text-sm font-black text-gray-900">{formatCurrency(inv.total)}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-bold text-gray-400 tracking-widest font-mono">{inv.invoiceNo}</p>
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {inv.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Totals Summary */}
                        <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-gray-400 uppercase tracking-widest">Total Keseluruhan</span>
                            <span className="font-black text-gray-700">{formatCurrency(totalBilled)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-emerald-500 uppercase tracking-widest">Total Terbayar</span>
                            <span className="font-black text-emerald-600">{formatCurrency(totalPaid)}</span>
                          </div>
                          {remaining > 0 && (
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                              <span className="font-black text-rose-500 uppercase tracking-widest text-xs">Sisa Belum Dibayar</span>
                              <span className="font-black text-rose-600">{formatCurrency(remaining)}</span>
                            </div>
                          )}
                        </div>

                        {remaining > 0 && (
                          <div className="mt-5 p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center sm:text-left">
                              Pembayaran dapat dilakukan melalui menu Kasir (Finance)
                            </p>
                            <Link 
                              href="/admin/finance" 
                              className="shrink-0 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-2"
                            >
                              Bayar di Kasir <FiArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* ── Ringkasan Margin / Profitabilitas ── */}
                  {totalLabFee > 0 && (
                    <div className="bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100 shadow-sm p-6 md:p-8 mb-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                          <FiDollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Ringkasan Margin & Pendapatan</h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Pendapatan Rangkaian</p>
                          <p className="text-sm font-black text-gray-800">{formatCurrency(totalPlanAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                            <FiDroplet className="w-3.5 h-3.5" /> Biaya Pengeluaran Lab Eksternal
                          </p>
                          <p className="text-sm font-black text-rose-600">- {formatCurrency(totalLabFee)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-emerald-200">
                          <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Pendapatan Bersih / Margin</p>
                          <p className="text-xl font-black text-emerald-600">{formatCurrency(totalPlanAmount - totalLabFee)}</p>
                        </div>
                        
                        {/* Profit Sharing */}
                        <div className="mt-4 pt-4 border-t border-emerald-200/60">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Profit Sharing Dokter</p>
                            {selectedPlan.isProfitSharePosted ? (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">Posted</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">Pending</span>
                            )}
                          </div>
                          
                          {totalPaid < totalPlanAmount && !selectedPlan.isProfitSharePosted ? (
                             <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                               <p className="text-[10px] font-bold text-amber-700">⚠️ Menunggu Pelunasan</p>
                               <p className="text-[9px] text-amber-600 mt-0.5">Sistem akan membuka form Profit Sharing setelah pasien melunasi pembayaran Rangkaian Perawatan ini.</p>
                             </div>
                          ) : selectedPlan.isProfitSharePosted ? (
                            <div className="flex justify-between items-center bg-emerald-100/50 p-3 rounded-xl">
                              <div>
                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Komisi Dokter ({selectedPlan.doctorProfitSharePercent}%)</p>
                              </div>
                              <p className="text-sm font-black text-emerald-700">{formatCurrency(selectedPlan.doctorProfitShareAmount || 0)}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Persentase Dokter</label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    value={profitSharePercent}
                                    onChange={(e) => setProfitSharePercent(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 text-sm font-bold text-gray-900 outline-none"
                                  />
                                  <div className="px-3 py-1.5 bg-gray-50 text-gray-500 text-xs font-bold border-l border-gray-200">%</div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Estimasi Komisi</label>
                                <p className="text-sm font-black text-emerald-600 px-1 py-1.5">
                                  {formatCurrency(((totalPlanAmount - totalLabFee) * profitSharePercent) / 100)}
                                </p>
                              </div>
                              <button
                                onClick={handlePostProfitShare}
                                disabled={isPostingProfit || (totalPlanAmount - totalLabFee) <= 0}
                                className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:shadow-lg"
                              >
                                {isPostingProfit ? 'Posting...' : 'Posting'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SPK Lab Eksternal Section ── */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                          <FiDroplet className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">SPK Lab Eksternal</h3>
                          <p className="text-[9px] font-bold text-gray-400 tracking-widest mt-0.5">Surat Perintah Kerja Dental Lab</p>
                        </div>
                      </div>
                      {selectedPlan.status === 'ACTIVE' && (
                        <button
                          onClick={() => setShowWorkOrderModal(true)}
                          disabled={user?.role !== 'DOCTOR'}
                          title={user?.role !== 'DOCTOR' ? 'Hanya Dokter yang dapat membuat SPK' : ''}
                          className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm ${
                            user?.role === 'DOCTOR'
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-md'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Buat SPK
                        </button>
                      )}
                    </div>

                    {/* DP Status Banner */}
                    {(() => {
                      const invoices = selectedPlan.invoices || []
                      const hasDp = invoices.some(inv => inv.status === 'partial' || inv.status === 'paid')
                      if (!hasDp && invoices.length > 0) {
                        return (
                          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
                            <FiAlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-orange-700">Pasien Belum DP</p>
                              <p className="text-[10px] text-orange-600 mt-0.5">SPK tetap bisa dibuat, namun akan disimpan dengan status <b>DRAFT</b>. SPK baru bisa dikirim ke Lab setelah Kasir menerima pembayaran DP.</p>
                            </div>
                          </div>
                        )
                      }
                      if (hasDp) {
                        return (
                          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2">
                            <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">DP Sudah Dibayar — SPK Dapat Langsung Dikirim</p>
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* WO List */}
                    {woLoading ? (
                      <div className="py-6 text-center">
                        <FiRefreshCw className="w-5 h-5 text-blue-400 animate-spin mx-auto mb-2" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Memuat SPK...</p>
                      </div>
                    ) : workOrders.length === 0 ? (
                      <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <FiDroplet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada SPK Lab dibuat</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workOrders.map(wo => {
                          const cfg = WO_STATUS_CONFIG[wo.status]
                          const WOIcon = cfg.icon
                          return (
                            <div key={wo.id} className={`border rounded-2xl p-4 ${cfg.bg} ${cfg.border} hover:shadow-sm transition-shadow`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-black text-gray-800 uppercase truncate">{wo.itemDescription}</p>
                                  <p className="text-[9px] font-mono text-gray-500 mt-0.5">
                                    {wo.workOrderNo} {wo.jobType && `• ${wo.jobType}`} {wo.material && `• ${wo.material}`} {wo.stage && `• ${wo.stage}`}
                                  </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                                  <WOIcon className="w-3 h-3" />{cfg.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-bold text-gray-600 mt-3 bg-white/50 p-2.5 rounded-xl border border-gray-100/50">
                                <span className="flex items-center gap-1"><FiDroplet className="w-3 h-3 text-blue-400" />{wo.labName}</span>
                                {wo.toothNumber && <span className="flex items-center gap-1"><FiHash className="w-3 h-3 text-emerald-400" />Gigi {wo.toothNumber}</span>}
                                {wo.shade && <span className="flex items-center gap-1"><FiActivity className="w-3 h-3 text-amber-400" />Shade: {wo.shade}</span>}
                                {wo.size && <span className="flex items-center gap-1"><FiPackage className="w-3 h-3 text-violet-400" />Ukuran: {wo.size}</span>}
                                {wo.estimatedDate && <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 text-rose-400" />Est. Selesai: {new Date(wo.estimatedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                              </div>
                              {wo.notes && (
                                <div className="mt-2.5 p-2 bg-white/40 rounded-lg border border-gray-100/50">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Catatan Dokter</p>
                                  <p className="text-[10px] text-gray-700 font-medium leading-relaxed">{wo.notes}</p>
                                </div>
                              )}
                              {(wo as any).invoiceItems && (wo as any).invoiceItems.length > 0 && (
                                <div className="mt-2.5 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FiDollarSign className="w-3 h-3"/> Rincian Biaya Lab</p>
                                  <div className="space-y-1">
                                    {(wo as any).invoiceItems.map((item: any, i: number) => (
                                      <div key={item.id || i} className="flex justify-between items-center text-[10px]">
                                        <span className="text-emerald-700">{item.description}</span>
                                        <span className="font-bold text-emerald-800">{formatCurrency(item.amount)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center text-[10px] font-black border-t border-emerald-100/50 pt-1 mt-1">
                                      <span className="text-emerald-800">TOTAL BIAYA LAB</span>
                                      <span className="text-emerald-600">{formatCurrency(wo.labFee)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <a
                      href="/admin/lab/external"
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-blue-200 text-blue-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
                    >
                      <FiArrowRight className="w-3.5 h-3.5" /> Buka Halaman Monitoring Lab
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* ── Create Treatment Plan Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setShowCreateModal(false)} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><FiPlus className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Buat Rangkaian Perawatan</h3>
                  </div>
                  <button onClick={() => !processing && setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50"><FiX className="w-5 h-5" /></button>
                </div>

                {/* Patient Search */}
                <div className="mb-5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilih Pasien *</label>
                  {createForm.patientId ? (
                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <FiUser className="text-primary w-5 h-5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900">{patientResults.find(p => p.id === createForm.patientId)?.name || createForm.patientSearch}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{patientResults.find(p => p.id === createForm.patientId)?.medicalRecordNo}</p>
                      </div>
                      <button onClick={() => setCreateForm(f => ({ ...f, patientId: '', patientSearch: '' }))} className="text-gray-400 hover:text-rose-500"><FiX className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                        <FiSearch className="text-gray-400 w-4 h-4 shrink-0" />
                        <input
                          type="text"
                          value={createForm.patientSearch}
                          onChange={(e) => searchPatients(e.target.value)}
                          placeholder="Ketik nama atau No. RM pasien..."
                          className="bg-transparent border-none focus:outline-none text-sm text-gray-700 w-full"
                        />
                        {searchingPatients && <FiRefreshCw className="w-4 h-4 text-primary animate-spin" />}
                      </div>
                      {patientResults.length > 0 && !createForm.patientId && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                          {patientResults.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setCreateForm(f => ({ ...f, patientId: p.id, patientSearch: p.name })); }}
                              className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <p className="text-sm font-bold text-gray-800">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{p.medicalRecordNo} {p.phone && `• ${p.phone}`}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Deskripsi Perawatan *</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Misal: Perawatan Saluran Akar Gigi 36"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                {/* Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Item Perawatan</label>
                    <button
                      onClick={() => setCreateForm(f => ({
                        ...f,
                        items: [...f.items, { id: Math.random().toString(), description: '', quantity: 1, price: 0 }]
                      }))}
                      className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <FiPlus className="w-3 h-3" /> Tambah Item
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {createForm.items.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Nama item/tindakan"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...createForm.items]
                              newItems[index].description = e.target.value
                              setCreateForm(f => ({ ...f, items: newItems }))
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10"
                          />
                          <div className="flex gap-2">
                            <div className="w-20">
                              <input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const newItems = [...createForm.items]
                                  newItems[index].quantity = parseInt(e.target.value) || 0
                                  setCreateForm(f => ({ ...f, items: newItems }))
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                placeholder="Harga (Rp)"
                                value={item.price || ''}
                                onChange={(e) => {
                                  const newItems = [...createForm.items]
                                  newItems[index].price = parseInt(e.target.value) || 0
                                  setCreateForm(f => ({ ...f, items: newItems }))
                                }}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newItems = createForm.items.filter((_, i) => i !== index)
                            setCreateForm(f => ({ ...f, items: newItems }))
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {createForm.items.length === 0 && (
                      <div className="text-center py-4 text-[10px] text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Belum ada item perawatan.
                      </div>
                    )}
                  </div>
                  
                  {createForm.items.length > 0 && (
                    <div className="mt-4 flex items-center justify-between bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total Biaya</span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(createForm.items.reduce((sum, it) => sum + (it.quantity * it.price), 0))}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCreate}
                  disabled={processing || !createForm.patientId || !createForm.description}
                  className="w-full px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                  {processing ? 'Memproses...' : 'Buat Rangkaian Perawatan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Visit — #12: TreatmentStepModal with service selection ── */}
      {selectedPlan && (
        <TreatmentStepModal
          isOpen={showStepModal}
          onClose={() => setShowStepModal(false)}
          onSuccess={() => { fetchDetail(selectedPlan.id); fetchPlans(); }}
          planId={selectedPlan.id}
          userRole={user?.role || ''}
          nextOrder={(selectedPlan.visits?.length || 0) + 1}
        />
      )}

      {/* ── Create Invoice Modal ── */}
      <AnimatePresence>
        {showInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processing && setShowInvoiceModal(false)} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><FiFileText className="w-5 h-5" /></div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Buat Tagihan Baru</h3>
                  </div>
                  <button onClick={() => !processing && setShowInvoiceModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50"><FiX className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Deskripsi Tagihan *</label>
                    <input type="text" value={invoiceForm.description} onChange={(e) => setInvoiceForm(f => ({ ...f, description: e.target.value }))} placeholder="Misal: DP Kunjungan 1" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Jumlah Tagihan (Rp) *</label>
                    <input type="number" value={invoiceForm.price || ''} onChange={(e) => setInvoiceForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
                    {remainingToInvoice > 0 && (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-gray-500">
                          Sisa belum ditagih: <span className="font-bold text-amber-600">{formatCurrency(remainingToInvoice)}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setInvoiceForm(f => ({ ...f, price: remainingToInvoice }))}
                          className="text-[9px] font-bold text-primary hover:underline"
                        >
                          Gunakan sisa
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateInvoice}
                  disabled={processing || !invoiceForm.description || !invoiceForm.price}
                  className="w-full px-6 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                  {processing ? 'Memproses...' : 'Terbitkan Tagihan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Work Order (SPK Lab) Modal ── */}
      <AnimatePresence>
        {showWorkOrderModal && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !processing && setShowWorkOrderModal(false)}
              className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <FiDroplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Buat SPK Lab Eksternal</h3>
                      <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-0.5">Surat Perintah Kerja ke Dental Lab</p>
                    </div>
                  </div>
                  <button onClick={() => !processing && setShowWorkOrderModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Patient Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Pasien</p>
                  <p className="text-sm font-black text-gray-800">{selectedPlan.patient.name}</p>
                  <p className="text-[10px] font-mono text-gray-500">
                    {selectedPlan.patient.medicalRecordNo} • {selectedPlan.description}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500 mt-1">
                    Umur: {selectedPlan.patient.dateOfBirth ? new Date().getFullYear() - new Date(selectedPlan.patient.dateOfBirth).getFullYear() : '-'} tahun • {selectedPlan.patient.gender || '-'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Nama Lab */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <FiDroplet className="w-3 h-3" /> Nama Dental Lab *
                    </label>
                    <input type="text" value={woForm.labName}
                      onChange={e => setWoForm(f => ({ ...f, labName: e.target.value }))}
                      placeholder="Misal: Dental Lab Sejahtera / UD. Karya Gigi"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Kontak Lab */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <FiPhone className="w-3 h-3" /> Kontak Lab
                    </label>
                    <input type="text" value={woForm.labContact}
                      onChange={e => setWoForm(f => ({ ...f, labContact: e.target.value }))}
                      placeholder="No. Telp / WhatsApp"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Biaya Lab */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3" /> Biaya ke Lab (Rp)
                    </label>
                    <input type="number" value={woForm.labFee || ''}
                      onChange={e => setWoForm(f => ({ ...f, labFee: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Jenis Pekerjaan (jobType) */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Jenis Pekerjaan *
                    </label>
                    <select value={woForm.jobType}
                      onChange={e => setWoForm(f => ({ ...f, jobType: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Pilih Pekerjaan</option>
                      <option value="Crown">Crown</option>
                      <option value="Bridge">Bridge</option>
                      <option value="Inlay">Inlay</option>
                      <option value="Onlay">Onlay</option>
                      <option value="Gigi Tiruan Sebagian (GTSL)">Gigi Tiruan Sebagian (GTSL)</option>
                      <option value="Gigi Tiruan Lengkap (GTL)">Gigi Tiruan Lengkap (GTL)</option>
                    </select>
                  </div>

                  {/* Material */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Material *
                    </label>
                    <select value={woForm.material}
                      onChange={e => setWoForm(f => ({ ...f, material: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Pilih Material</option>
                      <option value="Zirconia">Zirconia</option>
                      <option value="E-Max">E-Max</option>
                      <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                      <option value="Full Metal">Full Metal</option>
                      <option value="Akrilik">Akrilik</option>
                      <option value="Valplast">Valplast (Flexi)</option>
                    </select>
                  </div>

                  {/* Tahapan Pekerjaan (Stage) */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Tahapan Pekerjaan (Stage) *
                    </label>
                    <select value={woForm.stage}
                      onChange={e => setWoForm(f => ({ ...f, stage: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Pilih Tahapan</option>
                      <option value="Bite Registration">Bite Registration (Gigitan)</option>
                      <option value="Try-in Coping">Try-in Coping / Rangka</option>
                      <option value="Try-in Gigi">Try-in Gigi (Penyusunan gigi)</option>
                      <option value="Finish / Pasang">Finish / Pasang</option>
                      <option value="Reparasi">Reparasi</option>
                    </select>
                  </div>

                  {/* DPJP / Dokter */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      DPJP / Dokter *
                    </label>
                    <select value={woForm.doctorId}
                      onChange={e => setWoForm(f => ({ ...f, doctorId: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Pilih Dokter</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>
                      ))}
                    </select>
                  </div>

                  {/* Deskripsi Item (Opsional) */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Deskripsi / Informasi Tambahan (Opsional)
                    </label>
                    <input type="text" value={woForm.itemDescription}
                      onChange={e => setWoForm(f => ({ ...f, itemDescription: e.target.value }))}
                      placeholder="Informasi tambahan jika perlu..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Nomor Gigi */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Nomor Gigi
                    </label>
                    <input type="text" value={woForm.toothNumber}
                      onChange={e => setWoForm(f => ({ ...f, toothNumber: e.target.value }))}
                      placeholder="Misal: 36 / 11, 12"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Shade */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Shade / Warna Gigi
                    </label>
                    <input type="text" value={woForm.shade}
                      onChange={e => setWoForm(f => ({ ...f, shade: e.target.value }))}
                      placeholder="Misal: A1 / A2 / B2 / Natural"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Size / Mold */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Ukuran / Cetakan
                    </label>
                    <input type="text" value={woForm.size}
                      onChange={e => setWoForm(f => ({ ...f, size: e.target.value }))}
                      placeholder="Misal: L / XL / Cetakan Alginate"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Estimasi Selesai */}
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" /> Estimasi Selesai Lab
                    </label>
                    <input type="date" value={woForm.estimatedDate}
                      onChange={e => setWoForm(f => ({ ...f, estimatedDate: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Catatan Dokter ke Lab
                    </label>
                    <textarea value={woForm.notes}
                      onChange={e => setWoForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Instruksi khusus untuk lab, preferensi bahan, dll..."
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
                  </div>

                  {/* File Upload / Attachments */}
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                      <FiUploadCloud className="w-3 h-3" /> Lampiran File (Foto 2D / 3D Scan .stl/.obj)
                    </label>
                    <input type="file" multiple
                      onChange={e => {
                        if (e.target.files) {
                          setWoAttachments(Array.from(e.target.files))
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {woAttachments.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{woAttachments.length} file terpilih.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateWorkOrder}
                  disabled={processing || !woForm.labName || !woForm.itemDescription}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiDroplet className="w-4 h-4" />}
                  {processing ? 'Membuat SPK...' : 'Buat Surat Perintah Kerja'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
