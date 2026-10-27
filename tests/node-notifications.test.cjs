const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('Node persists notification read and clear actions for the signed-in member', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const initial = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    initial.registeredUsers[1].notifications = [{ id: 'notice-1', title: 'Aviso', message: 'Teste', read: false }];
    await fs.writeFile(stateFile, JSON.stringify(initial));

    assert.equal((await send('/api/notifications/read', {})).status, 401);
    const login = await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    const read = await send('/api/notifications/read', {}, cookie);
    assert.equal(read.status, 200);
    assert.equal((await read.json()).notifications[0].read, true);
    let stored = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.equal(stored.registeredUsers[1].notifications[0].read, true);

    const cleared = await send('/api/notifications/clear', {}, cookie);
    assert.equal(cleared.status, 200);
    assert.deepEqual((await cleared.json()).notifications, []);
    stored = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.deepEqual(stored.registeredUsers[1].notifications, []);
});
