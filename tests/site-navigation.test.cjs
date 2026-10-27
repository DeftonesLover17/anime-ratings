const test = require('node:test');
const assert = require('node:assert/strict');
const { createNavigation } = require('../frontend/site/navigation');
const { createScenes } = require('../frontend/site/scenes');
const { createSite } = require('../frontend/site/index');

test('deep links wait for the preserved intro, and the empty route opens discovery', () => {
    let introVisible = true;
    const calls = [];
    const location = { hash: '', href: 'https://example.org/' };
    const browser = {
        location,
        document: {
            getElementById: (id) => (id === 'splash-screen' ? {} : null),
        },
        getComputedStyle: () => ({ display: introVisible ? 'flex' : 'none' }),
        addEventListener() {},
    };
    const navigation = createNavigation(browser, {});
    navigation.configure({
        featured: () => calls.push('featured'),
        open: (id) => calls.push(id),
        catalog: () => calls.push('catalog'),
    });
    navigation.applyRoute();
    assert.deepEqual(calls, []);
    introVisible = false;
    navigation.applyRoute();
    assert.deepEqual(calls, ['featured']);
    location.hash = '#obra/a25';
    location.href = 'https://example.org/#obra/a25';
    navigation.applyRoute();
    navigation.applyRoute();
    assert.deepEqual(calls, ['featured', 'a25']);
});

test('initial reload with #anime-grid-section routes to featured discovery', () => {
    const calls = [];
    const location = { hash: '#anime-grid-section', href: 'https://example.org/#anime-grid-section' };
    const browser = {
        location,
        document: {
            getElementById: () => null,
        },
        getComputedStyle: () => ({ display: 'none' }),
        addEventListener() {},
    };
    const navigation = createNavigation(browser, {});
    navigation.configure({
        featured: () => calls.push('featured'),
        catalog: () => calls.push('catalog'),
    });
    navigation.applyRoute(true);
    assert.deepEqual(calls, ['featured']);
});

test('native Back restores a previous URL after application navigation', () => {
    const location = new URL('https://example.org/');
    const calls = [];
    const browser = {
        location,
        document: { getElementById: () => null },
        history: {
            pushState(_state, _title, hash) {
                location.hash = hash;
            },
        },
        addEventListener() {},
    };
    const navigation = createNavigation(browser, {});
    navigation.configure({ featured: () => calls.push('home') });
    navigation.applyRoute();
    navigation.mark('#obra/a25');
    location.hash = '';
    navigation.applyRoute();
    assert.deepEqual(calls, ['home', 'home']);
});

test('a newer scene cancels its predecessor and stale callbacks cannot change the view', async () => {
    const pending = [];
    const rendered = [];
    const browser = {
        document: {
            documentElement: { dataset: {} },
            getElementById: () => null,
            startViewTransition(callback) {
                let finish;
                const transition = {
                    callback,
                    ready: Promise.resolve(),
                    finished: new Promise((resolve) => {
                        finish = resolve;
                    }),
                    skipTransition() {
                        this.skipped = true;
                        finish();
                    },
                    finish,
                };
                pending.push(transition);
                return transition;
            },
        },
        matchMedia: () => ({ matches: false, addEventListener() {} }),
        IntersectionObserver: class {
            observe() {}
            unobserve() {}
        },
    };
    const scenes = createScenes(browser);
    scenes.run(() => rendered.push('old'));
    scenes.run(() => rendered.push('new'));
    pending[0].callback();
    pending[1].callback();
    pending[1].finish();
    await Promise.resolve();
    assert.equal(pending[0].skipped, true);
    assert.deepEqual(rendered, ['new']);
    scenes.run(() => rendered.push('cancelled by navigation'));
    scenes.cancel();
    pending[2].callback();
    assert.deepEqual(rendered, ['new']);
});

test('reduced motion renders the full destination without starting a transition', () => {
    let rendered = 0;
    const browser = {
        document: {
            getElementById: () => null,
            startViewTransition() {
                throw Error('Unexpected motion');
            },
        },
        matchMedia: () => ({ matches: true, addEventListener() {} }),
        IntersectionObserver: class {},
    };
    createScenes(browser).run(() => rendered++);
    assert.equal(rendered, 1);
});

test('a native transition startup failure still renders and releases its media tag', () => {
    let rendered = 0;
    const source = { dataset: {}, style: {} };
    const browser = {
        document: {
            documentElement: { dataset: {} },
            getElementById: () => null,
            startViewTransition() {
                throw Error('Unsupported capture');
            },
        },
        matchMedia: () => ({ matches: false, addEventListener() {} }),
        IntersectionObserver: class {},
    };
    createScenes(browser).run(() => rendered++, { source });
    assert.equal(rendered, 1);
    assert.equal(source.style.viewTransitionName, '');
    assert.equal(source.dataset.avTransitionOwner, undefined);
});

test('site enter performs immediate scroll snap to 0 without delayed smooth scroll', () => {
    const scrollToCalls = [];
    const lenisScrollToCalls = [];
    const location = { hash: '', href: 'https://example.org/' };
    const makeEl = (extra = {}) => ({
        style: {},
        querySelectorAll: () => [],
        querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false },
        getAttribute: () => null,
        setAttribute() {},
        addEventListener() {},
        removeEventListener() {},
        ...extra,
    });
    const splash = makeEl({ id: 'splash-screen' });
    const elements = {
        'splash-screen': splash,
        'anime-grid-section': makeEl(),
        'featured-banner-wrapper': makeEl(),
        'anime-detail-page': makeEl(),
    };
    const browser = {
        location,
        document: {
            body: { classList: { add() {} } },
            getElementById: (id) => elements[id] || null,
            documentElement: { scrollTop: 500 },
        },
        getComputedStyle: (el) => ({ display: el === splash ? 'none' : 'block' }),
        addEventListener() {},
        matchMedia: () => ({ matches: false, addEventListener() {} }),
        IntersectionObserver: class {
            observe() {}
            unobserve() {}
        },
        scrollTo: (...args) => scrollToCalls.push(args),
        lenis: {
            scrollTo: (...args) => lenisScrollToCalls.push(args),
        },
        MutationObserver: class {
            constructor() {}
            observe() {}
            disconnect() {}
        },
    };
    const site = createSite(browser, false);
    site.mount();
    assert.ok(scrollToCalls.length > 0 || lenisScrollToCalls.length > 0);
    if (lenisScrollToCalls.length > 0) {
        assert.equal(lenisScrollToCalls[0][0], 0);
        assert.equal(lenisScrollToCalls[0][1].immediate, true);
    }
});
