import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PatientInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  total: number;
  corporateCoverageAmount: number;
  patient?: {
    name: string;
    medicalRecordNo: string;
  };
}

export const printCorporateInvoice = async (invoice: any, bankInfo?: any) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Colors
  const primaryColor = '#059669'; // emerald-600
  const textColor = '#1f2937'; // gray-800
  const lightGray = '#9ca3af'; // gray-400

  // 1. Header Section
  doc.setFillColor('#ffffff'); // White background
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Load and add Logo
  try {
    const img = new Image();
    img.src = '/logo-yasfina.png';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    // Assuming aspect ratio is square or rectangle, size it reasonably (increased by 30%)
    doc.addImage(img, 'PNG', 14, 8, 21, 21); 
  } catch (e) {
    console.error('Failed to load logo', e);
  }

  // Clinic Name (Larger) next to Logo
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KLINIK YASFINA', 39, 16);
  doc.setFontSize(8);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Jl. Kesehatan No. 123, Jakarta Selatan', 39, 21);
  doc.text('Telp: (021) 1234567 | Email: finance@yasfina.com', 39, 26);

  // Document Title
  doc.setTextColor(primaryColor);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 24, { align: 'right' });

  // Draw a subtle line to separate header
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(14, 38, pageWidth - 14, 38);

  // 2. Invoice Details (Left: Bill To, Right: Inv Info)
  doc.setTextColor(textColor);
  
  // Bill To (Perusahaan)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tagihan Kepada:', 14, 55);
  doc.setFontSize(11);
  doc.text(invoice.partner?.name || 'Perusahaan', 14, 61);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (invoice.partner?.address) doc.text(invoice.partner.address, 14, 66);
  if (invoice.partner?.phone) doc.text(`Telp: ${invoice.partner.phone}`, 14, 71);
  if (invoice.partner?.contactPerson) doc.text(`UP: ${invoice.partner.contactPerson}`, 14, 76);

  // Invoice Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('No. Invoice:', pageWidth - 60, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNo, pageWidth - 35, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal:', pageWidth - 60, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.invoiceDate), 'dd MMMM yyyy', { locale: id }), pageWidth - 35, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('Jatuh Tempo:', pageWidth - 60, 67);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: id }), pageWidth - 35, 67);

  // 3. Table of Patients
  const tableData = invoice.patientInvoices.map((inv: PatientInvoice, index: number) => [
    index + 1,
    inv.patient?.medicalRecordNo || '-',
    inv.patient?.name || '-',
    format(new Date(inv.invoiceDate), 'dd/MM/yyyy'),
    inv.invoiceNo,
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.corporateCoverageAmount)
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['No', 'No. RM', 'Nama Pasien', 'Tgl Berobat', 'No. Ref', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: '#ffffff', fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      5: { halign: 'right' }
    }
  });

  // 4. Totals (Subtotal, Discount, Tax, Total)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // Draw a summary box
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 80, finalY - 5, 66, 32);

  doc.text('Subtotal', pageWidth - 75, finalY);
  doc.text(formatIDR(invoice.subtotal), pageWidth - 18, finalY, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Diskon', pageWidth - 75, finalY + 6);
    doc.text(`- ${formatIDR(invoice.discount)}`, pageWidth - 18, finalY + 6, { align: 'right' });
  }

  if (invoice.tax > 0) {
    doc.text('Pajak (PPN)', pageWidth - 75, finalY + 12);
    doc.text(formatIDR(invoice.tax), pageWidth - 18, finalY + 12, { align: 'right' });
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(primaryColor);
  doc.rect(pageWidth - 80, finalY + 17, 66, 10, 'F');
  doc.setTextColor('#ffffff');
  doc.text('TOTAL', pageWidth - 75, finalY + 23.5);
  doc.text(formatIDR(invoice.total), pageWidth - 18, finalY + 23.5, { align: 'right' });

  // 5. Payment Notes & Signature
  if ((doc as any).lastAutoTable) {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Payment Instructions
    if (invoice.status === 'paid') {
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('LUNAS / PAID', 14, finalY + 10);
    } else {
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor);
      doc.text('Instruksi Pembayaran:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Mohon melakukan pembayaran via transfer ke rekening berikut:', 14, finalY + 5);
      doc.setFont('helvetica', 'bold');
      if (bankInfo) {
        doc.text(`${bankInfo.bankName} - ${bankInfo.accountNumber} a.n ${bankInfo.accountName}`, 14, finalY + 10);
      } else {
        doc.text('Bank BCA - 123 456 7890 a.n Klinik Yasfina', 14, finalY + 10);
      }
      doc.setFont('helvetica', 'normal');
      doc.text('Harap cantumkan No. Invoice pada berita transfer.', 14, finalY + 15);
    }

    // Signature
    const signatureY = finalY + 40;
    doc.setFont('helvetica', 'normal');
    doc.text('Hormat Kami,', pageWidth - 45, signatureY, { align: 'center' });
    doc.text('Finance Department', pageWidth - 45, signatureY + 35, { align: 'center' });
    doc.line(pageWidth - 75, signatureY + 30, pageWidth - 15, signatureY + 30);
  }

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(lightGray);
  doc.text('Invoice ini dicetak secara otomatis dan sah tanpa tanda tangan basah jika pembayaran telah diterima.', pageWidth / 2, 285, { align: 'center' });

  // Open in new tab for preview
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
