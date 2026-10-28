const test = require('node:test');
const assert = require('node:assert/strict');
const { initCatalogAutocomplete, scoreAnimeRelevance } = require('../frontend/catalog/autocomplete');
const studioMetadata = require('../shared/studio-metadata');

test('catalog search ranks the requested final-season part ahead of similar titles', () => {
    const part1 = { title: 'Attack on Titan: The Final Season Part 1', score: 9 };
    const part2 = { title: 'Attack on Titan: The Final Season Part 2', score: 8 };
    const part3 = { title: 'Attack on Titan: The Final Season Part 3', score: 7 };

    assert.ok(scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 2') > scoreAnimeRelevance(part1, 'Attack on Titan Final Season Part 2'));
    assert.ok(scoreAnimeRelevance(part1, 'Attack on Titan Final Season Part 1') > scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 1'));
    assert.ok(scoreAnimeRelevance(part3, 'Attack on Titan Final Season Part 3') > scoreAnimeRelevance(part2, 'Attack on Titan Final Season Part 3'));
});

test('an older catalog search cannot replace results for a newer query', async () => {
    const listeners = {};
    const title = {
        value: '',
        addEventListener: (type, handler) => { listeners[type] = handler; },
        contains: () => false
    };
    const classes = new Set(['hidden']);
    const suggestions = {
        innerHTML: '',
        classList: {
            add: value => classes.add(value),
            remove: value => classes.delete(value),
            contains: value => classes.has(value)
        },
        contains: () => false
    };
    const timers = new Map();
    const pending = [];
    let nextTimer = 0;
    initCatalogAutocomplete({
        document: {
            getElementById: id => id === 'form-anime-title' ? title : id === 'form-anime-suggestions' ? suggestions : null,
            addEventListener() {}
        },
        studioMetadata,
        standardStudioName: studioMetadata.standardStudioName,
        escapeHtml: value => String(value),
        getStudioLogo: () => '',
        updateCatalogLivePreview() {},
        request: () => new Promise(resolve => pending.push(resolve)),
        setTimer: (handler, delay) => {
            const id = ++nextTimer;
            timers.set(id, { handler, delay });
            return id;
        },
        clearTimer: id => timers.delete(id)
    });

    title.value = 'Frieren';
    listeners.input();
    const firstSearch = [...timers.values()].find(timer => timer.delay === 450).handler();
    assert.ok(pending.length > 0);
    title.value = 'Demon Slayer';
    listeners.input();
    const newerLoadingState = suggestions.innerHTML;
    for (const resolve of pending) resolve({ ok: true, json: async () => ({ data: [] }) });
    await firstSearch;
    assert.equal(suggestions.innerHTML, newerLoadingState);
    assert.ok(newerLoadingState.includes('Consultando base oficial'));
});

test('portuguese anime season queries expand and prioritize season titles', async () => {
    const searches = [];
    const listeners = {};
    const title = { value: '', addEventListener: (type, handler) => { listeners[type] = handler; }, contains: () => false };
    const suggestions = { innerHTML: '', classList: { add() {}, remove() {}, contains: () => true }, contains: () => false };
    const timers = new Map();
    let nextTimer = 0;
    initCatalogAutocomplete({
        document: { getElementById: id => id === 'form-anime-title' ? title : id === 'form-anime-suggestions' ? suggestions : null, addEventListener() {} },
        studioMetadata, standardStudioName: studioMetadata.standardStudioName, escapeHtml: v => String(v),
        getStudioLogo: () => '', updateCatalogLivePreview() {},
        request: (url) => { searches.push(url); return Promise.resolve({ ok: true, json: async () => ({ data: [] }) }); },
        setTimer: (handler, delay) => { const id = ++nextTimer; timers.set(id, { handler, delay }); return id; },
        clearTimer: id => timers.delete(id)
    });
    title.value = 'segunda temporada de oshi no ko';
    listeners.input();
    await [...timers.values()].find(t => t.delay === 450).handler();
    assert.ok(searches.some(url => url.includes('oshi%20no%20ko%20Season%202') || url.includes('oshi+no+ko+Season+2')));
});
