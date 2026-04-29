const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Keep lines up to 521 (index 522 is empty, index 523 is the start of duplicate)
const part1 = lines.slice(0, 522);
// Skip 523 to 563 (index 522 to 562)
// Keep from 564 (index 563)
const part2 = lines.slice(563);

fs.writeFileSync(path, part1.concat(part2).join('\n'));
console.log('Duplicate Removal Success');
