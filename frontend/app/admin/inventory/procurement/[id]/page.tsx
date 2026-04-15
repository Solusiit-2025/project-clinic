'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, CheckCircle, Package, Truck, 
  MapPin, Printer, ScanBarcode, Check, ShieldAlert
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default function ProcurementDetailView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)

  // GRN State
  const [grnItems, setGrnItems] = useState<any[]>([])
  const [grnNo, setGrnNo] = useState('')

  const fetchDetail = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/inventory/procurement/${id}`)
      setData(res.data)
      
      // Init GRN form
      if (res.data.status === 'APPROVED') {
        setGrnNo(`GRN-${Date.now()}`)
        setGrnItems(res.data.items.map((i: any) => ({
           itemId: i.id,
           productName: i.product.productName,
           requestedQty: i.requestedQty,
           receivedQty: i.requestedQty, // default full
           batchNumber: '',
           expiryDate: ''
        })))
      }
    } catch (e: any) {
      toast.error('Gagal memuat detail PR')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      await api.patch(`/inventory/procurement/${id}/approve`)
      toast.success('PR Berhasil Disetujui')
      fetchDetail()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyetujui')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReceiveGoods = async () => {
    // Validate GRN
    const invalidItem = grnItems.find(i => !i.batchNumber || !i.expiryDate)
    if (invalidItem) {
      toast.error('Semua barang yang diterima harus diisi Nomor Batch dan Tanggal Kadaluwarsa')
      return
    }

    try {
      setIsReceiving(true)
      await api.post(`/inventory/procurement/${id}/receive`, {
        grnNo,
        items: grnItems
      })
      toast.success('Penerimaan barang berhasil, stok bertambah')
      fetchDetail()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menerima barang')
    } finally {
      setIsReceiving(false)
    }
  }

  const handleGrnUpdate = (itemId: string, field: string, value: any) => {
    setGrnItems(prev => prev.map(i => i.itemId === itemId ? { ...i, [field]: value } : i))
  }

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">Memuat detail pengajuan...</div>
  if (!data) return <div className="p-10 text-center font-bold text-red-500">Data tidak ditemukan</div>

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="p-6 w-full mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{data.procurementNo}</h1>
            <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase tracking-widest rounded-lg text-gray-600">
               {data.type}
            </span>
          </div>
          <p className="text-gray-500 font-medium text-xs mt-1">Dibuat pada {format(new Date(data.createdAt), 'dd MMMM yyyy HH:mm', { locale: localeID })}</p>
        </div>
        
        <button className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm">
          <Printer className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info & Items */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Informasi Transaksi</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Status</span>
                    <span className="font-bold text-primary">{data.status.replace('_', ' ')}</span>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Total Nilai</span>
                    <span className="font-black text-gray-900">Rp {data.totalAmount.toLocaleString('id-ID')}</span>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Catatan</span>
                    <span className="font-bold text-gray-700">{data.notes || '-'}</span>
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase block mb-1">Vendor</span>
                    <span className="font-bold text-gray-700">{data.vendor?.name || 'Internal / Belum Ditentukan'}</span>
                 </div>
              </div>
           </div>

           {/* Item List */}
           <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden ring-1 ring-gray-100">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Detail Item ({data.items.length})</h2>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-black text-gray-400">
                           <th className="px-6 py-4">Produk</th>
                           <th className="px-6 py-4">Kode</th>
                           <th className="px-6 py-4">Diajukan</th>
                           <th className="px-6 py-4">Diterima</th>
                           <th className="px-6 py-4">Subtotal</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {data.items.map((item: any) => (
                           <tr key={item.id} className="font-bold text-sm text-gray-700">
                               <td className="px-6 py-4">{item.product.productName}</td>
                               <td className="px-6 py-4 font-mono text-xs">{item.product.productCode}</td>
                               <td className="px-6 py-4">{item.requestedQty}</td>
                               <td className="px-6 py-4 text-primary">{item.receivedQty || '-'}</td>
                               <td className="px-6 py-4">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                           </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-1 space-y-6">
           {data.status === 'PENDING_APPROVAL' && (
              <div className="bg-gray-900 p-6 rounded-[32px] shadow-xl">
                 <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                    Otorisasi Diperlukan
                 </h2>
                 <p className="text-gray-400 text-xs font-medium mb-6">
                    PR ini menunggu persetujuan. Jika melebihi limit cabang, persetujuan harus dilakukan oleh Administrator Pusat (HQ).
                 </p>
                 <button
                   onClick={handleApprove}
                   disabled={isApproving}
                   className="w-full py-3 bg-white text-gray-900 font-black rounded-xl hover:bg-primary hover:text-white transition-all text-sm mb-2"
                 >
                   {isApproving ? 'Memproses...' : 'SETUJUI (APPROVE)'}
                 </button>
              </div>
           )}

           {data.status === 'APPROVED' && (
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px]">
                 <h2 className="text-blue-900 font-black uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                    <Truck className="w-5 h-5 text-blue-600" />
                    Penerimaan Barang (GRN)
                 </h2>
                 <div className="mb-4">
                    <label className="text-[10px] font-black text-blue-400 tracking-widest uppercase block mb-1">Nomor GRN</label>
                    <input 
                      type="text" 
                      value={grnNo} 
                      onChange={e => setGrnNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold"
                    />
                 </div>

                 <div className="space-y-4">
                    {grnItems.map(item => (
                       <div key={item.itemId} className="p-4 bg-white rounded-2xl border border-blue-50 shadow-sm">
                           <p className="font-bold text-sm text-gray-900 truncate mb-3">{item.productName}</p>
                           
                           <div className="flex items-center gap-2 mb-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase w-16">Diterima</label>
                              <input 
                                type="number" 
                                value={item.receivedQty}
                                onChange={e => handleGrnUpdate(item.itemId, 'receivedQty', Number(e.target.value))}
                                className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-center text-sm font-bold"
                              />
                              <span className="text-xs font-bold text-gray-400">/ {item.requestedQty}</span>
                           </div>

                           <div className="space-y-2 relative">
                              <div className="flex gap-2 items-center">
                                 <label className="text-[10px] font-black text-gray-400 uppercase w-16">Batch/Lot</label>
                                 <div className="relative flex-1">
                                    <ScanBarcode className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Scan/Ketikan BN..."
                                      value={item.batchNumber}
                                      onChange={e => handleGrnUpdate(item.itemId, 'batchNumber', e.target.value)}
                                      className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-100 focus:border-blue-300 rounded text-xs font-bold uppercase transition-all"
                                    />
                                 </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                 <label className="text-[10px] font-black text-gray-400 uppercase w-16">Expired</label>
                                 <input 
                                   type="date" 
                                   value={item.expiryDate}
                                   onChange={e => handleGrnUpdate(item.itemId, 'expiryDate', e.target.value)}
                                   className="w-full flex-1 px-2 py-1.5 bg-gray-50 border border-gray-100 focus:border-blue-300 rounded text-xs font-bold transition-all"
                                 />
                              </div>
                           </div>
                       </div>
                    ))}
                 </div>

                 <button
                   onClick={handleReceiveGoods}
                   disabled={isReceiving}
                   className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                 >
                   {isReceiving ? 'Menyimpan...' : (
                      <>
                         <Check className="w-5 h-5" />
                         TERIMA & UPDATE STOK
                      </>
                   )}
                 </button>
              </div>
           )}

           {data.status === 'RECEIVED' && (
              <div className="bg-green-50 border border-green-100 p-6 rounded-[32px] flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-green-200 text-green-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-black text-green-800 text-sm uppercase tracking-widest">Selesai</h3>
                    <p className="text-xs font-medium text-green-600 mt-1">Barang telah masuk ke sistem stok dan jurnal tercatat.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
