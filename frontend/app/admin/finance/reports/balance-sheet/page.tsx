'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiDatabase, FiSearch, FiCalendar, FiFilter, FiDownload, FiCheckCircle, FiPlus, FiMinus, FiActivity, FiDollarSign } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/accounting'

interface BSAccount {
  code: string
  name: string
  category: string
  balance: number
}

interface BSReport {
  date: string
  assets: BSAccount[]
  totalAssets: number
  liabilities: BSAccount[]
  totalLiabilities: number
  equity: BSAccount[]
  totalEquity: number
  totalLiabilitiesAndEquity: number
}

export default function BalanceSheetPage() {
  const { activeClinicId } = useAuthStore()
  const [report, setReport] = useState<BSReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))


  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    setLoading(true)
    try {
      const { data } = await api.get('/accounting/balance-sheet', { 
        params: { date: targetDate } 
      })
      setReport(data)
    } catch (e) {
      console.error('Failed to fetch balance sheet', e)
      toast.error('Gagal mengambil data Neraca')
    } finally {
      setLoading(false)
    }
  }, [targetDate, activeClinicId])

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

  return (
    <div className="w-full px-[10px] py-6 space-y-10 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
         <div className="space-y-1">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                   <FiDatabase className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Neraca (Balance Sheet)</h1>
             </div>
             <p className="text-slate-400 font-bold text-[11px] ml-12 uppercase tracking-wide">Posisi keuangan klinik: Perbandingan Aset vs Liabilitas & Ekuitas.</p>
         </div>

         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                     <FiCalendar className="text-indigo-600 w-3.5 h-3.5" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Per</span>
                     <input 
                        type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 ml-1 w-24"
                        value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          
          {/* ASSETS COLUMN */}
          <section className="space-y-4">
             <div className="bg-slate-900 text-white px-6 py-5 rounded-2xl shadow-xl flex justify-between items-center group relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                   <FiActivity className="w-12 h-12" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-white/50">Total Aktiva</h4>
                   <h2 className="text-lg font-black tracking-tighter">ASSETS</h2>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-xl font-black">{loading ? '...' : formatCurrency(report?.totalAssets || 0)}</p>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Kode Akun</th>
                         <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                         <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-6 py-3"><div className="h-6 bg-slate-100 rounded-lg w-full" /></td></tr>)
                      ) : report?.assets.length === 0 ? (
                        <tr><td colSpan={3} className="px-6 py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data aset</td></tr>
                      ) : (
                        report?.assets.map((item) => (
                          <tr key={item.code} className="hover:bg-indigo-50/50 transition-colors">
                             <td className="px-6 py-3 text-[10px] font-black text-slate-400 tracking-widest">{item.code}</td>
                             <td className="px-6 py-3 text-xs font-black text-slate-800 tracking-tight leading-none uppercase">{item.name}</td>
                             <td className="px-6 py-3 text-xs font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </section>

          {/* LIABILITIES & EQUITY COLUMN */}
          <section className="space-y-4">
             <div className="bg-indigo-600 text-white px-6 py-5 rounded-2xl shadow-xl flex justify-between items-center group relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <FiDollarSign className="w-12 h-12" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-[9px] font-black uppercase tracking-widest mb-0.5 text-white/50">Total Pasiva</h4>
                   <h2 className="text-lg font-black tracking-tighter leading-none">PASIVA</h2>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-xl font-black">{loading ? '...' : formatCurrency(report?.totalLiabilitiesAndEquity || 0)}</p>
                </div>
             </div>

             {/* Liabilities List */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                   <div className="w-2 h-2 rounded-full bg-rose-500" />
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Kewajiban (Liabilities)</h4>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <table className="w-full">
                      <thead>
                         <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-left w-40">Kode Akun</th>
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {loading ? null : report?.liabilities.map((item) => (
                           <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-2 text-[10px] font-black text-slate-400 tracking-widest w-40 whitespace-nowrap uppercase">{item.code}</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-800 tracking-tight uppercase leading-none">{item.name}</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                           </tr>
                         ))}
                         {!loading && (
                           <tr className="bg-slate-50/50">
                              <td colSpan={2} className="px-5 py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest">Subtotal Kewajiban</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-900 text-right">{formatCurrency(report?.totalLiabilities || 0)}</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Equity List */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-6">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Modal (Equity)</h4>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <table className="w-full">
                      <thead>
                         <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-left w-40">Kode Akun</th>
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                            <th className="px-5 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {loading ? null : report?.equity.map((item) => (
                           <tr key={item.code} className={`hover:bg-slate-50 transition-colors ${item.name.includes('Laba') ? 'bg-indigo-50/30' : ''}`}>
                              <td className="px-5 py-2 text-[10px] font-black text-slate-400 tracking-widest w-40 whitespace-nowrap uppercase">{item.code}</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-800 tracking-tight uppercase leading-none">{item.name}</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                           </tr>
                         ))}
                         {!loading && (
                           <tr className="bg-slate-50/50">
                              <td colSpan={2} className="px-5 py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest">Subtotal Modal</td>
                              <td className="px-5 py-2 text-xs font-black text-slate-900 text-right">{formatCurrency(report?.totalEquity || 0)}</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </section>
      </div>

      {/* BALANCE CHECKER */}
      <div className="px-4 pb-10">
         <div className={`p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 ${report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'bg-emerald-600 shadow-xl shadow-emerald-100' : 'bg-rose-600 shadow-xl shadow-rose-100'} text-white transition-all duration-700`}>
            <div className="space-y-1 text-center md:text-left">
               <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">Balance Validation</h4>
               <h2 className="text-xl font-black tracking-tighter uppercase leading-none underline decoration-white/20 underline-offset-4">
                  {report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'Neraca Seimbang' : 'Neraca Tidak Seimbang'}
               </h2>
               <p className="text-[11px] font-bold text-white/70 mt-2 leading-none uppercase tracking-wide">
                  Selisih: {report ? formatCurrency(Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity)) : '0'}
               </p>
            </div>
            <div className="flex items-center gap-8">
               <div className="text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Total Aktiva</span>
                  <p className="text-xl font-black">{report ? formatCurrency(report.totalAssets) : '...'}</p>
               </div>
               <div className="h-8 w-px bg-white/20" />
               <div className="text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Total Pasiva</span>
                  <p className="text-xl font-black">{report ? formatCurrency(report.totalLiabilitiesAndEquity) : '...'}</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
