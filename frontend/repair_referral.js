const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const content = fs.readFileSync(path, 'utf8');

const targetStart = "const handleSaveAndPrintReferral = async () => {";
const targetEnd = "const handleSaveConsultation = async (isFinal: boolean = true, goToPrescription: boolean = false) => {";

// Wait, handleSaveConsultation is ABOVE handleSaveAndPrintReferral now?
// Let's check the order.

const startIndex = content.indexOf(targetStart);
// Find the end of the function (until next function or end of script block)
const nextStart = content.indexOf("const generateLabPDF = async (patientName: string) => {");

if (startIndex !== -1 && nextStart !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(nextStart);
    
    const middle = `const handleSaveAndPrintReferral = async () => {
    if (!medicalRecord || !queue) {
      toast.error('Gagal membuat rujukan: Rekam medis tidak ditemukan')
      return
    }

    if (referralType === 'INTERNAL' && (!referralToClinicId || !referralToDepartmentId)) {
      toast.error('Harap pilih Klinik dan Poli tujuan')
      return
    }
    if (referralType === 'EXTERNAL' && !referralToHospitalName) {
      toast.error('Harap isi nama RS tujuan')
      return
    }

    const toastId = toast.loading('Menyimpan surat rujukan...')
    try {
      const payload = {
        medicalRecordId: medicalRecord.id,
        type: referralType,
        toClinicId: referralType === 'INTERNAL' ? referralToClinicId : undefined,
        toDepartmentId: referralType === 'INTERNAL' ? referralToDepartmentId : undefined,
        toHospitalName: referralType === 'EXTERNAL' ? referralToHospitalName : undefined,
        notes: referralNotes
      }
      
      const res = await api.post('clinical/referrals', payload)
      
      toast.success('Rujukan berhasil disimpan', { id: toastId })
      
      // Update local referrals list
      setReferrals([res.data, ...referrals])
      
      // Set print data and trigger print
      setCurrentPrintReferral(res.data)
      setIsReferralPreviewOpen(true)
      
      // Reset form
      setReferralNotes('')
      setReferralToClinicId('')
      setReferralToDepartmentId('')
      setReferralToHospitalName('')
      
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan rujukan', { id: toastId })
    }
  }

  `;
    
    fs.writeFileSync(path, before + middle + after);
    console.log('Referral Repair Success');
} else {
    console.log('Markers not found', { startIndex, nextStart });
}
