const test = require('node:test');
const assert = require('node:assert/strict');
const { studioForAnime, standardStudioName, kitsuStudio, isUnknownStudio } = require('../shared/studio-metadata');
const { renderCredit } = require('../frontend/site/studios');

test('known studio repairs a missing imported credit for exact title aliases', () => {
    for (const title of ['CYBERPUNK: EDGERUNNERS II', 'Cyberpunk: Edgerunners 2', 'Cyberpunk: Edgerunners Ⅱ', 'サイバーパンク: エッジランナーズ II']) {
        assert.equal(studioForAnime({ title, studio: 'Desconhecido' }), 'Trigger');
    }
    assert.equal(studioForAnime({ title: 'Unrelated anime', japaneseTitle: 'サイバーパンク: エッジランナーズ II' }), 'Trigger');
    assert.equal(studioForAnime({ title: 'Cyberpunk: Edgerunners III' }), 'Desconhecido');
    assert.equal(studioForAnime({ title: 'Cyberpunk: Edgerunners II - Other project' }), 'Desconhecido');
});

test('studio resolution preserves explicit credits and does not modify records', () => {
    const anime = { title: 'Cyberpunk: Edgerunners II', studio: 'Manual Studio', ratings: { ana: { overall: 8.4 } }, comments: [{ id: 'c1' }] };
    const before = structuredClone(anime);
    assert.equal(studioForAnime(anime), 'Manual Studio');
    assert.deepEqual(anime, before);
    assert.equal(studioForAnime({ studios: [{ name: '' }, { name: 'Trigger' }] }), 'Trigger');
    assert.equal(studioForAnime(null), 'Desconhecido');
    assert.equal(isUnknownStudio('  ESTÚDIO NÃO INFORMADO  '), true);
});

test('one canonical studio name is shared by catalog, Node and Cloudflare', () => {
    assert.equal(standardStudioName('tOkYo mOvIe ShInShA'), 'Tokyo Movie Shinsha');
    assert.equal(standardStudioName('bug film'), 'BUG FILMS');
    assert.equal(standardStudioName('trigger'), 'Trigger');
    assert.equal(standardStudioName('tms entertainment'), 'TMS Entertainment');
    assert.equal(standardStudioName('new independent studio'), 'New Independent Studio');
    assert.equal(standardStudioName('constructor'), 'Constructor');
    assert.equal(standardStudioName(null), 'Desconhecido');
});

test('Kitsu distributors are not mistaken for the animation studio', () => {
    const anime = { relationships: { animeProductions: { data: [{ id: 'p1' }, { id: 'p2' }] } } };
    const resources = [
        { type: 'animeProductions', id: 'p1', attributes: { role: 'producer' }, relationships: { producer: { data: { id: '1' } } } },
        { type: 'producers', id: '1', attributes: { name: 'Distributor' } },
        { type: 'animeProductions', id: 'p2', attributes: { role: 'studio' }, relationships: { producer: { data: { id: '2' } } } },
        { type: 'producers', id: '2', attributes: { name: 'Trigger' } },
    ];
    assert.equal(kitsuStudio(anime, resources), 'Trigger');
    assert.equal(kitsuStudio(anime, resources.slice(0, 2)), '');
    assert.equal(kitsuStudio({ relationships: { animeProductions: { data: [] } } }), '');
});

test('missing studio stays visible without a dead link and the next valid credit becomes clickable', () => {
    const attributes = new Map();
    const button = { style: {}, setAttribute: (key, value) => attributes.set(key, value), removeAttribute: (key) => attributes.delete(key), querySelectorAll: () => [] };
    renderCredit(button, { name: 'Desconhecido', logo: '' }, () => {});
    assert.equal(button.style.display, '');
    assert.equal(button.disabled, true);
    assert.equal(button.onclick, null);
    assert.match(button.innerHTML, /Estúdio não informado/);
    let opened;
    renderCredit(button, { name: 'Trigger', logo: 'logos/trigger.png' }, (name) => { opened = name; });
    assert.equal(button.disabled, false);
    button.onclick({ detail: 0 });
    assert.equal(opened, 'Trigger');
    assert.match(button.innerHTML, /logos\/trigger\.png/);
});

test('malformed imported studio records do not interrupt catalog loading', () => {
    const crafted = { toString: null };
    assert.equal(studioForAnime({ studio: crafted, studios: [null, { name: crafted }] }), 'Desconhecido');
    const anime = { relationships: { animeProductions: { data: [null, { id: 'p1' }] } } };
    const included = [
        { type: crafted, id: 'bad' },
        { type: 'animeProductions', id: 'p1', attributes: { role: 'studio' }, relationships: { producer: { data: { id: '1' } } } },
        { type: 'producers', id: '1', attributes: { name: crafted } }
    ];
    assert.equal(kitsuStudio(anime, included), '');
});
