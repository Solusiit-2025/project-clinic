const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const content = fs.readFileSync(path, 'utf8');

const regex = /<div className="space-y-4">\s+<div className="flex gap-2">\s+<\/div>/;
const targetEnd = '<textarea value={referralNotes}';

const match = content.match(regex);
const endIndex = content.indexOf(targetEnd);

if (match && endIndex !== -1) {
    const before = content.substring(0, match.index);
    const after = content.substring(endIndex);
    
    const middle = `<div className="space-y-4">
                             <div className="flex gap-2">
                                {['INTERNAL', 'EXTERNAL'].map(type => (
                                   <button 
                                     key={type} 
                                     onClick={() => setReferralType(type as any)} 
                                     className={\`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${referralType === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}\`}
                                   >
                                      {type === 'INTERNAL' ? 'Klinik / Poli Internal' : 'Rumah Sakit Luar'}
                                   </button>
                                ))}
                             </div>

                             {referralType === 'INTERNAL' ? (
                               <div className="flex gap-4">
                                  <select value={referralToClinicId} onChange={e => setReferralToClinicId(e.target.value)} className="flex-1 p-4 border border-slate-200 rounded-2xl text-xs font-bold bg-white focus:border-primary outline-none">
                                     <option value="">Pilih Klinik Tujuan...</option>
                                     {clinicsList.filter(c => c.id !== queue.clinicId).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                     ))}
                                  </select>
                                  <select value={referralToDepartmentId} onChange={e => setReferralToDepartmentId(e.target.value)} className="flex-1 p-4 border border-slate-200 rounded-2xl text-xs font-bold bg-white focus:border-primary outline-none">
                                     <option value="">Pilih Poli/Unit Tujuan...</option>
                                     {departmentsList.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                     ))}
                                  </select>
                               </div>
                             ) : (
                               <input value={referralToHospitalName} onChange={e => setReferralToHospitalName(e.target.value)} placeholder="Ketik nama Rumah Sakit tujuan..." className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-bold bg-white focus:border-primary outline-none" />
                             )}

                             `;
    
    fs.writeFileSync(path, before + middle + after);
    console.log('Regex Referral UI Repair Success');
} else {
    console.log('Regex Referral UI Markers not found', { match: !!match, endIndex });
}
