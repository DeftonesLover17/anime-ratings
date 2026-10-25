const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');
test('Node HTTP adapter enforces identity, session, password and profile policies', async (t) => {
    const { send, stateFile } = await startNodeServer(t);
    const login = await send('/api/login', {
        identifier: 'Ana',
        password: 'LocalFixtureOnly123'
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    const sessionData = await login.json();
    assert.equal(sessionData.token, undefined);
    assert.ok(sessionData.user.accountId);
    assert.equal(
        (
            await send('/api/register', {
                username: 'A.na',
                email: 'alias@example.invalid',
                password: 'NewFixtureOnly123'
            })
        ).status,
        409
    );
    assert.equal(
        (
            await send('/api/register', {
                username: 'Feli.pe',
                email: 'alias@example.invalid',
                password: 'NewFixtureOnly123'
            })
        ).status,
        409
    );
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: { color: '#123456' } },
                cookie,
                { Origin: 'https://foreign.example.invalid' }
            )
        ).status,
        403
    );
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
    assert.equal(
        (await send('/api/account/email-verification/request', {}, cookie))
            .status,
        503
    );
    assert.equal(
        (
            await send(
                '/api/account/change-password',
                { password: 'ReplacementAudit123' },
                cookie
            )
        ).status,
        403
    );
    const changed = await send(
        '/api/account/change-password',
        {
            password: 'ReplacementAudit123',
            currentPassword: 'LocalFixtureOnly123'
        },
        cookie
    );
    assert.equal(changed.status, 200);
    const rotated = changed.headers.get('Set-Cookie').split(';')[0];
    assert.equal(
        (await send('/api/patch-user', { username: 'Ana', fields: {} }, cookie))
            .status,
        401
    );
    const profile = await send(
        '/api/patch-user',
        { username: 'Ana', fields: { emailVerified: true, color: '#123456' } },
        rotated
    );
    assert.equal(profile.status, 200);
    assert.notEqual((await profile.json()).user.emailVerified, true);
    const stored = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.equal(
        stored.registeredUsers.find((user) => user.username === 'Ana').password,
        undefined
    );
    assert.equal(stored.animes[0].ratings.ana.overall, 9);
    assert.equal((await send('/api/logout', {}, rotated)).status, 200);
    assert.equal(
        (
            await send(
                '/api/patch-user',
                { username: 'Ana', fields: {} },
                rotated
            )
        ).status,
        401
    );
    assert.equal((await send('/server.js')).status, 404);
    const registration = await send('/api/register', {
        username: 'Carla',
        email: 'carla@example.invalid',
        password: 'NewFixtureOnly123',
        emailVerified: true
    });
    assert.equal(registration.status, 200);
    const registered = await registration.json();
    assert.equal(registered.token, undefined);
    assert.equal(registered.user.emailVerified, false);
});
