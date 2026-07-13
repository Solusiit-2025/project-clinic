'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, Pencil } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'
import SearchableSelect from '@/components/admin/master/SearchableSelect'

export default function EditAssetProcurementPage() {
  const router = useRouter()
  const params = useParams()
  const { activeClinicId } = useAuthStore()
  
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const [supplierName, setSupplierName] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [paymentType, setPaymentType] = useState('CASH')
  const [downPayment, setDownPayment] = useState(0)
  const [tenorMonths, setTenorMonths] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchPO()
  }, [])
  
  const fetchPO = async () => {
    if (!params.id || !activeClinicId) return
    try {
      const res = await api.get('/finance/asset-procurement', {
        params: { branchId: activeClinicId }
      })
      const po = res.data.find((p: any) => p.id === params.id)
      if (po) {
        setSupplierName(po.supplierName || '')
        setPaymentType(po.paymentType || 'CASH')
        setDownPayment(po.downPayment || 0)
        setTotalInterest(po.totalInterest || 0)
        
        // items might be inside po.items
        if (po.items) {
           setItems(po.items.map((it: any) => ({
             masterProductId: it.masterProductId,
             name: it.masterProduct?.masterName || 'Item',
             requestedQty: it.requestedQty,
             unitPrice: it.unitPrice,
             subtotal: it.subtotal
           })))
        }
        
        // Count schedules to get tenorMonths if installment
        if (po.paymentType === 'INSTALLMENT' && po.schedules) {
           setTenorMonths(po.schedules.length)
        }
      }
    } catch (e) {
      toast.error('Gagal memuat data PO')
    } finally {
      setIsInitializing(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get('/master/products', {
        params: { limit: 1000 }
      })
      // if api doesn't filter, we filter here just in case
      const productsData = Array.isArray(res.data) ? res.data : (res.data.data || [])
      const filtered = productsData.filter((p: any) => p.productType !== 'MEDICINE' && !p.productCategory?.categoryName?.toLowerCase().includes('obat'))
      setProducts(filtered)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddItem = () => {
    if (!selectedProduct || qty <= 0 || price <= 0) {
      toast.error('Lengkapi data barang terlebih dahulu')
      return
    }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    
    setItems([...items, {
      masterProductId: product.id,
      name: product.masterName,
      requestedQty: qty,
      unitPrice: price
    }])
    
    setSelectedProduct('')
    setQty(1)
    setPrice(0)
  }

  const handleEditItem = (index: number) => {
    const item = items[index];
    setSelectedProduct(item.masterProductId);
    setQty(item.requestedQty);
    setPrice(item.unitPrice);
    setItems(items.filter((_, i) => i !== index));
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.requestedQty * item.unitPrice), 0)

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error('Tambahkan minimal 1 barang')
    if (paymentType === 'INSTALLMENT' && tenorMonths <= 0) return toast.error('Isi tenor cicilan')
    if (!supplierName) return toast.error('Isi nama supplier')
    
    setIsSubmitting(true)
    try {
      await api.put(`/finance/asset-procurement/${params.id}`, {
        branchId: activeClinicId,
        supplierName,
        paymentType,
        downPayment,
        totalInterest,
        tenorMonths,
        items
      })
      
      toast.success('PO berhasil diperbarui')
      router.push('/admin/finance/asset-procurement')
    } catch (error) {
      console.error(error)
      toast.error('Gagal memperbarui PO')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitializing) return <div className="p-8 text-center text-gray-500">Memuat data...</div>

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Edit PO Aset</h1>
          <p className="text-gray-500 mt-1">Ubah data pesanan barang aset atau kebutuhan operasional klinik.</p>
        </div>
      </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Informasi Supplier</h2>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Nama Supplier / Toko</label>
            <input 
              type="text"
              placeholder="Contoh: Toko Elektronik Jaya"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Items Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Detail Barang</h2>
            
            <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-[2] min-w-[200px]">
                <SearchableSelect
                  label="Pilih Barang Aset / Umum"
                  placeholder="Ketik untuk mencari..."
                  options={products.map(p => ({
                    id: p.id,
                    label: p.masterName
                  }))}
                  value={selectedProduct}
                  onChange={(id) => {
                    setSelectedProduct(id)
                    const prod = products.find(p => p.id === id)
                    if(prod) setPrice(prod.sellingPrice || 0)
                  }}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-gray-600 mb-1">Qty</label>
                <input 
                  type="number" min="1" 
                  value={qty} onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm" 
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-600 mb-1">Harga Satuan</label>
                <input 
                  type="number" min="0" 
                  value={price} onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm" 
                />
              </div>
              <button 
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap mt-5"
              >
                <Plus className="w-4 h-4" />
                Tambahkan
              </button>
            </div>

            <table className="w-full text-left border-collapse mt-4">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Harga</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-sm text-gray-400">Belum ada barang</td></tr>
                ) : items.map((item, i) => (
                  <tr key={i}>
                    <td className="p-3 text-sm font-medium">{item.name}</td>
                    <td className="p-3 text-sm">{item.requestedQty}</td>
                    <td className="p-3 text-sm">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                    <td className="p-3 text-sm font-bold text-gray-800">Rp {(item.requestedQty * item.unitPrice).toLocaleString('id-ID')}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEditItem(i)} className="text-blue-500 p-1 hover:bg-blue-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Section */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-bold text-gray-800">Pembayaran</h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Tipe Pembayaran</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setPaymentType('CASH')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${paymentType === 'CASH' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Lunas (Cash)
                </button>
                <button 
                  onClick={() => setPaymentType('INSTALLMENT')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${paymentType === 'INSTALLMENT' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cicilan (Kredit)
                </button>
              </div>
            </div>

            {paymentType === 'INSTALLMENT' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Uang Muka (DP)</label>
                  <input 
                    type="number" min="0" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm" 
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tenor (Bulan)</label>
                    <input 
                      type="number" min="1" value={tenorMonths} onChange={(e) => setTenorMonths(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Total Bunga (Rp)</label>
                    <input 
                      type="number" min="0" value={totalInterest} onChange={(e) => setTotalInterest(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-gray-200 outline-none text-sm" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Harga</span>
                <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {paymentType === 'INSTALLMENT' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total Bunga</span>
                    <span className="font-bold">Rp {totalInterest.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Uang Muka</span>
                    <span className="font-bold text-rose-600">- Rp {downPayment.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Hutang Pokok</span>
                    <span className="font-bold">Rp {Math.max(0, totalAmount - downPayment).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Cicilan per Bulan</span>
                    <span className="font-bold text-emerald-600">
                      Rp {tenorMonths > 0 ? Math.round(((totalAmount - downPayment) + totalInterest) / tenorMonths).toLocaleString('id-ID') : 0}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Menyimpan...' : 'Perbaharui PO Aset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
