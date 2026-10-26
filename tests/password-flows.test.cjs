const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { startNodeServer } = require('./helpers/node-server.cjs');
const { createProfileClient } = require('../frontend/account/profile-client');
const { bindProfileForm } = require('../frontend/account/profile-form');
const { createLoginClient } = require('../frontend/account/login-client');
const origin = 'https://anime-ratings.pages.dev';
const original = 'LocalFixtureOnly123';
const replacement = ' ReplacementFixture123 ';
const api = loadCloudflare();

async function backend(t, type, forced = false) {
    if (type === 'Node') return startNodeServer(t);
    const db = sqliteD1(), env = { ANIVOID_DB: db };
    t.after(() => db.sqlite.close());
    const state = await api.readState(env);
    const user = { username: 'Ana', email: 'ana@example.invalid', color: '#123456', friends: [] };
    await api.setPassword(user, original); user.passwordResetRequired = forced;
    state.registeredUsers.push(user);
    state.animes = [{ id: 'a1', title: 'Fixture', ratings: { ana: { overall: 8 } }, comments: [] }];
    await api.writeState(env, state);
    return { db, env, send: (path, body, cookie = '') => api.onRequest({ env, request: new Request(origin + path, {
        method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.30', Cookie: cookie },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }) }) };
}

for (const type of ['Cloudflare', 'Node']) {
    test(type + ': profile, email and exact password commit together; invalid input cannot partially save', async t => {
        const { send } = await backend(t, type);
        const login = await send('/api/login', { identifier: 'Ana', password: original }); assert.equal(login.status, 200);
        const oldCookie = login.headers.get('Set-Cookie').split(';')[0];
        const before = await (await send('/api/get-state', undefined, oldCookie)).json();
        const me = before.registeredUsers.find(user => user.username === 'Ana');
        for (const [currentPassword, newPassword, expected] of [['WrongFixture123', replacement, 403], [original, 'short', 400], [original, original, 400]]) {
            const failed = await send('/api/patch-user', { username: 'Ana', fields: { color: '#abcdef', email: 'changed@example.invalid' }, currentPassword, newPassword }, oldCookie);
            assert.equal(failed.status, expected);
            const user = (await (await send('/api/users', undefined, oldCookie)).json()).registeredUsers.find(user => user.username === 'Ana');
            assert.equal(user.email, me.email); assert.equal(user.color, me.color);
        }
        const saved = await send('/api/patch-user', { username: 'Ana', fields: { email: 'changed@example.invalid', color: '#abcdef' }, currentPassword: original, newPassword: replacement }, oldCookie);
        assert.equal(saved.status, 200); assert.equal((await saved.json()).credentialsChanged, true);
        const newCookie = saved.headers.get('Set-Cookie').split(';')[0]; assert.notEqual(newCookie, oldCookie);
        assert.equal((await (await send('/api/users', undefined, oldCookie)).json()).viewerUsername, '');
        const after = await (await send('/api/get-state', undefined, newCookie)).json();
        assert.equal(after.viewerUsername, 'Ana'); assert.deepEqual(after.animes.map(anime => anime.ratings), before.animes.map(anime => anime.ratings));
        assert.equal(after.registeredUsers.find(user => user.username === 'Ana').email, 'changed@example.invalid');
        assert.equal((await send('/api/login', { identifier: 'Ana', password: original })).status, 401);
        assert.equal((await send('/api/login', { identifier: 'Ana', password: replacement.trim() })).status, 401);
        assert.equal((await send('/api/login', { identifier: 'changed@example.invalid', password: replacement })).status, 200);
        assert.equal((await send('/api/patch-user', { username: 'Ana', fields: {} }, oldCookie)).status, 401);
    });

    test(type + ': ordinary accounts cannot use the unauthenticated temporary-password endpoint', async t => {
        const { send } = await backend(t, type);
        const response = await send('/api/account/change-password-forced', { email: 'Ana', oldPassword: original, newPassword: replacement });
        assert.equal(response.status, 409); assert.equal((await response.json()).code, 'PASSWORD_RESET_NOT_REQUIRED');
        assert.equal((await send('/api/login', { identifier: 'Ana', password: original })).status, 200);
    });
}

test('a temporary password cannot be reused to bypass the required personal password', async t => {
    const { send } = await backend(t, 'Cloudflare', true);
    const response = await send('/api/account/change-password-forced', { email: 'Ana', oldPassword: original, newPassword: original });
    assert.equal(response.status, 400);
    assert.equal((await send('/api/login', { identifier: 'Ana', password: original })).status, 426);
    assert.equal((await send('/api/account/change-password-forced', { email: 'Ana', oldPassword: original, newPassword: replacement })).status, 200);
    assert.equal((await send('/api/login', { identifier: 'Ana', password: replacement })).status, 200);
});

test('profile client requires a real success and a renewed cookie; errors never report an unconfirmed password as saved', async () => {
    const values = { username: 'Ana', fields: { color: '#123456' }, currentPassword: original, newPassword: replacement };
    let calls = 0;
    const client = createProfileClient({ setTimeout, clearTimeout, fetch: async (path, options) => {
        calls++;
        if (path === '/api/patch-user') { assert.equal(JSON.parse(options.body).newPassword, replacement); return new Response(JSON.stringify({ success: true, user: { username: 'Ana' } })); }
        return new Response(JSON.stringify({ viewerUsername: '', registeredUsers: [] }));
    } });
    await assert.rejects(client.save(values), { code: 'PROFILE_SAVED_SESSION_REQUIRED', saved: true }); assert.equal(calls, 2);
    for (const fetch of [async () => { throw new Error('offline'); }, async () => new Response('{}'), async () => new Response('{}', { status: 500 }), async () => new Promise(() => {})]) {
        const uncertain = createProfileClient({ fetch, setTimeout, clearTimeout }, { timeoutMs: 10 });
        await assert.rejects(uncertain.save(values), { code: 'CHANGE_UNCONFIRMED' });
    }
});

test('an interrupted temporary-password change explains how to recover without silently resending it', async () => {
    let calls = 0;
    const client = createLoginClient({ setTimeout, clearTimeout, fetch: async () => { calls++; throw new Error('offline'); } });
    await assert.rejects(client.resetAndLogin('Ana', original, replacement), { code: 'CHANGE_UNCONFIRMED' });
    assert.equal(calls, 1);
});

function formFixture(save) {
    const nodes = {}, ids = ['edit-profile-form', 'edit-profile-modal', 'edit-profile-current-password', 'edit-profile-new-password', 'edit-profile-confirm-password', 'edit-profile-status', 'edit-profile-email', 'close-edit-profile', 'submit'];
    let focused, username = 'Ana', successes = 0;
    for (const id of ids) nodes[id] = { id, value: '', textContent: '', hidden: false, disabled: false, dataset: {}, listeners: {}, classList: { contains: () => false },
        setAttribute() {}, focus() { focused = id; }, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        async emit(type) { await Promise.all((this.listeners[type] || []).map(fn => fn({ preventDefault() {} }))); }
    };
    const form = nodes['edit-profile-form']; form.querySelector = () => nodes.submit; form.querySelectorAll = () => ids.filter(id => /password$/.test(id) || id === 'submit').map(id => nodes[id]);
    nodes['edit-profile-modal'].dataset.editUsername = 'Ana'; nodes['edit-profile-email'].value = 'ana@example.invalid';
    const controller = bindProfileForm({ document: { getElementById: id => nodes[id] } }, { client: { save }, getUsername: () => username, readFields: () => ({ color: '#123456' }), onSaved: () => { successes++; } });
    controller.begin();
    return { nodes, form, controller, focused: () => focused, successes: () => successes, changeSession: () => { username = 'Bruno'; } };
}

test('profile form preserves spaces, validates confirmation, deduplicates submits and keeps errors visible', async () => {
    let release, calls = 0;
    const f = formFixture(async payload => { calls++; assert.equal(payload.currentPassword, ' CurrentFixture123 '); assert.equal(payload.newPassword, replacement); await new Promise(resolve => release = resolve); throw new Error('Senha atual incorreta.'); });
    f.nodes['edit-profile-current-password'].value = ' CurrentFixture123 '; f.nodes['edit-profile-new-password'].value = replacement;
    f.nodes['edit-profile-confirm-password'].value = 'mismatch'; await f.form.emit('submit'); assert.equal(calls, 0);
    f.nodes['edit-profile-confirm-password'].value = replacement;
    const first = f.form.emit('submit'); await f.form.emit('submit'); assert.equal(calls, 1); assert.equal(f.controller.busy, true);
    release(); await first;
    assert.equal(f.successes(), 0); assert.equal(f.controller.busy, false); assert.equal(f.nodes.submit.disabled, false);
    assert.match(f.nodes['edit-profile-status'].textContent, /incorreta/); assert.equal(f.focused(), 'edit-profile-status');
});

test('profile edits block stale refreshes and a response cannot restore another signed-in account', async () => {
    let release;
    const f = formFixture(async () => new Promise(resolve => release = resolve));
    const token = f.controller.begin(); assert.equal(f.controller.canRefresh(token), true);
    await f.form.emit('input'); assert.equal(f.controller.canRefresh(token), false);
    const pending = f.form.emit('submit'); f.changeSession(); release({ success: true, user: { username: 'Ana' } }); await pending;
    assert.equal(f.successes(), 0); assert.match(f.nodes['edit-profile-status'].textContent, /sessão mudou/);
});

test('a confirmed profile save clears every password field and sends no unchanged email', async () => {
    let calls = 0;
    const f = formFixture(async payload => {
        calls++; assert.equal(Object.hasOwn(payload.fields, 'email'), false);
        assert.equal(payload.newPassword, replacement); return { success: true, user: { username: 'Ana' } };
    });
    f.nodes['edit-profile-current-password'].value = original;
    f.nodes['edit-profile-new-password'].value = f.nodes['edit-profile-confirm-password'].value = replacement;
    await f.form.emit('submit'); assert.equal(calls, 1); assert.equal(f.successes(), 1);
    for (const id of ['current-password', 'new-password', 'confirm-password']) assert.equal(f.nodes['edit-profile-' + id].value, '');
    assert.equal(f.nodes.submit.disabled, false);
});
