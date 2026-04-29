const fs = require('fs');
const content = fs.readFileSync('d:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx', 'utf8');

let braces = 0;
let parentheses = 0;
let lines = content.split('\n');
let results = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') braces++;
        if (line[j] === '}') braces--;
        if (line[j] === '(') parentheses++;
        if (line[j] === ')') parentheses--;
    }
    results.push('Line ' + (i+1) + ': { ' + braces + ', ( ' + parentheses);
}

console.log(results.slice(-50).join('\n'));
