function normalizeAnimeIdentity(value) {
    return (typeof value === 'string' ? value : '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

module.exports = { normalizeAnimeIdentity };
