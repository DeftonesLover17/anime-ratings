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

test('Node only accepts a friend request actually received by the signed-in member', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const login = async identifier => {
        const response = await send('/api/login', { identifier, password: 'LocalFixtureOnly123' });
        assert.equal(response.status, 200);
        return response.headers.get('Set-Cookie').split(';')[0];
    };
    const ana = await login('Ana');
    const felipe = await login('Felipe!');
    const respond = (action, cookie) => send('/api/respond-friend-request', { target: 'Felipe!', action }, cookie);

    assert.equal((await respond('accept', ana)).status, 409);
    assert.equal((await respond('decline', ana)).status, 409);
    assert.equal((await send('/api/send-friend-request', { to: 'Felipe!' }, ana)).status, 200);
    assert.equal((await respond('accept', ana)).status, 409);
    let state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.deepEqual(state.registeredUsers.map(user => user.friends), [[], []]);
    assert.deepEqual(state.registeredUsers[0].friendRequests.map(request => request.from), ['Ana']);

    const accepted = await send('/api/respond-friend-request', { target: 'Ana', action: 'accept' }, felipe);
    assert.equal(accepted.status, 200);
    state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    assert.deepEqual(state.registeredUsers.map(user => user.friends), [['Ana'], ['Felipe!']]);
    assert.deepEqual(state.registeredUsers[0].friendRequests, []);
});
