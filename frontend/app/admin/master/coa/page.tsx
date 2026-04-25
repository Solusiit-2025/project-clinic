'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { FiList, FiAlertCircle, FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiFolder, FiFileText, FiRefreshCcw, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

const ACCOUNT_CATEGORIES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
const ACCOUNT_TYPES = ['HEADER', 'DETAIL']

const EMPTY = {
  code: '',
  name: '',
  category: 'ASSET',
  accountType: 'DETAIL',
  parentId: '',
  openingBalance: 0,
  isActive: true,
  isReconciled: false,
  clinicId: ''
}

interface COA {
  id: string
  code: string
  name: string
  category: string
  accountType: string
  parentId?: string | null
  openingBalance: number
  isActive: boolean
  isReconciled: boolean
  clinicId?: string | null
  parent?: { name: string; code: string } | null
  _count?: { children: number }
}

interface HierarchicalCOA extends COA {
  depth: number
}

export default function COAPage() {
  const { activeClinicId } = useAuthStore()
  const [rawData, setRawData] = useState<COA[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<COA | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterCategory) params.category = filterCategory
      
      const { data: resData } = await api.get('/master/coa', { params })
      setRawData(resData)
    } catch (e) {
      console.error('Failed to fetch COA', e)
      toast.error('Gagal mengambil data Chart of Accounts')
    } finally {
      setLoading(false)
    }
  }, [search, filterCategory])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Hierarchical Transformation Logic
  const hierarchicalData = useMemo(() => {
    const buildTree = (items: COA[], parentId: string | null = null, depth = 0): HierarchicalCOA[] => {
      const result: HierarchicalCOA[] = []
      const children = items.filter(i => i.parentId === parentId)
      
      // If we are filtering by search, we might want to just show flat results
      // but the user asked for hierarchy, so we'll show hierarchy of matching nodes
      
      children.sort((a, b) => a.code.localeCompare(b.code))
      
      for (const child of children) {
        result.push({ ...child, depth })
        result.push(...buildTree(items, child.id, depth + 1))
      }
      return result
    }

    if (search) {
        // If searching, keep it flat so matches are visible easily, or filter the raw data
        return rawData as HierarchicalCOA[]
    }

    // Sort by category first to group them, then build tree within each category
    const categorized: HierarchicalCOA[] = []
    ACCOUNT_CATEGORIES.forEach(cat => {
        const catItems = buildTree(rawData.filter(i => i.category === cat), null, 0)
        categorized.push(...catItems)
    })

    return categorized
  }, [rawData, search])

  const handleSave = async () => {
    if (!form.code || !form.name) {
      setError('Kode dan nama akun wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        openingBalance: Number(form.openingBalance),
        parentId: form.parentId === '' ? null : form.parentId,
        clinicId: activeClinicId
      }

      if (editing) {
        await api.put(`/master/coa/${editing.id}`, payload)
        toast.success('Akun berhasil diperbarui')
      } else {
        await api.post('/master/coa', payload)
        toast.success('Akun baru berhasil ditambahkan')
      }
      
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r: COA) => {
    if (confirm(`Hapus akun "${r.code} - ${r.name}"? Operasi ini tidak dapat dibatalkan.`)) {
      try {
        await api.delete(`/master/coa/${r.id}`)
        toast.success('Akun berhasil dihapus')
        fetchData()
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Gagal menghapus akun')
      }
    }
  }

  const columns: Column<HierarchicalCOA>[] = [
    { 
      key: 'code', 
      label: 'KODE & NAMA AKUN', 
      render: (r) => (
        <div 
          className="flex items-start gap-3 py-1"
          style={{ paddingLeft: `${(r.depth || 0) * 32}px` }}
        >
          {/* Visual line for hierarchy */}
          {r.depth > 0 && <div className="w-6 h-6 border-l-2 border-b-2 border-slate-100 rounded-bl-xl -mt-3.5 -ml-4" />}

          <div className={`p-2 rounded-xl flex-shrink-0 ${r.accountType === 'HEADER' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
            {r.accountType === 'HEADER' ? <FiFolder className="w-4 h-4" /> : <FiFileText className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-widest ${r.accountType === 'HEADER' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                {r.code}
              </span>
              <span className={`text-sm font-black tracking-tight ${r.accountType === 'HEADER' ? 'text-indigo-900 underline decoration-indigo-200 decoration-2 underline-offset-4' : 'text-slate-800'}`}>
                {r.name}
              </span>
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'KATEGORI', 
      render: (r) => {
        const colors: any = {
          ASSET: 'text-emerald-700 bg-emerald-50 border-emerald-100',
          LIABILITY: 'text-rose-700 bg-rose-50 border-rose-100',
          EQUITY: 'text-indigo-700 bg-indigo-50 border-indigo-100',
          REVENUE: 'text-blue-700 bg-blue-50 border-blue-100',
          EXPENSE: 'text-amber-700 bg-amber-50 border-amber-100'
        }
        return (
          <span className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl border shadow-sm ${colors[r.category] || 'bg-gray-50'}`}>
            {r.category}
          </span>
        )
      }
    },
    { 
      key: 'isReconciled', 
      label: 'REKONSILIASI', 
      className: 'w-[150px]',
      render: (r) => (
        <div className="flex items-center gap-2">
            {r.isReconciled ? (
                <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                    <FiRefreshCcw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Bisa Rekon</span>
                </div>
            ) : (
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-4">Tidak</span>
            )}
        </div>
      )
    },
    { 
      key: 'openingBalance', 
      label: 'SALDO AWAL', 
      render: (r) => (
        <div className="text-right pr-4">
          <p className="text-sm font-black text-slate-900">
            {r.openingBalance > 0 ? `Rp ${r.openingBalance.toLocaleString('id-ID')}` : '-'}
          </p>
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'STATUS', 
      render: (r) => <StatusBadge active={r.isActive} /> 
    }
  ]

  const headerAccounts = rawData.filter(a => a.accountType === 'HEADER' && (!editing || a.id !== editing.id))

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      <PageHeader
        title="Chart of Accounts (COA)"
        subtitle="Kelola struktur kode akun secara hirarki dari Parent hingga Detail Akun."
        icon={<FiLayers className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={() => {
          setEditing(null)
          setForm(EMPTY)
          setError('')
          setModalOpen(true)
        }}
        addLabel="Tambah Akun"
        count={rawData.length}
        breadcrumb={['Admin', 'Keuangan', 'Chart of Accounts']}
      />

      <DataTable
        data={hierarchicalData}
        columns={columns}
        loading={loading}
        groupBy={search ? undefined : (r: HierarchicalCOA) => r.category}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari kode atau nama akun..."
        extraFilters={
          <div className="flex gap-2">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 text-xs border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-600 bg-white font-black text-slate-600 shadow-sm transition-all"
            >
              <option value="">Semua Kategori</option>
              {ACCOUNT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        }
        onEdit={(r) => {
          setEditing(r)
          setForm({
            ...r,
            parentId: r.parentId || '',
            clinicId: r.clinicId || ''
          })
          setError('')
          setModalOpen(true)
        }}
        onDelete={handleDelete}
      />

      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Akun Keuangan' : 'Registrasi Akun Baru'}
        size="lg"
      >
        <div className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Akun *</label>
              <input 
                type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})}
                placeholder="cth: 1101, 2100"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Akun *</label>
              <input 
                type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="cth: Kas di Bank, Piutang Pasien"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Utama</label>
              <select 
                value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              >
                {ACCOUNT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Akun</label>
              <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1.5">
                {ACCOUNT_TYPES.map(t => (
                  <button
                    key={t} onClick={() => setForm({...form, accountType: t})}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.accountType === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Account (Grup)</label>
              <select 
                value={form.parentId} onChange={(e) => setForm({...form, parentId: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              >
                <option value="">-- No Parent (Top Level) --</option>
                {headerAccounts.filter(a => a.category === form.category).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Awal (Rp)</label>
              <input 
                type="number" value={form.openingBalance} onChange={(e) => setForm({...form, openingBalance: Number(e.target.value)})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-black text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-right"
              />
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
               <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Status Aktif</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Toggle untuk (Non)-aktifkan akun.</p>
               </div>
               <button 
                  onClick={() => setForm({...form, isActive: !form.isActive})}
                  className={`w-20 h-10 rounded-full p-1.5 transition-all duration-300 flex ${form.isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
               >
                  <motion.div layout className="w-7 h-7 bg-white rounded-full shadow-lg" />
               </button>
            </div>

            <div className="flex items-center gap-4 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
               <div className="flex-1">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Rekonsiliasi</h4>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Dapat direkonsiliasi bank/stok.</p>
               </div>
               <button 
                  onClick={() => setForm({...form, isReconciled: !form.isReconciled})}
                  className={`w-20 h-10 rounded-full p-1.5 transition-all duration-300 flex ${form.isReconciled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
               >
                  <motion.div layout className="w-7 h-7 bg-white rounded-full shadow-lg" />
               </button>
            </div>

          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-5 border border-slate-100 rounded-[1.5rem] text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-indigo-500/20 disabled:opacity-60 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {saving ? 'Menyimpan...' : (editing ? 'Perbarui Akun' : 'Daftarkan Akun')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
