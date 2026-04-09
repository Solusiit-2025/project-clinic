'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FiGlobe, FiAlertCircle, FiPhone, FiMail, FiMapPin, FiHash } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge } from '@/components/admin/master/StatusBadge'

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/master/clinics'
const EMPTY = { name: '', code: '', address: '', phone: '', email: '', isActive: true, isMain: false }

type Clinic = {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  isMain: boolean
  _count?: {
    users: number
    departments: number
  }
}

export default function ClinicsPage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Clinic | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchClinics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(API, { 
        headers,
        params: search ? { search } : {} 
      })
      setData(response.data)
    } catch (err: any) {
      console.error('Failed to fetch clinics:', err)
    } finally {
      setLoading(false)
    }
  }, [search, token])

  useEffect(() => {
    fetchClinics()
  }, [fetchClinics])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (clinic: Clinic) => {
    setEditing(clinic)
    setForm({
      name: clinic.name,
      code: clinic.code,
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      isActive: clinic.isActive,
      isMain: clinic.isMain
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.code) {
      setError('Nama dan Kode Cabang wajib diisi')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editing) {
        await axios.put(`${API}/${editing.id}`, form, { headers })
      } else {
        await axios.post(API, form, { headers })
      }
      setModalOpen(false)
      fetchClinics()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setSaving(true) // Should be false, fixed below
      setSaving(false)
    }
  }

  const handleDelete = async (clinic: Clinic) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus cabang "${clinic.name}"?`)) return
    try {
      await axios.delete(`${API}/${clinic.id}`, { headers })
      fetchClinics()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus cabang.')
    }
  }

  const columns: Column<Clinic>[] = [
    { 
      key: 'name', 
      label: 'Nama Cabang', 
      render: (r) => (
        <div>
          <p className="text-sm font-bold text-gray-900">{r.name}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
            <FiHash className="w-2.5 h-2.5" />
            <span>ID: {r.code}</span>
            {r.isMain && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-wider border border-amber-200 shadow-sm animate-pulse">
                Induk
              </span>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'contact', 
      label: 'Kontak & Alamat', 
      mobileHide: true,
      render: (r) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiPhone className="w-3 h-3 text-gray-400" />
            <span>{r.phone || '—'}</span>
          </div>
          <p className="text-[10px] text-gray-400 max-w-[200px] truncate">{r.address || 'Alamat belum diset'}</p>
        </div>
      )
    },
    { 
      key: 'stats', 
      label: 'Statistik', 
      mobileHide: true,
      render: (r) => (
        <div className="flex gap-2">
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
            {r._count?.users || 0} Users
          </span>
          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
            {r._count?.departments || 0} Dept
          </span>
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'Status', 
      render: (r) => <StatusBadge active={r.isActive} /> 
    },
  ]

  return (
    <div>
      <PageHeader
        title="Manajemen Cabang / Klinik"
        subtitle="Kelola seluruh cabang klinik dan unit operasional Anda"
        icon={<FiGlobe className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={openAdd}
        addLabel="Tambah Cabang"
        count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Cabang Klinik']}
      />

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama, kode, atau alamat..."
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="Belum ada data cabang. Silakan tambahkan cabang pertama."
      />

      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Cabang' : 'Registrasi Cabang Baru'}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-700">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Cabang Klinik *</label>
              <input 
                value={form.name} 
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="cth: Klinik Yasfina Pusat"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Kode Cabang (Unique) *</label>
              <div className="relative">
                <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={form.code} 
                  onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="K001"
                  disabled={!!editing}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:bg-gray-50" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">No. Telepon / WhatsApp</label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={form.phone} 
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium" 
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Operasional</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email"
                  value={form.email} 
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="clinic.branch@email.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium" 
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Alamat Lengkap</label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-4 text-gray-400" />
                <textarea 
                  value={form.address} 
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Jl. Raya Utama No. 123..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-all font-medium resize-none" 
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
              <button 
                type="button" 
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} 
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">{form.isActive ? 'Cabang Aktif' : 'Cabang Nonaktif'}</span>
                <span className="text-[10px] text-gray-400 font-medium italic">Cabang nonaktif tidak dapat diakses untuk operasional baru</span>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <button 
                type="button" 
                onClick={() => setForm(p => ({ ...p, isMain: !p.isMain }))} 
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isMain ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isMain ? 'translate-x-6' : ''}`} />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-indigo-900">{form.isMain ? 'Klinik Induk (Pusat)' : 'Atur sebagai Klinik Induk'}</span>
                <span className="text-[10px] text-indigo-500 font-medium italic">Klinik Induk memiliki akses kontrol utama untuk melihat data seluruh cabang</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button 
              onClick={() => setModalOpen(false)} 
              className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all text-center"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-60 active:scale-95"
            >
              {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Daftarkan Cabang')}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
