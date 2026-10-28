const unknownStudios = new Set(['', 'desconhecido', 'unknown', 'estudio nao informado', 'nao informado', 'n/a', 'tba', '?', '-']);

function isUnknownStudio(value) {
    const name = typeof value === 'string' ? value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    return unknownStudios.has(name);
}

function titleKey(value) {
    return (typeof value === 'string' ? value : '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Exact title aliases only: a franchise can change studios between installments.
// Confirmed by https://www.cyberpunk.net/en/edgerunners2 (Creators).
const verifiedStudios = new Map([
    ['Cyberpunk: Edgerunners II', 'Trigger'],
    ['Cyberpunk: Edgerunners 2', 'Trigger'],
    ['サイバーパンク: エッジランナーズ II', 'Trigger'],
    ['サイバーパンク: エッジランナーズ 2', 'Trigger'],
    ['Oshi no Ko', 'Doga Kobo'],
    ['[Oshi no Ko]', 'Doga Kobo'],
    ['【推しの子】', 'Doga Kobo'],
    ['Oshi no Ko Season 2', 'Doga Kobo'],
    ['[Oshi no Ko] Season 2', 'Doga Kobo'],
    ['【推しの子】第2期', 'Doga Kobo'],
].map(([title, studio]) => [titleKey(title), studio]));

function verifiedStudio(...titles) {
    for (const title of titles) {
        const studio = verifiedStudios.get(titleKey(title));
        if (studio) return studio;
    }
    return '';
}

function studioForAnime(anime = {}) {
    if (!anime || typeof anime !== 'object') return 'Desconhecido';
    if (typeof anime.studio === 'string' && !isUnknownStudio(anime.studio)) return anime.studio.trim();
    const imported = Array.isArray(anime.studios) ? anime.studios.find((studio) => typeof studio?.name === 'string' && !isUnknownStudio(studio.name)) : null;
    return imported?.name.trim() || verifiedStudio(anime.title, anime.title_english, anime.japaneseTitle, anime.title_japanese) || 'Desconhecido';
}

function standardStudioName(name) {
    const raw = (typeof name === 'string' ? name : '').trim();
    if (!raw) return 'Desconhecido';

    const known = {
        'ufotable': 'Ufotable',
        'madhouse': 'Madhouse',
        'mappa': 'MAPPA',
        'bones': 'Bones',
        'witstudio': 'Wit Studio',
        'gainax': 'Gainax',
        'kyotoanimation': 'Kyoto Animation',
        'whitefox': 'White Fox',
        'comixwavefilms': 'CoMix Wave Films',
        'sunrise': 'Sunrise',
        'studioghibli': 'Studio Ghibli',
        'shaft': 'Shaft',
        'tokyomovieshinsha': 'Tokyo Movie Shinsha',
        'tatsunokoproduction': 'Tatsunoko Production',
        'bugfilm': 'BUG FILMS',
        'bugfilms': 'BUG FILMS',
        'sciencesaru': 'Science Saru',
        'toeianimation': 'Toei Animation',
        'pierrot': 'Pierrot',
        'davidproduction': 'David Production',
        'jcstaff': 'J.C.Staff',
        'studiobind': 'Studio Bind',
        'kinemacitrus': 'Kinema Citrus',
        'manglobe': 'Manglobe',
        'artland': 'Artland',
        'trianglestaff': 'Triangle Staff',
        'trigger': 'Trigger',
        'enishiya': 'Enishiya',
        'studiom2': 'Studio M2',
        'asread': 'Asread',
        'paworks': 'P.A. Works',
        'dogakobo': 'Doga Kobo',
        'cloverworks': 'CloverWorks',
        'a1pictures': 'A-1 Pictures',
        'productionig': 'Production I.G',
        'tmsentertainment': 'TMS Entertainment'
    };

    const lookup = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (Object.prototype.hasOwnProperty.call(known, lookup)) return known[lookup];

    return raw
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function kitsuStudio(anime, included = []) {
    const resources = new Map((Array.isArray(included) ? included : []).filter(item => item && typeof item.type === 'string' && typeof item.id === 'string').map((item) => [`${item.type}:${item.id}`, item]));
    const references = anime?.relationships?.animeProductions?.data;
    for (const reference of Array.isArray(references) ? references : []) {
        if (!reference || typeof reference.id !== 'string') continue;
        const production = resources.get(`animeProductions:${reference.id}`);
        if ((typeof production?.attributes?.role === 'string' ? production.attributes.role : '').trim().toLowerCase() !== 'studio') continue;
        const producerId = production.relationships?.producer?.data?.id;
        if (typeof producerId !== 'string') continue;
        const name = resources.get(`producers:${producerId}`)?.attributes?.name;
        if (typeof name === 'string' && !isUnknownStudio(name)) return name.trim();
    }
    return '';
}

module.exports = { isUnknownStudio, verifiedStudio, studioForAnime, standardStudioName, kitsuStudio };
