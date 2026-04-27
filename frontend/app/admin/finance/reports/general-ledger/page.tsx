'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import api from '@/lib/api'
import { 
   FiBookOpen, FiSearch, FiCalendar, FiDownload, FiActivity, FiLayers, 
   FiChevronDown, FiChevronRight, FiPrinter, FiX, FiFileText, FiMapPin, FiPhone 
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalDetail {
  id: string
  coaCode: string
  coaName: string
  coaCategory: string
  debit: number
  credit: number
  description?: string
}

interface GlobalTransaction {
  id: string
  date: string
  description: string
  referenceNo?: string
  entryType: string
  totalDebit: number
  totalCredit: number
  details: JournalDetail[]
}

interface AccountTransaction {
  id: string
  date: string
  description: string
  referenceNo?: string
  entryType: string
  debit: number
  credit: number
  balance: number
}

interface LedgerReport {
  account: { code: string; name: string; category: string }
  period: { start: string; end: string }
  initialBalance: number
  openingBalance?: number
  transactions: GlobalTransaction[] | AccountTransaction[]
  finalBalance: number
  meta?: { total: number; page: number; limit: number; totalPages: number }
}

interface COA {
  id: string
  code: string
  name: string
  accountType: string
  category: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | Date, withYear = true) => {
  const date = new Date(d)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', ...(withYear ? { year: 'numeric' } : {})
  })
}

const ENTRY_TYPE_BADGE: Record<string, string> = {
  SYSTEM:  'bg-blue-50 text-blue-600 border-blue-100',
  MANUAL:  'bg-purple-50 text-purple-600 border-purple-100',
  CLOSING: 'bg-orange-50 text-orange-600 border-orange-100',
}

const CATEGORY_COLOR: Record<string, string> = {
  ASSET:     'text-emerald-600',
  LIABILITY: 'text-rose-600',
  EQUITY:    'text-purple-600',
  REVENUE:   'text-blue-600',
  EXPENSE:   'text-orange-600',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeneralLedgerPage() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { activeClinicId } = useAuthStore()
  const [coaList, setCoaList] = useState<COA[]>([])
  const [selectedCoaId, setSelectedCoaId] = useState('')
  const [report, setReport] = useState<LedgerReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0, limit: 50 })
  const [expandedJournals, setExpandedJournals] = useState<Set<string>>(new Set())
  const user = useAuthStore(state => state.user)
  const activeClinic = user?.clinics?.find(c => c.id === activeClinicId) || user?.clinics?.[0]

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10)
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10))

  const fetchCOA = useCallback(async () => {
    try {
      const { data } = await api.get('/master/coa')
      setCoaList(data.filter((a: COA) => a.accountType === 'DETAIL'))
    } catch { /* silent */ }
  }, [])

  const fetchLedger = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/accounting/general-ledger', {
        params: { coaId: selectedCoaId, startDate, endDate, page: p, limit: 100 } // Higher limit for ledger
      })
      setReport(data)
      setMeta(data.meta || { total: 0, totalPages: 0, limit: 100 })
      setPage(p)
      if (p === 1 && data.transactions?.length <= 10) {
        setExpandedJournals(new Set(data.transactions.map((t: any) => t.id)))
      }
    } catch {
      toast.error('Gagal mengambil data Buku Besar')
    } finally {
      setLoading(false)
    }
  }, [selectedCoaId, startDate, endDate])

  useEffect(() => { fetchCOA() }, [fetchCOA])
  useEffect(() => { fetchLedger(1) }, [selectedCoaId, startDate, endDate])

  const isGlobalView = !selectedCoaId || selectedCoaId === 'all'

  const toggleJournal = (id: string) => {
    setExpandedJournals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handlePrint = () => {
     window.print()
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8 text-left print-container ledger-scroll-container ledger-safe-bottom"
         style={{ 
           WebkitTapHighlightColor: 'transparent',
           WebkitTouchCallout: 'none',
           WebkitUserSelect: 'none',
           KhtmlUserSelect: 'none',
           MozUserSelect: 'none',
           msUserSelect: 'none',
           userSelect: 'none'
         }}>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1 md:px-2 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Buku Besar</h1>
              <p className="text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-wide mt-0.5">
                {isGlobalView
                  ? `${meta.total} jurnal ditemukan — tampil per entri jurnal`
                  : `Kartu akun: ${report?.account.code} - ${report?.account.name}`}
              </p>
            </div>
          </div>
        </div>
        
        <button 
           onClick={() => setIsPreviewOpen(true)}
           className="w-full md:w-auto bg-slate-900 text-white flex items-center justify-center gap-2 px-6 py-3.5 md:px-5 md:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 no-print"
        >
           <FiPrinter className="w-4 h-4" /> 
           <span>Preview & Print PDF</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm mx-1 md:mx-2 no-print">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Filter Akun</label>
            <div className="relative">
              <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-3.5 h-3.5 pointer-events-none" />
              <select
                value={selectedCoaId}
                onChange={e => setSelectedCoaId(e.target.value)}
                className="w-full pl-10 pr-6 py-3.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 appearance-none"
              >
                <option value="">[ SEMUA AKUN — Jurnal Umum ]</option>
                {['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'].map(cat => {
                  const items = coaList.filter(c => c.category === cat)
                  if (!items.length) return null
                  return (
                    <optgroup key={cat} label={`── ${cat} ──`}>
                      {items.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Periode Laporan</label>
            <div className="flex items-center gap-2 px-4 py-3.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl">
              <FiCalendar className="text-indigo-500 w-3.5 h-3.5 flex-shrink-0" />
              <div className="flex items-center flex-1 min-w-0">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-700 w-full" />
                <span className="text-slate-300 text-xs px-2">–</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-700 w-full" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={() => fetchLedger(1)} disabled={loading}
              className="w-full h-[48px] md:h-[48px] bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Memuat...' : 'Tampilkan'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 px-4 no-print">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 ledger-skeleton">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 last:mb-0">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg ledger-skeleton"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mb-2 ledger-skeleton"></div>
                    <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded ledger-skeleton"></div>
                  </div>
                  <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded ledger-skeleton"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : report ? (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4 no-print">

            {!isGlobalView && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Akun', value: `${report.account.code}`, sub: report.account.name, color: 'bg-slate-900 text-white' },
                  { label: 'Kategori', value: report.account.category, sub: 'Tipe Akun', color: 'bg-white border border-slate-200' },
                  { label: 'Saldo Awal', value: fmt(report.openingBalance ?? report.initialBalance), sub: 'Sebelum periode', color: 'bg-white border border-slate-200' },
                  { label: 'Saldo Akhir', value: fmt(report.finalBalance), sub: 'Per akhir periode', color: 'bg-indigo-600 text-white' },
                ].map(c => (
                  <div key={c.label} className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl ${c.color}`}>
                    <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1 ${c.color.includes('white') ? 'text-slate-400' : 'text-white/50'}`}>{c.label}</p>
                    <p className={`text-sm sm:text-base md:text-lg font-black tracking-tight ${c.color.includes('white') ? 'text-slate-900' : 'text-white'}`}>{c.value}</p>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 truncate ${c.color.includes('white') ? 'text-slate-400' : 'text-white/60'}`}>{c.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {isGlobalView && (
              <div className="space-y-2">
                {(report.transactions as GlobalTransaction[]).map((j, idx) => {
                  const isExpanded = expandedJournals.has(j.id)
                  return (
                    <motion.div
                      key={j.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-1 sm:mx-2"
                    >
                      <button onClick={() => toggleJournal(j.id)} className="w-full flex items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors text-left">
                        <div className="flex-shrink-0 text-slate-400">
                          {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                        </div>
                        <div className="w-20 md:w-24 flex-shrink-0">
                          <p className="text-xs sm:text-sm font-black text-slate-800">{fmtDate(j.date, false)}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5 hidden sm:block">{fmtDate(j.date, true)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex-shrink-0 ${ENTRY_TYPE_BADGE[j.entryType] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {j.entryType}
                        </span>
                        <div className="flex-1 min-w-0 px-2">
                          <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{j.description}</p>
                          {j.referenceNo && <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">Ref: {j.referenceNo}</p>}
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 text-right">
                          <div className="hidden md:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Debit</p>
                            <p className="text-sm font-black text-emerald-600">{j.totalDebit > 0 ? fmt(j.totalDebit) : '-'}</p>
                          </div>
                          <div className="hidden md:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kredit</p>
                            <p className="text-sm font-black text-rose-600">{j.totalCredit > 0 ? fmt(j.totalCredit) : '-'}</p>
                          </div>
                          <div className="md:hidden flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-emerald-600">D:</span>
                              <span className="text-[11px] font-black text-emerald-600">{j.totalDebit > 0 ? fmt(j.totalDebit).replace('Rp', '').trim() : '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-rose-600">K:</span>
                              <span className="text-[11px] font-black text-rose-600">{j.totalCredit > 0 ? fmt(j.totalCredit).replace('Rp', '').trim() : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-50 bg-slate-50/30">
                            <div className="overflow-x-auto">
                              <table className="w-full text-[9px] sm:text-sm general-ledger-table table-fixed">
                                <thead><tr className="border-b border-slate-100">
                                  <th className="px-4 sm:px-6 md:px-8 py-2 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Kode Akun</th>
                                  <th className="px-2 sm:px-4 py-2 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                                  <th className="px-2 sm:px-4 py-2 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                                  <th className="px-4 sm:px-6 md:px-8 py-2 text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-3 sm:pr-4">Kredit</th>
                                </tr></thead>
                                <tbody>{j.details.map(d => (
                                  <tr key={d.id} className="border-b border-slate-50 last:border-0">
                                    <td className="px-4 sm:px-6 md:px-8 py-2">
                                      <span className={`text-[10px] sm:text-[11px] font-black ${CATEGORY_COLOR[d.coaCategory] || 'text-slate-600'}`}>{d.coaCode}</span>
                                    </td>
                                    <td className="px-2 sm:px-4 py-2 font-bold text-slate-700 text-[10px] sm:text-xs">
                                      <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest leading-none sm:hidden">{d.coaCode}</span>
                                        <span className="uppercase leading-tight">{d.coaName}</span>
                                      </div>
                                    </td>
                                    <td className="px-2 sm:px-4 py-2 text-right font-black text-emerald-600 text-[11px] sm:text-xs">{d.debit > 0 ? fmt(d.debit) : ''}</td>
                                    <td className="px-4 sm:px-6 md:px-8 py-2 text-right font-black text-rose-600 text-[11px] sm:text-xs pr-3 sm:pr-4">{d.credit > 0 ? fmt(d.credit) : ''}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {!isGlobalView && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden mx-1 sm:mx-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse general-ledger-table table-fixed">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Kredit</th>
                        <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-3 sm:pr-4">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="bg-indigo-50/40 border-b border-indigo-100">
                        <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest">Saldo Akhir</td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs font-bold text-indigo-600" colSpan={3}>Per akhir periode</td>
                        <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm font-black text-indigo-700 text-right pr-3 sm:pr-4">{fmt(report.finalBalance)}</td>
                      </tr>
                      {(report.transactions as AccountTransaction[]).map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-black text-slate-800 whitespace-nowrap">{fmtDate(t.date)}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-bold text-slate-700 truncate max-w-[150px] sm:max-w-none">{t.description}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-black text-emerald-600 text-right">{t.debit > 0 ? fmt(t.debit) : '-'}</td>
                          <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-black text-rose-600 text-right">{t.credit > 0 ? fmt(t.credit) : '-'}</td>
                          <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-black text-slate-900 text-right pr-3 sm:pr-4">{fmt(t.balance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/60 border-t border-slate-100">
                        <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Awal</td>
                        <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-xs font-bold text-slate-500" colSpan={3}>Sebelum periode ini</td>
                        <td className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm font-black text-slate-600 text-right pr-3 sm:pr-4">{fmt(report.openingBalance ?? report.initialBalance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : null}

       {/* REPORT PREVIEW MODAL */}
       <AnimatePresence>
          {isPreviewOpen && (
             <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md no-print" />
                <motion.div 
                   initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} 
                   className="relative w-full max-w-4xl lg:max-w-6xl bg-white rounded-t-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col h-[90vh] md:h-[95vh] overflow-hidden no-print"
                >
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 md:px-10 md:py-6 border-b border-slate-100 bg-white no-print">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                           <FiFileText className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">General Ledger Preview</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Detail Transaksi & Mutasi Akun</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                         <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest">
                           <FiPrinter className="w-4 h-4" /> 
                           <span>Download / Print</span>
                         </button>
                         <button onClick={() => setIsPreviewOpen(false)} className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900 transition-all hover:bg-slate-200">
                           <FiX className="w-5 h-5" />
                         </button>
                      </div>
                   </div>

                  <div className="flex-1 overflow-y-auto bg-slate-200/50 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 print:p-0 print:bg-white custom-scrollbar">
                     <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl sm:shadow-2xl print:shadow-none p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 text-slate-800 font-sans print:p-8" style={{ boxSizing: 'border-box' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-10 border-b-2 sm:border-b-3 md:border-b-4 border-slate-900 pb-4 sm:pb-6 md:pb-8">
                           <div className="space-y-2 sm:space-y-3 md:space-y-4">
                              <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">General Ledger</h1>
                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Buku Besar Akuntansi</p>
                              </div>
                              <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-100 inline-block">
                                 <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Periode Laporan</p>
                                 <p className="text-xs sm:text-sm font-black text-slate-900 uppercase">{fmtDate(startDate)} - {fmtDate(endDate)}</p>
                              </div>
                           </div>
                           <div className="text-left sm:text-right space-y-1 sm:space-y-2">
                              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{activeClinic?.name || 'Klinik Yasfina Pusat'}</h2>
                              <div className="space-y-0.5 sm:space-y-1">
                                 <p className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                   <FiMapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                   <span className="truncate">{activeClinic?.address || 'Jakarta, Indonesia'}</span>
                                 </p>
                                 <p className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                   <FiPhone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 flex-shrink-0" />
                                   <span className="truncate">{user?.email || 'admin@yasfina.com'}</span>
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Account Info (If Account View) */}
                        {!isGlobalView && report && (
                           <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Akun / Kode</p>
                                <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 truncate">{report.account.code} - {report.account.name}</h4>
                              </div>
                              <div className="text-left sm:text-right">
                                 <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Akhir</p>
                                 <h4 className="text-base sm:text-lg font-black text-indigo-600">{fmt(report.finalBalance)}</h4>
                              </div>
                           </div>
                        )}

                        {/* CONTENT TABLE */}
                        <div className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
                           {isGlobalView ? (
                              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                 {(report?.transactions as GlobalTransaction[])?.map(j => (
                                    <div key={j.id} className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden">
                                       <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2 border-b border-slate-200">
                                          <div className="flex gap-2 sm:gap-3 md:gap-4 items-center">
                                             <span className="text-[9px] sm:text-[10px] font-black bg-slate-900 text-white px-1.5 sm:px-2 py-0.5 rounded">{fmtDate(j.date)}</span>
                                             <span className="text-xs font-black text-slate-900 uppercase truncate">{j.description}</span>
                                          </div>
                                          <span className="text-[8px] sm:text-[9px] font-black text-slate-400">Ref: {j.referenceNo || '-'}</span>
                                       </div>
                                       <div className="overflow-x-auto">
                                         <table className="w-full min-w-[400px] text-[9px] sm:text-[10px]">
                                           <thead className="bg-slate-50/50">
                                             <tr>
                                               <th className="px-2 sm:px-3 md:px-4 py-1 text-left uppercase text-slate-400">Akun</th>
                                               <th className="px-2 sm:px-3 md:px-4 py-1 text-right uppercase text-slate-400">Debit</th>
                                               <th className="px-2 sm:px-3 md:px-4 py-1 text-right uppercase text-slate-400">Kredit</th>
                                             </tr>
                                           </thead>
                                           <tbody>{j.details.map(d => (
                                             <tr key={d.id} className="border-t border-slate-100">
                                               <td className="px-2 sm:px-3 md:px-4 py-1 truncate max-w-[150px] sm:max-w-none">{d.coaCode} - {d.coaName}</td>
                                               <td className="px-2 sm:px-3 md:px-4 py-1 text-right">{d.debit > 0 ? fmt(d.debit).replace('Rp','').trim() : ''}</td>
                                               <td className="px-2 sm:px-3 md:px-4 py-1 text-right">{d.credit > 0 ? fmt(d.credit).replace('Rp','').trim() : ''}</td>
                                             </tr>
                                           ))}</tbody>
                                         </table>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           ) : (
                              <div className="overflow-x-auto">
                                 <table className="w-full border-collapse table-fixed">
                                  <thead>
                                    <tr className="bg-slate-100 border border-slate-200">
                                      <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[8px] sm:text-[9px] font-black text-slate-900 uppercase border-r border-slate-200">Tanggal</th>
                                      <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[8px] sm:text-[9px] font-black text-slate-900 uppercase border-r border-slate-200">Keterangan</th>
                                      <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[8px] sm:text-[9px] font-black text-slate-900 uppercase border-r border-slate-200">Debit</th>
                                      <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[8px] sm:text-[9px] font-black text-slate-900 uppercase border-r border-slate-200">Kredit</th>
                                      <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[8px] sm:text-[9px] font-black text-slate-900 uppercase">Saldo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="bg-slate-50">
                                      <td className="px-2 sm:px-3 md:px-4 py-1 text-[9px] sm:text-[10px] font-bold uppercase" colSpan={4}>Saldo Awal</td>
                                      <td className="px-2 sm:px-3 md:px-4 py-1 text-right text-[9px] sm:text-[10px] font-bold">{fmt(report?.openingBalance ?? 0).replace('Rp','').trim()}</td>
                                    </tr>
                                    {(report?.transactions as AccountTransaction[])?.map(t => (
                                      <tr key={t.id} className="border-b border-slate-200">
                                        <td className="px-2 sm:px-3 md:px-4 py-1 text-[8px] sm:text-[9px] border-r border-slate-100 whitespace-nowrap">{fmtDate(t.date)}</td>
                                        <td className="px-2 sm:px-3 md:px-4 py-1 text-[8px] sm:text-[9px] uppercase border-r border-slate-100 truncate max-w-[120px] sm:max-w-none">{t.description}</td>
                                        <td className="px-2 sm:px-3 md:px-4 py-1 text-right text-[8px] sm:text-[9px] border-r border-slate-100">{t.debit > 0 ? fmt(t.debit).replace('Rp','').trim() : '-'}</td>
                                        <td className="px-2 sm:px-3 md:px-4 py-1 text-right text-[8px] sm:text-[9px] border-r border-slate-100">{t.credit > 0 ? fmt(t.credit).replace('Rp','').trim() : '-'}</td>
                                        <td className="px-2 sm:px-3 md:px-4 py-1 text-right text-[8px] sm:text-[9px] font-bold">{fmt(t.balance).replace('Rp','').trim()}</td>
                                      </tr>
                                    ))}
                                    <tr className="bg-indigo-50">
                                      <td className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase text-indigo-700" colSpan={4}>Saldo Akhir Per Periode</td>
                                      <td className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-right text-[9px] sm:text-[10px] font-black text-indigo-700">{fmt(report?.finalBalance || 0).replace('Rp','').trim()}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                           )}
                        </div>

                        {/* Signatures */}
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

                        <div className="mt-16 sm:mt-24 md:mt-32 pt-4 sm:pt-5 md:pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 italic">
                           <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">LEDGER_CERTIFIED: {new Date().getTime()}</p>
                           <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hal 1 dari 1</p>
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
