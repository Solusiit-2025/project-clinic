'use client'

import { useState, useEffect, Fragment } from 'react'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { FiPrinter, FiDownload, FiSearch, FiCalendar } from 'react-icons/fi'

export default function LbkReportPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  
  // Default ke bulan ini
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/lbk', {
        params: { startDate, endDate }
      })
      setData(res.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const ageGroups = ['0-7h', '8-28h', '1-11b', '1-4t', '5-9t', '10-14t', '15-19t', '20-44t', '45-59t', '>59t']

  return (
    <div className="space-y-6 pb-20 print:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Bulanan Klinik (LBK)</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan agregasi data kesakitan dan kunjungan untuk Dinas Kesehatan</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm shadow-sm border border-gray-200">
            <FiPrinter /> Cetak
          </button>
        </div>
      </div>

      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Periode Mulai</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Periode Selesai</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button onClick={fetchReport} disabled={loading} className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
            <FiSearch /> Tampilkan Laporan
          </button>
        </div>
      </Card>

      {/* Area Laporan Cetak */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[500px] print:shadow-none print:border-none print:p-0">
        
        {/* Header Laporan */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-bold uppercase">Laporan Bulanan Klinik</h2>
          <p className="text-sm">Periode: {startDate} s/d {endDate}</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !data ? (
          <div className="text-center text-gray-500 py-10">Tidak ada data untuk periode ini</div>
        ) : (
          <div className="space-y-10">
            
            {/* Bagian A */}
            <section>
              <h3 className="font-bold text-lg mb-3">A. Data Umum</h3>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 w-10 text-center">1</td>
                    <td className="border border-gray-300 p-2 w-64">Nama Klinik</td>
                    <td className="border border-gray-300 p-2 font-medium">Klinik Pratama Yasfina</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">2</td>
                    <td className="border border-gray-300 p-2">Kode Faskes</td>
                    <td className="border border-gray-300 p-2">-</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">3</td>
                    <td className="border border-gray-300 p-2">Alamat Lengkap Klinik</td>
                    <td className="border border-gray-300 p-2">VBI BLOK BB2 NO 1</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Bagian B: Kelahiran */}
            <section>
              <h3 className="font-bold text-lg mb-3">B. Data Kelahiran di Klinik</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead className="bg-gray-50 text-center">
                    <tr>
                      <th className="border border-gray-300 p-2">No</th>
                      <th className="border border-gray-300 p-2">Nama Bayi</th>
                      <th className="border border-gray-300 p-2">L/P</th>
                      <th className="border border-gray-300 p-2">Nama Ibu</th>
                      <th className="border border-gray-300 p-2">Alamat Lengkap</th>
                      <th className="border border-gray-300 p-2">Tanggal & Jam Lahir</th>
                      <th className="border border-gray-300 p-2">Umur Kehamilan</th>
                      <th className="border border-gray-300 p-2">BB(g) / TB(cm)</th>
                      <th className="border border-gray-300 p-2">Normal / Dirujuk</th>
                      <th className="border border-gray-300 p-2">IMD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data.births || data.births.length === 0 ? (
                      <tr><td colSpan={10} className="p-4 text-center text-gray-500">Nihil</td></tr>
                    ) : data.births.map((item: any, idx: number) => (
                      <tr key={`birth-${idx}`}>
                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-2">{item.babyName || 'Belum Diberi Nama'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.gender || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.patient?.name || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.patient?.address || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{new Date(item.birthDate).toLocaleString('id-ID')}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.gestationalAge ? `${item.gestationalAge} mgg` : '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.weight || '-'} / {item.length || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.isNormalBirth ? 'Normal' : 'Dirujuk'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.imd ? 'Ya' : 'Tidak'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bagian C: Kematian */}
            <section>
              <h3 className="font-bold text-lg mb-3">C. Data Kematian di Klinik</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead className="bg-gray-50 text-center">
                    <tr>
                      <th className="border border-gray-300 p-2">No</th>
                      <th className="border border-gray-300 p-2">NIK</th>
                      <th className="border border-gray-300 p-2">Nama Pasien</th>
                      <th className="border border-gray-300 p-2">Alamat</th>
                      <th className="border border-gray-300 p-2">Umur</th>
                      <th className="border border-gray-300 p-2">L/P</th>
                      <th className="border border-gray-300 p-2">Tanggal Meninggal</th>
                      <th className="border border-gray-300 p-2">Tempat Meninggal</th>
                      <th className="border border-gray-300 p-2">Sebab Dasar</th>
                      <th className="border border-gray-300 p-2">Diagnosa & ICD-10</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data.deaths || data.deaths.length === 0 ? (
                      <tr><td colSpan={10} className="p-4 text-center text-gray-500">Nihil</td></tr>
                    ) : data.deaths.map((item: any, idx: number) => (
                      <tr key={`death-${idx}`}>
                        <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.identityNumber || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.name || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.address || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.age || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.gender || '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.dateOfDeath ? new Date(item.dateOfDeath).toLocaleString('id-ID') : '-'}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.deathPlace || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.deathCause || '-'}</td>
                        <td className="border border-gray-300 p-2">{item.deathIcd10 ? `${item.deathIcd10.code} - ${item.deathIcd10.nameId || item.deathIcd10.nameEn}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bagian D.1 */}
            <section>
              <h3 className="font-bold text-lg mb-3">D.1 Data Kesakitan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-2" rowSpan={2}>No</th>
                      <th className="border border-gray-300 p-2" rowSpan={2}>Jenis Penyakit</th>
                      <th className="border border-gray-300 p-2" rowSpan={2}>ICD 10</th>
                      <th className="border border-gray-300 p-2" colSpan={ageGroups.length * 2}>Jumlah Kasus Per Kelompok Umur</th>
                      <th className="border border-gray-300 p-2" rowSpan={2}>Total</th>
                    </tr>
                    <tr>
                      {ageGroups.map(ag => (
                        <th key={ag} colSpan={2} className="border border-gray-300 p-1 font-normal whitespace-nowrap">{ag}</th>
                      ))}
                    </tr>
                    <tr className="bg-gray-100 text-[10px]">
                      <th className="border border-gray-300 p-1" colSpan={3}></th>
                      {ageGroups.map(ag => (
                        <Fragment key={`lp-${ag}`}>
                          <th className="border border-gray-300 p-1">L</th>
                          <th className="border border-gray-300 p-1">P</th>
                        </Fragment>
                      ))}
                      <th className="border border-gray-300 p-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.morbidity.length === 0 ? (
                      <tr><td colSpan={24} className="p-4 text-gray-500">Nihil</td></tr>
                    ) : data.morbidity.map((item: any, idx: number) => {
                      let total = 0
                      return (
                        <tr key={item.icdCode}>
                          <td className="border border-gray-300 p-1">{idx + 1}</td>
                          <td className="border border-gray-300 p-1 text-left">{item.icdName}</td>
                          <td className="border border-gray-300 p-1">{item.icdCode}</td>
                          {ageGroups.map(ag => {
                            const valL = item.demografi[ag]?.L || 0
                            const valP = item.demografi[ag]?.P || 0
                            total += (valL + valP)
                            return (
                              <Fragment key={`val-${item.icdCode}-${ag}`}>
                                <td className="border border-gray-300 p-1">{valL || '-'}</td>
                                <td className="border border-gray-300 p-1">{valP || '-'}</td>
                              </Fragment>
                            )
                          })}
                          <td className="border border-gray-300 p-1 font-bold">{total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Bagian D.2 */}
            <section>
              <h3 className="font-bold text-lg mb-3">D.2 Data Kesakitan Terbanyak</h3>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 p-2">No</th>
                    <th className="border border-gray-300 p-2 text-left">Jenis Penyakit</th>
                    <th className="border border-gray-300 p-2">ICD 10</th>
                    <th className="border border-gray-300 p-2 text-center">Kasus Baru</th>
                    <th className="border border-gray-300 p-2 text-center">Kasus Lama</th>
                    <th className="border border-gray-300 p-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDiseases.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nihil</td></tr>
                  ) : data.topDiseases.map((item: any, idx: number) => (
                    <tr key={`top-${item.icdCode}`}>
                      <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-gray-300 p-2">{item.icdName}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.icdCode}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.kasusBaru || '-'}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.kasusLama || '-'}</td>
                      <td className="border border-gray-300 p-2 text-center font-bold">{item.kasusBaru + item.kasusLama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Bagian E */}
            <section>
              <h3 className="font-bold text-lg mb-3">E. Data Pelayanan Kesehatan Klinik</h3>
              
              <h4 className="font-bold text-sm mb-2 mt-4">1. Data Kunjungan Klinik</h4>
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-50 text-center">
                  <tr>
                    <th className="border border-gray-300 p-2 w-10">No</th>
                    <th className="border border-gray-300 p-2 text-left">Kegiatan</th>
                    <th className="border border-gray-300 p-2">Kasus Baru</th>
                    <th className="border border-gray-300 p-2">Kasus Lama</th>
                    <th className="border border-gray-300 p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">1</td>
                    <td className="border border-gray-300 p-2">Jumlah kunjungan pasien ke Klinik</td>
                    <td className="border border-gray-300 p-2 text-center">{data.visits?.baru || 'Nihil'}</td>
                    <td className="border border-gray-300 p-2 text-center">{data.visits?.lama || 'Nihil'}</td>
                    <td className="border border-gray-300 p-2 text-center font-bold">{data.visits?.total || 'Nihil'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-center">2</td>
                    <td className="border border-gray-300 p-2">Jumlah pasien yang dirujuk ke FKRTL/Puskesmas</td>
                    <td colSpan={3} className="border border-gray-300 p-2 text-center font-bold">{data.visits?.rujukan || 'Nihil'}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                <strong>Catatan:</strong> Sub-bagian lainnya (Pelayanan Gigi, Laboratorium, Rawat Inap) akan disesuaikan sesuai penggunaan fitur-fitur tersebut di klinik.
              </div>
            </section>

          </div>
        )}
      </div>

    </div>
  )
}
