'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
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
  const { token, activeClinicId } = useAuthStore()
  const [report, setReport] = useState<BSReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))

  const headers = useMemo(() => ({ 
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }), [token, activeClinicId])

  const fetchData = useCallback(async () => {
    if (!token || !activeClinicId) return
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/balance-sheet`, { 
        headers, 
        params: { date: targetDate } 
      })
      setReport(data)
    } catch (e) {
      console.error('Failed to fetch balance sheet', e)
      toast.error('Gagal mengambil data Neraca')
    } finally {
      setLoading(false)
    }
  }, [headers, targetDate, token, activeClinicId])

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
        <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <FiDatabase className="w-6 h-6" />
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Neraca (Balance Sheet)</h1>
            </div>
            <p className="text-slate-400 font-medium text-sm ml-14">Posisi keuangan klinik: Perbandingan Aset vs Liabilitas & Ekuitas.</p>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-full shadow-sm">
                <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-full border border-slate-100">
                    <FiCalendar className="text-indigo-600 w-4 h-4" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Per</span>
                    <input 
                       type="date" className="bg-transparent border-none focus:outline-none text-[11px] font-black text-slate-800 ml-2"
                       value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                    />
                </div>
                <button 
                   onClick={fetchData}
                   className="bg-indigo-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                   Update
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          
          {/* ASSETS COLUMN */}
          <section className="space-y-6">
             <div className="bg-slate-900 text-white px-10 py-8 rounded-[3rem] shadow-xl flex justify-between items-center group relative overflow-hidden">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                   <FiActivity className="w-20 h-20" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 text-white/50">Total Aktiva</h4>
                   <h2 className="text-3xl font-black tracking-tightest">ASSETS</h2>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-2xl font-black">{loading ? '...' : formatCurrency(report?.totalAssets || 0)}</p>
                </div>
             </div>

             <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Kode Akun</th>
                         <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                         <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="px-8 py-5"><div className="h-8 bg-slate-100 rounded-xl" /></td></tr>)
                      ) : report?.assets.length === 0 ? (
                        <tr><td colSpan={3} className="px-8 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data aset</td></tr>
                      ) : (
                        report?.assets.map((item) => (
                          <tr key={item.code} className="hover:bg-indigo-50/50 transition-colors">
                             <td className="px-8 py-5 text-[11px] font-black text-slate-400 tracking-widest">{item.code}</td>
                             <td className="px-8 py-5 text-sm font-black text-slate-800 tracking-tight">{item.name}</td>
                             <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
             </div>
          </section>

          {/* LIABILITIES & EQUITY COLUMN */}
          <section className="space-y-8">
             <div className="bg-indigo-600 text-white px-10 py-8 rounded-[3rem] shadow-xl flex justify-between items-center group relative overflow-hidden">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                   <FiDollarSign className="w-20 h-20" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 text-white/50">Total Pasiva</h4>
                   <h2 className="text-3xl font-black tracking-tightest leading-none">LIABILITIES & EQUITY</h2>
                </div>
                <div className="text-right relative z-10">
                   <p className="text-2xl font-black">{loading ? '...' : formatCurrency(report?.totalLiabilitiesAndEquity || 0)}</p>
                </div>
             </div>

             {/* Liabilities List */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-8">
                   <div className="w-2 h-2 rounded-full bg-rose-500" />
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kewajiban (Liabilities)</h4>
                </div>
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                   <table className="w-full">
                      <tbody className="divide-y divide-slate-50">
                         {loading ? null : report?.liabilities.map((item) => (
                           <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-widest w-24">{item.code}</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-800 tracking-tight">{item.name}</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                           </tr>
                         ))}
                         {!loading && (
                           <tr className="bg-slate-50">
                              <td colSpan={2} className="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Subtotal Kewajiban</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(report?.totalLiabilities || 0)}</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Equity List */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-8">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Modal (Equity)</h4>
                </div>
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                   <table className="w-full">
                      <tbody className="divide-y divide-slate-50">
                         {loading ? null : report?.equity.map((item) => (
                           <tr key={item.code} className={`hover:bg-slate-50 transition-colors ${item.name.includes('Laba') ? 'bg-indigo-50/30' : ''}`}>
                              <td className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-widest w-24">{item.code}</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-800 tracking-tight">{item.name}</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(item.balance)}</td>
                           </tr>
                         ))}
                         {!loading && (
                           <tr className="bg-slate-50">
                              <td colSpan={2} className="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Subtotal Modal</td>
                              <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">{formatCurrency(report?.totalEquity || 0)}</td>
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
         <div className={`p-10 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-8 ${report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'bg-emerald-600' : 'bg-rose-600'} text-white shadow-2xl transition-all duration-700`}>
            <div className="space-y-1 text-center md:text-left">
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 leading-none mb-3">Balance Validation</h4>
               <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'Neraca Seimbang (Balanced)' : 'Neraca Tidak Seimbang'}
               </h2>
               <p className="text-sm font-medium text-white/70 mt-4 leading-relaxed">
                  Selisih: {report ? formatCurrency(Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity)) : '0'}
               </p>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Total Aktiva</span>
                  <p className="text-3xl font-black">{report ? formatCurrency(report.totalAssets) : '...'}</p>
               </div>
               <div className="h-10 w-px bg-white/20" />
               <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Total Pasiva</span>
                  <p className="text-3xl font-black">{report ? formatCurrency(report.totalLiabilitiesAndEquity) : '...'}</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
