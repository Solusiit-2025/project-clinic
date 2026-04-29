const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const content = fs.readFileSync(path, 'utf8');

const targetStart = "const handleSaveConsultation = async (isFinal: boolean = true, goToPrescription: boolean = false) => {";
const targetEnd = "  const handleSaveAndPrintReferral = async () => {";

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    let middle = \`const handleSaveConsultation = async (isFinal: boolean = true, goToPrescription: boolean = false) => {
    if (!queue || !medicalRecord || isReadOnly) return
    setSaving(true)
    const toastId = toast.loading(isFinal ? 'Menyimpan hasil konsultasi...' : 'Menyimpan draft...')
    try {
      await api.post('transactions/medical-records/doctor', {
        queueId: queue.id,
        medicalRecordId: medicalRecord.id,
        subjective,
        objective,
        diagnosis,
        treatmentPlan,
        labNotes,
        labResults,
        notes,
        hasInformedConsent,
        services: [
          ...serviceItems.map(s => ({ 
            serviceId: s.serviceId, 
            quantity: parseInt(s.quantity) || 0, 
            price: parseFloat(s.price) || 0 
          })),
          ...labItems.map(l => ({
            serviceId: l.id,
            quantity: 1,
            price: l.price || 0,
            isLab: true
          }))
        ],
        prescriptions: prescriptionItems.map(p => ({
          ...p,
          quantity: parseInt(p.quantity) || 0
        })),
        isFinal
      })
      
      toast.success(isFinal ? 'Pemeriksaan selesai!' : 'Draft disimpan!', { id: toastId })
      
      if (goToPrescription) {
        router.push(\\\`/doctor/patients/\\\${queue.patientId}?tab=prescriptions\\\`)
      } else if (isFinal) {
        router.push('/doctor/queue')
      }
    } catch (e) {
      toast.error('Gagal menyimpan data', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

\`;
    
    fs.writeFileSync(path, before + middle + after);
    console.log('Final Handle Fix Success');
} else {
    console.log('Markers not found');
}
