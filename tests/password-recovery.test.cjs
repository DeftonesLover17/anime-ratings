const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { startNodeServer } = require('./helpers/node-server.cjs');
const { createPasswordRecovery, TTL_MS } = require('../backend/security/password-recovery');
const { createD1RecoveryStore } = require('../backend/cloudflare/recovery-store');
const { createFileRecoveryStore } = require('../backend/node/recovery-store');
const { createRecoveryController } = require('../frontend/account/recovery');
const api = loadCloudflare(), original = 'OriginalFixture123', replacement = ' NewRecoveryFixture123 ', origin = 'https://anime-ratings.pages.dev';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

async function fixture(t) {
    const db = sqliteD1(), env = { ANIVOID_DB: db, PUBLIC_SITE_ORIGIN: origin, RECOVERY_EMAIL_PROVIDER: 'emailjs', EMAILJS_PUBLIC_KEY: 'public-fixture', EMAILJS_PRIVATE_KEY: 'private-fixture-only', EMAILJS_SERVICE_ID: 'service-fixture', EMAILJS_RECOVERY_TEMPLATE_ID: 'template-fixture' };
    t.after(() => db.sqlite.close());
    const state = await api.readState(env), user = { username: 'Ana', email: 'ana@example.invalid', friends: [] };
    await api.setPassword(user, original); state.registeredUsers.push(user); state.animes = [{ id: 'a1', title: 'Fixture', ratings: { ana: { overall: 9 } }, comments: [] }];
    await api.writeState(env, state);
    const deliveries = [], tasks = [];
    const nativeFetch = global.fetch;
    t.mock.method(global, 'fetch', async (url, options) => {
        if (url === 'https://api.emailjs.com/api/v1.0/email/send') { deliveries.push(JSON.parse(options.body)); return new Response('OK'); }
        return nativeFetch(url, options);
    });
    const send = (route, body, cookie = '', ip = '192.0.2.80', extra = {}) => api.onRequest({ env, waitUntil: task => tasks.push(task), request: new Request(origin + route, {
        method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, Cookie: cookie, ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }) });
    const request = async email => { const response = await send('/api/account/password-recovery/request', { email }); await Promise.all(tasks.splice(0)); return response; };
    return { db, env, state, user, send, request, deliveries };
}

test('recovery returns the same generic response for existing and unknown email and never returns the token', async t => {
    const f = await fixture(t);
    const known = await f.request(' ANA@EXAMPLE.INVALID '), unknown = await f.request('unknown@example.invalid');
    assert.equal(known.status, 202); assert.deepEqual(await known.json(), await unknown.json());
    assert.equal(f.deliveries.length, 1);
    const mail = f.deliveries[0], token = mail.template_params.reset_token;
    assert.match(token, /^[a-f0-9]{64}$/); assert.equal(mail.template_params.to_email, 'ana@example.invalid');
    const stored = f.db.sqlite.prepare('SELECT * FROM password_recoveries').get();
    assert.equal(stored.token_hash, hash(token)); assert.notEqual(stored.token_hash, token);
    const publicState = await (await f.send('/api/get-state')).json(); assert.equal(JSON.stringify(publicState).includes(token), false);
});

test('a valid recovery changes the exact password once, preserves ratings and invalidates existing sessions', async t => {
    const f = await fixture(t);
    const logged = await f.send('/api/login', { identifier: 'Ana', password: original });
    const cookie = logged.headers.get('Set-Cookie').split(';')[0];
    await f.request('ana@example.invalid'); const token = f.deliveries[0].template_params.reset_token;
    const saved = await f.send('/api/account/password-recovery/confirm', { token, password: replacement });
    assert.equal(saved.status, 200); assert.match(saved.headers.get('Set-Cookie'), /Max-Age=0/);
    assert.equal((await (await f.send('/api/users', undefined, cookie)).json()).viewerUsername, '');
    assert.equal((await f.send('/api/account/password-recovery/confirm', { token, password: 'AnotherFixture123' })).status, 400);
    assert.equal((await f.send('/api/login', { identifier: 'Ana', password: original })).status, 401);
    assert.equal((await f.send('/api/login', { identifier: 'Ana', password: replacement.trim() })).status, 401);
    assert.equal((await f.send('/api/login', { identifier: 'Ana', password: replacement })).status, 200);
    assert.equal((await api.readState(f.env)).animes[0].ratings.ana.overall, 9);
});

test('expired, superseded, deleted-account and email/credential changes invalidate recovery links', async t => {
    for (const mutation of ['expired', 'email', 'credential', 'deleted', 'superseded']) await t.test(mutation, async t => {
        const f = await fixture(t); await f.request('ana@example.invalid');
        const token = f.deliveries[0].template_params.reset_token;
        const state = await api.readState(f.env);
        if (mutation === 'expired') f.db.sqlite.prepare('UPDATE password_recoveries SET expires_at=?').run(Date.now() - 1);
        else if (mutation === 'superseded') await f.request('ana@example.invalid');
        else {
            if (mutation === 'email') state.registeredUsers[0].email = 'different@example.invalid';
            if (mutation === 'credential') state.registeredUsers[0].credentialVersion++;
            if (mutation === 'deleted') state.registeredUsers = [];
            await api.writeState(f.env, state);
        }
        assert.equal((await f.send('/api/account/password-recovery/confirm', { token, password: replacement })).status, 400);
    });
});

test('password validation preserves the link and concurrent submissions can commit only once', async t => {
    const f = await fixture(t); await f.request('ana@example.invalid'); const token = f.deliveries[0].template_params.reset_token;
    assert.equal((await f.send('/api/account/password-recovery/confirm', { token, password: 'weak' })).status, 400);
    assert.equal((await f.send('/api/account/password-recovery/confirm', { token, password: original })).status, 400);
    const replies = await Promise.all([f.send('/api/account/password-recovery/confirm', { token, password: replacement }), f.send('/api/account/password-recovery/confirm', { token, password: replacement })]);
    assert.deepEqual(replies.map(r => r.status).sort(), [200, 400]);
});

test('target request limits survive IP rotation and account lookup never leaks whether mail was suppressed', async t => {
    const f = await fixture(t);
    for (let i = 0; i < 4; i++) {
        const response = await f.send('/api/account/password-recovery/request', { email: 'ana@example.invalid' }, '', '192.0.2.' + (90 + i));
        assert.equal(response.status, 202);
    }
    await new Promise(setImmediate); assert.equal(f.deliveries.length, 3);
    for (let i = 0; i < 5; i++) assert.equal((await f.send('/api/account/password-recovery/request', { email: 'unknown@example.invalid' }, '', '192.0.2.99')).status, 202);
    assert.equal((await f.send('/api/account/password-recovery/request', { email: 'unknown@example.invalid' }, '', '192.0.2.99')).status, 429);
    assert.equal((await f.send('/api/account/password-recovery/confirm', { token: 'a'.repeat(64), password: replacement }, '', '192.0.2.100', { Origin: 'https://foreign.example.invalid' })).status, 403);
});

test('a failed state write restores the token and never overwrites a newer request', async t => {
    const db = sqliteD1(); t.after(() => db.sqlite.close()); const env = {};
    const store = createD1RecoveryStore({ getDb: () => db, ensureStorage: async () => {} }); await store.initialize(db);
    let mail, time = Date.now();
    const recovery = createPasswordRecovery({ crypto: crypto.webcrypto, store, now: () => time, deliver: async (_env, value) => mail = value });
    const user = { accountId: 'account', username: 'Ana', email: 'ana@example.invalid', credentialVersion: 1 }, state = { registeredUsers: [user] };
    await recovery.request(env, user); const token = mail.token;
    const fail = { saveState: async () => { throw Object.assign(new Error('conflict'), { code: 'STATE_CONFLICT' }); }, setPassword: async () => {}, verifyPassword: async () => false, revokeSessions: async () => {} };
    await assert.rejects(recovery.reset(env, token, replacement, state, fail), { code: 'STATE_CONFLICT' });
    assert.ok(await db.prepare('SELECT * FROM password_recoveries WHERE token_hash=?1').bind(hash(token)).first());
    const proof = await store.consume(env, hash(token), time); await recovery.request(env, user); const newer = mail.token;
    await store.restore(env, proof);
    assert.equal(await store.consume(env, hash(token), time), null); assert.ok(await store.consume(env, hash(newer), time));
    time += TTL_MS + 1;
});

test('delivery failures remove the proof and logs never include the token, address or private key', async t => {
    const db = sqliteD1(); t.after(() => db.sqlite.close()); const store = createD1RecoveryStore({ getDb: () => db, ensureStorage: async () => {} }); await store.initialize(db);
    const logs = []; t.mock.method(console, 'error', (...args) => logs.push(args));
    const recovery = createPasswordRecovery({ crypto: crypto.webcrypto, store, deliver: async () => { throw new Error('secret provider body'); } });
    await recovery.request({}, { accountId: 'id', username: 'Ana', email: 'ana@example.invalid', credentialVersion: 1 });
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM password_recoveries').first()).count, 0);
    assert.deepEqual(logs, [['password_recovery_delivery_failed']]);
});

test('Node reset proofs persist across store instances and the real HTTP adapter accepts the link once', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const logged = await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' }); const cookie = logged.headers.get('Set-Cookie').split(';')[0];
    const state = JSON.parse(await fs.readFile(stateFile, 'utf8')), user = state.registeredUsers.find(user => user.username === 'Ana');
    const file = path.join(path.dirname(stateFile), 'password-recoveries.json'), token = crypto.randomBytes(32).toString('hex');
    const store = createFileRecoveryStore(file);
    await store.save({}, { hash: hash(token), accountId: user.accountId, email: user.email, credentialVersion: user.credentialVersion || 0, expiresAt: Date.now() + TTL_MS });
    const reset = await send('/api/account/password-recovery/confirm', { token, password: replacement }); assert.equal(reset.status, 200);
    assert.equal((await send('/api/account/password-recovery/confirm', { token, password: replacement })).status, 400);
    assert.equal((await (await send('/api/users', undefined, cookie)).json()).viewerUsername, '');
    assert.equal((await send('/api/login', { identifier: 'Ana', password: replacement })).status, 200);
    const reopened = createFileRecoveryStore(file); assert.equal(await reopened.consume({}, hash(token), Date.now()), null);
    const unavailable = await send('/api/account/password-recovery/request', { email: user.email }); assert.equal(unavailable.status, 503);
});

test('recovery fragments are removed immediately and never exposed through the public controller or storage', () => {
    const token = 'a'.repeat(64), changes = [];
    const win = { location: { href: origin + '/#redefinir-senha=' + token }, history: { state: null, replaceState: (...args) => changes.push(args[2]) }, localStorage: { setItem() { throw new Error('token persistence forbidden'); } } };
    const controller = createRecoveryController(win);
    assert.deepEqual(changes, ['/']); assert.deepEqual(Object.keys(controller), ['install', 'open']);
});


test('a delivery cleanup outage is contained and never exposes provider diagnostics', async t => {
    const logs = []; t.mock.method(console, 'error', (...args) => logs.push(args));
    const recovery = createPasswordRecovery({ crypto: crypto.webcrypto, store: { save: async () => {}, remove: async () => { throw new Error('private storage diagnostic'); } }, deliver: async () => { throw new Error('private delivery diagnostic'); } });
    await recovery.request({}, { accountId: 'id', email: 'ana@example.invalid' });
    assert.deepEqual(logs, [['password_recovery_delivery_failed']]);
});
