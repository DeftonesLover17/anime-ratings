const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoginClient } = require('../frontend/account/login-client');
const { bindLoginForm } = require('../frontend/account/login-form');
const { createAccountStorage } = require('../frontend/account/storage');
const { createAccountSession } = require('../frontend/account/session');
const reply = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers });
const browserFor = fetch => ({ fetch, setTimeout, clearTimeout });

test('login preserves the exact password, trims only the identifier and confirms the HttpOnly session', async () => {
    const calls = [];
    const client = createLoginClient(browserFor(async (path, options) => {
        calls.push([path, options]);
        return path === '/api/login' ? reply({ user: { username: 'Ana' }, state: {} }) : reply({ viewerUsername: 'Ana' });
    }));
    const result = await client.login('  ANA  ', '  LiteralPassword123  ');
    assert.equal(result.user.username, 'Ana');
    assert.deepEqual(JSON.parse(calls[0][1].body), { identifier: 'ANA', password: '  LiteralPassword123  ' });
    assert.equal(calls[1][0], '/api/users');
    assert.ok(calls.every(([, options]) => options.credentials === 'include' && options.cache === 'no-store'));
});

test('blocked cookies or a different account never produce a successful login', async () => {
    for (const viewerUsername of ['', 'Bruno']) {
        const client = createLoginClient(browserFor(async path => path === '/api/login'
            ? reply({ user: { username: 'Ana' } }) : reply({ viewerUsername })));
        await assert.rejects(client.login('Ana', 'Password123'), { code: 'COOKIE_REQUIRED' });
    }
});

test('login uses permissions from cookie confirmation and ignores an earlier privilege claim', async () => {
    const client = createLoginClient(browserFor(async path => path === '/api/login'
        ? reply({ user: { username: 'Ana' }, viewerPermissions: { canManageSystem: true } })
        : reply({ viewerUsername: 'Ana', viewerPermissions: { canManageSystem: false } })));
    assert.deepEqual((await client.login('Ana', 'Password123')).viewerPermissions, { canManageSystem: false });
});

test('timeouts bound a stalled fetch or stalled response body and abort the request', async () => {
    for (const stalledBody of [false, true]) {
        let signal;
        const client = createLoginClient(browserFor(async (_, options) => {
            signal = options.signal;
            if (stalledBody) return { ok: true, status: 200, json: () => new Promise(() => {}) };
            return new Promise(() => {});
        }), { timeoutMs: 15 });
        await assert.rejects(client.login('Ana', 'Password123'), { code: 'TIMEOUT' });
        assert.equal(signal.aborted, true);
    }
});

test('rate limits, network errors, server errors and malformed responses are distinct and retryable', async () => {
    const scenarios = [
        [() => reply({ error: 'Limit' }, 429, { 'Retry-After': '61' }), /2 minuto/],
        [() => { throw new TypeError('Failed to fetch'); }, /Confira sua internet/],
        [() => reply({ error: 'Internal sensitive details' }, 500), /indisponível/],
        [() => new Response('<html>error</html>'), /resposta inválida/],
        [() => reply({ success: true }), /resposta inválida/],
        [() => reply({ error: 'Credenciais inválidas' }, 401), /Credenciais inválidas/]
    ];
    for (const [fetch, expected] of scenarios) {
        await assert.rejects(createLoginClient(browserFor(fetch)).login('Ana', 'Password123'), expected);
    }
});

test('required password reset is preserved and a completed reset cannot be mistaken for failure to change it', async () => {
    let changed = false;
    const client = createLoginClient(browserFor(async path => {
        if (path.endsWith('change-password-forced')) { changed = true; return reply({ success: true }); }
        return reply({ error: 'Reset', code: 'PASSWORD_RESET_REQUIRED' }, 426);
    }));
    await assert.rejects(client.login('Ana', 'Temporary123'), { code: 'PASSWORD_RESET_REQUIRED' });
    await assert.rejects(client.resetAndLogin('Ana', 'Temporary123', 'Replacement123'), { code: 'PASSWORD_CHANGED' });
    assert.equal(changed, true);
});

test('storage denial and quota exhaustion do not interrupt a session or resurrect removed data', () => {
    const stored = new Map([['anivoid_logged_in_username', 'Stale'], ['existing', 'old']]);
    const browser = { localStorage: {
        getItem: key => stored.get(key) ?? null,
        setItem() { throw new Error('QuotaExceededError'); },
        removeItem() { throw new Error('SecurityError'); }
    } };
    const cache = createAccountStorage(browser);
    cache.setItem('existing', 'latest');
    assert.equal(cache.getItem('existing'), 'latest');
    cache.removeItem('existing');
    assert.equal(cache.getItem('existing'), null);
    const session = createAccountSession(browser, cache);
    assert.equal(session.username(), '');
    assert.equal(session.needsLogin(), true);
    const old = session.version();
    session.invalidatePending();
    assert.equal(session.isCurrent(old), false);
    session.acceptUsername('Ana');
    assert.equal(session.username(), 'Ana');
    session.acceptUsername('');
    assert.equal(session.username(), '');
    const denied = createAccountStorage({ get localStorage() { throw new Error('Blocked'); } });
    denied.setItem('local', 'works');
    assert.equal(denied.getItem('local'), 'works');
});

function formFixture(client, onAuthenticated = () => {}) {
    let focused = '';
    const elements = Object.fromEntries(['login-form', 'login-email', 'login-password', 'login-reset-fields', 'login-new-password', 'login-confirm-password', 'login-status', 'submit', 'tab-login', 'tab-register', 'toggle-to-login', 'toggle-to-register'].map(id => [id, {
        dataset: {}, value: '', disabled: false, hidden: false, textContent: '',
        listeners: {},
        addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        async emit(type) { await Promise.all((this.listeners[type] || []).map(fn => fn({ preventDefault() {} }))); },
        focus() { focused = id; },
        setAttribute(name, value) { this[name] = value; }
    }]));
    elements['login-form'].querySelector = () => elements.submit;
    const browser = { document: { getElementById: id => elements[id] } };
    let attempts = 0;
    const session = { invalidatePending() { attempts++; } };
    bindLoginForm(browser, { client, session, onAuthenticated });
    return { elements, browser, session, focused: () => focused, attempts: () => attempts };
}

test('the login form deduplicates Enter/click, shows busy state, restores controls after errors and can retry', async () => {
    let release, calls = 0, successes = 0;
    const fixture = formFixture({ login: async () => {
        calls++;
        if (calls === 1) await new Promise(resolve => { release = resolve; });
        if (calls === 1) throw new Error('Wrong password');
        return { user: { username: 'Ana' } };
    } }, () => successes++);
    const { elements: el } = fixture;
    el['login-email'].value = 'Ana'; el['login-password'].value = 'Password123';
    bindLoginForm(fixture.browser, { client: {}, session: fixture.session, onAuthenticated() {} });
    const first = el['login-form'].emit('submit');
    await el['login-form'].emit('submit');
    assert.equal(calls, 1); assert.equal(el.submit.disabled, true); assert.equal(el['tab-register'].disabled, true);
    release(); await first;
    assert.equal(el.submit.disabled, false); assert.equal(el['tab-register'].disabled, false);
    assert.equal(el['login-status'].textContent, 'Wrong password');
    assert.equal(fixture.focused(), 'login-status');
    await el['login-form'].emit('submit');
    assert.equal(successes, 1); assert.equal(el['login-password'].value, '');
    assert.equal(fixture.attempts(), 2);
});

test('required reset uses masked confirmation fields, validates before sending and clears secrets after success', async () => {
    let resets = 0, success = false;
    const fixture = formFixture({
        async login() { throw Object.assign(new Error('Reset'), { code: 'PASSWORD_RESET_REQUIRED' }); },
        async resetAndLogin(identifier, current, replacement) {
            assert.equal(identifier, 'Ana'); assert.equal(current, 'Temporary123'); assert.equal(replacement, ' NewPassword123 ');
            resets++; return { user: { username: 'Ana' } };
        }
    }, () => { success = true; });
    const el = fixture.elements;
    el['login-email'].value = 'Ana'; el['login-password'].value = 'Temporary123';
    await el['login-form'].emit('submit');
    assert.equal(el['login-reset-fields'].hidden, false);
    assert.equal(el['login-new-password'].required, true);
    assert.equal(fixture.focused(), 'login-new-password');
    el['login-new-password'].value = ' NewPassword123 ';
    el['login-confirm-password'].value = 'Mismatch123';
    await el['login-form'].emit('submit');
    assert.equal(resets, 0); assert.match(el['login-status'].textContent, /coincidem/);
    el['login-confirm-password'].value = ' NewPassword123 ';
    await el['login-form'].emit('submit');
    assert.equal(resets, 1); assert.equal(success, true);
    assert.equal(el['login-reset-fields'].hidden, true);
    assert.equal(el['login-new-password'].value, '');
    assert.equal(el['login-confirm-password'].value, '');
});
