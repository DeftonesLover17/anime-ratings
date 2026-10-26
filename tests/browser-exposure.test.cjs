const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { startNodeServer } = require('./helpers/node-server.cjs');
const { stateResponse, cachedUserResponse } = require('../shared/security/responses');
const { classifyPublicPath } = require('../shared/security/public-paths');
const { cleanBrowserCache } = require('../frontend/security/cache');
const { assertNoBrowserSecrets, assertBrowserInputs } = require('../scripts/browser-security');
const sync = require('../shared/sync-state');
const marker = 'PRIVATE_FIXTURE_ONLY_8fe63b';
const api = loadCloudflare();
const origin = 'https://anime-ratings.pages.dev';

function sampleState() {
    return {
        revision: 0, environment: { privateKey: marker }, unknownFutureSecret: marker,
        friends: [{ id: 'ana', name: 'Ana', color: '#123456', passwordHash: marker, accessToken: marker }],
        studioLogos: {}, featuredAnimeId: 'a1',
        registeredUsers: ['Felipe!', 'Ana', 'Bruno'].map(username => ({ username, email: username.replace('!', '') + '@example.invalid', friends: [], password: 'FixtureOnly123', futureProviderSecret: marker })),
        animes: [{ id: 'a1', title: 'Fixture', synopsis: 'Preservada', genres: ['Drama'], providerSecret: marker,
            ratings: { ana: { overall: 8, status: 'Watching', episodesWatched: 1, episodeRatings: { 1: 8 }, passwordSalt: marker } },
            comments: [{ id: 'c1', friendId: 'ana', comment: 'Preservado', kind: 'review', spoiler: true, title: 'Review', passwordHash: marker,
                replies: [{ id: 'r1', friendId: 'bruno', reply: 'Preservada', privateKey: marker }] }] }],
        activities: [{ id: 'activity', username: 'Ana', details: 'avaliou', timestamp: '2026-10-26T00:00:00Z', databaseUrl: marker }]
    };
}
function noPrivateData(value) {
    const json = JSON.stringify(value);
    assert.equal(json.includes(marker), false);
    for (const key of ['passwordHash', 'passwordSalt', 'passwordIterations', 'passwordDigest', 'password', 'credentialVersion', 'privateKey', 'environment', 'accessToken']) assert.equal(json.includes('"' + key + '"'), false, key);
}

test('public state projections allow only documented fields at every nested level, without modifying storage', () => {
    const state = sampleState(), original = JSON.stringify(state), response = stateResponse(state, 'Ana');
    noPrivateData(response); assert.equal(JSON.stringify(state), original);
    assert.equal(response.animes[0].comments[0].title, 'Review'); assert.equal(response.animes[0].comments[0].spoiler, true);
    assert.equal(response.animes[0].comments[0].replies[0].reply, 'Preservada'); assert.equal(response.animes[0].ratings.ana.overall, 8);
    assert.equal(response.registeredUsers.find(user => user.username === 'Ana').email, 'Ana@example.invalid');
    assert.equal(response.registeredUsers.find(user => user.username === 'Bruno').email, undefined);
    assert.equal(cachedUserResponse({ username: 'Ana', emailVerified: true }, 'Ana').emailVerified, true);
    assert.equal(stateResponse({ registeredUsers: [{ username: 'Ana', emailVerified: true }] }, 'Ana').registeredUsers[0].emailVerified, false);
});

test('Cloudflare public reads and admin downloads exclude stored credentials; internal backups remain complete', async t => {
    const db = sqliteD1(), env = { ANIVOID_DB: db, ADMIN_USERS: 'felipe' };
    t.after(() => db.sqlite.close()); await api.readState(env);
    const state = sampleState(); await api.writeState(env, state);
    const send = (route, body, cookie = '', extra = {}) => api.onRequest({ env, request: new Request(origin + route, {
        method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.49', Cookie: cookie, ...extra },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }) });
    const login = async username => { const response = await send('/api/login', { identifier: username, password: 'FixtureOnly123' }); assert.equal(response.status, 200); noPrivateData(await response.json()); return response.headers.get('Set-Cookie').split(';')[0]; };
    noPrivateData(await (await send('/api/get-state')).json());
    const member = await login('Ana'), admin = await login('Felipe!');
    noPrivateData(await (await send('/api/get-state', undefined, member)).json());
    for (const cookie of ['', member]) for (const route of ['/api/admin/export-state', '/api/admin/backups/1', '/api/admin/overview']) {
        assert.ok([401, 403].includes((await send(route, undefined, cookie, { 'X-Admin': 'true', 'X-Username': 'Felipe!' })).status));
    }
    const exported = await (await send('/api/admin/export-state', undefined, admin)).json();
    assert.equal(exported.credentialsIncluded, false); noPrivateData(exported);
    const created = await (await send('/api/admin/backups', {}, admin)).json();
    const backup = created.backups.find(item => item.reason === 'manual'); assert.ok(backup);
    const download = await (await send('/api/admin/backups/' + backup.id, undefined, admin)).json();
    assert.equal(download.credentialsIncluded, false); noPrivateData(download);
    const internal = db.sqlite.prepare('SELECT state FROM state_backups WHERE id=?').get(backup.id).state;
    assert.equal(internal.includes(marker), true); assert.equal(internal.includes('password'), true);
    const before = await api.readState(env), ana = before.registeredUsers.find(user => user.username === 'Ana');
    const forged = await send('/api/patch-user', { username: 'Ana', fields: { username: 'Felipe!', role: 'admin', isAdmin: true, accountId: 'stolen', passwordHash: marker, color: '#abcdef' } }, member);
    assert.equal(forged.status, 200); noPrivateData(await forged.json());
    const after = (await api.readState(env)).registeredUsers.find(user => user.username === 'Ana');
    assert.equal(after.accountId, ana.accountId); assert.equal(after.passwordHash, ana.passwordHash); assert.equal(after.isAdmin, undefined);
    assert.equal((await send('/api/admin/export-state', undefined, member)).status, 403);
});

test('Node public reads also remove nested secrets without rewriting private stored records', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    state.environment = { privateKey: marker }; state.friends = sampleState().friends;
    state.animes[0].providerSecret = marker; state.animes[0].comments[0].passwordHash = marker;
    await fs.writeFile(stateFile, JSON.stringify(state));
    noPrivateData(await (await send('/api/get-state')).json());
    assert.equal((await fs.readFile(stateFile, 'utf8')).includes(marker), true);
    for (const route of ['/server.js', '/.env', '/.git/config', '/scripts/build-pages.js', '/assets/config.js', '/frontend/account/request.js']) assert.equal((await send(route)).status, 404);
    assert.equal((await send('/', undefined, '', { Host: '[invalid-host' })).status, 200);
    assert.equal((await send('/api/health')).status, 200);
});

test('cache migration removes old credentials and tokens while preserving unsaved rating changes and their baseline', () => {
    const state = sampleState();
    const base = sync.clientSnapshot(state, 'Ana');
    state.animes[0].ratings.ana.overall = 9;
    state.animes[0].ratings.ana.episodeRatings[1] = 9;
    const values = new Map([
        ['anivoid_auth_token', marker], ['anivoid_logged_in_username', 'Ana'],
        ['anivoid_registered_users', JSON.stringify(state.registeredUsers)], ['anivoid_friends_v2', JSON.stringify(state.friends)],
        ['anivoid_list_v2', JSON.stringify(state.animes)], ['anivoid_sync_base:ana', JSON.stringify(base)]
    ]);
    const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), keys: () => [...values.keys()] };
    cleanBrowserCache(storage); assert.equal(values.has('anivoid_auth_token'), false);
    for (const [key, value] of values) if (key !== 'anivoid_logged_in_username') noPrivateData(JSON.parse(value));
    const animes = JSON.parse(values.get('anivoid_list_v2')), baseline = JSON.parse(values.get('anivoid_sync_base:ana'));
    assert.equal(animes[0].ratings.ana.overall, 9); assert.equal(baseline.animes[0].ratings.ana.overall, 8);
    assert.equal(animes[0].comments[0].replies[0].reply, 'Preservada');
    const merged = sync.mergeClientState({ ...stateResponse(state, 'Ana'), animes }, baseline, stateResponse(sampleState(), 'Ana'), 'Ana');
    assert.equal(merged.animes[0].ratings.ana.overall, 9);
});

test('build security refuses secret values and private dependencies without logging their contents', () => {
    const root = path.resolve(__dirname, '..');
    assert.doesNotThrow(() => assertBrowserInputs(root, { [path.join(root, 'frontend/account/request.js')]: {} }));
    assert.throws(() => assertBrowserInputs(root, { [path.join(root, 'backend/cloudflare/sessions.js')]: {} }), /private server module/);
    assert.throws(() => assertBrowserInputs(root, { [path.join(root, '../private-account-config.json')]: {} }), /private server module/);
    assert.throws(() => assertNoBrowserSecrets('const leaked="' + marker + '"', { environment: { ADMIN_RESET_KEY: marker } }), error => error.message.includes('ADMIN_RESET_KEY') && !error.message.includes(marker));
    assert.throws(() => assertNoBrowserSecrets('const privateKey="' + marker + '"'), /Credential literal/);
    assert.throws(() => assertNoBrowserSecrets('-----BEGIN PRIVATE KEY-----'), /Private key/);
    assert.doesNotThrow(() => assertNoBrowserSecrets('const publicKey="public-email-template-id"'));
    for (const route of ['/assets/config.js', '/assets/app.123.js', '/assets/app.123456789abc.js.map', '/data/state.json', '/.env.production', '/covers/%252e%252e%252f.env']) assert.equal(classifyPublicPath(route).allowed, false);
    for (const route of ['/assets/ui.123456789abc.js', '/assets/tailwind.123456789abc.css', '/api/users']) assert.equal(classifyPublicPath(route).allowed, true);
});
