const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

const animeRegex = /id:\s*'([^']+)'[\s\S]*?title:\s*'([^']+)'[\s\S]*?studio:\s*'([^']+)'/g;
let match;
const list = [];
while ((match = animeRegex.exec(content)) !== null) {
    list.push({ id: match[1], title: match[2], studio: match[3] });
}

console.log(JSON.stringify(list, null, 2));
