const { ANIME_LOGO_CATALOG, ARC_LABELS_BY_ID } = require('../catalog/anime-logos');

function normalizeAnimeLogoKey(value) {
    return String(typeof value === 'string' || typeof value === 'number' ? value : '')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '');
}

const byId = new Map();
const byKey = new Map();
const byUrl = new Map();

for (const item of ANIME_LOGO_CATALOG) {
    byUrl.set(item.url, item);
    for (const id of item.ids) {
        byId.set(id, item);
    }
    byKey.set(normalizeAnimeLogoKey(item.title), item);
    for (const alias of item.aliases) {
        byKey.set(normalizeAnimeLogoKey(alias), item);
    }
}

function sanitizeAnimeLogoUrl(rawUrl) {
    const value = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!value || value.length > 4096) return '';
    if (/^logos\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
    if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) {
        return value.replace(/\s+/g, '');
    }
    if (/^https:\/\//i.test(value)) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'https:' ? parsed.toString() : '';
        } catch {
            return '';
        }
    }
    return '';
}

function computeLogoOpticalMetrics(width = 480, height = 135, lightTone = false) {
    const safeW = Number.isFinite(Number(width)) && Number(width) > 0 ? Math.round(Number(width)) : 480;
    const safeH = Number.isFinite(Number(height)) && Number(height) > 0 ? Math.round(Number(height)) : 135;
    const ar = Number((safeW / safeH).toFixed(2));
    let tier = 'standard';
    if (ar >= 5.2) tier = 'wide';
    else if (ar >= 3.0) tier = 'standard';
    else if (ar >= 1.5) tier = 'stacked';
    else tier = 'emblem';
    return {
        width: safeW,
        height: safeH,
        ar,
        tier,
        lightTone: Boolean(lightTone)
    };
}

function toWeservClearlogoUrl(rawUrl) {
    const clean = String(rawUrl || '').trim();
    if (!clean) return '';
    if (/^logos\//i.test(clean) || /^data:image\//i.test(clean)) return clean;
    if (/^https:\/\/images\.weserv\.nl\//i.test(clean)) return clean;
    const stripped = clean.replace(/^https?:\/\//i, '');
    if (!stripped) return '';
    return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}&output=png&trim=10&w=520&h=210&fit=inside`;
}

const discoveredLogoSpecs = new Map();
const MAX_CACHED_LOGOS = 128;

function rememberLogoMetrics(url, metrics) {
    if (!sanitizeAnimeLogoUrl(url)) return;
    discoveredLogoSpecs.delete(url);
    discoveredLogoSpecs.set(url, { ...metrics });
    if (discoveredLogoSpecs.size > MAX_CACHED_LOGOS) discoveredLogoSpecs.delete(discoveredLogoSpecs.keys().next().value);
}

function buildCustomLogoSpec(url, anime) {
    const safeUrl = sanitizeAnimeLogoUrl(url);
    if (!safeUrl) return null;
    const catalogItem = byUrl.get(safeUrl);
    if (catalogItem) {
        return {
            url: catalogItem.url,
            width: catalogItem.width,
            height: catalogItem.height,
            ar: catalogItem.ar,
            tier: catalogItem.tier,
            lightTone: catalogItem.lightTone,
            arcLabel: inferArcLabel(anime, catalogItem)
        };
    }
    const cached = discoveredLogoSpecs.get(safeUrl);
    const metrics = cached || computeLogoOpticalMetrics(480, 135, false);
    return {
        url: safeUrl,
        width: metrics.width,
        height: metrics.height,
        ar: metrics.ar,
        tier: metrics.tier,
        lightTone: Boolean(metrics.lightTone),
        arcLabel: ''
    };
}

function inferArcLabel(anime, matched) {
    if (!anime) return '';
    if (anime.id && ARC_LABELS_BY_ID[anime.id]) return ARC_LABELS_BY_ID[anime.id];
    const rawTitle = String(anime.title || '').replace(/&#39;/g, "'").trim();
    if (!rawTitle || !matched) return '';
    // If logo already represents the specific movie/season, do not add redundant arc label
    if (['demon-slayer-infinity-castle', 'demon-slayer-mugen-train', 'chainsaw-man-reze-arc', 'the-end-of-evangelion', 'steins-gate-0', 'clannad-after-story', 'bleach-thousand-year-blood-war', 'naruto-shippuden', 'fullmetal-alchemist-brotherhood'].includes(matched.slug)) {
        return '';
    }
    const seasonMatch = rawTitle.match(/\b(Season\s+\d+(?:\s+Part\s+\d+)?|The\s+Final\s+Season(?:\s+Part\s+\d+)?|Part\s+\d+|Temporada\s+\d+|[A-Za-z\s]+Arc)$/i);
    if (seasonMatch) {
        return seasonMatch[1].replace(/Temporada\s+(\d+)/i, 'Season $1').trim();
    }
    return '';
}

function resolveAnimeLogo(anime) {
    if (!anime || typeof anime !== 'object' || anime.logoDisabled === true) return null;
    const customUrl = sanitizeAnimeLogoUrl(anime.logoUrl);
    const titleKey = anime.title ? normalizeAnimeLogoKey(anime.title) : '';
    const jpKey = anime.japaneseTitle ? normalizeAnimeLogoKey(anime.japaneseTitle) : '';
    let matched = (titleKey && byKey.get(titleKey)) || null;
    if (!matched && anime.id) {
        matched = byId.get(String(anime.id)) || null;
    }
    if (!matched && jpKey) {
        matched = byKey.get(jpKey) || null;
    }
    if (customUrl && (!matched || customUrl !== matched.url)) {
        const customSpec = buildCustomLogoSpec(customUrl, anime);
        if (customSpec) return customSpec;
    }
    if (!matched) return null;
    return {
        url: matched.url,
        width: matched.width,
        height: matched.height,
        ar: matched.ar,
        tier: matched.tier,
        lightTone: matched.lightTone,
        arcLabel: inferArcLabel(anime, matched)
    };
}

const preloadedLogoImages = new Map();
const warmupQueue = [];
let warmupTimer = null;

function preloadAnimeLogo(anime, priority = 'high') {
    const resolved = anime && anime.url && anime.width ? anime : resolveAnimeLogo(anime);
    if (!resolved || !resolved.url) return null;
    if (typeof Image === 'undefined') return resolved;
    let entry = preloadedLogoImages.get(resolved.url);
    if (!entry) {
        const img = new Image();
        img.decoding = 'sync';
        if ('fetchPriority' in img) {
            img.fetchPriority = priority;
        }
        img.onload = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0 && !byUrl.has(resolved.url)) {
                const metrics = computeLogoOpticalMetrics(img.naturalWidth, img.naturalHeight, false);
                rememberLogoMetrics(resolved.url, metrics);
            }
        };
        img.onerror = () => preloadedLogoImages.delete(resolved.url);
        img.src = resolved.url;
        const decodePromise = typeof img.decode === 'function'
            ? img.decode().catch(() => {})
            : Promise.resolve();
        entry = { img, decodePromise, spec: resolved };
        preloadedLogoImages.set(resolved.url, entry);
        if (preloadedLogoImages.size > MAX_CACHED_LOGOS) preloadedLogoImages.delete(preloadedLogoImages.keys().next().value);
    } else if (priority === 'high' && 'fetchPriority' in entry.img) {
        entry.img.fetchPriority = 'high';
    }
    return resolved;
}

function scheduleAnimeLogoWarmup(anime) {
    const resolved = resolveAnimeLogo(anime);
    if (!resolved || !resolved.url || typeof Image === 'undefined') return;
    if (preloadedLogoImages.has(resolved.url)) return;
    if (warmupQueue.length < MAX_CACHED_LOGOS && !warmupQueue.some((item) => item.url === resolved.url)) {
        warmupQueue.push(resolved);
    }
    if (!warmupTimer && typeof setTimeout === 'function') {
        warmupTimer = setTimeout(function flushWarmup() {
            warmupTimer = null;
            const batch = warmupQueue.splice(0, 8);
            for (const spec of batch) {
                preloadAnimeLogo(spec, 'low');
            }
            if (warmupQueue.length > 0) {
                warmupTimer = setTimeout(flushWarmup, 70);
            }
        }, 40);
    }
}

module.exports = {
    ANIME_LOGO_CATALOG,
    normalizeAnimeLogoKey,
    sanitizeAnimeLogoUrl,
    computeLogoOpticalMetrics,
    toWeservClearlogoUrl,
    resolveAnimeLogo,
    rememberLogoMetrics,
    preloadAnimeLogo,
    scheduleAnimeLogoWarmup
};
