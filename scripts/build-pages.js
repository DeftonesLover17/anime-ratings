const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const publicFiles = [
    'index.html',
    'app.js',
    'styles.css',
    'favicon.png',
    'logo.png'
];

const publicDirs = [
    'covers',
    'logos'
];

const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/index.html
  Cache-Control: no-cache

/app.js
  Cache-Control: no-cache, max-age=0, must-revalidate

/styles.css
  Cache-Control: public, max-age=31536000, immutable

/covers/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400

/logos/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400

/favicon.png
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400

/logo.png
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
`;

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const file of publicFiles) {
    const source = path.join(rootDir, file);
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, path.join(distDir, file));
    }
}

for (const dir of publicDirs) {
    const source = path.join(rootDir, dir);
    if (fs.existsSync(source)) {
        fs.cpSync(source, path.join(distDir, dir), { recursive: true });
    }
}

fs.writeFileSync(path.join(distDir, '_headers'), headers, 'utf8');

console.log(`Cloudflare Pages output ready at ${path.relative(rootDir, distDir)}`);
