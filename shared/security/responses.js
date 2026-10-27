const { userResponse } = require('./policy');

// Storage records may contain private or future metadata. Browser DTOs must
// explicitly select their fields instead of spreading a storage snapshot.
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const list = value => Array.isArray(value) ? value : [];
const scalar = value => value === null || ['string', 'number', 'boolean'].includes(typeof value);
function select(value, fields) {
    const source = record(value);
    return Object.fromEntries(fields.filter(key => Object.hasOwn(source, key) && scalar(source[key])).map(key => [key, source[key]]));
}
const texts = value => list(value).filter(item => typeof item === 'string');
function numericMap(value) {
    const entries = [];
    for (const [key, item] of Object.entries(record(value))) {
        if (!/^\d{1,6}$/.test(key)) continue;
        const numeric = typeof item === 'string' && item.trim() ? Number(item.replace(',', '.')) : item;
        if (typeof numeric === 'boolean' || typeof numeric === 'number' && Number.isFinite(numeric)) entries.push([key, numeric]);
    }
    return Object.fromEntries(entries);
}

function friendResponse(value) {
    const result = select(value, ['id', 'name', 'username', 'avatar', 'banner', 'color', 'emailVerified', 'activeTitle', 'memberNumber', 'memberDesc', 'isVirtual', 'isMe']);
    for (const key of ['favoriteGenres', 'favoriteStudios', 'favoriteAnimes']) if (Array.isArray(value?.[key])) result[key] = texts(value[key]);
    return result;
}
function ratingResponse(value) {
    return { ...select(value, ['animation', 'story', 'sound', 'overall', 'status', 'episodesWatched', 'updatedAt']),
        episodeRatings: numericMap(value?.episodeRatings), watchedEpisodesMap: numericMap(value?.watchedEpisodesMap) };
}
function commentResponse(value) {
    return { ...select(value, ['id', 'friendId', 'friendName', 'comment', 'timestamp', 'kind', 'title', 'episode', 'spoiler', 'editedAt', 'updatedAt']),
        likes: texts(value?.likes), replies: list(value?.replies).map(reply => select(reply, ['id', 'friendId', 'friendName', 'reply', 'timestamp', 'editedAt', 'updatedAt'])) };
}
function animeResponse(value) {
    return { ...select(value, ['id', 'title', 'japaneseTitle', 'synopsis', 'coverUrl', 'logoUrl', 'studioLogoUrl', 'studio', 'status', 'season', 'episodes', 'mal_id', 'malId', 'kitsuId', 'type', 'year', 'createdAt', 'updatedAt']),
        genres: texts(value?.genres), ratings: Object.fromEntries(Object.entries(record(value?.ratings)).map(([id, rating]) => [id, rating === null ? null : ratingResponse(rating)])),
        comments: list(value?.comments).map(commentResponse) };
}
function browserUserResponse(value, viewer = '', cached = false) {
    if (typeof value?.username !== 'string') return null;
    const user = userResponse(value, viewer);
    if (!user) return null;
    // Cached badges are presentation only. Server responses always recompute
    // verification from the stored proof via userResponse above.
    if (cached) user.emailVerified = value.emailVerified === true;
    const result = select(user, ['username', 'avatar', 'banner', 'color', 'activeTitle', 'featuredAnimeId', 'memberNumber', 'memberDesc', 'isVirtual', 'emailVerified', 'accountId', 'email']);
    for (const key of ['friends', 'favoriteGenres', 'favoriteStudios', 'favoriteAnimes']) if (Array.isArray(user[key])) result[key] = texts(user[key]);
    if (Array.isArray(user.friendRequests)) result.friendRequests = user.friendRequests.map(item => select(item, ['from', 'timestamp']));
    if (Array.isArray(user.notifications)) result.notifications = user.notifications.map(item => select(item, ['id', 'type', 'title', 'message', 'animeId', 'avatar', 'color', 'read', 'timestamp']));
    return result;
}
const activityResponse = item => select(item, ['id', 'username', 'userColor', 'userAvatar', 'type', 'animeId', 'animeTitle', 'details', 'timestamp']);
function stateResponse(value, viewer = '') {
    const state = record(value);
    return {
        ...select(state, ['revision', 'featuredAnimeId']), viewerUsername: viewer,
        friends: list(state.friends).map(friendResponse), animes: list(state.animes).map(animeResponse),
        studioLogos: Object.fromEntries(Object.entries(record(state.studioLogos)).filter(([, url]) => typeof url === 'string')),
        registeredUsers: list(state.registeredUsers).map(user => browserUserResponse(user, viewer)).filter(Boolean),
        activities: list(state.activities).map(activityResponse)
    };
}
module.exports = { stateResponse, browserUserResponse, cachedUserResponse: (value, viewer) => browserUserResponse(value, viewer, true), animeResponse, friendResponse, activityResponse };
