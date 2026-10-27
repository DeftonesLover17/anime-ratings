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
