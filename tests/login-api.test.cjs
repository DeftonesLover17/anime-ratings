const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { startNodeServer } = require('./helpers/node-server.cjs');
const { createLoginClient } = require('../frontend/account/login-client');
const identity = require('../shared/security/identity');
const policy = require('../shared/security/policy');
const api = loadCloudflare();
const origin = 'https://anime-ratings.pages.dev';

async function fixture(t, { password = '  LiteralFixture123  ', forced = false, cookieAllowed = true } = {}) {
    const db = sqliteD1(), env = { ANIVOID_DB: db };
    t.after(() => db.sqlite.close());
    const state = await api.readState(env);
    const user = { username: 'Ana', email: 'ana@example.invalid', friends: [] };
    await api.setPassword(user, password);
    user.passwordResetRequired = forced;
    state.registeredUsers.push(user);
    await api.writeState(env, state);
    let cookie = '';
    async function send(path, options = {}) {
        const response = await api.onRequest({ env, request: new Request(origin + path, {
            ...options,
            headers: { Origin: origin, 'CF-Connecting-IP': '192.0.2.17', ...(cookie ? { Cookie: cookie } : {}), ...options.headers }
        }) });
        if (cookieAllowed && response.headers.has('Set-Cookie')) cookie = response.headers.get('Set-Cookie').split(';')[0];
        return response;
    }
    const client = createLoginClient({ fetch: send, setTimeout, clearTimeout });
    return { db, env, state, user, client, send };
}

test('real Cloudflare routes accept exact passwords by username/email and never accept trimmed passwords', async t => {
    const { client, send } = await fixture(t);
    await assert.rejects(client.login('Ana', 'LiteralFixture123'), /incorretos/);
    const result = await client.login(' ANA@EXAMPLE.INVALID ', '  LiteralFixture123  ');
    assert.equal(result.user.username, 'Ana');
    assert.equal(result.state.viewerUsername, 'Ana');
    assert.equal(result.user.passwordSaltEncoding, undefined);
    assert.equal((await (await send('/api/get-state')).json()).viewerUsername, 'Ana');
});

test('real login detects a cookie rejected by the browser', async t => {
    const { client } = await fixture(t, { cookieAllowed: false });
    await assert.rejects(client.login('Ana', '  LiteralFixture123  '), { code: 'COOKIE_REQUIRED' });
});

test('temporary credentials require reset, then the new exact password logs in and the temporary password stops working', async t => {
    const { client, send } = await fixture(t, { forced: true });
    await assert.rejects(client.login('Ana', '  LiteralFixture123  '), { code: 'PASSWORD_RESET_REQUIRED' });
    await assert.rejects(client.login('Ana', 'WrongPassword123'), /incorretos/);
    const result = await client.resetAndLogin('Ana', '  LiteralFixture123  ', ' NewPersonalFixture123 ');
    assert.equal(result.user.username, 'Ana');
    assert.equal((await (await send('/api/users')).json()).viewerUsername, 'Ana');
    await assert.rejects(client.login('Ana', '  LiteralFixture123  '), /incorretos/);
});

test('legacy Node salt format stays valid in Cloudflare without rewriting credentials on a read', async t => {
    const { client, env, user, state } = await fixture(t);
    user.passwordHash = crypto.pbkdf2Sync('LegacyFixture123', user.passwordSalt, 100000, 32, 'sha256').toString('base64');
    delete user.passwordSaltEncoding;
    await api.writeState(env, state);
    const before = JSON.stringify((await api.readState(env)).registeredUsers[0]);
    assert.equal((await client.login('Ana', 'LegacyFixture123')).user.username, 'Ana');
    assert.equal(JSON.stringify((await api.readState(env)).registeredUsers[0]), before);
});

test('credentials above the actual Workers iteration ceiling return an actionable reset response instead of a 500', async t => {
    const { client, state, user, env } = await fixture(t);
    user.passwordIterations = 100001;
    await api.writeState(env, state);
    await assert.rejects(client.login('Ana', '  LiteralFixture123  '), { code: 'LEGACY_PASSWORD_RESET_ADMIN_REQUIRED' });
});

test('expired sessions become anonymous and a different tab cannot sync the previous account snapshot', async t => {
    const { client, db, send, state } = await fixture(t);
    await client.login('Ana', '  LiteralFixture123  ');
    const response = await send('/api/sync-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        viewerUsername: 'Bruno', baseState: state, localState: state
    }) });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'SESSION_CHANGED');
    db.sqlite.prepare('UPDATE auth_sessions SET expires_at = ?').run(Date.now() - 1);
    const expired = await (await send('/api/users')).json();
    assert.equal(expired.viewerUsername, '');
    assert.equal(expired.registeredUsers[0].email, undefined);
});

test('registration and email changes cannot make another account login identifier ambiguous', () => {
    const state = { registeredUsers: [{ username: 'Ana', email: 'ana@example.invalid' }, { username: 'another@example.invalid', email: 'different@example.invalid' }] };
    assert.ok(identity.registrationError(state, { username: 'ana@example.invalid', email: 'unique@example.invalid' }));
    assert.ok(identity.registrationError(state, { username: 'Unique', email: 'another@example.invalid' }));
    assert.throws(() => policy.profilePatch(state.registeredUsers[0], { email: 'another@example.invalid' }, state.registeredUsers), { code: 'EMAIL_UNAVAILABLE' });
});

test('Node login accepts Cloudflare hashes and correctly exposes the forced reset flow', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    const user = state.registeredUsers.find(user => user.username === 'Ana');
    await api.setPassword(user, ' CloudflareFixture123 ');
    user.passwordResetRequired = true;
    await fs.writeFile(stateFile, JSON.stringify(state));
    const blocked = await send('/api/login', { identifier: 'Ana', password: ' CloudflareFixture123 ' });
    assert.equal(blocked.status, 426);
    assert.equal((await blocked.json()).code, 'PASSWORD_RESET_REQUIRED');
    const reset = await send('/api/account/change-password-forced', { email: 'Ana', oldPassword: ' CloudflareFixture123 ', newPassword: ' ReplacementFixture123 ' });
    assert.equal(reset.status, 200);
    const login = await send('/api/login', { identifier: 'Ana', password: ' ReplacementFixture123 ' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    const confirmed = await send('/api/users', undefined, cookie);
    assert.equal(confirmed.status, 200);
    assert.equal((await confirmed.json()).viewerUsername, 'Ana');
    assert.equal((await login.json()).user.username, 'Ana');
    const current = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    const db = sqliteD1(), env = { ANIVOID_DB: db };
    t.after(() => db.sqlite.close());
    await api.readState(env);
    current.revision = 0;
    await api.writeState(env, current);
    const cloudflare = await api.onRequest({ env, request: new Request(origin + '/api/login', {
        method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'Ana', password: ' ReplacementFixture123 ' })
    }) });
    assert.equal(cloudflare.status, 200);
});
