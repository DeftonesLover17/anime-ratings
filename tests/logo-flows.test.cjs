const test = require('node:test');
const assert = require('node:assert/strict');
const { createAnimeLogoDiscovery } = require('../frontend/catalog/logo-discovery');
const { createCatalogLogoField } = require('../frontend/catalog/logo-field');
const { createAnimeTitleRenderer } = require('../frontend/site/anime-title');
const { createStudioLogoField } = require('../frontend/catalog/studio-logo-field');
const { resolveAnimeLogo, normalizeAnimeLogoKey } = require('../frontend/site/anime-logo-presentation');

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = () => new Promise(resolve => setImmediate(resolve));
const json = data => ({ ok: true, json: async () => data });

test('logo discovery rejects unrelated search hits and ambiguous exact matches', async () => {
    const calls = [], probes = [];
    const discover = createAnimeLogoDiscovery({
        request: async url => {
            calls.push(url);
            if (url.includes('jikan')) return json({ data: [
                { mal_id: 101, title: 'Different Movie' },
                { mal_id: 102, title: 'Unlisted Galactic Adventure' },
                { mal_id: 103, title: 'Unlisted Galactic Adventure' }
            ] });
            return json({ metas: [{ id: 'tt101', name: 'Different Documentary' }] });
        },
        probeImage: async url => { probes.push(url); return { width: 520, height: 150 }; }
    });
    assert.equal(await discover({ title: 'Unlisted Galactic Adventure' }), '');
    assert.deepEqual(probes, []);
    assert.equal(calls.some(url => url.includes('ani.zip')), false);
    assert.equal(calls.some(url => url.includes('fandom')), false);
    assert.equal(resolveAnimeLogo({ title: 'Akira Season 99' }), null);
    assert.notEqual(normalizeAnimeLogoKey('星の旅'), normalizeAnimeLogoKey('月の旅'));
});

test('discovery keeps exact Jikan aliases and never mutates the input snapshot', async () => {
    const input = Object.freeze({ title: 'New Starlight Journey', japaneseTitle: '星の旅行' });
    const requested = [];
    const discover = createAnimeLogoDiscovery({
        request: async url => {
            requested.push(url);
            if (url.includes('jikan')) return json({ data: [{ mal_id: 30001, title: 'Hoshi no Ryokou', title_english: input.title }] });
            return json({ mappings: { mal_id: 30001, imdb_id: 'tt30001' } });
        },
        probeImage: async () => ({ width: 520, height: 130 })
    });
    assert.match(await discover(input), /tt30001/);
    assert.equal(input.logoUrl, undefined);
    assert.match(requested[1], /mal_id=30001/);
});

test('all providers share one deadline, including a transport that ignores abort', async () => {
    const timers = new Map();
    let id = 0, requestSignal;
    const discover = createAnimeLogoDiscovery({
        request: (url, options) => { requestSignal = options.signal; return new Promise(() => {}); },
        setTimer: (callback, duration) => { timers.set(++id, { callback, duration }); return id; },
        clearTimer: key => timers.delete(key)
    });
    const pending = discover({ title: 'Unknown Slow Anime' });
    await flush();
    const deadline = [...timers.values()].find(timer => timer.duration === 8000);
    deadline.callback();
    assert.equal(await pending, '');
    assert.equal(requestSignal.aborted, true);
    assert.equal(timers.size, 0);
});

test('aborting one subscriber preserves a shared request until the last leaves', async () => {
    let signal, requests = 0;
    const discover = createAnimeLogoDiscovery({ request: (url, options) => {
        requests++;
        signal = options.signal;
        return new Promise(() => {});
    } });
    const first = new AbortController(), second = new AbortController();
    const a = discover({ title: 'Shared Unlisted Anime' }, { signal: first.signal });
    const b = discover({ title: 'Shared Unlisted Anime' }, { signal: second.signal });
    await flush();
    first.abort();
    assert.equal(await a, '');
    assert.equal(signal.aborted, false);
    assert.equal(requests, 1);
    second.abort();
    assert.equal(await b, '');
    assert.equal(signal.aborted, true);
});

test('negative discovery cache avoids repeat requests and expires for retry', async () => {
    let now = 0, calls = 0;
    const discover = createAnimeLogoDiscovery({ now: () => now, request: async () => { calls++; return { ok: false }; } });
    const input = { title: 'Unknown Quiet Anime' };
    assert.equal(await discover(input), '');
    const initial = calls;
    assert.equal(await discover(input), '');
    assert.equal(calls, initial);
    now += 60_001;
    assert.equal(await discover(input), '');
    assert.ok(calls > initial);
});

test('discovery bounds concurrent requests and releases them on cancellation', async () => {
    let calls = 0;
    const discover = createAnimeLogoDiscovery({ request: () => { calls++; return new Promise(() => {}); } });
    const controllers = Array.from({ length: 8 }, () => new AbortController());
    const pending = controllers.map((controller, index) => discover({ title: `Unknown Anime ${index}` }, { signal: controller.signal }));
    await flush();
    assert.equal(calls, 8);
    assert.equal(await discover({ title: 'Ninth Unknown Anime' }), '');
    assert.equal(calls, 8);
    controllers.forEach(controller => controller.abort());
    assert.deepEqual(await Promise.all(pending), Array(8).fill(''));
});

class Field extends EventTarget {
    constructor(value = '') { super(); this.value = value; this.dataset = {}; this.placeholder = 'Logo'; this.checked = false; }
    setAttribute() {}
    removeAttribute() {}
    setCustomValidity(value) { this.validationMessage = value; }
    reportValidity() { this.reported = true; return !this.validationMessage; }
    emit(type) { this.dispatchEvent(new Event(type)); }
}
function formFixture(discover) {
    const fields = Object.fromEntries(['form-anime-title', 'form-anime-jp-title', 'form-anime-logo',
        'form-anime-logo-disabled', 'add-anime-form'].map(id => [id, new Field()]));
    const document = { getElementById: id => fields[id] };
    const controller = createCatalogLogoField(document, { discover });
    return { controller, title: fields['form-anime-title'], logo: fields['form-anime-logo'],
        textOnly: fields['form-anime-logo-disabled'], form: fields['add-anime-form'] };
}

test('changing titles, reopening a form and manual clearing invalidate pending logos', async () => {
    const pending = [];
    const f = formFixture((input, options) => { const item = deferred(); pending.push({ ...item, signal: options.signal }); return item.promise; });
    f.title.value = 'Anime A';
    const first = f.controller.select({ title: 'Anime A' });
    f.title.value = 'Anime B';
    f.title.emit('input');
    pending[0].resolve('https://example.invalid/logo-a.png');
    await first;
    assert.equal(f.logo.value, '');
    assert.equal(pending[0].signal.aborted, true);

    const second = f.controller.select({ title: 'Anime B' });
    f.controller.reset({ title: 'Anime C', logoUrl: 'https://example.invalid/logo-c.png' });
    pending[1].resolve('https://example.invalid/logo-b.png');
    await second;
    assert.equal(f.logo.value, 'https://example.invalid/logo-c.png');

    f.title.value = 'Anime D';
    const third = f.controller.select({ title: 'Anime D' });
    f.logo.value = '';
    f.logo.emit('input');
    pending[2].resolve('https://example.invalid/logo-d.png');
    await third;
    assert.equal(f.logo.value, '');
    assert.equal(f.controller.capture().logoUrl, '');
});

test('saving captures immediately and text-only preference suppresses discovery', async () => {
    const item = deferred();
    let signal, calls = 0;
    const f = formFixture((input, options) => { calls++; signal = options.signal; return item.promise; });
    f.title.value = 'Anime A';
    const pending = f.controller.select({ title: 'Anime A' });
    assert.deepEqual(f.controller.capture(), { logoUrl: '', logoDisabled: false });
    assert.equal(signal.aborted, true);
    item.resolve('https://example.invalid/logo.png');
    await pending;
    f.controller.reset({ title: 'Akira', logoDisabled: true });
    assert.equal(f.logo.disabled, true);
    assert.deepEqual(f.controller.capture(), { logoUrl: '', logoDisabled: true });
    assert.equal(resolveAnimeLogo({ title: 'Akira', logoDisabled: true }), null);
    assert.equal(calls, 1);
    f.controller.reset();
    assert.equal(f.logo.disabled, false);
});

test('selecting metadata preserves text-only and manually chosen logo preferences', async () => {
    let calls = 0;
    const f = formFixture(async () => { calls++; return 'https://example.invalid/automatic.png'; });
    f.title.value = 'Anime A';
    f.textOnly.checked = true;
    f.textOnly.emit('change');
    await f.controller.select({ title: 'Anime A' });
    assert.deepEqual(f.controller.capture(), { logoUrl: '', logoDisabled: true });
    assert.equal(calls, 0);
    f.controller.reset();
    f.logo.value = 'https://example.invalid/manual.png';
    f.logo.emit('input');
    await f.controller.select({ title: 'Anime A' });
    assert.equal(f.controller.capture().logoUrl, f.logo.value);
    assert.equal(calls, 0);
});

test('an invalid manually entered URL cannot silently erase the stored logo', () => {
    const f = formFixture(async () => '');
    f.logo.value = 'javascript:alert(1)';
    f.logo.emit('input');
    assert.equal(f.controller.capture(), null);
    assert.ok(f.logo.validationMessage);
    assert.equal(f.logo.reported, true);
    f.logo.value = 'logos/animes/akira.png';
    f.logo.emit('input');
    assert.equal(f.logo.validationMessage, '');
    assert.equal(f.controller.capture().logoUrl, f.logo.value);
});

test('studio logos require exact names and ignore stale responses after edits', async () => {
    const studio = new Field('New Studio A'), title = new Field('Anime A'), logo = new Field(), form = new Field();
    const fields = { 'form-anime-studio': studio, 'form-anime-title': title, 'form-studio-logo': logo, 'add-anime-form': form };
    const pending = [];
    const controller = createStudioLogoField({ getElementById: id => fields[id] }, { request: (url, options) => {
        const item = deferred(); pending.push({ ...item, signal: options.signal }); return item.promise;
    } });
    const first = controller.fill();
    studio.value = 'New Studio B';
    studio.emit('input');
    pending[0].resolve(json({ data: [{ mal_id: 1, name: 'New Studio A', images: { jpg: { image_url: 'https://example.invalid/a.png' } } }] }));
    await first;
    assert.equal(logo.value, '');
    assert.equal(pending[0].signal.aborted, true);
    const second = controller.fill();
    await controller.fill();
    assert.equal(pending.length, 2, 'change and blur share the same pending studio lookup');
    pending[1].resolve(json({ data: [
        { mal_id: 2, name: 'Different Studio', images: { jpg: { image_url: 'https://example.invalid/wrong.png' } } },
        { mal_id: 3, name: 'New Studio B', images: { jpg: { image_url: 'https://example.invalid/b.png' } } }
    ] }));
    await second;
    assert.equal(logo.value, 'https://example.invalid/b.png');
    logo.value = '';
    const third = controller.fill();
    form.emit('reset');
    pending[2].resolve(json({ data: [{ mal_id: 3, name: 'New Studio B', images: { jpg: { image_url: 'https://example.invalid/b.png' } } }] }));
    await third;
    assert.equal(logo.value, '');
});

function headingFixture() {
    const document = { createElement: () => {
        const image = new Field();
        image.naturalWidth = 520; image.naturalHeight = 130;
        return image;
    } };
    return {
        ownerDocument: document, dataset: {}, classList: { add() {}, remove() {} }, setAttribute() {}, removeAttribute() {},
        set innerHTML(value) { this.textContent = value; if (this.image) this.image.parentElement = null; this.image = null; },
        replaceChildren(image) { if (this.image) this.image.parentElement = null; this.image = image; image.parentElement = this; }
    };
}

test('stale image errors and loads cannot change the next anime title', () => {
    const renderer = createAnimeTitleRenderer();
    const heading = headingFixture();
    renderer.render(heading, { title: 'Akira' });
    const previous = heading.image;
    renderer.render(heading, { title: 'Cowboy Bebop' });
    const current = heading.image, tier = heading.dataset.logoTier;
    previous.emit('error');
    previous.naturalHeight = 500;
    previous.emit('load');
    assert.equal(heading.image, current);
    assert.equal(heading.dataset.logoTier, tier);
    current.emit('error');
    assert.equal(heading.image, null);
    assert.equal(heading.textContent, 'Cowboy Bebop');
});

test('late discovery is cancelled on navigation and cannot mutate or replace a text-only title', async () => {
    const item = deferred();
    let signal;
    const renderer = createAnimeTitleRenderer({ discover: (input, options) => { signal = options.signal; return item.promise; } });
    const heading = headingFixture();
    const anime = Object.freeze({ title: 'Unlisted New Anime' });
    renderer.render(heading, anime);
    await flush();
    renderer.render(heading, { title: 'Akira', logoDisabled: true });
    assert.equal(signal.aborted, true);
    item.resolve('https://example.invalid/late.png');
    await flush();
    assert.equal(heading.image, null);
    assert.equal(heading.textContent, 'Akira');
    assert.equal(anime.logoUrl, undefined);
});
