const test = require('node:test');
const assert = require('node:assert/strict');
const { startNodeServer } = require('./helpers/node-server.cjs');

test('Node admin can add and edit an anime while duplicate titles are rejected', async t => {
    const { send } = await startNodeServer(t);
    const login = await send('/api/login', { identifier: 'Felipe!', password: 'LocalFixtureOnly123' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('Set-Cookie').split(';')[0];

    const added = await send('/api/admin/animes', { anime: { title: 'Novo Anime', studio: 'Trigger', episodes: '12', genres: ['Ação'] } }, cookie);
    assert.equal(added.status, 200);
    const created = (await added.json()).anime;
    assert.equal(created.title, 'Novo Anime');
    assert.equal(created.studio, 'Trigger');

    const duplicate = await send('/api/admin/animes', { anime: { title: 'Novo Ânime', studio: 'Trigger' } }, cookie);
    assert.equal(duplicate.status, 409);
    const edited = await send('/api/admin/animes', { anime: { id: created.id, title: 'Novo Anime', synopsis: 'Nova sinopse', studio: 'Trigger' } }, cookie);
    assert.equal(edited.status, 200);
    const state = await (await send('/api/get-state')).json();
    assert.equal(state.animes.filter(anime => anime.title === 'Novo Anime').length, 1);
    assert.equal(state.animes.find(anime => anime.id === created.id).synopsis, 'Nova sinopse');
    const japaneseA = await send('/api/admin/animes', { anime: { title: '星の旅', studio: 'Trigger' } }, cookie);
    const japaneseB = await send('/api/admin/animes', { anime: { title: '月の旅', studio: 'Trigger' } }, cookie);
    assert.equal(japaneseA.status, 200);
    assert.equal(japaneseB.status, 200);
    assert.equal((await send('/api/health')).status, 200);
});
