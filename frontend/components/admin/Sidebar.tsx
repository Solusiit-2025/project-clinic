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
  FiChevronLeft, FiFolder, FiCpu, FiPlus, FiDollarSign, FiFileText
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import ClinicSwitcher from './ClinicSwitcher'

// --- Types & Constants ---
const MAIN_MENU = [
  { icon: FiHome, label: 'Dashboard', href: '/admin' },
  { icon: FiGlobe, label: 'Website', href: '/admin/website' },
  { icon: FiCalendar, label: 'Appointments', href: '/admin/appointments' },
  { icon: FiSettings, label: 'Settings', href: '/admin/settings' },
]

const TRANSAKSI_GROUPS = [
  {
    label: 'Front Office & Pendaftaran',
    icon: FiUserPlus,
    items: [
      { icon: FiPlus, label: 'Pendaftaran Baru', href: '/admin/transactions/registration' },
      { icon: FiActivity, label: 'Dashboard Antrian', href: '/admin/transactions/queue' },
    ]
  },
  {
    label: 'Pelayanan Medis',
    icon: FiActivity,
    items: [
      { icon: FiActivity, label: 'Nurse Station (Triage)', href: '/admin/transactions/nurse' },
      { icon: FiUserCheck, label: 'Doctor Station', href: '/admin/transactions/doctor' },
    ]
  },
  {
    label: 'Farmasi (Apotek)',
    icon: FiBox,
    items: [
      { icon: FiBox, label: 'Antrian Resep', href: '/admin/transactions/pharmacy' },
    ]
  },
  {
    label: 'Billing & Keuangan',
    icon: FiDollarSign,
    items: [
      { icon: FiFileText, label: 'Invoice & Pembayaran', href: '/admin/finance' },
    ]
  }
]

const LOGISTIK_GROUPS = [
  {
    label: 'Logistik & Inventaris',
    icon: FiPackage,
    items: [
      { icon: FiHome, label: 'Dashboard Stok', href: '/admin/inventory' },
      { icon: FiShoppingBag, label: 'Pengadaan (Procurement)', href: '/admin/inventory/procurement' },
      { icon: FiGlobe, label: 'Transfer Barang', href: '/admin/inventory/transfers' },
      { icon: FiList, label: 'Kartu Stok (Mutasi)', href: '/admin/inventory/mutations' },
      { icon: FiPackage, label: 'Data Obat', href: '/admin/master/medicines' },
      { icon: FiBox, label: 'Manajemen Aset', href: '/admin/master/assets' },
    ]
  }
]

const KLINIK_GROUPS = [
  {
    label: 'Klinik & Medis',
    icon: FiActivity,
    items: [
      { icon: FiUsers, label: 'Data Pasien', href: '/admin/master/patients' },
      { icon: FiBriefcase, label: 'Departemen', href: '/admin/master/departments' },
      { icon: FiUserCheck, label: 'Dokter', href: '/admin/master/doctors' },
      { icon: FiClock, label: 'Jadwal Dokter', href: '/admin/master/schedules' },
      { icon: FiActivity, label: 'Layanan', href: '/admin/master/services' },
      { icon: FiList, label: 'Kategori Layanan', href: '/admin/master/service-categories' },
    ]
  }
]

const MASTER_GROUPS = [
  {
    label: 'Katalog Master',
    icon: FiShoppingBag,
    items: [
      { icon: FiShoppingBag, label: 'Master Produk', href: '/admin/master/products' },
      { icon: FiList, label: 'Kategori Produk', href: '/admin/master/product-categories' },
    ]
  },
  {
    label: 'Akses & Admin',
    icon: FiDatabase,
    items: [
      { icon: FiUsers, label: 'Users', href: '/admin/master/users' },
      { icon: FiGlobe, label: 'Cabang / Klinik', href: '/admin/master/clinics' },
      { icon: FiList, label: 'Kategori Biaya', href: '/admin/master/expense-categories' },
    ]
  }
]

// --- Small Tooltip Component ---
const Tooltip = ({ text, visible }: { text: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="fixed left-20 z-[60] px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-md"
      >
        {text}
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-gray-900" />
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
        className={`flex items-center rounded-xl transition-all group ${
          isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5'
        } ${
          isActive
            ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/10'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
        }`}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
        {(!isCollapsed || isMobile) && <span className="text-sm truncate">{item.label}</span>}
        {isActive && !isCollapsed && <motion.span layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
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
  accentColor = 'primary'
}: { 
  group: any; 
  pathname: string; 
  isCollapsed: boolean; 
  isMobile: boolean;
  openGroups: string[];
  toggleGroup: (label: string) => void;
  accentColor?: 'primary' | 'indigo';
}) => {
  const [hover, setHover] = useState(false)
  const isGroupActive = useMemo(() => group.items.some((i: any) => pathname === i.href), [group.items, pathname])
  const isOpen = openGroups.includes(group.label) || isGroupActive

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={() => toggleGroup(group.label)}
        className={`flex items-center rounded-xl transition-all ${
          isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
        } ${
          isGroupActive && !isOpen
            ? accentColor === 'primary' ? 'bg-primary/5 text-primary' : 'bg-indigo-50/50 text-indigo-600'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <group.icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? (accentColor === 'primary' ? 'text-primary' : 'text-indigo-600') : ''}`} />
        {(!isCollapsed || isMobile) && (
          <>
            <span className={`text-sm flex-1 text-left truncate ${accentColor === 'primary' ? 'font-black' : 'font-bold'}`}>{group.label}</span>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <FiChevronDown className="w-3.5 h-3.5 opacity-50" />
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
            <div className={`mt-1 space-y-1 border-l-2 ${accentColor === 'primary' ? 'border-primary/20' : 'border-gray-100'} pl-3 py-1`}>
              {group.items.map((item: any) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs ${
                      isActive
                        ? accentColor === 'primary' 
                          ? 'bg-primary text-white font-black shadow-md shadow-primary/20'
                          : 'bg-primary/10 text-primary font-black'
                        : 'text-gray-500 hover:text-primary font-bold'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="truncate">{item.label}</span>
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
  <div className="flex flex-col h-full bg-white">
    {/* Brand */}
    <div className={`flex-shrink-0 flex items-center transition-all duration-300 ${isCollapsed && !isMobile ? 'h-20 justify-center' : 'h-24 px-6'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20 text-white font-black text-xl">
          Y
        </div>
        {(!isCollapsed || isMobile) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
            <span className="font-black text-lg text-gray-900 tracking-tight leading-none block">Yasfina</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 block">Management</span>
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
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pt-4 pb-2">
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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pb-2 pt-4">
            Transaksi & Antrian
          </p>
        )}
        
        {TRANSAKSI_GROUPS.map((group) => (
          <SidebarNavGroup 
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
          />
        ))}
      </div>

      {/* Klinik & Medis Section */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pb-2 pt-4">
            Klinik & Medis
          </p>
        )}
        
        {KLINIK_GROUPS.map((group) => (
          <SidebarNavGroup 
            key={group.label}
            group={group}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            accentColor="primary"
          />
        ))}
      </div>

      {/* Logistics and Inventory Outside Master */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pb-2 pt-4">
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
          />
        ))}
      </div>

      {/* Master Data Categorized */}
      <div className="flex flex-col gap-1 mt-2">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 pb-2 pt-4">
            Data Master
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
          />
        ))}
      </div>
    </nav>

    {/* Footer / User Profile */}
    <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0 bg-white">
      {(!isCollapsed || isMobile) && (
        <div className="px-4 py-3 rounded-2xl bg-gray-50/80 border border-gray-100 group transition-all hover:bg-white hover:shadow-md cursor-pointer">
          <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 truncate">
                  <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{user?.name || 'Administrator'}</p>
                  <p className="text-[9px] font-bold text-gray-400 truncate tracking-wide">{user?.email}</p>
              </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
          <button
            onClick={logout}
            className={`flex items-center rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm ${
              isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
            }`}
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span>Keluar</span>}
          </button>
          
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className={`flex items-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-primary transition-all font-bold text-sm ${
                  isCollapsed && !isMobile ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
              }`}
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
    
    // Check which group should be open initially based on pathname
    const activeMasterGroup = MASTER_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeTransaksiGroup = TRANSAKSI_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeLogistikGroup = LOGISTIK_GROUPS.find(g => g.items.some(i => i.href === pathname))
    const activeKlinikGroup = KLINIK_GROUPS.find(g => g.items.some(i => i.href === pathname))
    
    const initialOpen: string[] = []
    if (activeMasterGroup) initialOpen.push(activeMasterGroup.label)
    if (activeTransaksiGroup) initialOpen.push(activeTransaksiGroup.label)
    if (activeLogistikGroup) initialOpen.push(activeLogistikGroup.label)
    if (activeKlinikGroup) initialOpen.push(activeKlinikGroup.label)
    
    if (initialOpen.length > 0) {
      setOpenGroups(prev => Array.from(new Set([...prev, ...initialOpen])))
    }
  }, []) // Run only once on mount

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

  // Close mobile menu on route change
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
        className="lg:hidden fixed top-4 right-4 z-[45] p-2.5 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 text-gray-900 hover:text-primary transition-all active:scale-95"
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
            className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-white z-[60] flex flex-col shadow-2xl border-r border-gray-100"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100/50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all z-[70]"
            >
              <FiX className="w-4 h-4" />
            </button>
            <SidebarContent isMobile {...contentProps} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-50 flex-col shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <SidebarContent {...contentProps} />
      </motion.aside>
      
      {/* Spacer to push content */}
      <motion.div 
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="hidden lg:block transition-all"
      />
    </>
  )
}
