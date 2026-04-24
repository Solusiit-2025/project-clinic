'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
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
  const { token, activeClinicId } = useAuthStore()
  const [report, setReport] = useState<PLReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10))

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }), [token, activeClinicId])

  const fetchData = useCallback(async () => {
    if (!token || !activeClinicId) return
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/profit-loss`, { 
        headers, 
        params: { startDate, endDate } 
      })
      setReport(data)
    } catch (e) {
      console.error('Failed to fetch P&L', e)
      toast.error('Gagal mengambil data Laba Rugi')
    } finally {
      setLoading(false)
    }
  }, [headers, startDate, endDate, token, activeClinicId])

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                      <FiTrendingUp className="w-6 h-6" />
                   </div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Profit & Loss</h1>
                </div>
                <p className="text-slate-400 font-medium text-sm ml-14">Laporan Laba Rugi periodik untuk memantau kesehatan finansial klinik.</p>
            </div>

            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-full border border-slate-100">
                    <FiCalendar className="text-indigo-600 w-4 h-4" />
                    <input 
                       type="date" className="bg-transparent border-none focus:outline-none text-[11px] font-black text-slate-800"
                       value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    />
                    <FiMinus className="text-slate-300" />
                    <input 
                       type="date" className="bg-transparent border-none focus:outline-none text-[11px] font-black text-slate-800"
                       value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button 
                   onClick={fetchData}
                   className="bg-indigo-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                   Update
                </button>
            </div>
        </div>

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 text-emerald-100 group-hover:text-emerald-50 transition-colors">
                  <FiArrowUp className="w-20 h-20" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                     <FiDollarSign className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Pendapatan</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalRevenue || 0)}</h3>
                  </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 text-rose-100 group-hover:text-rose-50 transition-colors">
                  <FiArrowDown className="w-20 h-20" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                     <FiPieChart className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Biaya & Beban</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '...' : formatCurrency(report?.totalExpense || 0)}</h3>
                  </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 p-8 text-white/5 group-hover:text-white/10 transition-colors rotate-12">
                  <FiActivity className="w-40 h-40" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                        <FiActivity className="w-7 h-7" />
                     </div>
                     <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{profitMargin.toFixed(1)}% Margin</span>
                     </div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Laba Bersih (Net Profit)</p>
                     <h3 className="text-3xl font-black text-white tracking-tight">{loading ? '...' : formatCurrency(report?.netProfit || 0)}</h3>
                  </div>
               </div>
            </motion.div>
        </div>
      </div>

      {/* DETAILED LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          
          {/* Revenue Details */}
          <section className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Rincian Pendapatan</h4>
                <span className="text-sm font-black text-emerald-600">{formatCurrency(report?.totalRevenue || 0)}</span>
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
          <section className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Rincian Biaya & Beban</h4>
                <span className="text-sm font-black text-rose-600">{formatCurrency(report?.totalExpense || 0)}</span>
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
            className={`p-10 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-8 ${report && report.netProfit >= 0 ? 'bg-emerald-600 shadow-2xl shadow-emerald-200' : 'bg-rose-600 shadow-2xl shadow-rose-200'} text-white transition-colors duration-1000`}
         >
            <div className="space-y-1 text-center md:text-left">
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60 leading-none mb-3">Operating Conclusion</h4>
               <h2 className="text-4xl font-black tracking-tighter">
                  {report && report.netProfit >= 0 ? 'LABA BERSIH OPERASIONAL' : 'RUGI BERSIH OPERASIONAL'}
               </h2>
               <p className="text-sm font-medium text-white/70">Hasil akumulasi seluruh pendapatan dikurangi beban pada periode yang dipilih.</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
               <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Net Earnings</span>
               <div className="text-5xl font-black tracking-tightest flex items-center gap-4">
                  {report && report.netProfit < 0 && <FiMinus className="w-8 h-8" />}
                  {loading ? '...' : formatCurrency(Math.abs(report?.netProfit || 0))}
               </div>
            </div>
         </motion.div>
      </div>

    </div>
  )
}
