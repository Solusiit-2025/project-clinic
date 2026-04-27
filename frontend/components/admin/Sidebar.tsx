'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import {
  FiHome, FiGlobe, FiUsers, FiCalendar, FiUserPlus,
  FiSettings, FiLogOut, FiChevronDown, FiDatabase,
  FiBriefcase, FiUserCheck, FiClock, FiActivity,
  FiPackage, FiShoppingBag, FiList, FiMenu, FiX, FiBox,
  FiChevronLeft, FiFolder, FiCpu, FiPlus, FiDollarSign, FiFileText, FiTrendingUp, FiLayers, FiBookOpen, FiLock, FiCreditCard,
  FiTool, FiRepeat, FiShield, FiBarChart2, FiAlertCircle, FiArchive
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import ClinicSwitcher from './ClinicSwitcher'

// --- Types & Constants ---
const MAIN_MENU = [
  { icon: FiHome, label: 'Dashboard', href: '/admin' },
]

const LAYANAN_UTAMA_GROUPS = [
  {
    label: 'Pendaftaran & Antrian',
    icon: FiUserPlus,
    items: [
      { icon: FiCalendar, label: 'Janji Temu (Appointment)', href: '/admin/transactions/appointment' },
      { icon: FiPlus, label: 'Registrasi Baru', href: '/admin/transactions/registration' },
      { icon: FiActivity, label: 'Antrian Pasien', href: '/admin/transactions/queue' },
    ]
  },
  {
    label: 'Pelayanan Medis',
    icon: FiActivity,
    items: [
      { icon: FiActivity, label: 'Nurse Station (Triage)', href: '/admin/transactions/nurse' },
      { icon: FiUserCheck, label: 'Doctor Station', href: '/admin/transactions/doctor' },
      { icon: FiUsers, label: 'Database Pasien', href: '/admin/master/patients' },
    ]
  },
  {
    label: 'Farmasi',
    icon: FiPackage,
    items: [
      { icon: FiBox, label: 'Antrian Farmasi', href: '/admin/transactions/pharmacy' },
      { icon: FiMenu, label: 'Data Obat & Alkes', href: '/admin/master/medicines' },
    ]
  }
]

const FINANCE_GROUPS = [
  {
    label: 'Billing & Pembayaran',
    icon: FiDollarSign,
    items: [
      { icon: FiFileText, label: 'Invoice & Bayar', href: '/admin/finance' },
      { icon: FiDollarSign, label: 'Pengeluaran Operasional', href: '/admin/finance/expenses' },
      { icon: FiClock, label: 'Tutup Buku (Closing)', href: '/admin/finance/closing' },
    ]
  },
  {
    label: 'Laporan & Akuntansi',
    icon: FiTrendingUp,
    items: [
      { icon: FiBookOpen, label: 'Buku Besar (Ledger)', href: '/admin/finance/reports/general-ledger' },
      { icon: FiActivity, label: 'Neraca Saldo (Trial Balance)', href: '/admin/finance/reports/trial-balance' },
      { icon: FiTrendingUp, label: 'Laba Rugi (P&L)', href: '/admin/finance/reports/profit-loss' },
      { icon: FiDatabase, label: 'Neraca (Balance Sheet)', href: '/admin/finance/reports/balance-sheet' },
    ]
  },
  {
    label: 'Konfigurasi Akuntansi',
    icon: FiSettings,
    items: [
      { icon: FiLayers, label: 'Chart of Accounts (COA)', href: '/admin/master/coa' },
      { icon: FiCpu, label: 'System Account Mapping', href: '/admin/master/system-accounts' },
      { icon: FiCreditCard, label: 'Rekening Bank', href: '/admin/master/banks' },
    ]
  }
]

const LOGISTIK_GROUPS = [
  {
    label: 'Stok & Inventaris',
    icon: FiPackage,
    items: [
      { icon: FiHome, label: 'Dashboard Stok', href: '/admin/inventory' },
      { icon: FiList, label: 'Kartu Stok', href: '/admin/inventory/mutations' },
      { icon: FiPlus, label: 'Update Stok Opname', href: '/admin/inventory/stock-opname' },
    ]
  },
  {
    label: 'Pengadaan & Logistik',
    icon: FiShoppingBag,
    items: [
      { icon: FiShoppingBag, label: 'Procurement (PR/PO)', href: '/admin/inventory/procurement' },
      { icon: FiCreditCard, label: 'Bayar Hutang Supplier', href: '/admin/inventory/procurement/payables' },
      { icon: FiGlobe, label: 'Transfer Antar Cabang', href: '/admin/inventory/transfers' },
      { icon: FiPackage, label: 'Katalog Produk', href: '/admin/master/products' },
      { icon: FiList, label: 'Kategori Produk', href: '/admin/master/product-categories' },
    ]
  }
]

const ASSET_GROUPS = [
  {
    label: 'Data & Registrasi Aset',
    icon: FiArchive,
    items: [
      { icon: FiArchive, label: 'Daftar Aset', href: '/admin/master/assets' },
      { icon: FiBarChart2, label: 'Register Aset (Nilai Buku)', href: '/admin/assets/register' },
    ]
  },
  {
    label: 'Operasional Aset',
    icon: FiTool,
    items: [
      { icon: FiTool, label: 'Maintenance & Perawatan', href: '/admin/assets/maintenance' },
      { icon: FiRepeat, label: 'Transfer Aset', href: '/admin/assets/transfers' },
      { icon: FiShield, label: 'Asuransi Aset', href: '/admin/assets/insurance' },
    ]
  },
  {
    label: 'Keuangan Aset',
    icon: FiTrendingUp,
    items: [
      { icon: FiTrendingUp, label: 'Penyusutan (Depresiasi)', href: '/admin/assets/depreciation' },
      { icon: FiAlertCircle, label: 'Penghapusan Aset', href: '/admin/assets/disposal' },
    ]
  },
]

const MASTER_GROUPS = [
  {
    label: 'Master Tenaga Medis',
    icon: FiUserCheck,
    items: [
      { icon: FiUserCheck, label: 'Database Dokter', href: '/admin/master/doctors' },
      { icon: FiClock, label: 'Jadwal Praktek', href: '/admin/master/schedules' },
      { icon: FiBriefcase, label: 'Departemen & Poli', href: '/admin/master/departments' },
      { icon: FiActivity, label: 'Daftar Layanan/Tindakan', href: '/admin/master/services' },
    ]
  },
  {
    label: 'Pengaturan Sistem',
    icon: FiDatabase,
    items: [
      { icon: FiUsers, label: 'Manajemen Users', href: '/admin/master/users' },
      { icon: FiGlobe, label: 'Manajemen Cabang', href: '/admin/master/clinics' },
      { icon: FiGlobe, label: 'Manajemen Website', href: '/admin/website' },
      { icon: FiSettings, label: 'Pengaturan Umum', href: '/admin/settings' },
      { icon: FiTrendingUp, label: 'Go Live Setup (Reset)', href: '/admin/settings/go-live', role: 'SUPER_ADMIN' },
    ]
  }
]

// --- Tooltip Component ---
const Tooltip = ({ text, visible }: { text: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="fixed left-20 z-[60] px-3 py-1.5 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-md"
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        {text}
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px]" style={{ borderRightColor: 'var(--bg-app)' }} />
      </motion.div>
    )}
  </AnimatePresence>
)

// --- Nav Item Component ---
const SidebarNavItem = ({
  item,
  pathname,
  isCollapsed,
  isMobile
}: {
  item: any;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
}) => {
  const [hover, setHover] = useState(false)
  const isActive = pathname === item.href

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative"
    >
      <Link
        href={item.href}
        className={`flex items-center rounded-xl transition-all group ${isCollapsed && !isMobile ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2.5'
          }`}
        style={{
          backgroundColor: isActive ? 'var(--sidebar-item-active)' : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontWeight: isActive ? '800' : '600',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-item-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
          }
        }}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {(!isCollapsed || isMobile) && <span className="text-[13px] truncate tracking-tight">{item.label}</span>}
        {isActive && !isCollapsed && (
          <motion.span layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </Link>
      {isCollapsed && !isMobile && <Tooltip text={item.label} visible={hover} />}
    </div>
  )
}

// --- Nav Group Component ---
const SidebarNavGroup = ({
  group,
  pathname,
  isCollapsed,
  isMobile,
  openGroups,
  toggleGroup,
  accentColor = 'primary',
  user
}: {
  group: any;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  openGroups: string[];
  toggleGroup: (label: string) => void;
  accentColor?: 'primary' | 'indigo';
  user?: any;
}) => {
  const [hover, setHover] = useState(false)
  const isGroupActive = useMemo(() => group.items.some((i: any) => pathname === i.href), [group.items, pathname])
  const isOpen = openGroups.includes(group.label) || isGroupActive

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={() => toggleGroup(group.label)}
        className={`flex items-center rounded-xl transition-all ${isCollapsed && !isMobile ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2.5 w-full'}`}
        style={{
          backgroundColor: isGroupActive && !isOpen ? 'var(--sidebar-item-active)' : 'transparent',
          color: isGroupActive ? 'var(--primary)' : 'var(--text-muted)',
        }}
        onMouseEnter={(e) => {
          if (!isGroupActive || isOpen) {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-item-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isGroupActive || isOpen) {
            (e.currentTarget as HTMLElement).style.backgroundColor = isGroupActive && !isOpen ? 'var(--sidebar-item-active)' : 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = isGroupActive ? 'var(--primary)' : 'var(--text-muted)'
          }
        }}
      >
        <group.icon className={`w-5 h-5 flex-shrink-0`} />
        {(!isCollapsed || isMobile) && (
          <>
            <span className={`text-[13px] flex-1 text-left truncate font-extrabold tracking-tight`}>{group.label}</span>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <FiChevronDown className="w-3.5 h-3.5 opacity-40" />
            </motion.div>
          </>
        )}
      </button>
      {isCollapsed && !isMobile && <Tooltip text={group.label} visible={hover} />}

      <AnimatePresence initial={false}>
        {isOpen && (!isCollapsed || isMobile) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4 mr-2"
          >
            <div
              className="mt-1 space-y-1 border-l-2 pl-3 py-1"
              style={{ borderColor: 'var(--sidebar-item-active)' }}
            >
              {group.items
                .filter((item: any) => {
                  if (!item.role) return true
                  return user?.role === item.role
                })
                .map((item: any) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-bold`}
                      style={{
                        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        boxShadow: isActive ? '0 8px 16px -6px var(--primary)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = 'var(--primary)'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-item-hover)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate tracking-tight">{item.label}</span>
                    </Link>
                  )
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SidebarContent = ({
  isMobile = false,
  isCollapsed,
  user,
  logout,
  pathname,
  openGroups,
  toggleGroup,
  toggleCollapse
}: {
  isMobile?: boolean;
  isCollapsed: boolean;
  user: any;
  logout: () => void;
  pathname: string;
  openGroups: string[];
  toggleGroup: (label: string) => void;
  toggleCollapse: () => void;
}) => (
  <div
    className="flex flex-col h-full"
    style={{ backgroundColor: 'var(--sidebar-bg)' }}
  >
    {/* Brand */}
    <div className={`flex-shrink-0 flex items-center transition-all duration-300 ${isCollapsed && !isMobile ? 'h-16 justify-center' : 'h-20 px-6'}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20 text-white font-black text-lg">
          Y
        </div>
        {(!isCollapsed || isMobile) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
            <span className="font-black text-base tracking-tight leading-none block" style={{ color: 'var(--text-primary)' }}>Yasfina</span>
            <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5 block">Management</span>
          </motion.div>
        )}
      </div>
    </div>

    {/* Clinic Switcher */}
    {(!isCollapsed || isMobile) && (
      <div className="px-5 pb-4">
        <ClinicSwitcher full />
      </div>
    )}

    {/* Navigation */}
    <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar pb-10">
      {(!isCollapsed || isMobile) && (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pt-4 pb-2" style={{ color: 'var(--text-faint)' }}>
          Menu Utama
        </p>
      )}

      <div className="flex flex-col gap-1">
        {MAIN_MENU.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-4" style={{ color: 'var(--text-faint)' }}>
            Layanan Utama
          </p>
        )}
        {LAYANAN_UTAMA_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
            user={user}
          />
        ))}
      </div>

      {/* Logistics and Inventory */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-4" style={{ color: 'var(--text-faint)' }}>
            Logistik & Inventaris
          </p>
        )}
        {LOGISTIK_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
            user={user}
          />
        ))}
      </div>

      {/* Manajemen Aset */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-4" style={{ color: 'var(--text-faint)' }}>
            Manajemen Aset
          </p>
        )}
        {ASSET_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
            user={user}
          />
        ))}
      </div>

      {/* Keuangan & Akuntansi */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-4" style={{ color: 'var(--text-faint)' }}>
            Keuangan & Akuntansi
          </p>
        )}
        {FINANCE_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
            user={user}
          />
        ))}
      </div>

      {/* Master Data */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-4" style={{ color: 'var(--text-faint)' }}>
            Pengaturan Master
          </p>
        )}
        {MASTER_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="indigo"
            user={user}
          />
        ))}
      </div>
    </nav>

    {/* Footer / User Profile */}
    <div
      className="p-4 space-y-2 flex-shrink-0 border-t"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {(!isCollapsed || isMobile) && (
        <div
          className="px-4 py-3 rounded-2xl border transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface-3)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-surface-2)'
          }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-black truncate uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Administrator'}</p>
              <p className="text-[9px] font-bold truncate tracking-wide" style={{ color: 'var(--text-faint)' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <button
          onClick={logout}
          className={`flex items-center rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm ${isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5 w-full'}`}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Keluar</span>}
        </button>

        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className={`flex items-center rounded-xl transition-all font-bold text-sm hover:bg-primary/10 hover:text-primary ${isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5 w-full'}`}
            style={{ color: 'var(--text-faint)' }}
          >
            <FiChevronLeft className={`w-5 h-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} />
            {!isCollapsed && <span>Ciutkan Menu</span>}
          </button>
        )}
      </div>
    </div>
  </div>
)

export default function Sidebar() {
  const pathname = usePathname()
  const { logout, user, activeClinicId } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)

    const activeMasterGroup = MASTER_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeLayananGroup = LAYANAN_UTAMA_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeFinanceGroup = FINANCE_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeLogistikGroup = LOGISTIK_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeAssetGroup = ASSET_GROUPS.find(g => g.items.some(i => i.href === pathname))

    const initialOpen: string[] = []
    if (activeMasterGroup) initialOpen.push(activeMasterGroup.label)
    if (activeLayananGroup) initialOpen.push(activeLayananGroup.label)
    if (activeFinanceGroup) initialOpen.push(activeFinanceGroup.label)
    if (activeLogistikGroup) initialOpen.push(activeLogistikGroup.label)
    if (activeAssetGroup) initialOpen.push(activeAssetGroup.label)

    if (initialOpen.length > 0) {
      setOpenGroups(prev => Array.from(new Set([...prev, ...initialOpen])))
    }
  }, [])

  const toggleCollapse = () => {
    const newVal = !isCollapsed
    setIsCollapsed(newVal)
    localStorage.setItem('sidebar-collapsed', String(newVal))
  }

  const toggleGroup = (label: string) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      localStorage.setItem('sidebar-collapsed', 'false')
    }
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  useEffect(() => { setMobileOpen(false) }, [pathname])

  if (!mounted) return null

  const contentProps = {
    isCollapsed,
    user,
    logout,
    pathname,
    openGroups,
    toggleGroup,
    toggleCollapse
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-[45] p-2.5 backdrop-blur-md rounded-xl shadow-xl border transition-all active:scale-95 hover:text-primary"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[50]"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-screen w-64 z-[60] flex flex-col shadow-2xl border-r"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--sidebar-border)',
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl transition-all z-[70] hover:bg-red-500 hover:text-white"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-muted)',
              }}
            >
              <FiX className="w-4 h-4" />
            </button>
            <SidebarContent isMobile {...contentProps} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 70 : 240 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen z-50 flex-col overflow-hidden border-r"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          boxShadow: '4px 0 24px -10px rgba(0,0,0,0.08)',
        }}
      >
        <SidebarContent {...contentProps} />
      </motion.aside>

      {/* Spacer to push content */}
      <motion.div
        animate={{ width: isCollapsed ? 70 : 240 }}
        className="hidden lg:block flex-shrink-0"
      />
    </>
  )
}
