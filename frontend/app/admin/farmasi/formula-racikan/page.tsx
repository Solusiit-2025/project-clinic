'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { FiLayers, FiPlus, FiEdit2, FiTrash2, FiEye, FiPackage, FiDollarSign, FiAlertCircle, FiTool, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { StatusBadge, CategoryBadge } from '@/components/admin/master/StatusBadge'
import { motion } from 'framer-motion'

const EMPTY_FORMULA = {
  formulaName: '',
  description: '',
  category: '',
  dosageForm: 'Kapsul',
  defaultQty: 10,
  defaultDosage: '3x1',
  defaultFrequency: '3 kali sehari',
  defaultDuration: '3 hari',
  defaultInstructions: 'Diminum sesudah makan',
  tuslahPrice: 5000,
  isActive: true,
  items: [] as any[],
}

const DOSAGE_FORMS = ['Kapsul', 'Puyer', 'Tablet', 'Sirup', 'Salep', 'Krim', 'Tetes', 'Injeksi']
const CATEGORIES = ['Flu & Pilek', 'Batuk', 'Alergi', 'Demam', 'Nyeri', 'Infeksi', 'Vitamin', 'Lainnya']

type CompoundFormula = {
  id: string
  formulaCode: string
  formulaName: string
  description?: string
  category?: string
  dosageForm?: string
  defaultQty: number
  tuslahPrice: number
  isActive: boolean
  items: {
    id: string
    quantity: number
    unit?: string
    medicine: {
      id: string
      medicineName: string
      genericName?: string
      dosageForm?: string
      strength?: string
    }
  }[]
  productMaster?: {
    id: string
    masterCode: string
    products: {
      id: string
      productCode: string
      quantity: number
      clinicId: string
    }[]
  }
  _count?: { prescriptionItems: number }
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export default function FormulaRacikanPage() {
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<CompoundFormula[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [assemblyModalOpen, setAssemblyModalOpen] = useState(false)
  const [editing, setEditing] = useState<CompoundFormula | null>(null)
  const [viewing, setViewing] = useState<CompoundFormula | null>(null)
  const [assembling, setAssembling] = useState<CompoundFormula | null>(null)
  const [form, setForm] = useState(EMPTY_FORMULA)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assemblyQty, setAssemblyQty] = useState(10)
  const [assemblyCheck, setAssemblyCheck] = useState<any>(null)
  const [checkingAssembly, setCheckingAssembly] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { clinicId: activeClinicId }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      const { data: resData } = await api.get('/pharmacy/compound-formulas', { params })
      setData(resData)
    } catch (err) {
      console.error('Error fetching formulas:', err)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, activeClinicId])

  const fetchMedicines = useCallback(async () => {
    try {
      // Ambil dari master/products (sama seperti inventory)
      // Bukan dari master/medicines
      const { data: resData } = await api.get('/master/products', {
        params: { 
          clinicId: activeClinicId, 
          isActive: true 
        },
      })
      
      // Filter hanya produk yang punya medicineId (obat klinis)
      // Atau yang punya compoundFormulaId (racikan lain sebagai bahan)
      const medicineProducts = Array.isArray(resData?.data) 
        ? resData.data.filter((p: any) => p.medicineId || p.compoundFormulaId)
        : Array.isArray(resData)
        ? resData.filter((p: any) => p.medicineId || p.compoundFormulaId)
        : []
      
      setMedicines(medicineProducts)
    } catch (err) {
      console.error('Error fetching medicines:', err)
    }
  }, [activeClinicId])

  useEffect(() => {
    fetchData()
    fetchMedicines()
  }, [fetchData, fetchMedicines])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORMULA)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (item: CompoundFormula) => {
    setEditing(item)
    setForm({
      formulaName: item.formulaName,
      description: item.description || '',
      category: item.category || '',
      dosageForm: item.dosageForm || 'Kapsul',
      defaultQty: item.defaultQty,
      defaultDosage: item.items[0]?.medicine?.dosageForm || '3x1',
      defaultFrequency: '3 kali sehari',
      defaultDuration: '3 hari',
      defaultInstructions: 'Diminum sesudah makan',
      tuslahPrice: item.tuslahPrice,
      isActive: item.isActive,
      items: item.items.map((i) => ({
        medicineId: i.medicine.id,
        quantity: i.quantity,
        unit: i.unit || 'tablet',
        notes: '',
      })),
    })
    setError('')
    setModalOpen(true)
  }

  const openDetail = (item: CompoundFormula) => {
    setViewing(item)
    setDetailModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.formulaName.trim()) {
      setError('Nama formula wajib diisi')
      return
    }
    if (form.items.length === 0) {
      setError('Formula harus memiliki minimal 1 bahan baku')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        clinicId: activeClinicId,
      }

      if (editing) {
        await api.put(`/pharmacy/compound-formulas/${editing.id}`, payload)
      } else {
        await api.post('/pharmacy/compound-formulas', payload)
      }

      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan formula')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus formula ini?')) return
    try {
      await api.delete(`/pharmacy/compound-formulas/${id}`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus formula')
    }
  }

  const handleCreateProduct = async (formula: CompoundFormula) => {
    if (!confirm(`Buat produk dari formula "${formula.formulaName}"?\n\nProduk akan muncul di Master Product dan Inventory klinik ini.`)) return
    
    try {
      const { data: result } = await api.post(`/pharmacy/compound-formulas/${formula.id}/create-product`, {
        categoryId: null, // Bisa ditambahkan kategori default jika perlu
        sellingPrice: null, // Akan dihitung otomatis dengan markup 30%
        minStock: 0,
        reorderPoint: 0,
        clinicId: activeClinicId, // Kirim clinicId agar Product dibuat untuk klinik ini
      })
      
      alert(`✅ Produk berhasil dibuat!\n\nKode Master: ${result.productMaster.masterCode}\nKode Produk: ${result.product?.productCode || 'N/A'}\nNama: ${result.productMaster.masterName}\n\nProduk sekarang tersedia di:\n- Master Product\n- Inventory\n- Resep Dokter`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat produk')
    }
  }

  const handleBulkCreateProducts = async () => {
    if (!confirm('Buat produk untuk SEMUA formula yang belum punya produk?\n\nIni akan membuat ProductMaster dan Product untuk setiap formula racikan di klinik ini.')) return
    
    try {
      const { data: result } = await api.post('/pharmacy/compound-formulas/bulk-create-products', {
        clinicId: activeClinicId, // Kirim clinicId agar Product dibuat untuk klinik ini
        categoryId: null,
      })
      
      alert(`✅ ${result.message}\n\nBerhasil: ${result.created.length}\nGagal: ${result.errors.length}\n\nProduk sekarang tersedia di Inventory!`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat produk')
    }
  }

  const openAssembly = (formula: CompoundFormula) => {
    setAssembling(formula)
    setAssemblyQty(formula.defaultQty || 10)
    setAssemblyCheck(null)
    setAssemblyModalOpen(true)
  }

  const checkAssembly = async () => {
    if (!assembling || !activeClinicId) return
    
    setCheckingAssembly(true)
    try {
      const { data } = await api.post(`/pharmacy/compound-formulas/${assembling.id}/check-assembly`, {
        quantity: assemblyQty,
        clinicId: activeClinicId,
      })
      setAssemblyCheck(data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengecek kelayakan assembly')
    } finally {
      setCheckingAssembly(false)
    }
  }

  const handleAssemble = async () => {
    if (!assembling || !activeClinicId) return
    
    if (!assemblyCheck?.canAssemble) {
      alert('Stok bahan baku tidak mencukupi. Silakan cek detail di bawah.')
      return
    }

    if (!confirm(`Yakin ingin merakit ${assemblyQty} unit ${assembling.formulaName}?\n\nStok bahan baku akan otomatis terpotong.`)) return
    
    setSaving(true)
    try {
      const { data: result } = await api.post(`/pharmacy/compound-formulas/${assembling.id}/assemble`, {
        quantity: assemblyQty,
        clinicId: activeClinicId,
        notes: `Produksi ${new Date().toLocaleDateString('id-ID')}`,
      })
      
      const autoCreatedMsg = result.production.autoCreated 
        ? '\n\n✨ Produk baru dibuat otomatis untuk klinik ini!' 
        : ''
      
      alert(`✅ ${result.message}\n\nStok Baru: ${result.production.newStock} unit\nStok Sebelumnya: ${result.production.previousStock} unit\n\n${result.componentsUsed.length} bahan baku telah terpotong otomatis.${autoCreatedMsg}`)
      setAssemblyModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal merakit produk')
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { medicineId: '', quantity: 1, unit: 'tablet', notes: '' }],
    }))
  }

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const columns: Column<CompoundFormula>[] = [
    {
      key: 'formulaCode',
      label: 'Kode',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-gray-600">{item.formulaCode}</span>
      ),
    },
    {
      key: 'formulaName',
      label: 'Nama Formula',
      render: (item) => (
        <div>
          <p className="font-bold text-gray-900">{item.formulaName}</p>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (item) =>
        item.category ? <CategoryBadge category={item.category} /> : <span className="text-gray-300">-</span>,
    },
    {
      key: 'dosageForm',
      label: 'Bentuk',
      render: (item) => (
        <span className="text-xs font-semibold text-gray-600">{item.dosageForm || '-'}</span>
      ),
    },
    {
      key: 'items',
      label: 'Komponen',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <FiPackage className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-sm font-bold text-gray-700">{item.items.length}</span>
          <span className="text-xs text-gray-400">bahan</span>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock Saat Ini',
      render: (item) => {
        const currentStock = item.productMaster?.products?.[0]?.quantity || 0
        const hasProduct = !!item.productMaster?.products?.[0]
        
        return (
          <div className="flex items-center gap-2">
            {hasProduct ? (
              <>
                <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                  currentStock > 0 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-gray-50 text-gray-500'
                }`}>
                  {currentStock} unit
                </div>
              </>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold">
                Belum ada produk
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'tuslahPrice',
      label: 'Tuslah',
      render: (item) => (
        <span className="text-xs font-bold text-emerald-600">{formatRupiah(item.tuslahPrice)}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => <StatusBadge active={item.isActive} />,
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-2">
          {/* Lihat Detail */}
          <div className="relative group/detail">
            <button
              onClick={() => openDetail(item)}
              className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-all hover:scale-110 shadow-sm hover:shadow-md"
              title="Lihat Detail"
            >
              <FiEye className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/detail:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Lihat Detail
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Rakit Produk */}
          <div className="relative group/assembly">
            <button
              onClick={() => openAssembly(item)}
              className="p-2.5 rounded-xl hover:bg-purple-50 text-purple-600 transition-all hover:scale-110 shadow-sm hover:shadow-md"
              title="Rakit Produk"
            >
              <FiTool className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/assembly:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Rakit Produk dari Bahan Baku
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Buat Produk */}
          <div className="relative group/create">
            <button
              onClick={() => handleCreateProduct(item)}
              className="p-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all hover:scale-110 shadow-sm hover:shadow-md"
              title="Buat Produk"
            >
              <FiPackage className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/create:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Buat ProductMaster & Stok
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Edit */}
          <div className="relative group/edit">
            <button
              onClick={() => openEdit(item)}
              className="p-2.5 rounded-xl hover:bg-amber-50 text-amber-600 transition-all hover:scale-110 shadow-sm hover:shadow-md"
              title="Edit"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Edit Formula
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Hapus */}
          <div className="relative group/delete">
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all hover:scale-110 shadow-sm hover:shadow-md"
              title="Hapus"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/delete:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Hapus Formula
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FiLayers />}
        title="Master Formula Racikan"
        subtitle="Kelola template racikan standar (Bill of Materials)"
        onAdd={openCreate}
        addLabel="Buat Formula Baru"
      />

      {/* Action Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <FiPackage className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Buat Produk Massal</h3>
              <p className="text-xs text-gray-600">
                Buat ProductMaster & Stok untuk semua formula yang belum punya produk
              </p>
            </div>
          </div>
          <div className="group relative">
            <button
              onClick={handleBulkCreateProducts}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2.5"
            >
              <FiPackage className="w-5 h-5" />
              Buat Semua Produk
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Otomatis buat produk untuk semua formula
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Cari nama formula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={data} loading={loading} emptyText="Belum ada formula racikan" />

      {/* Create/Edit Modal */}
      <MasterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Formula Racikan' : 'Buat Formula Racikan Baru'}
        size="xl"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Nama Formula *
              </label>
              <input
                type="text"
                value={form.formulaName}
                onChange={(e) => setForm({ ...form, formulaName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Contoh: Racikan Flu Standar"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih Kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Bentuk Sediaan
              </label>
              <select
                value={form.dosageForm}
                onChange={(e) => setForm({ ...form, dosageForm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {DOSAGE_FORMS.map((df) => (
                  <option key={df} value={df}>
                    {df}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Jumlah Default
              </label>
              <input
                type="number"
                value={form.defaultQty}
                onChange={(e) => setForm({ ...form, defaultQty: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Biaya Tuslah (Rp)
              </label>
              <input
                type="number"
                value={form.tuslahPrice}
                onChange={(e) => setForm({ ...form, tuslahPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Status
              </label>
              <select
                value={form.isActive ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
              placeholder="Deskripsi singkat formula ini..."
            />
          </div>

          {/* Komponen Bahan Baku */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Komponen Bahan Baku *
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Tambah Bahan
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FiPackage className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Belum ada bahan baku</p>
                <p className="text-xs text-gray-300 mt-1">Klik tombol "Tambah Bahan" untuk mulai</p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-lg p-3"
                  >
                    <div className="col-span-5">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                        Obat
                      </label>
                      <select
                        value={item.medicineId}
                        onChange={(e) => updateItem(index, 'medicineId', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        <option value="">Pilih Obat</option>
                        {medicines.map((med) => (
                          <option key={med.id} value={med.medicineId || med.id}>
                            {med.masterName} {med.medicine?.strength ? `(${med.medicine.strength})` : ''} - Stok: {med.stock || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                        Jumlah
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                        Satuan
                      </label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                        placeholder="tablet"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                        Catatan
                      </label>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                        placeholder="opsional"
                      />
                    </div>

                    <div className="col-span-1 flex items-end justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                        title="Hapus"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {saving ? 'MENYIMPAN...' : editing ? 'PERBARUI FORMULA' : 'SIMPAN FORMULA'}
            </button>
          </div>
        </div>
      </MasterModal>

      {/* Detail Modal */}
      <MasterModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Formula Racikan"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Kode Formula</p>
                <p className="font-mono text-sm font-bold text-gray-900">{viewing.formulaCode}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Nama Formula</p>
                <p className="text-sm font-bold text-gray-900">{viewing.formulaName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Kategori</p>
                <p className="text-sm text-gray-700">{viewing.category || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Bentuk Sediaan</p>
                <p className="text-sm text-gray-700">{viewing.dosageForm || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Jumlah Default</p>
                <p className="text-sm text-gray-700">{viewing.defaultQty} unit</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Biaya Tuslah</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(viewing.tuslahPrice)}</p>
              </div>
            </div>

            {viewing.description && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700">{viewing.description}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                Komponen Bahan Baku ({viewing.items.length})
              </p>
              <div className="space-y-2">
                {viewing.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-black text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{item.medicine.medicineName}</p>
                      {item.medicine.genericName && (
                        <p className="text-xs text-gray-400">{item.medicine.genericName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {item.quantity} {item.unit || 'unit'}
                      </p>
                      {item.medicine.strength && (
                        <p className="text-xs text-gray-400">{item.medicine.strength}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </MasterModal>

      {/* Assembly Modal */}
      <MasterModal
        isOpen={assemblyModalOpen}
        onClose={() => setAssemblyModalOpen(false)}
        title={`Rakit Produk: ${assembling?.formulaName || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Jumlah yang Akan Dirakit *
            </label>
            <input
              type="number"
              min="1"
              value={assemblyQty}
              onChange={(e) => setAssemblyQty(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              placeholder="Masukkan jumlah"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: 10 puyer, 20 kapsul, dll
            </p>
          </div>

          {/* Check Button */}
          <button
            onClick={checkAssembly}
            disabled={checkingAssembly || !assemblyQty}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingAssembly ? 'Mengecek...' : 'Cek Ketersediaan Bahan Baku'}
          </button>

          {/* Assembly Check Result */}
          {assemblyCheck && (
            <div className="space-y-3">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border-2 ${assemblyCheck.canAssemble ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  {assemblyCheck.canAssemble ? (
                    <FiCheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <FiXCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-bold ${assemblyCheck.canAssemble ? 'text-emerald-900' : 'text-red-900'}`}>
                      {assemblyCheck.canAssemble ? '✅ Bahan Baku Mencukupi' : '❌ Bahan Baku Tidak Mencukupi'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {assemblyCheck.summary.sufficientComponents} dari {assemblyCheck.summary.totalComponents} bahan tersedia
                    </p>
                  </div>
                </div>
              </div>

              {/* Component Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                  Detail Bahan Baku
                </p>
                {assemblyCheck.componentStatus.map((comp: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${comp.isSufficient ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{comp.medicineName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {comp.unitQuantity} × {assemblyQty} = {comp.requiredQty} unit
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${comp.isSufficient ? 'text-emerald-600' : 'text-red-600'}`}>
                          Stok: {comp.availableStock}
                        </p>
                        {!comp.isSufficient && (
                          <p className="text-xs text-red-600 mt-0.5">
                            Kurang: {comp.shortage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Stock Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">Stok Saat Ini:</span> {assemblyCheck.currentStock} unit
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  <span className="font-bold">Stok Setelah Rakit:</span> {assemblyCheck.currentStock + assemblyQty} unit
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setAssemblyModalOpen(false)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAssemble}
              disabled={saving || !assemblyCheck?.canAssemble}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                'Merakit...'
              ) : (
                <>
                  <FiTool className="w-4 h-4" />
                  Rakit Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </MasterModal>
    </div>
  )
}
