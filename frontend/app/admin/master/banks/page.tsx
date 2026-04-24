'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBriefcase, FiCreditCard, FiUser, FiActivity } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import PageHeader from '@/components/admin/master/PageHeader'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

interface Bank {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
  coaId: string
  clinicId: string
  isActive: boolean
  coa?: { name: string; code: string }
}

const EMPTY = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  coaId: '',
  isActive: true
}

export default function BanksPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<Bank[]>([])
  const [coaList, setCoaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bank | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const headers = { 
    Authorization: `Bearer ${token}`,
    'x-clinic-id': activeClinicId
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: banks }, { data: coas }] = await Promise.all([
        axios.get(`${API}/banks`, { headers, params: { search } }),
        axios.get(`${API}/coa`, { headers })
      ])
      setData(banks)
      setCoaList(coas.filter((c: any) => c.accountType === 'DETAIL'))
    } catch (e) {
      console.error('Failed to fetch banks', e)
      toast.error('Gagal mengambil data Bank')
    } finally {
      setLoading(false)
    }
  }, [search, token, activeClinicId])

  useEffect(() => {
    if (token) fetchData()
  }, [fetchData, token])

  const handleOpenAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Bank) => {
    setEditing(item)
    setForm({
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      accountHolder: item.accountHolder,
      coaId: item.coaId,
      isActive: item.isActive
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data bank ini?')) return
    try {
      await axios.delete(`${API}/banks/${id}`, { headers })
      toast.success('Bank berhasil dihapus')
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus bank')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await axios.put(`${API}/banks/${editing.id}`, form, { headers })
        toast.success('Bank berhasil diperbarui')
      } else {
        await axios.post(`${API}/banks`, { ...form, clinicId: activeClinicId }, { headers })
        toast.success('Bank baru berhasil ditambahkan')
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan data bank')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Bank>[] = [
    {
      label: 'Bank & Rekening',
      key: 'bankName',
      render: (item) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <FiCreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-slate-800 text-sm tracking-tight">{item.bankName}</p>
            <p className="text-[11px] font-bold text-indigo-600 tracking-widest uppercase">{item.accountNumber}</p>
          </div>
        </div>
      )
    },
    {
      label: 'Atas Nama',
      key: 'accountHolder',
      render: (item) => (
        <div className="flex items-center gap-2">
          <FiUser className="text-slate-400 w-3.5 h-3.5" />
          <span className="text-xs font-bold text-slate-600">{item.accountHolder}</span>
        </div>
      )
    },
    {
      label: 'Link Akun (COA)',
      key: 'coaId',
      render: (item) => (
        <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl inline-block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{item.coa?.code}</p>
          <p className="text-xs font-black text-slate-700">{item.coa?.name}</p>
        </div>
      )
    },
    {
      label: 'Status',
      key: 'isActive',
      render: (item) => <StatusBadge active={item.isActive} />
    }
  ]

  return (
    <div className="p-10 space-y-10">
      <PageHeader 
        title="Daftar Rekening Bank" 
        subtitle="Kelola rekening bank klinik untuk keperluan penagihan dan rekonsiliasi."
        icon={<FiBriefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
        addLabel="Tambah Bank"
        onAdd={handleOpenAdd}
        count={data.length}
      />

      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
             <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors w-5 h-5 pointer-events-none" />
             <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari bank, nomor rekening, atau pemilik..."
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.75rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
             />
          </div>
      </div>

      <AnimatePresence>
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <DataTable 
                data={data} 
                columns={columns} 
                loading={loading}
                onEdit={handleOpenEdit}
                onDelete={(item) => handleDelete(item.id)}
             />
          </motion.div>
        )}
      </AnimatePresence>

      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Perbarui Rekening Bank' : 'Tambah Rekening Bank'}
        subtitle="Pastikan informasi rekening sudah sesuai untuk keperluan penagihan."
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Bank</label>
             <input 
                required value={form.bankName} onChange={(e) => setForm({...form, bankName: e.target.value})}
                placeholder="Contoh: Bank Central Asia (BCA)"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nomor Rekening</label>
             <input 
                required value={form.accountNumber} onChange={(e) => setForm({...form, accountNumber: e.target.value})}
                placeholder="Contoh: 1234567890"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Atas Nama (Holder)</label>
             <input 
                required value={form.accountHolder} onChange={(e) => setForm({...form, accountHolder: e.target.value})}
                placeholder="Contoh: Klinik Yasfina"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800"
             />
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Link COA (Mapping Akun)</label>
             <select 
                required value={form.coaId} onChange={(e) => setForm({...form, coaId: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-800 appearance-none"
             >
                <option value="">-- Pilih Akun COA --</option>
                {coaList.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
             </select>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
             <input 
                type="checkbox" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})}
                className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500"
             />
             <div>
                <p className="text-sm font-black text-slate-700 leading-none">Status Aktif</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Hanya bank aktif yang akan muncul di pilihan Invoice.</p>
             </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100 md:col-span-2">
             <button 
               type="button"
               onClick={() => setModalOpen(false)} 
               className="flex-1 py-5 border border-slate-100 rounded-[1.5rem] text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase hover:bg-slate-50 transition-all"
             >
               Batal
             </button>
             <button 
               onClick={handleSubmit} 
               disabled={saving} 
               className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-indigo-500/20 disabled:opacity-60 hover:bg-indigo-700 transition-all active:scale-95"
             >
               {saving ? 'Menyimpan...' : (editing ? 'Perbarui Rekening' : 'Daftarkan Rekening')}
             </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
