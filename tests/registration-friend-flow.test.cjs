const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('new account can sign in and send a friend request to Felipe', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const registration = await send('/api/register', {
        username: 'Flow Tester',
        email: 'flow-tester@example.invalid',
        password: 'FlowTester123'
    });
    assert.equal(registration.status, 200);
    const registrationBody = await registration.json();
    assert.equal(registrationBody.success, true);
    assert.equal(registrationBody.user.username, 'Flow Tester');
    assert.equal(registrationBody.user.password, undefined);

    const cookie = registration.headers.get('Set-Cookie').split(';')[0];
    const usersResponse = await send('/api/users', undefined, cookie);
    assert.equal(usersResponse.status, 200);
    const usersBody = await usersResponse.json();
    assert.equal(usersBody.viewerUsername, 'Flow Tester');
    assert.equal(usersBody.registeredUsers.some(user => user.username === 'Felipe!'), true);

    const request = await send('/api/send-friend-request', { to: 'Felipe!' }, cookie);
    assert.equal(request.status, 200);
    assert.equal((await request.json()).success, true);

    const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    const owner = state.registeredUsers.find(user => user.username === 'Felipe!');
    const tester = state.registeredUsers.find(user => user.username === 'Flow Tester');
    assert.deepEqual(owner.friendRequests.map(item => item.from), ['Flow Tester']);
    assert.deepEqual(tester.friends, []);
});
