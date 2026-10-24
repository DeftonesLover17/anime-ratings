const test = require('node:test');
const assert = require('node:assert/strict');
const {
    parseScore,
    episodeWatched,
    initialEpisode,
    episodeWindow,
} = require('../frontend/ratings/model');

test('decimal editing accepts comma and point, distinguishes removal from invalid text', () => {
    assert.equal(parseScore('9,7'), 9.7);
    assert.equal(parseScore(' 3.4 '), 3.4);
    assert.equal(parseScore(''), null);
    assert.equal(parseScore('10.1'), undefined);
    assert.equal(parseScore('8x'), undefined);
    assert.equal(parseScore('0'), undefined);
});

test('episode selection respects explicit gaps and remains bounded for long series', () => {
    const rating = {
        episodesWatched: 3,
        watchedEpisodesMap: { 1: true, 2: false, 3: true },
    };
    assert.equal(episodeWatched(rating, 2), false);
    assert.equal(initialEpisode(rating, 26), 2);
    assert.equal(initialEpisode({ episodesWatched: 26 }, 26), 1);
    assert.equal(
        episodeWatched({ episodesWatched: 26, watchedEpisodesMap: {} }, 2),
        true,
    );
    const window = episodeWindow(1105, 1200);
    assert.equal(window.start, 1081);
    assert.equal(window.episodes.length, 40);
    assert.equal(window.end, 1120);
});
