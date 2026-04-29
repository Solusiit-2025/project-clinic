const fs = require('fs');
const file = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Hidden Print Template \*\/\}.*?(?=\}\n\s*<\/div>\n\s*\)\n\})/s;

const replacementStr = `{/* Hidden Print Template */}
      {isPrinting && currentPrintReferral && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none z-[-1]">
          <div id="print-referral-template" className="w-[210mm] min-h-[297mm] bg-white text-slate-800 font-sans box-border relative overflow-hidden" style={{ padding: '20mm' }}>
            
            {/* Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-primary"></div>
            
            {/* Kop Surat */}
            <div className="flex justify-between items-end border-b-2 border-primary pb-6 mb-8">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xl">
                      <FiHeart />
                   </div>
                   <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">{queue?.clinicId ? clinicsList.find(c => c.id === queue.clinicId)?.name || 'KLINIK' : 'KLINIK PUSAT'}</h1>
                 </div>
                 <p className="text-xs text-slate-500 uppercase tracking-widest">Layanan Medis & Konsultasi Spesialis</p>
              </div>
              <div className="text-right">
                 <h2 className="text-4xl font-black uppercase tracking-tight text-primary">SURAT RUJUKAN</h2>
                 <p className="text-xs font-bold uppercase tracking-widest mt-2 bg-slate-100 text-slate-600 inline-block px-3 py-1 rounded-lg">NO: REF-{currentPrintReferral.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-sm leading-relaxed text-slate-600">Kepada Yth.,<br/><strong className="text-slate-900 text-base">Teman Sejawat Dokter / {currentPrintReferral.type === 'INTERNAL' ? \`Poli \${currentPrintReferral.toDepartment?.name}\` : 'Poliklinik Terkait'}</strong><br/>Di Tempat</p>
              <p className="text-sm mt-4 text-slate-600">Mohon pemeriksaan dan penanganan lebih lanjut terhadap pasien berikut:</p>
            </div>
            
            {/* Patient Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="w-48 py-2 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Nama Pasien</td><td className="w-4 py-2 text-slate-400">:</td><td className="py-2 font-bold text-base text-slate-900">{queue.patient.name}</td></tr>
                  <tr><td className="w-48 py-2 font-bold text-slate-500 uppercase tracking-widest text-[10px]">No. Rekam Medis</td><td className="w-4 py-2 text-slate-400">:</td><td className="py-2 text-slate-700">{queue.patient.medicalRecordNo}</td></tr>
                  <tr><td className="w-48 py-2 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Jenis Kelamin</td><td className="w-4 py-2 text-slate-400">:</td><td className="py-2 text-slate-700">{['L', 'M', 'Laki-laki'].includes(queue.patient.gender) ? 'Laki-laki' : 'Perempuan'}</td></tr>
                  <tr><td className="w-48 py-2 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Tujuan Rujukan</td><td className="w-4 py-2 text-slate-400">:</td><td className="py-2 font-black text-primary">{currentPrintReferral.type === 'INTERNAL' ? \`\${currentPrintReferral.toClinic?.name} - Poli \${currentPrintReferral.toDepartment?.name}\` : currentPrintReferral.toHospitalName}</td></tr>
                </tbody>
              </table>
            </div>
            
            {/* Clinical Info Section */}
            <div className="mb-8 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6 flex items-center gap-2"><FiActivity /> Informasi Klinis</h3>
               <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                     <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2">Anamnesa (S)</p>
                     <p className="whitespace-pre-wrap text-slate-700 mb-6 leading-relaxed">{subjective || '-'}</p>
                     
                     <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2">Pemeriksaan Fisik (O)</p>
                     <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{objective || '-'}</p>
                  </div>
                  <div>
                     <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2">Diagnosa Sementara (A)</p>
                     <p className="whitespace-pre-wrap font-bold text-slate-900 mb-6 leading-relaxed">{diagnosis || '-'}</p>
                     
                     <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] mb-2">Terapi Diberikan (P)</p>
                     <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{treatmentPlan || '-'}</p>
                  </div>
               </div>
            </div>
            
            {/* Notes Section */}
            <div className="mb-12 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>
               <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Catatan Rujukan Khusus</h3>
               <p className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed italic">{currentPrintReferral.notes || '-'}</p>
            </div>
            
            <div className="flex justify-end mt-16">
               <div className="text-center w-64">
                  <p className="text-sm text-slate-500 mb-20">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Dokter Perujuk,</p>
                  <div className="border-b-2 border-slate-300 w-3/4 mx-auto mb-2"></div>
                  <p className="text-sm font-black uppercase text-slate-900">{queue.doctor?.name || user?.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">SIP: {queue.doctor?.specialization || 'Umum'}</p>
               </div>
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-10 left-20 right-20 border-t border-slate-200 pt-6 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Dicetak melalui Sistem Rekam Medis Elektronik pada {new Date().toLocaleString('id-ID')}</p>
            </div>
            
          </div>
        </div>
      )
`;

content = content.replace(regex, replacementStr);
fs.writeFileSync(file, content);
console.log('Done');
