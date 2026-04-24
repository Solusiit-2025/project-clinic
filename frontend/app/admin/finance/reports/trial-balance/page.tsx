'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
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
   const { token, activeClinicId } = useAuthStore()
   const [data, setData] = useState<TrialBalanceItem[]>([])
   const [loading, setLoading] = useState(true)
   const [search, setSearch] = useState('')
   const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10))

   const headers = useMemo(() => ({
      Authorization: `Bearer ${token}`,
      'x-clinic-id': activeClinicId
   }), [token, activeClinicId])

   const fetchData = useCallback(async () => {
      if (!token || !activeClinicId) return
      setLoading(true)
      try {
         const { data: resData } = await axios.get(`${API}/trial-balance`, {
            headers,
            params: { date: targetDate }
         })
         setData(resData)
      } catch (e) {
         console.error('Failed to fetch trial balance', e)
         toast.error('Gagal mengambil data Trial Balance')
      } finally {
         setLoading(false)
      }
   }, [headers, targetDate, activeClinicId, token])

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
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                     <FiActivity className="w-6 h-6" />
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Trial Balance</h1>
               </div>
               <p className="text-slate-400 font-medium text-sm ml-14">Neraca Saldo Real-time untuk validasi keseimbangan akun keuangan.</p>
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
         <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center mx-4">
            <div className="relative flex-1">
               <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <input
                  type="text" placeholder="Cari Kode atau Nama Akun..."
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2.25rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800"
                  value={search} onChange={(e) => setSearch(e.target.value)}
               />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2 rounded-[2.25rem]">
               <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-slate-100 shadow-sm">
                  <FiCalendar className="text-indigo-600 w-4 h-4" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Per Tanggal</span>
                  <input
                     type="date" className="bg-transparent border-none focus:outline-none text-sm font-black text-slate-800 ml-2"
                     value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                  />
               </div>
               <button
                  onClick={fetchData}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
               >
                  Tampilkan Data
               </button>
            </div>
         </div>

         {/* REPORT TABLE */}
         <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mx-4">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode Akun</th>
                     <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Deskripsi Akun</th>
                     <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Debet (DR)</th>
                     <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Kredit (CR)</th>
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
                              <td className="px-12 py-6">
                                 <span className="text-[11px] font-black bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl tracking-widest shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">
                                    {row.code}
                                 </span>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-black text-slate-800 tracking-tight">{row.name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-all">{row.category}</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <span className={`text-base font-black tracking-tight ${row.debit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
                                    {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                                 </span>
                              </td>
                              <td className="px-12 py-6 text-right">
                                 <span className={`text-base font-black tracking-tight ${row.credit > 0 ? 'text-slate-900' : 'text-slate-200'}`}>
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
                     <td colSpan={2} className="px-12 py-10">
                        <div className="flex items-center gap-4">
                           <h4 className="text-2xl font-black uppercase tracking-widest">Grand Total</h4>
                           <div className="h-1.5 w-16 bg-white/20 rounded-full" />
                        </div>
                     </td>
                     <td className="px-8 py-10 text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 leading-none">Total Debit</p>
                        <p className="text-3xl font-bold tracking-tighter">{formatCurrency(totals.debit)}</p>
                     </td>
                     <td className="px-12 py-10 text-right underline decoration-indigo-500/50 decoration-[6px] underline-offset-8">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 leading-none">Total Kredit</p>
                        <p className="text-3xl font-bold tracking-tighter">{formatCurrency(totals.credit)}</p>
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
