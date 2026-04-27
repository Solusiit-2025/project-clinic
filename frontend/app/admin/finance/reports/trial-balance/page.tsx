'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '@/lib/api'
import { 
  FiActivity, FiSearch, FiCalendar, FiFilter, FiDownload, FiCheckCircle, 
  FiAlertCircle, FiArrowRight, FiLayers, FiPrinter, FiX, FiFileText, FiMapPin, FiPhone 
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/accounting'

interface TrialBalanceItem {
   id: string
   code: string
   name: string
   category: string
   debit: number
   credit: number
}

export default function TrialBalancePage() {
   const [isPreviewOpen, setIsPreviewOpen] = useState(false)
   const { activeClinicId } = useAuthStore()
   const [data, setData] = useState<TrialBalanceItem[]>([])
   const [loading, setLoading] = useState(true)
   const [search, setSearch] = useState('')
   const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))
   const user = useAuthStore(state => state.user)
   const activeClinic = user?.clinics?.find(c => c.id === activeClinicId) || user?.clinics?.[0]


   const fetchData = useCallback(async () => {
      if (!activeClinicId) return
      setLoading(true)
      try {
         const { data: resData } = await api.get('/accounting/trial-balance', {
            params: { date: targetDate }
         })
         setData(resData)
      } catch (e) {
         console.error('Failed to fetch trial balance', e)
         toast.error('Gagal mengambil data Trial Balance')
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

   const filteredData = useMemo(() => {
      return data.filter(item =>
         item.name.toLowerCase().includes(search.toLowerCase()) ||
         item.code.includes(search)
      )
   }, [data, search])

   const totals = useMemo(() => {
      return filteredData.reduce((sum, item) => ({
         debit: sum.debit + item.debit,
         credit: sum.credit + item.credit
      }), { debit: 0, credit: 0 })
   }, [filteredData])

   const isBalanced = Math.abs(totals.debit - totals.credit) < 1

   const handlePrint = () => {
      window.print()
   }

   return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8 text-left print-container ledger-scroll-container ledger-safe-bottom ledger-transition"
           style={{ 
             WebkitTapHighlightColor: 'transparent',
             WebkitTouchCallout: 'none',
             WebkitUserSelect: 'none',
             KhtmlUserSelect: 'none',
             MozUserSelect: 'none',
             msUserSelect: 'none',
             userSelect: 'none'
           }}>

         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1 md:px-2 no-print">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                     <FiActivity className="w-5 h-5" />
                  </div>
                  <div>
                     <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Trial Balance</h1>
                     <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-wide mt-0.5">Neraca Saldo Real-time Keuangan.</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
               <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 px-4 py-2 bg-slate-50 md:bg-transparent rounded-xl border border-slate-100 md:border-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                  {isBalanced ? (
                     <div className="flex items-center gap-1.5 text-emerald-600">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-black uppercase tracking-tight">Balanced</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-1.5 text-rose-600">
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-tight">
                           Unbalanced
                        </span>
                     </div>
                  )}
               </div>
               <button 
                  onClick={() => setIsPreviewOpen(true)}
                  className="bg-slate-900 text-white flex items-center justify-center gap-2 px-6 py-3.5 md:px-5 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 no-print"
               >
                  <FiPrinter className="w-4 h-4" /> 
                  <span>Preview & Print PDF</span>
               </button>
            </div>
         </div>

         {/* FILTER BAR */}
         <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm mx-1 md:mx-2 no-print">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
               <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Cari Akun</label>
                  <div className="relative">
                     <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                     <input
                        type="text" placeholder="Kode atau Nama Akun..."
                        className="w-full pl-10 pr-6 py-3.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                     />
                  </div>
               </div>

               <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Per Tanggal</label>
                  <div className="flex items-center gap-3 px-4 py-3.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl">
                     <FiCalendar className="text-indigo-600 w-3.5 h-3.5 flex-shrink-0" />
                     <input
                        type="date" className="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-800 w-full"
                        value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                     />
                  </div>
               </div>

               <div className="md:col-span-2">
                  <button
                     onClick={fetchData}
                     className="w-full h-[48px] bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                     Tampilkan
                  </button>
               </div>
            </div>
         </div>

         {/* MAIN TABLE */}
         <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden mx-2 sm:mx-4 no-print">
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse general-ledger-table table-fixed">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Akun</th>
                        <th className="px-1 sm:px-4 py-3 sm:py-4 text-right text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest w-[85px] sm:w-40 md:w-48">Debet</th>
                        <th className="px-1 sm:px-4 py-3 sm:py-4 text-right text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest w-[85px] sm:w-40 md:w-48 pr-3 sm:pr-4">Kredit</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {loading ? (
                        [...Array(6)].map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
                                 <div className="h-4 w-32 sm:w-40 bg-slate-100 rounded mb-2"></div>
                                 <div className="h-3 w-24 sm:w-28 bg-slate-100 rounded"></div>
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 text-right">
                                 <div className="h-5 w-16 sm:w-24 bg-slate-100 rounded ml-auto"></div>
                              </td>
                              <td className="px-2 sm:px-4 py-3 sm:py-4 text-right">
                                 <div className="h-5 w-16 sm:w-24 bg-slate-100 rounded ml-auto"></div>
                              </td>
                           </tr>
                        ))
                     ) : filteredData.length > 0 ? (
                        filteredData.map((row) => (
                           <tr
                              key={row.id}
                              className="hover:bg-indigo-50/30 transition-all group ledger-item-touch"
                           >
                              <td className="px-4 sm:px-6 md:px-8 py-3 md:py-4">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-wider leading-none">
                                       {row.code}
                                    </span>
                                    <p className="text-[10px] sm:text-sm font-black text-slate-800 tracking-tight leading-tight uppercase whitespace-normal break-words">
                                       {row.name}
                                    </p>
                                    <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                                       {row.category}
                                    </p>
                                 </div>
                              </td>
                              <td className="px-1 sm:px-4 py-3 md:py-4 text-right">
                                 <span className={`text-[9px] sm:text-sm font-black tracking-tighter ${row.debit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                                    {row.debit > 0 ? formatCurrency(row.debit).replace('Rp', '').trim() : '-'}
                                 </span>
                              </td>
                              <td className="px-1 sm:px-4 py-3 md:py-4 text-right pr-3 sm:pr-4">
                                 <span className={`text-[9px] sm:text-sm font-black tracking-tighter ${row.credit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                                    {row.credit > 0 ? formatCurrency(row.credit).replace('Rp', '').trim() : '-'}
                                 </span>
                              </td>
                           </tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={3} className="px-6 sm:px-8 md:px-12 py-16 sm:py-24 md:py-32 text-center">
                              <div className="flex flex-col items-center gap-3 sm:gap-4 opacity-30 ledger-empty">
                                 <FiLayers className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" />
                                 <p className="font-black text-slate-400 uppercase tracking-widest text-sm sm:text-base">Tidak ada data akun tersedia</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
                   {/* TOTALS FOOTER */}
                    <tfoot className="bg-slate-900 text-white">
                       <tr>
                          <td className="px-4 sm:px-6 md:px-8 py-5">
                             <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <h4 className="text-xs sm:text-lg font-black uppercase tracking-widest">Grand Total</h4>
                                <div className="h-0.5 w-6 bg-white/20 rounded-full sm:hidden" />
                             </div>
                          </td>
                          <td className="px-1 sm:px-4 py-5 text-right">
                             <p className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">Debit</p>
                             <p className="text-[10px] sm:text-xl font-bold tracking-tighter">{formatCurrency(totals.debit).replace('Rp', '').trim()}</p>
                          </td>
                          <td className="px-1 sm:px-4 py-5 text-right pr-3 sm:pr-4">
                             <p className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">Kredit</p>
                             <p className="text-[10px] sm:text-xl font-bold tracking-tighter">{formatCurrency(totals.credit).replace('Rp', '').trim()}</p>
                          </td>
                       </tr>
                    </tfoot>
               </table>
            </div>
         </div>

         {/* INFO SECTION */}
         <div className="px-4 sm:px-6 md:px-8 no-print">
            <div className="p-4 sm:p-6 md:p-8 bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] flex flex-col sm:flex-row items-start gap-4 sm:gap-5 md:gap-6">
               <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-amber-100 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                  <FiAlertCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" />
               </div>
               <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="text-xs sm:text-sm font-black text-amber-800 uppercase tracking-tight">Penting untuk Diperhatikan</h4>
                  <p className="text-[11px] sm:text-xs text-amber-900/60 font-medium leading-relaxed">
                     Laporan Neraca Saldo ini bersifat real-time. Jika total Debet dan Kredit tidak seimbang, silakan periksa daftar Jurnal Penyesuaian atau transaksi yang belum terposting dengan benar. Pastikan setiap akun memiliki kategori normal balance yang sesuai.
                  </p>
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
                     className="relative w-full max-w-4xl lg:max-w-5xl bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] md:h-[95vh] overflow-hidden no-print"
                  >
                     {/* Modal Header */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 md:px-10 md:py-6 border-b border-slate-100 bg-white no-print">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                              <FiFileText className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Report Preview</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Neraca Saldo Siap Cetak</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                           <button
                              onClick={handlePrint}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                           >
                              <FiPrinter className="w-4 h-4" /> 
                              <span>Download / Print</span>
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
                     <div className="flex-1 overflow-y-auto bg-slate-200/50 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 print:p-0 print:bg-white custom-scrollbar">
                        {/* THE ACTUAL DOCUMENT PAGE (A4 Portrait Style) */}
                        <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl sm:shadow-2xl print:shadow-none p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 text-slate-800 font-sans print:p-8" style={{ boxSizing: 'border-box' }}>
                           
                           {/* Report Header */}
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10 border-b-2 sm:border-b-3 md:border-b-4 border-slate-900 pb-4 sm:pb-6 md:pb-8">
                              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                 <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Trial Balance</h1>
                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Neraca Saldo Real-time</p>
                                 </div>
                                 <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-100 inline-block">
                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Periode Laporan</p>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">Per {new Date(targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <div className="text-left sm:text-right space-y-1 sm:space-y-2">
                                 <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{activeClinic?.name || 'Klinik Yasfina Pusat'}</h2>
                                 <div className="space-y-0.5 sm:space-y-1">
                                    <p className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                       <FiMapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                       <span className="truncate">{activeClinic?.address || 'Jl. Contoh No. 123, Jakarta Selatan'}</span>
                                    </p>
                                    <p className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                       <FiPhone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                       <span className="truncate">{user?.email || 'contact@yasfinaclinic.com'}</span>
                                    </p>
                                 </div>
                                 <div className="pt-1 sm:pt-2">
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-900 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded sm:rounded-lg">Professional Healthcare</span>
                                 </div>
                              </div>
                           </div>

                           {/* Main Content Table (Simplified for professional report) */}
                           <div className="mb-8 sm:mb-10 md:mb-12">
                              <div className="overflow-x-auto">
                                 <table className="w-full border-collapse table-fixed">
                                    <thead>
                                       <tr className="bg-slate-100">
                                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-[9px] sm:text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200">INFORMASI AKUN</th>
                                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-right text-[9px] sm:text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200">DEBET (DR)</th>
                                          <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-right text-[9px] sm:text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200">KREDIT (CR)</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {filteredData.map((row) => (
                                          <tr key={row.id} className="border-b border-slate-100">
                                             <td className="px-2 sm:px-3 md:px-4 py-2 border-x border-slate-100">
                                                <div className="flex flex-col">
                                                   <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">{row.code}</span>
                                                   <span className="text-[10px] font-black text-slate-900 uppercase leading-tight whitespace-normal break-words">{row.name}</span>
                                                </div>
                                             </td>
                                             <td className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[9px] font-bold border-x border-slate-100">
                                                {row.debit > 0 ? formatCurrency(row.debit).replace('Rp', '').trim() : '-'}
                                             </td>
                                             <td className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[10px] sm:text-[11px] font-bold border-x border-slate-100">
                                                {row.credit > 0 ? formatCurrency(row.credit).replace('Rp', '').trim() : '-'}
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50">
                                       <tr className="border-t border-slate-900">
                                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs font-black text-slate-900 uppercase tracking-widest text-center border border-slate-200">TOTAL SELURUHNYA (IDR)</td>
                                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-right text-sm font-black text-slate-900 border border-slate-200">{formatCurrency(totals.debit).replace('Rp', '').trim()}</td>
                                          <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-right text-sm font-black text-slate-900 border border-slate-200">{formatCurrency(totals.credit).replace('Rp', '').trim()}</td>
                                       </tr>
                                    </tfoot>
                                 </table>
                              </div>
                              {/* Currency Note */}
                              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase mt-3 sm:mt-4">* Seluruh nilai dalam satuan mata uang Rupiah (IDR)</p>
                           </div>

                           {/* Signature Section */}
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mt-12 sm:mt-16 md:mt-20">
                              <div className="text-center space-y-12 sm:space-y-16 md:space-y-24">
                                 <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900">Dibuat Oleh,</p>
                                 <div className="space-y-1">
                                    <div className="w-full border-t border-slate-900 mb-1 sm:mb-2"></div>
                                    <p className="text-xs font-black uppercase text-slate-900">{user?.name || 'Bagian Akuntansi'}</p>
                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Accounting Staff</p>
                                 </div>
                              </div>
                              <div className="hidden sm:block" />
                              <div className="text-center space-y-12 sm:space-y-16 md:space-y-24">
                                 <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-900">Disetujui Oleh,</p>
                                 <div className="space-y-1">
                                    <div className="w-full border-t border-slate-900 mb-1 sm:mb-2"></div>
                                    <p className="text-xs font-black uppercase text-slate-900">........................</p>
                                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pimpinan / Direktur</p>
                                 </div>
                              </div>
                           </div>

                           {/* Footer Metadata */}
                           <div className="mt-16 sm:mt-24 md:mt-32 pt-4 sm:pt-5 md:pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 italic">
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">ID Transaksi: AUDIT-{new Date().getTime()}</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Halaman 1 dari 1</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dicetak: {new Date().toLocaleString('id-ID')}</p>
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
