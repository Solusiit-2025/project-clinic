'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiDollarSign, FiFileText, FiSearch, FiFilter, 
  FiClock, FiCheckCircle, FiMoreVertical, FiEye, 
  FiCreditCard, FiCalendar, FiArrowRight, FiActivity
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/useAuthStore'
import axios from 'axios'

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
}

export default function FinanceDashboard() {
  const { token, user, activeClinicId } = useAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [summary, setSummary] = useState({ todayRevenue: 0, pendingRevenue: 0 })
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash', notes: '' })

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }), [token, activeClinicId])

  const fetchData = useCallback(async () => {
    console.log('Finance fetchData triggered:', { token: !!token, activeClinicId })
    if (!token || !activeClinicId) return
    try {
      setLoading(true)
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api'
      
      const [invRes, sumRes] = await Promise.all([
        axios.get(`${baseUrl}/finance/invoices`, { 
          headers,
          params: { 
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter
          }
        }),
        axios.get(`${baseUrl}/finance/summary`, { headers })
      ])
      
      setInvoices(invRes.data)
      setSummary(sumRes.data)
    } catch (error) {
      console.error('Fetch Finance Error:', error)
      toast.error('Gagal mengambil data keuangan')
    } finally {
      setLoading(true)
      setTimeout(() => setLoading(false), 500)
    }
  }, [headers, search, statusFilter])

  useEffect(() => {
    if (token && activeClinicId) {
      fetchData()
    }
  }, [fetchData, token, activeClinicId])

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return
    
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api'
      await axios.post(`${baseUrl}/finance/payments`, {
        invoiceId: selectedInvoice.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        notes: paymentData.notes
      }, { headers })
      
      toast.success('Pembayaran berhasil diproses')
      setShowPaymentModal(false)
      setSelectedInvoice(null)
      fetchData()
    } catch (error) {
      toast.error('Gagal memproses pembayaran')
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
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest">{status}</span>
    }
  }

  return (
    <div className="w-full px-[6px] py-4 space-y-10">
      
      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FiDollarSign className="w-8 h-8" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendapatan Hari Ini</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(summary.todayRevenue)}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <FiClock className="w-8 h-8" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Piutang Berjalan</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(summary.pendingRevenue)}</h3>
            </div>
          </motion.div>
      </div>

      {/* INVOICE LIST */}
      <section className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Transaksi Pasien</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Kelola tagihan, pembayaran, dan resume finansial pasien secara terpadu.</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" placeholder="Cari No. Invoice / Nama Pasien..." 
                    className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-80 transition-all"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                  {['all', 'unpaid', 'paid'].map((s) => (
                      <button
                        key={s} onClick={() => setStatusFilter(s)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {s === 'all' ? 'Semua' : s === 'unpaid' ? 'Belum Bayar' : 'Lunas'}
                      </button>
                  ))}
                </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-bottom border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Invoice</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pasien</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibayar</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                              <td colSpan={7} className="px-10 py-6"><div className="h-10 bg-slate-100 rounded-2xl w-full"></div></td>
                            </tr>
                        ))
                      ) : invoices.length > 0 ? (
                        invoices.map((inv) => (
                            <motion.tr 
                              key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="hover:bg-slate-50/50 transition-colors group"
                            >
                              <td className="px-10 py-7 font-black text-slate-800 text-sm tracking-tight">{inv.invoiceNo}</td>
                              <td className="px-8 py-7">
                                  <div className="font-bold text-slate-800">{inv.patient.name}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{inv.patient.medicalRecordNo}</div>
                              </td>
                              <td className="px-8 py-7 text-sm font-medium text-slate-500">
                                  {new Date(inv.invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-8 py-7 text-sm font-black text-slate-900">{formatCurrency(inv.total)}</td>
                              <td className="px-8 py-7 text-sm font-bold text-emerald-600">{formatCurrency(inv.amountPaid || 0)}</td>
                              <td className="px-8 py-7">
                                  <div className="flex justify-center">{getStatusBadge(inv.status)}</div>
                              </td>
                              <td className="px-10 py-7 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => setSelectedInvoice(inv)}
                                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-indigo-500/10 transition-all flex items-center gap-2"
                                    >
                                        <FiEye className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest mr-1">Detail</span>
                                    </button>
                                    {inv.status !== 'paid' && (
                                        <button 
                                          onClick={() => {
                                            setSelectedInvoice(inv);
                                            setPaymentData({ amount: inv.total - (inv.amountPaid || 0), method: 'cash', notes: '' });
                                            setShowPaymentModal(true);
                                          }}
                                          className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                        >
                                          <FiCreditCard className="w-4 h-4" />
                                          <span className="text-[10px] font-black uppercase tracking-widest mr-1">Bayar</span>
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
              className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-12 space-y-10 max-h-[90vh] overflow-y-auto custom-scrollbar text-left">
                 <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-slate-800 tracking-tight">Detail Invoice</h3>
                       <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tightest">{selectedInvoice.invoiceNo}</span>
                          {getStatusBadge(selectedInvoice.status)}
                       </div>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diterbitkan Pada</p>
                       <p className="text-sm font-black text-slate-800">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiFileText className="w-3 h-3" /> Informasi Pasien
                       </h4>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                             <p className="text-base font-black text-slate-800">{selectedInvoice.patient.name}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. Rekam Medis</p>
                             <p className="text-base font-black text-slate-800 tracking-widest">{selectedInvoice.patient.medicalRecordNo}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kontak</p>
                             <p className="text-base font-black text-slate-800">{selectedInvoice.patient.phone || '-'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100/50">
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiDollarSign className="w-3 h-3" /> Resume Finansial
                       </h4>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                             <span>Subtotal</span>
                             <span>{formatCurrency(selectedInvoice.total)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                             <span>Total Terbayar</span>
                             <span className="text-emerald-600">{formatCurrency(selectedInvoice.amountPaid || 0)}</span>
                          </div>
                          <div className="pt-4 border-t border-indigo-100 flex justify-between items-center">
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sisa Tagihan</span>
                             <span className="text-2xl font-black text-indigo-600">{formatCurrency(selectedInvoice.total - (selectedInvoice.amountPaid || 0))}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 ml-4">Rincian Layanan & Produk</h4>
                    <div className="rounded-[2.5rem] border border-slate-100 overflow-hidden">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-50">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {selectedInvoice.items.map((item) => (
                                <tr key={item.id}>
                                   <td className="px-8 py-5 text-sm font-bold text-slate-700">{item.description}</td>
                                   <td className="px-8 py-5 text-sm font-bold text-slate-700 text-center">{item.quantity}</td>
                                   <td className="px-8 py-5 text-sm font-bold text-slate-700 text-right">{formatCurrency(item.price)}</td>
                                   <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">{formatCurrency(item.subtotal)}</td>
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
                  onClick={() => setShowPaymentModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-12 space-y-10"
               >
                  <div className="flex flex-col items-center gap-6">
                     <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 animate-bounce-slow">
                        <FiCreditCard className="w-10 h-10" />
                     </div>
                     <div className="text-center space-y-2">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Proses Pembayaran</h3>
                        <p className="text-slate-400 text-sm font-medium">Selesaikan transaksi untuk invoice <span className="font-bold text-slate-600">{selectedInvoice.invoiceNo}</span></p>
                     </div>
                  </div>

                  <div className="space-y-6 text-left">
                     <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jumlah Tagihan</p>
                        <p className="text-3xl font-black text-slate-900 text-center tracking-tight">{formatCurrency(selectedInvoice.total - (selectedInvoice.amountPaid || 0))}</p>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Metode Pembayaran</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['cash', 'transfer', 'card', 'insurance'].map((m) => (
                              <button
                                key={m} onClick={() => setPaymentData({...paymentData, method: m})}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentData.method === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-200'}`}
                              >
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jumlah Bayar</label>
                        <input 
                           type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                           value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                        />
                     </div>
                  </div>

                  <button 
                     onClick={handleProcessPayment}
                     className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                  >
                     Submit Pembayaran <FiArrowRight className="w-5 h-5" />
                  </button>
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
    </div>
  )
}
