const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const publicFiles = [
    'index.html',
    'app.js',
    'tailwind-config.js',
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
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: DENY
  Permissions-Policy: accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), clipboard-read=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://code.iconify.design; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.jikan.moe https://api.emailjs.com; upgrade-insecure-requests
  Access-Control-Allow-Origin: https://anime-ratings.pages.dev

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
