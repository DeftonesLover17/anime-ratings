const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_ANIMES } = require('../frontend/catalog/default-animes');

test('the seed catalog keeps distinct IDs and the fields needed for recovery', () => {
    assert.equal(DEFAULT_ANIMES.length, 62);
    assert.equal(new Set(DEFAULT_ANIMES.map(anime => anime.id)).size, DEFAULT_ANIMES.length);
    for (const anime of DEFAULT_ANIMES) {
        assert.ok(anime.title && anime.synopsis && anime.coverUrl && anime.studio, anime.id);
        assert.ok(Array.isArray(anime.comments) && anime.ratings && typeof anime.ratings === 'object', anime.id);
    }
});
