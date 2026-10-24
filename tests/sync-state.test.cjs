const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { mergeClientState, clientSnapshot, applyChanges } = require('../shared/sync-state');
const copy = value => JSON.parse(JSON.stringify(value));
function fixture() {
    return {
        revision: 0, registeredUsers: [{ username: 'Ana', color: '#112233' }, { username: 'Bruno', color: '#445566' }],
        animes: [{ id: 'a1', ratings: { ana: { overall: 8, episodeRatings: {} }, bruno: { overall: 7 } }, comments: [] },
            { id: 'a2', ratings: { ana: { overall: 6 } }, comments: [] }], activities: []
    };
}

test('stale devices changing different animes keep both updates', () => {
    const base = fixture();
    const first = copy(base), second = copy(base);
    first.animes[0].ratings.ana.overall = 9;
    second.animes[1].ratings.ana.overall = 10;
    const committed = mergeClientState(first, base, base, 'Ana');
    const final = mergeClientState(second, base, committed, 'Ana');
    assert.equal(final.animes[0].ratings.ana.overall, 9);
    assert.equal(final.animes[1].ratings.ana.overall, 10);
});

test('episode changes merge by key without restoring an older score', () => {
    const base = fixture();
    base.animes[0].ratings.ana.episodeRatings[1] = 8;
    const local = copy(base), server = copy(base);
    local.animes[0].ratings.ana.episodeRatings[2] = 10;
    server.animes[0].ratings.ana.episodeRatings[1] = 9;
    const result = mergeClientState(local, base, server, 'Ana');
    assert.deepEqual(result.animes[0].ratings.ana.episodeRatings, { 1: 9, 2: 10 });
    assert.equal(result.animes[0].ratings.ana.overall, 9.5);
});

test('concurrent watched-episode updates keep the combined progress count', () => {
    const base = fixture(), local = copy(base), server = copy(base);
    local.animes[0].ratings.ana.watchedEpisodesMap = { 2: true };
    local.animes[0].ratings.ana.episodesWatched = 1;
    server.animes[0].ratings.ana.watchedEpisodesMap = { 1: true };
    server.animes[0].ratings.ana.episodesWatched = 1;
    const result = mergeClientState(local, base, server, 'Ana');
    assert.deepEqual(result.animes[0].ratings.ana.watchedEpisodesMap, { 1: true, 2: true });
    assert.equal(result.animes[0].ratings.ana.episodesWatched, 2);
});

test('sync cannot edit another member, their rating or an existing foreign reply', () => {
    const base = fixture();
    base.animes[0].comments = [{ id: 'c1', friendId: 'ana', comment: 'Review', replies: [{ id: 'r1', friendId: 'bruno', reply: 'Original' }] }];
    const local = copy(base);
    local.registeredUsers[1].color = '#ffffff';
    local.animes[0].ratings.bruno.overall = 1;
    local.animes[0].comments[0].replies[0].reply = 'Changed';
    const result = mergeClientState(local, base, base, 'Ana');
    assert.equal(result.registeredUsers[1].color, '#445566');
    assert.equal(result.animes[0].ratings.bruno.overall, 7);
    assert.equal(result.animes[0].comments[0].replies[0].reply, 'Original');
});

test('comments added on another device survive a stale cache, and deletions do not resurrect', () => {
    const base = fixture(), server = copy(base);
    server.animes[0].comments.push({ id: 'new', friendId: 'ana', comment: 'New', replies: [] });
    const result = mergeClientState(base, base, server, 'Ana');
    assert.equal(result.animes[0].comments[0].id, 'new');
    const cached = copy(server), deleted = copy(base);
    assert.equal(mergeClientState(cached, cached, deleted, 'Ana').animes[0].comments.length, 0);
});

test('unchanged profile fields and ratings are not written from a stale snapshot', () => {
    const base = fixture(), local = copy(base), server = copy(base);
    local.registeredUsers[0].favoriteGenres = ['Drama'];
    server.registeredUsers[0].color = '#ff0000';
    server.animes[0].ratings.ana.overall = 10;
    const result = mergeClientState(local, base, server, 'Ana');
    assert.equal(result.registeredUsers[0].color, '#ff0000');
    assert.deepEqual(result.registeredUsers[0].favoriteGenres, ['Drama']);
    assert.equal(result.animes[0].ratings.ana.overall, 10);
});

test('snapshots exclude credentials, foreign profiles and catalog metadata', () => {
    const state = fixture();
    state.registeredUsers[0].passwordHash = 'fixture';
    state.animes[0].synopsis = 'Not part of a sync';
    const snapshot = clientSnapshot(state, 'Ana');
    assert.equal(snapshot.registeredUsers.length, 1);
    assert.equal(snapshot.registeredUsers[0].passwordHash, undefined);
    assert.equal(snapshot.animes[0].synopsis, undefined);
    assert.equal(snapshot.animes[0].ratings.bruno, undefined);
});

test('delta keys cannot modify Object.prototype', () => {
    applyChanges({}, JSON.parse('{"__proto__":{"polluted":true}}'), {});
    assert.equal({}.polluted, undefined);
});

test('display escaping fixes stored entities and still escapes markup', () => {
    const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    const start = source.indexOf('function escapeHtml(value) {');
    const end = source.indexOf('\n}', start) + 2;
    const escapeHtml = new Function(source.slice(start, end) + ';return escapeHtml;')();
    assert.equal(escapeHtml('JoJo&#39;s'), 'JoJo&#39;s');
    assert.equal(escapeHtml('A &amp; B'), 'A &amp; B');
    assert.equal(escapeHtml('&lt;img src=x onerror=alert(1)&gt;'), '&lt;img src=x onerror=alert(1)&gt;');
});
