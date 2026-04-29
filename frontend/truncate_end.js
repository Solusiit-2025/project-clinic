const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Keep lines up to 1781 (index 1782)
const finalLines = lines.slice(0, 1782);

fs.writeFileSync(path, finalLines.join('\n'));
console.log('Truncation Success');
