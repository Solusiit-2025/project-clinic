'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { 
   FiTrendingUp, FiPieChart, FiCalendar, FiArrowDown, FiArrowUp, FiMinus, 
   FiActivity, FiDollarSign, FiPrinter, FiX, FiFileText, FiMapPin, FiPhone,
   FiUsers
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getLocalDateString, getFirstDayOfMonthString, formatFullDateID } from '@/lib/utils/date'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/accounting'

interface PLItem {
   code: string
   name: string
   category: string
   balance: number
}

interface PLReport {
   period: { start: string; end: string }
   // Pendapatan Bruto
   revenue: PLItem[]
   totalRevenue: number
   // Pengurang Pendapatan (Bagian Dokter / Contra-Revenue)
   doctorShareDeductions: PLItem[]
   totalDoctorShare: number
   // Pendapatan Neto Klinik
   netClinicRevenue: number
   // Beban Operasional
   expenses: PLItem[]
   totalExpense: number
   // Laba Bersih
   netProfit: number
}

export default function ProfitLossPage() {
   const [isPreviewOpen, setIsPreviewOpen] = useState(false)
   const { activeClinicId } = useAuthStore()
   const [report, setReport] = useState<PLReport | null>(null)
   const [loading, setLoading] = useState(true)
   const [startDate, setStartDate] = useState(getFirstDayOfMonthString())
   const [endDate, setEndDate] = useState(getLocalDateString())
   const user = useAuthStore(state => state.user)
   const activeClinic = user?.clinics?.find(c => c.id === activeClinicId) || user?.clinics?.[0]

   const fetchData = useCallback(async () => {
      if (!activeClinicId) return
      setLoading(true)
      try {
         const { data } = await api.get('/accounting/profit-loss', { 
            params: { startDate, endDate } 
         })
         setReport(data)
      } catch (e) {
         console.error('Failed to fetch P&L', e)
         toast.error('Gagal mengambil data Laba Rugi')
      } finally {
         setLoading(false)
      }
   }, [startDate, endDate, activeClinicId])

   useEffect(() => {
      fetchData()
   }, [fetchData])

   const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
         style: 'currency',
         currency: 'IDR',
         minimumFractionDigits: 0
      }).format(amount)
   }

   const profitMargin = useMemo(() => {
      if (!report || report.totalRevenue === 0) return 0
      return (report.netProfit / report.totalRevenue) * 100
   }, [report])

   const doctorShareRatio = useMemo(() => {
      if (!report || report.totalRevenue === 0) return 0
      return ((report.totalDoctorShare || 0) / report.totalRevenue) * 100
   }, [report])

   const handlePrint = () => {
      window.print()
   }

   return (
      <div className="w-full px-2 sm:px-4 py-6 space-y-10 text-left print-container">
         
         {/* HEADER & SUMMARY */}
         <div className="px-1 md:px-4 space-y-6 md:space-y-10 no-print">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
               <div className="space-y-1">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <FiTrendingUp className="w-5 h-5" />
                     </div>
                     <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Profit &amp; Loss</h1>
                  </div>
                  <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-wide mt-1">
                     Laporan Laba Rugi · Model <span className="text-indigo-500">Sharing Profit</span>
                  </p>
               </div>

               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm w-full">
                     <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100/50 flex-1">
                        <FiCalendar className="text-indigo-600 w-3.5 h-3.5" />
                        <input 
                           type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 w-full"
                           value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        />
                        <FiMinus className="text-slate-300 w-3 h-3 mx-1" />
                        <input 
                           type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 w-full"
                           value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        />
                     </div>
                     <button 
                        onClick={fetchData}
                        className="bg-indigo-600 text-white px-6 py-3 sm:py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                     >
                        Update
                     </button>
                  </div>
                  <button 
                     onClick={() => setIsPreviewOpen(true)}
                     className="bg-slate-900 text-white flex items-center justify-center gap-2.5 px-6 py-4 sm:py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 w-full sm:w-auto"
                  >
                     <FiPrinter className="w-4 h-4" /> <span>Preview &amp; Print PDF</span>
                  </button>
               </div>
            </div>

            {/* ── TOP SUMMARY CARDS (4 cards) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Pendapatan Bruto */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group col-span-1">
                  <div className="absolute top-0 right-0 p-3 text-emerald-50 group-hover:text-emerald-100 transition-colors">
                     <FiArrowUp className="w-10 h-10" />
                  </div>
                  <div className="relative z-10 space-y-3">
                     <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <FiDollarSign className="w-4.5 h-4.5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendapatan Bruto</p>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalRevenue || 0)}</h3>
                     </div>
                  </div>
               </motion.div>

               {/* Bagian Dokter (Contra-Revenue) */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden group col-span-1">
                  <div className="absolute top-0 right-0 p-3 text-amber-50 group-hover:text-amber-100 transition-colors">
                     <FiUsers className="w-10 h-10" />
                  </div>
                  <div className="relative z-10 space-y-3">
                     <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                           <FiUsers className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                           {doctorShareRatio.toFixed(1)}%
                        </span>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bagian Dokter</p>
                        <h3 className="text-base font-black text-amber-600 tracking-tight">{loading ? '...' : `(${formatCurrency(report?.totalDoctorShare || 0)})`}</h3>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Profit Sharing</p>
                     </div>
                  </div>
               </motion.div>

               {/* Beban Operasional */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group col-span-1">
                  <div className="absolute top-0 right-0 p-3 text-rose-50 group-hover:text-rose-100 transition-colors">
                     <FiArrowDown className="w-10 h-10" />
                  </div>
                  <div className="relative z-10 space-y-3">
                     <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                        <FiPieChart className="w-4.5 h-4.5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Beban Operasional</p>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalExpense || 0)}</h3>
                     </div>
                  </div>
               </motion.div>

               {/* Laba Bersih */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                  className="bg-slate-900 p-5 rounded-3xl shadow-xl relative overflow-hidden group col-span-1">
                  <div className="absolute -right-2 -bottom-2 p-3 text-white/5 group-hover:text-white/10 transition-colors rotate-12">
                     <FiActivity className="w-20 h-20" />
                  </div>
                  <div className="relative z-10 space-y-3">
                     <div className="flex justify-between items-start">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
                           <FiActivity className="w-4.5 h-4.5" />
                        </div>
                        <div className="px-2 py-0.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                           <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">{profitMargin.toFixed(1)}%</span>
                        </div>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Laba Bersih</p>
                        <h3 className="text-base font-black text-white tracking-tight">{loading ? '...' : formatCurrency(report?.netProfit || 0)}</h3>
                     </div>
                  </div>
               </motion.div>
            </div>

            {/* ── PENDAPATAN NETO BRIDGE ── */}
            {!loading && report && (report.totalDoctorShare || 0) > 0 && (
               <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-10 bg-amber-400 rounded-full" />
                     <div>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Pendapatan Neto Klinik</p>
                        <p className="text-[10px] font-bold text-amber-700/70">
                           {formatCurrency(report.totalRevenue)} &minus; {formatCurrency(report.totalDoctorShare)} (Bagian Dokter)
                        </p>
                     </div>
                  </div>
                  <div className="text-xl font-black text-amber-700 tracking-tight">
                     {formatCurrency(report.netClinicRevenue || 0)}
                  </div>
               </motion.div>
            )}
         </div>

         {/* ── DETAIL TABLES ── */}
         <div className="space-y-6 px-4 no-print">

            {/* 1. Pendapatan Bruto */}
            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center">
                  <div>
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">I. Pendapatan Bruto</h4>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Gross Revenue</p>
                  </div>
                  <span className="text-xs font-black text-emerald-600">{formatCurrency(report?.totalRevenue || 0)}</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                     <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[110px] sm:w-40">Saldo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                        [...Array(4)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={2} className="px-4 py-4"><div className="h-10 bg-slate-100 rounded-xl w-full" /></td></tr>)
                        ) : report?.revenue.length === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data</td></tr>
                        ) : (
                        report?.revenue.map((item) => (
                           <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-wider leading-none">{item.code}</span>
                                    <p className="text-[11px] sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase whitespace-normal break-words">{item.name}</p>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right pr-3 sm:pr-4">
                                 {formatCurrency(item.balance).replace('Rp', '').trim()}
                              </td>
                           </tr>
                        ))
                        )}
                     </tbody>
                  </table>
               </div>
            </section>

            {/* 2. Pengurang Pendapatan (Bagian Dokter) */}
            {(loading || (report?.doctorShareDeductions && report.doctorShareDeductions.length > 0)) && (
               <section className="bg-white rounded-3xl border border-amber-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-100 flex justify-between items-center">
                     <div>
                        <div className="flex items-center gap-2">
                           <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">
                              II. Pengurang Pendapatan
                           </h4>
                           <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-200">
                              Profit Sharing
                           </span>
                        </div>
                        <p className="text-[8px] font-bold text-amber-500/70 uppercase tracking-wider mt-1">Bagian Dokter · Bukan Beban Operasional</p>
                     </div>
                     <span className="text-xs font-black text-amber-600">({formatCurrency(report?.totalDoctorShare || 0).replace('Rp', '').trim()})</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                           <tr className="border-b border-amber-50 bg-amber-50/30">
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[110px] sm:w-40">Saldo</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-50">
                           {loading ? (
                           [...Array(2)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={2} className="px-4 py-4"><div className="h-10 bg-amber-50 rounded-xl w-full" /></td></tr>)
                           ) : (
                           report?.doctorShareDeductions?.map((item) => (
                              <tr key={item.code} className="hover:bg-amber-50/30 transition-colors">
                                 <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                       <span className="text-[7px] sm:text-[8px] font-black text-amber-500 uppercase tracking-wider leading-none">{item.code}</span>
                                       <p className="text-[11px] sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase whitespace-normal break-words">{item.name}</p>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-sm font-black text-amber-600 text-right pr-3 sm:pr-4">
                                    ({formatCurrency(item.balance).replace('Rp', '').trim()})
                                 </td>
                              </tr>
                           ))
                           )}
                        </tbody>
                     </table>
                  </div>
                  {/* Subtotal: Pendapatan Neto */}
                  {!loading && report && (
                     <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                           = Pendapatan Neto Klinik
                        </span>
                        <span className="text-sm font-black text-amber-700">
                           {formatCurrency(report.netClinicRevenue || 0).replace('Rp', 'Rp ')}
                        </span>
                     </div>
                  )}
               </section>
            )}

            {/* 3. Beban Operasional */}
            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">
                        {(report?.doctorShareDeductions?.length || 0) > 0 ? 'III.' : 'II.'} Biaya &amp; Beban Operasional
                     </h4>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Operational Expenses</p>
                  </div>
                  <span className="text-xs font-black text-rose-600">{formatCurrency(report?.totalExpense || 0)}</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                     <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[110px] sm:w-40">Saldo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                        [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={2} className="px-4 py-4"><div className="h-10 bg-slate-100 rounded-xl w-full" /></td></tr>)
                        ) : report?.expenses.length === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data</td></tr>
                        ) : (
                        report?.expenses.map((item) => (
                           <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-wider leading-none">{item.code}</span>
                                    <p className="text-[11px] sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase whitespace-normal break-words">{item.name}</p>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-black text-rose-600 text-right pr-3 sm:pr-4">
                                 {formatCurrency(item.balance).replace('Rp', '').trim()}
                              </td>
                           </tr>
                        ))
                        )}
                     </tbody>
                  </table>
               </div>
            </section>
         </div>

         {/* FINAL NET PROFIT BAR */}
         <div className="px-4 pb-10 no-print">
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
               className={`p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 ${report && report.netProfit >= 0 ? 'bg-emerald-600 shadow-xl shadow-emerald-100' : 'bg-rose-600 shadow-xl shadow-rose-100'} text-white transition-colors duration-1000`}
            >
               <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Operating Result</h4>
                  <h2 className="text-lg md:text-xl font-black tracking-tighter uppercase underline decoration-white/20 underline-offset-4">
                     {report && report.netProfit >= 0 ? 'Laba Bersih Operasional' : 'Rugi Bersih Operasional'}
                  </h2>
                  {report && (report.totalDoctorShare || 0) > 0 && (
                     <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
                        Setelah dikurangi Bagian Dokter {formatCurrency(report.totalDoctorShare)}
                     </p>
                  )}
               </div>
               <div className="flex flex-col items-center md:items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Accumulated Earnings</span>
                  <div className="text-2xl md:text-3xl font-black tracking-tightest flex items-center gap-2">
                     {report && report.netProfit < 0 && <FiMinus className="w-5 h-5 md:w-6 md:h-6" />}
                     {loading ? '...' : formatCurrency(Math.abs(report?.netProfit || 0))}
                  </div>
               </div>
            </motion.div>
         </div>

         {/* ═══ REPORT PREVIEW MODAL ═══ */}
         <AnimatePresence>
            {isPreviewOpen && (
               <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     onClick={() => setIsPreviewOpen(false)}
                     className="absolute inset-0 bg-slate-900/60 backdrop-blur-md no-print"
                  />
                  
                  <motion.div
                     initial={{ opacity: 0, y: 100 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 100 }}
                     className="relative w-full max-w-5xl bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] md:h-[95vh] overflow-hidden"
                  >
                     {/* Modal Header */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 md:px-10 md:py-6 border-b border-slate-100 bg-white no-print">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                              <FiFileText className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">P&amp;L Report Preview</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Laporan Laba Rugi · Model Sharing Profit</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                           <button
                              onClick={handlePrint}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                           >
                              <FiPrinter className="w-4 h-4" /> <span>Download PDF / Print</span>
                           </button>
                           <button
                              onClick={() => setIsPreviewOpen(false)}
                              className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900 transition-all hover:bg-slate-200"
                           >
                              <FiX className="w-5 h-5" />
                           </button>
                        </div>
                     </div>

                     {/* Scrollable Preview Area */}
                     <div className="flex-1 overflow-y-auto bg-slate-200/50 p-3 sm:p-4 md:p-6 lg:p-8 print:p-0 print:bg-white custom-scrollbar">
                        <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl sm:shadow-2xl print:shadow-none p-4 sm:p-8 md:p-12 lg:p-16 text-slate-800 font-sans print:p-8" style={{ boxSizing: 'border-box' }}>
                           
                           {/* Report Header */}
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-10 border-b-2 sm:border-b-4 border-slate-900 pb-4 sm:pb-8">
                              <div className="space-y-2 sm:space-y-4">
                                 <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Profit &amp; Loss</h1>
                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Laporan Laba Rugi · Model Sharing Profit</p>
                                 </div>
                                 <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-100 inline-block">
                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Periode Laporan</p>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                       {formatFullDateID(startDate)} - {formatFullDateID(endDate)}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-left sm:text-right space-y-1 sm:space-y-2">
                                 <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{activeClinic?.name || 'Klinik Yasfina Pusat'}</h2>
                                 <div className="space-y-0.5 sm:space-y-1">
                                    <p className="flex items-center sm:justify-end gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                       <FiMapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                       <span className="truncate">{activeClinic?.address || 'Jl. Contoh No. 123, Jakarta Selatan'}</span>
                                    </p>
                                    <p className="flex items-center sm:justify-end gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                       <FiPhone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                       <span className="truncate">{user?.email || 'contact@yasfinaclinic.com'}</span>
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* P&L CONTENT - 5 Level Professional */}
                           <div className="space-y-8">
                              
                              {/* I. Pendapatan Bruto */}
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center bg-slate-100 p-4 border-l-8 border-emerald-500">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">I. Pendapatan Bruto (Gross Revenue)</h4>
                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(report?.totalRevenue || 0)}</p>
                                 </div>
                                 <div className="overflow-x-auto">
                                    <table className="w-full border-collapse min-w-[400px]">
                                       <tbody className="divide-y divide-slate-100">
                                          {report?.revenue.map((item) => (
                                             <tr key={item.code}>
                                                <td className="px-4 py-2">
                                                   <div className="flex flex-col">
                                                      <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none">{item.code}</span>
                                                      <span className="text-[10px] font-black text-slate-700 uppercase leading-tight whitespace-normal break-words">{item.name}</span>
                                                   </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-[10px] font-bold text-emerald-700">{formatCurrency(item.balance).replace('Rp', '').trim()}</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>

                              {/* II. Pengurang Pendapatan (Bagian Dokter) */}
                              {(report?.doctorShareDeductions?.length || 0) > 0 && (
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-amber-50 p-4 border-l-8 border-amber-400">
                                       <div>
                                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">II. Pengurang Pendapatan</h4>
                                          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Bagian Dokter · Profit Sharing (Bukan Beban)</p>
                                       </div>
                                       <p className="text-sm font-black text-amber-600">({formatCurrency(report?.totalDoctorShare || 0).replace('Rp', '').trim()})</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                       <table className="w-full border-collapse min-w-[400px]">
                                          <tbody className="divide-y divide-amber-50">
                                             {report?.doctorShareDeductions?.map((item) => (
                                                <tr key={item.code}>
                                                   <td className="px-4 py-2">
                                                      <div className="flex flex-col">
                                                         <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest leading-none">{item.code}</span>
                                                         <span className="text-[10px] font-black text-slate-700 uppercase leading-tight">{item.name}</span>
                                                      </div>
                                                   </td>
                                                   <td className="px-4 py-2 text-right text-[10px] font-bold text-amber-700">({formatCurrency(item.balance).replace('Rp', '').trim()})</td>
                                                </tr>
                                             ))}
                                          </tbody>
                                       </table>
                                    </div>
                                    {/* Subtotal Line */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-amber-100/60 border border-amber-200 rounded-xl">
                                       <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">= Pendapatan Neto Klinik</span>
                                       <span className="text-sm font-black text-amber-800">{formatCurrency(report?.netClinicRevenue || 0)}</span>
                                    </div>
                                 </div>
                              )}

                              {/* III. Beban Operasional */}
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center bg-slate-100 p-4 border-l-8 border-rose-500">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                       {(report?.doctorShareDeductions?.length || 0) > 0 ? 'III.' : 'II.'} Biaya &amp; Beban Operasional
                                    </h4>
                                    <p className="text-sm font-black text-rose-600">({formatCurrency(report?.totalExpense || 0).replace('Rp', '').trim()})</p>
                                 </div>
                                 <div className="overflow-x-auto">
                                    <table className="w-full border-collapse min-w-[400px]">
                                       <tbody className="divide-y divide-slate-100">
                                          {report?.expenses.map((item) => (
                                             <tr key={item.code}>
                                                <td className="px-4 py-2">
                                                   <div className="flex flex-col">
                                                      <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none">{item.code}</span>
                                                      <span className="text-[10px] font-black text-slate-700 uppercase leading-tight whitespace-normal break-words">{item.name}</span>
                                                   </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-[10px] font-bold text-rose-700">({formatCurrency(item.balance).replace('Rp', '').trim()})</td>
                                             </tr>
                                          ))}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>

                              {/* IV. Laba Bersih Result */}
                              <div className="mt-8 pt-8 border-t-4 border-slate-900">
                                 <div className={`p-6 rounded-2xl flex justify-between items-center ${report && report.netProfit >= 0 ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-200' : 'bg-rose-50 text-rose-900 border-2 border-rose-200'}`}>
                                    <div>
                                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Hasil Operasional Bersih</p>
                                       <h4 className="text-xl font-black uppercase tracking-tighter">
                                          {report && report.netProfit >= 0 ? 'Laba (Net Profit)' : 'Rugi (Net Loss)'}
                                       </h4>
                                       {(report?.totalDoctorShare || 0) > 0 && (
                                          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">
                                             Setelah Bagian Dokter {formatCurrency(report?.totalDoctorShare || 0)}
                                          </p>
                                       )}
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Total Akumulasi (IDR)</p>
                                       <h3 className="text-3xl font-black tracking-tightest">
                                          {report && report.netProfit < 0 ? '-' : ''}
                                          {formatCurrency(Math.abs(report?.netProfit || 0))}
                                       </h3>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Signature Section */}
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-16 mt-12 sm:mt-20">
                              <div className="text-center space-y-12 sm:space-y-24">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Dibuat Oleh,</p>
                                 <div className="space-y-1 block">
                                    <div className="w-full border-t border-slate-900 mb-2"></div>
                                    <p className="text-xs font-black uppercase text-slate-900">{user?.name || 'Bagian Akuntansi'}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accounting Staff</p>
                                 </div>
                              </div>
                              <div className="hidden sm:block" />
                              <div className="text-center space-y-12 sm:space-y-24">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Disetujui Oleh,</p>
                                 <div className="space-y-1 block">
                                    <div className="w-full border-t border-slate-900 mb-2"></div>
                                    <p className="text-xs font-black uppercase text-slate-900">........................</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pimpinan / Direktur</p>
                                 </div>
                              </div>
                           </div>

                           {/* Footer Metadata */}
                           <div className="mt-32 pt-6 border-t border-slate-100 flex justify-between items-center italic">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">P&amp;L REPORT ID: {new Date().getTime()}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Halaman 1 dari 1</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dicetak: {new Date().toLocaleString('id-ID')}</p>
                           </div>

                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

      </div>
   )
}
