const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('Node rejects malformed state and social payloads without terminating or writing state', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const original = await fs.readFile(stateFile, 'utf8');

    for (const [route, body] of [
        ['/api/sync-state', null],
        ['/api/sync-state', []],
        ['/api/clear-user-ratings', { username: 7, animeIds: ['a1'] }],
        ['/api/remove-friend', { target: 7 }]
    ]) {
        const response = await send(route, body);
        assert.equal(response.status, 400, route);
        assert.equal((await send('/api/health')).status, 200);
    }
    assert.equal(await fs.readFile(stateFile, 'utf8'), original);
});
