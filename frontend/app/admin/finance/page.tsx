'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiDollarSign, FiFileText, FiSearch, FiFilter, 
  FiClock, FiCheckCircle, FiMoreVertical, FiEye, 
  FiCreditCard, FiCalendar, FiArrowRight, FiActivity, FiShare2, FiZap, FiSend, FiPlus, FiBriefcase, FiEdit2, FiX
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  subtotal: number
}

interface Payment {
  id: string
  paymentNo: string
  amount: number
  paymentMethod: string
  paymentDate: string
}

interface Bank {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

interface ClinicProfile {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
}

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  total: number
  amountPaid: number
  status: 'paid' | 'unpaid' | 'partial' | 'cancelled'
  patient: {
    name: string
    medicalRecordNo: string
    phone: string
  }
  items: InvoiceItem[]
  payments: Payment[]
  bankId?: string | null
  bank?: Bank | null
  isPosted: boolean
  postedAt?: string
}

interface ReceiptPreviewData {
  clinicName: string
  clinicCode: string
  clinicAddress: string
  clinicPhone: string
  clinicEmail: string
  invoiceNo: string
  patientName: string
  medicalRecordNo: string
  paymentNo: string
  paymentDate: string
  paymentMethod: string
  amount: number
  cashierName: string
  items: InvoiceItem[]
}

export default function FinanceDashboard() {
  const { user, activeClinicId } = useAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([])
  const [activeClinicProfile, setActiveClinicProfile] = useState<ClinicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [summary, setSummary] = useState({ todayRevenue: 0, pendingRevenue: 0 })
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({ 
    amount: 0, 
    method: 'cash', 
    notes: '',
    bankId: '' 
  })
  const [processing, setProcessing] = useState(false)
  const [bankUpdating, setBankUpdating] = useState(false)
  const [receivedAmount, setReceivedAmount] = useState<number>(0)
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false)
  const [receiptPreviewData, setReceiptPreviewData] = useState<ReceiptPreviewData | null>(null)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showEditBankModal, setShowEditBankModal] = useState(false)
  const [selectedInvoiceToEdit, setSelectedInvoiceToEdit] = useState<any>(null)
  const [editBankDraftId, setEditBankDraftId] = useState('')
  
  // Post Confirmation State
  const [showPostConfirmModal, setShowPostConfirmModal] = useState(false)
  const [invoiceToPost, setInvoiceToPost] = useState<Invoice | null>(null)
  const [confirmBankId, setConfirmBankId] = useState('')
  

  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    try {
      setLoading(true)

      const [invRes, sumRes, bankRes, clinicRes] = await Promise.all([
        api.get('/finance/invoices', {
          params: { 
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            page: page,
            limit: 10
          }
        }),
        api.get('/finance/summary'),
        api.get('/master/banks'),
        api.get('/master/clinics')
      ])
      
      // Handle PaginatedResult or Array format robustly
      const invoiceData = invRes.data?.data || (Array.isArray(invRes.data) ? invRes.data : [])
      setInvoices(invoiceData)
      
      if (invRes.data?.meta) {
        setTotalPages(invRes.data.meta.totalPages || 1)
        setTotalItems(invRes.data.meta.total || invoiceData.length)
      } else {
        setTotalPages(1)
        setTotalItems(invoiceData.length)
      }
      
      setSummary(sumRes.data || { todayRevenue: 0, pendingRevenue: 0 })
      setAvailableBanks(Array.isArray(bankRes.data) ? bankRes.data : [])
      const clinics = Array.isArray(clinicRes.data) ? clinicRes.data : []
      const activeClinic = clinics.find((c: ClinicProfile) => c.id === activeClinicId) || null
      setActiveClinicProfile(activeClinic)
    } catch (error) {
      console.error('Fetch Finance Error:', error)
      toast.error('Gagal mengambil data keuangan')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, activeClinicId])

  useEffect(() => {
    if (activeClinicId) {
      fetchData()
    }
  }, [fetchData, activeClinicId])

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPaymentModal) return;
      
      // Prevent browser default for function keys
      if (['F1', 'F2', 'F3', 'F4'].includes(e.key)) e.preventDefault();

      if (e.key === 'Escape') closePaymentModal();
      if (e.key === 'Enter') {
        const change = receivedAmount - paymentData.amount;
        if (!processing && (paymentData.method !== 'cash' || change >= 0)) {
           handleProcessPayment();
        }
      }
      
      if (e.key === 'F1') setPaymentData(p => ({...p, method: 'cash'}));
      if (e.key === 'F2') setPaymentData(p => ({...p, method: 'transfer'}));
      if (e.key === 'F3') setPaymentData(p => ({...p, method: 'card'}));
      if (e.key === 'F4') setPaymentData(p => ({...p, method: 'insurance'}));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPaymentModal, paymentData, receivedAmount, processing]);

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedInvoice(null)
  }

  const closeEditBankModal = () => {
    setShowEditBankModal(false)
    setSelectedInvoiceToEdit(null)
    setEditBankDraftId('')
  }

  const normalizePaymentMethod = (method: string) => {
    const lower = method.toLowerCase()
    if (lower === 'cash') return 'Tunai'
    if (lower === 'transfer') return 'Transfer Bank'
    if (lower === 'card') return 'Kartu'
    if (lower === 'insurance') return 'Asuransi'
    return method
  }

  const handlePrintReceipt = () => {
    if (!receiptPreviewData) return

    const printWindow = window.open('', '_blank', 'width=420,height=900')
    if (!printWindow) {
      toast.error('Popup diblokir browser. Izinkan popup untuk print kwitansi.')
      return
    }

    const itemRowsHtml = receiptPreviewData.items.length
      ? receiptPreviewData.items.map((item) => `
          <div class="item-row">
            <div class="item-name">${item.description}</div>
            <div class="item-meta">${item.quantity} x ${formatCurrency(item.price)}</div>
            <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
          </div>
        `).join('')
      : `<div class="item-empty">Tidak ada detail item</div>`

    const receiptHtml = `
      <html>
        <head>
          <title>Kwitansi ${receiptPreviewData.invoiceNo}</title>
          <style>
            @page { size: 80mm auto; margin: 3mm; }
            body { font-family: Arial, sans-serif; margin: 0; }
            .paper { width: 80mm; margin: 0 auto; padding: 2mm; box-sizing: border-box; color: #111827; }
            .center { text-align: center; }
            .title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
            .subtitle { font-size: 10px; margin-bottom: 8px; color: #4b5563; }
            .line { border-top: 1px dashed #9ca3af; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; gap: 8px; }
            .mono { font-family: "Courier New", monospace; letter-spacing: 0.4px; }
            .amount { font-size: 14px; font-weight: 800; }
            .item-row { border-bottom: 1px dotted #d1d5db; padding: 4px 0; }
            .item-name { font-size: 10px; font-weight: 700; }
            .item-meta { font-size: 9px; color: #6b7280; margin-top: 1px; }
            .item-subtotal { font-size: 10px; font-weight: 700; text-align: right; margin-top: 2px; }
            .item-empty { font-size: 9px; text-align: center; color: #9ca3af; padding: 4px 0; }
            .footer { font-size: 9px; text-align: center; color: #6b7280; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="paper">
            <div class="center">
              <div class="title">${receiptPreviewData.clinicName}</div>
              <div class="subtitle">${receiptPreviewData.clinicAddress || '-'}</div>
              <div class="subtitle">Telp: ${receiptPreviewData.clinicPhone || '-'} | Email: ${receiptPreviewData.clinicEmail || '-'}</div>
              <div class="subtitle">Kode Klinik: ${receiptPreviewData.clinicCode || '-'}</div>
              <div class="subtitle"><b>KWITANSI PEMBAYARAN</b></div>
            </div>
            <div class="line"></div>
            <div class="row"><span>No. Invoice</span><span class="mono">${receiptPreviewData.invoiceNo}</span></div>
            <div class="row"><span>No. Bayar</span><span class="mono">${receiptPreviewData.paymentNo}</span></div>
            <div class="row"><span>Tanggal</span><span>${new Date(receiptPreviewData.paymentDate).toLocaleString('id-ID')}</span></div>
            <div class="row"><span>Pasien</span><span>${receiptPreviewData.patientName}</span></div>
            <div class="row"><span>No. RM</span><span class="mono">${receiptPreviewData.medicalRecordNo || '-'}</span></div>
            <div class="row"><span>Metode</span><span>${normalizePaymentMethod(receiptPreviewData.paymentMethod)}</span></div>
            <div class="line"></div>
            ${itemRowsHtml}
            <div class="line"></div>
            <div class="row amount"><span>TOTAL BAYAR</span><span>${formatCurrency(receiptPreviewData.amount)}</span></div>
            <div class="line"></div>
            <div class="row"><span>Kasir</span><span>${receiptPreviewData.cashierName}</span></div>
            <div class="footer">Terima kasih. Simpan kwitansi ini sebagai arsip.</div>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return
    
    try {
      setProcessing(true)
      const { data } = await api.post('/finance/payments', {
        invoiceId: selectedInvoice.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        notes: paymentData.notes,
        bankId: paymentData.bankId || null
      })
      
      toast.success('Pembayaran berhasil diproses')
      setShowPaymentModal(false)
      setSelectedInvoice(null)
      const paymentResult = data?.payment || data
      setReceiptPreviewData({
        clinicName: activeClinicProfile?.name || 'Klinik',
        clinicCode: activeClinicProfile?.code || '-',
        clinicAddress: activeClinicProfile?.address || '-',
        clinicPhone: activeClinicProfile?.phone || '-',
        clinicEmail: activeClinicProfile?.email || '-',
        invoiceNo: selectedInvoice.invoiceNo,
        patientName: selectedInvoice.patient.name,
        medicalRecordNo: selectedInvoice.patient.medicalRecordNo,
        paymentNo: paymentResult?.paymentNo || `PAY-${Date.now()}`,
        paymentDate: paymentResult?.paymentDate || new Date().toISOString(),
        paymentMethod: paymentResult?.paymentMethod || paymentData.method,
        amount: Number(paymentResult?.amount || paymentData.amount || 0),
        cashierName: user?.name || 'Admin Klinik',
        items: selectedInvoice.items || []
      })
      setShowReceiptPreviewModal(true)
      fetchData()
    } catch (error: any) {
      console.error('Payment Error:', error)
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal memproses pembayaran'
      toast.error(backendMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleReprintFromInvoice = (inv: Invoice) => {
    const latestPayment = [...(inv.payments || [])].sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )[0]

    if (!latestPayment) {
      toast.error('Belum ada data pembayaran untuk invoice ini.')
      return
    }

    setReceiptPreviewData({
      clinicName: activeClinicProfile?.name || 'Klinik',
      clinicCode: activeClinicProfile?.code || '-',
      clinicAddress: activeClinicProfile?.address || '-',
      clinicPhone: activeClinicProfile?.phone || '-',
      clinicEmail: activeClinicProfile?.email || '-',
      invoiceNo: inv.invoiceNo,
      patientName: inv.patient.name,
      medicalRecordNo: inv.patient.medicalRecordNo,
      paymentNo: latestPayment.paymentNo,
      paymentDate: latestPayment.paymentDate,
      paymentMethod: latestPayment.paymentMethod,
      amount: Number(latestPayment.amount || 0),
      cashierName: user?.name || 'Admin Klinik',
      items: inv.items || []
    })
    setShowReceiptPreviewModal(true)
  }

  const handleSaveInvoiceBank = async () => {
    if (!selectedInvoiceToEdit) return
    setBankUpdating(true)
    try {
      await api.put('/finance/invoices/bank', {
        invoiceId: selectedInvoiceToEdit.id,
        bankId: editBankDraftId || null
      })
      toast.success('Informasi bank berhasil diperbarui')
      closeEditBankModal()
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui bank')
    } finally {
      setBankUpdating(false)
    }
  }

  const handleUpdateInvoiceBank = async (bankId: string) => {
    if (!selectedInvoice) return
    setBankUpdating(true)
    try {
        const { data: updated } = await api.put('/finance/invoices/bank', {
           invoiceId: selectedInvoice.id,
           bankId: bankId || null
        })
        
        setSelectedInvoice(updated)
        // Refresh invoice list to update the item locally
        setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv))
        toast.success('Bank instruksi pembayaran diperbarui')
    } catch (e) {
        toast.error('Gagal memperbarui bank')
    } finally {
        setBankUpdating(false)
    }
  }

  const handlePostToLedger = async (inv: Invoice) => {
    try {
      setProcessing(true)

      await api.post('/finance/invoices/post-to-ledger', {
        invoiceId: inv.id
      })
      
      toast.success('Invoice berhasil terposting ke Buku Besar')
      setShowPostConfirmModal(false)
      fetchData()
    } catch (error: any) {
      console.error('Post Error:', error)
      toast.error(error.response?.data?.message || 'Gagal posting invoice. Pastikan System Mapping sudah benar.')
    } finally {
      setProcessing(false)
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
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><FiCheckCircle className="w-3 h-3"/> Lunas</span>
      case 'partial':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><FiClock className="w-3 h-3"/> Cicilan</span>
      case 'unpaid':
        return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><FiClock className="w-3 h-3"/> Belum Bayar</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">Dibatalkan</span>
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>
    }
  }

  return (
    <div className="w-full px-[6px] py-4 space-y-10">
      
      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <FiDollarSign className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendapatan Hari Ini</p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(summary.todayRevenue)}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <FiClock className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Piutang Berjalan</p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight text-rose-600">{formatCurrency(summary.pendingRevenue)}</h3>
            </div>
          </motion.div>
      </div>

      {/* FILTER & SEARCH */}
      {/* FILTER & SEARCH */}
      <section className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mx-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 flex-1 w-full">
                  <FiSearch className="text-slate-400 w-4 h-4 pointer-events-none" />
                  <input 
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari Invoice # atau Nama Pasien..."
                    className="bg-transparent border-none focus:outline-none text-[11px] font-black text-slate-700 w-full py-2.5 uppercase"
                  />
              </div>

              <div className="flex items-center gap-2">
                  {['all', 'paid', 'unpaid', 'partial'].map((s) => (
                    <button 
                      key={s} onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {s}
                    </button>
                  ))}
              </div>
          </div>
      </section>

      {/* INVOICE TABLE */}
      <section className="mx-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Invoice</th>
                      <th className="px-5 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                      <th className="px-5 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pasien</th>
                      <th className="px-5 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                      <th className="px-5 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-5 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Sync</th>
                      <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                      {invoices.length > 0 ? (
                        invoices?.map((inv, idx) => (
                            <motion.tr 
                              key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="group hover:bg-indigo-50/20 transition-all duration-300"
                            >
                              <td className="px-10 py-6">
                                  <p className="text-sm font-black text-slate-800 tracking-tightest group-hover:text-indigo-600 transition-colors uppercase">{inv.invoiceNo}</p>
                              </td>
                              <td className="px-8 py-6">
                                  <div className="flex items-center gap-2 text-slate-500">
                                      <FiCalendar className="w-3.5 h-3.5" />
                                      <p className="text-[11px] font-bold">{new Date(inv.invoiceDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                                  </div>
                              </td>
                              <td className="px-8 py-6">
                                  <p className="text-sm font-black text-slate-800 hover:text-indigo-600 cursor-pointer transition-colors leading-none">{inv.patient.name}</p>
                                  <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-widest">{inv.patient.medicalRecordNo}</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                  <p className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(inv.total)}</p>
                                  {inv.amountPaid > 0 && <p className="text-[9px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">Paid: {formatCurrency(inv.amountPaid)}</p>}
                              </td>
                              <td className="px-8 py-6 flex justify-center">{getStatusBadge(inv.status)}</td>
                              <td className="px-8 py-6 text-center">
                                  {inv.isPosted ? (
                                    <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex mx-auto border border-emerald-100">
                                        <FiCheckCircle className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Posted</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full inline-flex mx-auto border border-slate-100">
                                        <FiClock className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[8px]">Draft</span>
                                    </div>
                                  )}
                              </td>
                              <td className="px-10 py-6">
                                  <div className="flex items-center justify-end gap-3">
                                    <button 
                                      onClick={() => setSelectedInvoice(inv)}
                                      className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl shadow-sm hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2"
                                    >
                                      <FiEye className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest mr-1">Detail</span>
                                    </button>
                                    <button
                                      onClick={() => handleReprintFromInvoice(inv)}
                                      disabled={!inv.payments || inv.payments.length === 0}
                                      className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl shadow-sm hover:text-sky-600 hover:border-sky-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Print ulang kwitansi"
                                    >
                                      <FiFileText className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest mr-1">Print Ulang</span>
                                    </button>

                                    {!inv.isPosted && (
                                       <button 
                                         onClick={() => {
                                           setSelectedInvoiceToEdit(inv);
                                           setEditBankDraftId(inv.bankId || '');
                                           setShowEditBankModal(true);
                                         }}
                                         className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl shadow-sm hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center gap-2"
                                         title="Ubah Bank"
                                       >
                                         <FiEdit2 className="w-4 h-4" />
                                       </button>
                                    )}

                                    {inv.status !== 'paid' && (
                                        <button 
                                          onClick={() => {
                                             const totalBill = Number(inv.total) || 0;
                                             const alreadyPaid = Number(inv.amountPaid) || 0;
                                             const remaining = Math.max(0, totalBill - alreadyPaid);

                                             setSelectedInvoice(inv);
                                             setReceivedAmount(remaining);
                                             setPaymentData({ 
                                               amount: remaining, 
                                               method: 'cash', 
                                               notes: '',
                                               bankId: '' 
                                             });
                                             setShowPaymentModal(true);
                                          }}
                                          className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 hover:bg-slate-900 transition-all flex items-center gap-2"
                                          title="Bayar Sekarang"
                                        >
                                          <FiCreditCard className="w-4 h-4" />
                                          <span className="text-[10px] font-black uppercase tracking-widest mr-1">Bayar</span>
                                        </button>
                                    )}
                                    {!inv.isPosted && inv.status !== 'cancelled' && (
                                        <button 
                                          onClick={() => {
                                            if (inv.amountPaid <= 0 && inv.total > 0) {
                                              toast.error("Invoice harus dibayar terlebih dahulu sebelum di-POST ke Buku Besar.");
                                              return;
                                            }
                                            setInvoiceToPost(inv);
                                            setShowPostConfirmModal(true);
                                          }}
                                          disabled={processing}
                                          className={`p-3 border rounded-2xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 ${inv.amountPaid > 0 ? 'bg-white border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900' : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}
                                          title={inv.amountPaid > 0 ? "Post ke Buku Besar" : "Bayar dahulu sebelum Post"}
                                        >
                                          <FiSend className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
                                          <span className="text-[10px] font-black uppercase tracking-widest mr-1">Post</span>
                                        </button>
                                    )}
                                  </div>
                              </td>
                            </motion.tr>
                        ))
                      ) : (
                        <tr>
                            <td colSpan={7} className="px-10 py-20 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-30">
                                  <FiFileText className="w-16 h-16" />
                                  <p className="font-black text-slate-400 uppercase tracking-widest">Tidak ada transaksi ditemukan</p>
                              </div>
                            </td>
                        </tr>
                      )}
                  </AnimatePresence>
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {invoices.length} of {totalItems} Invoices
              </p>
              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl text-white font-black text-xs shadow-md shadow-indigo-200">
                  {page}
                </div>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
      </section>

      {/* INVOICE DETAIL MODAL */}
      <AnimatePresence>
        {selectedInvoice && !showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none uppercase underline decoration-indigo-500/20 underline-offset-4">Detail Invoice</h3>
                       <div className="flex items-center gap-2 pt-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{selectedInvoice.invoiceNo}</span>
                          {getStatusBadge(selectedInvoice.status)}
                       </div>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal Terbit</p>
                       <p className="text-sm font-black text-slate-900">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-all group">
                       <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiFileText className="w-3.5 h-3.5 text-indigo-500" /> Pasien
                       </h4>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Nama Lengkap</p>
                             <p className="text-sm font-black text-slate-800 uppercase">{selectedInvoice.patient.name}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">No. Rekam Medis</p>
                             <p className="text-sm font-black text-slate-800 tracking-widest font-mono">{selectedInvoice.patient.medicalRecordNo}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Kontak</p>
                             <p className="text-sm font-black text-slate-800">{selectedInvoice.patient.phone || '-'}</p>
                          </div>
                       </div>
                    </div>

                    {/* Financial Resume */}
                    <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                       <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                          <FiDollarSign className="w-3.5 h-3.5" /> Resume Finansial
                       </h4>
                       <div className="space-y-5 relative z-10">
                          <div className="flex justify-between items-center text-xs font-bold text-white/60">
                             <span>TOTAL</span>
                             <span className="font-black text-white">{formatCurrency(selectedInvoice.total)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-white/60">
                             <span>PAID</span>
                             <span className="font-black text-emerald-300">{formatCurrency(selectedInvoice.amountPaid || 0)}</span>
                          </div>
                          <div className="pt-6 border-t border-white/10 mt-4">
                             <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Outstanding</p>
                             <h5 className="text-2xl font-black text-white tracking-tightest">{formatCurrency(selectedInvoice.total - (selectedInvoice.amountPaid || 0))}</h5>
                          </div>
                       </div>
                    </div>

                    {/* Billing/Bank Info */}
                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50 flex flex-col justify-between">
                       <div>
                          <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <FiBriefcase className="w-3.5 h-3.5" /> Pembayaran
                          </h4>
                          
                          {selectedInvoice.bank ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                      <FiCreditCard className="w-5 h-5" />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Bank Tujuan</p>
                                      <p className="text-sm font-black text-slate-800 uppercase">{selectedInvoice.bank.bankName}</p>
                                   </div>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">No. Rekening</p>
                                   <p className="text-lg font-black text-indigo-600 tracking-widest font-mono leading-none">{selectedInvoice.bank.accountNumber}</p>
                                   <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">A.N {selectedInvoice.bank.accountHolder}</p>
                                </div>
                            </div>
                          ) : (
                            <div className="py-4 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                               <p className="text-[9px] font-bold text-slate-400 uppercase italic">Bank belum dipilih</p>
                            </div>
                          )}
                       </div>
                       
                       <div className="mt-8 space-y-3">
                           <div className="flex items-center justify-between ml-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Akun Bank</p>
                              {selectedInvoice.isPosted && (
                                 <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Locked (Posted)</span>
                              )}
                           </div>
                           <select 
                              className={`w-full px-4 py-4 ${selectedInvoice.isPosted ? 'bg-slate-100 opacity-60 cursor-not-allowed' : 'bg-slate-50'} border border-slate-200 rounded-2xl text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none`}
                              value={selectedInvoice.bankId || ''}
                              disabled={bankUpdating || selectedInvoice.isPosted}
                              onChange={(e) => handleUpdateInvoiceBank(e.target.value)}
                           >
                             <option value="">-- Pilih Bank --</option>
                             {availableBanks?.map(b => (
                               <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight ml-4">Rincian Layanan</h4>
                    <div className="rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan / Item</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Unit</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {selectedInvoice.items?.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                   <td className="px-10 py-6 text-sm font-black text-slate-800">{item.description}</td>
                                   <td className="px-8 py-6 text-sm font-bold text-slate-700 text-center">{item.quantity}</td>
                                   <td className="px-8 py-6 text-sm font-bold text-slate-700 text-right">{formatCurrency(item.price)}</td>
                                   <td className="px-10 py-6 text-base font-black text-slate-900 text-right tracking-tight">{formatCurrency(item.subtotal)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
         {showPaymentModal && selectedInvoice && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={closePaymentModal} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden"
               >
                  {/* Header Section */}
                  <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                     <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black tracking-tight">Proses Bayar</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedInvoice.invoiceNo}</p>
                        </div>
                        <button onClick={closePaymentModal} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                           <FiX className="w-5 h-5" />
                        </button>
                     </div>
                  </div>

                  <div className="p-8 space-y-5">
                      {/* Professional Billing Header */}
                      <div className="grid grid-cols-2 gap-3 mb-2">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Tagihan</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(selectedInvoice.total)}</p>
                         </div>
                         <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Harus Dibayar</p>
                            <p className="text-sm font-black text-indigo-700 tracking-tight">{formatCurrency(paymentData.amount)}</p>
                         </div>
                      </div>

                      {/* Professional Change Display (Only for Cash) */}
                      {paymentData.method === 'cash' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-colors ${receivedAmount - paymentData.amount >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                        >
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{receivedAmount - paymentData.amount >= 0 ? 'Kembalian' : 'Kurang'}</p>
                           <p className="text-4xl font-black tracking-tighter">
                              {formatCurrency(Math.abs(receivedAmount - paymentData.amount))}
                           </p>
                        </motion.div>
                      )}

                      <div className="space-y-4">
                         {/* Method Selection with Shortcuts Label */}
                         <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Metode [F1-F4]</label>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                               {[
                                 {id: 'cash', label: 'Cash', icon: '1'},
                                 {id: 'transfer', label: 'Bank', icon: '2'},
                                 {id: 'card', label: 'Card', icon: '3'},
                                 {id: 'insurance', label: 'Insur', icon: '4'}
                               ].map((m) => (
                                  <button
                                    key={m.id} onClick={() => setPaymentData({...paymentData, method: m.id})}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${paymentData.method === m.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                  >
                                     {m.label}
                                  </button>
                               ))}
                            </div>
                         </div>

                         {/* Amounts Integration */}
                         <div className={paymentData.method === 'cash' ? "grid grid-cols-2 gap-4" : "block"}>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bayar (Set)</label>
                               <input 
                                  type="number" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black text-sm text-slate-600 focus:outline-none"
                                  value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                               />
                            </div>
                            {paymentData.method === 'cash' && (
                               <div className="space-y-2">
                                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-1">Diterima [Enter]</label>
                                  <input 
                                     autoFocus
                                     type="number" className="w-full px-4 py-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl font-black text-lg text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                                     value={receivedAmount} onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                                     onFocus={(e) => e.target.select()}
                                  />
                               </div>
                            )}
                         </div>

                         {/* Quick Cash Buttons (Only for Cash) */}
                         {paymentData.method === 'cash' && (
                            <div className="flex flex-wrap gap-2">
                              {[paymentData.amount, 50000, 100000, 200000].map((val, idx) => (
                                  <button 
                                    key={`quick-cash-${idx}-${val}`}
                                    onClick={() => setReceivedAmount(val)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black rounded-lg transition-colors border border-slate-200"
                                  >
                                     {val === paymentData.amount ? 'PAS' : formatCurrency(val)}
                                  </button>
                               ))}
                            </div>
                         )}

                         {/* Bank Selection (Conditional) */}
                         {(paymentData.method === 'transfer' || paymentData.method === 'card') && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                               <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Bank Tujuan</label>
                               <select 
                                  className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-700 focus:outline-none"
                                  value={paymentData.bankId} onChange={(e) => setPaymentData({...paymentData, bankId: e.target.value})}
                               >
                                  <option value="">-- Pilih Bank --</option>
                                  {availableBanks?.map(b => (
                                    <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                  ))}
                               </select>
                            </motion.div>
                         )}
                      </div>

                      <div className="pt-2">
                         <button 
                            disabled={processing || (paymentData.method === 'cash' && receivedAmount < paymentData.amount)}
                            onClick={handleProcessPayment}
                            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 ${processing || (paymentData.method === 'cash' && receivedAmount < paymentData.amount) ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40 hover:bg-black hover:scale-[1.02] active:scale-[0.98]'}`}
                         >
                            {processing ? (
                               <>
                                  <FiActivity className="w-4 h-4 animate-spin-slow" />
                                  Memproses...
                               </>
                            ) : (
                               <>
                                  Konfirmasi Pembayaran <FiArrowRight className="w-4 h-4" />
                               </>
                            )}
                         </button>
                         <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-[0.3em]">Tekan ESC untuk batal</p>
                      </div>
                   </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
      <AnimatePresence>
        {showReceiptPreviewModal && receiptPreviewData && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReceiptPreviewModal(false)}
              className="absolute inset-0 bg-slate-900/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight">Preview PDF Kwitansi</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Format thermal professional - lebar 80mm</p>
                </div>
                <button onClick={() => setShowReceiptPreviewModal(false)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 bg-slate-50">
                <div className="mx-auto w-[302px] bg-white border border-slate-200 rounded-2xl shadow-lg p-4 space-y-2">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900">{receiptPreviewData.clinicName}</p>
                    <p className="text-[10px] font-bold text-slate-500">{receiptPreviewData.clinicAddress || '-'}</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Telp: {receiptPreviewData.clinicPhone || '-'} | Email: {receiptPreviewData.clinicEmail || '-'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">Kode Klinik: {receiptPreviewData.clinicCode || '-'}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Kwitansi Pembayaran</p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 my-2" />
                  <div className="text-[11px] font-bold text-slate-700 space-y-1">
                    <div className="flex justify-between gap-3"><span>No. Invoice</span><span className="font-mono">{receiptPreviewData.invoiceNo}</span></div>
                    <div className="flex justify-between gap-3"><span>No. Bayar</span><span className="font-mono">{receiptPreviewData.paymentNo}</span></div>
                    <div className="flex justify-between gap-3"><span>Tanggal</span><span>{new Date(receiptPreviewData.paymentDate).toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between gap-3"><span>Pasien</span><span>{receiptPreviewData.patientName}</span></div>
                    <div className="flex justify-between gap-3"><span>No. RM</span><span className="font-mono">{receiptPreviewData.medicalRecordNo || '-'}</span></div>
                    <div className="flex justify-between gap-3"><span>Metode</span><span>{normalizePaymentMethod(receiptPreviewData.paymentMethod)}</span></div>
                  </div>
                  <div className="border-t border-dashed border-slate-300 my-2" />
                  <div className="space-y-2">
                    {receiptPreviewData.items.length > 0 ? (
                      receiptPreviewData.items.map((item) => (
                        <div key={item.id} className="border-b border-dotted border-slate-200 pb-2">
                          <p className="text-[11px] font-black text-slate-800">{item.description}</p>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-1">
                            <span>{item.quantity} x {formatCurrency(item.price)}</span>
                            <span className="text-slate-700">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-slate-400">Tidak ada detail item</p>
                    )}
                  </div>
                  <div className="border-t border-dashed border-slate-300 my-2" />
                  <div className="flex justify-between text-sm font-black text-slate-900">
                    <span>TOTAL BAYAR</span>
                    <span>{formatCurrency(receiptPreviewData.amount)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-300 my-2" />
                  <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                    <span>Kasir</span><span>{receiptPreviewData.cashierName}</span>
                  </div>
                  <p className="text-center text-[9px] text-slate-400 pt-2">Terima kasih. Simpan kwitansi ini sebagai arsip.</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Roll thermal 80mm, diameter gulungan max 80mm, core kecil 12mm
                </p>
                <button
                  autoFocus
                  onClick={handlePrintReceipt}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                >
                  Print Kwitansi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
      {/* BANK EDIT MODAL */}
      <AnimatePresence>
         {showEditBankModal && selectedInvoiceToEdit && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-8">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={closeEditBankModal} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white rounded-[3xl] shadow-2xl p-10 space-y-8"
               >
                  <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                           <FiEdit2 className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Bank</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedInvoiceToEdit.invoiceNo}</p>
                        </div>
                     </div>
                     <button onClick={closeEditBankModal} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <FiX className="text-slate-400" />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex flex-col gap-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Rekening Tujuan</label>
                           <select 
                              className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none appearance-none"
                              value={editBankDraftId}
                              disabled={bankUpdating || (selectedInvoiceToEdit?.isPosted)}
                              onChange={(e) => setEditBankDraftId(e.target.value)}
                           >
                              <option value="">-- Pilih Bank --</option>
                              {availableBanks?.map(b => (
                                 <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>
                              ))}
                           </select>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                           <FiZap className="w-4 h-4 text-amber-500 mt-0.5" />
                           <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wide">
                              Hanya bank yang bisa diubah karena rincian tagihan sudah terkunci oleh sistem medis.
                           </p>
                        </div>
                     </div>

                     <button 
                        onClick={handleSaveInvoiceBank}
                        disabled={
                          bankUpdating ||
                          selectedInvoiceToEdit?.isPosted ||
                          editBankDraftId === (selectedInvoiceToEdit?.bankId || '')
                        }
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {bankUpdating ? 'Menyimpan...' : 'Simpan Update'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
      <AnimatePresence>
         {showPostConfirmModal && invoiceToPost && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => !processing && setShowPostConfirmModal(false)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl p-12 space-y-10"
               >
                  <div className="flex flex-col items-center gap-6 text-center">
                     <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 animate-pulse">
                        <FiSend className="w-12 h-12" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Konfirmasi Posting</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest px-8">
                           Tindakan ini akan mengunci data invoice <span className="text-slate-900">{invoiceToPost.invoiceNo}</span> dan membuat jurnal akuntansi permanen.
                        </p>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center pb-6 border-b border-slate-200">
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(invoiceToPost.total)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Yang akan terjadi</p>
                           <ul className="space-y-2 text-[11px] font-bold text-slate-600">
                              <li className="flex items-center gap-2"><FiCheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Jurnal Piutang (AR) Debit dibuat</li>
                              <li className="flex items-center gap-2"><FiCheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Jurnal Pendapatan Credit dibuat</li>
                              <li className="flex items-center gap-2"><FiCheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Invoice terkunci dari perubahan</li>
                              <li className="flex items-center gap-2"><FiCheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Pastikan pembayaran sudah diterima sebelum memposting</li>
                           </ul>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-wide text-center">Bank akan ditentukan saat proses pembayaran berlangsung.</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <button 
                           onClick={() => setShowPostConfirmModal(false)}
                           disabled={processing}
                           className="w-full py-6 bg-slate-50 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all disabled:opacity-50"
                        >
                           Batal
                        </button>
                        <button 
                           onClick={() => handlePostToLedger(invoiceToPost)}
                           disabled={processing}
                           className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                           {processing ? <FiActivity className="w-4 h-4 animate-spin-slow" /> : <FiCheckCircle className="w-4 h-4" />}
                           {processing ? 'Memproses...' : 'Konfirmasi & Post'}
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  )
}
