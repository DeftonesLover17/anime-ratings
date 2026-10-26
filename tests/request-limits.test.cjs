const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemoryLimiter, API_LIMITS } = require('../shared/security/rate-limits');
const { createD1RateLimiter } = require('../backend/cloudflare/rate-limit');
const { createApiFetch } = require('../frontend/security/api-client');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('memory limiter bounds cardinality, rejects excess work and recovers after expiry', () => {
    let time = 0; const limiter = createMemoryLimiter({ now: () => time, capacity: 2 });
    assert.equal(limiter.consume('a', 2, 1000).allowed, true);
    assert.equal(limiter.consume('a', 2, 1000).allowed, true);
    assert.equal(limiter.consume('a', 2, 1000).allowed, false);
    limiter.consume('b', 2, 1000);
    assert.equal(limiter.consume('c', 2, 1000).allowed, false); assert.equal(limiter.size, 2);
    time = 30_001; assert.equal(limiter.consume('c', 2, 1000).allowed, true);
});

test('D1 counters remain authoritative across isolates; repeated denials avoid additional writes', async t => {
    const db = sqliteD1(); t.after(() => db.sqlite.close());
    await db.prepare('CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER, reset_at INTEGER)').run();
    let time = 0, writes = 0; const prepare = db.prepare.bind(db);
    db.prepare = sql => { writes++; return prepare(sql); };
    const options = { now: () => time }, first = createD1RateLimiter(options), second = createD1RateLimiter(options);
    assert.equal(await first(db, 'account:member', 2, 1000), 0);
    assert.equal(await second(db, 'account:member', 2, 1000), 0);
    assert.equal(await first(db, 'account:member', 2, 1000), 1);
    const deniedWrites = writes;
    for (let i = 0; i < 100; i++) assert.equal(await first(db, 'account:member', 2, 1000), 1);
    assert.equal(writes, deniedWrites);
    time = 1001; assert.equal(await second(db, 'account:member', 2, 1000), 0);
});

test('Cloudflare limits anonymous reads and cannot bypass an IP budget using forged X-Forwarded-For', async t => {
    const api = loadCloudflare(), db = sqliteD1(), env = { ANIVOID_DB: db };
    t.after(() => db.sqlite.close());
    const send = ip => api.onRequest({ env, request: new Request('https://anime-ratings.pages.dev/api/health', { headers: { 'CF-Connecting-IP': '192.0.2.20', 'X-Forwarded-For': ip } }) });
    for (let i = 0; i < API_LIMITS.burst.max; i++) assert.equal((await send('10.0.0.' + i)).status, 200);
    const response = await send('203.0.113.1');
    assert.equal(response.status, 429); assert.equal((await response.json()).code, 'RATE_LIMITED');
    assert.ok(Number(response.headers.get('Retry-After')) > 0);
});

test('Node applies the same API burst budget and leaves static resources accessible', async t => {
    const { send } = await startNodeServer(t);
    for (let i = 0; i < API_LIMITS.burst.max; i++) assert.equal((await send('/api/health')).status, 200);
    const response = await send('/api/users'); assert.equal(response.status, 429);
    assert.equal((await response.json()).code, 'RATE_LIMITED');
    assert.ok(Number(response.headers.get('Retry-After')) > 0);
    assert.equal((await send('/')).status, 200);
});

test('an authenticated account keeps its write budget when its IP changes', async t => {
    const api = loadCloudflare(), db = sqliteD1(), env = { ANIVOID_DB: db };
    t.after(() => db.sqlite.close());
    const state = await api.readState(env);
    state.registeredUsers.push({ username: 'Ana', accountId: 'fixture-account', credentialVersion: 1, friends: [], notifications: [] });
    await api.writeState(env, state);
    const token = await api.createSession(env, state.registeredUsers[0]);
    const send = index => api.onRequest({ env, request: new Request('https://anime-ratings.pages.dev/api/notifications/read', {
        method: 'POST', headers: { Origin: 'https://anime-ratings.pages.dev', 'Content-Type': 'application/json', Cookie: require('../shared/security/policy').sessionCookie(token).split(';')[0], 'CF-Connecting-IP': '192.0.2.' + index }, body: '{}'
    }) });
    for (let i = 0; i < API_LIMITS.account.max; i++) assert.equal((await send(i)).status, 200);
    const response = await send(200); assert.equal(response.status, 429);
    assert.equal((await response.json()).code, 'RATE_LIMITED');
});

test('client deduplicates identical reads and honors Retry-After without replaying mutations or clearing sessions', async () => {
    let calls = 0, time = 1000, status = 200;
    const fetch = async () => { calls++; return new Response(JSON.stringify({ success: true }), { status, headers: status === 429 ? { 'Retry-After': '10' } : {} }); };
    const origin = 'https://anime-ratings.pages.dev', client = createApiFetch({ location: { origin } }, fetch, { origin, now: () => time });
    const reads = await Promise.all([client('/api/users'), client('/api/users')]);
    await Promise.all(reads.map(response => response.json())); assert.equal(calls, 1);
    status = 429; assert.equal((await client('/api/sync-state', { method: 'POST' })).status, 429);
    assert.equal((await client('/api/get-state')).status, 429); assert.equal(calls, 2);
    time += 10_001; status = 200;
    assert.equal((await client('/api/get-state')).status, 200); assert.equal(calls, 3);
    await Promise.all([client('/api/sync-state', { method: 'POST' }), client('/api/sync-state', { method: 'POST' })]);
    assert.equal(calls, 5);
});

test('session confirmation never reuses an anonymous read that was pending during login', async () => {
    const origin = 'https://anime-ratings.pages.dev';
    let finishAnonymous, reads = 0, signedIn = false;
    const fetch = async (url, init) => {
        assert.equal(init.credentials, 'include');
        if (url.endsWith('/login')) { signedIn = true; return new Response('{}'); }
        reads++;
        if (!signedIn) return new Promise(resolve => finishAnonymous = () => resolve(new Response('{"viewerUsername":""}')));
        return new Response('{"viewerUsername":"Ana"}');
    };
    const client = createApiFetch({ location: { origin } }, fetch, { origin });
    const anonymous = client('/api/users');
    await new Promise(setImmediate);
    await client('/api/login', { method: 'POST' });
    const confirmed = await client('/api/users');
    assert.equal((await confirmed.json()).viewerUsername, 'Ana'); assert.equal(reads, 2);
    finishAnonymous(); await anonymous;
});
