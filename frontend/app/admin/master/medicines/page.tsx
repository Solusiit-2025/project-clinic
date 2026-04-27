'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { FiPackage, FiAlertCircle, FiUpload, FiX, FiCamera, FiSearch } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Liquid', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Gel', 'Solution']
const EMPTY = { 
  medicineName: '', 
  genericName: '', 
  description: '', 
  dosageForm: 'Tablet', 
  strength: '', 
  manufacturer: '', 
  batchNumber: '', 
  expiryDate: '', 
  isActive: true,
  clinicId: '',
  masterProductId: '',
  image: null as File | string | null
}

type Medicine = {
  id: string; medicineName: string; genericName?: string; description?: string; dosageForm?: string
  strength?: string; manufacturer?: string; batchNumber?: string; expiryDate?: string; isActive: boolean;
  image?: string;
  clinicId?: string;
  clinic?: { name: string; code: string };
  totalStock?: number;
  stock?: number;
  unit?: string;
  productMaster?: {
    products: {
      id: string;
      quantity: number;
      purchasePrice: number;
      sellingPrice: number;
      usedUnit: string;
      unit: string;
      clinicId: string;
      isActive: boolean;
    }[]
  }
}

export default function MedicinesPage() {
  const { activeClinicId, user } = useAuthStore()
  const [data, setData] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterClinic, setFilterClinic] = useState('')
  const [clinics, setClinics] = useState<{id: string, name: string, code: string}[]>([])
  const [productMasters, setProductMasters] = useState<{id: string, masterName: string, masterCode: string, description?: string}[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Use a derived isAdmin state for UI logic
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.clinics?.some(c => c.isMain)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterClinic) params.clinicId = filterClinic
      
      const { data: resData } = await api.get('/master/medicines', { params })
      const medicineList = Array.isArray(resData) ? resData : (resData?.data || [])
      setData(medicineList)
    } catch (e) {
      console.error('Failed to fetch medicines', e)
      setData([])
    } finally { setLoading(false) }
  }, [search, filterClinic])

  const fetchClinics = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/master/clinics'),
        api.get('/master/products')
      ])
      setClinics(Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data || []))
      setProductMasters(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []))
    } catch (e) { 
      console.error('Failed to fetch support data', e)
    }
  }, [])

  useEffect(() => { 
    fetchData()
    fetchClinics()
  }, [fetchData, fetchClinics])

  const openAdd = () => { 
    setEditing(null)
    setForm(EMPTY)
    setImagePreview(null)
    setError('')
    setModalOpen(true) 
  }

  const openEdit = (r: Medicine) => {
    setEditing(r)
    setForm({ 
      medicineName: r.medicineName, 
      genericName: r.genericName || '', 
      description: r.description || '', 
      dosageForm: r.dosageForm || 'Tablet', 
      strength: r.strength || '', 
      manufacturer: r.manufacturer || '', 
      batchNumber: r.batchNumber || '', 
      expiryDate: r.expiryDate ? r.expiryDate.substring(0, 10) : '', 
      isActive: r.isActive,
      clinicId: r.clinicId || '',
      masterProductId: '',
      image: r.image || null
    })
    setImagePreview(r.image ? process.env.NEXT_PUBLIC_API_URL + r.image : null)
    setError('')
    setModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 2MB')
        return
      }
      setForm(p => ({ ...p, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!form.medicineName) { setError('Nama obat wajib diisi'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value instanceof File) formData.append('image', value)
        } else if (key === 'expiryDate') {
          if (value) formData.append('expiryDate', new Date(value as string).toISOString())
        } else {
          formData.append(key, String(value))
        }
      })

      if (editing) await api.put(`/master/medicines/${editing.id}`, formData)
      else await api.post('/master/medicines', formData)
      
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleDelete = async (r: Medicine) => {
    if (!confirm(`Hapus obat "${r.medicineName}"?`)) return
    try { await api.delete(`/master/medicines/${r.id}`); fetchData() } catch { }
  }

  const formColors: Record<string, string> = {
    Tablet: 'bg-blue-50 text-blue-700', 
    Capsule: 'bg-purple-50 text-purple-700', 
    Syrup: 'bg-cyan-50 text-cyan-700',
    Injection: 'bg-red-50 text-red-700', 
    Cream: 'bg-yellow-50 text-yellow-700',
  }

  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null)

  const columns: Column<Medicine>[] = [
    { key: 'medicineName', label: 'Detail Obat', render: (r) => (
      <div className="py-1 sm:py-2.5 flex items-start gap-2 sm:gap-4">
        {/* Photo Thumbnail */}
        <button 
          onClick={() => r.image && setPreviewImage({ url: process.env.NEXT_PUBLIC_API_URL + r.image, name: r.medicineName })}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative group active:scale-95 transition-all"
        >
          {r.image ? (
            <img 
              src={process.env.NEXT_PUBLIC_API_URL + r.image} 
              alt={r.medicineName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              <span className="text-[6px] sm:text-[7px] font-black text-gray-400 mt-0.5">NO</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            {r.image && <FiCamera className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all pointer-events-none" />}
          </div>
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 mt-0">
                <p className="text-[11px] sm:text-sm font-black text-gray-900 leading-none tracking-tight truncate">{r.medicineName}</p>
                {r.isActive && (
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0" title="Tersedia" />
                )}
            </div>
            
            <div className="space-y-0.5 sm:space-y-1">
                {r.genericName && (
                    <div className="flex items-center gap-1 sm:gap-1.5 group">
                        <span className="text-[7px] sm:text-[9px] uppercase font-black text-primary/40 tracking-widest border border-primary/10 px-0.5 sm:px-1.5 py-0.5 rounded-md bg-primary/[0.02] flex-shrink-0">Gen</span>
                        <p className="text-[9px] sm:text-[11px] text-gray-500 font-bold italic truncate">{r.genericName}</p>
                    </div>
                )}
                
                {r.description && (
                    <div className="relative pl-1.5 sm:pl-3 border-l-2 border-gray-100 py-0.5">
                        <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-1 max-w-[250px] sm:max-w-[400px]">
                            {r.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    )},
    { key: 'dosageForm', label: 'Bentuk', render: (r) => (
      <span className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg uppercase tracking-wider ${formColors[r.dosageForm || ''] || 'bg-gray-50 text-gray-600'}`}>
        {r.dosageForm || '—'}
      </span>
    )},
    { key: 'strength', label: 'Dosis', mobileHide: true, render: (r) => <span className="text-[9px] sm:text-[11px] font-bold text-gray-600 tracking-tight">{r.strength || '—'}</span> },
    { key: 'stock', label: 'STOK', render: (r) => {
      const products = r.productMaster?.products || []
      const isGlobal = products.length > 1 && !filterClinic
      const displayStock = r.stock ?? 0
      const unit = r.unit || 'Unit'
      
      if (products.length === 0) return (
        <div className="flex flex-col opacity-40">
           <span className="text-xs sm:text-sm font-black text-gray-400">0</span>
           <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-tighter">BELUM</span>
        </div>
      )

      return (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-0.5 sm:gap-1">
            <span className={`text-xs sm:text-sm font-black ${displayStock <= 10 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
              {displayStock}
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 lowercase">{unit}</span>
          </div>
          {isGlobal && <span className="text-[7px] sm:text-[9px] font-black text-blue-500 uppercase tracking-tighter">Global</span>}
          {displayStock <= 10 && !isGlobal && <span className="text-[7px] sm:text-[9px] font-black text-rose-500 uppercase tracking-tighter">Low</span>}
        </div>
      )
    }},
    { key: 'purchasePrice', label: 'BELI', mobileHide: true, render: (r) => {
      const products = r.productMaster?.products || []
      if (products.length === 0) return <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 italic">—</span>
      
      const prices = products.map(p => p.purchasePrice)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const isRange = minPrice !== maxPrice && !filterClinic

      return (
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black text-gray-600">
            {isRange ? `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}` : `Rp ${minPrice.toLocaleString('id-ID')}`}
          </span>
          <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-tighter">Per {r.unit}</span>
        </div>
      )
    }},
    { key: 'price', label: 'JUAL', render: (r) => {
      const products = r.productMaster?.products || []
      if (products.length === 0) return <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 italic">—</span>
      
      const prices = products.map(p => p.sellingPrice)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const isRange = minPrice !== maxPrice && !filterClinic

      return (
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black text-emerald-700">
            {isRange ? `Mulai Rp ${minPrice.toLocaleString('id-ID')}` : `Rp ${minPrice.toLocaleString('id-ID')}`}
          </span>
          <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-tighter">Per {r.unit}</span>
        </div>
      )
    }},
    { key: 'margin', label: 'MARGIN', mobileHide: true, render: (r) => {
      const products = r.productMaster?.products || []
      if (products.length === 0) return <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 italic">—</span>
      
      const first = products[0]
      const margin = (first.sellingPrice || 0) - (first.purchasePrice || 0)
      return (
        <div className="flex flex-col">
          <span className={`text-xs sm:text-sm font-black ${margin >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            Rp {margin.toLocaleString('id-ID')}
          </span>
          <span className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-tighter">Margin</span>
        </div>
      )
    }},
    { key: 'expiryDate', label: 'Kadaluarsa', mobileHide: true, render: (r) => {
      if (!r.expiryDate) return <span className="text-gray-300">—</span>
      const exp = new Date(r.expiryDate)
      const expired = exp < new Date()
      return (
        <div className={`flex flex-col items-start ${expired ? 'text-red-500' : 'text-gray-500'}`}>
            <span className="text-[8px] sm:text-[10px] font-black tracking-tighter uppercase">{expired ? 'Exp' : 'Safe'}</span>
            <span className="text-[9px] sm:text-[11px] font-bold">{exp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      )
    }},
    { key: 'isActive', label: 'STATUS', mobileHide: true, render: (r) => {
       const inv = r.productMaster?.products?.[0]
       return <StatusBadge active={inv ? inv.isActive : false} />
    }},
    { 
      key: 'clinic', 
      label: 'Cabang', 
      mobileHide: true,
      render: (r) => (
        <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-gray-700 uppercase tracking-tight">{(r as any).productMaster?.products?.length > 1 && !filterClinic ? 'Multi' : (r.clinic?.name || 'Local')}</span>
            <span className="text-[7px] sm:text-[9px] font-bold text-gray-400">{(r as any).productMaster?.products?.length > 1 && !filterClinic ? 'Mixed' : (r.clinic?.code || 'BASE')}</span>
        </div>
      )
    },
  ]

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input 
        type={type} value={(form as any)[key]} 
        onChange={(e) => setForm(p => ({...p, [key]: e.target.value}))} 
        placeholder={placeholder}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-100 bg-gray-50/30 rounded-lg sm:rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300 text-gray-700" 
      />
    </div>
  )

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 sm:space-y-6 md:space-y-8 text-left min-h-screen"
         style={{ 
           WebkitTapHighlightColor: 'transparent',
           WebkitTouchCallout: 'none',
           WebkitUserSelect: 'none',
           KhtmlUserSelect: 'none',
           MozUserSelect: 'none',
           msUserSelect: 'none',
           userSelect: 'none'
         }}>
      
      {/* RESPONSIVE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 px-1 sm:px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-600 rounded-lg sm:rounded-xl text-white shadow-md sm:shadow-lg shadow-indigo-200">
              <FiPackage className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Katalog Obat</h1>
              <p className="text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wide mt-0.5">Kelola pustaka obat-obatan dan master produk farmasi</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={openAdd}
          className="mt-2 sm:mt-0 bg-indigo-600 text-white flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg sm:shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 touch-button"
        >
          <FiPackage className="w-3 h-3 sm:w-4 sm:h-4" /> 
          <span className="hidden sm:inline">Tambah Obat</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm mx-1 sm:mx-2">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 sm:ml-3">Cari Obat</label>
            <div className="relative">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <input
                type="text" placeholder="Nama, generik, atau produsen..."
                className="w-full pl-8 sm:pl-10 pr-4 sm:pr-6 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 sm:ml-3">Cabang</label>
            <select 
              value={filterClinic} 
              onChange={(e) => setFilterClinic(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs border border-slate-100 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 bg-slate-50 font-black text-slate-700 transition-all"
            >
              <option value="">Cabang Aktif</option>
              <option value="all">Seluruh Cabang</option>
              {(Array.isArray(clinics) ? clinics : []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r) => {
          const val = r.dosageForm || 'Other'
          return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
        }}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama obat, generik, atau produsen..."
        extraFilters={null}
        onEdit={openEdit} onDelete={handleDelete}
        emptyText="Database obat masih kosong."
      />
      
      <MasterModal 
        isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Detail Informasi Obat' : 'Registrasi Obat Baru'} 
        size="lg"
      >
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold text-red-600 shadow-sm shadow-red-500/5">
                <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <SearchableSelect 
                label="Pilih dari Katalog Master Produk"
                placeholder="Cari nama atau kode produk (ex: Sanmol)..."
                options={(Array.isArray(productMasters) ? productMasters : []).map(m => ({
                  id: m.id,
                  label: m.masterName,
                  code: m.masterCode,
                  description: m.description
                }))}
                value={form.masterProductId}
                onChange={(id, opt) => {
                  setForm(p => ({
                    ...p,
                    masterProductId: id,
                    medicineName: opt?.label || '',
                    description: opt?.description || p.description
                  }))
                }}
                helperText="Jika produk belum ada, daftarkan dulu di menu Katalog Master."
                required
              />
            </div>

            <div className="sm:col-span-2 p-3 sm:p-5 bg-indigo-50/50 border-2 border-indigo-100/50 rounded-xl sm:rounded-[2rem]">
              <label className="block text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 sm:mb-2.5">Unit Penanggung Jawab Obat *</label>
              <select 
                value={form.clinicId} 
                onChange={(e) => setForm(p => ({...p, clinicId: e.target.value}))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-indigo-100 rounded-lg sm:rounded-2xl focus:outline-none focus:border-primary bg-white font-black text-indigo-700 shadow-sm"
              >
                <option value="">Pilih Cabang (Default ke Sidebar)...</option>
                {(Array.isArray(clinics) ? clinics : []).map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Image Upload Section */}
            <div className="sm:col-span-2">
                <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-2.5">Foto Produk Obat (Opsional)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 sm:gap-2 text-gray-300 group-hover:text-primary/40">
                                    <FiCamera className="w-6 h-6 sm:w-8 sm:h-8" />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Preview</span>
                                </div>
                            )}
                        </div>
                        {imagePreview && (
                            <button 
                                onClick={() => { setImagePreview(null); setForm(p => ({ ...p, image: null })) }}
                                className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all z-10"
                            >
                                <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-2 sm:space-y-3">
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-relaxed">
                            Unggah foto fisik obat atau kemasannya. Format yang didukung: <span className="font-black text-gray-600">JPG, PNG, WebP (Maks 2MB)</span>.
                        </p>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-2xl text-gray-700 font-black text-[9px] sm:text-xs hover:border-primary hover:text-primary hover:bg-primary/[0.02] active:scale-95 transition-all shadow-sm"
                        >
                            <FiUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>PILIH FOTO</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Produk Obat (Sesuai Katalog)</label>
              <input 
                type="text" value={form.medicineName} 
                readOnly
                placeholder="Pilih dari produk master di atas..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-100 bg-gray-100/50 rounded-lg sm:rounded-2xl focus:outline-none font-black text-gray-400 cursor-not-allowed uppercase" 
              />
            </div>
            {inp('Komposisi / Nama Generik', 'genericName', 'text', 'cth: Acetaminophen')}
            
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bentuk Sediaan</label>
              <select value={form.dosageForm} onChange={(e) => setForm(p => ({...p, dosageForm: e.target.value}))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-100 bg-gray-50/30 rounded-lg sm:rounded-2xl focus:outline-none focus:border-primary bg-white font-black capitalize text-gray-700">
                {FORMS.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
              </select>
            </div>

            {inp('Kekuatan Dosis', 'strength', 'text', 'cth: 500mg / 5ml')}
            {inp('Nama Pabrikan', 'manufacturer', 'text', 'cth: Sanbe Farma')}
            {inp('Nomor Batch Produksi', 'batchNumber', 'text', 'cth: BN-2026-X1')}
            {inp('Masa Berlaku / ED', 'expiryDate', 'date')}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gray-50/50 p-3 sm:p-4 rounded-lg sm:rounded-2xl border border-gray-100">
              <div className="flex-1">
                  <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Katalog</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-0.5">{form.isActive ? 'Obat Aktif dan bisa diperjualbelikan' : 'Obat nonaktif sementara'}</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.isActive ? 'bg-primary' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Deskripsi & Indikasi</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Berikan keterangan medis singkat mengenai obat ini..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-100 bg-gray-50/30 rounded-lg sm:rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300 text-gray-700 min-h-[100px] resize-none" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 sm:py-3.5 border border-gray-100 rounded-lg sm:rounded-2xl text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 sm:py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-lg sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-60 active:scale-95 transition-all">
                {saving ? 'PROSES MENYIMPAN...' : (editing ? 'PERBARUI DATA' : 'DAFTARKAN OBAT')}
            </button>
          </div>
        </div>
      </MasterModal>

      {/* Image Preview Modal (Lightbox) */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full bg-white rounded-xl sm:rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50"
            >
              <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-10">
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/20 shadow-xl"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row h-[60vh] md:h-auto max-h-[85vh]">
                <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden p-3 sm:p-6 md:p-0">
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.name} 
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg sm:rounded-xl"
                  />
                </div>
                <div className="w-full md:w-80 p-4 sm:p-8 flex flex-col justify-center bg-white border-t md:border-t-0 md:border-l border-gray-100">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-2xl flex items-center justify-center text-primary mb-3 sm:mb-4">
                     <FiPackage className="w-5 h-5 sm:w-6 sm:h-6" />
                   </div>
                   <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Preview Produk</p>
                   <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2 uppercase">{previewImage.name}</h3>
                   <div className="w-10 h-1 bg-gray-100 rounded-full mb-4 sm:mb-6" />
                   <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                     Pastikan detail fisik obat sesuai dengan katalog master untuk menghindari kesalahan pemberian obat kepada pasien.
                   </p>
                   <button 
                    onClick={() => setPreviewImage(null)}
                    className="mt-6 sm:mt-10 w-full py-3 sm:py-4 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/10"
                   >
                     Tutup Preview
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
