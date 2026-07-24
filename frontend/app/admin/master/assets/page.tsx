'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { FiBox, FiAlertCircle, FiUpload, FiX, FiCamera, FiTag, FiSearch, FiDollarSign, FiPlusCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import SearchableSelect from '@/components/admin/master/SearchableSelect'
import { StatusBadge } from '@/components/admin/master/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { getLocalDateString } from '@/lib/utils/date'

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  const cleanPath = path.replace(/\\/g, '/');
  return process.env.NEXT_PUBLIC_API_URL + (cleanPath.startsWith('/') ? '' : '/') + cleanPath;
}

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
  purchaseDate: getLocalDateString(),
  clinicId: '',
  masterProductId: '',
  totalDepreciated: 0,
  currentValue: 0,
  image: null as File | string | null,
  skipJournal: true,
  paymentCoaId: ''
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
  totalDepreciated: number;
  currentValue: number;
}

export default function AssetsPage() {
  const { activeClinicId } = useAuthStore()
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
  const [coaList, setCoaList] = useState<{id: string, name: string, code: string}[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quick Add Master State
  const [productCategories, setProductCategories] = useState<{id: string, categoryName: string}[]>([])
  const [isAddingMaster, setIsAddingMaster] = useState(false)
  const [quickMasterForm, setQuickMasterForm] = useState({
    masterName: '',
    masterCode: '',
    categoryId: '',
    productType: 'Alat Medis'
  })
  const [savingQuickMaster, setSavingQuickMaster] = useState(false)
  const [quickMasterError, setQuickMasterError] = useState('')


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterClinic) params.clinicId = filterClinic 
      if (filterCategory) params.category = filterCategory
      const { data: resData } = await api.get('/master/assets', { params })
      const assetList = Array.isArray(resData) ? resData : (resData?.data || [])
      setData(assetList)
    } catch (e) {
      console.error('Failed to fetch assets', e)
      setData([])
    } finally { setLoading(false) }
  }, [search, filterClinic, filterCategory, activeClinicId])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await api.get('/master/clinics')
      setClinics(data)
    } catch (e) { console.error('Failed to fetch clinics', e) }
  }, [])

  const fetchMasters = useCallback(async () => {
    try {
      const { data: resData } = await api.get('/master/products', { params: { limit: 1000 } })
      const masterList = Array.isArray(resData) ? resData : (resData?.data || [])
      // Exclude Obat-obatan, Alkes, and BHP from Asset registration
      const excludeIds = [
        'de1cf644-3b0c-453e-8982-ffdf28af8860', // Obat-obatan
        'f83bc6a9-62ee-4d16-b1eb-daba37de3faa', // Alkes
        'd43ab4ce-82fa-47d6-b36c-ecb23d7b1897'  // BHP
      ]
      setMasters(masterList.filter((m: any) => !excludeIds.includes(m.categoryId)))
    } catch (e) { 
      console.error('Failed to fetch masters', e) 
      setMasters([])
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/master/product-categories')
      const excludeIds = [
        'de1cf644-3b0c-453e-8982-ffdf28af8860',
        'f83bc6a9-62ee-4d16-b1eb-daba37de3faa',
        'd43ab4ce-82fa-47d6-b36c-ecb23d7b1897'
      ]
      setProductCategories(data.filter((c: any) => !excludeIds.includes(c.id)))
    } catch (e) {
      console.error('Failed to fetch product categories', e)
    }
  }, [])

  const fetchCOAs = useCallback(async () => {
    try {
      const { data } = await api.get('/master/coa')
      // Only keep Kas & Bank (typically starting with 1-11)
      const kasBankAccounts = data.filter((coa: any) => coa.accountType === 'DETAIL' && coa.code.startsWith('1-11'))
      setCoaList(kasBankAccounts)
    } catch (e) {
      console.error('Failed to fetch COAs', e)
    }
  }, [])

  useEffect(() => { 
    fetchData()
    fetchClinics()
    fetchMasters()
    fetchCategories()
    fetchCOAs()
  }, [fetchData, fetchClinics, fetchMasters, fetchCategories, fetchCOAs])

  useEffect(() => {
    if (!modalOpen) return;
    
    const price = Number(form.purchasePrice) || 0;
    const salvage = Number(form.salvageValue) || 0;
    const years = Number(form.usefulLifeYears) || 5;
    const purchaseD = form.purchaseDate ? new Date(form.purchaseDate) : new Date();
    const now = new Date();
    
    let monthsElapsed = (now.getFullYear() - purchaseD.getFullYear()) * 12 + (now.getMonth() - purchaseD.getMonth());
    if (monthsElapsed < 0) monthsElapsed = 0;
    
    let accumulated = 0;
    if (form.depreciationMethod === 'STRAIGHT_LINE') {
      const depreciableAmount = Math.max(0, price - salvage);
      accumulated = (depreciableAmount / (years * 12)) * monthsElapsed;
    } else {
      const rate = (1 / years) * 2;
      let bookValue = price;
      const fullYears = Math.floor(monthsElapsed / 12);
      const remMonths = monthsElapsed % 12;
      for (let i = 0; i < fullYears; i++) {
        let dep = bookValue * rate;
        if (bookValue - dep < salvage) dep = bookValue - salvage;
        accumulated += dep;
        bookValue -= dep;
      }
      if (remMonths > 0 && bookValue > salvage) {
        let dep = (bookValue * rate) * (remMonths / 12);
        if (bookValue - dep < salvage) dep = bookValue - salvage;
        accumulated += dep;
      }
    }
    
    if (accumulated > price - salvage) accumulated = Math.max(0, price - salvage);
    const totalDep = Math.round(accumulated);
    const currentVal = price - totalDep;
    
    if (form.totalDepreciated !== totalDep || form.currentValue !== currentVal) {
      setForm(p => ({ ...p, totalDepreciated: totalDep, currentValue: currentVal }));
    }
  }, [form.purchasePrice, form.salvageValue, form.usefulLifeYears, form.purchaseDate, form.depreciationMethod, modalOpen]);

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
    if (!form.masterProductId) { setError('Kategori Katalog Master Belum Ditentukan. Harap pilih dari katalog.'); return }
    if (!form.skipJournal && !form.paymentCoaId) { setError('Sumber Dana (Akun Kas/Bank) wajib dipilih jika akan memotong Kas.'); return }
    setSaving(true); setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'image') {
          if (value && typeof value === 'object' && 'name' in (value as any)) {
            console.log("Appending File to formData:", value);
            formData.append('image', value as Blob, (value as any).name || 'upload.webp')
          } else if (typeof value === 'string') {
            console.log("Appending string to formData:", value);
            formData.append('image', value)
          } else if (value === null) {
            console.log("Appending null to formData");
            formData.append('image', 'null')
          }
        } else if (key === 'purchaseDate') {
          if (value) formData.append('purchaseDate', new Date(value as string).toISOString())
        } else if (key === 'skipJournal') {
          formData.append('skipJournal', String(value))
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value))
        }
      })

      if (editing) await api.put(`/master/assets/${editing.id}`, formData)
      else await api.post('/master/assets', formData)
      
      setModalOpen(false); fetchData()
    } catch (e: any) { setError(e.response?.data?.message || 'Terjadi kesalahan') }
    finally { setSaving(false) }
  }

  const handleSaveQuickMaster = async () => {
    if (!quickMasterForm.masterName || !quickMasterForm.masterCode || !quickMasterForm.categoryId) {
      setQuickMasterError('Nama, Kode, dan Kategori wajib diisi')
      return
    }
    setSavingQuickMaster(true)
    setQuickMasterError('')
    try {
      const payload = {
        masterName: quickMasterForm.masterName,
        masterCode: quickMasterForm.masterCode,
        categoryId: quickMasterForm.categoryId,
        productType: quickMasterForm.productType,
        isActive: true,
        purchasePrice: 0,
        sellingPrice: 0
      }
      const { data } = await api.post('/master/products', payload)
      await fetchMasters()
      
      const typeMap: Record<string, string> = {
        'Elektronik': 'computer',
        'Alat Medis': 'clinical-device',
        'Furniture': 'furniture',
        'Kendaraan': 'vehicle'
      }

      setForm(p => ({
        ...p,
        masterProductId: data.id,
        assetName: data.masterName,
        assetCode: `${data.masterCode}-AST`,
        assetType: typeMap[data.productType] || p.assetType
      }))
      
      setIsAddingMaster(false)
      setQuickMasterForm({ masterName: '', masterCode: '', categoryId: '', productType: 'Alat Medis' })
    } catch (e: any) {
      setQuickMasterError(e.response?.data?.message || 'Gagal menyimpan katalog baru')
    } finally {
      setSavingQuickMaster(false)
    }
  }

  const columns: Column<Asset>[] = [
    { key: 'assetName', label: 'Item & Spesifikasi', className: 'max-w-[200px] lg:max-w-[250px]', render: (r) => {
      const imgToUse = (r.image || (r as any).masterProduct?.image) as string | null | undefined;
      return (
      <div className="py-2.5 flex items-start gap-4">
        {/* Photo Thumbnail */}
        <button 
          onClick={() => imgToUse && setPreviewImage({ url: getImageUrl(imgToUse), name: r.assetName })}
          className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative group active:scale-95 transition-all shadow-sm"
        >
          {imgToUse ? (
            <img 
              src={getImageUrl(imgToUse)} 
              alt={r.assetName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <FiBox className="w-4 h-4 text-gray-300" />
              <span className="text-[6px] font-black text-gray-400 mt-0.5 uppercase tracking-widest">No Img</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            {imgToUse && <FiCamera className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all pointer-events-none drop-shadow-lg" />}
          </div>
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1.5 mt-0.5">
                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md tracking-widest uppercase border border-indigo-100 mt-0.5 whitespace-nowrap">
                    {r.assetCode}
                </span>
                <p className="text-sm font-black text-gray-900 leading-tight tracking-tight">{r.assetName}</p>
            </div>
            
            <div className="space-y-1.5">
                {(r.manufacturer || r.model) && (
                    <div className="flex items-center gap-2">
                        <FiTag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight leading-tight">
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
      )
    }},
    { key: 'category', label: 'Kategori', render: (r) => (
      <span className="text-[10px] font-black text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
        {r.category}
      </span>
    )},
    { key: 'purchasePrice', label: 'Nilai Aset', mobileHide: true, render: (r) => (
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Harga Perolehan</span>
        <span className="text-sm font-black text-gray-900 tracking-tight">
          Rp {r.purchasePrice.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">{label}</label>
      <input 
        type={type} value={(form as any)[key]} 
        onChange={(e) => setForm(p => ({...p, [key]: e.target.value}))} 
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-gray-300 text-gray-800 shadow-sm hover:border-gray-400" 
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
                className="px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:border-primary bg-white font-black shadow-sm transition-all text-primary"
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
            ...EMPTY,
            ...r,
            description: r.description || '',
            manufacturer: r.manufacturer || '',
            model: r.model || '',
            clinicId: r.clinicId || '',
            masterProductId: r.masterProductId || '',
            purchaseDate: r.purchaseDate ? r.purchaseDate.substring(0, 10) : getLocalDateString(),
            salvageValue: r.salvageValue || 0,
            usefulLifeYears: r.usefulLifeYears || 5,
            depreciationMethod: r.depreciationMethod || 'STRAIGHT_LINE',
            totalDepreciated: r.totalDepreciated || 0,
            currentValue: r.currentValue || 0,
            image: r.image || null
          }); 
          const editImg = r.image || (r as any).masterProduct?.image;
          setFormImagePreview(editImg ? getImageUrl(editImg as string) : null);
          setError('');
          setModalOpen(true) 
        }}
        onDelete={async (r) => { if (confirm(`Hapus data aset "${r.assetName}"?`)) { await api.delete(`/master/assets/${r.id}`); fetchData() } }}
      />

      <MasterModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Detail Inventaris Aset' : 'Registrasi Aset Baru'} size="4xl">
        <div className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Image Upload Section */}
            <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-3">Foto Fisik Aset (Opsional)</label>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/60 group-hover:bg-primary/[0.03]">
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

            <div className="md:col-span-2 lg:col-span-3">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Pilih dari Katalog Master Produk</label>
                 <button 
                   type="button" 
                   onClick={() => setIsAddingMaster(true)}
                   className="flex items-center gap-2 px-4 py-2 bg-primary text-white border-2 border-primary hover:bg-blue-700 hover:border-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 shadow-primary/30"
                 >
                   <FiPlusCircle className="w-3.5 h-3.5" />
                   Data Belum Terdaftar? Tambah Disini
                 </button>
               </div>
               <SearchableSelect 
                placeholder="Cari nama atau kode aset (ex: Alat Medis)..."
                options={(Array.isArray(masters) ? masters : []).map(m => ({
                  id: m.id,
                  label: m.masterName,
                  code: m.masterCode,
                  description: m.description
                }))}
                value={form.masterProductId}
                onChange={(id, opt: any) => {
                  if (!id) return
                  // Find full master data from masters state
                  const master = masters.find(m => m.id === id)
                  
                  // Map ProductType to AssetType
                  const typeMap: Record<string, string> = {
                    'Elektronik': 'computer',
                    'Alat Medis': 'clinical-device',
                    'Furniture': 'furniture',
                    'Kendaraan': 'vehicle'
                  }
                  
                  setForm(p => ({ 
                    ...p, 
                    masterProductId: id,
                    assetName: opt?.label || p.assetName,
                    assetCode: opt ? `${opt.code}-AST` : p.assetCode,
                    description: opt?.description || p.description,
                    manufacturer: master?.brand || p.manufacturer,
                    purchasePrice: master?.purchasePrice || p.purchasePrice,
                    assetType: typeMap[master?.productType] || p.assetType
                  }))
                }}
                helperText="Data nama dan tipe akan otomatis menyesuaikan dengan katalog terpilih."
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Identifikasi Nama Aset (Katalog)</label>
              <input 
                type="text" value={form.assetName} 
                readOnly={!!form.masterProductId}
                onChange={(e) => setForm(p => ({...p, assetName: e.target.value}))} 
                placeholder="Pilih dari master atau ketik manual..."
                className={`w-full px-4 py-3 text-sm bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-sm ${
                  form.masterProductId ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed uppercase' : 'border-gray-100 hover:border-gray-400 focus:border-primary text-gray-800'
                }`}
              />
            </div>
            {inp('Kode Inventaris *', 'assetCode', 'text', 'cth: RAD-USG-2024-01')}
            
            <div>
              <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Klasifikasi Aset</label>
              <select value={form.assetType} onChange={(e) => setForm(p => ({...p, assetType: e.target.value}))}
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold capitalize text-gray-800 shadow-sm">
                {['equipment','furniture','vehicle','computer','clinical-device','other'].map(t => <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>)}
              </select>
            </div>

            {inp('Kategori Penempatan', 'category', 'text', 'cth: Ruang Radiologi')}
            {inp('Merk / Manufacturer', 'manufacturer', 'text', 'cth: Mindray Medical')}
            {inp('No. Seri / Model', 'model', 'text', 'cth: DC-30 SN-12345')}
            <div>
              <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Nilai Perolehan (Rp)</label>
              <input 
                type="number" value={form.purchasePrice} 
                onChange={(e) => setForm(p => ({...p, purchasePrice: Number(e.target.value)}))} 
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-gray-300 text-gray-800 shadow-sm hover:border-gray-400" 
              />
              <p className="text-[11px] font-black text-primary mt-1.5 pl-1">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(form.purchasePrice || 0)}
              </p>
            </div>
            
            <div>
              <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Kondisi Saat Ini</label>
              <select value={form.condition} onChange={(e) => setForm(p => ({...p, condition: e.target.value}))}
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold capitalize text-gray-800 shadow-sm">
                {['excellent','good','fair','poor'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>

            {inp('Tanggal Pembelian', 'purchaseDate', 'date')}
              
            <div className={`md:col-span-2 lg:col-span-3 p-6 border-2 rounded-3xl mt-2 transition-colors ${form.skipJournal ? 'bg-orange-50/80 border-orange-300/60' : 'bg-red-50/80 border-red-300/60'}`}>
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1">
                  <input 
                    type="checkbox"
                    checked={form.skipJournal}
                    onChange={(e) => setForm(p => ({...p, skipJournal: e.target.checked}))}
                    className={`w-7 h-7 rounded-xl border-2 focus:ring-offset-0 bg-white transition-all cursor-pointer peer appearance-none ${form.skipJournal ? 'border-orange-400 focus:ring-orange-500/30 checked:bg-orange-500 checked:border-orange-500' : 'border-red-400 focus:ring-red-500/30'}`}
                  />
                  {form.skipJournal && (
                    <svg className="absolute w-5 h-5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`block text-lg font-black mb-1.5 transition-colors ${form.skipJournal ? 'text-orange-900 group-hover:text-orange-700' : 'text-red-900 group-hover:text-red-700'}`}>
                    {form.skipJournal 
                      ? 'Checklist Hanya Mendaftarkan Fisik Asset (Jangan Buat Jurnal Kas)'
                      : 'Aset Akan Dipotong Kas Secara Lunas 100% (Jurnal GL Dibuat Otomatis)'}
                  </span>
                  <p className={`text-sm leading-relaxed font-semibold ${form.skipJournal ? 'text-orange-800/80' : 'text-red-800/90'}`}>
                    {form.skipJournal ? (
                      <>
                        Centang opsi ini jika aset dibeli di masa lalu, pembayarannya <span className="font-extrabold text-orange-900">dicicil/kredit</span>, 
                        atau jika pengeluarannya dicatat terpisah di menu <span className="font-extrabold text-orange-900">Expenses</span>. 
                        Jika dicentang, sistem <span className="font-extrabold text-red-600 underline">TIDAK AKAN</span> memotong saldo Kas.
                      </>
                    ) : (
                      <div className="space-y-1.5 mt-1">
                        <p>
                          1. Sistem akan otomatis memotong Kas sebesar <span className="font-extrabold text-red-900">Nilai Perolehan</span> secara <span className="font-extrabold text-red-700 underline">LUNAS 100%</span>. 
                        </p>
                        <p>
                          2. Jika pembelian aset ini dilakukan secara <span className="font-extrabold text-red-900">dicicil</span>, mohon <span className="font-extrabold text-red-700 underline">CENTANG KEMBALI</span> opsi ini. 
                        </p>
                        <p>
                          3. Pastikan juga pengeluaran lunas ini belum dicatat di menu Expenses agar tidak terjadi pemotongan ganda (Double Deduction).
                        </p>
                      </div>
                    )}
                  </p>
                  
                  {!form.skipJournal && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <label className="block text-[11px] font-black text-red-900 uppercase tracking-widest mb-1.5">
                        Sumber Dana / Akun Pembayaran <span className="text-red-600">*</span>
                      </label>
                      <select 
                        value={form.paymentCoaId}
                        onChange={(e) => setForm(p => ({...p, paymentCoaId: e.target.value}))}
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-red-300 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 hover:border-red-400 transition-all font-bold text-gray-800 shadow-sm"
                      >
                        <option value="">-- Pilih Akun Kas/Bank --</option>
                        {coaList.map(coa => (
                          <option key={coa.id} value={coa.id}>{coa.code} - {coa.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-3 p-6 bg-emerald-50/50 border-2 border-emerald-300/50 rounded-[2.5rem] mt-2">
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
                  <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1.5">Metode Penyusutan</label>
                  <select 
                    value={form.depreciationMethod} 
                    onChange={(e) => setForm(p => ({...p, depreciationMethod: e.target.value}))}
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-emerald-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-400 transition-all font-bold text-emerald-900 shadow-sm"
                  >
                    <option value="STRAIGHT_LINE">STRAIGHT LINE (GARIS LURUS)</option>
                    <option value="DECLINING_BALANCE">DOUBLE DECLINING (SALDO MENURUN)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Akum. Penyusutan Saat Ini (Rp)</label>
                    <span className="text-[9px] text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded font-black italic">
                      DIHITUNG OTOMATIS
                    </span>
                  </div>
                  <input 
                    type="number" value={form.totalDepreciated} 
                    onChange={(e) => {
                      const totalDep = Number(e.target.value)
                      setForm(p => ({
                        ...p, 
                        totalDepreciated: totalDep,
                        currentValue: (p.purchasePrice || 0) - totalDep
                      }))
                    }} 
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-emerald-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-400 transition-all font-bold text-emerald-900 shadow-sm" 
                    placeholder="Isi jika aset lama/go-live..."
                  />
                  <p className="text-[11px] font-black text-emerald-600 mt-1.5 pl-1">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(form.totalDepreciated || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1.5">Umur Ekonomis (Tahun)</label>
                  <input 
                    type="number" value={form.usefulLifeYears} 
                    onChange={(e) => setForm(p => ({...p, usefulLifeYears: Number(e.target.value)}))} 
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-emerald-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-400 transition-all font-bold text-emerald-900 shadow-sm" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1.5">Nilai Residu / Sisa (Rp)</label>
                  <input 
                    type="number" value={form.salvageValue} 
                    onChange={(e) => setForm(p => ({...p, salvageValue: Number(e.target.value)}))} 
                    placeholder="Nilai aset di akhir umur ekonomis..."
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-emerald-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-400 transition-all font-bold text-emerald-900 shadow-sm" 
                  />
                  <p className="text-[11px] font-black text-emerald-600 mt-1.5 pl-1">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(form.salvageValue || 0)}
                  </p>
                  <p className="text-[9px] text-emerald-500 font-bold mt-1 italic pl-1">* Sistem akan berhenti menyusutkan aset saat mencapai nilai residu ini.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-5 bg-primary/[0.03] border-2 border-primary/10 rounded-[2rem]">
              <label className="block text-[11px] font-black text-primary uppercase tracking-widest mb-2.5">Unit Penanggung Jawab *</label>
              <select 
                value={form.clinicId} 
                onChange={(e) => setForm(p => ({...p, clinicId: e.target.value}))}
                className="w-full px-4 py-3 text-sm bg-white border-2 border-primary/40 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/60 font-black text-primary shadow-sm transition-all"
              >
                <option value="">Pilih Cabang Destinasi...</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <p className="text-[10px] text-primary/60 font-medium mt-2.5 pl-1 italic">Izin akses data aset akan terbatas pada cabang yang dipilih.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Catatan Tambahan</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Spesifikasi teknis singkat atau keterangan status garansi..."
                className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold placeholder:text-gray-300 text-gray-800 shadow-sm min-h-[100px] resize-none" 
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

      <MasterModal isOpen={isAddingMaster} onClose={() => setIsAddingMaster(false)} title="Registrasi Katalog Baru (Jalur Cepat)" size="sm">
        <div className="space-y-4">
          {quickMasterError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
              <FiAlertCircle className="flex-shrink-0" />
              {quickMasterError}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Nama Katalog Aset *</label>
            <input 
              type="text" value={quickMasterForm.masterName} 
              onChange={e => setQuickMasterForm(p => ({ ...p, masterName: e.target.value }))}
              placeholder="Cth: Bed Pasien Elektrik"
              className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold text-gray-800 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Kode Produk *</label>
            <input 
              type="text" value={quickMasterForm.masterCode} 
              onChange={e => setQuickMasterForm(p => ({ ...p, masterCode: e.target.value }))}
              placeholder="Cth: BPE-001"
              className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold text-gray-800 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Kategori Produk *</label>
            <select 
              value={quickMasterForm.categoryId} 
              onChange={e => setQuickMasterForm(p => ({ ...p, categoryId: e.target.value }))}
              className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold text-gray-800 shadow-sm"
            >
              <option value="">Pilih Kategori...</option>
              {productCategories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Tipe (Untuk Pemetaan) *</label>
            <select 
              value={quickMasterForm.productType} 
              onChange={e => setQuickMasterForm(p => ({ ...p, productType: e.target.value }))}
              className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-400 transition-all font-bold text-gray-800 shadow-sm"
            >
              {['Elektronik', 'Alat Medis', 'Furniture', 'Kendaraan'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
            <button onClick={() => setIsAddingMaster(false)} className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl">Batal</button>
            <button onClick={handleSaveQuickMaster} disabled={savingQuickMaster} className="flex-1 py-3 text-xs font-bold text-white bg-primary shadow-lg shadow-primary/20 rounded-xl hover:opacity-90 disabled:opacity-50">
              {savingQuickMaster ? 'Menyimpan...' : 'Simpan & Gunakan'}
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
