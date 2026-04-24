'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { 
  FiLock, FiUnlock, FiCalendar, FiActivity, FiArrowRight, 
  FiCheckCircle, FiAlertTriangle, FiInfo, FiTrendingUp, FiTrendingDown, 
  FiShield, FiZap, FiRefreshCw 
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const ACCT_API = process.env.NEXT_PUBLIC_API_URL + '/api/accounting'

export default function YearEndClosingPage() {
  const { token, activeClinicId } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState(1) // 1: Preview, 2: processing

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }), [token, activeClinicId])

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      // We use the Profit & Loss API to get a preview of the year's performance
      const start = `${selectedYear}-01-01`
      const end = `${selectedYear}-12-31`
      const { data } = await axios.get(`${ACCT_API}/profit-loss`, { 
        headers, 
        params: { startDate: start, endDate: end } 
      })
      setSummary(data)
    } catch (e) {
      console.error('Failed to fetch summary', e)
      toast.error('Gagal mengambil ringkasan performa tahunan')
    } finally {
      setLoading(false)
    }
  }, [headers, selectedYear])

  useEffect(() => {
    if (token) fetchSummary()
  }, [fetchSummary, token])

  const handleRunClosing = async () => {
    setProcessing(true)
    setStep(2)
    try {
      await axios.post(`${ACCT_API}/close-year`, {
        year: selectedYear
      }, { headers })
      
      toast.success(`Tutup Buku Tahun ${selectedYear} Berhasil!`)
      fetchSummary()
      setShowConfirm(false)
      setStep(1)
    } catch (error: any) {
      console.error('Closing Error:', error)
      toast.error(error.response?.data?.message || 'Gagal menjalankan Tutup Buku')
      setStep(1)
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

  return (
    <div className="w-full px-[10px] py-10 space-y-12 text-left max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-6">
        <div className="space-y-3">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-slate-900 rounded-[1.5rem] text-indigo-400 shadow-2xl border border-white/10">
                  <FiLock className="w-8 h-8" />
               </div>
               <div>
                 <h1 className="text-5xl font-black text-slate-900 tracking-tightest leading-none">Tutup Buku Tahunan</h1>
                 <p className="text-slate-400 font-bold text-sm tracking-widest mt-2 uppercase">Year-End Financial Closing Process</p>
               </div>
            </div>
        </div>

        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
           <div className="relative flex items-center gap-4 p-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
               <FiCalendar className="w-6 h-6 text-indigo-600 ml-4" />
               <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-xl font-black text-slate-900 focus:outline-none pr-8 py-3 appearance-none cursor-pointer"
               >
                  {[2023, 2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
               </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-6">
          
          {/* STATS CONTENT */}
          <div className="lg:col-span-2 space-y-10">
              
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <FiTrendingUp className="w-20 h-20 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-2">{summary ? formatCurrency(summary.totalRevenue) : 'Rp 0'}</h3>
                 </div>
                 
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                      <FiTrendingDown className="w-20 h-20 text-rose-600" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenses</span>
                    <h3 className="text-2xl font-black text-rose-600 mt-2">{summary ? formatCurrency(summary.totalExpense) : 'Rp 0'}</h3>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500 text-indigo-400">
                      <FiActivity className="w-20 h-20" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Net Profit</span>
                    <h3 className="text-2xl font-black text-white mt-2">{summary ? formatCurrency(summary.netProfit) : 'Rp 0'}</h3>
                 </div>
              </div>

              {/* ACTION INFO */}
              <div className="bg-indigo-50/50 p-10 rounded-[3.5rem] border border-indigo-100 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                      <FiInfo className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Apa itu Tutup Buku?</h2>
                 </div>
                 <div className="space-y-4">
                    {[
                      { title: 'Nol-kan Saldo Pendapatan', desc: 'Semua akun pendapatan akan dikembalikan ke saldo 0 untuk tahun baru.' },
                      { title: 'Nol-kan Saldo Beban', desc: 'Semua pengeluaran dan biaya akan diatur ulang menjadi 0.' },
                      { title: 'Pemindahan Laba', desc: 'Laba bersih akhir tahun akan dipindahkan ke akun Laba Ditahan dalam kategori Ekuitas.' },
                      { title: 'Kunci Periode', desc: 'Transaksi pada periode ini tidak akan bisa diubah lagi setelah ditutup secara formal.' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                         <FiCheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                         <div>
                            <p className="font-black text-slate-800 text-sm italic underline decoration-indigo-200 decoration-4">{item.title}</p>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

          </div>

          {/* SIDEBAR ACTION */}
          <div className="space-y-8">
             <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8 text-center sticky top-10">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-900 border border-slate-100 shadow-inner">
                   {processing ? <FiZap className="w-12 h-12 animate-pulse text-indigo-600" /> : <FiShield className="w-12 h-12" />}
                </div>

                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Siap Tutup Buku?</h3>
                   <p className="text-sm text-slate-400 font-medium leading-relaxed">Pastikan semua data transaksi tahun {selectedYear} sudah diinput dengan benar sebelum melanjutkan.</p>
                </div>

                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-left space-y-2">
                   <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                      <FiAlertTriangle className="w-4 h-4" /> Perhatian
                   </div>
                   <p className="text-[11px] text-rose-700 font-medium leading-relaxed">Proses ini akan membuat Jurnal Penutup yang tidak dapat dihapus secara normal.</p>
                </div>

                <button 
                   onClick={() => setShowConfirm(true)} disabled={loading || processing}
                   className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-400 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                   {loading ? 'Menyiapkan...' : 'Jalankan Proses Penutupan'}
                </button>
             </div>
          </div>

      </div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-900/40">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white w-full max-w-xl rounded-[4rem] shadow-3xl p-12 space-y-10 relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>
                
                {step === 1 ? (
                  <>
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-amber-200/50">
                        <FiAlertTriangle className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tightest">Konfirmasi Final</h2>
                        <p className="text-slate-400 font-medium">Anda akan melakukan Tutup Buku tahun <span className="text-slate-900 font-black">{selectedYear}</span>. Langkah ini permanen.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akun Ekuitas</span>
                          <span className="text-sm font-black text-slate-800">3-2101 (Laba Ditahan)</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Transfer</span>
                          <span className="text-lg font-black text-indigo-600">{summary ? formatCurrency(summary.netProfit) : '-'}</span>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button 
                         onClick={() => setShowConfirm(false)}
                         className="flex-1 py-6 border-2 border-slate-100 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                       >
                         Batalkan
                       </button>
                       <button 
                         onClick={handleRunClosing}
                         className="flex-1 py-6 bg-rose-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all animate-pulse"
                       >
                         Iya, Tutup Buku Sekarang
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-8 py-10">
                     <div className="relative">
                        <div className="w-32 h-32 border-[10px] border-slate-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-32 h-32 border-[10px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                        <FiZap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-indigo-600 animate-pulse" />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Memproses Penutupan...</h2>
                        <p className="text-slate-400 font-medium">Jangan menutup halaman ini. Sedang merelokasi saldo dan membuat jurnal penutup.</p>
                     </div>
                  </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
