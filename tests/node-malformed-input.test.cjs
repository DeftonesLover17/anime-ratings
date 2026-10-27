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

test('Node rejects crafted user references without terminating the process', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const login = await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    const before = await fs.readFile(stateFile, 'utf8');
    const crafted = { toString: null };
    for (const [route, body] of [
        ['/api/send-friend-request', { to: crafted }],
        ['/api/respond-friend-request', { target: crafted, action: 'accept' }],
        ['/api/cancel-friend-request', { target: crafted }],
        ['/api/remove-friend', { target: crafted }],
        ['/api/clear-user-ratings', { username: crafted, animeIds: ['a1'] }],
        ['/api/admin/set-friendship', { target: crafted }],
        ['/api/admin/set-friendship', { target: 'Felipe!', username: crafted }]
    ]) {
        const response = await send(route, body, cookie);
        assert.equal(response.status, 400, route);
        assert.equal((await send('/api/health')).status, 200);
    }
    assert.equal(await fs.readFile(stateFile, 'utf8'), before);
});

test('Node rejects malformed profile and catalog fields without crashing', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const memberLogin = await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' });
    const adminLogin = await send('/api/login', { identifier: 'Felipe!', password: 'LocalFixtureOnly123' });
    assert.equal(memberLogin.status, 200);
    assert.equal(adminLogin.status, 200);
    const member = memberLogin.headers.get('Set-Cookie').split(';')[0];
    const admin = adminLogin.headers.get('Set-Cookie').split(';')[0];
    const before = await fs.readFile(stateFile, 'utf8');
    const crafted = { toString: null };
    for (const [route, body, cookie] of [
        ['/api/patch-user', { username: 'Ana', fields: { avatar: crafted } }, member],
        ['/api/patch-user', { username: 'Ana', fields: { favoriteGenres: [crafted] } }, member],
        ['/api/admin/animes', { anime: { title: 'New', studio: crafted } }, admin],
        ['/api/admin/animes', { anime: { id: crafted, title: 'New' } }, admin],
        ['/api/admin/animes', { anime: { title: crafted } }, admin],
        ['/api/admin/delete-anime', { animeId: crafted }, admin]
    ]) {
        const response = await send(route, body, cookie);
        assert.equal(response.status, 400, route);
        assert.equal((await send('/api/health')).status, 200, route);
    }
    assert.equal(await fs.readFile(stateFile, 'utf8'), before);
});

test('Node rejects incomplete sync collections before merging or writing', async t => {
    const { send, stateFile } = await startNodeServer(t);
    const login = await send('/api/login', { identifier: 'Ana', password: 'LocalFixtureOnly123' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];
    const before = await fs.readFile(stateFile, 'utf8');
    const baseState = { animes: [{ id: 'a1', ratings: {}, comments: [] }] };
    const crafted = { toString: null };
    for (const localState of [
        { animes: [{ id: 'a1', comments: [] }] },
        { animes: [{ id: 'a1', ratings: {}, comments: {} }] },
        { animes: [{ id: 'a1', ratings: { ana: { episodeRatings: { 1: crafted } } }, comments: [] }] },
        { animes: [{ id: 'a1', ratings: {}, comments: [] }], activities: [{ id: 'act1', timestamp: crafted }] }
    ]) {
        const response = await send('/api/sync-state', { baseState, localState }, cookie);
        assert.equal(response.status, 400);
        assert.equal((await send('/api/health')).status, 200);
    }
    assert.equal(await fs.readFile(stateFile, 'utf8'), before);
});
