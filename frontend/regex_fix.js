const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const content = fs.readFileSync(path, 'utf8');

const regex = /objective,\s+if \(goToPrescription\) \{/;
const replacement = "objective,\n        diagnosis,\n        treatmentPlan,\n        labNotes,\n        labResults,\n        notes,\n        hasInformedConsent,\n        services: [\n          ...serviceItems.map(s => ({ \n            serviceId: s.serviceId, \n            quantity: parseInt(s.quantity) || 0, \n            price: parseFloat(s.price) || 0 \n          })),\n          ...labItems.map(l => ({\n            serviceId: l.id,\n            quantity: 1,\n            price: l.price || 0,\n            isLab: true\n          }))\n        ],\n        prescriptions: prescriptionItems.map(p => ({\n          ...p,\n          quantity: parseInt(p.quantity) || 0\n        })),\n        isFinal\n      })\n      \n      toast.success(isFinal ? 'Pemeriksaan selesai!' : 'Draft disimpan!', { id: toastId })\n      \n      if (goToPrescription) {";

if (regex.test(content)) {
    fs.writeFileSync(path, content.replace(regex, replacement));
    console.log('Regex Fix Success');
} else {
    console.log('Regex Target not found');
}
