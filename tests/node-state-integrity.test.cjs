const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('Node rejects an unreadable state instead of treating it as an empty catalog or account list', async t => {
    const { send, stateFile } = await startNodeServer(t);
    await fs.writeFile(stateFile, '{invalid stored state');
    assert.equal((await send('/api/get-state')).status, 500);
    assert.equal((await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' })).status, 500);
    assert.equal((await send('/api/register', { username: 'NewMember', email: 'new@example.invalid', password: 'NewMember123' })).status, 500);
    assert.equal(await fs.readFile(stateFile, 'utf8'), '{invalid stored state');
});

test('Node rejects a structurally incomplete state without replacing it during a mutation', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const incomplete = JSON.stringify({ revision: 0, registeredUsers: [] });
    await fs.writeFile(stateFile, incomplete);
    assert.equal((await send('/api/get-state')).status, 500);
    assert.equal((await send('/api/register', { username: 'NewMember', email: 'new@example.invalid', password: 'NewMember123' })).status, 500);
    assert.equal((await send('/api/sync-state', { baseState: { animes: [] }, localState: { animes: [] } })).status, 500);
    assert.equal((await send('/api/patch-user', { username: 'Ana', fields: {} })).status, 500);
    assert.equal(await fs.readFile(stateFile, 'utf8'), incomplete);
});
