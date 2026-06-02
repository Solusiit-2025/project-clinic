'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiFileText, FiPlus, FiSearch, FiRefreshCw, FiDollarSign, 
  FiUser, FiCalendar, FiCheckCircle, FiX, FiEye, FiPrinter
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { printCorporateInvoice } from '@/lib/printCorporateInvoice'

interface CorporatePartner {
  id: string
  name: string
  companyCode: string
  contactPerson: string
  phone: string
  taxPercent: number
  contractDiscountPercent: number
}

interface CorporateInvoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  status: string
  isPosted: boolean
  notes: string
  partner: CorporatePartner
  patientInvoices: any[]
}

export default function CorporateBillingPage() {
  const { activeClinicId } = useAuthStore()
  const [invoices, setInvoices] = useState<CorporateInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [partners, setPartners] = useState<CorporatePartner[]>([])
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  // Payment & Posting Modals
  const [banks, setBanks] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPostConfirmModal, setShowPostConfirmModal] = useState(false)
  const [showPrintBankModal, setShowPrintBankModal] = useState(false)
  const [selectedBankIdForPrint, setSelectedBankIdForPrint] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<CorporateInvoice | null>(null)

  // Unbilled Invoices Modal
  const [showUnbilledModal, setShowUnbilledModal] = useState(false)
  const [allPendingInvoices, setAllPendingInvoices] = useState<any[]>([])
  const [loadingUnbilled, setLoadingUnbilled] = useState(false)
  
  const [paymentData, setPaymentData] = useState({
    method: 'bank_transfer',
    amount: 0,
    transactionRef: '',
    bankId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/finance/corporate-billing', {
        params: { search, status: statusFilter !== 'all' ? statusFilter : undefined }
      })
      setInvoices(res.data)
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengambil data tagihan perusahaan')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  const fetchPartners = useCallback(async () => {
    if (!activeClinicId) return
    try {
      const res = await api.get('/master/corporate-partners', { params: { clinicId: activeClinicId } })
      setPartners(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [activeClinicId])

  const fetchBanks = useCallback(async () => {
    if (!activeClinicId) return
    try {
      const res = await api.get('/master/banks', { params: { clinicId: activeClinicId, isActive: true } })
      setBanks(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [activeClinicId])

  useEffect(() => {
    if (activeClinicId) {
      fetchData()
      fetchPartners()
      fetchBanks()
    }
  }, [fetchData, fetchPartners, fetchBanks, activeClinicId])

  const fetchAllPending = async () => {
    setLoadingUnbilled(true)
    setShowUnbilledModal(true)
    try {
      const res = await api.get('/finance/corporate-billing/pending/all')
      setAllPendingInvoices(res.data)
    } catch (e) {
      toast.error('Gagal memuat invoice yang belum digenerate')
      setShowUnbilledModal(false)
    } finally {
      setLoadingUnbilled(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return
    if (paymentData.amount <= 0) {
      toast.error('Nominal bayar harus lebih dari 0')
      return
    }
    setCreating(true)
    try {
      await api.post('/finance/corporate-billing/pay', {
        corporateInvoiceId: selectedInvoice.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        transactionRef: paymentData.transactionRef,
        bankId: paymentData.bankId,
        notes: paymentData.notes,
        paymentDate: paymentData.paymentDate
      })
      toast.success('Pembayaran Perusahaan berhasil dicatat')
      setShowPaymentModal(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memproses pembayaran')
    } finally {
      setCreating(false)
    }
  }

  const handlePostJournal = async () => {
    if (!selectedInvoice) return
    setCreating(true)
    try {
      await api.post('/finance/corporate-billing/post', {
        corporateInvoiceId: selectedInvoice.id
      })
      toast.success('Pembayaran Perusahaan berhasil diposting ke Jurnal')
      setShowPostConfirmModal(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memposting ke jurnal')
    } finally {
      setCreating(false)
    }
  }

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return
    let bankInfo = null
    if (selectedBankIdForPrint) {
      bankInfo = banks.find(b => b.id === selectedBankIdForPrint)
    }
    printCorporateInvoice(selectedInvoice, bankInfo)
    setShowPrintBankModal(false)
  }

  const handleResetPayment = async (invoiceId: string) => {
    if (!window.confirm('Yakin membatalkan pembayaran ini? Data pembayaran akan dihapus.')) return
    try {
      await api.post('/finance/corporate-billing/reset-payment', {
        corporateInvoiceId: invoiceId
      })
      toast.success('Pembayaran berhasil dibatalkan')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal membatalkan pembayaran')
    }
  }

  const handlePartnerSelect = async (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    setSelectedPendingIds([])
    if (!partnerId) {
      setPendingInvoices([])
      return
    }
    try {
      const res = await api.get(`/finance/corporate-billing/pending/${partnerId}`)
      setPendingInvoices(res.data)
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengambil draft tagihan pasien')
    }
  }

  const handleGenerateInvoice = async () => {
    if (!selectedPartnerId || selectedPendingIds.length === 0) {
      toast.error('Pilih perusahaan dan minimal 1 tagihan pasien')
      return
    }
    setCreating(true)
    try {
      await api.post('/finance/corporate-billing/generate', {
        partnerId: selectedPartnerId,
        invoiceIds: selectedPendingIds,
        dueDate: dueDate || undefined,
        notes
      })
      toast.success('Tagihan Bulanan Perusahaan berhasil di-generate')
      setShowCreateModal(false)
      setSelectedPartnerId('')
      setPendingInvoices([])
      setSelectedPendingIds([])
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal generate tagihan')
    } finally {
      setCreating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Lunas</span>
      case 'partial': return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Cicilan</span>
      case 'unpaid': return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">Belum Bayar</span>
      default: return <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{status}</span>
    }
  }

  const selectedPartnerInfo = partners.find(p => p.id === selectedPartnerId)
  const selectedPendingData = pendingInvoices.filter(p => selectedPendingIds.includes(p.id))
  const previewSubtotal = selectedPendingData.reduce((sum, inv) => sum + (inv.corporateCoverageAmount || 0), 0)
  const previewDiscount = (previewSubtotal * (selectedPartnerInfo?.contractDiscountPercent || 0)) / 100
  const previewTax = ((previewSubtotal - previewDiscount) * (selectedPartnerInfo?.taxPercent || 0)) / 100
  const previewTotal = previewSubtotal - previewDiscount + previewTax

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pt-2">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-50 rounded-[2rem] shadow-sm">
              <FiFileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
           </div>
           <div>
              <h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Corporate Billing</h1>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Tagihan Bulanan Perusahaan</p>
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchAllPending}
            className="px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
          >
            <FiEye className="w-4 h-4" /> Unbilled Invoices
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 active:scale-95"
          >
            <FiPlus className="w-4 h-4" /> Generate Tagihan
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 rounded-2xl flex-1 min-w-0">
                  <FiSearch className="text-gray-400 shrink-0" />
                  <input 
                     type="text" 
                     value={search} 
                     onChange={(e) => setSearch(e.target.value)} 
                     placeholder="CARI NO INVOICE / PERUSAHAAN..." 
                     className="bg-transparent border-none focus:outline-none text-[10px] font-black text-gray-700 w-full uppercase tracking-widest outline-none" 
                  />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                 {['all', 'paid', 'unpaid', 'partial'].map((s) => (
                    <button 
                       key={s} 
                       onClick={() => setStatusFilter(s)} 
                       className={`px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          statusFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                       }`}
                    >
                       {s}
                    </button>
                 ))}
              </div>
          </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           <div className="py-20 text-center flex flex-col items-center">
             <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4 opacity-50" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading...</p>
           </div>
        ) : invoices.length === 0 ? (
           <div className="bg-gray-50/50 rounded-[3rem] p-24 text-center border-4 border-dashed border-white flex flex-col items-center">
              <FiFileText className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada tagihan perusahaan</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
             {invoices.map((inv) => (
               <div key={inv.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform duration-700">
                     <FiDollarSign className="w-32 h-32 text-blue-900" />
                  </div>
                  <div className="relative">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice No</p>
                           <p className="text-sm font-black text-gray-900 uppercase">{inv.invoiceNo}</p>
                        </div>
                        {getStatusBadge(inv.status)}
                     </div>
                     <div className="mb-6">
                        <p className="text-lg font-black text-blue-950 uppercase">{inv.partner.name}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                           {inv.patientInvoices.length} Tagihan Pasien
                        </p>
                     </div>
                     <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                           <span>Tgl Invoice</span>
                           <span>{new Date(inv.invoiceDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                           <span>Jatuh Tempo</span>
                           <span className={new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'text-rose-500 font-black' : ''}>
                              {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                           </span>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-end">
                        <div>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
                           <p className="text-xl font-black text-blue-600">{formatCurrency(inv.total)}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                              onClick={() => { setSelectedInvoice(inv); setSelectedBankIdForPrint(''); setShowPrintBankModal(true) }}
                              className="w-10 h-10 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-800 hover:text-white transition-all shadow-sm"
                              title="Cetak Invoice PDF"
                           >
                              <FiPrinter className="w-4 h-4" />
                           </button>
                           {inv.status === 'paid' && !inv.isPosted && (
                              <button 
                                 onClick={() => { setSelectedInvoice(inv); setShowPostConfirmModal(true) }}
                                 className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                 title="Posting Jurnal"
                              >
                                 <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 2-9h5"></path></svg>
                              </button>
                           )}
                           {inv.amountPaid > 0 && !inv.isPosted && (
                              <button 
                                 onClick={() => handleResetPayment(inv.id)}
                                 className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                 title="Batal Bayar"
                              >
                                 <FiX className="w-4 h-4" />
                              </button>
                           )}
                           {inv.status !== 'paid' && (
                              <button 
                                 onClick={() => { setSelectedInvoice(inv); setShowPaymentModal(true) }}
                                 className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                 title="Proses Pembayaran"
                              >
                                 <FiDollarSign className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
               <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto border-r border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Generate Tagihan</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pilih Perusahaan & Invoice Pasien</p>
                     </div>
                     <button onClick={() => setShowCreateModal(false)} className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full">
                        <FiX className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilih Perusahaan Relasi</label>
                        <select
                           value={selectedPartnerId}
                           onChange={(e) => handlePartnerSelect(e.target.value)}
                           className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        >
                           <option value="">-- Pilih Perusahaan --</option>
                           {partners.map(p => (
                              <option key={p.id} value={p.id}>{p.name} - {p.companyCode}</option>
                           ))}
                        </select>
                     </div>

                     {selectedPartnerId && (
                        <div>
                           <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Draft Tagihan Pasien</label>
                              <button 
                                 onClick={() => {
                                    if (selectedPendingIds.length === pendingInvoices.length) setSelectedPendingIds([])
                                    else setSelectedPendingIds(pendingInvoices.map(p => p.id))
                                 }}
                                 className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                              >
                                 {selectedPendingIds.length === pendingInvoices.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                              </button>
                           </div>
                           <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                              {pendingInvoices.length === 0 ? (
                                 <div className="p-4 bg-gray-50 rounded-2xl text-center text-[10px] font-bold text-gray-400 uppercase">Tidak ada tagihan tertunda</div>
                              ) : (
                                 pendingInvoices.map(inv => (
                                    <button
                                       key={inv.id}
                                       onClick={() => {
                                          if (selectedPendingIds.includes(inv.id)) setSelectedPendingIds(selectedPendingIds.filter(id => id !== inv.id))
                                          else setSelectedPendingIds([...selectedPendingIds, inv.id])
                                       }}
                                       className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                          selectedPendingIds.includes(inv.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-200'
                                       }`}
                                    >
                                       <div>
                                          <p className="text-xs font-black text-gray-900 uppercase">{inv.patient.name}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[9px] font-bold text-gray-400 uppercase">{inv.invoiceNo}</span>
                                             <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase">
                                                {new Date(inv.invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                             </span>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Plafon Dipakai</p>
                                          <p className="text-xs font-black text-gray-900">{formatCurrency(inv.corporateCoverageAmount || 0)}</p>
                                       </div>
                                    </button>
                                 ))
                              )}
                           </div>
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tgl Jatuh Tempo</label>
                           <input 
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Catatan Tambahan (Opsional)</label>
                        <textarea 
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                           rows={2}
                           placeholder="Contoh: Tagihan periode bulan Mei 2026..."
                           className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                        />
                     </div>
                  </div>
               </div>

               <div className="w-full md:w-1/2 bg-gray-50 p-8 md:p-12 overflow-y-auto">
                  <div className="flex justify-end mb-8 hidden md:flex">
                     <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm hover:shadow-md transition-all">
                        <FiX className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-blue-100">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><FiDollarSign className="w-6 h-6" /></div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimasi Tagihan</p>
                           <p className="text-sm font-black text-gray-900 uppercase truncate">{selectedPartnerInfo?.name || 'Pilih Perusahaan'}</p>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-gray-500 uppercase">Subtotal ({selectedPendingIds.length} Invoice)</span>
                           <span className="text-sm font-black text-gray-900">{formatCurrency(previewSubtotal)}</span>
                        </div>
                        {previewDiscount > 0 && (
                           <div className="flex justify-between items-center text-rose-500">
                              <span className="text-[10px] font-bold uppercase">Diskon Kontrak ({selectedPartnerInfo?.contractDiscountPercent}%)</span>
                              <span className="text-sm font-black">-{formatCurrency(previewDiscount)}</span>
                           </div>
                        )}
                        {previewTax > 0 && (
                           <div className="flex justify-between items-center text-amber-600">
                              <span className="text-[10px] font-bold uppercase">Pajak / PPN ({selectedPartnerInfo?.taxPercent}%)</span>
                              <span className="text-sm font-black">+{formatCurrency(previewTax)}</span>
                           </div>
                        )}
                     </div>

                     <div className="pt-6 mt-6 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Total Tagihan (Grand Total)</p>
                        <p className="text-3xl lg:text-4xl font-black text-blue-600 text-center tracking-tighter">{formatCurrency(previewTotal)}</p>
                     </div>

                     <button 
                        onClick={handleGenerateInvoice}
                        disabled={creating || selectedPendingIds.length === 0}
                        className="w-full py-4 mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex justify-center items-center gap-2"
                     >
                        {creating ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                        {creating ? 'Memproses...' : 'Buat Tagihan Sekarang'}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900 uppercase">Proses Pembayaran</h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm hover:shadow-md transition-all">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Sisa Tagihan</span>
                  <span className="text-lg font-black text-blue-700">{formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)}</span>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Metode Pembayaran</label>
                  <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="cash">Tunai (Cash)</option>
                  </select>
                </div>
                {paymentData.method === 'bank_transfer' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilih Bank Penerima</label>
                    <select value={paymentData.bankId} onChange={e => setPaymentData({...paymentData, bankId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none">
                      <option value="">-- Pilih Bank --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} (A/n {b.accountName})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nominal Dibayar (Rp)</label>
                  <input type="number" value={paymentData.amount || ''} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" placeholder="0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tanggal Bayar</label>
                    <input type="date" value={paymentData.paymentDate} onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">No Referensi / Bukti</label>
                    <input type="text" value={paymentData.transactionRef} onChange={e => setPaymentData({...paymentData, transactionRef: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" placeholder="TRX-123" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Catatan</label>
                  <input type="text" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handleProcessPayment} disabled={creating} className="flex-1 py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                  {creating ? 'Memproses...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Post Confirm Modal */}
        {showPostConfirmModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Posting ke Jurnal?</h3>
              <p className="text-xs font-bold text-gray-500 mb-8">
                Tindakan ini akan membuat jurnal transaksi otomatis ke Buku Besar (Kas/Bank bertambah, Piutang berkurang) sebesar <span className="text-emerald-600 font-black">{formatCurrency(selectedInvoice.amountPaid)}</span>. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowPostConfirmModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handlePostJournal} disabled={creating} className="flex-1 py-3 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                  {creating ? 'Memproses...' : 'Ya, Posting'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Print Bank Select Modal */}
        {showPrintBankModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900 uppercase">
                  {selectedInvoice.status === 'paid' ? 'Cetak Invoice' : 'Pilih Bank untuk Cetak'}
                </h3>
                <button onClick={() => setShowPrintBankModal(false)} className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm hover:shadow-md transition-all">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                {selectedInvoice.status === 'paid' ? (
                  <p className="text-xs font-bold text-gray-500 text-center">Invoice ini sudah lunas. Informasi instruksi pembayaran (rekening) tidak akan ditampilkan pada cetakan.</p>
                ) : (
                  <>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilih Bank (Instruksi Pembayaran)</label>
                    <select value={selectedBankIdForPrint} onChange={e => setSelectedBankIdForPrint(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none">
                      <option value="">-- Gunakan Bank Default --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} (A/n {b.accountName})</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowPrintBankModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handlePrintInvoice} className="flex-1 py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                  Cetak PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Unbilled Invoices Modal */}
        {showUnbilledModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Unbilled Invoices</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Data Invoice Pasien Yang Belum Digenerate Menjadi Tagihan Perusahaan</p>
                </div>
                <button onClick={() => setShowUnbilledModal(false)} className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm hover:shadow-md transition-all">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30">
                {loadingUnbilled ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4 opacity-50" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat Data...</p>
                  </div>
                ) : allPendingInvoices.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center">
                    <FiCheckCircle className="w-12 h-12 text-emerald-300 mb-4" />
                    <p className="text-sm font-black text-gray-900 uppercase">Semua Invoice Sudah Digenerate</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Tidak ada data invoice pasien yang tertunda.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group by Corporate Partner */}
                    {Object.entries(
                      allPendingInvoices.reduce((acc: any, inv: any) => {
                        const partnerName = inv.patient?.corporatePartner?.name || 'Tanpa Perusahaan';
                        if (!acc[partnerName]) acc[partnerName] = [];
                        acc[partnerName].push(inv);
                        return acc;
                      }, {})
                    ).map(([partnerName, invoices]: [string, any]) => (
                      <div key={partnerName} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-gray-100">
                          <h4 className="text-sm font-black text-blue-950 uppercase">{partnerName}</h4>
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                            {invoices.length} Draft
                          </span>
                        </div>
                        <div className="space-y-3">
                          {invoices.map((inv: any) => (
                            <div key={inv.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                              <div>
                                <p className="text-xs font-black text-gray-900 uppercase">{inv.patient?.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">{inv.invoiceNo}</span>
                                  <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase">
                                    {new Date(inv.invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Plafon Dipakai</p>
                                <p className="text-sm font-black text-blue-600">{formatCurrency(inv.corporateCoverageAmount || 0)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

