const fs = require('fs');
const file = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `      setTimeout(() => {
        window.print()
        setTimeout(() => setIsPrinting(false), 1000)
      }, 500)`;

const replace1 = `      setTimeout(() => {
        generatePDF(queue.patient.name)
      }, 500)`;

const target2 = `  const handleReprintReferral = (referral: any) => {
    setCurrentPrintReferral(referral)
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => setIsPrinting(false), 1000)
    }, 500)
  }`;

const replace2 = `  const generatePDF = async (patientName: string) => {
    const printElement = document.getElementById('print-referral-template')
    if (!printElement) {
      setIsPrinting(false)
      return
    }
    
    try {
      const toastId = toast.loading('Memproses PDF...')
      // Capture the element
      const canvas = await html2canvas(printElement, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // A4 size: 210 x 297 mm
      const pdfWidth = 210
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      
      const dateStr = new Date().toISOString().split('T')[0]
      pdf.save(\`Surat_Rujukan_\${patientName.replace(/\\s+/g, '_')}_\${dateStr}.pdf\`)
      toast.success('PDF berhasil diunduh', { id: toastId })
      
    } catch (e) {
      console.error('Error generating PDF:', e)
      toast.error('Gagal menghasilkan file PDF')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleReprintReferral = (referral: any) => {
    setCurrentPrintReferral(referral)
    setIsPrinting(true)
    setTimeout(() => {
      generatePDF(queue?.patient?.name || 'Pasien')
    }, 500)
  }`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);

fs.writeFileSync(file, content);
