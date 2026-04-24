'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'

const API = process.env.NEXT_PUBLIC_API_URL + '/api/master'

export default function PrintTransferNote() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        // We use the same getAll endpoint but filter by ID for simplicity
        const res = await axios.get(`${API}/assets/transfers/all`, { headers })
        const record = res.data.find((r: any) => r.id === id)
        setData(record)
      } catch (e: any) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-10 text-center font-bold">Memuat dokumen...</div>
  if (!data) return <div className="p-10 text-center font-bold text-rose-500">Data tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Controls - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-bold text-sm"
        >
          <FiArrowLeft /> Kembali
        </button>
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg"
        >
          <FiPrinter /> Cetak Dokumen
        </button>
      </div>

      {/* Official Document */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-sm p-12 print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">Surat Jalan</h1>
            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase italic">Internal Asset Transfer Note</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-gray-900 mb-1">{data.transferNo}</p>
            <p className="text-xs font-bold text-gray-500 uppercase">{format(new Date(data.transferDate), 'eeee, dd MMMM yyyy', { locale: idLocale })}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dari (Asal)</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm font-black text-gray-900 uppercase mb-1">{data.fromClinic?.name}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{data.fromClinic?.code}</p>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kepada (Tujuan)</h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm font-black text-indigo-900 uppercase mb-1">{data.toClinic?.name}</p>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">{data.toClinic?.code}</p>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="mb-12">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi Aset</th>
                <th className="py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Aset</th>
                <th className="py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Kondisi</th>
                <th className="py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-6">
                  <p className="text-sm font-black text-gray-900 uppercase leading-none mb-2">{data.asset?.assetName}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase italic">Aset Tetap / {data.asset?.assetType}</p>
                </td>
                <td className="py-6 text-right">
                  <span className="px-3 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-600">{data.asset?.assetCode}</span>
                </td>
                <td className="py-6 text-right">
                  <span className="text-[10px] font-black uppercase text-emerald-600">{data.asset?.condition}</span>
                </td>
                <td className="py-6 text-right font-black text-gray-900">1 Unit</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Reason & Notes */}
        <div className="grid grid-cols-2 gap-12 mb-16">
          <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alasan Pemindahan</h4>
            <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{data.reason || 'Tidak ada alasan khusus'}"</p>
          </div>
          <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catatan Internal</h4>
            <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{data.notes || '-'}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-16">Pengirim (Asal)</p>
            <div className="border-b-2 border-gray-900 w-32 mx-auto mb-2"></div>
            <p className="text-[10px] font-black text-gray-900 uppercase leading-none">( ............................ )</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-16">Pembawa / Kurir</p>
            <div className="border-b-2 border-gray-900 w-32 mx-auto mb-2"></div>
            <p className="text-[10px] font-black text-gray-900 uppercase leading-none">( ............................ )</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-16">Penerima (Tujuan)</p>
            <div className="border-b-2 border-gray-900 w-32 mx-auto mb-2"></div>
            <p className="text-[10px] font-black text-gray-900 uppercase leading-none">( ............................ )</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen Aset Klinik</p>
        </div>
      </div>
    </div>
  )
}
