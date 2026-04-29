const fs = require('fs');
const file = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('{r.type} REFERRAL</p>', "Rujukan {r.type === 'INTERNAL' ? 'Klinik' : 'RS Luar'}</p>");

const newStatus = `Ke: <span className="text-slate-700">{r.type === 'INTERNAL' ? \`\${r.toClinic?.name || 'Klinik'} - \${r.toDepartment?.name || 'Poli'}\` : r.toHospitalName}</span></p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {r.status || 'Pending'}</p>`;

content = content.replace("Status: {r.status || 'Pending'}</p>", newStatus);

fs.writeFileSync(file, content);
