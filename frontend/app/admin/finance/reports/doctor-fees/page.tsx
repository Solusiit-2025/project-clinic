'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { 
  FiActivity, FiSearch, FiCalendar, FiFilter, FiDownload, FiCheckCircle, 
  FiAlertCircle, FiUser, FiFileText, FiDollarSign, FiPrinter, FiClock, FiPlus, FiX, FiLayers, FiCreditCard,
  FiEdit, FiTrash2
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getLocalDateString, formatFullDateID } from '@/lib/utils/date'
import { toast } from 'react-hot-toast'

interface DoctorFeeReportItem {
  id: string
  date: string
  invoiceNo: string
  invoiceDate: string
  patientName: string
  patientMRN: string
  doctorName: string
  serviceName: string
  totalPrice: number | string
  doctorFee: number
  type: 'INVOICE' | 'MANUAL'
  status: 'unpaid' | 'paid'
  paidAt: string | null
}

interface ServiceItem {
  id: string
  serviceName: string
  doctorFee: number
}

interface COAItem {
  id: string
  name: string
  code: string
}

export default function DoctorFeeReportPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<DoctorFeeReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(getLocalDateString())
  const [endDate, setEndDate] = useState(getLocalDateString())
  const [doctors, setDoctors] = useState<{id: string, name: string}[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [cashBankAccounts, setCashBankAccounts] = useState<COAItem[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [manualForm, setManualForm] = useState({
    doctorId: '',
    amount: '',
    description: '',
    date: getLocalDateString(),
    serviceId: ''
  })

  const [paymentForm, setPaymentForm] = useState({
    coaId: '',
    date: getLocalDateString(),
    notes: ''
  })

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DoctorFeeReportItem | null>(null)
  const [editForm, setEditForm] = useState({
    doctorId: '',
    amount: '',
    description: '',
    date: ''
  })

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await api.get('/master/doctors')
      setDoctors(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchServices = useCallback(async () => {
    try {
      const { data } = await api.get('/master/services')
      setServices(data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchCOAs = useCallback(async () => {
    try {
      const { data } = await api.get('/master/coa', { params: { category: 'ASSET' } })
      // Strictly filter for Cash and Bank (Liquid Assets)
      const cashOnly = data.filter((c: any) => {
        const code = c.code || ''
        const name = c.name.toLowerCase()
        
        // Include accounts starting with 1-11 (Cash/Bank) 
        // but exclude 1-1105 (Clearing) and any name containing 'clearing' or 'piutang'
        return (code.startsWith('1-11') && !code.startsWith('1-1105')) && 
               !name.includes('clearing') && 
               !name.includes('piutang')
      })
      setCashBankAccounts(cashOnly)
    } catch (e) { console.error(e) }
  }, [])

  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    setLoading(true)
    try {
      const { data: resData } = await api.get('/reports/doctor-fees', {
        params: { 
          startDate, endDate, doctorId: selectedDoctor, clinicId: activeClinicId, status: statusFilter
        }
      })
      setData(resData)
      setSelectedIds([]) // Reset selection on refresh
    } catch (e) {
      toast.error('Gagal mengambil data laporan')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedDoctor, activeClinicId, statusFilter])

  useEffect(() => {
    fetchDoctors()
    fetchServices()
    fetchCOAs()
    fetchData()
  }, [fetchDoctors, fetchServices, fetchCOAs, fetchData])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/reports/manual-commission', manualForm)
      toast.success('Jasa manual berhasil ditambahkan')
      setIsManualModalOpen(false)
      setManualForm({ ...manualForm, amount: '', description: '', serviceId: '' })
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan data')
    } finally { setSubmitting(false) }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.coaId) return toast.error('Pilih Akun Kas/Bank')
    
    setSubmitting(true)
    try {
      await api.post('/reports/pay-commissions', {
        ...paymentForm,
        commissionIds: selectedIds
      })
      toast.success('Pembayaran jasa medik berhasil diproses')
      setIsPaymentModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memproses pembayaran')
    } finally { setSubmitting(false) }
  }

  const handleOpenEdit = (item: DoctorFeeReportItem) => {
    const doc = doctors.find(d => d.name === item.doctorName)
    setEditingItem(item)
    setEditForm({
      doctorId: doc?.id || '',
      amount: item.doctorFee.toString(),
      description: item.serviceName,
      date: item.date ? item.date.slice(0, 10) : getLocalDateString()
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSubmitting(true)
    try {
      await api.put(`/reports/doctor-fees/${editingItem.id}`, editForm)
      toast.success('Jasa medik berhasil diperbarui')
      setIsEditModalOpen(false)
      setEditingItem(null)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memperbarui data')
    } finally { setSubmitting(false) }
  }

  const handleDeleteItem = async (item: DoctorFeeReportItem) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus jasa medik "${item.serviceName}" untuk ${item.doctorName}?`)
    if (!confirmDelete) return
    
    try {
      await api.delete(`/reports/doctor-fees/${item.id}`)
      toast.success('Jasa medik berhasil dihapus')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menghapus data')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    const unpaidFiltered = filteredData.filter(item => item.status === 'unpaid')
    if (unpaidFiltered.length === 0) return

    const allSelected = unpaidFiltered.every(item => selectedIds.includes(item.id))
    
    if (allSelected) {
      const idsToRemove = unpaidFiltered.map(item => item.id)
      setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)))
    } else {
      const idsToAdd = unpaidFiltered.map(item => item.id).filter(id => !selectedIds.includes(id))
      setSelectedIds(prev => [...prev, ...idsToAdd])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      item.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  const selectedTotal = useMemo(() => {
    return data.filter(i => selectedIds.includes(i.id)).reduce((sum, i) => sum + i.doctorFee, 0)
  }, [data, selectedIds])

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Laporan Jasa Medik</h1>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                ⚖️ Bagi Hasil
              </span>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Profit Sharing Dokter &middot; Pengurang Pendapatan Klinik</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto no-print">
          <button onClick={() => setIsManualModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
            <FiPlus className="w-4 h-4" /> <span>Input Manual</span>
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all">
            <FiPrinter className="w-4 h-4" /> <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* PROFIT SHARING INFO BANNER */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <FiLayers className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1">Model Bisnis: Bagi Hasil (Profit Sharing)</p>
            <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed">
              Klinik dan Dokter <strong>tidak memiliki ikatan kerja/gaji</strong>. Jasa Medik Dokter diperlakukan sebagai
              <strong> Pengurang Pendapatan (Contra-Revenue)</strong> menggunakan akun <span className="font-black">4-0101</span>,
              bukan sebagai Beban Operasional. Laporan L/R akan menampilkan:
              Pendapatan Bruto &minus; Bagian Dokter = Pendapatan Neto Klinik.
            </p>
          </div>
          <div className="flex-shrink-0 px-3 py-1.5 bg-amber-200 rounded-xl">
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest text-center">
              COA<br/>4-0101
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dokter</label>
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800">
              <option value="">Semua Dokter</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800">
              <option value="">Semua Status</option>
              <option value="unpaid">Belum Dibayar</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800" />
          </div>
          <button onClick={fetchData} className="h-[48px] bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            Tampilkan
          </button>
        </div>
      </div>

      {/* SELECTION ACTION BAR */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] bg-slate-900 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-12 backdrop-blur-md bg-slate-900/90 border border-white/10">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Terpilih</span>
                <span className="text-sm font-black">{selectedIds.length} Item Jasa</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Bayar</span>
                <span className="text-sm font-black text-indigo-400">{formatCurrency(selectedTotal)}</span>
              </div>
            </div>
            <button onClick={() => setIsPaymentModalOpen(true)} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              <FiCreditCard className="w-4 h-4" /> <span>Bayar Sekarang</span>
            </button>
            <button onClick={() => setSelectedIds([])} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Batal</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Search Input Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari nama pasien, nomor invoice, dokter, atau layanan..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 shadow-sm"
          />
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-16 px-8 py-5">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                  checked={
                    filteredData.filter(item => item.status === 'unpaid').length > 0 &&
                    filteredData.filter(item => item.status === 'unpaid').every(item => selectedIds.includes(item.id))
                  }
                  onChange={toggleSelectAll}
                  disabled={filteredData.filter(item => item.status === 'unpaid').length === 0}
                  title="Pilih Semua (Yang Belum Dibayar)"
                />
              </th>
              <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal & Ref</th>
              <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pasien / Layanan</th>
              <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dokter</th>
              <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
              <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest no-print">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-8 py-6"><div className="h-12 bg-slate-50 rounded-2xl w-full" /></td></tr>)
            ) : filteredData.map((row) => (
              <tr key={row.id} className={`hover:bg-slate-50/50 transition-all ${selectedIds.includes(row.id) ? 'bg-indigo-50/30' : ''}`}>
                <td className="px-8 py-5">
                  {row.status === 'unpaid' ? (
                    <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer" />
                  ) : (
                    <FiCheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatFullDateID(row.date)}</span>
                    <span className="text-xs font-black text-slate-900 mt-0.5">{row.type === 'MANUAL' ? 'Manual Adj' : row.invoiceNo}</span>
                  </div>
                </td>
                <td className="px-4 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{row.serviceName}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">{row.type === 'INVOICE' ? row.patientName : 'Penyesuaian Tanpa Pasien'}</span>
                  </div>
                </td>
                <td className="px-4 py-5 text-xs font-black text-slate-600 uppercase tracking-tight">{row.doctorName}</td>
                <td className="px-4 py-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${row.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    {row.status === 'paid' ? 'Lunas' : 'Tertunda'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right font-black text-slate-900">{formatCurrency(row.doctorFee)}</td>
                <td className="px-8 py-5 text-center no-print">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(row)}
                      disabled={row.status === 'paid'}
                      title={row.status === 'paid' ? 'Komisi Lunas tidak dapat diubah' : 'Edit Jasa Medik'}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(row)}
                      disabled={row.status === 'paid'}
                      title={row.status === 'paid' ? 'Komisi Lunas tidak dapat dihapus' : 'Hapus Jasa Medik'}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPaymentModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-4">
                  <FiCreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Bayar Jasa (Tunai/Kas)</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Total pengeluaran Kas untuk jasa dokter:</p>
                <div className="mt-4 px-6 py-2 bg-emerald-50 rounded-2xl text-2xl font-black text-emerald-600 tracking-tighter">
                  {formatCurrency(selectedTotal)}
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Akun Kas</label>
                  <select required value={paymentForm.coaId} onChange={(e) => setPaymentForm({...paymentForm, coaId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800">
                    <option value="">-- Pilih Kas Pembayaran --</option>
                    {cashBankAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Bayar</label>
                  <input type="date" required value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black" />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">
                  {submitting ? 'Memproses Jurnal...' : 'Proses Pembayaran'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL INPUT MODAL */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsManualModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-4">
                  <FiPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Input Jasa Medik Manual</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Tambahkan penyesuaian jasa medik (misal: Uang Duduk/Insentif)</p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Dokter</label>
                  <select 
                    required 
                    value={manualForm.doctorId} 
                    onChange={(e) => setManualForm({...manualForm, doctorId: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800"
                  >
                    <option value="">-- Pilih Dokter --</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Layanan (Opsional - Untuk Auto Fill)</label>
                  <select 
                    value={manualForm.serviceId} 
                    onChange={(e) => {
                      const service = services.find(s => s.id === e.target.value)
                      if (service) {
                        setManualForm({
                          ...manualForm, 
                          serviceId: e.target.value,
                          amount: service.doctorFee.toString(),
                          description: service.serviceName
                        })
                      } else {
                        setManualForm({...manualForm, serviceId: e.target.value})
                      }
                    }} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800"
                  >
                    <option value="">-- Pilih Layanan (Custom) --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.serviceName} ({formatCurrency(s.doctorFee)})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Keterangan</label>
                  <input 
                    type="text" 
                    required 
                    value={manualForm.description} 
                    onChange={(e) => setManualForm({...manualForm, description: e.target.value})} 
                    placeholder="Contoh: Uang Duduk Shift Malam"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      required 
                      value={manualForm.amount} 
                      onChange={(e) => setManualForm({...manualForm, amount: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input 
                      type="date" 
                      required 
                      value={manualForm.date} 
                      onChange={(e) => setManualForm({...manualForm, date: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 mt-4">
                  {submitting ? 'Menyimpan...' : 'Tambahkan Jasa'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 mb-4">
                  <FiEdit className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Jasa Medik</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">Ubah rincian jasa medik dokter</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Dokter</label>
                  <select 
                    required 
                    value={editForm.doctorId} 
                    onChange={(e) => setEditForm({...editForm, doctorId: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800"
                  >
                    <option value="">-- Pilih Dokter --</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Keterangan</label>
                  <input 
                    type="text" 
                    required 
                    value={editForm.description} 
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                    placeholder="Deskripsi jasa medik"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      required 
                      value={editForm.amount} 
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input 
                      type="date" 
                      required 
                      value={editForm.date} 
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} 
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
