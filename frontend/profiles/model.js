const { imageUrl } = require('../shared/dom');
const normalizeId = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const list = value => Array.isArray(value) ? value.filter(Boolean) : [];
const texts = value => list(value).filter(item => typeof item === 'string').slice(0, 100);
const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

function displayUser(profileId, users, fallbackAvatar = '') {
    const id = normalizeId(profileId);
    const matches = list(users).filter(user => typeof user.username === 'string' && normalizeId(user.username) === id);
    // Missing/deleted members and ambiguous historical identities are unavailable.
    const user = id && matches.length === 1 ? matches[0] : null;
    return {
        available: Boolean(user), id, username: user?.username || 'Perfil indisponível',
        name: user?.username || 'Perfil indisponível',
        avatar: typeof user?.avatar === 'string' ? (imageUrl(user.avatar) || user.avatar.slice(0, 16)) : fallbackAvatar,
        banner: imageUrl(user?.banner), color: /^#[0-9a-f]{6}$/i.test(user?.color || '') ? user.color : '#FF4500',
        emailVerified: user?.emailVerified === true,
        favoriteGenres: texts(user?.favoriteGenres), favoriteStudios: texts(user?.favoriteStudios), favoriteAnimes: texts(user?.favoriteAnimes),
        activeTitle: typeof user?.activeTitle === 'string' ? user.activeTitle : '', memberNumber: user?.memberNumber
    };
}

function profileStats(profileId, animes, activities) {
    const userId = normalizeId(profileId);
    const statusCounts = { Watching: 0, Completed: 0, 'On Hold': 0, Dropped: 0, 'Plan to Watch': 0 };
    const genreScores = new Map(), studioScores = new Map(), ratedAnime = [];
    let totalEpisodes = 0, ratingSum = 0, ratingCount = 0, trackedCount = 0, commentsCount = 0, repliesCount = 0;
    const add = (map, name, score) => {
        const data = map.get(name) || { sum: 0, count: 0 };
        data.sum += score; data.count++; map.set(name, data);
    };
    for (const anime of list(animes)) {
        const rating = Object.hasOwn(anime.ratings || {}, userId) ? anime.ratings[userId] : null;
        if (rating && typeof rating === 'object' && !Array.isArray(rating)) {
            trackedCount++;
            statusCounts[Object.hasOwn(statusCounts, rating.status) ? rating.status : 'Plan to Watch']++;
            totalEpisodes += Math.min(100_000, Math.floor(number(rating.episodesWatched)));
            const overall = Number(String(rating.overall ?? '').replace(',', '.'));
            if (Number.isFinite(overall) && overall > 0 && overall <= 10) {
                ratingSum += overall; ratingCount++; ratedAnime.push({ anime, rating, overall });
                for (const genre of texts(anime.genres)) add(genreScores, genre, overall);
                add(studioScores, typeof anime.studio === 'string' && anime.studio || 'Desconhecido', overall);
            }
        }
        for (const comment of list(anime.comments)) {
            if (normalizeId(comment.friendId) === userId) commentsCount++;
            for (const reply of list(comment.replies)) if (normalizeId(reply.friendId) === userId) repliesCount++;
        }
    }
    const top = map => [...map].map(([name, data]) => ({ name, avg: data.sum / data.count, count: data.count }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count).slice(0, 5);
    const xp = Math.round(totalEpisodes * 18 + ratingCount * 75 + commentsCount * 120 + repliesCount * 45 + statusCounts.Completed * 95);
    const level = Math.max(1, Math.floor(Math.sqrt(Math.max(1, xp)) / 3));
    const currentLevelXp = Math.pow(level * 3, 2), nextLevelXp = Math.pow((level + 1) * 3, 2);
    return {
        userId, avgScore: ratingCount ? ratingSum / ratingCount : 0, totalEpisodes, ratingCount, trackedCount, commentsCount, repliesCount,
        statusCounts, completionRate: trackedCount ? Math.round(statusCounts.Completed / trackedCount * 100) : 0,
        topAnime: ratedAnime.sort((a, b) => b.overall - a.overall).slice(0, 5), topGenres: top(genreScores), topStudios: top(studioScores),
        recentActivities: list(activities).filter(item => normalizeId(item.username) === userId && Number.isFinite(Date.parse(item.timestamp)))
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 5),
        xp, level, levelProgress: Math.max(5, Math.min(100, (xp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp) * 100))
    };
}
module.exports = { displayUser, profileStats };
