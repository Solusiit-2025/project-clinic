const fs = require('fs');
const path = 'c:/Penyimpanan Utama/Documents/DATA PARWANTO/PROJECT WEBAPP/project-clinic/backend/src/controllers/medicalRecord.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const target1 = 'const quantity = parseInt(p.quantity) || 0\r\n                const medicineSubtotal = itemPrice';
const target2 = 'const quantity = parseInt(p.quantity) || 0\n                const medicineSubtotal = itemPrice';

if (content.includes(target1)) {
    content = content.replace(target1, 'const quantity = parseInt(p.quantity) || 0\r\n                const medicineSubtotal = itemPrice * quantity');
} else if (content.includes(target2)) {
    content = content.replace(target2, 'const quantity = parseInt(p.quantity) || 0\n                const medicineSubtotal = itemPrice * quantity');
} else {
    // try line by line
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const medicineSubtotal = itemPrice') && !lines[i].includes('* quantity')) {
            lines[i] = lines[i].replace('const medicineSubtotal = itemPrice', 'const medicineSubtotal = itemPrice * quantity');
        }
    }
    content = lines.join('\n');
}

fs.writeFileSync(path, content);
console.log('Replaced successfully');
