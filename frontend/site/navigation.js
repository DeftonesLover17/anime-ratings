function createNavigation(browser, scenes) {
    let actions;
    let applyingHistory = false;
    let configured = false;
    let lastApplied = '';

    function mark(hash) {
        scenes.cancel?.();
        if (applyingHistory || browser.location.hash === hash) return;
        browser.history.pushState(null, '', hash);
        lastApplied = browser.location.href;
    }

    function applyRoute(force = false) {
        if (!actions) return;
        const splash = browser.document.getElementById('splash-screen');
        const gate = browser.document.getElementById('registration-gate');
        if (
            (splash && browser.getComputedStyle(splash).display !== 'none') ||
            (gate && browser.getComputedStyle(gate).display !== 'none')
        )
            return;
        if (force !== true && lastApplied === browser.location.href) return;
        lastApplied = browser.location.href;
        const [route, ...parts] = browser.location.hash.slice(1).split('/');
        let value;
        try {
            value = decodeURIComponent(parts.join('/'));
        } catch (_) {
            return;
        }
        applyingHistory = true;
        try {
            if (route === 'obra' && value) actions.open(value, false);
            else if (route === 'estudio' && value) actions.studio(value, false);
            else if (route === 'estudios') actions.studio(null, false);
            else if (route === 'featured-banner-wrapper') actions.featured();
            else if (route === 'anime-grid-section') actions.catalog();
            else if (!route) actions.featured();
        } finally {
            applyingHistory = false;
        }
    }

    function configure(nextActions) {
        actions = nextActions;
        if (configured) return;
        configured = true;
        browser.addEventListener('popstate', () => applyRoute());
        browser.addEventListener('hashchange', () => applyRoute());
    }

    function anime(id, update, animate) {
        const source = scenes.coverFor(id);
        mark('#obra/' + encodeURIComponent(id));
        scenes.run(update, {
            source,
            destination: () => browser.document.getElementById('detail-poster'),
            animate,
            kind: 'forward',
        });
    }

    function catalog(update, animate, returnHash) {
        const source = browser.document.getElementById('detail-poster');
        const id = source?.dataset.avCover;
        const visible =
            source &&
            source.getBoundingClientRect().bottom > 72 &&
            source.getBoundingClientRect().top < browser.innerHeight;
        mark(
            returnHash?.startsWith('#estudio')
                ? returnHash
                : returnHash === '#featured-banner-wrapper'
                  ? returnHash
                  : '#anime-grid-section',
        );
        scenes.run(update, {
            source: visible ? source : null,
            destination: () => scenes.coverFor(id),
            animate,
            kind: 'back',
        });
    }

    function studio(name, update, animate) {
        const candidates = [
            ...browser.document.querySelectorAll('[data-av-studio]'),
        ];
        const source = candidates.find(
            (node) =>
                node.dataset.avStudio === name &&
                node.getClientRects().length &&
                node.getBoundingClientRect().bottom > 72 &&
                node.getBoundingClientRect().top < browser.innerHeight,
        );
        mark(name ? '#estudio/' + encodeURIComponent(name) : '#estudios');
        scenes.run(update, {
            source,
            destination: () =>
                browser.document.querySelector('.av-studio-profile-logo img'),
            animate,
            kind: 'forward',
            sharedName: 'av-scene-logo',
        });
    }

    return { configure, applyRoute, anime, catalog, studio, mark };
}

module.exports = { createNavigation };
