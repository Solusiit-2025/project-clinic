'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { FiPlus, FiBriefcase, FiUser, FiMapPin, FiPhone, FiPercent, FiDollarSign, FiSearch, FiAlertCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import PageHeader from '@/components/admin/master/PageHeader'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface CorporatePartner {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  contactPerson?: string
  isActive: boolean
  creditLimit?: number
  contractDiscountRate?: number
  taxRate?: number
}

const EMPTY = {
  name: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
  isActive: true,
  creditLimit: 0,
  contractDiscountRate: 0,
  taxRate: 0
}

export default function CorporatePartnersPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<CorporatePartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CorporatePartner | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!activeClinicId) return
    setLoading(true)
    try {
      const res = await api.get('/master/corporate-partners', { params: { clinicId: activeClinicId } })
      setData(res.data)
    } catch (e) {
      console.error('Failed to fetch corporate partners', e)
      toast.error('Gagal mengambil data relasi perusahaan')
    } finally {
      setLoading(false)
    }
  }, [activeClinicId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  const handleOpenAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const handleOpenEdit = (item: CorporatePartner) => {
    setEditing(item)
    setForm({
      name: item.name,
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      contactPerson: item.contactPerson || '',
      isActive: item.isActive,
      creditLimit: item.creditLimit || 0,
      contractDiscountRate: item.contractDiscountRate || 0,
      taxRate: item.taxRate || 0
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus relasi perusahaan ini?')) return
    try {
      await api.delete(`/master/corporate-partners/${id}`)
      toast.success('Perusahaan berhasil dihapus')
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus perusahaan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, clinicId: activeClinicId }
      if (editing) {
        await api.put(`/master/corporate-partners/${editing.id}`, payload)
        toast.success('Perusahaan berhasil diperbarui')
      } else {
        await api.post('/master/corporate-partners', payload)
        toast.success('Perusahaan baru berhasil ditambahkan')
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<CorporatePartner>[] = [
    {
      label: 'Perusahaan',
      key: 'name',
      render: (item) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
            <FiBriefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-slate-800 text-sm">{item.name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
              <FiUser className="w-3 h-3" /> PIC: {item.contactPerson || '-'}
            </p>
          </div>
        </div>
      )
    },
    {
      label: 'Kontak & Alamat',
      key: 'phone',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FiPhone className="text-slate-400 w-3 h-3" />
            <span className="text-xs font-bold text-slate-600">{item.phone || '-'}</span>
          </div>
          <div className="flex items-start gap-2 max-w-[200px]">
            <FiMapPin className="text-slate-400 w-3 h-3 mt-0.5 shrink-0" />
            <span className="text-[10px] text-slate-500 leading-tight truncate">{item.address || '-'}</span>
          </div>
        </div>
      )
    },
    {
      label: 'Info Tagihan (B2B)',
      key: 'creditLimit',
      render: (item) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-12">Plafon:</span>
            <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              {item.creditLimit ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.creditLimit) : 'UNLIMITED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-12">Diskon:</span>
            <span className="text-[10px] font-bold text-emerald-600">{item.contractDiscountRate || 0}%</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mx-1">PPN:</span>
            <span className="text-[10px] font-bold text-rose-600">{item.taxRate || 0}%</span>
          </div>
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
        title="Master Relasi Perusahaan" 
        subtitle="Kelola data perusahaan untuk keperluan Tagihan Kolektif (Corporate Billing)."
        icon={<FiBriefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
        addLabel="Tambah Perusahaan"
        onAdd={handleOpenAdd}
        count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Relasi Perusahaan']}
      />

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
             <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5 pointer-events-none" />
             <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama perusahaan atau PIC..."
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.75rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
             />
          </div>
      </div>

      <AnimatePresence>
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <DataTable 
                data={filteredData} 
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
        title={editing ? 'Perbarui Data Perusahaan' : 'Tambah Perusahaan Baru'}
        subtitle="Atur informasi perusahaan, plafon tagihan, dan diskon kontrak."
        size="3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-2">
          {/* Identitas */}
          <div className="space-y-4 md:col-span-2">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">Identitas Perusahaan</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Perusahaan *</label>
                  <input 
                     required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                     placeholder="PT. Maju Mundur"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama PIC (Kontak)</label>
                  <input 
                     value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})}
                     placeholder="Budi Santoso"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                  <textarea 
                     value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                     placeholder="Alamat perusahaan..."
                     rows={2}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Telepon / WA</label>
                  <input 
                     value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                     placeholder="08123456789"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                     type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                     placeholder="info@perusahaan.com"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
             </div>
          </div>

          {/* Billing Rules */}
          <div className="space-y-4 md:col-span-2 mt-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-2">Aturan Penagihan (B2B)</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><FiDollarSign/> Credit Limit (Rp)</label>
                  <input 
                     type="number" value={form.creditLimit} onChange={(e) => setForm({...form, creditLimit: parseFloat(e.target.value) || 0})}
                     placeholder="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 italic">Isi 0 jika tidak ada batas plafon.</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><FiPercent/> Diskon Kontrak (%)</label>
                  <input 
                     type="number" step="0.1" value={form.contractDiscountRate} onChange={(e) => setForm({...form, contractDiscountRate: parseFloat(e.target.value) || 0})}
                     placeholder="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><FiPercent/> Pajak / PPN (%)</label>
                  <input 
                     type="number" step="0.1" value={form.taxRate} onChange={(e) => setForm({...form, taxRate: parseFloat(e.target.value) || 0})}
                     placeholder="0"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                  />
               </div>
             </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
             <input 
                type="checkbox" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})}
                className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500"
             />
             <div>
                <p className="text-sm font-black text-slate-700 leading-none">Status Perusahaan Aktif</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Hanya perusahaan aktif yang dapat dipilih saat registrasi pasien.</p>
             </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 md:col-span-2">
             <button 
               type="button"
               onClick={() => setModalOpen(false)} 
               className="flex-1 py-4 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase hover:bg-slate-50 transition-all"
             >
               Batal
             </button>
             <button 
               onClick={handleSubmit} 
               disabled={saving} 
               className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-500/20 disabled:opacity-60 hover:bg-blue-700 transition-all active:scale-95"
             >
               {saving ? 'Menyimpan...' : (editing ? 'Perbarui Data' : 'Daftarkan Perusahaan')}
             </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
