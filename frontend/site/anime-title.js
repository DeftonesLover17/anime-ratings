const { escapeHtml } = require('../shared/dom');
const { resolveAnimeLogo, sanitizeAnimeLogoUrl, computeLogoOpticalMetrics } = require('./anime-logo-presentation');
const { discoverAnimeLogo } = require('../catalog/logo-discovery');

function createAnimeTitleRenderer({ discover = discoverAnimeLogo, resolve = resolveAnimeLogo } = {}) {
    const renders = new WeakMap();

    function cancel(element) {
        renders.get(element)?.controller.abort();
        renders.delete(element);
    }

    function render(element, anime, { isCurrent = () => true } = {}) {
        if (!element) return;
        cancel(element);
        const entry = { controller: new AbortController() };
        renders.set(element, entry);
        const current = () => renders.get(element) === entry && !entry.controller.signal.aborted && isCurrent();
        function text() {
            if (!current()) return;
            element.classList.remove('av-detail-title-has-logo');
            delete element.dataset.logoTier;
            delete element.dataset.logoLight;
            element.removeAttribute('aria-label');
            element.innerHTML = escapeHtml(anime.title);
        }
        function apply(spec) {
            if (!current() || !spec) return false;
            const url = sanitizeAnimeLogoUrl(spec.url);
            if (!url) return false;
            text();
            const label = element.textContent;
            const image = element.ownerDocument.createElement('img');
            image.className = 'av-detail-title-logo';
            image.alt = label;
            image.width = spec.width;
            image.height = spec.height;
            image.decoding = 'async';
            image.fetchPriority = 'high';
            image.addEventListener('load', () => {
                if (!current() || image.parentElement !== element) return;
                const metrics = computeLogoOpticalMetrics(image.naturalWidth, image.naturalHeight, spec.lightTone);
                image.width = metrics.width;
                image.height = metrics.height;
                element.dataset.logoTier = metrics.tier;
            }, { once: true });
            image.addEventListener('error', () => {
                if (current() && image.parentElement === element) text();
            }, { once: true });
            element.classList.add('av-detail-title-has-logo');
            element.dataset.logoTier = spec.tier;
            element.dataset.logoLight = String(Boolean(spec.lightTone));
            element.setAttribute('aria-label', label);
            element.replaceChildren(image);
            image.src = url;
            return true;
        }
        text();
        if (anime.logoDisabled || apply(resolve(anime))) return;
        // Discovery only changes this rendering. It never mutates the catalog snapshot.
        Promise.resolve().then(() => current() ? discover(anime, { signal: entry.controller.signal }) : '')
            .then(url => { if (url && current()) apply(resolve({ ...anime, logoUrl: url })); }).catch(() => {});
    }
    return { render, cancel };
}

module.exports = { createAnimeTitleRenderer };
