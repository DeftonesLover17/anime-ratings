function parseScore(value) {
    const text = String(value ?? '')
        .trim()
        .replace(',', '.');
    if (!text) return null;
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return undefined;
    const number = Number(text);
    return Number.isFinite(number) && number >= 0.1 && number <= 10
        ? Math.round(number * 10) / 10
        : undefined;
}

function episodeWatched(rating, episode) {
    if (
        rating.watchedEpisodesMap &&
        typeof rating.watchedEpisodesMap === 'object' &&
        Object.keys(rating.watchedEpisodesMap).length > 0
    )
        return !!rating.watchedEpisodesMap[episode];
    return episode <= (Number(rating.episodesWatched) || 0);
}

function initialEpisode(rating, total) {
    for (let episode = 1; episode <= total; episode++)
        if (!episodeWatched(rating, episode)) return episode;
    return 1;
}

function episodeWindow(selected, total, size = 40) {
    const start = Math.floor((Math.max(1, selected) - 1) / size) * size + 1;
    const end = Math.min(total, start + size - 1);
    return {
        start,
        end,
        episodes: Array.from(
            { length: Math.max(0, end - start + 1) },
            (_, index) => start + index,
        ),
    };
}

module.exports = { parseScore, episodeWatched, initialEpisode, episodeWindow };
