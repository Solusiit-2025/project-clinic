'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { FiBox, FiAlertCircle, FiUpload, FiX, FiCamera, FiTag, FiSearch, FiDollarSign } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'
const EMPTY = { 
  assetCode: '', 
  assetName: '', 
  assetType: 'equipment', 
  category: '', 
  description: '', 
  manufacturer: '', 
  model: '', 
  purchasePrice: 0,
  salvageValue: 0,
  usefulLifeYears: 5,
  depreciationMethod: 'STRAIGHT_LINE',
  condition: 'excellent', 
  status: 'active', 
  purchaseDate: new Date().toISOString().substring(0, 10),
  clinicId: '',
  masterProductId: '',
  image: null as File | string | null
}

type Clinic = { id: string; name: string; code: string }

type Asset = {
  id: string; assetCode: string; assetName: string; assetType: string; category: string;
  description?: string; manufacturer?: string; model?: string; purchasePrice: number;
  salvageValue: number; usefulLifeYears: number; depreciationMethod: string;
  condition: string; status: string; purchaseDate: string; clinicId: string;
  image?: string;
  clinic?: { name: string; code: string };
  masterProductId?: string;
}

export default function AssetsPage() {
  const { token, activeClinicId } = useAuthStore()
  const [data, setData] = useState<Asset[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [masters, setMasters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterClinic) params.clinicId = filterClinic 
      if (filterCategory) params.category = filterCategory
      const { data: resData } = await axios.get(`${API}/assets`, { headers, params })
      const assetList = Array.isArray(resData) ? resData : (resData?.data || [])
      setData(assetList)
    } catch (e) {
      console.error('Failed to fetch assets', e)
      setData([])
    } finally { setLoading(false) }
  }, [search, token, filterClinic, filterCategory, activeClinicId])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/clinics`, { headers })
      setClinics(data)
    } catch (e) { console.error('Failed to fetch clinics', e) }
  }, [token])

  const fetchMasters = useCallback(async () => {
    try {
      const { data: resData } = await axios.get(`${API}/products`, { headers })
      const masterList = Array.isArray(resData) ? resData : (resData?.data || [])
      setMasters(masterList)
    } catch (e) { 
      console.error('Failed to fetch masters', e) 
      setMasters([])
    }
  }, [token])

  useEffect(() => { 
    fetchData()
    fetchClinics()
    fetchMasters()
  }, [fetchData, fetchClinics, fetchMasters])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 2MB')
        return
      }
      setForm(p => ({ ...p, image: file }))
      setFormImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!form.assetCode || !form.assetName) { setError('Kode dan nama aset wajib diisi'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value instanceof File) formData.append('image', value)
        } else if (key === 'purchaseDate') {
          if (value) formData.append('purchaseDate', new Date(value as string).toISOString())
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value))
        }
      })

      if (editing) await axios.put(`${API}/assets/${editing.id}`, formData, { headers })
      else await axios.post(`${API}/assets`, formData, { headers })
      
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const columns: Column<Asset>[] = [
    { key: 'assetName', label: 'Item & Spesifikasi', render: (r) => (
      <div className="py-2.5 flex items-start gap-4">
        {/* Photo Thumbnail */}
        <button 
          onClick={() => r.image && setPreviewImage({ url: process.env.NEXT_PUBLIC_API_URL + r.image, name: r.assetName })}
          className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative group active:scale-95 transition-all shadow-sm"
        >
          {r.image ? (
            <img 
              src={process.env.NEXT_PUBLIC_API_URL + r.image} 
              alt={r.assetName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <FiBox className="w-6 h-6 text-gray-300" />
              <span className="text-[7px] font-black text-gray-400 mt-1 uppercase tracking-widest">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            {r.image && <FiCamera className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all pointer-events-none drop-shadow-lg" />}
          </div>
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 mt-0.5">
                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md tracking-widest uppercase border border-indigo-100">
                    {r.assetCode}
                </span>
                <p className="text-sm font-black text-gray-900 leading-none tracking-tight truncate">{r.assetName}</p>
            </div>
            
            <div className="space-y-1.5">
                {(r.manufacturer || r.model) && (
                    <div className="flex items-center gap-2">
                        <FiTag className="w-3 h-3 text-gray-400" />
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight truncate">
                            {r.manufacturer} {r.model && `• ${r.model}`}
                        </p>
                    </div>
                )}
                
                <div className="relative pl-3 border-l-2 border-gray-100 py-0.5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Type: {r.assetType.replace('-', ' ')}
                    </p>
                </div>
            </div>
        </div>
      </div>
    )},
    { key: 'category', label: 'Kategori', render: (r) => (
      <span className="text-[10px] font-black text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
        {r.category}
      </span>
    )},
    { key: 'purchasePrice', label: 'Nilai Aset', mobileHide: true, render: (r) => (
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Harga Perolehan</span>
        <span className="text-sm font-black text-gray-900 tracking-tight">
          Rp {r.purchasePrice.toLocaleString('id-ID')}
        </span>
      </div>
    )},
    { key: 'financial', label: 'Penyusutan', render: (r) => (
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 inline-block w-fit uppercase tracking-tighter border border-emerald-100">
          {r.depreciationMethod === 'STRAIGHT_LINE' ? 'Garis Lurus' : 'Saldo Menurun'}
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {r.usefulLifeYears} Tahun
        </span>
      </div>
    )},
    { key: 'condition', label: 'Kondisi', render: (r) => {
      const colors: any = { excellent: 'text-emerald-700 bg-emerald-50 border-emerald-100', good: 'text-blue-700 bg-blue-50 border-blue-100', fair: 'text-amber-700 bg-amber-50 border-amber-100', poor: 'text-rose-700 bg-rose-50 border-rose-100' }
      return <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm ${colors[r.condition] || 'bg-gray-50'}`}>{r.condition}</span>
    }},
    { key: 'status', label: 'Status', render: (r) => <StatusBadge active={r.status === 'active'} /> },
    { 
      key: 'clinic', 
      label: 'CABANG / UNIT', 
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none truncate max-w-[140px]">
            {r.clinic?.name || 'Central Unit'}
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1 h-1 rounded-full bg-primary/30" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{r.clinic?.code || 'BASE'}</span>
          </div>
        </div>
      )
    },
  ]

  const categories = Array.isArray(data) 
    ? Array.from(new Set(data.map(item => item.category))).filter(Boolean).sort()
    : []
  const activeBranch = clinics.find(c => c.id === activeClinicId)
  const isPusat = activeBranch?.code === 'K001'

  const inp = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input 
        type={type} value={(form as any)[key]} 
        onChange={(e) => setForm(p => ({...p, [key]: e.target.value}))} 
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-gray-300 text-gray-700" 
      />
    </div>
  )

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      <PageHeader
        title="Manajemen Aset" subtitle="Pemantauan inventaris peralatan medis dan fasilitas klinik"
        icon={<FiBox className="w-5 h-5 sm:w-6 sm:h-6" />}
        onAdd={() => { 
          setEditing(null); 
          setForm({ ...EMPTY, clinicId: activeClinicId || '' }); 
          setFormImagePreview(null);
          setError('');
          setModalOpen(true) 
        }}
        addLabel="Tambah Aset" count={data.length}
        breadcrumb={['Admin', 'Data Master', 'Aset']}
      />
      <DataTable
        data={data} columns={columns} loading={loading}
        groupBy={(r: Asset) => r.category || 'Uncategorized'}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Cari nama aset, kode inventaris, atau merk..."
        extraFilters={
          <div className="flex gap-2">
            {isPusat && (
              <select 
                value={filterClinic} 
                onChange={(e) => setFilterClinic(e.target.value)}
                className="px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:border-primary bg-white font-black text-gray-600 shadow-sm transition-all text-primary"
              >
                <option value="">Cabang Aktif (Sidebar)</option>
                <option value="all">Seluruh Cabang</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:border-primary bg-white font-black text-gray-600 shadow-sm transition-all"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        }
        onEdit={(r) => { 
          setEditing(r); 
          setForm({
            ...r,
            description: r.description || '',
            manufacturer: r.manufacturer || '',
            model: r.model || '',
            clinicId: r.clinicId || '',
            masterProductId: r.masterProductId || '',
            purchaseDate: r.purchaseDate ? r.purchaseDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
            salvageValue: r.salvageValue || 0,
            usefulLifeYears: r.usefulLifeYears || 5,
            depreciationMethod: r.depreciationMethod || 'STRAIGHT_LINE',
            image: r.image || null
          }); 
          setFormImagePreview(r.image ? process.env.NEXT_PUBLIC_API_URL + r.image : null);
          setError('');
          setModalOpen(true) 
        }}
        onDelete={async (r) => { if (confirm(`Hapus data aset "${r.assetName}"?`)) { await axios.delete(`${API}/assets/${r.id}`, { headers }); fetchData() } }}
      />

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Detail Inventaris Aset' : 'Registrasi Aset Baru'} size="lg">
        <div className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Section */}
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Foto Fisik Aset (Opsional)</label>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/40 group-hover:bg-primary/[0.03]">
                            {formImagePreview ? (
                                <img src={formImagePreview} alt="Aset Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-gray-300 group-hover:text-primary/30 transition-colors">
                                    <FiCamera className="w-10 h-10" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Pilih Gambar</span>
                                </div>
                            )}
                        </div>
                        {formImagePreview && (
                            <button 
                                onClick={() => { setFormImagePreview(null); setForm(p => ({ ...p, image: null })) }}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-gray-100 rounded-full shadow-2xl flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all z-10"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">
                            Gunakan foto yang jelas untuk mempermudah identifikasi aset saat maintenance atau audit fisik. Format: <span className="font-black text-gray-600">WebP, PNG, JPG</span>.
                        </p>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 px-8 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 font-black text-xs hover:border-primary hover:text-primary hover:bg-primary/[0.02] active:scale-95 transition-all shadow-sm"
                        >
                            <FiUpload className="w-5 h-5" />
                            <span>UNGGAH FOTO</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2">
               <SearchableSelect 
                label="Pilih dari Katalog Master Produk"
                placeholder="Cari nama atau kode aset (ex: Alat Medis)..."
                options={(Array.isArray(masters) ? masters : []).map(m => ({
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
                    assetName: opt?.label || p.assetName,
                    assetCode: opt ? `${opt.code}-AST` : p.assetCode,
                    description: opt?.description || p.description,
                  }))
                }}
                helperText="Data nama dan tipe akan otomatis menyesuaikan dengan katalog terpilih."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Identifikasi Nama Aset (Katalog)</label>
              <input 
                type="text" value={form.assetName} 
                readOnly={!!form.masterProductId}
                onChange={(e) => setForm(p => ({...p, assetName: e.target.value}))} 
                placeholder="Pilih dari master atau ketik manual..."
                className={`w-full px-4 py-3 text-sm border border-gray-100 rounded-2xl focus:outline-none transition-all font-bold ${
                  form.masterProductId ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed uppercase' : 'bg-gray-50/30 border-gray-100 focus:border-primary text-gray-700'
                }`}
              />
            </div>
            {inp('Kode Inventaris *', 'assetCode', 'text', 'cth: RAD-USG-2024-01')}
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Klasifikasi Aset</label>
              <select value={form.assetType} onChange={(e) => setForm(p => ({...p, assetType: e.target.value}))}
                className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary bg-white font-black capitalize text-gray-700">
                {['equipment','furniture','vehicle','computer','clinical-device','other'].map(t => <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>)}
              </select>
            </div>

            {inp('Kategori Penempatan', 'category', 'text', 'cth: Ruang Radiologi')}
            {inp('Merk / Manufacturer', 'manufacturer', 'text', 'cth: Mindray Medical')}
            {inp('No. Seri / Model', 'model', 'text', 'cth: DC-30 SN-12345')}
            {inp('Nilai Perolehan (Rp)', 'purchasePrice', 'number')}
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kondisi Saat Ini</label>
              <select value={form.condition} onChange={(e) => setForm(p => ({...p, condition: e.target.value}))}
                className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary bg-white font-black capitalize text-gray-700">
                {['excellent','good','fair','poor'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>

            {inp('Tanggal Pembelian', 'purchaseDate', 'date')}

            <div className="md:col-span-2 p-6 bg-emerald-50/50 border-2 border-emerald-100/50 rounded-[2.5rem] mt-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-tight">Konfigurasi Akuntansi</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Metode Penyusutan & Nilai Buku</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-1.5">Metode Penyusutan</label>
                  <select 
                    value={form.depreciationMethod} 
                    onChange={(e) => setForm(p => ({...p, depreciationMethod: e.target.value}))}
                    className="w-full px-4 py-3 text-sm border border-emerald-100 bg-white rounded-2xl focus:outline-none focus:border-emerald-500 font-black text-emerald-900 shadow-sm transition-all"
                  >
                    <option value="STRAIGHT_LINE">STRAIGHT LINE (GARIS LURUS)</option>
                    <option value="DECLINING_BALANCE">DOUBLE DECLINING (SALDO MENURUN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-1.5">Umur Ekonomis (Tahun)</label>
                  <input 
                    type="number" value={form.usefulLifeYears} 
                    onChange={(e) => setForm(p => ({...p, usefulLifeYears: Number(e.target.value)}))} 
                    className="w-full px-4 py-3 text-sm border border-emerald-100 bg-white rounded-2xl focus:outline-none focus:border-emerald-500 font-black text-emerald-900 shadow-sm transition-all" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-emerald-800/40 uppercase tracking-widest mb-1.5">Nilai Residu / Sisa (Rp)</label>
                  <input 
                    type="number" value={form.salvageValue} 
                    onChange={(e) => setForm(p => ({...p, salvageValue: Number(e.target.value)}))} 
                    placeholder="Nilai aset di akhir umur ekonomis..."
                    className="w-full px-4 py-3 text-sm border border-emerald-100 bg-white rounded-2xl focus:outline-none focus:border-emerald-500 font-black text-emerald-900 shadow-sm transition-all" 
                  />
                  <p className="text-[9px] text-emerald-500 font-bold mt-2 italic">* Sistem akan berhenti menyusutkan aset saat mencapai nilai residu ini.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-5 bg-primary/[0.03] border-2 border-primary/10 rounded-[2rem]">
              <label className="block text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2.5">Unit Penanggung Jawab *</label>
              <select 
                value={form.clinicId} 
                onChange={(e) => setForm(p => ({...p, clinicId: e.target.value}))}
                className="w-full px-4 py-3 text-sm border border-primary/10 rounded-2xl focus:outline-none focus:border-primary bg-white font-black text-primary shadow-sm"
              >
                <option value="">Pilih Cabang Destinasi...</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <p className="text-[10px] text-primary/60 font-medium mt-2.5 pl-1 italic">Izin akses data aset akan terbatas pada cabang yang dipilih.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Catatan Tambahan</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Spesifikasi teknis singkat atau keterangan status garansi..."
                className="w-full px-4 py-3 text-sm border border-gray-100 bg-gray-50/30 rounded-2xl focus:outline-none focus:border-primary font-bold placeholder:text-gray-300 text-gray-700 min-h-[100px] resize-none" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="flex-1 py-4 border border-gray-100 rounded-2xl text-[11px] font-black text-gray-400 tracking-widest uppercase hover:bg-gray-50 transition-all active:scale-95">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-primary text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 disabled:opacity-60 transition-all active:scale-95">
                {saving ? 'SEDANG MENULIS DATA...' : (editing ? 'PERBARUI DATA ASET' : 'REGISTRASI ASET')}
            </button>
          </div>
        </div>
      </MasterModal>

      {/* Image Preview Modal (Lightbox) */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="absolute inset-0 bg-gray-950/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative max-w-5xl w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10"
            >
              <div className="absolute top-8 right-8 z-10">
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="w-12 h-12 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/20"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row h-[75vh] md:h-auto max-h-[90vh]">
                <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center overflow-hidden p-4 sm:p-0 relative">
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.name} 
                    className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl"
                  />
                </div>
                <div className="w-full md:w-96 p-10 flex flex-col justify-center bg-white border-l border-gray-100">
                   <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
                     <FiBox className="w-7 h-7" />
                   </div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 leading-none">Dokumentasi Aset</p>
                   <h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">{previewImage.name}</h3>
                   <div className="w-16 h-1.5 bg-primary/20 rounded-full mb-8" />
                   
                   <div className="space-y-6">
                       <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                         "Gunakan foto ini sebagai referensi kondisi fisik aset saat audit inventaris tahunan."
                       </p>
                       <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Note</p>
                           <p className="text-[10px] text-gray-600 font-bold leading-normal uppercase">Gambar di atas adalah foto fisik aktual dari unit yang terdaftar.</p>
                       </div>
                   </div>

                   <button 
                    onClick={() => setPreviewImage(null)}
                    className="mt-12 w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary transition-all active:scale-95 shadow-xl shadow-black/10"
                   >
                     SELESAI LIHAT
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
