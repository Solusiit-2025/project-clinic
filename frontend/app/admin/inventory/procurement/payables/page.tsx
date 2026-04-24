'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Search, RefreshCw, AlertCircle,
  CheckCircle, Clock, ChevronRight, DollarSign,
  FileText, TrendingDown, X, Upload, Banknote, Building2
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

interface Payable {
  id: string
  procurementNo: string
  branch: { name: string; code: string }
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: 'UNPAID' | 'PARTIAL'
  dueDate: string | null
  createdAt: string
  itemCount: number
  lastPayment: { amount: number; paidAt: string; paymentMethod: string } | null
}

interface Bank {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export default function PayablesPage() {
  const router = useRouter()
  const { activeClinicId } = useAuthStore()
  const [payables, setPayables] = useState<Payable[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState({ count: 0, totalOutstanding: 0 })

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null)
  const [payForm, setPayForm] = useState({
    amount: 0,
    paymentMethod: 'CASH' as 'CASH' | 'TRANSFER',
    bankId: '',
    referenceNo: '',
    notes: '',
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)

  const fetchPayables = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/inventory/procurement/outstanding-payables', {
        params: { branchId: activeClinicId }
      })
      setPayables(res.data.data)
      setSummary(res.data.summary)
    } catch {
      toast.error('Gagal memuat data hutang supplier')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBanks = async () => {
    try {
      const res = await api.get('/master/banks', { params: { clinicId: activeClinicId } })
      setBanks(res.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (activeClinicId) {
      fetchPayables()
      fetchBanks()
    }
  }, [activeClinicId])

  const openPayModal = (p: Payable) => {
    setSelectedPayable(p)
    setPayForm({
      amount: p.remainingAmount,
      paymentMethod: 'CASH',
      bankId: '',
      referenceNo: '',
      notes: '',
    })
    setReceiptFile(null)
    setReceiptPreview(null)
    setShowPayModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null) // PDF — no preview
    }
  }

  const handlePay = async () => {
    if (!selectedPayable) return
    if (payForm.amount <= 0) return toast.error('Jumlah pembayaran harus lebih dari 0')
    if (payForm.paymentMethod === 'TRANSFER' && !payForm.bankId) return toast.error('Pilih bank untuk transfer')

    try {
      setIsPaying(true)
      const formData = new FormData()
      formData.append('amount', String(payForm.amount))
      formData.append('paymentMethod', payForm.paymentMethod)
      if (payForm.bankId) formData.append('bankId', payForm.bankId)
      if (payForm.referenceNo) formData.append('referenceNo', payForm.referenceNo)
      if (payForm.notes) formData.append('notes', payForm.notes)
      if (receiptFile) formData.append('receiptFile', receiptFile)

      const res = await api.post(`/inventory/procurement/${selectedPayable.id}/pay`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(`Pembayaran berhasil! Status: ${res.data.paymentStatus}`)
      setShowPayModal(false)
      fetchPayables()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memproses pembayaran')
    } finally {
      setIsPaying(false)
    }
  }

  const filtered = payables.filter(p =>
    p.procurementNo.toLowerCase().includes(search.toLowerCase()) ||
    p.branch.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    if (status === 'UNPAID') return 'bg-red-50 text-red-700 border-red-200'
    if (status === 'PARTIAL') return 'bg-orange-50 text-orange-700 border-orange-200'
    return 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-2xl">
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
            Hutang Supplier
          </h1>
          <p className="text-gray-500 font-medium mt-1">Kelola pembayaran hutang dagang ke supplier.</p>
        </div>
        <button onClick={fetchPayables} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-xl"><AlertCircle className="w-5 h-5 text-red-500" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Hutang</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(summary.totalOutstanding)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.count} procurement belum lunas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-xl"><Clock className="w-5 h-5 text-orange-500" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Pembayaran Sebagian</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {payables.filter(p => p.paymentStatus === 'PARTIAL').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">procurement cicilan</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl"><TrendingDown className="w-5 h-5 text-blue-500" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum Dibayar</span>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {payables.filter(p => p.paymentStatus === 'UNPAID').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">procurement UNPAID</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Cari nomor PR atau nama cabang..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
            <p className="font-bold text-lg">Semua hutang sudah lunas!</p>
            <p className="text-sm">Tidak ada hutang supplier yang outstanding.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['No. PR', 'Cabang', 'Total', 'Sudah Bayar', 'Sisa Hutang', 'Status', 'Tgl. Buat', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/admin/inventory/procurement/${p.id}`)}
                        className="font-black text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        {p.procurementNo} <ChevronRight className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-400">{p.itemCount} item</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-800">{p.branch.name}</p>
                      <p className="text-xs text-gray-400">{p.branch.code}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-sm text-gray-800">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-4 py-3 font-bold text-sm text-green-600">{formatCurrency(p.paidAmount)}</td>
                    <td className="px-4 py-3 font-black text-sm text-red-600">{formatCurrency(p.remainingAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(p.paymentStatus)}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {format(new Date(p.createdAt), 'dd MMM yyyy', { locale: localeID })}
                      {p.dueDate && (
                        <p className="text-red-400 font-bold">
                          Jatuh: {format(new Date(p.dueDate), 'dd MMM yyyy', { locale: localeID })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openPayModal(p)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Bayar
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayModal && selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isPaying && setShowPayModal(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black">Bayar Hutang Supplier</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{selectedPayable.procurementNo}</p>
                  </div>
                  <button onClick={() => setShowPayModal(false)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Total', value: formatCurrency(selectedPayable.totalAmount), color: 'text-white' },
                    { label: 'Sudah Bayar', value: formatCurrency(selectedPayable.paidAmount), color: 'text-green-400' },
                    { label: 'Sisa Hutang', value: formatCurrency(selectedPayable.remainingAmount), color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <p className={`text-sm font-black ${s.color} mt-0.5`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Jumlah Bayar */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Jumlah Bayar</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setPayForm(f => ({ ...f, amount: selectedPayable.remainingAmount }))}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg hover:bg-primary/20 transition-colors">
                      Lunas Penuh
                    </button>
                    {[50000, 100000, 200000, 500000].map(v => (
                      <button key={v} onClick={() => setPayForm(f => ({ ...f, amount: v }))}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        {(v / 1000)}rb
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'CASH', label: 'Tunai / Kas', icon: Banknote },
                      { id: 'TRANSFER', label: 'Transfer Bank', icon: Building2 },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPayForm(f => ({ ...f, paymentMethod: m.id as any, bankId: '' }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${payForm.paymentMethod === m.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                      >
                        <m.icon className="w-4 h-4" /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Selection (Transfer only) */}
                {payForm.paymentMethod === 'TRANSFER' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Pilih Bank</label>
                    <select
                      value={payForm.bankId}
                      onChange={e => setPayForm(f => ({ ...f, bankId: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Pilih Bank --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.accountHolder})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nomor Referensi */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                    {payForm.paymentMethod === 'TRANSFER' ? 'No. Referensi Transfer' : 'No. Bon / Kwitansi'}
                  </label>
                  <input
                    type="text"
                    placeholder={payForm.paymentMethod === 'TRANSFER' ? 'Contoh: TRF-20260424-001' : 'Contoh: BON-001'}
                    value={payForm.referenceNo}
                    onChange={e => setPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Catatan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan pembayaran..."
                    value={payForm.notes}
                    onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Upload Bon / Invoice */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                    Upload Bon / Invoice Supplier (Opsional)
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="preview" className="h-full w-full object-contain rounded-xl p-1" />
                    ) : receiptFile ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="w-8 h-8 text-primary" />
                        <p className="text-xs font-bold text-primary">{receiptFile.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-primary transition-colors">
                        <Upload className="w-7 h-7" />
                        <p className="text-xs font-bold">Klik untuk upload foto bon / PDF invoice</p>
                        <p className="text-[10px]">JPEG, PNG, WEBP, PDF — maks 10MB</p>
                      </div>
                    )}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                  </label>
                  {receiptFile && (
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
                      className="mt-1 text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1">
                      <X className="w-3 h-3" /> Hapus file
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  disabled={isPaying}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-black text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handlePay}
                  disabled={isPaying || payForm.amount <= 0}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isPaying ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Memproses...</>
                  ) : (
                    <><DollarSign className="w-4 h-4" /> Proses Pembayaran</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
