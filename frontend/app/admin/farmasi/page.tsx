'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import {
  Pill, ClipboardList, CheckCircle, Clock, AlertTriangle,
  RefreshCw, ArrowRight, Package, Activity, ChevronRight,
  CalendarClock, ShieldAlert, Beaker, TrendingUp, Users
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PharmacyStats {
  pending: number
  preparing: number
  ready: number
  dispensedToday: number
  totalToday: number
}

interface StockAlert {
  productId: string
  productName: string
  productCode: string
  onHandQty: number
  minStockAlert: number
}

interface ExpiryAlert {
  batchId: string
  productName: string
  batchNumber: string
  expiryDate: string
  currentQty: number
  daysLeft: number
}

interface RecentPrescription {
  id: string
  prescriptionNo: string
  prescriptionDate: string
  dispenseStatus: 'pending' | 'preparing' | 'ready' | 'dispensed'
  patient: { name: string; medicalRecordNo: string }
  doctor: { name: string }
  items: any[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:    { label: 'Menunggu',  color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  preparing:  { label: 'Diramu',    color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  ready:      { label: 'Siap',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  dispensed:  { label: 'Diserahkan',color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-300' },
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, bg, border, delay = 0, href
}: {
  icon: any; label: string; value: number | string; sub?: string
  color: string; bg: string; border: string; delay?: number; href?: string
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-2xl border ${border} shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all ${href ? 'cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
        {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FarmasiDashboard() {
  const { activeClinicId, user } = useAuthStore()

  const [stats, setStats] = useState<PharmacyStats>({ pending: 0, preparing: 0, ready: 0, dispensedToday: 0, totalToday: 0 })
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<RecentPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchAll = useCallback(async (silent = false) => {
    if (!activeClinicId) return
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [queueRes, stockRes] = await Promise.all([
        api.get('/pharmacy/queues', { params: { clinicId: activeClinicId } }),
        api.get('/inventory/stocks', { params: { branchId: activeClinicId, limit: 200 } }),
      ])

      const prescriptions: RecentPrescription[] = queueRes.data ?? []

      // Compute stats from queue
      const today = new Date().toDateString()
      const todayRx = prescriptions.filter(p =>
        new Date(p.prescriptionDate).toDateString() === today
      )
      setStats({
        pending:        prescriptions.filter(p => p.dispenseStatus === 'pending').length,
        preparing:      prescriptions.filter(p => p.dispenseStatus === 'preparing').length,
        ready:          prescriptions.filter(p => p.dispenseStatus === 'ready').length,
        dispensedToday: todayRx.filter(p => p.dispenseStatus === 'dispensed').length,
        totalToday:     todayRx.length,
      })

      // Recent 8 prescriptions (non-dispensed first, then dispensed)
      const sorted = [...prescriptions].sort((a, b) => {
        const order = { pending: 0, preparing: 1, ready: 2, dispensed: 3 }
        return (order[a.dispenseStatus] ?? 9) - (order[b.dispenseStatus] ?? 9)
      })
      setRecentPrescriptions(sorted.slice(0, 8))

      // Stock alerts
      const stocks: any[] = stockRes.data ?? []
      const low = stocks
        .filter(s => s.minStockAlert > 0 && s.onHandQty <= s.minStockAlert)
        .map(s => ({
          productId: s.productId,
          productName: s.product?.productName ?? '-',
          productCode: s.product?.productCode ?? '-',
          onHandQty: s.onHandQty,
          minStockAlert: s.minStockAlert,
        }))
        .slice(0, 10)
      setStockAlerts(low)

      // Expiry alerts (batches expiring within 90 days)
      const now = Date.now()
      const expiring = stocks
        .filter(s => s.batch?.expiryDate)
        .map(s => {
          const exp = new Date(s.batch.expiryDate)
          const daysLeft = Math.ceil((exp.getTime() - now) / 86_400_000)
          return {
            batchId: s.batchId,
            productName: s.product?.productName ?? '-',
            batchNumber: s.batch.batchNumber,
            expiryDate: s.batch.expiryDate,
            currentQty: s.onHandQty,
            daysLeft,
          }
        })
        .filter(e => e.daysLeft <= 90 && e.daysLeft >= 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 10)
      setExpiryAlerts(expiring)

      setLastUpdated(new Date())
    } catch (err) {
      console.error('[FarmasiDashboard] fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeClinicId])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const today = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full animate-spin border-2 border-gray-100 border-t-primary" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Dashboard Farmasi...</p>
      </div>
    )
  }

  const activeQueue = stats.pending + stats.preparing + stats.ready

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-24">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">
                Dashboard Farmasi
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{today}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-[52px]">
            Selamat datang, <span className="font-bold text-gray-700">{user?.name}</span>
          </p>
        </div>

        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 active:scale-95 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </motion.div>

      {/* ── Active Queue Alert ── */}
      {activeQueue > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black text-sm">
                {activeQueue} Resep Aktif di Antrian
              </p>
              <p className="text-white/80 text-[11px] font-semibold">
                {stats.pending} menunggu · {stats.preparing} sedang diramu · {stats.ready} siap diserahkan
              </p>
            </div>
          </div>
          <Link
            href="/admin/transactions/pharmacy"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
          >
            Buka Antrian <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock} label="Menunggu Diramu" value={stats.pending}
          sub="Resep belum diproses"
          color="text-amber-600" bg="bg-amber-50" border="border-amber-100"
          delay={0} href="/admin/transactions/pharmacy"
        />
        <StatCard
          icon={Beaker} label="Sedang Diramu" value={stats.preparing}
          sub="Dalam proses pengerjaan"
          color="text-blue-600" bg="bg-blue-50" border="border-blue-100"
          delay={0.05} href="/admin/transactions/pharmacy"
        />
        <StatCard
          icon={CheckCircle} label="Siap Diserahkan" value={stats.ready}
          sub="Menunggu penyerahan"
          color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100"
          delay={0.1} href="/admin/transactions/pharmacy"
        />
        <StatCard
          icon={TrendingUp} label="Diserahkan Hari Ini" value={stats.dispensedToday}
          sub={`dari ${stats.totalToday} resep masuk`}
          color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100"
          delay={0.15}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Recent Prescriptions (2/3 width) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Antrian Resep</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hari ini</p>
            </div>
            <Link
              href="/admin/transactions/pharmacy"
              className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <ClipboardList className="w-10 h-10 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada resep hari ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPrescriptions.map((rx, i) => (
                <Link
                  key={rx.id}
                  href={`/admin/transactions/pharmacy/${rx.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  {/* Number */}
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-gray-400">{i + 1}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{rx.patient.name}</p>
                      <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{rx.patient.medicalRecordNo}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium truncate">
                      {rx.prescriptionNo} · dr. {rx.doctor.name} · {rx.items?.length ?? 0} item
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={rx.dispenseStatus} />
                    <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Right Column ── */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Akses Cepat</h2>
            <div className="space-y-2">
              {[
                { icon: ClipboardList, label: 'Antrian Farmasi',    sub: 'Kelola resep masuk',       href: '/admin/transactions/pharmacy', color: 'text-amber-600', bg: 'bg-amber-50' },
                { icon: Package,       label: 'Stok Obat',          sub: 'Cek ketersediaan stok',    href: '/admin/inventory',             color: 'text-blue-600',  bg: 'bg-blue-50' },
                { icon: Activity,      label: 'Mutasi Stok',        sub: 'Riwayat keluar masuk',     href: '/admin/inventory/mutations',   color: 'text-indigo-600',bg: 'bg-indigo-50' },
                { icon: CalendarClock, label: 'Data Obat & Alkes',  sub: 'Master data produk',       href: '/admin/master/medicines',      color: 'text-emerald-600',bg: 'bg-emerald-50' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{item.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Last updated */}
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">
            Diperbarui {formatDistanceToNow(lastUpdated, { locale: idLocale, addSuffix: true })}
          </p>
        </div>
      </div>

      {/* ── Alerts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Stok Menipis</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Di bawah batas minimum</p>
              </div>
            </div>
            {stockAlerts.length > 0 && (
              <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {stockAlerts.length}
              </span>
            )}
          </div>

          {stockAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Semua stok aman</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stockAlerts.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.productName}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{item.productCode}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-rose-600">{item.onHandQty}</p>
                    <p className="text-[10px] text-gray-300 font-medium">min {item.minStockAlert}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <Link
              href="/admin/inventory"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Lihat Semua Stok <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Expiry Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Mendekati Kadaluarsa</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dalam 90 hari ke depan</p>
              </div>
            </div>
            {expiryAlerts.length > 0 && (
              <span className="w-6 h-6 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {expiryAlerts.length}
              </span>
            )}
          </div>

          {expiryAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Tidak ada yang mendekati kadaluarsa</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expiryAlerts.map((item) => {
                const isUrgent = item.daysLeft <= 30
                return (
                  <div key={item.batchId} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUrgent ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Batch {item.batchNumber} · {item.currentQty} unit
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-black ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.daysLeft}h
                      </p>
                      <p className="text-[10px] text-gray-300 font-medium">
                        {format(new Date(item.expiryDate), 'dd/MM/yy')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <Link
              href="/admin/inventory"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Lihat Detail Stok <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
