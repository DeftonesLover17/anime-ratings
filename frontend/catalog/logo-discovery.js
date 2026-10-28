const {
    resolveAnimeLogo, normalizeAnimeLogoKey, sanitizeAnimeLogoUrl,
    computeLogoOpticalMetrics, rememberLogoMetrics, toWeservClearlogoUrl
} = require('../site/anime-logo-presentation');

const DISCOVERY_BUDGET_MS = 8000;
const CACHE_LIMIT = 128;
const numericId = value => /^\d+$/.test(String(value || '')) ? String(value) : '';
const imdbId = value => /^tt\d+$/i.test(String(value || '')) ? String(value) : '';
const titleKeys = titles => new Set(titles.filter(title => typeof title === 'string' && title !== 'N/A')
    .map(normalizeAnimeLogoKey).filter(Boolean));

// An abort settles the caller even when a provider or an injected transport ignores it.
function abortable(task, signal, fallback = null) {
    if (signal.aborted) return Promise.resolve(fallback);
    return new Promise(resolve => {
        const finish = value => { signal.removeEventListener('abort', cancel); resolve(value); };
        const cancel = () => finish(fallback);
        signal.addEventListener('abort', cancel, { once: true });
        Promise.resolve().then(() => signal.aborted ? fallback : task()).then(finish, cancel);
    });
}

function extractRootTitle(value) {
    if (typeof value !== 'string') return '';
    return value
        .replace(/\s*(?:[-:–—]?\s*(?:season|temporada|\d+[ªa]?\s*temporada|part|parte)\s*\d+.*)$/i, '')
        .replace(/\s*(?:[-:–—]?\s*(?:the\s+)?final\s+season.*)$/i, '')
        .replace(/\s*(?:[-:–—]?\s*第\d+期.*)$/u, '')
        .trim();
}

function matchingJikanAnime(data, keys) {
    const matches = (Array.isArray(data) ? data : []).filter(anime => anime && numericId(anime.mal_id) &&
        [...titleKeys([anime.title, anime.title_english, anime.title_japanese,
            ...(Array.isArray(anime.title_synonyms) ? anime.title_synonyms : []),
            ...(Array.isArray(anime.titles) ? anime.titles.map(item => item?.title) : [])])].some(key => keys.has(key)));
    return new Set(matches.map(anime => String(anime.mal_id))).size === 1 ? matches[0] : null;
}

function createAnimeLogoDiscovery({ request = (...args) => fetch(...args), probeImage,
    ImageClass = typeof Image === 'function' ? Image : null, now = Date.now,
    setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    const cache = new Map();
    const pending = new Map();

    function remember(key, url) {
        cache.delete(key);
        cache.set(key, { url, expires: now() + (url ? 30 * 60_000 : 60_000) });
        if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    }

    async function json(url, signal) {
        if (signal.aborted) return null;
        const controller = new AbortController();
        const cancel = () => controller.abort();
        signal.addEventListener('abort', cancel, { once: true });
        const timer = setTimer(cancel, 3000);
        try {
            return await abortable(async () => {
                const response = await request(url, { signal: controller.signal, credentials: 'omit' });
                return response?.ok ? response.json() : null;
            }, controller.signal);
        } finally {
            clearTimer(timer);
            signal.removeEventListener('abort', cancel);
        }
    }

    async function candidate(rawUrl, signal) {
        const url = sanitizeAnimeLogoUrl(rawUrl);
        if (!url || signal.aborted) return '';
        let dimensions;
        if (probeImage) {
            dimensions = await abortable(() => probeImage(url, { signal }), signal);
        } else if (ImageClass) {
            dimensions = await new Promise(resolve => {
                const image = new ImageClass();
                const finish = value => {
                    clearTimer(timer);
                    signal.removeEventListener('abort', cancel);
                    image.onload = image.onerror = null;
                    if (!value) image.removeAttribute('src');
                    resolve(value);
                };
                const cancel = () => finish(null);
                const timer = setTimer(cancel, 4500);
                image.onload = () => finish({ width: image.naturalWidth, height: image.naturalHeight });
                image.onerror = cancel;
                signal.addEventListener('abort', cancel, { once: true });
                image.src = url;
            });
        } else {
            dimensions = await abortable(async () => {
                const response = await request(url, { signal, credentials: 'omit' });
                if (!response?.ok || !/^image\/png(?:;|$)/i.test(response.headers?.get('content-type') || '')) return null;
                const bytes = new Uint8Array(await response.arrayBuffer());
                if (bytes.length < 24 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) return null;
                const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                return { width: view.getUint32(16), height: view.getUint32(20) };
            }, signal);
        }
        if (signal.aborted || !dimensions || !Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height) ||
            dimensions.width < 60 || dimensions.height < 20 || dimensions.width / dimensions.height < 0.72) return '';
        rememberLogoMetrics(url, computeLogoOpticalMetrics(dimensions.width, dimensions.height));
        return url;
    }

    async function search(input, signal) {
        const names = [input.title, input.japaneseTitle].filter(title => typeof title === 'string' && title.trim() && title !== 'N/A');
        for (const t of [...names]) {
            const root = extractRootTitle(t);
            if (root && root !== t) { names.push(root); }
        }
        const keys = titleKeys(names);
        let mal = numericId(input.malId || input.mal_id);
        let kitsu = numericId(input.kitsuId || input.kitsu_id);
        if (!mal && !kitsu && names.length) {
            const data = await json(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(names[0])}&limit=3&sfw=true`, signal);
            const match = matchingJikanAnime(data?.data, keys);
            if (match) {
                mal = String(match.mal_id);
                for (const name of [match.title, match.title_english, match.title_japanese]) {
                    if (typeof name === 'string' && name) { keys.add(normalizeAnimeLogoKey(name)); names.push(name); }
                }
            } else if (!signal.aborted) {
                const kitsuData = await json(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(names[0])}&page[limit]=5`, signal);
                const kitsuMatches = (Array.isArray(kitsuData?.data) ? kitsuData.data : []).filter(item => {
                    const attrs = item?.attributes || {};
                    const titles = [attrs.canonicalTitle, attrs.titles?.en, attrs.titles?.en_jp, attrs.titles?.ja_jp].filter(Boolean);
                    return titles.some(t => keys.has(normalizeAnimeLogoKey(t)));
                });
                if (kitsuMatches.length === 1 || (kitsuMatches.length > 1 && new Set(kitsuMatches.map(m => m.id)).size === 1)) {
                    kitsu = numericId(kitsuMatches[0].id);
                    const attrs = kitsuMatches[0].attributes || {};
                    for (const t of [attrs.canonicalTitle, attrs.titles?.en, attrs.titles?.en_jp, attrs.titles?.ja_jp]) {
                        if (typeof t === 'string' && t) { keys.add(normalizeAnimeLogoKey(t)); names.push(t); }
                    }
                }
            }
        }
        if (signal.aborted) return '';
        if (mal || kitsu) {
            const mapping = await json(`https://api.ani.zip/mappings?${mal ? `mal_id=${mal}` : `kitsu_id=${kitsu}`}`, signal);
            const mappedMal = numericId(mapping?.mappings?.mal_id);
            const mappedKitsu = numericId(mapping?.mappings?.kitsu_id);
            if (mapping && !(mal && mappedMal && mal !== mappedMal) && !(kitsu && mappedKitsu && kitsu !== mappedKitsu)) {
                for (const name of [mapping.titles?.en, mapping.titles?.['x-jat']]) {
                    if (typeof name === 'string' && name) { keys.add(normalizeAnimeLogoKey(name)); names.push(name); }
                }
                const imdb = imdbId(mapping.mappings?.imdb_id);
                const images = Array.isArray(mapping.images) ? mapping.images : [];
                const urls = [
                    ...(imdb ? [`https://images.metahub.space/logo/medium/${imdb}/img`] : []),
                    ...images.filter(image => image?.coverType === 'Clearlogo' &&
                        (!image.language || ['en', 'eng'].includes(image.language)) && typeof image.url === 'string' && !/\/icons\//i.test(image.url))
                        .map(image => image.url)
                ];
                for (const url of [...new Set(urls)].slice(0, 3)) {
                    const found = await candidate(toWeservClearlogoUrl(url), signal);
                    if (found || signal.aborted) return found;
                }
            }
        }
        // No prefix/franchise fallback: a different season must retain its own identity.
        for (const name of [...new Set(names)].slice(0, 2)) {
            for (const type of ['series', 'movie']) {
                if (signal.aborted) return '';
                const data = await json(`https://v3-cinemeta.strem.io/catalog/${type}/top/search=${encodeURIComponent(name)}.json`, signal);
                const matches = (Array.isArray(data?.metas) ? data.metas : []).filter(meta => meta &&
                    imdbId(meta.id || meta.imdb_id) && keys.has(normalizeAnimeLogoKey(meta.name)) &&
                    (!Array.isArray(meta.genres) || !meta.genres.length || meta.genres.some(genre => /^(?:animation|anime)$/i.test(genre))) &&
                    (!input.year || !meta.releaseInfo || String(meta.releaseInfo).startsWith(String(input.year))));
                let chosenId = '';
                const ids = new Set(matches.map(meta => imdbId(meta.id || meta.imdb_id)));
                if (ids.size === 1) {
                    chosenId = [...ids][0];
                } else if (ids.size > 1) {
                    const exact = matches.find(m => names.some(n => n.toLowerCase() === String(m.name || '').toLowerCase()));
                    chosenId = imdbId(exact?.id || exact?.imdb_id || matches[0]?.id || matches[0]?.imdb_id);
                }
                if (!chosenId) continue;
                const found = await candidate(toWeservClearlogoUrl(`https://images.metahub.space/logo/medium/${chosenId}/img`), signal);
                if (found || signal.aborted) return found;
            }
        }
        return '';
    }

    function subscribe(entry, signal) {
        if (signal?.aborted) return Promise.resolve('');
        entry.readers++;
        return new Promise(resolve => {
            let done = false;
            const finish = value => {
                if (done) return;
                done = true;
                signal?.removeEventListener('abort', cancel);
                if (--entry.readers === 0) entry.controller.abort();
                resolve(value);
            };
            const cancel = () => finish('');
            signal?.addEventListener('abort', cancel, { once: true });
            entry.promise.then(finish, cancel);
        });
    }

    function discover(input, { signal, budgetMs = DISCOVERY_BUDGET_MS } = {}) {
        input = typeof input === 'string' ? { title: input } : input;
        if (!input || input.logoDisabled === true || signal?.aborted) return Promise.resolve('');
        const resolved = resolveAnimeLogo(input);
        if (resolved) return Promise.resolve(resolved.url);
        const mal = numericId(input.malId || input.mal_id), kitsu = numericId(input.kitsuId || input.kitsu_id);
        const keys = [...titleKeys([input.title, input.japaneseTitle])];
        if (!mal && !kitsu && !keys.length) return Promise.resolve('');
        const key = JSON.stringify([mal, kitsu, ...keys, input.year || '']);
        const cached = cache.get(key);
        if (cached && cached.expires > now()) return Promise.resolve(cached.url);
        let entry = pending.get(key);
        if (entry?.controller.signal.aborted) entry = null;
        if (!entry) {
            if (pending.size >= 8) return Promise.resolve('');
            const controller = new AbortController();
            const limit = Math.max(1, Math.min(DISCOVERY_BUDGET_MS, Number(budgetMs) || DISCOVERY_BUDGET_MS));
            entry = { controller, readers: 0, timedOut: false };
            const timer = setTimer(() => { entry.timedOut = true; controller.abort(); }, limit);
            entry.promise = abortable(() => search({ ...input }, controller.signal), controller.signal, '').then(url => {
                if (!controller.signal.aborted || entry.timedOut) remember(key, url);
                return url;
            }).finally(() => {
                clearTimer(timer);
                if (pending.get(key) === entry) pending.delete(key);
            });
            pending.set(key, entry);
        }
        return subscribe(entry, signal);
    }
    return discover;
}

const defaultDiscovery = createAnimeLogoDiscovery();
function discoverAnimeLogo(input, options = {}) {
    const discovery = options.request || options.probeImage ? createAnimeLogoDiscovery(options) : defaultDiscovery;
    return discovery(input, options);
}

module.exports = { createAnimeLogoDiscovery, discoverAnimeLogo, DISCOVERY_BUDGET_MS };
