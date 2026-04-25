'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { 
  FiTrash2, FiSearch, FiFilter, FiAlertCircle, FiCalendar, 
  FiDollarSign, FiInfo, FiCheckCircle, FiArchive
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import DataTable, { Column } from '@/components/admin/master/DataTable'
import PageHeader from '@/components/admin/master/PageHeader'
import MasterModal from '@/components/admin/master/MasterModal'
import { toast } from 'react-hot-toast'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

type AssetRegisterItem = {
  id: string
  assetCode: string
  assetName: string
  assetType: string
  purchasePrice: number
  totalDepreciated: number
  bookValue: number
  status: string
  clinic?: { name: string; code: string }
}

export default function AssetDisposalPage() {
  const [assets, setAssets] = useState<AssetRegisterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClinic, setFilterClinic] = useState('')
  const [clinics, setClinics] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetRegisterItem | null>(null)
  const [formData, setFormData] = useState({
    disposalDate: new Date().toISOString().split('T')[0],
    disposalValue: 0,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)


  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { status: 'active' } // Hanya tampilkan yang masih aktif
      if (filterClinic) params.clinicId = filterClinic
      
      const { data } = await api.get('/master/assets/register', { params })
      setAssets(data.assets || [])
    } catch (e) {
      console.error('Failed to fetch assets', e)
      toast.error('Gagal mengambil data aset')
    } finally {
      setLoading(false)
    }
  }, [filterClinic])

  const fetchClinics = useCallback(async () => {
    try {
      const { data } = await api.get('/master/clinics')
      setClinics(data)
    } catch (e) { console.error('Failed to fetch clinics', e) }
  }, [])

  useEffect(() => {
    fetchData()
    fetchClinics()
  }, [fetchData, fetchClinics])

  const handleOpenModal = (asset: AssetRegisterItem) => {
    setSelectedAsset(asset)
    setFormData({
      disposalDate: new Date().toISOString().split('T')[0],
      disposalValue: 0,
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return
    
    if (!confirm(`Apakah Anda yakin ingin menghapus aset "${selectedAsset.assetName}" dari pembukuan? Tindakan ini akan menghentikan penyusutan dan membuat jurnal penyesuaian di GL.`)) {
      return
    }

    setIsSubmitting(true)
    try {
      await api.post(`/master/assets/${selectedAsset.id}/dispose`, formData)
      toast.success('Aset berhasil dihapus (retired) dan jurnal GL telah dibuat')
      setIsModalOpen(false)
      fetchData()
    } catch (e: any) {
      console.error('Failed to dispose asset', e)
      toast.error(e.response?.data?.message || 'Gagal menghapus aset')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<AssetRegisterItem>[] = [
    {
      key: 'assetName',
      label: 'ASET & KODE',
      render: (r) => (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">
              {r.assetCode}
            </span>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-wider">
              {r.assetType.replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{r.assetName}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase leading-none">{r.clinic?.name || 'Pusat'}</p>
        </div>
      )
    },
    {
      key: 'purchasePrice',
      label: 'HARGA PEROLEHAN',
      render: (r) => (
        <span className="text-xs font-bold text-gray-600">Rp {r.purchasePrice.toLocaleString('id-ID')}</span>
      )
    },
    {
      key: 'totalDepreciated',
      label: 'AKUM. PENYUSUTAN',
      render: (r) => (
        <span className="text-xs font-bold text-rose-500">Rp {r.totalDepreciated.toLocaleString('id-ID')}</span>
      )
    },
    {
      key: 'bookValue',
      label: 'NILAI BUKU (SISA)',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-primary">Rp {r.bookValue.toLocaleString('id-ID')}</span>
          <div className="w-24 bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
             <div 
               className="h-full bg-primary" 
               style={{ width: `${Math.max(0, Math.min(100, (r.bookValue / r.purchasePrice) * 100))}%` }} 
             />
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'OPSI',
      render: (r) => (
        <button
          onClick={() => handleOpenModal(r)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all group border border-rose-100"
        >
          <FiTrash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap">Hapus Aset</span>
        </button>
      )
    }
  ]

  return (
    <div className="p-6 w-full mx-auto min-h-screen bg-[#fcfcfd]">
      <PageHeader
        title="Penghapusan Aset (Disposal)"
        subtitle="Proses pelepasan atau penghapusan aset dari pembukuan akuntansi"
        icon={<FiArchive className="w-6 h-6" />}
        breadcrumb={['Admin', 'Keuangan Aset', 'Penghapusan Aset']}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <FiArchive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Aset Aktif</p>
            <p className="text-2xl font-black text-gray-900">{assets.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Nilai Buku</p>
            <p className="text-2xl font-black text-emerald-600">Rp {assets.reduce((s, a) => s + a.bookValue, 0).toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aset Depresiasi 100%</p>
            <p className="text-2xl font-black text-amber-600">{assets.filter(a => a.bookValue <= 1).length}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          data={assets}
          columns={columns}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari kode atau nama aset..."
          extraFilters={
            <select 
              value={filterClinic} 
              onChange={(e) => setFilterClinic(e.target.value)}
              className="px-4 py-2.5 text-xs border border-gray-100 rounded-2xl focus:outline-none focus:border-primary bg-gray-50 font-black text-gray-600 shadow-sm transition-all"
            >
              <option value="">Seluruh Cabang</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          }
        />
      </div>

      {/* MODAL DISPOSAL */}
      <MasterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Penghapusan Aset dari Pembukuan"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedAsset && (
            <div className="bg-rose-50 p-5 rounded-[2rem] border border-rose-100/50">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500">
                    <FiArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">{selectedAsset.assetName}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1.5">{selectedAsset.assetCode}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-100/30">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Harga Perolehan</p>
                    <p className="text-sm font-black text-gray-700 mt-1">Rp {selectedAsset.purchasePrice.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Nilai Buku Saat Ini</p>
                    <p className="text-sm font-black text-rose-600 mt-1">Rp {selectedAsset.bookValue.toLocaleString('id-ID')}</p>
                  </div>
               </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Penghapusan</label>
                <input
                  type="date"
                  required
                  value={formData.disposalDate}
                  onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nilai Jual (Jika Ada)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Rp</span>
                  <input
                    type="number"
                    value={formData.disposalValue}
                    onChange={(e) => setFormData({ ...formData, disposalValue: Number(e.target.value) })}
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
              <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="text-[11px] text-blue-700 font-bold leading-relaxed">
                {(() => {
                  const gainLoss = (formData.disposalValue || 0) - (selectedAsset?.bookValue || 0)
                  if (gainLoss > 0) return `Prediksi Laba Pelepasan: Rp ${gainLoss.toLocaleString('id-ID')}. Nilai ini akan dicatat sebagai pendapatan lain-lain di GL.`
                  if (gainLoss < 0) return `Prediksi Rugi Pelepasan: Rp ${Math.abs(gainLoss).toLocaleString('id-ID')}. Nilai ini akan dicatat sebagai beban pelepasan aset di GL.`
                  return 'Nilai pelepasan sama dengan nilai buku. Tidak ada laba/rugi yang dicatat.'
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alasan / Catatan</label>
              <textarea
                required
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                placeholder="Misal: Barang rusak berat, hibah, atau dijual ke pihak ketiga..."
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all font-black"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Penghapusan'}
            </button>
          </div>
        </form>
      </MasterModal>
    </div>
  )
}
