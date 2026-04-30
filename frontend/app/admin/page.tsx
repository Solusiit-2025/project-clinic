'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import {
  FiUsers, FiCalendar, FiPlus, FiChevronRight,
  FiRefreshCw, FiDollarSign, FiBox, FiShield,
  FiAlertTriangle, FiPackage, FiTool, FiFileText,
  FiTrendingUp, FiTrendingDown, FiActivity, FiClock,
  FiUserPlus, FiCheckCircle, FiAlertCircle, FiArrowRight, FiLock,
  FiSettings, FiDatabase, FiFolder
} from 'react-icons/fi'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, PieChart, Pie, Cell
} from 'recharts'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ALL_MENU_GROUPS } from '@/lib/menuConfig'

const BRANCH_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']
const STAT_CONFIG = [
  { icon: FiUsers,     color: 'text-indigo-500', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  { icon: FiDollarSign,color: 'text-emerald-500',bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: FiShield,    color: 'text-sky-500',    bg: 'bg-sky-50',     border: 'border-sky-100' },
  { icon: FiBox,       color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-100' },
]

function TrendBadge({ trend }: { trend: string | null }) {
  if (!trend) return null
  const isPos = trend.startsWith('+') || trend === 'Laba'
  const isNeg = trend.startsWith('-') || trend === 'Rugi'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
      isPos ? 'bg-emerald-50 text-emerald-600' : isNeg ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500'
    }`}>
      {isPos && <FiTrendingUp className="w-2.5 h-2.5" />}
      {isNeg && <FiTrendingDown className="w-2.5 h-2.5" />}
      {trend}
    </span>
  )
}

function StatCard({ stat, index, isClient }: { stat: any; index: number; isClient: boolean }) {
  const cfg = STAT_CONFIG[index] || STAT_CONFIG[0]
  const Icon = cfg.icon
  const isCurrency = index === 1 || index === 2
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 ${cfg.bg} ${cfg.border} border rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <TrendBadge trend={stat.trend} />
      </div>
      <div>
        <p className="text-lg font-black text-gray-900 leading-none">
          {isCurrency ? 'Rp ' : ''}{stat.value}
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
        {stat.trendLabel && <p className="text-[8px] text-gray-300 mt-0.5">{stat.trendLabel}</p>}
      </div>
      {isClient && stat.breakdown && stat.breakdown.length > 0 && (
        <div className="pt-3 border-t border-gray-50">
          <div className="h-[90px] w-full relative mb-3">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={stat.breakdown} dataKey="quantity" nameKey="name"
                  cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={4} stroke="none">
                  {stat.breakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 700 }}
                  formatter={(val: any) => [stat.breakdown[0]?.isCurrency ? `Rp ${Number(val).toLocaleString()}` : Number(val).toLocaleString(), '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[8px] font-black text-gray-300 uppercase">Cabang</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {stat.breakdown.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase truncate max-w-[70px]" title={item.name}>{item.code}</span>
                </div>
                <span className="text-[10px] font-black text-gray-700">
                  {item.isCurrency ? 'Rp ' : ''}{Number(item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function QuickShortcuts({ user }: { user: any }) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  
  const colors = [
    { text: 'text-indigo-500', bg: 'bg-indigo-50' },
    { text: 'text-emerald-500', bg: 'bg-emerald-50' },
    { text: 'text-sky-500', bg: 'bg-sky-50' },
    { text: 'text-amber-500', bg: 'bg-amber-50' },
    { text: 'text-rose-500', bg: 'bg-rose-50' },
    { text: 'text-violet-500', bg: 'bg-violet-50' },
    { text: 'text-teal-500', bg: 'bg-teal-50' },
    { text: 'text-orange-500', bg: 'bg-orange-50' },
    { text: 'text-pink-500', bg: 'bg-pink-50' },
    { text: 'text-blue-500', bg: 'bg-blue-50' },
  ]

  const sectionIcons: Record<string, any> = {
    'LAYANAN UTAMA': FiActivity,
    'KEUANGAN & AKUNTANSI': FiDollarSign,
    'LOGISTIK & INVENTARIS': FiPackage,
    'MANAJEMEN ASET': FiBox,
    'PENGATURAN MASTER': FiDatabase,
    'PENGATURAN SISTEM': FiSettings,
    'MASTER TENAGA MEDIS': FiUsers,
  }

  const filteredSections = ALL_MENU_GROUPS.map(section => {
    const filteredGroups = section.groups.map(group => {
      const filteredItems = group.items.filter((item: any) => {
        if (item.roles && !item.roles.includes(user.role)) return false
        if (item.role && item.role !== user.role) return false
        if (group.moduleId && user.permissions && !user.permissions.includes(group.moduleId)) {
            if (user.role !== 'SUPER_ADMIN') return false
        }
        return true
      })
      return { ...group, items: filteredItems }
    }).filter(group => group.items.length > 0)
    return { ...section, groups: filteredGroups }
  }).filter(section => section.groups.length > 0)

  const activeData = filteredSections.find(s => s.section === activeSection)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {filteredSections.map((section, idx) => {
          const isActive = activeSection === section.section
          const Icon = sectionIcons[section.section] || FiFolder
          return (
            <button 
              key={idx}
              onClick={() => setActiveSection(isActive ? null : section.section)}
              className={`p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center gap-4 group relative overflow-hidden ${
                isActive 
                 ? 'bg-primary border-primary shadow-2xl shadow-primary/30 text-white scale-105' 
                 : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 hover:border-primary/20 hover:shadow-xl'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isActive ? 'bg-white/20' : 'bg-gray-50 dark:bg-slate-900 group-hover:bg-primary/10'
              }`}>
                 <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-primary'}`} />
              </div>
              <div className="text-center">
                 <span className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                   {section.section.split(' ')[0]}
                 </span>
                 <p className={`text-[8px] font-bold mt-1 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                   {section.groups.flatMap(g => g.items).length} Menu
                 </p>
              </div>
              {isActive && (
                 <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeSection && activeData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="overflow-hidden"
          >
            <div className="p-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-[3rem] border border-gray-100 dark:border-slate-700 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-primary rounded-full" />
                   <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{activeSection}</h4>
                </div>
                <button onClick={() => setActiveSection(null)} className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest">Tutup</button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {activeData.groups.flatMap(group => group.items).map((item, i) => {
                  const ItemIcon = item.icon
                  const color = colors[i % colors.length]
                  return (
                    <Link key={i} href={item.href} 
                      className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all group active:scale-90"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${color.bg} flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}>
                        <ItemIcon className={`w-5 h-5 ${color.text}`} />
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 text-center uppercase tracking-tighter group-hover:text-primary leading-tight truncate w-full px-1">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



function StaffDashboard({ user, data, refreshing, fetchStats, todayLabel }: any) {
  const todayData = data?.today || {}
  
  return (
    <div className="space-y-8 pb-10 w-full">
      {/* ── Page Header & Welcome ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Klinik Aktif
             </div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{todayLabel}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Selamat Datang, {' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
              {user?.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium max-w-lg">
            Siap untuk memberikan pelayanan terbaik hari ini? Anda memiliki <span className="text-indigo-600 font-bold">{todayData.activeQueue || 0} pasien</span> dalam antrian aktif.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <button onClick={fetchStats}
             className="flex items-center gap-3 px-6 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 hover:shadow-lg transition-all active:scale-95"
           >
             <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
             Refresh Data
           </button>
        </div>
      </div>

      {/* ── Operational Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-200 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
             <FiUserPlus className="w-20 h-20 text-white" />
           </div>
           <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Registrasi</p>
           <h3 className="text-4xl font-black text-white">{todayData.registrations ?? 0}</h3>
           <p className="text-white/50 text-[10px] font-bold mt-4 italic">Pasien baru & lama hari ini</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-500">
             <FiActivity className="w-20 h-20 text-emerald-600" />
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Antrian Aktif</p>
           <h3 className="text-4xl font-black text-emerald-600">{todayData.activeQueue ?? 0}</h3>
           <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-600/70">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Real-time monitoring
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-500">
             <FiPackage className="w-20 h-20 text-violet-600" />
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Menunggu Farmasi</p>
           <h3 className="text-4xl font-black text-violet-600">{todayData.pendingPharmacy ?? 0}</h3>
           <p className="text-gray-400 text-[10px] font-bold mt-4 italic">Resep belum diproses</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-500 text-amber-600">
             <FiCalendar className="w-20 h-20" />
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Janji Temu</p>
           <h3 className="text-4xl font-black text-amber-600">{todayData.appointments ?? 0}</h3>
           <p className="text-gray-400 text-[10px] font-bold mt-4 italic">Jadwal konsultasi hari ini</p>
        </div>
      </div>

      {/* ── Primary Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Registrasi Pasien', desc: 'Daftarkan kunjungan pasien baru / lama', icon: FiUserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', href: '/admin/transactions/registration' },
          { label: 'Monitor Antrian', desc: 'Kelola alur pelayanan pasien saat ini', icon: FiActivity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/admin/transactions/queue' },
          { label: 'Database Pasien', desc: 'Cari riwayat dan rekam medis lengkap', icon: FiUsers, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', href: '/admin/master/patients' },
        ].map((act, i) => (
          <Link key={i} href={act.href} className="group bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col gap-6 relative overflow-hidden active:scale-95">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-[4rem]" />
            <div className={`w-16 h-16 ${act.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
              <act.icon className={`w-8 h-8 ${act.color}`} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-gray-900 mb-2">{act.label}</h3>
              <p className="text-xs font-medium text-gray-400 leading-relaxed">{act.desc}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-primary transition-colors uppercase tracking-widest mt-auto">
               Akses Modul <FiArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── QUICK ACCESS MODULES (Compact Mobile Style) ── */}
      <QuickShortcuts user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Recent Activity List ── */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Pasien Terdaftar Hari Ini</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Timeline pendaftaran terkini</p>
              </div>
              <Link href="/admin/transactions/registration" className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                Lihat Semua
              </Link>
           </div>

           <div className="p-6 flex-1">
             {data?.recentRegistrations && data.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {data.recentRegistrations.map((reg: any) => {
                   const statusColor: Record<string, string> = {
                    completed:  'bg-emerald-50 text-emerald-600 border-emerald-100',
                    waiting:    'bg-amber-50 text-amber-600 border-amber-100',
                    cancelled:  'bg-rose-50 text-rose-500 border-rose-100',
                    in_progress:'bg-sky-50 text-sky-600 border-sky-100',
                  }
                  return (
                    <div key={reg.id} className="flex items-center gap-5 p-4 rounded-3xl bg-gray-50/30 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-gray-300 group-hover:text-primary transition-colors border border-gray-100 flex-shrink-0 shadow-sm">
                        {reg.patient?.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <h4 className="text-base font-black text-gray-900 truncate group-hover:text-primary transition-colors">{reg.patient?.name}</h4>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border ${statusColor[reg.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {reg.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-gray-400">
                           <span className="flex items-center gap-1.5"><FiFileText className="w-3.5 h-3.5" /> RM: {reg.patient?.medicalRecordNo}</span>
                           <span className="w-1 h-1 bg-gray-200 rounded-full" />
                           <span className="flex items-center gap-1.5 uppercase tracking-tighter text-gray-500"><FiActivity className="w-3.5 h-3.5" /> {reg.visitType}</span>
                           <span className="w-1 h-1 bg-gray-200 rounded-full" />
                           <span className="flex items-center gap-1.5">
                             <FiClock className="w-3.5 h-3.5" /> 
                             {reg.createdAt && !isNaN(new Date(reg.createdAt).getTime()) 
                               ? format(new Date(reg.createdAt), 'HH:mm') 
                               : '--:--'} WIB
                           </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
             ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                    <FiFileText className="w-10 h-10" />
                 </div>
                 <p className="text-gray-300 font-bold text-xs uppercase tracking-widest italic">Belum ada aktivitas hari ini</p>
              </div>
             )}
           </div>
        </div>

        {/* ── Status & Info Card ── */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
              <div className="relative z-10 space-y-6">
                <FiShield className="w-12 h-12 text-indigo-400" />
                <h3 className="text-2xl font-black leading-tight tracking-tight">Keamanan Data Pasien</h3>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  Selalu pastikan untuk mengunci layar saat meninggalkan workspace Anda. Keamanan data rekam medis pasien adalah prioritas utama.
                </p>
                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                     <FiLock className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Protected Session</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Kinerja Pelayanan</h4>
              <div className="space-y-6">
                 {[
                   { label: 'Waktu Tunggu Rerata', val: '12 Min', color: 'bg-emerald-500', trend: '+2%' },
                   { label: 'Kepuasan Pasien', val: '98%', color: 'bg-indigo-500', trend: 'Stable' },
                 ].map((k, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-gray-700">{k.label}</span>
                        <span className="text-sm font-black text-gray-900">{k.val}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div className={`h-full ${k.color} rounded-full`} style={{ width: k.val }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { activeClinicId, user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState('week')
  const [isClient, setIsClient] = useState(false)
  const [alertTab, setAlertTab] = useState<'stock' | 'expiry' | 'maintenance' | 'insurance'>('stock')

  useEffect(() => { setIsClient(true) }, [])

  // Redirect FARMASI to their dedicated dashboard
  useEffect(() => {
    if (user?.role === 'FARMASI') {
      router.replace('/admin/farmasi')
    }
  }, [user, router])

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setRefreshing(true)
      const res = await api.get(`/dashboard/stats?range=${range}`)
      setData(res.data)
    } catch (e) {
      console.error('Failed to fetch dashboard data', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated, range, activeClinicId])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest animate-pulse">Memuat data...</p>
      </div>
    )
  }

  // FARMASI should never reach here (redirected above), but guard just in case
  if (user?.role === 'FARMASI') return null

  const todayLabel = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })

  // Render STAFF Dashboard
  if (user?.role === 'STAFF') {
    return <StaffDashboard user={user} data={data} refreshing={refreshing} fetchStats={fetchStats} todayLabel={todayLabel} />
  }

  const alerts = data?.alerts || {}
  const todayData = data?.today || {}
  const criticalCount = alerts.criticalStocks?.length || 0
  const expiryCount = alerts.expiringBatches?.length || 0
  const maintCount = alerts.maintenanceOverdue?.length || 0
  const insCount = alerts.insuranceExpiring?.length || 0
  const totalAlerts = criticalCount + expiryCount + maintCount + insCount

  return (
    <div className="space-y-6 pb-10 w-full">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard Operasional</span>
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            Selamat Datang,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
              {user?.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-[10px] text-gray-400 mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats}
            className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-primary hover:border-primary/20 hover:shadow-sm transition-all shadow-sm"
            title="Refresh data">
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/transactions/registration"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/20 transition-all active:scale-95">
            <FiPlus className="w-3 h-3" />
            Pendaftaran
          </Link>
        </div>
      </div>

      {/* ── TODAY'S OPERATIONAL SNAPSHOT ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Pasien',
            value: todayData.registrations ?? 0,
            trend: todayData.registrationTrend,
            icon: FiUserPlus,
            color: 'text-indigo-500', bg: 'bg-indigo-50',
            href: '/admin/transactions/registration',
          },
          {
            label: 'Pendapatan',
            value: `Rp ${(todayData.revenue ?? 0).toLocaleString()}`,
            trend: todayData.revenueTrend,
            icon: FiDollarSign,
            color: 'text-emerald-500', bg: 'bg-emerald-50',
            href: '/admin/finance',
          },
          {
            label: 'Antrian',
            value: todayData.activeQueue ?? 0,
            trend: null,
            icon: FiActivity,
            color: 'text-sky-500', bg: 'bg-sky-50',
            href: '/admin/transactions/queue',
          },
          {
            label: 'Resep',
            value: todayData.pendingPharmacy ?? 0,
            trend: null,
            icon: FiPackage,
            color: 'text-violet-500', bg: 'bg-violet-50',
            href: '/admin/transactions/pharmacy',
          },
          {
            label: 'Invoice',
            value: `Rp ${(todayData.unpaidInvoicesAmount ?? 0).toLocaleString()}`,
            subValue: `${todayData.unpaidInvoicesCount ?? 0} inv`,
            trend: null,
            icon: FiFileText,
            color: 'text-rose-500', bg: 'bg-rose-50',
            href: '/admin/finance',
          },
          {
            label: 'Hutang',
            value: `Rp ${(todayData.supplierDebt ?? 0).toLocaleString()}`,
            subValue: `${todayData.pendingProcurements ?? 0} PO`,
            trend: null,
            icon: FiClock,
            color: 'text-amber-500', bg: 'bg-amber-50',
            href: '/admin/inventory/procurement/payables',
          },
        ].map((item, i) => {
          const Icon = item.icon
          const isNegative = item.trend?.startsWith('-')
          const isPositive = item.trend?.startsWith('+')
          return (
            <Link key={i} href={item.href}
              className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 hover:shadow-md hover:border-primary/20 transition-all group">
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-6 h-6 ${item.bg} rounded-md flex items-center justify-center`}>
                  <Icon className={`w-3 h-3 ${item.color}`} />
                </div>
                {item.trend && (
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                    isPositive ? 'bg-emerald-50 text-emerald-600' : isNegative ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.trend}
                  </span>
                )}
              </div>
              <p className="text-xs font-black text-gray-900 leading-tight truncate">{item.value}</p>
              {item.subValue && <p className="text-[8px] text-gray-400 mt-0.5">{item.subValue}</p>}
              <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{item.label}</p>
            </Link>
          )
        })}
      </div>
      
      {/* ── QUICK SHORTCUTS ── */}
      <QuickShortcuts user={user} />

      {/* ── SUMMARY CARDS (all-time) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.summary?.map((stat: any, index: number) => (
          <StatCard key={index} stat={stat} index={index} isClient={isClient} />
        ))}
      </div>

      {/* ── ALERTS PANEL ── */}
      {totalAlerts > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-rose-50/60 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-black text-rose-700">Peringatan</span>
              <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0 rounded-full">{totalAlerts}</span>
            </div>
          </div>
          <div className="flex border-b border-gray-100 px-3 gap-1 pt-1">
            {[
              { key: 'stock',       label: 'Stok',    count: criticalCount,  color: 'text-rose-600' },
              { key: 'expiry',      label: 'Expired', count: expiryCount,    color: 'text-amber-600' },
              { key: 'maintenance', label: 'Maint',    count: maintCount,     color: 'text-orange-600' },
              { key: 'insurance',   label: 'Asuransi',       count: insCount,       color: 'text-purple-600' },
            ].map((tab) => (
              <button key={tab.key}
                onClick={() => setAlertTab(tab.key as any)}
                className={`flex items-center gap-1 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                  alertTab === tab.key
                    ? `border-primary ${tab.color}`
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[8px] font-black px-1 py-0 rounded-full ${
                    alertTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-3">
            {alertTab === 'stock' && (
              criticalCount === 0 ? (
                <div className="flex items-center gap-2 py-2 text-emerald-600 text-[10px] font-semibold">
                  <FiCheckCircle className="w-3 h-3" /> Stok aman
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {alerts.criticalStocks.map((s: any, i: number) => (
                    <Link key={i} href="/admin/inventory"
                      className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-all">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{s.productName}</p>
                        <p className="text-[8px] text-gray-400">{s.productCode}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-xs font-black ${s.isCritical ? 'text-rose-600' : 'text-amber-600'}`}>{s.onHandQty}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
            {alertTab === 'expiry' && (
              expiryCount === 0 ? (
                <div className="flex items-center gap-2 py-2 text-emerald-600 text-[10px] font-semibold">
                  <FiCheckCircle className="w-3 h-3" /> Tidak ada batch expired
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {alerts.expiringBatches.map((b: any, i: number) => (
                    <Link key={i} href="/admin/inventory"
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-all">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{b.productName}</p>
                        <p className="text-[8px] text-gray-400">Exp: {format(new Date(b.expiryDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-black text-amber-600">{b.daysLeft}h</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
            {alertTab === 'maintenance' && (
              maintCount === 0 ? (
                <div className="flex items-center gap-2 py-2 text-emerald-600 text-[10px] font-semibold">
                  <FiCheckCircle className="w-3 h-3" /> Maintenance aman
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {alerts.maintenanceOverdue.map((a: any, i: number) => (
                    <Link key={i} href="/admin/assets/maintenance"
                      className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-all">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{a.assetName}</p>
                        <p className="text-[8px] text-gray-400">{a.assetCode}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-black text-orange-600">{a.daysOverdue}h</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
            {alertTab === 'insurance' && (
              insCount === 0 ? (
                <div className="flex items-center gap-2 py-2 text-emerald-600 text-[10px] font-semibold">
                  <FiCheckCircle className="w-3 h-3" /> Asuransi aman
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {alerts.insuranceExpiring.map((ins: any, i: number) => (
                    <Link key={i} href="/admin/assets/insurance"
                      className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100 hover:bg-purple-50 transition-all">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{ins.assetName}</p>
                        <p className="text-[8px] text-gray-400">Exp: {format(new Date(ins.endDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs font-black text-purple-600">{ins.daysLeft}h</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xs font-black text-gray-900 tracking-tight">Performa Keuangan</h3>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Pendapatan vs Pengeluaran</p>
            </div>
            <div className="flex p-0.5 bg-gray-50 rounded-lg border border-gray-100 gap-0.5">
              {[{ id: 'week', label: 'Minggu' }, { id: 'month', label: 'Bulan' }, { id: 'year', label: 'Tahun' }].map((btn) => (
                <button key={btn.id} onClick={() => setRange(btn.id)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                    range === btn.id ? 'bg-white text-primary shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[240px] w-full">
            {isClient && data?.financialTrend ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data.financialTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`
                      return `${val}`
                    }} width={50} />
                  <Tooltip
                    content={({ active, payload, label: lbl }) => {
                      if (!active || !payload?.length) return null
                      const rev = Number(payload[0]?.value) || 0
                      const exp = Number(payload[1]?.value) || 0
                      const profit = rev - exp
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 min-w-[200px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{lbl}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center gap-8">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-semibold text-gray-600">Pendapatan</span>
                              </div>
                              <span className="text-xs font-black text-gray-900">Rp {rev.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center gap-8">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[11px] font-semibold text-gray-600">Pengeluaran</span>
                              </div>
                              <span className="text-xs font-black text-gray-900">Rp {exp.toLocaleString()}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-[11px] font-bold text-indigo-600">Net Profit</span>
                              <span className={`text-sm font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                Rp {profit.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend verticalAlign="top" align="right"
                    content={({ payload }) => (
                      <div className="flex gap-4 mb-4 justify-end">
                        {payload?.map((entry: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                              {entry.value === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Area name="revenue" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRev)" animationDuration={1200} />
                  <Area name="expense" type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorExp)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-300 text-xs font-semibold uppercase tracking-widest">
                {isClient ? 'Data tidak tersedia' : 'Mempersiapkan grafik...'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Doctor Monitoring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-primary" /> Dokter Hari Ini
              </h3>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{format(new Date(), 'dd MMM yyyy', { locale: id })}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600">
                {data?.dutyStatus?.filter((d: any) => d.isOnDuty).length || 0} On Duty
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[260px] pr-1">
            {data?.dutyStatus?.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                    {doc.photo ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${doc.photo}`} alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-gray-300 text-sm">{doc.name[0]}</div>
                    )}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${doc.isOnDuty ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    {doc.isOnDuty && <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-60" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">{doc.name}</h4>
                  <p className="text-[10px] text-gray-400 truncate">{doc.specialization}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                      doc.isOnDuty ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>{doc.isOnDuty ? 'On Duty' : 'Off'}</span>
                    {doc.isOnDuty && doc.schedule && (
                      <span className="text-[9px] text-gray-400">{doc.schedule.startTime}–{doc.schedule.endTime}</span>
                    )}
                    {doc.isOnDuty && doc.clinic && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/15 truncate max-w-[90px]" title={doc.clinic.name}>
                        📍 {doc.clinic.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.dutyStatus || data.dutyStatus.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <FiUsers className="w-8 h-8 mb-2" />
                <p className="text-xs font-semibold">Tidak ada data dokter</p>
              </div>
            )}
          </div>
          <Link href="/admin/master/doctors"
            className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">
            Kelola Jadwal <FiChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* ── RECENT REGISTRATIONS ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-gray-900">Pendaftaran Terakhir</h3>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Aktivitas operasional terkini</p>
          </div>
          <Link href="/admin/transactions/registration"
            className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:gap-2.5 transition-all">
            Lihat Semua <FiChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {data?.recentRegistrations && data.recentRegistrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recentRegistrations.map((reg: any) => {
              const statusColor: Record<string, string> = {
                completed:  'bg-emerald-50 text-emerald-600',
                waiting:    'bg-amber-50 text-amber-600',
                cancelled:  'bg-rose-50 text-rose-500',
                in_progress:'bg-sky-50 text-sky-600',
              }
              const visitColor: Record<string, string> = {
                bpjs:        'bg-blue-50 text-blue-600',
                umum:        'bg-indigo-50 text-indigo-600',
                asuransi:    'bg-purple-50 text-purple-600',
                appointment: 'bg-violet-50 text-violet-600',
                walkin:      'bg-teal-50 text-teal-600',
                'walk-in':   'bg-teal-50 text-teal-600',
              }
              return (
                <div key={reg.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/60 border border-gray-100 hover:bg-white hover:shadow-md hover:border-gray-200 transition-all group">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-base text-gray-200 group-hover:text-primary transition-colors border border-gray-100 flex-shrink-0">
                    {reg.patient?.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{reg.patient?.name}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${statusColor[reg.status] || 'bg-gray-100 text-gray-500'}`}>
                        {reg.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">RM: {reg.patient?.medicalRecordNo}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {reg.doctor && (
                        <span className="text-[9px] text-gray-500 truncate max-w-[100px]">{reg.doctor.name}</span>
                      )}
                      {reg.department && (
                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">{reg.department.name}</span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${visitColor[reg.visitType?.toLowerCase()] || 'bg-gray-100 text-gray-500'}`}>
                        {reg.visitType}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-300 mt-1">
                      {format(new Date(reg.registrationDate), 'dd MMM yyyy HH:mm')}
                      {reg.clinic && ` · ${reg.clinic.code}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <FiCalendar className="w-10 h-10 mb-2" />
            <p className="text-xs font-semibold">Belum ada pendaftaran</p>
          </div>
        )}
      </motion.div>

    </div>
  )
}
