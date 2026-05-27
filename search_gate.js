const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
let start = -1;
let end = -1;

lines.forEach((line, idx) => {
    if (line.includes('id="registration-gate"')) {
        start = idx + 1;
    }
    if (start !== -1 && end === -1 && line.includes('<!-- Fin do Registration Gate') || (start !== -1 && end === -1 && idx > start + 300)) {
        // We will just print the first 250 lines from start to get the block
        end = idx + 1;
    }
});

console.log(`registration-gate starts at line ${start}`);
