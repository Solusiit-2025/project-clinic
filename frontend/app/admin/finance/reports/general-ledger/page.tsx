'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { FiBookOpen, FiSearch, FiCalendar, FiDownload, FiActivity, FiLayers, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const ACCT_API = process.env.NEXT_PUBLIC_API_URL + '/api/accounting'
const MASTER_API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

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

// Mode Global: per JournalEntry
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

// Mode Akun: per JournalDetail dengan running balance
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
  const { token, activeClinicId } = useAuthStore()
  const [coaList, setCoaList] = useState<COA[]>([])
  const [selectedCoaId, setSelectedCoaId] = useState('')
  const [report, setReport] = useState<LedgerReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 0, limit: 50 })
  const [expandedJournals, setExpandedJournals] = useState<Set<string>>(new Set())

  // Default: awal tahun ini sampai hari ini
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10)
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10))

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }), [token, activeClinicId])

  const fetchCOA = useCallback(async () => {
    try {
      const { data } = await axios.get(`${MASTER_API}/coa`, { headers })
      setCoaList(data.filter((a: COA) => a.accountType === 'DETAIL'))
    } catch { /* silent */ }
  }, [headers])

  const fetchLedger = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${ACCT_API}/general-ledger`, {
        headers,
        params: { coaId: selectedCoaId, startDate, endDate, page: p, limit: 50 }
      })
      setReport(data)
      setMeta(data.meta || { total: 0, totalPages: 0, limit: 50 })
      setPage(p)
      // Auto-expand semua jurnal di halaman pertama
      if (p === 1 && data.transactions?.length <= 10) {
        setExpandedJournals(new Set(data.transactions.map((t: any) => t.id)))
      }
    } catch {
      toast.error('Gagal mengambil data Buku Besar')
    } finally {
      setLoading(false)
    }
  }, [headers, selectedCoaId, startDate, endDate])

  useEffect(() => { if (token) fetchCOA() }, [fetchCOA, token])
  useEffect(() => { fetchLedger(1) }, [selectedCoaId, startDate, endDate])

  const isGlobalView = !selectedCoaId || selectedCoaId === 'all'

  const toggleJournal = (id: string) => {
    setExpandedJournals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => {
    if (report) setExpandedJournals(new Set(report.transactions.map((t: any) => t.id)))
  }
  const collapseAll = () => setExpandedJournals(new Set())

  return (
    <div className="w-full px-[10px] py-6 space-y-8 text-left">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Buku Besar</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm ml-14">
            {isGlobalView
              ? `${meta.total} jurnal ditemukan — tampil per entri jurnal`
              : `Kartu akun: ${report?.account.code} - ${report?.account.name}`}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm mx-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          {/* COA Selector */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Filter Akun</label>
            <div className="relative">
              <FiLayers className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 w-4 h-4 pointer-events-none" />
              <select
                value={selectedCoaId}
                onChange={e => setSelectedCoaId(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 appearance-none"
              >
                <option value="">[ SEMUA AKUN — Jurnal Umum ]</option>
                {/* Group by category */}
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

          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Periode</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <FiCalendar className="text-indigo-500 w-4 h-4 flex-shrink-0" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 w-full" />
              <span className="text-slate-300 text-xs">–</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-700 w-full" />
            </div>
          </div>

          <button
            onClick={() => fetchLedger(1)} disabled={loading}
            className="h-[52px] bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4">

            {/* ── Account Summary (Mode Akun) ── */}
            {!isGlobalView && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Akun', value: `${report.account.code}`, sub: report.account.name, color: 'bg-slate-900 text-white' },
                  { label: 'Kategori', value: report.account.category, sub: 'Tipe Akun', color: 'bg-white border border-slate-200' },
                  { label: 'Saldo Awal Periode', value: fmt(report.openingBalance ?? report.initialBalance), sub: 'Sebelum periode ini', color: 'bg-white border border-slate-200' },
                  { label: 'Saldo Akhir Periode', value: fmt(report.finalBalance), sub: 'Per akhir periode', color: 'bg-indigo-600 text-white' },
                ].map(c => (
                  <div key={c.label} className={`p-5 rounded-2xl ${c.color}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${c.color.includes('white') ? 'text-slate-400' : 'text-white/50'}`}>{c.label}</p>
                    <p className={`text-lg font-black tracking-tight ${c.color.includes('white') ? 'text-slate-900' : 'text-white'}`}>{c.value}</p>
                    <p className={`text-[10px] mt-0.5 ${c.color.includes('white') ? 'text-slate-400' : 'text-white/60'}`}>{c.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Expand/Collapse Controls (Mode Global) ── */}
            {isGlobalView && report.transactions.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                  Menampilkan {report.transactions.length} dari {meta.total} jurnal
                </p>
                <div className="flex gap-2">
                  <button onClick={expandAll} className="px-3 py-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    Buka Semua
                  </button>
                  <button onClick={collapseAll} className="px-3 py-1.5 text-[10px] font-black text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Tutup Semua
                  </button>
                </div>
              </div>
            )}

            {/* ── GLOBAL VIEW: Per Journal Entry ── */}
            {isGlobalView && (
              <div className="space-y-2">
                {(report.transactions as GlobalTransaction[]).map((j, idx) => {
                  const isExpanded = expandedJournals.has(j.id)
                  return (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Journal Header — always visible */}
                      <button
                        onClick={() => toggleJournal(j.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
                      >
                        {/* Toggle icon */}
                        <div className="flex-shrink-0 text-slate-400">
                          {isExpanded
                            ? <FiChevronDown className="w-4 h-4" />
                            : <FiChevronRight className="w-4 h-4" />}
                        </div>

                        {/* Date */}
                        <div className="w-24 flex-shrink-0">
                          <p className="text-sm font-black text-slate-800">{fmtDate(j.date)}</p>
                        </div>

                        {/* Entry type badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex-shrink-0 ${ENTRY_TYPE_BADGE[j.entryType] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {j.entryType}
                        </span>

                        {/* Description + Ref */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{j.description}</p>
                          {j.referenceNo && (
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ref: {j.referenceNo}</p>
                          )}
                        </div>

                        {/* Totals */}
                        <div className="flex items-center gap-6 flex-shrink-0 text-right">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Debit</p>
                            <p className="text-sm font-black text-emerald-600">{j.totalDebit > 0 ? fmt(j.totalDebit) : '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kredit</p>
                            <p className="text-sm font-black text-rose-600">{j.totalCredit > 0 ? fmt(j.totalCredit) : '-'}</p>
                          </div>
                        </div>
                      </button>

                      {/* Journal Details — expandable */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-slate-50 bg-slate-50/30">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-100">
                                    <th className="px-8 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left pl-16">Kode Akun</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Akun</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Keterangan</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                                    <th className="px-8 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Kredit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {j.details.map(d => (
                                    <tr key={d.id} className="border-b border-slate-50 last:border-0">
                                      <td className="px-8 py-2.5 pl-16">
                                        <span className={`text-[11px] font-black ${CATEGORY_COLOR[d.coaCategory] || 'text-slate-600'}`}>
                                          {d.coaCode}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 font-bold text-slate-700 text-xs">{d.coaName}</td>
                                      <td className="px-4 py-2.5 text-xs text-slate-400">{d.description || '-'}</td>
                                      <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-xs">
                                        {d.debit > 0 ? fmt(d.debit) : ''}
                                      </td>
                                      <td className="px-8 py-2.5 text-right font-black text-rose-600 text-xs">
                                        {d.credit > 0 ? fmt(d.credit) : ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}

                {report.transactions.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
                    <FiLayers className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">Tidak ada jurnal pada periode ini</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ACCOUNT VIEW: Running Balance Table ── */}
            {!isGlobalView && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Kredit</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Saldo Akhir di atas (karena urutan DESC) */}
                    <tr className="bg-indigo-50/40 border-b border-indigo-100">
                      <td className="px-8 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest">Saldo Akhir</td>
                      <td className="px-6 py-4 text-xs font-bold text-indigo-600">Per akhir periode</td>
                      <td colSpan={3} />
                      <td className="px-8 py-4 text-sm font-black text-indigo-700 text-right">{fmt(report.finalBalance)}</td>
                    </tr>

                    {(report.transactions as AccountTransaction[]).map((t, idx) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <p className="text-sm font-black text-slate-800">{fmtDate(t.date)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{t.description}</p>
                          {t.entryType && t.entryType !== 'SYSTEM' && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${ENTRY_TYPE_BADGE[t.entryType] || ''}`}>
                              {t.entryType}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{t.referenceNo || '-'}</td>
                        <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">
                          {t.debit > 0 ? fmt(t.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-rose-600 text-right">
                          {t.credit > 0 ? fmt(t.credit) : '-'}
                        </td>
                        <td className="px-8 py-4 text-sm font-black text-slate-900 text-right">
                          {fmt(t.balance)}
                        </td>
                      </motion.tr>
                    ))}

                    {/* Saldo Awal di bawah (karena urutan DESC) */}
                    <tr className="bg-slate-50/60 border-t border-slate-100">
                      <td className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Awal</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">Sebelum periode ini</td>
                      <td colSpan={3} />
                      <td className="px-8 py-4 text-sm font-black text-slate-600 text-right">{fmt(report.openingBalance ?? report.initialBalance)}</td>
                    </tr>

                    {report.transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-16 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          Tidak ada mutasi pada periode ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination ── */}
            {meta?.totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-bold text-slate-400">
                  Halaman <span className="text-indigo-600 font-black">{page}</span> dari {meta.totalPages}
                  <span className="ml-2 text-slate-300">({meta.total} total)</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page === 1 || loading} onClick={() => fetchLedger(1)}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">«</button>
                  <button disabled={page === 1 || loading} onClick={() => fetchLedger(page - 1)}
                    className="px-4 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">Prev</button>

                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    let pn = page <= 3 ? i + 1 : page >= meta.totalPages - 2 ? meta.totalPages - 4 + i : page - 2 + i
                    if (pn <= 0 || pn > meta.totalPages) return null
                    return (
                      <button key={pn} onClick={() => fetchLedger(pn)} disabled={loading}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === pn ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                        {pn}
                      </button>
                    )
                  })}

                  <button disabled={page === meta.totalPages || loading} onClick={() => fetchLedger(page + 1)}
                    className="px-4 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">Next</button>
                  <button disabled={page === meta.totalPages || loading} onClick={() => fetchLedger(meta.totalPages)}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 transition-all">»</button>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
