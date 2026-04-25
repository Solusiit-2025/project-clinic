'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiTrendingUp, FiPieChart, FiCalendar, FiArrowDown, FiArrowUp, FiMinus, FiActivity, FiDollarSign } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
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
  revenue: PLItem[]
  totalRevenue: number
  expenses: PLItem[]
  totalExpense: number
  netProfit: number
}

export default function ProfitLossPage() {
  const { activeClinicId } = useAuthStore()
  const [report, setReport] = useState<PLReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10))


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

  return (
    <div className="w-full px-[10px] py-6 space-y-10 text-left">
      
      {/* HEADER & SUMMARY */}
      <div className="px-4 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                      <FiTrendingUp className="w-5 h-5" />
                   </div>
                   <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Profit & Loss</h1>
                </div>
                <p className="text-slate-400 font-bold text-[11px] ml-12 uppercase tracking-wide">Laporan Laba Rugi periodik untuk memantau kesehatan finansial klinik.</p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100/50">
                    <FiCalendar className="text-indigo-600 w-3.5 h-3.5" />
                    <input 
                       type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 w-24"
                       value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    />
                    <FiMinus className="text-slate-300 w-3 h-3" />
                    <input 
                       type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 w-24"
                       value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button 
                   onClick={fetchData}
                   className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                   Update
                </button>
            </div>
        </div>

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
               className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 text-emerald-100 group-hover:text-emerald-50 transition-colors">
                  <FiArrowUp className="w-12 h-12" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                     <FiDollarSign className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendapatan</p>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalRevenue || 0)}</h3>
                  </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 text-rose-100 group-hover:text-rose-50 transition-colors">
                  <FiArrowDown className="w-12 h-12" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                     <FiPieChart className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Biaya & Beban</p>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalExpense || 0)}</h3>
                  </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="bg-slate-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
               <div className="absolute -right-2 -bottom-2 p-4 text-white/5 group-hover:text-white/10 transition-colors rotate-12">
                  <FiActivity className="w-24 h-24" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
                        <FiActivity className="w-5 h-5" />
                     </div>
                     <div className="px-2 py-0.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{profitMargin.toFixed(1)}%</span>
                     </div>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Laba Bersih (Net Profit)</p>
                     <h3 className="text-xl font-black text-white tracking-tight">{loading ? '...' : formatCurrency(report?.netProfit || 0)}</h3>
                  </div>
               </div>
            </motion.div>
        </div>
      </div>

      {/* DETAILED LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          
          {/* Revenue Details */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-black">Pendapatan</h4>
                <span className="text-xs font-black text-emerald-600">{formatCurrency(report?.totalRevenue || 0)}</span>
             </div>
             <div className="p-4">
                <table className="w-full">
                   <thead>
                      <tr className="border-b border-slate-50">
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Kode Akun</th>
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        [...Array(4)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl" /></td></tr>)
                      ) : report?.revenue.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data</td></tr>
                      ) : (
                        report?.revenue.map((item) => (
                          <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-5 text-[11px] font-black text-slate-400 tracking-widest">{item.code}</td>
                             <td className="px-6 py-5 text-sm font-black text-slate-800 tracking-tight">{item.name}</td>
                             <td className="px-6 py-5 text-sm font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </section>

          {/* Expense Details */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-black">Biaya & Beban</h4>
                <span className="text-xs font-black text-rose-600">{formatCurrency(report?.totalExpense || 0)}</span>
             </div>
             <div className="p-4">
                <table className="w-full">
                   <thead>
                      <tr className="border-b border-slate-50">
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Kode Akun</th>
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                         <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl" /></td></tr>)
                      ) : report?.expenses.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data</td></tr>
                      ) : (
                        report?.expenses.map((item) => (
                          <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-5 text-[11px] font-black text-slate-400 tracking-widest">{item.code}</td>
                             <td className="px-6 py-5 text-sm font-black text-slate-800 tracking-tight">{item.name}</td>
                             <td className="px-6 py-5 text-sm font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </section>
      </div>

      {/* FINAL NET PROFIT BAR */}
      <div className="px-4 pb-10">
         <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 ${report && report.netProfit >= 0 ? 'bg-emerald-600 shadow-xl shadow-emerald-100' : 'bg-rose-600 shadow-xl shadow-rose-100'} text-white transition-colors duration-1000`}
         >
            <div className="space-y-1 text-center md:text-left">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Operating Result</h4>
               <h2 className="text-xl font-black tracking-tighter uppercase underline decoration-white/20 underline-offset-4">
                  {report && report.netProfit >= 0 ? 'Laba Bersih Operasional' : 'Rugi Bersih Operasional'}
               </h2>
            </div>
            <div className="flex flex-col items-center md:items-end">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Accumulated Earnings</span>
               <div className="text-3xl font-black tracking-tightest flex items-center gap-2">
                  {report && report.netProfit < 0 && <FiMinus className="w-6 h-6" />}
                  {loading ? '...' : formatCurrency(Math.abs(report?.netProfit || 0))}
               </div>
            </div>
         </motion.div>
      </div>

    </div>
  )
}
