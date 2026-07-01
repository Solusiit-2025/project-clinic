'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadialBarChart, RadialBar, ComposedChart, Line,
} from 'recharts'
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers,
  FiAlertTriangle, FiRefreshCw, FiPackage, FiActivity,
  FiCheckCircle, FiCreditCard, FiShield, FiBarChart2,
  FiArrowUp, FiArrowDown, FiClock, FiHome, FiUserPlus,
} from 'react-icons/fi'
import api from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// ── Color Palette ──────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#14b8a6', '#ec4899']
const AGING_COLORS = { emerald: '#10b981', amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e' }

// ── Utility Functions ──────────────────────────────────────────────────
const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const fmtPct = (n: number | null) => {
  if (n === null || n === undefined) return null
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

// ── Trend Badge ────────────────────────────────────────────────────────
function TrendBadge({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null || value === undefined) return <span className="text-xs text-gray-400">—</span>
  const isPos = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
      {isPos ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend, icon: Icon, color, bg }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{label}</p>
      </div>
    </motion.div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle, badge }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-900">{title}</h2>
          {subtitle && <p className="text-[10px] text-gray-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="text-[9px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase tracking-wider">{badge}</span>
      )}
    </div>
  )
}

// ── Tab Info Box — Panduan Owner ────────────────────────────────────────
function TabInfoBox({
  emoji, title, description, bullets, tip
}: {
  emoji: string
  title: string
  description: string
  bullets: { icon: string; label: string; text: string }[]
  tip?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${open ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-gray-100 hover:border-indigo-200'}`}>
      {/* Header — selalu tampil */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800">{title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest hidden sm:block">
            {open ? 'Tutup' : '📖 Panduan Owner'}
          </span>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${open ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {open ? '✕' : '?'}
          </div>
        </div>
      </button>

      {/* Body — muncul saat diklik */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5 space-y-4 border-t border-indigo-200"
        >
          <p className="text-xs text-slate-600 mt-4 leading-relaxed">{description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bullets.map((b, i) => (
              <div key={i} className="bg-white rounded-xl border border-indigo-100 p-3 flex items-start gap-2.5 hover:shadow-sm transition-shadow">
                <span className="text-lg flex-shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{b.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{b.text}</p>
                </div>
              </div>
            ))}
          </div>

          {tip && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-base flex-shrink-0">💡</span>
              <div>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-1">Tips untuk Owner</p>
                <p className="text-[10px] text-amber-700 leading-relaxed">{tip}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-black text-gray-900">
            {typeof p.value === 'number' && p.value > 1000 ? fmtRp(p.value) : p.value?.toLocaleString?.('id-ID') ?? p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function ExecutiveSummaryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState<'profitability' | 'cash' | 'receivable' | 'doctor' | 'inventory' | 'kpi' | 'trend' | 'branch'>('profitability')
  const [selectedBucket, setSelectedBucket] = useState<any>(null)

  useEffect(() => { setIsClient(true) }, [])

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await api.get('/executive/executive-summary')
      setData(res.data)
    } catch (e) {
      console.error('Executive summary error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Executive Summary...</p>
      </div>
    )
  }

  const p = data?.profitability || {}
  const cb = data?.cashBank || {}
  const ag = data?.aging || {}
  const dp = data?.doctorPerformance || {}
  const inv = data?.inventoryFinancial || {}
  const kpi = data?.kpi || {}
  const mt = data?.monthlyTrend || []
  const br = data?.branchRanking || []

  const TABS = [
    { key: 'profitability', label: '💰 Profitabilitas' },
    { key: 'cash',         label: '🏦 Kas & Bank' },
    { key: 'receivable',   label: '📋 Piutang Aging' },
    { key: 'doctor',       label: '👨‍⚕️ Kinerja Dokter' },
    { key: 'inventory',    label: '📦 Inventaris' },
    { key: 'kpi',          label: '🎯 KPI Bisnis' },
    { key: 'trend',        label: '📈 Tren 12 Bulan' },
    { key: 'branch',       label: '🏢 Antar Cabang' },
  ]

  return (
    <div className="space-y-6 pb-12 w-full">

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FiBarChart2 className="w-4 h-4 text-indigo-300" />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">
                Laporan Eksekutif · Keuangan &amp; Bisnis
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Summary</h1>
            <p className="text-sm text-white/50 mt-1">
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })} · Data real-time dari semua sumber
            </p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95">
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Top KPI Strip */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Revenue Bulan Ini', value: fmtRp(p.thisMonth?.revenue || 0), trend: p.mom?.revenue, icon: FiTrendingUp, color: 'text-emerald-400' },
            { label: 'Net Profit Bulan Ini', value: fmtRp(p.thisMonth?.profit || 0), trend: p.mom?.profit, icon: FiDollarSign, color: (p.thisMonth?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'Total Kas & Bank', value: fmtRp(cb.total || 0), trend: null, icon: FiCreditCard, color: 'text-sky-400' },
            { label: 'Total Piutang', value: fmtRp((ag.totalReceivable || 0) + (ag.unpaidRegular || 0)), trend: null, icon: FiAlertTriangle, color: 'text-amber-400' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  {item.trend !== null && <TrendBadge value={item.trend} />}
                </div>
                <p className="text-lg font-black text-white">{item.value}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: PROFITABILITAS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'profitability' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiDollarSign} title="Analisa Profitabilitas" subtitle="Pendapatan · Pengeluaran · Margin" badge="Bulan ini vs Lalu" />

          <TabInfoBox
            emoji="💰"
            title="Tab ini menampilkan: Apakah klinik untung atau rugi bulan ini?"
            description="Profitabilitas adalah inti dari kesehatan bisnis klinik. Tab ini membandingkan semua uang yang masuk (Revenue) dengan semua uang yang keluar (Pengeluaran), lalu menghitung berapa keuntungan bersih (Net Profit) yang benar-benar dikantongi klinik setelah semua biaya terbayar."
            bullets={[
              { icon: '📈', label: 'Revenue (Pendapatan)', text: 'Total uang yang masuk dari pembayaran pasien bulan ini. Angka ini diambil dari invoice yang sudah LUNAS melalui sistem jurnal akuntansi.' },
              { icon: '📉', label: 'Pengeluaran (Expense)', text: 'Total biaya operasional: gaji, obat, listrik, komisi dokter, dll. Semakin kecil angka ini (tanpa mengorbankan layanan), semakin baik.' },
              { icon: '💵', label: 'Net Profit (Laba Bersih)', text: 'Revenue dikurangi Pengeluaran. Ini uang yang BENAR-BENAR tersisa untuk klinik. Idealnya di atas 20-30% dari Revenue.' },
              { icon: '📊', label: 'Profit Margin (%)', text: 'Persentase keuntungan dari setiap Rp 100 pendapatan. Contoh: Margin 30% berarti dari Rp 100 pemasukan, Rp 30 adalah laba bersih.' },
              { icon: '🔼', label: 'MoM (Month-over-Month)', text: 'Perbandingan bulan ini vs bulan lalu. Tanda +8% artinya pendapatan naik 8% dibanding bulan sebelumnya. Hijau = naik, Merah = turun.' },
              { icon: '📅', label: 'YoY (Year-over-Year)', text: 'Perbandingan tahun ini vs tahun lalu di periode yang sama. Ini menunjukkan pertumbuhan jangka panjang klinik Anda.' },
            ]}
            tip="Jika Net Profit berwarna MERAH artinya klinik sedang RUGI bulan ini — pengeluaran melebihi pendapatan. Segera tinjau pos pengeluaran terbesar di bagian akuntansi dan diskusikan dengan tim keuangan."
          />

          {/* P&L Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Revenue Bulan Ini', value: fmtRp(p.thisMonth?.revenue || 0),
                sub: `vs bulan lalu ${fmtRp(p.lastMonth?.revenue || 0)}`,
                trend: p.mom?.revenue, icon: FiTrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50',
              },
              {
                label: 'Pengeluaran Bulan Ini', value: fmtRp(p.thisMonth?.expense || 0),
                sub: `vs bulan lalu ${fmtRp(p.lastMonth?.expense || 0)}`,
                trend: null, icon: FiTrendingDown, color: 'text-rose-600', bg: 'bg-rose-50',
              },
              {
                label: 'Net Profit Bulan Ini', value: fmtRp(p.thisMonth?.profit || 0),
                sub: `Margin ${p.thisMonth?.margin?.toFixed(1) || 0}%`,
                trend: p.mom?.profit, icon: FiDollarSign,
                color: (p.thisMonth?.profit || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600',
                bg: (p.thisMonth?.profit || 0) >= 0 ? 'bg-indigo-50' : 'bg-rose-50',
              },
            ].map((c, i) => <KpiCard key={i} {...c} />)}
          </div>

          {/* Revenue vs Expense Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900">Revenue vs Pengeluaran vs Profit</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Perbandingan 12 bulan terakhir</p>
              </div>
            </div>
            {isClient && (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mt} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                      tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : `${(v / 1000).toFixed(0)}rb`} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* YoY Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Revenue Tahun Ini (YTD)', value: fmtRp(p.thisYear?.revenue || 0), cmp: fmtRp(p.lastYear?.revenue || 0), trend: p.yoy?.revenue, lbl: 'vs tahun lalu', icon: FiTrendingUp, color: 'emerald' },
              { label: 'Profit Tahun Ini (YTD)', value: fmtRp(p.thisYear?.profit || 0), cmp: fmtRp(p.lastYear?.profit || 0), trend: p.yoy?.profit, lbl: 'vs tahun lalu', icon: FiDollarSign, color: 'indigo' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                  <span className="text-xs font-black text-gray-700">{item.label}</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{item.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendBadge value={item.trend} />
                  <span className="text-[10px] text-gray-400">{item.lbl} ({item.cmp})</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: KAS & BANK
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'cash' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiCreditCard} title="Posisi Kas & Bank Real-time" subtitle="Saldo aktual semua rekening klinik" />

          <TabInfoBox
            emoji="🏦"
            title="Tab ini menampilkan: Berapa uang yang dimiliki klinik saat ini?"
            description="Likuiditas (kemampuan klinik membayar kewajiban) adalah nyawa operasional klinik. Tab ini menunjukkan saldo aktual di semua rekening bank yang terdaftar di sistem, serta memperkirakan berapa lama kas klinik bisa bertahan dengan pengeluaran yang berjalan saat ini."
            bullets={[
              { icon: '🏧', label: 'Total Kas & Bank', text: 'Jumlah uang yang ada di semua rekening bank klinik yang terhubung ke sistem akuntansi. Ini posisi likuiditas aktual hari ini.' },
              { icon: '🔥', label: 'Burn Rate Harian', text: 'Rata-rata berapa uang yang dikeluarkan klinik setiap hari (dihitung dari pengeluaran bulan ini dibagi 30). Semakin rendah, semakin efisien.' },
              { icon: '⏳', label: 'Cash Runway (Hari)', text: 'Perkiraan berapa hari kas klinik bisa bertahan TANPA pemasukan baru. Hijau (>90 hari) = aman. Kuning (30-90 hari) = perlu perhatian. Merah (<30 hari) = darurat!' },
              { icon: '📋', label: 'Daftar Rekening', text: 'Detail saldo per rekening bank: nama bank, nomor rekening, pemegang rekening, dan cabang yang menggunakan rekening tersebut.' },
              { icon: '🥧', label: 'Distribusi Saldo', text: 'Grafik pie yang menunjukkan proporsi saldo di masing-masing rekening. Berguna untuk melihat apakah dana terlalu terkonsentrasi di satu rekening.' },
            ]}
            tip="Jika Cash Runway di bawah 30 hari, ini TANDA BAHAYA! Segera evaluasi: apakah ada piutang yang bisa ditagih? Adakah pengeluaran yang bisa ditunda? Pertimbangkan fasilitas kredit darurat dari bank."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total Kas & Bank" value={fmtRp(cb.total || 0)} sub="Semua rekening gabungan" icon={FiCreditCard} color="text-sky-600" bg="bg-sky-50" />
            <KpiCard label="Burn Rate Harian" value={fmtRp(cb.burnRate || 0)} sub="Rata-rata pengeluaran/hari" icon={FiTrendingDown} color="text-amber-600" bg="bg-amber-50" />
            <KpiCard
              label="Cash Runway"
              value={`${cb.runway || 0} hari`}
              sub={cb.runway > 90 ? '✅ Likuiditas aman' : cb.runway > 30 ? '⚠️ Perhatikan kas' : '🚨 Kas kritis!'}
              icon={FiClock}
              color={cb.runway > 90 ? 'text-emerald-600' : cb.runway > 30 ? 'text-amber-600' : 'text-rose-600'}
              bg={cb.runway > 90 ? 'bg-emerald-50' : cb.runway > 30 ? 'bg-amber-50' : 'bg-rose-50'}
            />
          </div>

          {/* Bank Account List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="text-sm font-black text-gray-900">Daftar Rekening Bank</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Saldo per rekening</p>
            </div>
            <div className="divide-y divide-gray-50">
              {(cb.accounts || []).length === 0 ? (
                <div className="py-12 text-center text-gray-300">
                  <FiCreditCard className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">Belum ada data rekening</p>
                </div>
              ) : (cb.accounts || []).map((acc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg font-black text-indigo-300">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{acc.bankName}</p>
                      <p className="text-[10px] text-gray-400">{acc.accountNumber} · {acc.accountName}</p>
                      <p className="text-[9px] text-indigo-500 font-bold uppercase mt-0.5">📍 {acc.branch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-gray-900">{fmtRp(acc.balance || 0)}</p>
                    <p className={`text-[10px] font-bold ${acc.balance > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {acc.balance > 0 ? 'Aktif' : 'Kosong'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(cb.accounts || []).length > 0 && (
              <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Keseluruhan</span>
                <span className="text-lg font-black text-indigo-700">{fmtRp(cb.total || 0)}</span>
              </div>
            )}
          </div>

          {/* Cash vs Burn Rate Pie */}
          {isClient && (cb.accounts || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black text-gray-900 mb-4">Distribusi Saldo per Rekening</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cb.accounts} dataKey="balance" nameKey="bankName" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {(cb.accounts || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtRp(v)} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: PIUTANG AGING
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'receivable' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiAlertTriangle} title="Aging Piutang B2B / BPJS / Asuransi" subtitle="Monitoring penagihan berdasarkan umur piutang" badge={`Total: ${fmtRp(ag.totalReceivable || 0)}`} />

          <TabInfoBox
            emoji="📋"
            title="Tab ini menampilkan: Siapa yang masih berutang ke klinik dan sudah berapa lama?"
            description="Piutang adalah uang yang sudah menjadi hak klinik (layanan sudah diberikan) tapi BELUM dibayar oleh pihak ketiga seperti BPJS, perusahaan asuransi, atau perusahaan rekanan (B2B). Jika piutang terlalu lama tidak tertagih, ini akan mengganggu arus kas klinik meskipun klinik terlihat 'ramai pasien'."
            bullets={[
              { icon: '🟢', label: '0-30 Hari (Normal)', text: 'Piutang yang baru berumur kurang dari 1 bulan. Ini masih dalam batas wajar — proses klaim dan verifikasi biasanya membutuhkan waktu.' },
              { icon: '🟡', label: '31-60 Hari (Perhatian)', text: 'Piutang sudah 1-2 bulan belum dibayar. Mulai lakukan follow-up aktif ke pihak terkait (BPJS/asuransi/perusahaan).' },
              { icon: '🟠', label: '61-90 Hari (Waspada)', text: 'Piutang sudah hampir 3 bulan. Risiko gagal bayar semakin tinggi. Eskalasikan ke pejabat yang lebih tinggi di pihak debitor.' },
              { icon: '🔴', label: '>90 Hari (KRITIS)', text: 'Piutang sudah lebih dari 3 bulan — ini berpotensi menjadi piutang macet (bad debt) yang susah ditagih. Pertimbangkan jalur hukum atau write-off.' },
              { icon: '👥', label: 'Top Debitor', text: 'Daftar 5 mitra dengan piutang terbesar yang belum dibayar, beserta berapa hari sudah tertunggak.' },
              { icon: '📄', label: 'Piutang Pasien Umum', text: 'Invoice pasien umum (non-B2B) yang belum lunas. Ini terpisah dari piutang korporat.' },
            ]}
            tip="Strategi tagih yang efektif: (1) Kirim reminder otomatis di hari ke-7, 30, dan 60. (2) Untuk BPJS, pastikan berkas klaim lengkap agar tidak dikembalikan. (3) Buat PIC khusus penagihan untuk piutang >60 hari. (4) Negosiasikan jadwal pembayaran jika debitor kesulitan bayar sekaligus."
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Piutang B2B Total" value={fmtRp(ag.totalReceivable || 0)} sub="Corp / BPJS / Asuransi" icon={FiShield} color="text-indigo-600" bg="bg-indigo-50" />
            <KpiCard label="Piutang Pasien Umum" value={fmtRp(ag.unpaidRegular || 0)} sub={`${ag.unpaidRegularCount || 0} invoice`} icon={FiUsers} color="text-amber-600" bg="bg-amber-50" />
            <KpiCard label=">90 Hari (Kritis)" value={fmtRp(ag.buckets?.[3]?.value || 0)} sub={`${ag.buckets?.[3]?.count || 0} invoice`} icon={FiAlertTriangle} color="text-rose-600" bg="bg-rose-50" />
            <KpiCard label="Total Piutang Gabungan" value={fmtRp((ag.totalReceivable || 0) + (ag.unpaidRegular || 0))} sub="Semua kategori" icon={FiDollarSign} color="text-slate-600" bg="bg-slate-50" />
          </div>

          {/* Aging Buckets Visual */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 mb-5">Distribusi Umur Piutang B2B</h3>
            <div className="space-y-4">
              {(ag.buckets || []).map((bucket: any, i: number) => {
                const colorMap: Record<string, string> = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', orange: 'bg-orange-500', rose: 'bg-rose-500' }
                const textMap: Record<string, string> = { emerald: 'text-emerald-600', amber: 'text-amber-600', orange: 'text-orange-600', rose: 'text-rose-500' }
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedBucket(selectedBucket?.label === bucket.label ? null : bucket)}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colorMap[bucket.color]}`} />
                        <span className="text-xs font-bold text-gray-700">{bucket.label}</span>
                        <span className={`text-[10px] font-bold ${textMap[bucket.color]}`}>{bucket.count} invoice</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${textMap[bucket.color]}`}>{fmtRp(bucket.value)}</span>
                        <span className="text-[10px] text-gray-400 ml-2">({bucket.pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden cursor-pointer" onClick={() => setSelectedBucket(selectedBucket?.label === bucket.label ? null : bucket)}>
                      <div className={`h-full ${colorMap[bucket.color]} rounded-full transition-all`} style={{ width: `${bucket.pct}%` }} />
                    </div>
                    
                    {/* DETAILS LIST EXPANDED */}
                    {selectedBucket?.label === bucket.label && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                        {(bucket.details || []).length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">Tidak ada data invoice</div>
                        ) : (
                          <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-100/80 sticky top-0 backdrop-blur-md">
                                <tr>
                                  <th className="px-4 py-2 font-black text-[9px] uppercase tracking-widest text-gray-500">Tanggal</th>
                                  <th className="px-4 py-2 font-black text-[9px] uppercase tracking-widest text-gray-500">Mitra / Pasien</th>
                                  <th className="px-4 py-2 font-black text-[9px] uppercase tracking-widest text-gray-500">Umur</th>
                                  <th className="px-4 py-2 text-right font-black text-[9px] uppercase tracking-widest text-gray-500">Total Invoice</th>
                                  <th className="px-4 py-2 text-right font-black text-[9px] uppercase tracking-widest text-gray-500">Outstanding</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {bucket.details.map((inv: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-white transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap text-gray-600 font-medium">
                                      {format(new Date(inv.invoiceDate), 'dd MMM yyyy', { locale: id })}
                                    </td>
                                    <td className="px-4 py-2">
                                      <p className="font-bold text-gray-800">{inv.name}</p>
                                      <p className="text-[9px] text-indigo-500 font-bold uppercase mt-0.5">{inv.type}</p>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colorMap[bucket.color]} text-white`}>{inv.days} hari</span>
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold text-gray-500">
                                      {fmtRp(inv.total)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-black text-rose-600">
                                      {fmtRp(inv.outstanding)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Debtors */}
          {(ag.topDebtors || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-900">Top Debitor Terbesar</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Piutang terlama / terbesar</p>
              </div>
              <div className="divide-y divide-gray-50">
                {ag.topDebtors.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${d.days > 90 ? 'bg-rose-50 text-rose-600' : d.days > 60 ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{d.partner}</p>
                        <p className="text-[9px] text-gray-400">{d.type} · Cabang: {d.branch}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{fmtRp(d.amount)}</p>
                      <p className={`text-[10px] font-bold ${d.days > 90 ? 'text-rose-500' : d.days > 60 ? 'text-orange-500' : 'text-amber-500'}`}>
                        {d.days} hari
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(ag.topDebtors || []).length === 0 && ag.totalReceivable === 0 && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-8 text-center">
              <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-700">Tidak ada piutang B2B yang outstanding</p>
              <p className="text-sm text-emerald-600 mt-1">Semua tagihan corporate sudah terbayar</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: KINERJA DOKTER
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'doctor' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiUsers} title="Kinerja Finansial Dokter" subtitle="Revenue · Komisi · Net Kontribusi" badge={dp.period || ''} />

          <TabInfoBox
            emoji="👨‍⚕️"
            title="Tab ini menampilkan: Dokter mana yang paling menguntungkan klinik?"
            description="Tab ini bukan untuk menilai kemampuan medis dokter, melainkan untuk memahami kontribusi finansial setiap dokter terhadap klinik. Dengan data ini, Owner bisa membuat keputusan tentang sistem insentif, jadwal praktek, dan strategi rekrutmen dokter yang lebih tepat."
            bullets={[
              { icon: '💰', label: 'Revenue per Dokter', text: 'Total nilai invoice yang terbayar dari pasien yang ditangani dokter tersebut bulan ini. Semakin tinggi, semakin banyak kontribusi pendapatannya.' },
              { icon: '💸', label: 'Komisi Dokter', text: 'Total jasa/komisi yang harus dibayarkan klinik ke dokter atas pelayanan yang diberikan. Ini adalah biaya langsung yang dikurangi dari revenue dokter.' },
              { icon: '📊', label: 'Net Kontribusi', text: 'Revenue DIKURANGI komisi dokter. Ini adalah nilai bersih yang tersisa untuk klinik setelah membayar dokter. Angka ini yang paling penting bagi Owner.' },
              { icon: '⚖️', label: 'Rasio Komisi (%)', text: 'Berapa persen dari revenue dokter yang harus dibayarkan sebagai komisi. Ideal di bawah 30%. Jika di atas 40% (merah), perlu evaluasi struktur komisi.' },
              { icon: '👤', label: 'ARPV (Avg Revenue/Visit)', text: 'Rata-rata pendapatan per kunjungan pasien untuk dokter tersebut. Dokter dengan ARPV tinggi biasanya menangani kasus kompleks atau poli spesialis.' },
              { icon: '📅', label: 'Jumlah Pasien', text: 'Berapa banyak pasien yang ditangani dokter ini bulan ini. Kombinasi pasien banyak + ARPV tinggi = dokter paling produktif.' },
            ]}
            tip="Dokter dengan Net Kontribusi NEGATIF bisa terjadi jika komisi yang disepakati terlalu tinggi atau pasien yang ditangani sedikit. Ini bukan berarti dokter tersebut buruk — bisa jadi spesialisasinya membutuhkan waktu untuk membangun reputasi. Evaluasi per 3 bulan, bukan per bulan."
          />

          {(dp.data || []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-300">
              <FiUsers className="w-12 h-12 mx-auto mb-3" />
              <p className="font-bold">Belum ada data dokter bulan ini</p>
            </div>
          ) : (
            <>
              {/* Top Doctor Bar Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-900 mb-4">Revenue per Dokter (Bulan Ini)</h3>
                {isClient && (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dp.data.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : `${(v / 1_000).toFixed(0)}rb`} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#374151', fontWeight: 700 }}
                          width={80} tickFormatter={(v: string) => v.split(' ').slice(-1)[0]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]}>
                          {dp.data.slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Doctor Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['#', 'Dokter', 'Spesialis', 'Pasien', 'Revenue', 'Komisi', 'Net Kontribusi', 'Rasio Komisi', 'ARPV'].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dp.data.map((doc: any, i: number) => (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{doc.name}</td>
                          <td className="px-4 py-3 text-gray-500">{doc.specialization || '-'}</td>
                          <td className="px-4 py-3 font-bold text-gray-700">{doc.patients}</td>
                          <td className="px-4 py-3 font-black text-emerald-700">{fmtRp(doc.revenue)}</td>
                          <td className="px-4 py-3 text-rose-600 font-bold">{fmtRp(doc.commission)}</td>
                          <td className={`px-4 py-3 font-black ${doc.netContribution >= 0 ? 'text-indigo-700' : 'text-rose-500'}`}>
                            {fmtRp(doc.netContribution)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${doc.commissionRatio > 40 ? 'bg-rose-500' : doc.commissionRatio > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(doc.commissionRatio, 100)}%` }} />
                              </div>
                              <span className={`font-bold ${doc.commissionRatio > 40 ? 'text-rose-500' : doc.commissionRatio > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {doc.commissionRatio}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-700">{fmtRp(doc.arpv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: INVENTARIS FINANSIAL
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiPackage} title="Nilai Inventaris Finansial" subtitle="Total stok · Expired · Dead stock" />

          <TabInfoBox
            emoji="📦"
            title="Tab ini menampilkan: Berapa nilai aset obat & alkes yang dimiliki klinik?"
            description="Stok obat dan alat kesehatan adalah aset berharga klinik yang sering tidak diperhitungkan. Tab ini menghitung nilai finansial total inventaris — bukan hanya jumlah unit, tapi nilai rupiahnya. Ini juga mendeteksi potensi kerugian dari obat kadaluarsa atau stok yang tidak bergerak (dead stock)."
            bullets={[
              { icon: '💎', label: 'Total Nilai Inventaris', text: 'Nilai rupiah dari semua stok obat & alkes yang ada di gudang (jumlah unit × harga beli per unit). Ini adalah aset lancar klinik yang berwujud barang.' },
              { icon: '☠️', label: 'Nilai Stok Expired', text: 'Nilai rupiah dari obat/alkes yang SUDAH KADALUARSA tapi belum dimusnahkan. Ini adalah KERUGIAN NYATA — barang tidak bisa dijual tapi sudah dibeli.' },
              { icon: '🪦', label: 'Dead Stock', text: 'Obat/alkes yang stoknya sangat banyak tapi jarang dipakai (perputaran sangat lambat). Ini adalah modal yang "terkunci" dan tidak produktif.' },
              { icon: '💚', label: 'Rasio Sehat Inventaris', text: 'Persentase stok yang aktif dan likuid (tidak expired, tidak dead stock). Semakin tinggi angkanya, semakin efisien manajemen stok klinik.' },
              { icon: '🥧', label: 'Distribusi per Kategori', text: 'Grafik proporsi nilai stok berdasarkan jenis produk (obat, alkes, bahan habis pakai, dll). Berguna untuk melihat alokasi modal di setiap kategori.' },
              { icon: '🏆', label: 'Top 10 Produk Bernilai', text: 'Daftar 10 produk dengan nilai stok tertinggi. Produk ini perlu pengawasan ekstra karena mewakili porsi besar dari aset inventaris klinik.' },
            ]}
            tip="Langkah nyata mengurangi kerugian inventaris: (1) Atur jadwal review stok expired setiap bulan. (2) Terapkan sistem FIFO (First In First Out) — obat yang lebih dulu masuk, lebih dulu digunakan. (3) Untuk dead stock, pertimbangkan retur ke supplier atau transfer ke cabang lain yang lebih membutuhkan."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Total Nilai Inventaris" value={fmtRp(inv.totalValue || 0)} sub="Semua stok aktif" icon={FiPackage} color="text-indigo-600" bg="bg-indigo-50" />
            <KpiCard label="Nilai Stok Expired" value={fmtRp(inv.expiredValue || 0)} sub="Potensi kerugian" icon={FiAlertTriangle} color="text-rose-600" bg="bg-rose-50" />
            <KpiCard label="Dead Stock" value={fmtRp(inv.deadStockValue || 0)} sub={`${inv.deadStockCount || 0} produk perputaran lambat`} icon={FiClock} color="text-amber-600" bg="bg-amber-50" />
            <KpiCard
              label="Rasio Sehat Inventaris"
              value={`${inv.totalValue > 0 ? Math.round(((inv.totalValue - inv.expiredValue - inv.deadStockValue) / inv.totalValue) * 100) : 100}%`}
              sub="Stok aktif & likuid"
              icon={FiCheckCircle}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Pie */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black text-gray-900 mb-4">Distribusi Nilai per Kategori</h3>
              {isClient && (inv.categoryBreakdown || []).length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={inv.categoryBreakdown} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3}>
                        {(inv.categoryBreakdown || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmtRp(v)} />
                      <Legend formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-300 text-xs">Tidak ada data</div>
              )}
            </div>

            {/* Top 10 Products Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h3 className="text-sm font-black text-gray-900">Top 10 Produk Bernilai Tertinggi</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[280px] overflow-y-auto">
                {(inv.top10 || []).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-black text-gray-300 w-5">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[9px] text-gray-400">{p.code} · {p.branch} · Qty: {p.qty.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-indigo-700 flex-shrink-0 ml-3">{fmtRp(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 6: KPI BISNIS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'kpi' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiActivity} title="KPI Scorecard Bisnis Klinik" subtitle="Metrik kunci performa operasional & finansial" badge="Bulan ini" />

          <TabInfoBox
            emoji="🎯"
            title="Tab ini menampilkan: Seberapa sehat & efisien klinik secara keseluruhan?"
            description="KPI (Key Performance Indicator) adalah indikator standar yang digunakan industri layanan kesehatan untuk mengukur performa bisnis klinik. Setiap angka di sini memiliki target benchmark — warna hijau berarti klinik sudah di atas standar, kuning berarti perlu perhatian, merah berarti perlu tindakan segera."
            bullets={[
              { icon: '💵', label: 'ARPV (Avg Revenue Per Visit)', text: 'Rata-rata pendapatan klinik dari SETIAP kunjungan pasien. Jika Rp 200rb, berarti setiap pasien yang datang menghasilkan rata-rata Rp 200rb. Target: Rp 150rb-300rb.' },
              { icon: '🏭', label: 'Cost per Patient', text: 'Rata-rata biaya operasional klinik untuk melayani SATU pasien. Jika ARPV lebih tinggi dari Cost per Patient, klinik untung. Jika terbalik, klinik rugi per pasien.' },
              { icon: '📊', label: 'Gross Profit Margin', text: 'Persentase keuntungan kotor dari total pendapatan. Angka >30% dianggap sehat untuk klinik. Di bawah 20% adalah sinyal bahaya.' },
              { icon: '🔄', label: 'Patient Retention Rate', text: 'Persentase pasien yang KEMBALI berobat ke klinik dalam bulan yang sama. Angka tinggi (>40%) berarti pasien puas dan klinik memiliki loyalitas pasien yang baik.' },
              { icon: '❌', label: 'No-Show Rate', text: 'Persentase pasien yang membuat janji temu (appointment) tapi TIDAK datang. Angka ideal di bawah 10%. No-show yang tinggi menyebabkan slot dokter terbuang sia-sia.' },
              { icon: '✅', label: 'Tabel Benchmark', text: 'Perbandingan nilai aktual vs target industri untuk setiap KPI, dengan status ✅ Aman / ⚠️ Perhatian / 🚨 Kritis secara otomatis.' },
            ]}
            tip="KPI yang paling kritis untuk dimonitor SETIAP MINGGU adalah: (1) ARPV — jika turun, bisa jadi pasien beralih ke layanan yang lebih murah. (2) No-Show Rate — jika naik, perlu sistem pengingat janji temu yang lebih baik. (3) Retention Rate — jika turun, segera survey kepuasan pasien."
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'ARPV (Avg Revenue/Visit)', value: fmtRp(kpi.arpv || 0), sub: 'Per kunjungan pasien', icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: null },
              { label: 'Cost per Patient', value: fmtRp(kpi.costPerPatient || 0), sub: 'Biaya per pasien ditangani', icon: FiTrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', trend: null },
              { label: 'Gross Profit Margin', value: `${kpi.grossMargin || 0}%`, sub: kpi.grossMargin >= 30 ? '✅ Sehat (>30%)' : '⚠️ Di bawah target', icon: FiBarChart2, color: kpi.grossMargin >= 30 ? 'text-emerald-600' : 'text-amber-600', bg: kpi.grossMargin >= 30 ? 'bg-emerald-50' : 'bg-amber-50', trend: null },
              { label: 'Patient Retention Rate', value: `${kpi.retentionRate || 0}%`, sub: kpi.retentionRate >= 40 ? '✅ Baik (>40%)' : '💡 Perlu ditingkatkan', icon: FiUsers, color: kpi.retentionRate >= 40 ? 'text-emerald-600' : 'text-amber-600', bg: kpi.retentionRate >= 40 ? 'bg-emerald-50' : 'bg-amber-50', trend: null },
              { label: 'No-Show Rate', value: `${kpi.noShowRate || 0}%`, sub: kpi.noShowRate <= 10 ? '✅ Terkendali (<10%)' : '⚠️ Tinggi', icon: FiAlertTriangle, color: kpi.noShowRate <= 10 ? 'text-emerald-600' : 'text-rose-600', bg: kpi.noShowRate <= 10 ? 'bg-emerald-50' : 'bg-rose-50', trend: null },
              { label: 'Pasien Bulan Ini', value: kpi.thisMonthPatients?.toLocaleString() || '0', sub: `vs bulan lalu: ${kpi.lastMonthPatients || 0}`, icon: FiUserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: kpi.momPatients },
              { label: 'Total Pasien', value: kpi.totalPatients?.toLocaleString() || '0', sub: 'Database keseluruhan', icon: FiUsers, color: 'text-sky-600', bg: 'bg-sky-50', trend: null },
              { label: 'Margin Tahun Ini', value: `${p.thisYear?.margin?.toFixed(1) || 0}%`, sub: `YTD vs ${p.lastYear?.margin?.toFixed(1) || 0}% tahun lalu`, icon: FiTrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', trend: p.yoy?.profit },
            ].map((item, i) => <KpiCard key={i} {...item} />)}
          </div>

          {/* KPI Benchmark Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="text-sm font-black text-gray-900">Benchmark KPI Klinik</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Status aktual vs target industri</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { metric: 'ARPV', actual: `Rp ${(kpi.arpv || 0).toLocaleString('id-ID')}`, target: 'Rp 150.000 – 300.000', status: kpi.arpv >= 150000 ? 'ok' : 'warn' },
                { metric: 'Gross Profit Margin', actual: `${kpi.grossMargin || 0}%`, target: '> 30%', status: (kpi.grossMargin || 0) >= 30 ? 'ok' : 'warn' },
                { metric: 'Patient Retention Rate', actual: `${kpi.retentionRate || 0}%`, target: '> 40%', status: (kpi.retentionRate || 0) >= 40 ? 'ok' : 'warn' },
                { metric: 'No-Show Rate', actual: `${kpi.noShowRate || 0}%`, target: '< 10%', status: (kpi.noShowRate || 0) <= 10 ? 'ok' : 'bad' },
                { metric: 'Cash Runway', actual: `${cb.runway || 0} hari`, target: '> 90 hari', status: (cb.runway || 0) >= 90 ? 'ok' : (cb.runway || 0) >= 30 ? 'warn' : 'bad' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <span className="text-xs font-bold text-gray-700">{row.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-gray-900">{row.actual}</span>
                    <span className="text-[10px] text-gray-400">Target: {row.target}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full ${row.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : row.status === 'warn' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}`}>
                      {row.status === 'ok' ? '✅ Aman' : row.status === 'warn' ? '⚠️ Perhatian' : '🚨 Kritis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 7: TREN 12 BULAN (MoM/YoY)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'trend' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiTrendingUp} title="Tren 12 Bulan Terakhir" subtitle="Month-over-Month & Year-over-Year analysis" />

          <TabInfoBox
            emoji="📈"
            title="Tab ini menampilkan: Apakah klinik tumbuh atau stagnan dalam 1 tahun terakhir?"
            description="Satu bulan data bisa menyesatkan — mungkin memang musim sepi, atau ada hari libur panjang. Tab Tren menampilkan data 12 bulan berturut-turut sehingga Owner bisa melihat pola jangka panjang, musiman (seasonality), dan apakah klinik benar-benar bertumbuh atau hanya fluktuasi normal."
            bullets={[
              { icon: '📅', label: 'MoM (Month-over-Month)', text: 'Perbandingan bulan ini vs bulan sebelumnya dalam persentase. Contoh: MoM Revenue +12% berarti pendapatan bulan ini lebih tinggi 12% dari bulan lalu.' },
              { icon: '🗓️', label: 'YoY (Year-over-Year)', text: 'Perbandingan periode ini vs periode yang sama tahun lalu. Ini lebih akurat karena menghilangkan efek musiman. YoY +25% artinya klinik tumbuh 25% secara tahunan.' },
              { icon: '📉', label: 'Grafik Area 3-Garis', text: 'Visualisasi Revenue (hijau), Pengeluaran (merah), dan Net Profit (ungu) selama 12 bulan. Idealnya Revenue dan Profit terus naik, Pengeluaran naik lebih lambat.' },
              { icon: '🎨', label: 'Grafik Margin Bulanan', text: 'Bar chart warna otomatis: HIJAU jika margin ≥30%, KUNING jika 15-29%, MERAH jika <15%. Langsung terlihat bulan mana yang perlu dievaluasi.' },
              { icon: '👥', label: 'Tren Jumlah Pasien', text: 'Grafik jumlah kunjungan pasien per bulan. Jika pasien terus naik tapi revenue stagnan — berarti harga terlalu murah atau banyak pasien BPJS subsidi.' },
              { icon: '🌊', label: 'Seasonality (Musiman)', text: 'Pola berulang yang terjadi setiap tahun. Contoh: biasanya ramai di bulan-bulan tertentu dan sepi saat lebaran. Gunakan data ini untuk merencanakan promosi.' },
            ]}
            tip="Cara membaca tren dengan benar: Jangan panik jika satu bulan turun — lihat apakah ada pola musiman. Yang perlu dikhawatirkan adalah jika TIGA bulan berturut-turut terus turun (downtrend). Itu sinyal bahwa ada masalah struktural yang perlu segera ditangani, bukan sekadar musim sepi."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="MoM Revenue" value={fmtPct(p.mom?.revenue) || '—'} sub="vs bulan lalu" icon={FiTrendingUp} color="text-emerald-600" bg="bg-emerald-50" trend={p.mom?.revenue} />
            <KpiCard label="MoM Net Profit" value={fmtPct(p.mom?.profit) || '—'} sub="vs bulan lalu" icon={FiDollarSign} color="text-indigo-600" bg="bg-indigo-50" trend={p.mom?.profit} />
            <KpiCard label="YoY Revenue" value={fmtPct(p.yoy?.revenue) || '—'} sub="vs tahun lalu" icon={FiBarChart2} color="text-sky-600" bg="bg-sky-50" trend={p.yoy?.revenue} />
            <KpiCard label="YoY Net Profit" value={fmtPct(p.yoy?.profit) || '—'} sub="vs tahun lalu" icon={FiTrendingUp} color="text-violet-600" bg="bg-violet-50" trend={p.yoy?.profit} />
          </div>

          {/* 12-Month Revenue Area Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 mb-4">Tren Revenue, Pengeluaran & Profit — 12 Bulan</h3>
            {isClient && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mt} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                      tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : `${(v / 1000).toFixed(0)}rb`} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                    <Area name="Revenue" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#gRev)" />
                    <Area name="Pengeluaran" type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#gExp)" />
                    <Area name="Net Profit" type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2.5} fill="url(#gPro)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Margin Trend Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 mb-4">Tren Profit Margin (%) — 12 Bulan</h3>
            {isClient && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mt} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                      tickFormatter={(v) => `${v}%`} width={40} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Margin']} />
                    <Bar dataKey="margin" name="Profit Margin" radius={[4, 4, 0, 0]}>
                      {mt.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.margin >= 30 ? '#10b981' : entry.margin >= 15 ? '#f59e0b' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Patients Trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-black text-gray-900 mb-4">Tren Jumlah Pasien — 12 Bulan</h3>
            {isClient && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mt} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gPat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} width={36} />
                    <Tooltip />
                    <Area name="Pasien" type="monotone" dataKey="patients" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gPat)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 8: RANKING CABANG
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'branch' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <SectionHeader icon={FiHome} title="Ranking Performa Antar Cabang" subtitle="Perbandingan revenue · profit · efisiensi" badge="Bulan ini" />

          <TabInfoBox
            emoji="🏢"
            title="Tab ini menampilkan: Cabang mana yang paling menguntungkan dan paling efisien?"
            description="Untuk klinik dengan lebih dari satu cabang, tab ini adalah 'rapor nilai' masing-masing cabang. Bukan hanya siapa yang paling ramai, tapi siapa yang paling MENGUNTUNGKAN dan paling EFISIEN. Cabang ramai tapi pengeluaran tinggi bisa jadi lebih merugikan daripada cabang yang lebih sepi tapi efisien."
            bullets={[
              { icon: '🥇', label: 'Revenue Ranking', text: 'Peringkat cabang berdasarkan total pendapatan bulan ini. Cabang dengan Revenue tertinggi mendapat medali 🥇. Berguna untuk melihat cabang mana yang menjadi tulang punggung bisnis.' },
              { icon: '💹', label: 'Net Profit per Cabang', text: 'Keuntungan bersih setelah dikurangi semua pengeluaran operasional cabang tersebut. Ini lebih penting dari Revenue — cabang bisa ramai tapi tetap rugi jika biaya tinggi.' },
              { icon: '📊', label: 'Profit Margin (%)', text: 'Persentase keuntungan dari pendapatan cabang. Warna: Hijau (≥30%) = efisien, Kuning (15-29%) = cukup, Merah (<15%) = perlu perbaikan segera.' },
              { icon: '💵', label: 'ARPV per Cabang', text: 'Rata-rata pendapatan per kunjungan pasien di setiap cabang. Jika cabang A lebih tinggi dari cabang B, bisa jadi karena layanan lebih premium atau dokter spesialis.' },
              { icon: '⚡', label: 'Cost per Patient (Efisiensi)', text: 'Berapa biaya operasional yang dikeluarkan untuk melayani satu pasien di cabang tersebut. Semakin rendah (dengan layanan tetap berkualitas), semakin efisien.' },
              { icon: '📦', label: 'Stok per Cabang', text: 'Jumlah unit stok yang ada di cabang tersebut. Berguna untuk memastikan tidak ada penumpukan berlebihan di satu cabang dan kekurangan di cabang lain.' },
            ]}
            tip="Jangan langsung menutup cabang yang performa rendah. Pertimbangkan: (1) Apakah cabang tersebut masih baru (<1 tahun)? (2) Apakah ada faktor eksternal (lokasi baru, dokter baru)? (3) Apakah cabang itu strategis untuk ekspansi masa depan? Diskusikan dengan tim operasional sebelum mengambil keputusan besar."
          />

          {br.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center text-gray-300">
              <FiHome className="w-12 h-12 mx-auto mb-2" />
              <p className="font-bold">Tidak ada data cabang</p>
            </div>
          ) : (
            <>
              {/* Branch Bar Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-900 mb-4">Revenue & Profit per Cabang</h3>
                {isClient && (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={br} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : `${(v / 1000).toFixed(0)}rb`} width={48} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Net Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Branch Ranking Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {br.map((branch: any, i: number) => (
                  <div key={branch.id} className={`bg-white rounded-2xl border shadow-sm p-5 relative overflow-hidden ${i === 0 ? 'border-amber-200' : i === 1 ? 'border-gray-200' : 'border-gray-100'}`}>
                    {i === 0 && <div className="absolute top-3 right-3 text-lg">🥇</div>}
                    {i === 1 && <div className="absolute top-3 right-3 text-lg">🥈</div>}
                    {i === 2 && <div className="absolute top-3 right-3 text-lg">🥉</div>}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                        {branch.code}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{branch.name}</p>
                        {branch.isMain && <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">Pusat</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Revenue', value: fmtRp(branch.revenue), color: 'text-emerald-700' },
                        { label: 'Net Profit', value: fmtRp(branch.profit), color: branch.profit >= 0 ? 'text-indigo-700' : 'text-rose-500' },
                        { label: 'Margin', value: `${branch.margin}%`, color: branch.margin >= 30 ? 'text-emerald-600' : 'text-amber-600' },
                        { label: 'Pasien', value: branch.patients.toLocaleString(), color: 'text-sky-700' },
                        { label: 'ARPV', value: fmtRp(branch.arpv), color: 'text-gray-700' },
                        { label: 'Cost/Pasien', value: fmtRp(branch.efficiency), color: 'text-gray-500' },
                      ].map((item, j) => (
                        <div key={j} className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</span>
                          <span className={`text-xs font-black ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Efficiency Matrix */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-900 mb-4">Matriks Efisiensi Cabang</h3>
                {isClient && (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={br} layout="vertical" margin={{ top: 0, right: 40, left: 60, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#374151', fontWeight: 700 }} width={60} />
                        <Tooltip formatter={(v: any) => [`${v}%`, 'Margin']} />
                        <Bar dataKey="margin" name="Profit Margin" radius={[0, 4, 4, 0]}>
                          {br.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.margin >= 30 ? '#10b981' : entry.margin >= 15 ? '#f59e0b' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center py-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
        Executive Summary · Data diperbarui: {data?.generatedAt ? format(new Date(data.generatedAt), 'dd MMM yyyy HH:mm', { locale: id }) : '—'}
      </div>
    </div>
  )
}
