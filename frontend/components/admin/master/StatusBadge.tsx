interface StatusBadgeProps {
  active?: boolean
  label?: string
  variant?: 'dot' | 'pill'
}

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SUPER_ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Super Admin' },
  ADMIN:       { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Admin' },
  DOCTOR:      { bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Dokter' },
  RECEPTIONIST:{ bg: 'bg-cyan-100',   text: 'text-cyan-700',   label: 'Resepsionis' },
  FARMASI:     { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Farmasi' },
  ACCOUNTING:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Accounting' },
  LOGISTIC:    { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Logistik' },
  STAFF:       { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Staff' },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  consultation: { bg: 'bg-blue-50',    text: 'text-blue-700' },
  treatment:    { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  test:         { bg: 'bg-purple-50',  text: 'text-purple-700' },
  procedure:    { bg: 'bg-orange-50',  text: 'text-orange-700' },
  medicine:     { bg: 'bg-red-50',     text: 'text-red-700' },
  supplies:     { bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  equipment:    { bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  // Clinical Categories
  cardiology:   { bg: 'bg-rose-50',    text: 'text-rose-700' },
  dental:       { bg: 'bg-teal-50',    text: 'text-teal-700' },
  radiology:    { bg: 'bg-violet-50',  text: 'text-violet-700' },
  'general medical': { bg: 'bg-sky-50', text: 'text-sky-700' },
  // Administrative Categories
  'office equipment': { bg: 'bg-slate-50', text: 'text-slate-700' },
  security:     { bg: 'bg-zinc-50',    text: 'text-zinc-700' },
  facility:     { bg: 'bg-amber-50',   text: 'text-amber-700' },
}

export function StatusBadge({ active = true }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_COLORS[role] || ROLE_COLORS['STAFF']
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_COLORS[category] || { bg: 'bg-gray-50', text: 'text-gray-600' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${config.bg} ${config.text} capitalize`}>
      {category}
    </span>
  )
}
