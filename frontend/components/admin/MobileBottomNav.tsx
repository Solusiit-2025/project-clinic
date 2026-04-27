'use client'

/**
 * MobileBottomNav — Native-like bottom navigation for mobile/tablet.
 * Shows the 5 most-used shortcuts. Only visible on screens < lg (1024px).
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiHome, FiUserPlus, FiActivity, FiDollarSign, FiMenu
} from 'react-icons/fi'

const NAV_ITEMS = [
  { icon: FiHome,       label: 'Dashboard',    href: '/admin' },
  { icon: FiUserPlus,   label: 'Daftar',       href: '/admin/transactions/registration' },
  { icon: FiActivity,   label: 'Antrian',      href: '/admin/transactions/queue' },
  { icon: FiDollarSign, label: 'Keuangan',     href: '/admin/finance' },
]

interface MobileBottomNavProps {
  onMenuOpen: () => void
}

export default function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-stretch"
      style={{
        backgroundColor: 'var(--navbar-bg)',
        borderColor: 'var(--navbar-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95"
            style={{ color: isActive ? 'var(--primary)' : 'var(--text-faint)' }}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'text-primary' : ''}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        )
      })}

      {/* More / Full Menu */}
      <button
        onClick={onMenuOpen}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95"
        style={{ color: 'var(--text-faint)' }}
      >
        <div className="p-1.5 rounded-xl">
          <FiMenu className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wide">Menu</span>
      </button>
    </nav>
  )
}
