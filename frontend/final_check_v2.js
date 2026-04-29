const fs = require('fs');
const content = fs.readFileSync('d:/Project WebApp/project-clinic/frontend/app/doctor/queue/[id]/page.tsx', 'utf8');

let braces = 0;
let parentheses = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') braces++;
    if (content[i] === '}') braces--;
    if (content[i] === '(') parentheses++;
    if (content[i] === ')') parentheses--;
    if (content[i] === '[') brackets++;
    if (content[i] === ']') brackets--;
}

console.log('Final Balance Check:', { braces, parentheses, brackets });
if (braces === 0 && parentheses === 0 && brackets === 0) {
    console.log('ALL SYSTEMS GO');
} else {
    console.log('SYNTAX STILL UNBALANCED');
}
