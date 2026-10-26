const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
test('published CSP authorizes the unchanged inline script by hash and rejects inline event handlers', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
    const scriptPolicy = headers.match(/script-src ([^;]+)/)[1];
    assert.ok(!scriptPolicy.includes('unsafe-inline'));
    assert.ok(!scriptPolicy.includes('unsafe-eval'));
    assert.match(headers, /script-src-attr 'none'/);
    for (const match of html.matchAll(
        /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi
    )) {
        const hash = crypto
            .createHash('sha256')
            .update(match[1].replace(/\r\n?/g, '\n'))
            .digest('base64');
        assert.ok(scriptPolicy.includes("'sha256-" + hash + "'"));
    }
    for (const source of [
        html,
        fs.readFileSync(path.join(root, 'app.js'), 'utf8')
    ])
        assert.doesNotMatch(source, /\son(?:click|error|load)\s*=/i);
    for (const script of html.matchAll(/<script[^>]+src="(https:[^"]+)"/g))
        assert.ok(scriptPolicy.includes(new URL(script[1]).origin));
});
test('Pages middleware serves only public artifacts and never exposes server, test or environment files', async () => {
    const source = fs
        .readFileSync(path.join(root, 'functions/_middleware.js'), 'utf8')
        .replace(/^import publicPaths from .*;\r?$/m, '')
        .replace('export async function onRequest', 'async function onRequest');
    const handle = new Function('publicPaths', source + ';return onRequest;')(require('../shared/security/public-paths'));
    for (const resource of [
        '/server.js',
        '/.env',
        '/backend/cloudflare/sessions.js',
        '/tests/security-regressions.test.cjs',
        '/shared/security/policy.js',
        '/assets/server.js',
        '/assets/private-config.js',
        '/assets/app.123.js',
        '/assets/%252e%252e%252fserver.js',
        '/covers/../server.js'
    ]) {
        let delegated = false;
        const response = await handle({
            request: new Request('https://example.invalid' + resource),
            next: async () => {
                delegated = true;
                return new Response('private');
            }
        });
        assert.equal(response.status, 404);
        assert.equal(delegated, false);
    }
    for (const resource of [
        '/',
        '/assets/app.123456789abc.js',
        '/fonts/syne.latin.49726df17069.woff2',
        '/covers/a25.jpg',
        '/api/health'
    ]) {
        const response = await handle({
            request: new Request('https://example.invalid' + resource),
            next: async () => new Response('public')
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    }
});
test('the production Cloudflare module bundles without Node dependencies and runs registration and logout', async (t) => {
    const { sqliteD1 } = require('./helpers/cloudflare.cjs');
    const db = sqliteD1();
    t.after(() => db.sqlite.close());
    const output = require('esbuild').buildSync({
        entryPoints: [path.join(root, 'functions/api/[[path]].js')],
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'esm',
        target: 'es2022'
    }).outputFiles[0].text;
    assert.doesNotMatch(output, /from ["']node:/);
    const { onRequest } = await import(
        'data:text/javascript;base64,' + Buffer.from(output).toString('base64')
    );
    const request = (path, body, cookie = '') =>
        onRequest({
            env: { ANIVOID_DB: db },
            request: new Request('https://anime-ratings.pages.dev' + path, {
                method: 'POST',
                headers: {
                    Origin: 'https://anime-ratings.pages.dev',
                    'Content-Type': 'application/json',
                    Cookie: cookie
                },
                body: JSON.stringify(body)
            })
        });
    const registration = await request('/api/register', {
        username: 'Carla',
        email: 'carla@example.invalid',
        password: 'FixturePassword123'
    });
    assert.equal(registration.status, 200);
    const cookie = registration.headers.get('Set-Cookie').split(';')[0];
    assert.equal((await request('/api/logout', {}, cookie)).status, 200);
    assert.equal(
        (
            await request(
                '/api/patch-user',
                { username: 'Carla', fields: {} },
                cookie
            )
        ).status,
        401
    );
});
