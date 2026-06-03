import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Types (mirror from page.tsx) ─────────────────────────────────────────────

interface LbkData {
  clinic: { name: string; address: string; phone: string; code: string }
  summary: {
    totalVisits: number; newVisits: number; oldVisits: number
    totalPatients: number; totalDiseases: number
    totalKasusBaru: number; totalKasusLama: number
    totalBirths: number; totalDeaths: number; totalReferrals: number
  }
  visits: { total: number; baru: number; lama: number; rujukan: number }
  morbidity: MorbidityItem[]
  topDiseases: MorbidityItem[]
  births: BirthItem[]
  deaths: DeathItem[]
}

interface MorbidityItem {
  icdCode: string; icdName: string; kasusBaru: number; kasusLama: number
  demografi: Record<string, { L: number; P: number }>
}

interface BirthItem {
  babyName?: string; gender?: string; birthDate: string
  gestationalAge?: number; weight?: number; length?: number
  isNormalBirth: boolean; imd: boolean
  patient?: { name: string; address: string }
}

interface DeathItem {
  name: string; identityNumber?: string; address?: string; gender?: string
  age?: string; dateOfDeath?: string; deathPlace?: string; deathCause?: string
  deathIcd10?: { code: string; nameId?: string; nameEn?: string }
}

// ─── Color Palette ─────────────────────────────────────────────────────────────
const C = {
  primary:    [37, 99, 235]   as [number,number,number], // blue-600
  primaryBg:  [239, 246, 255] as [number,number,number], // blue-50
  headerBg:   [30, 41, 59]    as [number,number,number], // slate-800
  headerText: [255, 255, 255] as [number,number,number],
  subHead:    [241, 245, 249] as [number,number,number], // slate-100
  subText:    [51, 65, 85]    as [number,number,number],  // slate-700
  green:      [22, 163, 74]   as [number,number,number],  // green-600
  greenBg:    [240, 253, 244] as [number,number,number],
  amber:      [180, 83, 9]    as [number,number,number],   // amber-700
  amberBg:    [255, 251, 235] as [number,number,number],
  blue:       [37, 99, 235]   as [number,number,number],
  pink:       [219, 39, 119]  as [number,number,number],
  red:        [220, 38, 38]   as [number,number,number],
  gray:       [107, 114, 128] as [number,number,number],
  lightGray:  [249, 250, 251] as [number,number,number],
  border:     [209, 213, 219] as [number,number,number],
  text:       [17, 24, 39]    as [number,number,number],
  muted:      [107, 114, 128] as [number,number,number],
}

const AGE_GROUPS = ['0-7h','8-28h','1-11b','1-4t','5-9t','10-14t','15-19t','20-44t','45-59t','>59t']

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'

const fmtDateTime = (d: string) =>
  d ? new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '-'

const nihil = (v: number | string | undefined) =>
  (!v || v === 0 || v === '0') ? '-' : String(v)

// ─── Section Header ────────────────────────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, y: number, letter: string, title: string, count?: number): number {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  // Colored badge
  doc.setFillColor(...C.primary)
  doc.roundedRect(margin, y, 9, 7, 1, 1, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.headerText)
  doc.text(letter, margin + 4.5, y + 5, { align: 'center' })

  // Title
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.text)
  doc.text(title, margin + 12, y + 5.5)

  // Count badge
  if (count !== undefined) {
    const badge = count === 0 ? 'Nihil' : `${count} data`
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(badge, pageW - margin, y + 5.5, { align: 'right' })
  }

  // Underline
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(margin, y + 8.5, pageW - margin, y + 8.5)

  return y + 13
}

// ─── Summary Cards ─────────────────────────────────────────────────────────────

function drawSummaryCards(doc: jsPDF, y: number, data: LbkData): number {
  const margin = 14
  const pageW = doc.internal.pageSize.getWidth()
  const usableW = pageW - margin * 2
  const cards = [
    { label: 'Total Kunjungan', value: data.summary.totalVisits, sub: `${data.summary.newVisits} baru · ${data.summary.oldVisits} lama`, bg: C.primaryBg, accent: C.primary },
    { label: 'Jenis Penyakit',  value: data.summary.totalDiseases,  sub: `${data.summary.totalKasusBaru} kasus baru`, bg: [245, 243, 255] as [number,number,number], accent: [109, 40, 217] as [number,number,number] },
    { label: 'Pasien Unik',     value: data.summary.totalPatients,   sub: 'periode ini', bg: C.greenBg, accent: C.green },
    { label: 'Kelahiran',       value: data.summary.totalBirths,     sub: 'tercatat', bg: [255, 241, 242] as [number,number,number], accent: C.pink },
    { label: 'Dirujuk',         value: data.summary.totalReferrals,  sub: 'terkirim/selesai', bg: C.amberBg, accent: C.amber },
  ]
  const cardW = (usableW - 4 * 3) / 5
  const cardH = 20

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 3)
    doc.setFillColor(...card.bg)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F')
    doc.setDrawColor(...card.accent)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'S')

    // Left accent bar
    doc.setFillColor(...card.accent)
    doc.roundedRect(x, y, 2.5, cardH, 1, 1, 'F')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...card.accent)
    doc.text(String(card.value), x + cardW / 2 + 1, y + 10, { align: 'center' })

    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.subText)
    doc.text(card.label.toUpperCase(), x + cardW / 2 + 1, y + 15.5, { align: 'center' })

    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(card.sub, x + cardW / 2 + 1, y + 18.5, { align: 'center' })
  })

  return y + cardH + 8
}

// ─── Document Header ───────────────────────────────────────────────────────────

function drawDocHeader(doc: jsPDF, data: LbkData, startDate: string, endDate: string): number {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  // Header bar
  doc.setFillColor(...C.headerBg)
  doc.rect(0, 0, pageW, 30, 'F')

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.headerText)
  doc.text('LAPORAN BULANAN KLINIK (LBK)', pageW / 2, 11, { align: 'center' })

  // Clinic name
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.clinic.name, pageW / 2, 18, { align: 'center' })

  // Period & code
  const periodStr = startDate && endDate
    ? `Periode: ${fmtDate(startDate)} s/d ${fmtDate(endDate)}`
    : 'Periode: -'
  const codeStr = data.clinic.code !== '-' ? `  |  Kode Faskes: ${data.clinic.code}` : ''
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text(periodStr + codeStr, pageW / 2, 25, { align: 'center' })

  // Print timestamp (right side)
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, pageW - margin, 27, { align: 'right' })

  return 36
}

// ─── Section A ─────────────────────────────────────────────────────────────────

function drawSectionA(doc: jsPDF, y: number, data: LbkData, startDate: string, endDate: string): number {
  y = drawSectionHeader(doc, y, 'A', 'Data Umum')

  const periodLabel = startDate && endDate ? `${fmtDate(startDate)} s/d ${fmtDate(endDate)}` : '-'

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 14 },
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, lineColor: C.border, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: C.muted, fillColor: C.lightGray },
      1: { cellWidth: 60, textColor: C.subText, fillColor: C.lightGray },
      2: { fontStyle: 'bold', textColor: C.text },
    },
    body: [
      ['1', 'Nama Klinik', data.clinic.name],
      ['2', 'Kode Faskes', data.clinic.code !== '-' ? data.clinic.code : '-'],
      ['3', 'Alamat Lengkap', data.clinic.address],
      ['4', 'Nama Pimpinan Klinik', 'Mursid Zaenal'],
      ['5', 'Telepon/Ponsel Klinik', '(0251) 8666169'],
      ['6', 'e-mail Klinik', 'kliniksunat.yasfina@gmail.com'],
      ['7', 'Periode Laporan', periodLabel],
    ],
  })
  return (doc as any).lastAutoTable.finalY + 6
}

// ─── Section B ─────────────────────────────────────────────────────────────────

function drawSectionB(doc: jsPDF, y: number, data: LbkData): number {
  y = drawSectionHeader(doc, y, 'B', 'Data Kelahiran di Klinik', data.births.length)

  const body = data.births.length === 0
    ? [['', 'Nihil', '', '', '', '', '', '', '', '']]
    : data.births.map((b, i) => [
        String(i + 1),
        b.babyName || 'Belum Diberi Nama',
        b.gender || '-',
        b.patient?.name || '-',
        b.patient?.address || '-',
        fmtDateTime(b.birthDate),
        b.gestationalAge ? `${b.gestationalAge} mgg` : '-',
        `${b.weight ? b.weight + 'g' : '-'} / ${b.length ? b.length + 'cm' : '-'}`,
        b.isNormalBirth ? 'Normal' : 'Dirujuk',
        b.imd ? 'Ya' : 'Tidak',
      ])

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 14 },
    head: [['No','Nama Bayi','L/P','Nama Ibu','Alamat','Tgl & Jam Lahir','Usia Kehamilan','BB/TB','Normal/Dirujuk','IMD']],
    body,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 }, textColor: C.text, lineColor: C.border, lineWidth: 0.3 },
    headStyles: { fillColor: C.headerBg, textColor: C.headerText, fontStyle: 'bold', fontSize: 7, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      2: { halign: 'center', cellWidth: 10 },
      5: { halign: 'center', cellWidth: 28 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 12 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const colIdx = hookData.column.index
        const val = hookData.cell.raw as string
        // L/P color
        if (colIdx === 2) {
          hookData.cell.styles.textColor = val === 'L' ? C.blue : C.pink
          hookData.cell.styles.fontStyle = 'bold'
        }
        // Normal/Dirujuk
        if (colIdx === 8) {
          hookData.cell.styles.textColor = val === 'Normal' ? C.green : C.red
          hookData.cell.styles.fontStyle = 'bold'
          hookData.cell.styles.halign = 'center'
        }
        // IMD
        if (colIdx === 9) {
          hookData.cell.styles.textColor = val === 'Ya' ? C.blue : C.gray
          hookData.cell.styles.halign = 'center'
        }
      }
    },
  })
  return (doc as any).lastAutoTable.finalY + 6
}

// ─── Section C ─────────────────────────────────────────────────────────────────

function drawSectionC(doc: jsPDF, y: number, data: LbkData): number {
  y = drawSectionHeader(doc, y, 'C', 'Data Kematian di Klinik', data.deaths.length)

  const body = data.deaths.length === 0
    ? [['', '', 'Nihil', '', '', '', '', '', '', '']]
    : data.deaths.map((d, i) => [
        String(i + 1),
        d.identityNumber || '-',
        d.name,
        d.address || '-',
        d.age || '-',
        d.gender || '-',
        d.dateOfDeath ? fmtDate(d.dateOfDeath) : '-',
        d.deathPlace || '-',
        d.deathCause || '-',
        d.deathIcd10 ? `${d.deathIcd10.code} – ${d.deathIcd10.nameId || d.deathIcd10.nameEn || ''}` : '-',
      ])

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 14 },
    head: [['No','NIK','Nama Pasien','Alamat','Umur','L/P','Tgl Meninggal','Tempat Meninggal','Sebab Dasar','Diagnosa & ICD-10']],
    body,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 }, textColor: C.text, lineColor: C.border, lineWidth: 0.3 },
    headStyles: { fillColor: C.headerBg, textColor: C.headerText, fontStyle: 'bold', fontSize: 7, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 10 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 24 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        const val = hookData.cell.raw as string
        hookData.cell.styles.textColor = val === 'L' ? C.blue : C.pink
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.halign = 'center'
      }
    },
  })
  return (doc as any).lastAutoTable.finalY + 6
}

// ─── Section D.1 ───────────────────────────────────────────────────────────────

function drawSectionD1(doc: jsPDF, y: number, data: LbkData): number {
  y = drawSectionHeader(doc, y, 'D.1', 'Data Kesakitan Per Kelompok Umur', data.morbidity.length)

  // Build grand totals
  const grandDem: Record<string, { L: number; P: number }> = {}
  AGE_GROUPS.forEach(ag => { grandDem[ag] = { L: 0, P: 0 } })
  let grandTotal = 0; let grandBaru = 0; let grandLama = 0

  const body = data.morbidity.map((item, idx) => {
    let rowTotal = 0
    const demCells: string[] = []
    AGE_GROUPS.forEach(ag => {
      const L = item.demografi[ag]?.L || 0
      const P = item.demografi[ag]?.P || 0
      grandDem[ag].L += L; grandDem[ag].P += P
      rowTotal += L + P
      demCells.push(L > 0 ? String(L) : '-', P > 0 ? String(P) : '-')
    })
    grandTotal += rowTotal
    grandBaru += item.kasusBaru
    grandLama += item.kasusLama
    return [String(idx + 1), item.icdName, item.icdCode, ...demCells,
      item.kasusBaru > 0 ? String(item.kasusBaru) : '-',
      item.kasusLama > 0 ? String(item.kasusLama) : '-',
      String(rowTotal)]
  })

  // Grand total row
  const grandDemCells: string[] = []
  AGE_GROUPS.forEach(ag => {
    grandDemCells.push(grandDem[ag].L > 0 ? String(grandDem[ag].L) : '-', grandDem[ag].P > 0 ? String(grandDem[ag].P) : '-')
  })
  body.push(['', 'TOTAL', '', ...grandDemCells, String(grandBaru), String(grandLama), String(grandTotal)])

  // Build head — two-row header using manual approach
  const ageHead1: any[] = [
    { content: 'No', rowSpan: 2, styles: { halign: 'center' } },
    { content: 'Jenis Penyakit', rowSpan: 2 },
    { content: 'ICD-10', rowSpan: 2, styles: { halign: 'center' } },
    ...AGE_GROUPS.map(ag => ({ content: ag, colSpan: 2, styles: { halign: 'center' } })),
    { content: 'Baru', rowSpan: 2, styles: { halign: 'center' } },
    { content: 'Lama', rowSpan: 2, styles: { halign: 'center' } },
    { content: 'Total', rowSpan: 2, styles: { halign: 'center' } },
  ]
  const ageHead2: any[] = AGE_GROUPS.flatMap(() => [
    { content: 'L', styles: { halign: 'center', textColor: [100, 160, 255] as [number,number,number] } },
    { content: 'P', styles: { halign: 'center', textColor: [255, 130, 180] as [number,number,number] } },
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 14 },
    head: [ageHead1, ageHead2],
    body,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }, textColor: C.text, lineColor: C.border, lineWidth: 0.25, halign: 'center' },
    headStyles: { fillColor: C.headerBg, textColor: C.headerText, fontStyle: 'bold', fontSize: 6 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 46 },
      2: { halign: 'center', cellWidth: 14 },
      [3 + AGE_GROUPS.length * 2]:     { fontStyle: 'bold', textColor: C.green, halign: 'center' },
      [3 + AGE_GROUPS.length * 2 + 1]: { fontStyle: 'bold', textColor: C.amber, halign: 'center' },
      [3 + AGE_GROUPS.length * 2 + 2]: { fontStyle: 'bold', halign: 'center' },
    },
    didParseCell: (hookData) => {
      const row = hookData.row.index
      const lastRow = data.morbidity.length
      // Grand total row styling
      if (hookData.section === 'body' && row === lastRow) {
        hookData.cell.styles.fillColor = C.subHead
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.textColor = C.subText
      }
      // L cols (even index from col 3)
      const col = hookData.column.index
      if (hookData.section === 'body' && row < lastRow && col >= 3 && col < 3 + AGE_GROUPS.length * 2) {
        if ((col - 3) % 2 === 0) hookData.cell.styles.textColor = C.blue
        else hookData.cell.styles.textColor = C.pink
      }
    },
  })
  return (doc as any).lastAutoTable.finalY + 6
}

// ─── Section D.2 ───────────────────────────────────────────────────────────────

function drawSectionD2(doc: jsPDF, y: number, data: LbkData): number {
  y = drawSectionHeader(doc, y, 'D.2', '10 Penyakit Terbanyak')

  const body = data.topDiseases.length === 0
    ? [['', 'Nihil', '', '', '', '']]
    : data.topDiseases.map((item, idx) => [
        String(idx + 1),
        item.icdName,
        item.icdCode,
        item.kasusBaru > 0 ? String(item.kasusBaru) : '-',
        item.kasusLama > 0 ? String(item.kasusLama) : '-',
        String(item.kasusBaru + item.kasusLama),
      ])

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14, bottom: 14 },
    head: [['No', 'Jenis Penyakit', 'ICD-10', 'Kasus Baru', 'Kasus Lama', 'Total']],
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: C.text, lineColor: C.border, lineWidth: 0.3 },
    headStyles: { fillColor: C.headerBg, textColor: C.headerText, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontSize: 7 },
      2: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: C.primary },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 28 },
      5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.column.index === 3) hookData.cell.styles.textColor = C.green
        if (hookData.column.index === 4) hookData.cell.styles.textColor = C.amber
        if (hookData.column.index === 5) hookData.cell.styles.fontStyle = 'bold'
        // Alternating rows
        if (hookData.row.index % 2 === 0) hookData.cell.styles.fillColor = C.lightGray
      }
      if (hookData.section === 'head') {
        if (hookData.column.index === 3) hookData.cell.styles.textColor = [134, 239, 172] as [number,number,number]
        if (hookData.column.index === 4) hookData.cell.styles.textColor = [252, 211, 77] as [number,number,number]
      }
    },
  })
  return (doc as any).lastAutoTable.finalY + 6
}

// ─── Section E ─────────────────────────────────────────────────────────────────

function drawSectionE(doc: jsPDF, y: number, data: LbkData): number {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  // Footer takes 10mm — usable bottom boundary
  const bottomBoundary = pageH - 12

  y = drawSectionHeader(doc, y, 'E', 'Data Pelayanan Kesehatan Klinik')

  // Subtitle
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.subText)
  doc.text('E.1  Data Kunjungan Klinik', margin, y)
  y += 5

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 14 }, // ← reserve space for footer
    head: [['No', 'Kegiatan', 'Kasus Baru', 'Kasus Lama', 'Total']],
    body: [
      ['1', 'Jumlah kunjungan pasien ke Klinik',
        data.visits.baru > 0 ? String(data.visits.baru) : 'Nihil',
        data.visits.lama > 0 ? String(data.visits.lama) : 'Nihil',
        data.visits.total > 0 ? String(data.visits.total) : 'Nihil'],
      ['2', 'Jumlah pasien yang dirujuk ke FKRTL/Puskesmas', '', '',
        data.visits.rujukan > 0 ? String(data.visits.rujukan) : 'Nihil'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: C.text, lineColor: C.border, lineWidth: 0.3 },
    headStyles: { fillColor: C.headerBg, textColor: C.headerText, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14, fontSize: 7 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.column.index === 2) hookData.cell.styles.textColor = C.green
        if (hookData.column.index === 3) hookData.cell.styles.textColor = C.amber
      }
    },
  })

  // Note box height = 18mm. If it won't fit above footer, move to new page.
  const NOTE_H = 18
  let noteY = (doc as any).lastAutoTable.finalY + 5
  if (noteY + NOTE_H > bottomBoundary) {
    doc.addPage()
    noteY = 14
  }

  // Info note box
  doc.setFillColor(...C.primaryBg)
  doc.setDrawColor(...C.primary)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, noteY, pageW - margin * 2, NOTE_H, 2, 2, 'FD')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Catatan Metodologi:', margin + 4, noteY + 5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.subText)
  doc.text('Kasus Baru = pasien pertama kali berkunjung ke klinik ini dalam periode laporan.', margin + 4, noteY + 9.5)
  doc.text(
    'Kasus Lama = pasien yang sudah pernah berkunjung sebelum periode laporan. Rujukan hanya menghitung status terkirim/selesai.',
    margin + 4, noteY + 14
  )

  return noteY + NOTE_H + 4
}


// ─── Page Number Footer ─────────────────────────────────────────────────────────

function addPageNumbers(doc: jsPDF, clinicName: string) {
  const total = (doc.internal as any).getNumberOfPages()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageH - 10, pageW, 10, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 10, pageW - 14, pageH - 10)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.muted)
    doc.text(`LBK – ${clinicName}`, 14, pageH - 4)
    doc.text(`Halaman ${i} dari ${total}`, pageW - 14, pageH - 4, { align: 'right' })
  }
}

// ─── Shared Build Function ─────────────────────────────────────────────────────

function buildLbkDoc(data: LbkData, startDate: string, endDate: string): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  let y = drawDocHeader(doc, data, startDate, endDate)
  y = drawSummaryCards(doc, y, data)

  // Section A
  y = drawSectionA(doc, y, data, startDate, endDate)

  // Section B
  if (y > 160) { doc.addPage(); y = 14 }
  y = drawSectionB(doc, y, data)

  // Section C → lanjut di halaman yang sama jika masih muat
  if (y > 160) { doc.addPage(); y = 14 }
  y = drawSectionC(doc, y, data)

  // Section D.1 — hanya pindah halaman kalau sisa < 62mm
  const pageH = doc.internal.pageSize.getHeight()
  if (y > pageH - 62) { doc.addPage(); y = 14 }
  y = drawSectionD1(doc, y, data)

  // Section D.2
  if (y > pageH - 62) { doc.addPage(); y = 14 }
  y = drawSectionD2(doc, y, data)

  // Section E
  if (y > pageH - 62) { doc.addPage(); y = 14 }
  drawSectionE(doc, y, data)

  // Page number footer
  addPageNumbers(doc, data.clinic.name)

  return doc
}

// ─── Download PDF ──────────────────────────────────────────────────────────────

export async function generateLbkPdf(data: LbkData, startDate: string, endDate: string): Promise<void> {
  const doc = buildLbkDoc(data, startDate, endDate)

  const periodStr = startDate && endDate
    ? `${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}`
    : new Date().toISOString().split('T')[0].replace(/-/g, '')
  const filename = `LBK_${data.clinic.name.replace(/\s+/g, '_')}_${periodStr}.pdf`
  doc.save(filename)
}

// ─── Print Preview (buka di tab baru, sama persis dengan hasil download) ──────

export async function previewLbkPdf(data: LbkData, startDate: string, endDate: string): Promise<void> {
  const doc = buildLbkDoc(data, startDate, endDate)

  // Generate blob URL dan buka di tab baru agar user bisa cetak dari PDF viewer
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)

  const win = window.open(url, '_blank')
  if (!win) {
    // Fallback jika popup diblokir browser — langsung print
    doc.autoPrint()
    doc.output('dataurlnewwindow')
  }

  // Revoke URL setelah 60 detik agar memory tidak bocor
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
