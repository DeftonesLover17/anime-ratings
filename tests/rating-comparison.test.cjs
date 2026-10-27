const test = require('node:test');
const assert = require('node:assert/strict');
const { ratingComparisonMarkup } = require('../frontend/site/rating-comparison');
const { createProjectAdapter } = require('../frontend/site/project-adapter');

test('paired ratings support decimals, missing ratings and untrusted names', () => {
    const scores = ratingComparisonMarkup({ overall: '8,4' }, { overall: 7 }, 'Ana');
    assert.ok(scores.includes('8,4'));
    assert.ok(scores.includes('7,0'));
    assert.ok(!scores.includes('diferença'));
    const missing = ratingComparisonMarkup({}, { overall: 11 }, '<img src=x>');
    assert.equal((missing.match(/Sem nota/g) || []).length, 2);
    assert.ok(missing.includes('&lt;img'));
    assert.ok(!missing.includes('<img'));
});

test('friend catalog compares the authenticated viewer across sorting and unrated works', () => {
    const state = { currentFriendId: 'ana', friends: [], calculateAverageScore: () => 8 };
    let viewer = 'felipe';
    const adapter = createProjectAdapter({ state, statuses: {}, viewerId: () => viewer,
        users: () => [{ username: 'Ana' }], normalizeId: name => name.toLowerCase() },
        { createCatalogCard: model => model });
    const anime = { id: 'a', ratings: { ana: { overall: 7 }, felipe: { overall: 9 } } };
    for (const sort of ['average', 'title', 'my-score', 'year']) {
        state.sortBy = sort;
        assert.equal(adapter.createCard(anime).ownRating.overall, 9);
        assert.equal(adapter.createCard(anime).rating.overall, 7);
    }
    assert.deepEqual(adapter.createCard({ ratings: {} }).ownRating, {});
    state.currentFriendId = 'felipe'; assert.equal(adapter.createCard(anime).ownRating, null);
    state.currentFriendId = 'ana'; viewer = ''; assert.equal(adapter.createCard(anime).ownRating, null);
});
