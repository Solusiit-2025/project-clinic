'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiRepeat, FiSearch, FiFilter,
  FiClock, FiCheckCircle, FiMoreVertical,
  FiCalendar, FiPlus, FiX, FiActivity, FiArrowRight, FiTrash2, FiFileText, FiPrinter
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { formatTerbilang } from '@/lib/utils/terbilang'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface COA {
  id: string
  code: string
  name: string
  category: string
}

interface CashTransfer {
  id: string
  transferNo: string
  date: string
  fromCoaId: string
  toCoaId: string
  amount: number
  description: string
  status: string
  fromCoa: COA
  toCoa: COA
  journalEntryId?: string
}

export default function CashTransferPage() {
  const { activeClinicId } = useAuthStore()
  const [transfers, setTransfers] = useState<CashTransfer[]>([])
  const [coas, setCoas] = useState<COA[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fromCoaId: '',
    toCoaId: '',
    amount: '',
    description: ''
  })
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    try {
      setLoading(true)
      const [trfRes, coaRes, balRes] = await Promise.all([
        api.get('/finance/cash-transfers', {
          params: {
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            page: page,
            limit: 10
          }
        }),
        api.get('/master/coa', { params: { category: 'ASSET' } }),
        api.get('/master/coa/balances')
      ])

      setTransfers(trfRes.data?.data || [])
      setTotalPages(trfRes.data?.meta?.totalPages || 1)
      setTotalItems(trfRes.data?.meta?.total || 0)
      
      // Filter COAs to show only Cash and Bank types (Liquid assets)
      // Usually these start with 1-11 and are not headers (ending in 000)
      const liquidCoas = (coaRes.data || []).filter((c: COA) => 
        c.code.startsWith('1-11') && !c.code.endsWith('000') && c.code !== '1-1105-K001' // Exclude headers and clearing
      )
      setCoas(liquidCoas)

      // Map balances
      const balMap: Record<string, number> = {}
      if (balRes.data && Array.isArray(balRes.data)) {
        balRes.data.forEach((b: any) => { balMap[b.id] = b.balance })
      }
      setBalances(balMap)

      // Set default From account if it exists in the list
      const clinicCash = liquidCoas.find((c: COA) => c.code === '1-1101-K001')
      if (clinicCash && !formData.fromCoaId) {
        setFormData(prev => ({ ...prev, fromCoaId: clinicCash.id }))
      }
    } catch (error) {
      console.error('Fetch Transfers Error:', error)
      toast.error('Gagal mengambil data transfer')
    } finally {
      setLoading(false)
    }
  }, [activeClinicId, search, statusFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fromCoaId || !formData.toCoaId || !formData.amount || !formData.date) {
      toast.error('Mohon lengkapi data wajib')
      return
    }

    if (formData.fromCoaId === formData.toCoaId) {
      toast.error('Akun asal dan tujuan tidak boleh sama')
      return
    }

    try {
      setIsSubmitting(true)
      await api.post('/finance/cash-transfers', formData)
      toast.success('Draft transfer berhasil dibuat')
      setShowAddModal(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fromCoaId: '', toCoaId: '', amount: '', description: ''
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePost = async (id: string) => {
    if (!confirm('Posting transfer ini ke Buku Besar? Data tidak dapat diubah setelah diposting.')) return
    try {
      setProcessingId(id)
      await api.post(`/finance/cash-transfers/${id}/post`)
      toast.success('Transfer berhasil diposting ke Buku Besar')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal posting')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string, transferNo: string) => {
    if (!confirm(`Hapus draft transfer ${transferNo}?`)) return
    try {
      setProcessingId(id)
      await api.delete(`/finance/cash-transfers/${id}`)
      toast.success('Draft berhasil dihapus')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePrint = (trf: CashTransfer) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [210, 148.5] // A5 or half A4
    })

    const margin = 15
    const width = 210
    const centerX = width / 2

    // --- Header ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('KLINIK YASFINA', margin, 15)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Pusat Layanan Kesehatan & Farmasi Terpadu', margin, 19)
    doc.text('Jl. Raya Bekasi No. 123, Indonesia', margin, 23)
    doc.line(margin, 26, width - margin, 26)

    // --- Title ---
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('BUKTI TRANSFER KAS (KWITANSI)', centerX, 35, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Nomor: ${trf.transferNo}`, centerX, 40, { align: 'center' })

    // --- Content ---
    let y = 50
    const labelX = margin + 5
    const valueX = margin + 45

    doc.setFont('helvetica', 'normal')
    doc.text('Telah Terima Dari', labelX, y); doc.text(': ' + trf.fromCoa.name, valueX, y); y += 7
    doc.text('Untuk Pembayaran', labelX, y); doc.text(': ' + (trf.description || 'Transfer Kas Internal'), valueX, y); y += 7
    doc.text('Tujuan Transfer', labelX, y); doc.text(': ' + trf.toCoa.name, valueX, y); y += 7
    
    // Terbilang Box
    doc.setFont('helvetica', 'italic')
    doc.text('Terbilang', labelX, y)
    const terbilangText = formatTerbilang(trf.amount)
    doc.rect(valueX, y - 4, 130, 10)
    doc.text('# ' + terbilangText + ' #', valueX + 2, y + 2)
    y += 15

    // Total Amount
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('JUMLAH : ' + formatCurrency(trf.amount), margin + 5, y + 5)

    // Date
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const dateStr = new Date(trf.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    doc.text('Bekasi, ' + dateStr, width - margin - 40, y + 5)

    // --- Signatures ---
    y += 15
    const sigWidth = 45
    const sigY = y + 5

    doc.setFont('helvetica', 'bold')
    doc.text('Penyerah', margin + 10, sigY)
    doc.text('Penerima', centerX - sigWidth / 2 + 15, sigY)
    doc.text('Mengetahui', width - margin - sigWidth + 5, sigY)

    doc.setFont('helvetica', 'normal')
    doc.text('( ........................ )', margin + 5, sigY + 20)
    doc.text('( ........................ )', centerX - sigWidth / 2 + 10, sigY + 20)
    doc.text('( ........................ )', width - margin - sigWidth, sigY + 20)

    doc.save(`Kwitansi_Transfer_${trf.transferNo}.pdf`)
    toast.success('Bukti transfer berhasil diunduh')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="w-full px-4 md:px-6 py-8 space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <FiRepeat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Transfer Antar Kas</h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wide mt-0.5">Pemindahan Saldo Antar Rekening Kas / Bank</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative bg-primary text-white flex items-center gap-2 px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl shadow-primary/30 hover:bg-slate-900 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <FiPlus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
          <span className="relative z-10">Buat Transfer Baru</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <section className="bg-white/80 backdrop-blur-md p-6 rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/20">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Transaksi</label>
            <div className="relative group">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Cari nomor transfer atau keterangan..."
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm text-slate-700 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Status</label>
            <select
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] text-slate-700 uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
            </select>
          </div>
        </div>
      </section>

      {/* DATA TABLE */}
      <section className="bg-white rounded-[3.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100/60 uppercase">
                <th className="px-10 py-10 text-[10px] font-black text-slate-400 tracking-[0.2em]">Tgl / Ref</th>
                <th className="px-8 py-10 text-[10px] font-black text-slate-400 tracking-[0.2em]">Transfer Saldo</th>
                <th className="px-8 py-10 text-[10px] font-black text-slate-400 tracking-[0.2em] text-right">Jumlah</th>
                <th className="px-8 py-10 text-[10px] font-black text-slate-400 tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-10 text-[10px] font-black text-slate-400 tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {transfers.length > 0 ? transfers.map((trf) => (
                <tr key={trf.id} className="group hover:bg-primary/[0.02] transition-all duration-500">
                  <td className="px-10 py-8">
                    <p className="text-[13px] font-black text-slate-800">{new Date(trf.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] font-black text-slate-300 mt-1.5 uppercase tracking-[0.15em] group-hover:text-primary transition-colors">{trf.transferNo}</p>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-5">
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Dari Akun</p>
                        <p className="text-xs font-black text-rose-500/80 leading-tight">{trf.fromCoa.name}</p>
                        <p className="text-[9px] font-bold text-slate-300 italic mt-0.5">{trf.fromCoa.code}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <FiArrowRight className="text-slate-200 group-hover:text-primary w-4 h-4 transition-all" />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Ke Akun</p>
                        <p className="text-xs font-black text-emerald-500 leading-tight">{trf.toCoa.name}</p>
                        <p className="text-[9px] font-bold text-slate-300 italic mt-0.5">{trf.toCoa.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <p className="text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(trf.amount)}</p>
                    {trf.description && <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase truncate max-w-[200px] ml-auto tracking-wide group-hover:text-slate-600">{trf.description}</p>}
                  </td>
                  <td className="px-8 py-8 text-center">
                    {trf.status === 'POSTED' ? (
                      <div className="flex items-center justify-center gap-2.5 text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-2xl inline-flex border border-emerald-100/60 shadow-sm">
                        <FiCheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Posted</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5 text-amber-600 bg-amber-50/50 px-4 py-2 rounded-2xl inline-flex border border-amber-100/60 shadow-sm">
                        <FiClock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Draft</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handlePrint(trf)}
                        className="w-10 h-10 flex items-center justify-center text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-200"
                        title="Cetak Bukti Transfer (Kwitansi)"
                      >
                        <FiPrinter className="w-4.5 h-4.5" />
                      </button>
                      
                      {trf.status === 'DRAFT' ? (
                        <>
                          <button
                            onClick={() => handlePost(trf.id)}
                            disabled={processingId === trf.id}
                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-2xl hover:bg-slate-900 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-slate-900/20 disabled:opacity-30"
                            title="Konfirmasi & Posting ke General Ledger"
                          >
                            <FiCheckCircle className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(trf.id, trf.transferNo)}
                            disabled={processingId === trf.id}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-rose-200 disabled:opacity-30"
                            title="Hapus Draft Transfer"
                          >
                            <FiTrash2 className="w-4.5 h-4.5" />
                          </button>
                        </>
                      ) : (
                        <div 
                          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 rounded-2xl border border-slate-100" 
                          title="Sudah Terkunci (Selesai Posting)"
                        >
                          <FiFileText className="w-4.5 h-4.5 opacity-50" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <FiRepeat className="w-16 h-16 text-slate-300" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Belum ada riwayat transfer kas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 flex items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >Prev</button>
            <button
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >Next</button>
          </div>
        </div>
      </section>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <form onSubmit={handleSubmit} className="p-12 space-y-8 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Buat Transfer</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <FiX className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                      <input
                        type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-700 outline-none focus:ring-4 focus:ring-primary/5"
                        value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Rp)</label>
                      <input
                        type="number" placeholder="0" className="w-full px-5 py-4 bg-slate-900 border border-slate-900 rounded-2xl font-black text-lg text-white outline-none"
                        value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Akun (Asal)</label>
                      {formData.fromCoaId && (
                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                          Saldo: {formatCurrency(balances[formData.fromCoaId] || 0)}
                        </div>
                      )}
                    </div>
                    <SearchableSelect
                      options={coas.map(c => ({ 
                        id: c.id, 
                        label: `${c.code} - ${c.name}`,
                        description: `Saldo Saat Ini: ${formatCurrency(balances[c.id] || 0)}`
                      }))}
                      value={formData.fromCoaId}
                      onChange={(id) => setFormData({ ...formData, fromCoaId: id })}
                      placeholder="Pilih Akun Pengirim..."
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ke Akun (Tujuan)</label>
                    </div>
                    <SearchableSelect
                      options={coas
                        .filter(c => c.id !== formData.fromCoaId)
                        .map(c => ({ 
                          id: c.id, 
                          label: `${c.code} - ${c.name}`
                        }))}
                      value={formData.toCoaId}
                      onChange={(id) => setFormData({ ...formData, toCoaId: id })}
                      placeholder="Pilih Akun Penerima..."
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Deskripsi</label>
                    <textarea
                      placeholder="Contoh: Setoran Kas Clinic ke Kas Owner"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm text-slate-700 outline-none resize-none"
                      rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-primary/20 hover:bg-slate-900 hover:-translate-y-1'}`}
                >
                  {isSubmitting ? (
                    <>
                      <FiActivity className="w-5 h-5 animate-spin" /> Sedang Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan sebagai Draft <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4 italic">Transfer akan muncul di Buku Besar setelah diposting.</p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
