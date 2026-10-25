const unknownStudios = new Set(['', 'desconhecido', 'unknown', 'estudio nao informado', 'nao informado', 'n/a', 'tba', '?', '-']);

function isUnknownStudio(value) {
    const name = typeof value === 'string' ? value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    return unknownStudios.has(name);
}

function titleKey(value) {
    return String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// Exact title aliases only: a franchise can change studios between installments.
// Confirmed by https://www.cyberpunk.net/en/edgerunners2 (Creators).
const verifiedStudios = new Map([
    ['Cyberpunk: Edgerunners II', 'Trigger'],
    ['Cyberpunk: Edgerunners 2', 'Trigger'],
    ['サイバーパンク: エッジランナーズ II', 'Trigger'],
    ['サイバーパンク: エッジランナーズ 2', 'Trigger'],
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
    if (!isUnknownStudio(anime.studio)) return anime.studio.trim();
    const imported = Array.isArray(anime.studios) ? anime.studios.find((studio) => !isUnknownStudio(studio?.name)) : null;
    return imported?.name.trim() || verifiedStudio(anime.title, anime.title_english, anime.japaneseTitle, anime.title_japanese) || 'Desconhecido';
}

function kitsuStudio(anime, included = []) {
    const resources = new Map((Array.isArray(included) ? included : []).filter(Boolean).map((item) => [`${item.type}:${item.id}`, item]));
    const references = anime?.relationships?.animeProductions?.data;
    for (const reference of Array.isArray(references) ? references : []) {
        const production = resources.get(`animeProductions:${reference.id}`);
        if (String(production?.attributes?.role || '').trim().toLowerCase() !== 'studio') continue;
        const producerId = production.relationships?.producer?.data?.id;
        const name = resources.get(`producers:${producerId}`)?.attributes?.name;
        if (!isUnknownStudio(name)) return name.trim();
    }
    return '';
}

module.exports = { isUnknownStudio, verifiedStudio, studioForAnime, kitsuStudio };
