const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

function method(name, nextName) {
    const start = source.indexOf('    ' + name + '(');
    const end = source.indexOf('    ' + nextName + '(', start);
    return new Function('return ({' + source.slice(start, end) + '})')()[name];
}

test('editing a score preserves the complete legacy watched count', () => {
    const rating = {
        episodesWatched: 3,
        watchedEpisodesMap: {},
        episodeRatings: { 1: 8, 2: 8, 3: 8 },
        status: 'Completed',
    };
    const state = {
        animes: [{ id: 'a', episodes: 3, ratings: { alice: rating } }],
        initFriendRatingIfMissing() {},
        save() {},
        recordActivity() {},
        calculateUserOverallFromEpisodes() {
            return 8;
        },
    };
    method('setEpisodeRating', 'setGeneralRating').call(
        state,
        'a',
        'alice',
        1,
        9,
    );
    assert.equal(rating.episodesWatched, 3);
    assert.deepEqual(rating.watchedEpisodesMap, { 1: true, 2: true, 3: true });
    assert.equal(rating.status, 'Completed');
});

test('legacy progress with an empty episode map keeps earlier episodes when unchecking', () => {
    const rating = {
        episodesWatched: 3,
        watchedEpisodesMap: {},
        episodeRatings: { 1: 8, 2: 9, 3: 10 },
        status: 'Completed',
    };
    const state = {
        animes: [{ id: 'a', episodes: 3, ratings: { alice: rating } }],
        initFriendRatingIfMissing() {},
        save() {},
        calculateUserOverallFromEpisodes() {
            return 8;
        },
    };
    method('toggleEpisodeWatched', 'calculateEpisodeAverage').call(
        state,
        'a',
        'alice',
        2,
        false,
    );
    assert.deepEqual(rating.watchedEpisodesMap, { 1: true });
    assert.deepEqual(rating.episodeRatings, { 1: 8 });
    assert.equal(rating.episodesWatched, 1);
    assert.equal(rating.status, 'Watching');
});

test('group status counts the signed-in member once when also present in the friend list', () => {
    const state = {
        loggedInUser: 'Alice',
        friends: [{ id: 'alice' }, { id: 'bob' }],
        animes: [
            {
                id: 'a',
                ratings: {
                    alice: { status: 'Completed' },
                    bob: { status: 'Watching' },
                },
            },
        ],
    };
    const counts = method('getGroupStatusStats', 'addComment').call(state, 'a');
    assert.equal(counts.Completed, 1);
    assert.equal(counts.Watching, 1);
});
