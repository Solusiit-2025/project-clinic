'use client'

import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Download, FileText, Printer, Mail, 
  MapPin, Phone, CheckCircle2, Building2 
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

interface POPreviewProps {
  isOpen: boolean
  onClose: () => void
  data: any
}

export default function POPreview({ isOpen, onClose, data }: POPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen || !data) return null

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    
    try {
      setIsExporting(true)
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`PO-${data.procurementNo}-${format(new Date(), 'yyyyMMdd')}.pdf`)
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                 <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Dokumen PO Preview</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{data.procurementNo}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg disabled:opacity-50"
              >
                {isExporting ? (
                  'Mengekspor...'
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    DOWNLOAD PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-gray-900 transition-all hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Document Area */}
          <div className="flex-1 overflow-y-auto bg-gray-200 p-8 sm:p-12 print:p-0 print:bg-white pb-20">
            {/* The Document */}
            <div 
              ref={printRef}
              className="mx-auto w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-12 sm:p-16 text-gray-800 font-sans"
              style={{ boxSizing: 'border-box' }}
            >
              {/* PO Header */}
              <div className="flex justify-between items-start mb-6 border-b-2 border-primary pb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                    {data.branch?.name || 'KLINIK CENTRAL'}
                  </h1>
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <MapPin className="w-3 h-3 text-primary" />
                      {data.branch?.address || 'Alamat Cabang'}
                    </p>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <Phone className="w-3 h-3 text-primary" />
                      {data.branch?.phone || '-'}
                    </p>
                    <p className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <Mail className="w-3 h-3 text-primary" />
                      {data.branch?.email || '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-primary tracking-tighter mb-2 italic uppercase">Purchase Order</h2>
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Nomor PO</p>
                    <p className="text-lg font-black text-gray-900">{data.procurementNo}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Tanggal</p>
                    <p className="text-xs font-bold text-gray-700">{format(new Date(data.createdAt), 'dd MMMM yyyy', { locale: localeID })}</p>
                  </div>
                </div>
              </div>

              {/* Vendor & Shipping */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 border-b border-primary/20 pb-0.5 w-fit">Vendor / Supplier</h3>
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-black text-gray-900 mb-0.5">{data.vendor?.name || 'TIDAK DITENTUKAN'}</p>
                    <p className="text-[10px] font-bold text-gray-500 line-clamp-2 leading-relaxed">
                       {data.vendor?.address || 'Pembelian fleksibel (Acak) sesuai kebutuhan operasional dan ketersediaan stok.'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 border-b border-primary/20 pb-0.5 w-fit">Dikirim Ke (Shipping)</h3>
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 italic">
                    <p className="text-[10px] font-black text-gray-800 mb-0.5">{data.branch?.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                      {data.branch?.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest border border-primary">No</th>
                      <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest border border-primary">Deskripsi Barang</th>
                      <th className="px-3 py-2 text-center text-[9px] font-black uppercase tracking-widest border border-primary">Kuantitas</th>
                      <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest border border-primary">Harga Satuan</th>
                      <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest border border-primary">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item: any, idx: number) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="px-3 py-1.5 text-center text-[10px] font-bold border border-gray-100">{idx + 1}</td>
                        <td className="px-3 py-1.5 border border-gray-100">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{item.product.productName}</p>
                          <p className="text-[8px] font-bold text-gray-400 font-mono italic">{item.product.productCode}</p>
                        </td>
                        <td className="px-3 py-1.5 text-center text-[10px] font-black border border-gray-100">{item.requestedQty} Unit</td>
                        <td className="px-3 py-1.5 text-right text-[10px] font-bold text-gray-600 border border-gray-100">
                          Rp {item.unitPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-1.5 text-right text-[10px] font-black text-gray-900 border border-gray-100 bg-gray-50/30">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end mb-10">
                <div className="w-1/3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide px-2">
                    <span>Subtotal</span>
                    <span>Rp {data.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wide px-2 italic">
                    <span>Pajak / PPN (0%)</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center bg-primary text-white p-3 rounded-xl shadow-lg mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest">Total Bayar</span>
                    <span className="text-sm font-black tracking-tight">Rp {data.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-20">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-12">Disetujui Oleh,</p>
                  <div className="w-3/4 mx-auto border-b-2 border-gray-900 mb-1"></div>
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-tight italic">( Manager Operasional )</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-12">Dibuat Oleh,</p>
                  <div className="w-3/4 mx-auto border-b-2 border-gray-900 mb-1"></div>
                  <p className="text-[9px] font-black text-gray-900 uppercase tracking-tight italic">( Bagian Logistik & Aset )</p>
                </div>
              </div>

              {/* Document T&C */}
              <div className="mt-20 pt-8 border-t border-gray-100 italic">
                <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                  Catatan: PO ini dihasilkan secara elektronik oleh Sistem Klinik Terpusat (CBANG).
                  Produk harus sesuai dengan spesifikasi yang tertera. Pembayaran akan dilakukan sesuai termin yang disepakati.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
