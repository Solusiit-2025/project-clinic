'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingBag, Truck, DollarSign, Eye, CheckCircle, CreditCard, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'

export default function AssetProcurementPage() {
  const router = useRouter()
  const { activeClinicId } = useAuthStore()
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [receiveModal, setReceiveModal] = useState<{isOpen: boolean, poId: string | null}>({isOpen: false, poId: null})

  useEffect(() => {
    fetchData()
  }, [activeClinicId])

  const fetchData = async () => {
    if (!activeClinicId) return
    setIsLoading(true)
    try {
      const res = await api.get('/finance/asset-procurement', {
        params: { branchId: activeClinicId }
      })
      setData(res.data)
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiveClick = (id: string) => {
    setReceiveModal({ isOpen: true, poId: id })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus Data PO Aset ini permanen?')) return
    try {
      await api.delete(`/finance/asset-procurement/${id}`)
      toast.success('PO berhasil dihapus')
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus PO, pastikan belum ada pembayaran')
    }
  }

  const confirmReceive = async () => {
    if (!receiveModal.poId) return
    try {
      await api.post(`/finance/asset-procurement/${receiveModal.poId}/receive`)
      toast.success('Barang berhasil diterima')
      setReceiveModal({ isOpen: false, poId: null })
      fetchData()
    } catch (e) {
      toast.error('Gagal menerima barang')
    }
  }

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Pembelian Aset & Umum</h1>
          <p className="text-gray-500 mt-1">Kelola pengadaan barang non-medis, aset tetap, dan jadwal cicilan.</p>
        </div>
        <button
          onClick={() => router.push('/admin/finance/asset-procurement/new')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Buat PO Aset
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">No. PO & Tanggal</th>
                <th className="p-4">Barang</th>
                <th className="p-4">Tipe Pembayaran</th>
                <th className="p-4">Total Nilai</th>
                <th className="p-4">Status Penerimaan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Belum ada data pembelian aset.</td>
                </tr>
              ) : (
                data.map((po: any) => {
                  const isReceived = po.status === 'RECEIVED'
                  const hasPaidInstallment = po.schedules?.some((s: any) => s.status === 'PAID')
                  const isModifiable = !isReceived && !hasPaidInstallment
                  
                  return (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{po.procurementNo}</div>
                      <div className="text-xs text-gray-500">{new Date(po.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
                    </td>
                    <td className="p-4">
                      {po.items.map((item: any, i: number) => (
                        <div key={i} className="text-sm font-medium text-gray-700">
                          {item.masterProduct?.masterName} <span className="text-gray-400">x{item.requestedQty}</span>
                        </div>
                      ))}
                    </td>
                    <td className="p-4">
                      {po.paymentType === 'INSTALLMENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-600 border border-amber-200">
                          <DollarSign className="w-3.5 h-3.5" />
                          CICILAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <DollarSign className="w-3.5 h-3.5" />
                          LUNAS
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">
                        Rp {po.totalAmount.toLocaleString('id-ID')}
                      </div>
                      {po.paymentType === 'INSTALLMENT' && (
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          DP: Rp {po.downPayment.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {po.status === 'RECEIVED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          DITERIMA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-600 border border-blue-200">
                          <Truck className="w-3.5 h-3.5" />
                          DIPROSES
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {po.status !== 'RECEIVED' && (
                          <button
                            onClick={() => handleReceiveClick(po.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Terima Barang
                          </button>
                        )}
                        {po.paymentType === 'INSTALLMENT' && (
                          <button
                            onClick={() => router.push(`/admin/finance/asset-procurement/${po.id}/installments`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-lg transition-all shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Rincian Cicilan
                          </button>
                        )}
                        
                        <button
                          onClick={() => isModifiable ? router.push(`/admin/finance/asset-procurement/${po.id}/edit`) : undefined}
                          disabled={!isModifiable}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm border ${isModifiable ? 'text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300' : 'text-gray-400 bg-gray-100 border-gray-100 cursor-not-allowed opacity-60'}`}
                          title={isModifiable ? 'Edit PO' : 'Tidak dapat diubah'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => isModifiable ? handleDelete(po.id) : undefined}
                          disabled={!isModifiable}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm border ${isModifiable ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300' : 'text-gray-400 bg-gray-100 border-gray-100 cursor-not-allowed opacity-60'}`}
                          title={isModifiable ? 'Hapus PO' : 'Tidak dapat dihapus'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Confirmation Modal */}
      {receiveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-blue-600 p-6 text-white text-center">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold">Konfirmasi Penerimaan Barang</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                <div className="text-sm space-y-1">
                  <p className="font-bold">Pastikan Pengecekan Fisik Sudah Sesuai:</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>Kesesuaian dengan Surat Jalan dari Supplier</li>
                    <li>Kesesuaian Spesifikasi dengan dokumen PO</li>
                    <li>Kondisi fisik barang utuh dan tidak cacat</li>
                    <li>Jumlah / Kuantitas yang dikirim sudah lengkap</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Dengan mengonfirmasi, stok akan otomatis bertambah dan status pesanan menjadi DITERIMA.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setReceiveModal({ isOpen: false, poId: null })}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmReceive}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Ya, Barang Sudah Sesuai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
