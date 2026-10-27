const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { loadCloudflare, sqliteD1 } = require('./helpers/cloudflare.cjs');
const { mergeClientState } = require('../shared/sync-state');
const identity = require('../shared/security/identity');
const policy = require('../shared/security/policy');
const {
    createEmailVerification
} = require('../backend/security/email-verification');
const { createD1EmailStore } = require('../backend/cloudflare/email-store');
const api = loadCloudflare();
const origin = 'https://anime-ratings.pages.dev';
const copy = (value) => JSON.parse(JSON.stringify(value));
test('user projections deny unknown secrets and expose private fields only to their owner', () => {
    const user = {
        username: 'Ana',
        email: 'ana@example.invalid',
        accountId: 'account',
        passwordHash: 'hash',
        credentialVersion: 3,
        futureProviderSecret: 'private',
        friendRequests: [{ from: 'Bob' }],
        notifications: [],
        emailVerified: true
    };
    const publicUser = policy.userResponse(user),
        owner = policy.userResponse(user, 'Ana');
    for (const field of [
        'passwordHash',
        'credentialVersion',
        'futureProviderSecret'
    ]) {
        assert.equal(publicUser[field], undefined);
        assert.equal(owner[field], undefined);
    }
    assert.equal(publicUser.email, undefined);
    assert.equal(publicUser.friendRequests, undefined);
    assert.equal(publicUser.emailVerified, false);
    assert.equal(owner.email, user.email);
    assert.equal(owner.accountId, 'account');
});
async function fixture(t) {
    const db = sqliteD1(),
        env = { ANIVOID_DB: db, ADMIN_USERS: 'felipe' };
    t.after(() => db.sqlite.close());
    const state = await api.readState(env);
    for (const username of ['Felipe!', 'Ana', 'Bruno']) {
        const user = {
            username,
            email: identity.legacyId(username) + '@example.invalid',
            friends: [],
            friendRequests: [],
            notifications: []
        };
        await api.setPassword(user, 'LocalFixtureOnly123');
        state.registeredUsers.push(user);
    }
    state.animes = [
        {
            id: 'a1',
            title: 'Fixture',
            ratings: { ana: { overall: 9 } },
            comments: [
                {
                    id: 'review1',
                    friendId: 'ana',
                    comment: 'Original',
                    replies: [
                        {
                            id: 'reply1',
                            friendId: 'ana',
                            reply: 'Original reply'
                        }
                    ]
                }
            ]
        }
    ];
    await api.writeState(env, state);
    const send = (path, body, cookie = '', extra = {}) =>
        api.onRequest({
            env,
            request: new Request(origin + path, {
                method: body === undefined ? 'GET' : 'POST',
                headers: {
                    ...(body === undefined
                        ? {}
                        : {
                              Origin: origin,
                              'Content-Type': 'application/json'
                          }),
                    ...(cookie ? { Cookie: cookie } : {}),
                    'CF-Connecting-IP': '192.0.2.1',
                    ...extra
                },
                ...(body === undefined ? {} : { body: JSON.stringify(body) })
            })
        });
    const login = async (username = 'Ana') => {
        const result = await send('/api/login', {
            identifier: username,
            password: 'LocalFixtureOnly123'
        });
        assert.equal(result.status, 200);
        return result.headers.get('Set-Cookie').split(';')[0];
    };
    return { db, env, state, send, login };
}

test('Cloudflare only accepts a friend request received by the signed-in member', async t => {
    const { env, send, login } = await fixture(t);
    const ana = await login('Ana');
    const felipe = await login('Felipe!');
    const respond = (action, cookie) => send('/api/respond-friend-request', { target: 'Felipe!', action }, cookie);

    assert.equal((await respond('accept', ana)).status, 409);
    assert.equal((await respond('reject', ana)).status, 409);
    assert.equal((await send('/api/send-friend-request', { to: 'Felipe!' }, ana)).status, 200);
    assert.equal((await respond('accept', ana)).status, 409);
    let state = await api.readState(env);
    assert.deepEqual(state.registeredUsers.map(user => user.friends), [[], [], []]);
    assert.deepEqual(state.registeredUsers[0].friendRequests.map(request => request.from), ['Ana']);

    const accepted = await send('/api/respond-friend-request', { target: 'Ana', action: 'accept' }, felipe);
    assert.equal(accepted.status, 200);
    state = await api.readState(env);
    assert.deepEqual(state.registeredUsers.slice(0, 2).map(user => user.friends), [['Ana'], ['Felipe!']]);
    assert.deepEqual(state.registeredUsers[0].friendRequests, []);
});

test('registration rejects administrator aliases and colliding legacy identities without changing data', async (t) => {
    const { env, state, send } = await fixture(t);
    for (const username of ['Feli.pe', 'A.na', 'ana', 'Ana ']) {
        const response = await send('/api/register', {
            username,
            email: 'new@example.invalid',
            password: 'DisposableAudit123'
        });
        assert.equal(response.status, 409);
    }
    assert.equal((await api.readState(env)).registeredUsers.length, 3);
    assert.ok(
        identity.registrationError(
            { registeredUsers: [] },
            { username: 'Feli.pe', email: 'a@example.invalid' },
            {}
        )
    );
    assert.equal(identity.isAdmin(state.registeredUsers[0], env, state), true);
    assert.equal(identity.isAdmin({ username: 'Feli.pe' }, env, state), false);
});

test('legacy identity collisions fail closed and stable account IDs cannot be replaced by a client', async (t) => {
    const { env, state, send, login } = await fixture(t);
    const cookie = await login(),
        id = state.registeredUsers[1].accountId;
    const patch = await send(
        '/api/patch-user',
        {
            username: 'Ana',
            fields: {
                accountId: 'forged',
                emailVerified: true,
                color: '#123456'
            }
        },
        cookie
    );
    assert.equal(patch.status, 200);
    let stored = await api.readState(env);
    assert.equal(stored.registeredUsers[1].accountId, id);
    assert.notEqual(stored.registeredUsers[1].emailVerified, true);
    stored.registeredUsers.push({
        username: 'A.na',
        accountId: crypto.randomUUID(),
        email: 'alias@example.invalid'
    });
    await api.writeState(env, stored);
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: { color: '#ffffff' } },
                cookie
            )
        ).status,
        401
    );
    const local = copy(stored);
    local.registeredUsers[1].color = '#ffffff';
    assert.equal(
        mergeClientState(local, stored, stored, 'A.na').registeredUsers[1]
            .color,
        '#123456'
    );
});

test('ordinary members cannot steal existing review or reply IDs even with forged ownership and baseline', async (t) => {
    const { env, state, send, login } = await fixture(t),
        cookie = await login('Bruno');
    const local = copy(state),
        base = copy(state);
    for (const snapshot of [local, base]) {
        snapshot.animes[0].comments[0].friendId = 'bruno';
        snapshot.animes[0].comments[0].replies[0].friendId = 'bruno';
    }
    local.animes[0].comments[0].comment = 'Stolen';
    local.animes[0].comments[0].replies[0].reply = 'Stolen reply';
    assert.equal(
        (
            await send(
                '/api/sync-state',
                { localState: local, baseState: base },
                cookie
            )
        ).status,
        200
    );
    const review = (await api.readState(env)).animes[0].comments[0];
    assert.equal(review.friendId, 'ana');
    assert.equal(review.comment, 'Original');
    assert.equal(review.replies[0].friendId, 'ana');
    assert.equal(review.replies[0].reply, 'Original reply');
});

test('logout revokes the actual server session, expires its cookie and is idempotent', async (t) => {
    const { send, login, db } = await fixture(t),
        cookie = await login();
    const row = db.sqlite.prepare('SELECT token_hash FROM auth_sessions').get();
    assert.equal(row.token_hash.length, 64);
    assert.ok(!cookie.includes(row.token_hash));
    const loggedOut = await send('/api/logout', {}, cookie);
    assert.equal(loggedOut.status, 200);
    assert.match(loggedOut.headers.get('Set-Cookie'), /Max-Age=0/);
    assert.equal(
        (await send('/api/patch-user', { username: 'Ana', fields: {} }, cookie))
            .status,
        401
    );
    assert.equal((await send('/api/logout', {}, cookie)).status, 200);
});

test('password changes require server reauthentication and rotate every old session', async (t) => {
    const { send, login } = await fixture(t),
        first = await login(),
        second = await login();
    for (const currentPassword of [undefined, 'Incorrect123']) {
        assert.equal(
            (
                await send(
                    '/api/account/change-password',
                    { password: 'ReplacementAudit123', currentPassword },
                    first
                )
            ).status,
            403
        );
    }
    assert.equal(
        (
            await send(
                '/api/account/change-password',
                {
                    password: 'abcdefghij',
                    currentPassword: 'LocalFixtureOnly123'
                },
                first
            )
        ).status,
        400
    );
    const changed = await send(
        '/api/account/change-password',
        {
            password: 'ReplacementAudit123',
            currentPassword: 'LocalFixtureOnly123'
        },
        first
    );
    assert.equal(changed.status, 200);
    const fresh = changed.headers.get('Set-Cookie').split(';')[0];
    for (const cookie of [first, second])
        assert.equal(
            (
                await send(
                    '/api/patch-user',
                    { username: 'Ana', fields: {} },
                    cookie
                )
            ).status,
            401
        );
    assert.equal(
        (await send('/api/patch-user', { username: 'Ana', fields: {} }, fresh))
            .status,
        200
    );
    assert.equal(
        (
            await send('/api/login', {
                identifier: 'Ana',
                password: 'LocalFixtureOnly123'
            })
        ).status,
        401
    );
    assert.equal(
        (
            await send('/api/login', {
                identifier: 'Ana',
                password: 'ReplacementAudit123'
            })
        ).status,
        200
    );
});

test('forced password change and signout-all revoke server sessions', async (t) => {
    const { send, login, env } = await fixture(t),
        old = await login();
    const resettingState = await api.readState(env);
    resettingState.registeredUsers.find(user => user.username === 'Ana').passwordResetRequired = true;
    await api.writeState(env, resettingState);
    assert.equal(
        (
            await send('/api/account/change-password-forced', {
                email: 'ana@example.invalid',
                oldPassword: 'LocalFixtureOnly123',
                newPassword: 'ChangedFixture123'
            })
        ).status,
        200
    );
    assert.equal(
        (await send('/api/patch-user', { username: 'Ana', fields: {} }, old))
            .status,
        401
    );
    const result = await send('/api/login', {
        identifier: 'Ana',
        password: 'ChangedFixture123'
    });
    const current = result.headers.get('Set-Cookie').split(';')[0];
    assert.equal(
        (await send('/api/account/signout-all', {}, current)).status,
        200
    );
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: {} },
                current
            )
        ).status,
        401
    );
});

test('session lifetime is bounded and pre-migration bearer cookies cannot authenticate', async (t) => {
    const { db, send, login } = await fixture(t),
        cookie = await login();
    db.sqlite
        .prepare('UPDATE auth_sessions SET created_at=?')
        .run(Date.now() - policy.SESSION_ABSOLUTE_MS - 1);
    assert.equal(
        (await send('/api/patch-user', { username: 'Ana', fields: {} }, cookie))
            .status,
        401
    );
    const legacy = 'x'.repeat(43);
    db.sqlite
        .prepare(
            'INSERT INTO sessions(token,username,expires_at) VALUES (?,?,?)'
        )
        .run(legacy, 'Ana', Date.now() + 60000);
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: {} },
                'anivoid_auth_token=' + legacy
            )
        ).status,
        401
    );
});

test('cookie mutations reject foreign origins, cross-site fetches, simple bodies and missing origins', async (t) => {
    const { send, login } = await fixture(t),
        cookie = await login();
    for (const [headers, status] of [
        [{ Origin: 'https://foreign.example.invalid' }, 403],
        [{ 'Content-Type': 'text/plain' }, 415],
        [{ 'Sec-Fetch-Site': 'cross-site' }, 403],
        [{ Origin: '' }, 403]
    ]) {
        assert.equal(
            (
                await send(
                    '/api/patch-user',
                    { username: 'Ana', fields: {} },
                    cookie,
                    headers
                )
            ).status,
            status
        );
    }
    const token = cookie.split('=')[1];
    assert.equal(
        (
            await send('/api/patch-user', { username: 'Ana', fields: {} }, '', {
                Origin: '',
                Authorization: 'Bearer ' + token
            })
        ).status,
        200
    );
});

test('JSON parsing enforces streamed limits and rejects invalid top-level shapes', async () => {
    const large = new ReadableStream({
        start(controller) {
            controller.enqueue(new Uint8Array(33));
            controller.close();
        }
    });
    await assert.rejects(
        policy.readJson(
            new Request(origin, {
                method: 'POST',
                body: large,
                duplex: 'half'
            }),
            32
        ),
        { status: 413 }
    );
    const original = new Request(origin, {
        method: 'POST',
        body: 'x'.repeat(40)
    });
    await assert.rejects(policy.readJson(original.clone(), 32), {
        status: 413
    });
    await original.body.cancel();
    for (const body of ['[]', 'null', '{broken'])
        await assert.rejects(
            policy.readJson(new Request(origin, { method: 'POST', body })),
            { status: 400 }
        );
});

test('changing an email requires the current password and sync cannot change or verify it', async (t) => {
    const { env, state, send, login } = await fixture(t),
        cookie = await login();
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: { email: 'new@example.invalid' } },
                cookie
            )
        ).status,
        403
    );
    const local = copy(state);
    local.registeredUsers[1].email = 'forged@example.invalid';
    local.registeredUsers[1].emailVerified = true;
    assert.equal(
        (
            await send(
                '/api/sync-state',
                { localState: local, baseState: state },
                cookie
            )
        ).status,
        200
    );
    assert.equal(
        (await api.readState(env)).registeredUsers[1].email,
        'ana@example.invalid'
    );
    const changed = await send(
        '/api/patch-user',
        {
            username: 'Ana',
            fields: { email: 'new@example.invalid', emailVerified: true },
            currentPassword: 'LocalFixtureOnly123'
        },
        cookie
    );
    assert.equal(changed.status, 200);
    const user = (await api.readState(env)).registeredUsers[1];
    assert.equal(user.email, 'new@example.invalid');
    assert.equal(user.emailVerified, false);
});

test('email verification requires an actual, expiring single-use proof for the current address', async (t) => {
    const { db, env, state } = await fixture(t);
    let link = '';
    const store = createD1EmailStore({
        getDb: () => db,
        ensureStorage: async () => {}
    });
    const verification = createEmailVerification({
        crypto: crypto.webcrypto,
        store,
        deliver: async (_env, _email, url) => {
            link = url;
        }
    });
    const user = state.registeredUsers[1];
    await verification.request(env, user);
    const token = new URL(link).searchParams.get('verify_email');
    assert.equal(
        db.sqlite
            .prepare('SELECT length(token_hash) AS n FROM email_verifications')
            .get().n,
        64
    );
    await verification.confirm(env, token, state, (updated) =>
        api.writeState(env, updated)
    );
    assert.equal(
        (await api.readState(env)).registeredUsers[1].emailVerified,
        true
    );
    const publicResponse = await api.onRequest({
        env,
        request: new Request(origin + '/api/users')
    });
    const publicUser = (await publicResponse.json()).registeredUsers.find(
        (user) => user.username === 'Ana'
    );
    assert.equal(publicUser.emailVerified, true);
    assert.equal(publicUser.emailVerifiedEmail, undefined);
    assert.equal(publicUser.email, undefined);
    await assert.rejects(
        verification.confirm(env, token, state, (updated) =>
            api.writeState(env, updated)
        ),
        { code: 'INVALID_VERIFICATION' }
    );
    await verification.request(env, user);
    const expired = new URL(link).searchParams.get('verify_email');
    db.sqlite.prepare('UPDATE email_verifications SET expires_at=0').run();
    await assert.rejects(
        verification.confirm(env, expired, state, () => {}),
        { code: 'INVALID_VERIFICATION' }
    );
    await verification.request(env, user);
    const stale = new URL(link).searchParams.get('verify_email');
    user.email = 'changed@example.invalid';
    await assert.rejects(
        verification.confirm(env, stale, state, () => {}),
        { code: 'INVALID_VERIFICATION' }
    );
});

test('missing email delivery configuration fails closed and client flags cannot verify registration', async (t) => {
    const { env, send, login } = await fixture(t),
        cookie = await login();
    const response = await send(
        '/api/account/email-verification/request',
        {},
        cookie
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'EMAIL_DELIVERY_UNAVAILABLE');
    const registered = await send('/api/register', {
        username: 'Carla',
        email: 'carla@example.invalid',
        password: 'NewFixtureOnly123',
        emailVerified: true
    });
    assert.equal(registered.status, 200);
    assert.equal((await registered.json()).user.emailVerified, false);
    assert.notEqual(
        (await api.readState(env)).registeredUsers[1].emailVerified,
        true
    );
});

test('atomic per-IP registration limits cannot be bypassed by changing names or emails', async (t) => {
    const { send } = await fixture(t);
    const responses = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
            send('/api/register', {
                username: 'Collision.' + i,
                email: 'same@example.invalid',
                password: 'NewFixtureOnly123'
            })
        )
    );
    assert.equal(
        responses.filter((response) => response.status === 200).length,
        1
    );
    assert.equal(
        responses.filter((response) => response.status === 429).length,
        3
    );
});

test('concurrent verification consumes the proof exactly once and state conflicts require a fresh link', async (t) => {
    const { db, env, state } = await fixture(t);
    let link;
    const store = createD1EmailStore({
        getDb: () => db,
        ensureStorage: async () => {}
    });
    const verification = createEmailVerification({
        crypto: crypto.webcrypto,
        store,
        deliver: async (_env, _email, url) => {
            link = url;
        }
    });
    await verification.request(env, state.registeredUsers[1]);
    const token = new URL(link).searchParams.get('verify_email');
    const attempts = await Promise.allSettled(
        [0, 1].map(() =>
            verification.confirm(env, token, copy(state), (value) =>
                api.writeState(env, value)
            )
        )
    );
    assert.equal(
        attempts.filter((value) => value.status === 'fulfilled').length,
        1
    );
    assert.equal(
        attempts.filter(
            (value) =>
                value.status === 'rejected' &&
                value.reason.code === 'INVALID_VERIFICATION'
        ).length,
        1
    );
    const current = await api.readState(env);
    await verification.request(env, current.registeredUsers[1]);
    const conflicted = new URL(link).searchParams.get('verify_email');
    await assert.rejects(
        verification.confirm(env, conflicted, current, async () => {
            throw Object.assign(new Error('conflict'), {
                code: 'STATE_CONFLICT'
            });
        }),
        { code: 'VERIFICATION_RETRY_REQUIRED' }
    );
    await assert.rejects(
        verification.confirm(env, conflicted, current, () => {}),
        { code: 'INVALID_VERIFICATION' }
    );
});
