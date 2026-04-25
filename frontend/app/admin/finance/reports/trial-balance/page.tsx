'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiActivity, FiSearch, FiCalendar, FiFilter, FiDownload, FiCheckCircle, FiAlertCircle, FiArrowRight, FiLayers } from 'react-icons/fi'
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
   const { activeClinicId } = useAuthStore()
   const [data, setData] = useState<TrialBalanceItem[]>([])
   const [loading, setLoading] = useState(true)
   const [search, setSearch] = useState('')
   const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))


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

   return (
      <div className="w-full px-[10px] py-6 space-y-10 text-left">

         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                     <FiActivity className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Trial Balance</h1>
               </div>
               <p className="text-slate-400 font-bold text-[11px] ml-12 uppercase tracking-wide">Neraca Saldo Real-time untuk validasi keseimbangan akun keuangan.</p>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end gap-1 px-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Keseimbangan</span>
                  {isBalanced ? (
                     <div className="flex items-center gap-2 text-emerald-600">
                        <FiCheckCircle className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-tight">Balanced</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 text-rose-600">
                        <FiAlertCircle className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-tight">Unbalanced (Selisih: {formatCurrency(Math.abs(totals.debit - totals.credit))})</span>
                     </div>
                  )}
               </div>
               <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm">
                  <FiDownload className="w-5 h-5" />
               </button>
            </div>
         </div>

         {/* FILTER BAR */}
         <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-3 items-center mx-2">
            <div className="relative flex-1 w-full">
               <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <input
                  type="text" placeholder="Cari Kode atau Nama Akun..."
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800"
                  value={search} onChange={(e) => setSearch(e.target.value)}
               />
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                  <FiCalendar className="text-indigo-600 w-3.5 h-3.5" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per Tanggal</span>
                  <input
                     type="date" className="bg-transparent border-none focus:outline-none text-xs font-black text-slate-800 ml-1"
                     value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                  />
               </div>
               <button
                  onClick={fetchData}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
               >
                  Tampilkan
               </button>
            </div>
         </div>

         {/* REPORT TABLE */}
         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mx-2">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode Akun</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Akun</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debet (DR)</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Kredit (CR)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                     {loading ? (
                        [...Array(6)].map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={4} className="px-12 py-7"><div className="h-10 bg-slate-100 rounded-2xl w-full"></div></td>
                           </tr>
                        ))
                     ) : filteredData.length > 0 ? (
                        filteredData.map((row) => (
                           <motion.tr
                              key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="hover:bg-indigo-50/30 transition-all group"
                           >
                              <td className="px-6 py-3.5">
                                 <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg tracking-widest shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">
                                    {row.code}
                                 </span>
                              </td>
                              <td className="px-6 py-3.5">
                                 <p className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase">{row.name}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 group-hover:opacity-100 transition-all">{row.category}</p>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                 <span className={`text-sm font-black tracking-tight ${row.debit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                                 </span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                 <span className={`text-sm font-black tracking-tight ${row.credit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                                    {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                                 </span>
                              </td>
                           </motion.tr>
                        ))
                     ) : (
                        <tr>
                           <td colSpan={4} className="px-12 py-32 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-30">
                                 <FiLayers className="w-16 h-16" />
                                 <p className="font-black text-slate-400 uppercase tracking-widest">Tidak ada data akun tersedia</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </AnimatePresence>
               </tbody>
               {/* TOTALS FOOTER */}
                <tfoot className="bg-slate-900 text-white">
                   <tr>
                      <td colSpan={2} className="px-6 py-6">
                         <div className="flex items-center gap-3">
                            <h4 className="text-lg font-black uppercase tracking-widest">Grand Total</h4>
                            <div className="h-1 w-10 bg-white/20 rounded-full" />
                         </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5 leading-none">Total Debit</p>
                         <p className="text-xl font-bold tracking-tighter">{formatCurrency(totals.debit)}</p>
                      </td>
                      <td className="px-6 py-6 text-right">
                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5 leading-none">Total Kredit</p>
                         <p className="text-xl font-bold tracking-tighter">{formatCurrency(totals.credit)}</p>
                      </td>
                   </tr>
                </tfoot>
            </table>
         </div>

         {/* DISCLAMER / INFO */}
         <div className="px-8">
            <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-6">
               <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                  <FiAlertCircle className="w-6 h-6" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black text-amber-800 uppercase tracking-tight">Penting untuk Diperhatikan</h4>
                  <p className="text-xs text-amber-900/60 font-medium leading-relaxed">
                     Laporan Neraca Saldo ini bersifat real-time. Jika total Debet dan Kredit tidak seimbang, silakan periksa daftar Jurnal Penyesuaian atau transaksi yang belum terposting dengan benar. Pastikan setiap akun memiliki kategori normal balance yang sesuai.
                  </p>
               </div>
            </div>
         </div>

      </div>
   )
}
