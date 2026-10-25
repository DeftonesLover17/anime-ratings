const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccountSession } = require('../frontend/account/session');
test('logout waits for server revocation, deduplicates clicks and removes private caches without removing ratings', async () => {
    const storage = new Map([
        ['anivoid_registered_users', 'private'],
        ['anivoid_friends_v2', 'private'],
        ['anivoid_list_v2', 'ratings'],
        ['anivoid_color_scheme', 'light']
    ]);
    let release,
        requests = 0,
        reloads = 0,
        cleared = 0;
    const browser = {
        fetch: async (path, options) => {
            assert.equal(path, '/api/logout');
            assert.equal(options.credentials, 'same-origin');
            requests++;
            await new Promise((resolve) => {
                release = resolve;
            });
            return { ok: true, json: async () => ({ success: true }) };
        },
        location: {
            reload() {
                reloads++;
            }
        },
        localStorage: { removeItem: (key) => storage.delete(key) }
    };
    const session = createAccountSession(browser);
    const first = session.logout(() => cleared++),
        second = session.logout(() => cleared++);
    assert.equal(requests, 1);
    assert.equal(reloads, 0);
    assert.equal(cleared, 0);
    assert.equal(first, second);
    release();
    await first;
    assert.equal(reloads, 1);
    assert.equal(cleared, 1);
    assert.equal(storage.has('anivoid_registered_users'), false);
    assert.equal(storage.get('anivoid_list_v2'), 'ratings');
    assert.equal(storage.get('anivoid_color_scheme'), 'light');
});
test('a failed server logout remains visible as a failure and can be retried', async () => {
    let success = false,
        reloads = 0,
        cleared = 0;
    const browser = {
        fetch: async () => ({
            ok: success,
            json: async () =>
                success ? { success: true } : { error: 'Indisponível' }
        }),
        location: {
            reload() {
                reloads++;
            }
        },
        localStorage: { removeItem() {} }
    };
    const session = createAccountSession(browser);
    await assert.rejects(
        session.logout(() => cleared++),
        /Indisponível/
    );
    assert.equal(cleared, 0);
    assert.equal(reloads, 0);
    success = true;
    await session.logout(() => cleared++);
    assert.equal(cleared, 1);
    assert.equal(reloads, 1);
});
