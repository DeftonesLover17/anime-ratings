const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const syncTools = require('../shared/sync-state');
const api = require('./helpers/cloudflare.cjs').loadCloudflare();

function fixture() {
    return {
        revision: 0,
        friends: [],
        studioLogos: {},
        featuredAnimeId: null,
        registeredUsers: [
            { username: 'Felipe!', friends: ['Ana'], friendRequests: [], notifications: [{ id: 'n1', title: 'Nova atividade' }] },
            { username: 'Ana', friends: ['Felipe!'], friendRequests: [{ from: 'Bruno', timestamp: '2026-01-01T00:00:00Z' }], notifications: [] },
            { username: 'Bruno', friends: [], friendRequests: [], notifications: [] }
        ],
        animes: [{
            id: 'anime-1', title: 'Anime', ratings: { ana: { overall: 9, status: 'Watching' } },
            comments: [{ id: 'comment-1', friendId: 'ana', comment: 'Gostei', replies: [{ id: 'reply-1', friendId: 'bruno', reply: 'Tambem' }] }]
        }],
        activities: [{ id: 'activity-1', username: 'Ana', animeId: 'anime-1', animeTitle: 'Anime', type: 'rating', details: 'avaliou' }]
    };
}

// Only the D1 statements used by state reads/writes, registration and login are
// modeled here. Unexpected SQL fails instead of silently hiding a regression.
class MemoryD1 {
    constructor(state) {
        this.state = JSON.stringify(state);
        this.sessions = new Map();
        this.authSessions = new Map();
        this.limits = new Map();
        this.backups = [];
    }

    prepare(sql) {
        const db = this;
        return {
            args: [],
            bind(...args) { this.args = args; return this; },
            async run() {
                const args = this.args;
                if (sql.startsWith('CREATE ')) return { success: true };
                if (sql.startsWith('INSERT INTO app_state')) {
                    if (!sql.includes('DO NOTHING') || !db.state) db.state = args[0];
                } else if (sql.startsWith('UPDATE app_state')) {
                    if (db.beforeUpdate) { const hook = db.beforeUpdate; db.beforeUpdate = null; hook(); }
                    if ((Number(JSON.parse(db.state).revision) || 0) !== args[1]) return { success: true, meta: { changes: 0 } };
                    db.state = args[0];
                    return { success: true, meta: { changes: 1 } };
                } else if (sql.startsWith('INSERT INTO state_backups')) {
                    db.backups.push({ reason: args[0], state: args[1], created_at: new Date().toISOString() });
                } else if (sql.startsWith('INSERT INTO auth_sessions')) {
                    db.authSessions.set(args[0],{token_hash:args[0],account_id:args[1],username:args[2],credential_version:args[3],created_at:args[4],expires_at:args[5]});
                } else if (sql.startsWith('UPDATE auth_sessions')) {
                    if(db.authSessions.has(args[1])) db.authSessions.get(args[1]).expires_at=args[0];
                } else if (sql.startsWith('DELETE FROM auth_sessions')) {
                    for(const [key,row] of db.authSessions) if(sql.includes('token_hash')?key===args[0]:sql.includes('username')?row.username===args[0]:sql.includes('expires_at')?row.expires_at<args[0]:true) db.authSessions.delete(key);
                } else if (sql.startsWith('INSERT INTO sessions')) {
                    db.sessions.set(args[0], { username: args[1], expires_at: args[2] });
                } else if (sql.startsWith('INSERT INTO rate_limits')) {
                    db.limits.set(args[0], { count: 1, reset_at: args[1] });
                } else if (sql.startsWith('UPDATE rate_limits')) {
                    db.limits.get(args[0]).count++;
                } else if (sql.startsWith('UPDATE sessions')) {
                    db.sessions.get(args[1]).expires_at = args[0];
                } else if (!sql.startsWith('DELETE FROM state_backups') && !sql.startsWith('DELETE FROM rate_limits')) {
                    throw new Error('Unexpected SQL: ' + sql);
                }
                return { success: true };
            },
            async first() {
                if (sql.startsWith('INSERT INTO rate_limits')) {
                    const [key, resetAt, now, cap] = this.args;
                    const previous = db.limits.get(key);
                    const next = !previous || previous.reset_at <= now ? {count:1,reset_at:resetAt} : {count:Math.min(previous.count+1,cap),reset_at:previous.reset_at};
                    db.limits.set(key,next); return next;
                }
                if (sql.startsWith('SELECT state FROM app_state')) return { state: db.state };
                if (sql.startsWith('SELECT created_at FROM state_backups')) return db.backups.at(-1) || null;
                if (sql.startsWith('SELECT count, reset_at FROM rate_limits')) return db.limits.get(this.args[0]) || null;
                if (sql.startsWith('SELECT * FROM auth_sessions')) return db.authSessions.get(this.args[0]) || null;
                if (sql.startsWith('SELECT username, expires_at FROM sessions')) return db.sessions.get(this.args[0]) || null;
                throw new Error('Unexpected SQL: ' + sql);
            }
        };
    }
}

function assertCommunityPreserved(state) {
    assert.deepEqual(state.registeredUsers.map(user => user.username), ['Felipe!', 'Ana', 'Bruno']);
    assert.deepEqual(state.registeredUsers[0].friends, ['Ana']);
    assert.equal(state.registeredUsers[0].notifications[0].title, 'Nova atividade');
    assert.equal(state.registeredUsers[1].friendRequests[0].from, 'Bruno');
    assert.equal(state.animes[0].ratings.ana.overall, 9);
    assert.equal(state.animes[0].comments[0].friendId, 'ana');
    assert.equal(state.animes[0].comments[0].replies[0].friendId, 'bruno');
    assert.equal(state.activities[0].username, 'Ana');
}

test('Cloudflare state reads preserve every user and session without rewriting stored data', async () => {
    const original = fixture();
    const db = new MemoryD1(original);
    db.sessions.set('ana-session', { username: 'Ana', expires_at: Date.now() + 60000 });
    const state = await api.readState({ ANIVOID_DB: db });
    assertCommunityPreserved(state);
    assert.deepEqual(JSON.parse(db.state), original);
    assert.ok(db.sessions.has('ana-session'));
});

test('Cloudflare state writes preserve community data and notifications', async () => {
    const db = new MemoryD1(fixture());
    await api.writeState({ ANIVOID_DB: db }, fixture());
    assertCommunityPreserved(JSON.parse(db.state));
});

test('a new member persists after registration and can log in again', async () => {
    const db = new MemoryD1(fixture());
    const env = { ANIVOID_DB: db };
    const registration = await api.handleRegister(new Request('https://example.invalid/api/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'Carla', email: 'carla@example.invalid', password: 'FixturePassword123' })
    }), env);
    assert.equal(registration.status, 200);
    assert.equal((await registration.json()).success, true);
    assert.ok(JSON.parse(db.state).registeredUsers.some(user => user.username === 'Carla'));
    const login = await api.handleLogin(new Request('https://example.invalid/api/login', {
        method: 'POST', body: JSON.stringify({ identifier: 'Carla', password: 'FixturePassword123' })
    }), env);
    assert.equal(login.status, 200);
    assert.equal((await login.json()).user.username, 'Carla');
});

test('frontend snapshots keep other members, their reviews and activities', () => {
    const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    const snapshotSource = source.slice(source.indexOf('function applyServerStateSnapshot('), source.indexOf('class AppState'));
    const storage = new Map();
    const localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
    const applySnapshot = new Function('localStorage', 'setAuthSession', 'storeRegisteredUsers', 'normalizeProfileId', 'AnivoidSync', 'window',
        snapshotSource + '\nreturn applyServerStateSnapshot;')(
        localStorage, () => {}, users => storage.set('anivoid_registered_users', JSON.stringify(users)), value => value || '', syncTools, {}
    );
    const snapshot = fixture();
    applySnapshot(snapshot);
    assertCommunityPreserved(snapshot);
    assert.deepEqual(JSON.parse(storage.get('anivoid_registered_users')).map(user => user.username), ['Felipe!', 'Ana', 'Bruno']);
    assert.equal(JSON.parse(storage.get('anivoid_list_v2'))[0].ratings.ana.overall, 9);
});

test('legacy Node backend preserves community data when saving', async () => {
    const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
    let storedState = JSON.stringify(fixture());
    const fakeFs = {
        existsSync: () => true,
        readFile: (_file, _encoding, callback) => callback(null, storedState),
        writeFile: (_file, content, _encoding, callback) => { storedState = content; callback(null); }
        ,rename: (_from, _to, callback) => callback(null)
    };
    const fakeRequire = name => {
        if (name === 'dotenv') return { config() {} };
        if (name === 'http') return { createServer: () => ({ listen() {} }) };
        if (name === 'fs') return fakeFs;
        if (name === './shared/sync-state') return syncTools;
        if (name.startsWith('./')) return require(path.join(root, name));
        return require(name);
    };
    const backend = new Function('require', 'process', '__dirname', source + '\nreturn { writeState };')(
        fakeRequire, { env: {} }, root
    );
    await new Promise((resolve, reject) => backend.writeState(copy(fixture()), error => error ? reject(error) : resolve()));
    assertCommunityPreserved(JSON.parse(storedState));
});

test('a stale D1 write is rejected instead of overwriting a committed revision', async () => {
    const db = new MemoryD1(fixture());
    const env = { ANIVOID_DB: db };
    const first = await api.readState(env);
    const stale = await api.readState(env);
    first.animes[0].ratings.ana.overall = 8;
    stale.animes[0].ratings.ana.overall = 6;
    await api.writeState(env, first);
    await assert.rejects(api.writeState(env, stale), { code: 'STATE_CONFLICT' });
    assert.equal(JSON.parse(db.state).animes[0].ratings.ana.overall, 8);
});

test('HTTP sync retries a competing write and keeps edits to different rating fields', async () => {
    const original = fixture();
    const db = new MemoryD1(original);
    const authenticated = await api.readState({ANIVOID_DB:db});
    await api.writeState({ANIVOID_DB:db},authenticated);
    const token = await api.createSession({ANIVOID_DB:db},authenticated.registeredUsers.find(user=>user.username==='Ana'));
    const initialRevision=authenticated.revision;
    const baseState = syncTools.clientSnapshot(original, 'Ana');
    const localState = copy(baseState);
    localState.animes[0].ratings.ana.overall = 8;
    db.beforeUpdate = () => {
        const concurrent = JSON.parse(db.state);
        concurrent.revision = initialRevision + 1;
        concurrent.animes[0].ratings.ana.sound = 7;
        db.state = JSON.stringify(concurrent);
    };
    const response = await api.onRequest({ env: { ANIVOID_DB: db }, request: new Request('https://example.invalid/api/sync-state', {
        method: 'POST', headers: {Cookie:'anivoid_auth_token='+token,Origin:'https://anime-ratings.pages.dev','Content-Type':'application/json'}, body: JSON.stringify({ localState, baseState })
    }) });
    assert.equal(response.status, 200);
    const state = await response.json();
    assert.equal(state.revision, initialRevision + 2);
    assert.equal(state.animes[0].ratings.ana.overall, 8);
    assert.equal(state.animes[0].ratings.ana.sound, 7);
});

test('old clients must refresh before sending a full cached state', async () => {
    const db = new MemoryD1(fixture());
    const before = db.state;
    const response = await api.onRequest({ env: { ANIVOID_DB: db }, request: new Request('https://example.invalid/api/sync-state', {
        method:'POST',headers:{Origin:'https://anime-ratings.pages.dev','Content-Type':'application/json'}, body:JSON.stringify({localState:fixture()})
    }) });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'CLIENT_UPDATE_REQUIRED');
    assert.equal(db.state, before);
});

test('invalid stored JSON fails instead of replacing the catalog with defaults', async () => {
    const db = new MemoryD1(fixture());
    db.state = '{invalid';
    await assert.rejects(api.readState({ ANIVOID_DB: db }), SyntaxError);
    assert.equal(db.state, '{invalid');
});

test('API repairs a confirmed legacy studio on read without rewriting ratings, comments or storage', async () => {
    const original = fixture();
    original.animes[0].title = 'CYBERPUNK: EDGERUNNERS II';
    original.animes[0].studio = 'Desconhecido';
    const db = new MemoryD1(original);
    const response = await api.onRequest({ env: { ANIVOID_DB: db }, request: new Request('https://example.invalid/api/get-state') });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.animes[0].studio, 'Trigger');
    for (const [user, rating] of Object.entries(original.animes[0].ratings)) {
        for (const [field, value] of Object.entries(rating)) assert.deepEqual(result.animes[0].ratings[user][field], value);
    }
    assert.equal(result.animes[0].comments[0].replies[0].friendId, 'bruno');
    assert.deepEqual(JSON.parse(db.state), original);
});
