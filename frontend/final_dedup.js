const fs = require('fs');
const path = 'd:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Keep lines 0 to 337 (index 338 is the start of duplicate)
const part1 = lines.slice(0, 338);
// Skip 339 to 429 (index 338 to 428)
// Keep from 430 (index 429)
const part2 = lines.slice(429);

fs.writeFileSync(path, part1.concat(part2).join('\n'));
console.log('Final Deduplication Success');
