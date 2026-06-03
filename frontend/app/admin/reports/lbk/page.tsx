'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import {
  FiPrinter, FiSearch, FiUsers, FiActivity,
  FiAlertTriangle, FiCalendar, FiInfo,
  FiTrendingUp, FiRefreshCw, FiDownload
} from 'react-icons/fi'
import { FaBaby } from 'react-icons/fa'
import { generateLbkPdf, previewLbkPdf } from './generateLbkPdf'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LbkData {
  clinic: {
    name: string
    address: string
    phone: string
    code: string
  }
  summary: {
    totalVisits: number
    newVisits: number
    oldVisits: number
    totalPatients: number
    totalDiseases: number
    totalKasusBaru: number
    totalKasusLama: number
    totalBirths: number
    totalDeaths: number
    totalReferrals: number
  }
  visits: { total: number; baru: number; lama: number; rujukan: number }
  morbidity: MorbidityItem[]
  topDiseases: MorbidityItem[]
  births: BirthItem[]
  deaths: DeathItem[]
}

interface MorbidityItem {
  icdCode: string
  icdName: string
  kasusBaru: number
  kasusLama: number
  demografi: Record<string, { L: number; P: number }>
}

interface BirthItem {
  babyName?: string
  gender?: string
  birthDate: string
  gestationalAge?: number
  weight?: number
  length?: number
  isNormalBirth: boolean
  imd: boolean
  patient?: { name: string; address: string }
}

interface DeathItem {
  name: string
  identityNumber?: string
  address?: string
  gender?: string
  age?: string
  dateOfDeath?: string
  deathPlace?: string
  deathCause?: string
  deathIcd10?: { code: string; nameId?: string; nameEn?: string }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${color}`}>
      <div className="mt-0.5 text-xl">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
        {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Age Groups ───────────────────────────────────────────────────────────────
const ageGroups = ['0-7h', '8-28h', '1-11b', '1-4t', '5-9t', '10-14t', '15-19t', '20-44t', '45-59t', '>59t']

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LbkReportPage() {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [data, setData] = useState<LbkData | null>(null)

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/reports/lbk', { params: { startDate, endDate } })
      setData(res.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat laporan')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchReport() }, [])

  const handlePrint = async () => {
    if (!data) return
    try {
      setPrintLoading(true)
      await previewLbkPdf(data, startDate, endDate)
    } catch (err: any) {
      toast.error('Gagal membuka preview: ' + (err.message || 'Unknown error'))
    } finally {
      setPrintLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!data) return
    try {
      setPdfLoading(true)
      await generateLbkPdf(data, startDate, endDate)
      toast.success('PDF berhasil diunduh!')
    } catch (err: any) {
      toast.error('Gagal membuat PDF: ' + (err.message || 'Unknown error'))
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Format helpers ──
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const fmtDateTime = (d: string) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const periodLabel = startDate && endDate
    ? `${fmtDate(startDate)} s/d ${fmtDate(endDate)}`
    : '-'

  // ── Totals for D1 grand total row ──
  const grandTotalDemografi: Record<string, { L: number; P: number }> = {}
  ageGroups.forEach(ag => { grandTotalDemografi[ag] = { L: 0, P: 0 } })
  let grandTotalCases = 0
  if (data?.morbidity) {
    data.morbidity.forEach(item => {
      ageGroups.forEach(ag => {
        grandTotalDemografi[ag].L += item.demografi[ag]?.L || 0
        grandTotalDemografi[ag].P += item.demografi[ag]?.P || 0
        grandTotalCases += (item.demografi[ag]?.L || 0) + (item.demografi[ag]?.P || 0)
      })
    })
  }

  return (
    <div className="space-y-6 pb-20 print:pb-0">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Bulanan Klinik (LBK)</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan agregasi data kesakitan &amp; kunjungan untuk Dinas Kesehatan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} disabled={loading} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm shadow-sm disabled:opacity-50">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            disabled={!data || printLoading}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            {printLoading
              ? <><FiRefreshCw className="animate-spin" /> Memuat...</>
              : <><FiPrinter /> Cetak</>
            }
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!data || pdfLoading}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {pdfLoading
              ? <><FiRefreshCw className="animate-spin" /> Membuat PDF...</>
              : <><FiDownload /> Download PDF</>
            }
          </button>
        </div>
      </div>

      {/* ── Filter ── */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <FiCalendar className="text-primary" /> Periode Mulai
            </label>
            <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <FiCalendar className="text-primary" /> Periode Selesai
            </label>
            <input type="date" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={fetchReport} disabled={loading} className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
            <FiSearch /> Tampilkan
          </button>
        </div>
      </Card>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
          <FiInfo className="text-4xl" />
          <p>Pilih periode dan klik Tampilkan untuk melihat laporan.</p>
        </div>
      )}

      {/* ── Report Content ── */}
      {!loading && data && (
        <div className="space-y-8">

          {/* ── Summary Cards (screen only) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:hidden">
            <StatCard icon={<FiUsers />} label="Total Kunjungan" value={data.summary.totalVisits}
              sub={`${data.summary.newVisits} baru · ${data.summary.oldVisits} lama`}
              color="bg-blue-50 text-blue-800 border-blue-100" />
            <StatCard icon={<FiActivity />} label="Jenis Penyakit" value={data.summary.totalDiseases}
              sub={`${data.summary.totalKasusBaru} kasus baru`}
              color="bg-violet-50 text-violet-800 border-violet-100" />
            <StatCard icon={<FiTrendingUp />} label="Pasien Unik" value={data.summary.totalPatients}
              color="bg-emerald-50 text-emerald-800 border-emerald-100" />
            <StatCard icon={<FaBaby />} label="Kelahiran" value={data.summary.totalBirths}
              color="bg-pink-50 text-pink-800 border-pink-100" />
            <StatCard icon={<FiAlertTriangle />} label="Dirujuk" value={data.summary.totalReferrals}
              color="bg-amber-50 text-amber-800 border-amber-100" />
          </div>

          {/* ── Print Area ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none">

            {/* ── Print Header ── */}
            <div className="text-center py-6 px-8 border-b border-gray-200">
              <h2 className="text-xl font-extrabold uppercase tracking-wide">Laporan Bulanan Klinik (LBK)</h2>
              <p className="text-sm font-semibold mt-1">{data.clinic.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{data.clinic.address}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Periode: <span className="font-semibold text-gray-600">{periodLabel}</span>
                {data.clinic.code !== '-' && <> &nbsp;|&nbsp; Kode Faskes: <span className="font-semibold">{data.clinic.code}</span></>}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-10">

              {/* ── A. Data Umum ── */}
              <section>
                <SectionTitle letter="A" title="Data Umum" />
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <tbody>
                    <InfoRow no={1} label="Nama Klinik" value={data.clinic.name} />
                    <InfoRow no={2} label="Kode Faskes" value={data.clinic.code} />
                    <InfoRow no={3} label="Alamat Lengkap" value={data.clinic.address} />
                    <InfoRow no={4} label="Nama Pimpinan Klinik" value="Mursid Zaenal" />
                    <InfoRow no={5} label="Telepon/Ponsel Klinik" value="(0251) 8666169" />
                    <InfoRow no={6} label="e-mail Klinik" value="kliniksunat.yasfina@gmail.com" />
                    <InfoRow no={7} label="Periode Laporan" value={periodLabel} />
                  </tbody>
                </table>
              </section>

              {/* ── B. Kelahiran ── */}
              <section>
                <SectionTitle letter="B" title="Data Kelahiran di Klinik" count={data.births.length} />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead className="bg-gray-50 text-center">
                      <tr>
                        {['No','Nama Bayi','L/P','Nama Ibu','Alamat','Tgl & Jam Lahir','Usia Kehamilan','BB(g)/TB(cm)','Normal/Dirujuk','IMD'].map(h => (
                          <th key={h} className="border border-gray-300 p-2 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.births.length === 0
                        ? <tr><td colSpan={10} className="p-4 text-center text-gray-400 italic">Nihil</td></tr>
                        : data.births.map((item, idx) => (
                          <tr key={`birth-${idx}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                            <td className="border border-gray-300 p-2">{item.babyName || <span className="italic text-gray-400">Belum Diberi Nama</span>}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className={`font-bold ${item.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>{item.gender || '-'}</span>
                            </td>
                            <td className="border border-gray-300 p-2">{item.patient?.name || '-'}</td>
                            <td className="border border-gray-300 p-2">{item.patient?.address || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center whitespace-nowrap">{fmtDateTime(item.birthDate)}</td>
                            <td className="border border-gray-300 p-2 text-center">{item.gestationalAge ? `${item.gestationalAge} mgg` : '-'}</td>
                            <td className="border border-gray-300 p-2 text-center">{item.weight ? `${item.weight}g` : '-'} / {item.length ? `${item.length}cm` : '-'}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.isNormalBirth ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.isNormalBirth ? 'Normal' : 'Dirujuk'}
                              </span>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.imd ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                {item.imd ? 'Ya' : 'Tidak'}
                              </span>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── C. Kematian ── */}
              <section>
                <SectionTitle letter="C" title="Data Kematian di Klinik" count={data.deaths.length} />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead className="bg-gray-50 text-center">
                      <tr>
                        {['No','NIK','Nama Pasien','Alamat','Umur','L/P','Tgl Meninggal','Tempat Meninggal','Sebab Dasar','Diagnosa & ICD-10'].map(h => (
                          <th key={h} className="border border-gray-300 p-2 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.deaths.length === 0
                        ? <tr><td colSpan={10} className="p-4 text-center text-gray-400 italic">Nihil</td></tr>
                        : data.deaths.map((item, idx) => (
                          <tr key={`death-${idx}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                            <td className="border border-gray-300 p-2 text-center">{item.identityNumber || '-'}</td>
                            <td className="border border-gray-300 p-2 font-medium">{item.name || '-'}</td>
                            <td className="border border-gray-300 p-2">{item.address || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center">{item.age || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className={`font-bold ${item.gender === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>{item.gender || '-'}</span>
                            </td>
                            <td className="border border-gray-300 p-2 text-center whitespace-nowrap">
                              {item.dateOfDeath ? fmtDate(item.dateOfDeath) : '-'}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">{item.deathPlace || '-'}</td>
                            <td className="border border-gray-300 p-2">{item.deathCause || '-'}</td>
                            <td className="border border-gray-300 p-2">
                              {item.deathIcd10
                                ? <><span className="font-bold text-primary">{item.deathIcd10.code}</span> – {item.deathIcd10.nameId || item.deathIcd10.nameEn}</>
                                : '-'}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ── D.1 Data Kesakitan ── */}
              <section>
                <SectionTitle letter="D.1" title="Data Kesakitan Per Kelompok Umur" count={data.morbidity.length} />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-gray-300 text-center">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 p-2" rowSpan={3}>No</th>
                        <th className="border border-gray-300 p-2 text-left" rowSpan={3}>Jenis Penyakit</th>
                        <th className="border border-gray-300 p-2" rowSpan={3}>ICD-10</th>
                        <th className="border border-gray-300 p-2" colSpan={ageGroups.length * 2}>Jumlah Kasus Per Kelompok Umur</th>
                        <th className="border border-gray-300 p-2" rowSpan={3}>Baru</th>
                        <th className="border border-gray-300 p-2" rowSpan={3}>Lama</th>
                        <th className="border border-gray-300 p-2" rowSpan={3}>Total</th>
                      </tr>
                      <tr>
                        {ageGroups.map(ag => (
                          <th key={ag} colSpan={2} className="border border-gray-300 p-1 font-normal whitespace-nowrap">{ag}</th>
                        ))}
                      </tr>
                      <tr className="bg-gray-100 text-[10px]">
                        {ageGroups.map(ag => (
                          <Fragment key={`lp-${ag}`}>
                            <th className="border border-gray-300 p-1 text-blue-600">L</th>
                            <th className="border border-gray-300 p-1 text-pink-600">P</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.morbidity.length === 0
                        ? <tr><td colSpan={3 + ageGroups.length * 2 + 3} className="p-4 text-gray-400 italic">Nihil</td></tr>
                        : data.morbidity.map((item, idx) => {
                          let rowTotal = 0
                          return (
                            <tr key={item.icdCode} className="hover:bg-blue-50/30">
                              <td className="border border-gray-300 p-1">{idx + 1}</td>
                              <td className="border border-gray-300 p-1 text-left">{item.icdName}</td>
                              <td className="border border-gray-300 p-1 font-mono text-primary">{item.icdCode}</td>
                              {ageGroups.map(ag => {
                                const valL = item.demografi[ag]?.L || 0
                                const valP = item.demografi[ag]?.P || 0
                                rowTotal += valL + valP
                                return (
                                  <Fragment key={`val-${item.icdCode}-${ag}`}>
                                    <td className="border border-gray-300 p-1 text-blue-700">{valL || '-'}</td>
                                    <td className="border border-gray-300 p-1 text-pink-700">{valP || '-'}</td>
                                  </Fragment>
                                )
                              })}
                              <td className="border border-gray-300 p-1 font-semibold text-emerald-700">{item.kasusBaru || '-'}</td>
                              <td className="border border-gray-300 p-1 font-semibold text-amber-700">{item.kasusLama || '-'}</td>
                              <td className="border border-gray-300 p-1 font-bold">{rowTotal}</td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                    {data.morbidity.length > 0 && (
                      <tfoot className="bg-gray-100 font-bold text-[11px]">
                        <tr>
                          <td colSpan={3} className="border border-gray-300 p-2 text-left">TOTAL</td>
                          {ageGroups.map(ag => (
                            <Fragment key={`gt-${ag}`}>
                              <td className="border border-gray-300 p-1 text-blue-700">{grandTotalDemografi[ag].L || '-'}</td>
                              <td className="border border-gray-300 p-1 text-pink-700">{grandTotalDemografi[ag].P || '-'}</td>
                            </Fragment>
                          ))}
                          <td className="border border-gray-300 p-1">{data.summary.totalKasusBaru}</td>
                          <td className="border border-gray-300 p-1">{data.summary.totalKasusLama}</td>
                          <td className="border border-gray-300 p-1">{grandTotalCases}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>

              {/* ── D.2 Top 10 Penyakit ── */}
              <section>
                <SectionTitle letter="D.2" title="10 Penyakit Terbanyak" />
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-2 w-10 text-center">No</th>
                      <th className="border border-gray-300 p-2 text-left">Jenis Penyakit</th>
                      <th className="border border-gray-300 p-2 text-center">ICD-10</th>
                      <th className="border border-gray-300 p-2 text-center">
                        <span className="text-emerald-700">Kasus Baru</span>
                      </th>
                      <th className="border border-gray-300 p-2 text-center">
                        <span className="text-amber-700">Kasus Lama</span>
                      </th>
                      <th className="border border-gray-300 p-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topDiseases.length === 0
                      ? <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">Nihil</td></tr>
                      : data.topDiseases.map((item, idx) => {
                        const total = item.kasusBaru + item.kasusLama
                        const maxTotal = (data.topDiseases[0].kasusBaru + data.topDiseases[0].kasusLama) || 1
                        const pct = Math.round((total / maxTotal) * 100)
                        return (
                          <tr key={`top-${item.icdCode}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="border border-gray-300 p-2">
                              <div>{item.icdName}</div>
                              <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center font-mono text-primary font-semibold">{item.icdCode}</td>
                            <td className="border border-gray-300 p-2 text-center font-semibold text-emerald-700">{item.kasusBaru || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center font-semibold text-amber-700">{item.kasusLama || '-'}</td>
                            <td className="border border-gray-300 p-2 text-center font-extrabold">{total}</td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </section>

              {/* ── E. Data Pelayanan ── */}
              <section>
                <SectionTitle letter="E" title="Data Pelayanan Kesehatan Klinik" />

                <h4 className="font-bold text-sm mb-2 mt-4 text-gray-700">E.1 Data Kunjungan Klinik</h4>
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
                      <td className="border border-gray-300 p-2 text-center font-semibold text-emerald-700">
                        {data.visits.baru > 0 ? data.visits.baru : <span className="text-gray-400">Nihil</span>}
                      </td>
                      <td className="border border-gray-300 p-2 text-center font-semibold text-amber-700">
                        {data.visits.lama > 0 ? data.visits.lama : <span className="text-gray-400">Nihil</span>}
                      </td>
                      <td className="border border-gray-300 p-2 text-center font-extrabold">
                        {data.visits.total > 0 ? data.visits.total : <span className="text-gray-400">Nihil</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">2</td>
                      <td className="border border-gray-300 p-2">Jumlah pasien yang dirujuk ke FKRTL/Puskesmas</td>
                      <td colSpan={3} className="border border-gray-300 p-2 text-center font-extrabold">
                        {data.visits.rujukan > 0 ? data.visits.rujukan : <span className="text-gray-400 font-normal">Nihil</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex gap-2">
                  <FiInfo className="flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Catatan:</strong> Kasus Baru = pasien pertama kali berkunjung ke klinik ini dalam periode laporan.
                    Kasus Lama = pasien yang sudah pernah berkunjung sebelum periode laporan.
                    Rujukan hanya menghitung yang sudah berstatus terkirim/selesai.
                  </div>
                </div>

                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2">
                  <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
                  <span>Sub-bagian lainnya (Pelayanan Gigi, Laboratorium, Rawat Inap) akan disesuaikan sesuai penggunaan fitur-fitur tersebut di klinik.</span>
                </div>
              </section>

              {/* ── Footer ── */}
              <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 flex justify-between">
                <span>Dicetak: {new Date().toLocaleString('id-ID')}</span>
                <span>LBK – {data.clinic.name}</span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function SectionTitle({ letter, title, count }: { letter: string; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-extrabold">
        {letter}
      </span>
      <h3 className="font-bold text-base text-gray-800">{title}</h3>
      {count !== undefined && (
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${count === 0 ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'}`}>
          {count === 0 ? 'Nihil' : `${count} data`}
        </span>
      )}
    </div>
  )
}

function InfoRow({ no, label, value }: { no: number; label: string; value: string }) {
  return (
    <tr>
      <td className="border border-gray-300 p-2 w-10 text-center text-gray-500">{no}</td>
      <td className="border border-gray-300 p-2 w-56 text-gray-600">{label}</td>
      <td className="border border-gray-300 p-2 font-semibold">{value || '-'}</td>
    </tr>
  )
}
