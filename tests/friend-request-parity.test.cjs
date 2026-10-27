const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('Node supports the existing cancel-request action without cancelling another member request', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const login = async identifier => {
        const response = await send('/api/login', { identifier, password: 'LocalFixtureOnly123' });
        assert.equal(response.status, 200);
        return response.headers.get('Set-Cookie').split(';')[0];
    };
    const ana = await login('Ana');
    const felipe = await login('Felipe!');
    assert.equal((await send('/api/send-friend-request', { to: 'Felipe!' }, ana)).status, 200);
    assert.equal((await send('/api/cancel-friend-request', { target: 'Felipe!' })).status, 401);
    assert.equal((await send('/api/cancel-friend-request', { target: 'Felipe!' }, felipe)).status, 200);
    let state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.deepEqual(state.registeredUsers[0].friendRequests.map(item => item.from), ['Ana']);

    const cancelled = await send('/api/cancel-friend-request', { target: 'Felipe!' }, ana);
    assert.equal(cancelled.status, 200);
    assert.equal((await cancelled.json()).success, true);
    state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.deepEqual(state.registeredUsers[0].friendRequests, []);
});
