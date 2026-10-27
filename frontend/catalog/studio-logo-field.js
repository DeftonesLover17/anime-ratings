const { normalizeStudioLookupKey, sanitizeStudioLogoUrl } = require('../site/studio-presentation');

const controllers = new WeakMap();

function createStudioLogoField(document, { request = (...args) => fetch(...args), getKnown = () => '', updatePreview = () => {},
    setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    const studio = document.getElementById('form-anime-studio');
    const title = document.getElementById('form-anime-title');
    const logo = document.getElementById('form-studio-logo');
    const form = document.getElementById('add-anime-form');
    const placeholder = logo?.placeholder || '';
    let generation = 0, pending = null, pendingKey = '';
    const config = { request, getKnown, updatePreview, setTimer, clearTimer };
    const identity = () => JSON.stringify([title?.value || '', studio?.value || '']);

    function cancel() {
        generation++;
        pending?.abort();
        pending = null;
        pendingKey = '';
        if (logo) logo.placeholder = placeholder;
    }

    async function fill() {
        if (!studio || !logo || logo.disabled || form?.getAttribute?.('aria-busy') === 'true' || logo.value.trim() || !studio.value.trim()) return '';
        if (pending && pendingKey === identity()) return '';
        cancel();
        const version = generation, key = identity(), name = studio.value.trim();
        const known = sanitizeStudioLogoUrl(config.getKnown(name));
        if (known) { logo.value = known; config.updatePreview(); return known; }
        const controller = new AbortController();
        pending = controller;
        pendingKey = key;
        logo.placeholder = 'Buscando logo do estúdio…';
        let timer;
        const operation = (async () => {
            const response = await config.request(`https://api.jikan.moe/v4/producers?q=${encodeURIComponent(name)}&limit=5`, {
                signal: controller.signal, credentials: 'omit'
            });
            if (!response?.ok) return '';
            const data = await response.json();
            const lookup = normalizeStudioLookupKey(name);
            const matches = (Array.isArray(data?.data) ? data.data : []).filter(item => item &&
                [item.name, item.title, ...(Array.isArray(item.titles) ? item.titles.map(entry => entry?.title) : [])]
                    .some(value => typeof value === 'string' && normalizeStudioLookupKey(value) === lookup));
            const ids = new Set(matches.map(item => item.mal_id).filter(Boolean));
            if (matches.length !== 1 && ids.size !== 1) return '';
            const match = matches[0];
            return sanitizeStudioLogoUrl(match?.images?.webp?.image_url || match?.images?.jpg?.image_url);
        })();
        const cancelled = new Promise(resolve => {
            controller.signal.addEventListener('abort', () => resolve(''), { once: true });
            timer = config.setTimer(() => controller.abort(), 4000);
        });
        try {
            const url = await Promise.race([operation, cancelled]);
            if (!url || controller.signal.aborted || generation !== version || identity() !== key || logo.value.trim()) return '';
            logo.value = url;
            config.updatePreview();
            return url;
        } catch { return ''; }
        finally {
            config.clearTimer(timer);
            controller.abort();
            if (generation === version) { pending = null; pendingKey = ''; logo.placeholder = placeholder; }
        }
    }

    studio?.addEventListener('input', cancel);
    studio?.addEventListener('change', fill);
    studio?.addEventListener('blur', fill);
    title?.addEventListener('input', cancel);
    logo?.addEventListener('input', cancel);
    form?.addEventListener('reset', cancel);
    return { fill, cancel, configure: options => Object.assign(config, options) };
}

function getStudioLogoField(document, options) {
    let controller = controllers.get(document);
    if (!controller) { controller = createStudioLogoField(document, options); controllers.set(document, controller); }
    else if (options) controller.configure(options);
    return controller;
}

module.exports = { createStudioLogoField, getStudioLogoField };
