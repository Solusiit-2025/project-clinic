'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFileText, FiCalendar, FiSearch, FiPrinter, FiDownload, FiActivity, FiFilter } from 'react-icons/fi'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Utilities
const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0)

export default function DiagnosisReportPage() {
  const { user, activeClinicId } = useAuthStore()

  // State
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (activeClinicId) {
      fetchData()
    }
  }, [activeClinicId])

  const fetchData = async () => {
    if (!activeClinicId) return
    setLoading(true)
    try {
      const res = await api.get('/reports/diagnosis', {
        params: {
          startDate,
          endDate,
          clinicId: activeClinicId,
          search: search || undefined
        }
      })
      setData(res.data)
    } catch (error: any) {
      console.error(error)
      toast.error('Gagal mengambil data laporan diagnosa')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPdf = () => {
    if (!data.length) return toast.error('Tidak ada data untuk diexport')
    
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Laporan Diagnosa Pasien', 14, 15)
    
    doc.setFontSize(10)
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 22)
    doc.text(`Klinik ID: ${activeClinicId}`, 14, 27)

    const tableColumn = ["Tanggal", "No. MR", "Nama Pasien", "L/P", "Umur", "Dokter", "Diagnosa", "ICD-10"]
    const tableRows = data.map(item => [
      new Date(item.recordDate).toLocaleDateString('id-ID'),
      item.patientMRN,
      item.patientName,
      item.patientGender,
      item.patientAge ? `${item.patientAge} Thn` : '-',
      item.doctorName,
      item.diagnosis,
      item.icd10Code ? `${item.icd10Code} - ${item.icd10Name}` : '-'
    ])

    ;(doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] }
    })

    doc.save(`Laporan_Diagnosa_${startDate}_${endDate}.pdf`)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in print:p-0 print:m-0 print:block">
      {/* HEADER - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Laporan Diagnosa Pasien</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">Daftar rekam medis dan diagnosa penyakit pasien</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm shadow-sm border border-gray-200">
            <FiPrinter className="w-4 h-4" /> Print
          </button>
          <button onClick={handleExportPdf} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-600/20">
            <FiDownload className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* FILTERS - Hidden on Print */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 print:hidden space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FiFilter className="text-blue-500" />
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filter Laporan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tanggal Mulai</label>
            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tanggal Akhir</label>
            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cari Pasien / Diagnosa / ICD</label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ketik kata kunci..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchData()}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 disabled:opacity-50"
            >
              {loading ? 'Memuat...' : 'Terapkan Filter'}
            </button>
          </div>
        </div>
      </div>

      {/* PRINT HEADER - Visible only on Print */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center">Laporan Diagnosa Pasien</h1>
        <p className="text-sm text-center mt-2">Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}</p>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 print:bg-white print:border-black">
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">No. RM</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">Pasien</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">Dokter</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">Diagnosa</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest print:text-black">ICD-10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 print:divide-black">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Memuat data laporan...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                    Tidak ada data diagnosa pada periode ini.
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.id} 
                    className="hover:bg-gray-50/50 transition-colors group print:text-sm"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-900 print:font-normal">
                        {new Date(item.recordDate).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-black text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded-lg print:bg-transparent print:p-0 print:font-normal">
                        {item.patientMRN}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 leading-tight print:font-normal">{item.patientName}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5 print:hidden">
                        {item.patientGender} • {item.patientAge ? `${item.patientAge} Thn` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg print:bg-transparent print:text-black print:p-0 print:font-normal">
                        {item.doctorName}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <p className="text-xs font-medium text-gray-700 whitespace-pre-wrap">{item.diagnosis}</p>
                    </td>
                    <td className="px-6 py-4">
                      {item.icd10Code ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg w-fit print:bg-transparent print:text-black print:p-0 print:font-normal">
                            {item.icd10Code}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1 line-clamp-2 print:hidden">{item.icd10Name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
