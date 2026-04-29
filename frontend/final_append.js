const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
fs.appendFileSync(path, '\n  )\n}\n');
console.log('Final Append Success');
