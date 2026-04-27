'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '@/lib/api'
import { 
  FiDatabase, FiSearch, FiCalendar, FiFilter, FiDownload, FiCheckCircle, 
  FiPlus, FiMinus, FiActivity, FiDollarSign, FiPrinter, FiX, FiFileText, FiMapPin, FiPhone 
} from 'react-icons/fi'
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
   const [isPreviewOpen, setIsPreviewOpen] = useState(false)
   const { activeClinicId } = useAuthStore()
   const [report, setReport] = useState<BSReport | null>(null)
   const [loading, setLoading] = useState(true)
   const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))
   const user = useAuthStore(state => state.user)
   const activeClinic = user?.clinics?.find(c => c.id === activeClinicId) || user?.clinics?.[0]


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

   const handlePrint = () => {
      window.print()
   }

   return (
      <div className="w-full px-2 sm:px-4 py-6 space-y-10 text-left print-container">
         
         {/* HEADER SECTION */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-1 md:px-4 no-print">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                     <FiDatabase className="w-5 h-5" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Neraca (Balance Sheet)</h1>
               </div>
               <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-wide mt-1">Posisi keuangan klinik: Aset vs Pasiva.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm w-full">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 flex-1">
                     <FiCalendar className="text-indigo-600 w-3.5 h-3.5" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per</span>
                     <input 
                        type="date" className="bg-transparent border-none focus:outline-none text-[10px] font-black text-slate-800 ml-1 w-full"
                        value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
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
                  <FiPrinter className="w-4 h-4" /> <span>Preview & Print PDF</span>
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 no-print">
            
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

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mx-1 sm:mx-2">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse table-fixed">
                         <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                               <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                                <th className="px-1.5 sm:px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[90px] sm:w-40">Saldo</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {loading ? (
                            [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={2} className="px-4 py-4"><div className="h-10 bg-slate-100 rounded-xl w-full" /></td></tr>)
                            ) : report?.assets.length === 0 ? (
                            <tr><td colSpan={2} className="px-6 py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Tidak ada data aset</td></tr>
                            ) : (
                            report?.assets.map((item) => (
                               <tr key={item.code} className="hover:bg-indigo-50/50 transition-colors">
                                  <td className="px-4 py-3">
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-wider leading-none">{item.code}</span>
                                        <p className="text-[11px] sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase whitespace-normal break-words">{item.name}</p>
                                     </div>
                                  </td>
                                   <td className="px-2 sm:px-4 py-3 text-[10px] sm:text-sm font-black text-slate-900 text-right tracking-tighter pr-3 sm:pr-4">
                                      {formatCurrency(item.balance).replace('Rp', '').trim()}
                                   </td>
                               </tr>
                            ))
                            )}
                         </tbody>
                      </table>
                   </div>
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
                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mx-1 sm:mx-2">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                               <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-4 py-2.5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                                  <th className="px-4 py-2.5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[110px] sm:w-40">Saldo</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {loading ? null : report?.liabilities.map((item) => (
                               <tr key={item.code} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-2.5">
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-[7px] font-black text-indigo-500 uppercase leading-none">{item.code}</span>
                                        <p className="text-[10px] sm:text-xs font-black text-slate-800 uppercase leading-tight whitespace-normal break-words">{item.name}</p>
                                     </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-[11px] sm:text-xs font-black text-slate-900 text-right">
                                     {formatCurrency(item.balance).replace('Rp', '').trim()}
                                  </td>
                               </tr>
                               ))}
                               {!loading && (
                               <tr className="bg-slate-50/50">
                                  <td className="px-4 py-3 text-[9px] font-black text-slate-900 uppercase tracking-widest">Subtotal Kewajiban</td>
                                  <td className="px-4 py-3 text-xs font-black text-slate-900 text-right pr-3 sm:pr-4">{formatCurrency(report?.totalLiabilities || 0).replace('Rp', '').trim()}</td>
                               </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
               </div>

               {/* Equity List */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3 px-6">
                     <div className="w-2 h-2 rounded-full bg-indigo-500" />
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Modal (Equity)</h4>
                  </div>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mx-1 sm:mx-2">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                               <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="px-4 py-2.5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Informasi Akun</th>
                                  <th className="px-4 py-2.5 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-[110px] sm:w-40">Saldo</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {loading ? null : report?.equity.map((item) => (
                               <tr key={item.code} className={`hover:bg-slate-50 transition-colors ${item.name.includes('Laba') ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-4 py-2.5">
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-[7px] font-black text-indigo-500 uppercase leading-none">{item.code}</span>
                                        <p className="text-[10px] sm:text-xs font-black text-slate-800 uppercase leading-tight">{item.name}</p>
                                     </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-[11px] sm:text-xs font-black text-slate-900 text-right">
                                     {formatCurrency(item.balance).replace('Rp', '').trim()}
                                  </td>
                               </tr>
                               ))}
                               {!loading && (
                               <tr className="bg-slate-50/50">
                                  <td className="px-4 py-3 text-[9px] font-black text-slate-900 uppercase tracking-widest">Subtotal Modal</td>
                                  <td className="px-4 py-3 text-xs font-black text-slate-900 text-right pr-3 sm:pr-4">{formatCurrency(report?.totalEquity || 0).replace('Rp', '').trim()}</td>
                               </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
               </div>
            </section>
         </div>

         {/* BALANCE CHECKER */}
          <div className="px-4 pb-10 no-print">
             <div className={`p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 ${report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'bg-emerald-600 shadow-xl shadow-emerald-100' : 'bg-rose-600 shadow-xl shadow-rose-100'} text-white transition-all duration-700`}>
                <div className="space-y-1 text-center md:text-left">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">Balance Validation</h4>
                   <h2 className="text-lg md:text-xl font-black tracking-tighter uppercase leading-none underline decoration-white/20 underline-offset-4">
                      {report && Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 1 ? 'Neraca Seimbang' : 'Neraca Tidak Seimbang'}
                   </h2>
                   <p className="text-[10px] md:text-[11px] font-bold text-white/70 mt-2 leading-none uppercase tracking-wide">
                      Selisih: {report ? formatCurrency(Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity)).replace('Rp', '').trim() : '0'}
                   </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-center md:text-right">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Total Aktiva</span>
                      <p className="text-base md:text-xl font-black">{report ? formatCurrency(report.totalAssets).replace('Rp', '').trim() : '...'}</p>
                   </div>
                   <div className="h-8 w-px bg-white/20" />
                   <div className="text-center md:text-right">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-0.5">Total Pasiva</span>
                      <p className="text-base md:text-xl font-black">{report ? formatCurrency(report.totalLiabilitiesAndEquity).replace('Rp', '').trim() : '...'}</p>
                   </div>
                </div>
             </div>
          </div>

         {/* REPORT PREVIEW MODAL */}
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
                               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Neraca Report Preview</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Financial Position Summary (Vector PDF)</p>
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
                                     <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Balance Sheet</h1>
                                     <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Laporan Neraca Keuangan</p>
                                  </div>
                                  <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-100 inline-block">
                                     <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Posisi Saldo Per</p>
                                     <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">{new Date(targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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

                           {/* BS CONTENT */}
                           <div className="space-y-10">
                              
                              {/* ASSETS SECTION */}
                              <div className="space-y-4">
                                 <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-lg shadow-md">
                                    <h4 className="text-xs font-black uppercase tracking-widest">AKTIVA (ASSETS)</h4>
                                    <p className="text-sm font-black">{formatCurrency(report?.totalAssets || 0)}</p>
                                 </div>
                                  <div className="overflow-x-auto">
                                     <table className="w-full border-collapse table-fixed">
                                        <thead>
                                           <tr className="border-b-2 border-slate-200">
                                              <th className="px-4 py-2 text-left text-[9px] font-black text-slate-400 uppercase">Informasi Akun</th>
                                              <th className="px-4 py-2 text-right text-[9px] font-black text-slate-400 uppercase w-32">Saldo</th>
                                           </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                           {report?.assets.map((item) => (
                                              <tr key={item.code}>
                                                 <td className="px-4 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none sm:hidden">{item.code}</span>
                                                        <span className="text-[10px] font-black text-slate-700 uppercase leading-tight">{item.name}</span>
                                                    </div>
                                                 </td>
                                                 <td className="px-4 py-1.5 text-right text-[10px] font-bold">{formatCurrency(item.balance).replace('Rp', '').trim()}</td>
                                              </tr>
                                           ))}
                                        </tbody>
                                     </table>
                                  </div>
                              </div>

                              {/* LIABILITIES SECTION */}
                              <div className="space-y-4">
                                 <div className="flex justify-between items-center bg-indigo-600 text-white p-3 rounded-lg shadow-md">
                                    <h4 className="text-xs font-black uppercase tracking-widest">KEWAJIBAN (LIABILITIES)</h4>
                                    <p className="text-sm font-black">{formatCurrency(report?.totalLiabilities || 0)}</p>
                                 </div>
                                 <table className="w-full border-collapse">
                                    <tbody>
                                       {report?.liabilities.map((item) => (
                                          <tr key={item.code} className="border-b border-slate-100">
                                             <td className="w-40 px-4 py-1.5 text-[10px] font-bold">{item.code}</td>
                                             <td className="px-4 py-1.5 text-xs font-black text-slate-700 uppercase">{item.name}</td>
                                             <td className="px-4 py-1.5 text-right text-[10px] font-bold">{formatCurrency(item.balance).replace('Rp', '').trim()}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>

                              {/* EQUITY SECTION */}
                              <div className="space-y-4">
                                 <div className="flex justify-between items-center bg-indigo-600 text-white p-3 rounded-lg shadow-md">
                                    <h4 className="text-xs font-black uppercase tracking-widest">MODAL (EQUITY)</h4>
                                    <p className="text-sm font-black">{formatCurrency(report?.totalEquity || 0)}</p>
                                 </div>
                                 <table className="w-full border-collapse">
                                    <tbody>
                                       {report?.equity.map((item) => (
                                          <tr key={item.code} className="border-b border-slate-100">
                                             <td className="w-40 px-4 py-1.5 text-[10px] font-bold">{item.code}</td>
                                             <td className="px-4 py-1.5 text-xs font-black text-slate-700 uppercase">{item.name}</td>
                                             <td className="px-4 py-1.5 text-right text-[10px] font-bold">{formatCurrency(item.balance).replace('Rp', '').trim()}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>

                              {/* FINAL SUMMARY Result */}
                              <div className="mt-12 pt-8 border-t-4 border-slate-900 border-double">
                                 <div className={`p-8 rounded-2xl flex justify-between items-center bg-slate-50 border-2 border-slate-200`}>
                                    <div>
                                       <h4 className="text-xl font-black uppercase tracking-tighter">TOTAL PASIVA</h4>
                                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-50">(Kewajiban + Modal)</p>
                                    </div>
                                    <div className="text-right">
                                       <h3 className="text-4xl font-black tracking-tightest">
                                          {formatCurrency(report?.totalLiabilitiesAndEquity || 0)}
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
                                     <p className="text-xs font-black uppercase text-slate-900">{user?.name || 'Accounting Dept'}</p>
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
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">AUDIT_BS_REF: {new Date().getTime()}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Document Integrity Guaranteed</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Printed: {new Date().toLocaleString('id-ID')}</p>
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
