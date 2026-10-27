const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const esbuild = require('esbuild');
const { assertBrowserInputs, assertNoBrowserSecrets } = require('./browser-security');

async function build() {
    const root = path.resolve(__dirname, '..');
    const dist = path.join(root, 'dist');
    const publicAssets = path.join(root, 'assets');
    if (path.dirname(dist) !== root || path.basename(dist) !== 'dist') throw new Error('Invalid build output');
    if (path.dirname(publicAssets) !== root || path.basename(publicAssets) !== 'assets') throw new Error('Invalid asset output');
    fs.rmSync(dist, { recursive: true, force: true });
    fs.rmSync(publicAssets, { recursive: true, force: true });
    fs.mkdirSync(dist, { recursive: true });
    fs.mkdirSync(publicAssets, { recursive: true });
    for (const folder of ['covers', 'logos', 'fonts']) fs.cpSync(path.join(root, folder), path.join(dist, folder), { recursive: true });
    for (const file of ['favicon.png', 'logo.png']) fs.copyFileSync(path.join(root, file), path.join(dist, file));
    const config = require(path.join(root, 'tailwind.config.js'));
    config.content = config.content.map(file => path.resolve(root, file));
    const generated = await postcss([tailwind(config)]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
    const uiBuild = esbuild.buildSync({
        entryPoints: [path.join(root, 'frontend/ui/index.js')],
        bundle: true, write: false, metafile: true, format: 'iife', platform: 'browser', target: 'es2020', loader: { '.html': 'text' }
    });
    const syncBuild = esbuild.buildSync({
        entryPoints: [path.join(root, 'shared/sync-state.js')], bundle: true, write: false,
        metafile: true, format: 'iife', globalName: 'AnivoidSync', platform: 'browser', target: 'es2020'
    });
    assertBrowserInputs(root, { ...uiBuild.metafile.inputs, ...syncBuild.metafile.inputs });
    const uiBundle = uiBuild.outputFiles[0].text, syncBundle = syncBuild.outputFiles[0].text;
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const cssSources = [
        'styles.css',
        'frontend/ui/ui.css',
        'frontend/ui/notifications.css',
        'frontend/site/fonts.css',
        'frontend/site/site.css',
        'frontend/site/group-stats.css',
        'frontend/site/profile-editor.css',
        'frontend/site/player-profile.css',
        'frontend/site/catalog-modal.css',
        'frontend/site/friends.css',
        'frontend/site/notifications.css',
        'frontend/account/account.css',
        'frontend/account/recovery.css',
        'frontend/profiles/profiles.css',
        'frontend/account/welcome-email.css',
        'frontend/account/design-update.css',
        'frontend/ratings/ratings.css',
        'frontend/community/community.css',
        'frontend/site/motion.css'
    ];
    const assets = [
        ['tailwind.css', generated.css, 'css'],
        ['styles.css', cssSources.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n'), 'css'],
        ['shared/sync-state.js', syncBundle, 'js'],
        ['app.js', fs.readFileSync(path.join(root, 'app.js'), 'utf8'), 'js'],
        ['ui.js', uiBundle, 'js']
    ];
    for (const [, source] of assets) assertNoBrowserSecrets(source, { root, environment: process.env });
    assertNoBrowserSecrets(html, { root, environment: process.env });
    for (const [name, source, loader] of assets) {
        const output = esbuild.transformSync(source, { loader, minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false, charset: 'utf8', target: 'es2020' }).code;
        const hash = crypto.createHash('sha256').update(output).digest('hex').slice(0, 12);
        const extension = path.extname(name);
        const hashed = 'assets/' + path.basename(name, extension) + '.' + hash + extension;
        fs.mkdirSync(path.dirname(path.join(dist, hashed)), { recursive: true });
        fs.writeFileSync(path.join(dist, hashed), output);
        fs.writeFileSync(path.join(root, hashed), output);
        const patterns = {
            'ui.js': /((?:src|href)=["'])(?:assets\/)?ui(?:-preferences)?(?:\.[a-f0-9]{12})?\.js(["'])/g,
            'app.js': /((?:src|href)=["'])(?:assets\/)?app(?:\.[a-f0-9]{12})?\.js(?:\?v=\d+)?(["'])/g,
            'styles.css': /((?:src|href)=["'])(?:assets\/)?styles(?:\.[a-f0-9]{12})?\.css(?:\?v=\d+)?(["'])/g,
            'tailwind.css': /((?:src|href)=["'])(?:assets\/)?tailwind(?:\.[a-f0-9]{12})?\.css(["'])/g,
            'shared/sync-state.js': /((?:src|href)=["'])(?:assets\/|shared\/)?sync-state(?:\.[a-f0-9]{12})?\.js(["'])/g
        };
        if (!patterns[name].test(html)) throw new Error('Missing asset reference: ' + name);
        patterns[name].lastIndex = 0;
        html = html.replace(patterns[name], '$1' + hashed + '$2');
    }
    // The existing Pages project publishes the repository root. Keep the small
    // compiled asset set there as well as in dist so either configuration works.
    fs.writeFileSync(path.join(root, 'index.html'), html);
    fs.writeFileSync(path.join(dist, 'index.html'), html);
    const inlineHashes = [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi)]
        .map(match => "'sha256-" + crypto.createHash('sha256').update(match[1].replace(/\r\n?/g,'\n')).digest('base64') + "'").join(' ');
    const headers = fs.readFileSync(path.join(root, 'config/security-headers.template'),'utf8').replace('__INLINE_SCRIPT_HASHES__',inlineHashes);
    fs.writeFileSync(path.join(root, '_headers'),headers);
    fs.writeFileSync(path.join(dist, '_headers'),headers);
    console.log('Cloudflare Pages output ready at dist (compiled CSS and versioned assets)');
}

build().catch(error => { console.error(error); process.exitCode = 1; });
