const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const referralStateIndex = lines.findIndex(l => l.includes("// Referral State"));

if (referralStateIndex !== -1) {
    const part1 = lines.slice(0, referralStateIndex + 1);
    const part2 = lines.slice(referralStateIndex + 1);
    
    // We remove the old partial referral states and add the full set
    const cleanedPart2 = part2.filter(l => 
        !l.includes("referralType") && 
        !l.includes("referralToClinicId") && 
        !l.includes("isReferralPreviewOpen") && 
        !l.includes("currentPrintReferral")
    );
    
    let middle = "  const [referralType, setReferralType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')\n";
    middle += "  const [referralToClinicId, setReferralToClinicId] = useState('')\n";
    middle += "  const [referralToDepartmentId, setReferralToDepartmentId] = useState('')\n";
    middle += "  const [referralToHospitalName, setReferralToHospitalName] = useState('')\n";
    middle += "  const [referralNotes, setReferralNotes] = useState('')\n";
    middle += "  const [clinicsList, setClinicsList] = useState<any[]>([])\n";
    middle += "  const [departmentsList, setDepartmentsList] = useState<any[]>([])\n";
    middle += "  const [isPrinting, setIsPrinting] = useState(false)\n";
    middle += "  const [isReferralPreviewOpen, setIsReferralPreviewOpen] = useState(false)\n";
    middle += "  const [currentPrintReferral, setCurrentPrintReferral] = useState<any>(null)\n";

    fs.writeFileSync(path, part1.join('\n') + '\n' + middle + cleanedPart2.join('\n'));
    console.log('State Restoration Success');
} else {
    console.log('Referral State marker not found');
}
