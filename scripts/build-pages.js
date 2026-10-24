const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const esbuild = require('esbuild');

async function build() {
    const root = path.resolve(__dirname, '..');
    const dist = path.join(root, 'dist');
    if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Invalid build output');
    fs.rmSync(dist, { recursive: true, force: true });
    fs.mkdirSync(dist, { recursive: true });
    for (const folder of ['covers', 'logos']) fs.cpSync(path.join(root, folder), path.join(dist, folder), { recursive: true });
    for (const file of ['favicon.png', 'logo.png']) fs.copyFileSync(path.join(root, file), path.join(dist, file));
    const config = require(path.join(root, 'tailwind.config.js'));
    config.content = config.content.map(file => path.resolve(root, file));
    const generated = await postcss([tailwind(config)]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
    // Also support the alternative Node server, which serves the source tree.
    fs.writeFileSync(path.join(root, 'tailwind.css'), generated.css);
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const assets = [
        ['tailwind.css', generated.css, 'css'],
        ['styles.css', fs.readFileSync(path.join(root, 'styles.css'), 'utf8'), 'css'],
        ['shared/sync-state.js', fs.readFileSync(path.join(root, 'shared/sync-state.js'), 'utf8'), 'js'],
        ['app.js', fs.readFileSync(path.join(root, 'app.js'), 'utf8'), 'js']
    ];
    for (const [name, source, loader] of assets) {
        const output = esbuild.transformSync(source, { loader, minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false, charset: 'utf8', target: 'es2020' }).code;
        const hash = crypto.createHash('sha256').update(output).digest('hex').slice(0, 12);
        const extension = path.extname(name);
        const hashed = name.slice(0, -extension.length) + '.' + hash + extension;
        fs.mkdirSync(path.dirname(path.join(dist, hashed)), { recursive: true });
        fs.writeFileSync(path.join(dist, hashed), output);
        const sourceUrl = name === 'app.js' ? 'app.js?v=79' : name === 'styles.css' ? 'styles.css?v=19' : name;
        html = html.replace(sourceUrl, hashed);
    }
    fs.writeFileSync(path.join(dist, 'index.html'), html);
    fs.copyFileSync(path.join(root, '_headers'), path.join(dist, '_headers'));
    console.log('Cloudflare Pages output ready at dist (compiled CSS and versioned assets)');
}

build().catch(error => { console.error(error); process.exitCode = 1; });
