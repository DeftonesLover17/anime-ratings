const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreAnimeRelevance } = require('../frontend/catalog/autocomplete');

test('catalog search ranks the requested final-season part ahead of similar titles', () => {
    const part1 = { title: 'Attack on Titan: The Final Season Part 1', score: 9 };
    const part2 = { title: 'Attack on Titan: The Final Season Part 2', score: 8 };
    const part3 = { title: 'Attack on Titan: The Final Season Part 3', score: 7 };

    assert.ok(scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 2') > scoreAnimeRelevance(part1, 'Attack on Titan Final Season Part 2'));
    assert.ok(scoreAnimeRelevance(part1, 'Attack on Titan Final Season Part 1') > scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 1'));
    assert.ok(scoreAnimeRelevance(part3, 'Attack on Titan Final Season Part 3') > scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 3'));
});
