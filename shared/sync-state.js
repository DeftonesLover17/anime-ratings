// Shared by the browser and both APIs. A sync applies changes since the client's
// last snapshot, rather than replacing newer values with an entire stale cache.
(function (root) {
    const profileFields = ['email', 'color', 'avatar', 'favoriteGenres', 'favoriteStudios', 'favoriteAnimes', 'activeTitle', 'featuredAnimeId'];
    const ratingFields = ['animation', 'story', 'sound', 'overall', 'status', 'episodesWatched', 'updatedAt', 'episodeRatings', 'watchedEpisodesMap'];
    const commentFields = ['friendName', 'comment', 'timestamp', 'kind', 'title', 'episode', 'spoiler'];
    const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);
    const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    const userId = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const equal = (a, b) => {
        if (a === b) return true;
        if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
        const keys = Object.keys(a);
        return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
    };

    function applyChanges(base, local, server) {
        if (equal(base, local)) return copy(server);
        if (!local || typeof local !== 'object' || Array.isArray(local)) return copy(local);
        const result = server && typeof server === 'object' && !Array.isArray(server) ? copy(server) : {};
        for (const key of new Set([...Object.keys(base || {}), ...Object.keys(local)])) {
            if (blockedKeys.has(key) || equal(base?.[key], local[key])) continue;
            if (!Object.hasOwn(local, key)) delete result[key];
            else result[key] = applyChanges(base?.[key], local[key], server?.[key]);
        }
        return result;
    }

    function select(record, fields) {
        return Object.fromEntries(fields.filter(key => record && Object.hasOwn(record, key)).map(key => [key, copy(record[key])]));
    }

    function commentMetadata(record) {
        const metadata = {};
        if (record?.kind === 'review' || record?.kind === 'comment') metadata.kind = record.kind;
        if (Object.hasOwn(record || {}, 'title')) metadata.title = String(record.title || '').trim().slice(0, 160);
        if (Object.hasOwn(record || {}, 'spoiler')) metadata.spoiler = record.spoiler === true;
        if (Object.hasOwn(record || {}, 'episode')) {
            const episode = Number(record.episode);
            metadata.episode = Number.isSafeInteger(episode) && episode > 0 ? episode : null;
        }
        return metadata;
    }

    function clientSnapshot(state, username) {
        const id = userId(username);
        const me = (state.registeredUsers || []).find(user => userId(user.username) === id);
        return {
            registeredUsers: me ? [{ username: me.username, ...select(me, profileFields) }] : [],
            animes: (state.animes || []).map(anime => ({
                id: anime.id,
                ratings: { [id]: anime.ratings?.[id] ? select(anime.ratings[id], ratingFields) : null },
                comments: (anime.comments || []).map(comment => ({
                    id: comment.id, friendId: comment.friendId, friendName: comment.friendName,
                    comment: comment.comment, timestamp: comment.timestamp,
                    ...commentMetadata(comment),
                    // A sync baseline must not share mutable arrays with the live UI.
                    likes: copy(comment.likes || []), replies: copy(comment.replies || [])
                }))
            })),
            activities: (state.activities || []).filter(activity => userId(activity.username) === id),
            featuredAnimeId: state.featuredAnimeId ?? null
        };
    }

    function mergeOwnedRecords(base, local, server, id, fields) {
        const baseMap = new Map((base || []).map(record => [record.id, record]));
        const localMap = new Map((local || []).map(record => [record.id, record]));
        const result = (server || []).filter(record => !(
            userId(record.friendId) === id && baseMap.has(record.id) && !localMap.has(record.id)
        )).map(copy);
        for (const record of local || []) {
            if (!record?.id || userId(record.friendId) !== id) continue;
            const previous = baseMap.get(record.id);
            const index = result.findIndex(item => item.id === record.id);
            // A record deleted on another device must not reappear from a cache.
            if (previous && index < 0) continue;
            if (previous && equal(select(previous, fields), select(record, fields))) continue;
            const current = index < 0 ? {} : result[index];
            const next = { ...current, ...applyChanges(select(previous, fields), select(record, fields), select(current, fields)), id: record.id, friendId: id };
            if (index < 0) result.push(next);
            else result[index] = next;
        }
        return result;
    }

    function mergeComments(base, local, server, id) {
        const result = mergeOwnedRecords(base, local, server, id, commentFields);
        for (const comment of result) {
            const previous = (base || []).find(item => item.id === comment.id);
            const changed = (local || []).find(item => item.id === comment.id);
            if (!changed) continue;
            comment.replies = mergeOwnedRecords(previous?.replies, changed.replies, comment.replies, id, ['friendName', 'reply', 'timestamp']);
            const likedBefore = (previous?.likes || []).some(name => userId(name) === id);
            const likedNow = (changed.likes || []).some(name => userId(name) === id);
            if (likedBefore !== likedNow) {
                comment.likes = (comment.likes || []).filter(name => userId(name) !== id);
                if (likedNow) comment.likes.push(id);
            }
        }
        return result;
    }

    function mergeClientState(localState, baseState, serverState, username, canEditCatalog = false) {
        const id = userId(username);
        const base = clientSnapshot(baseState, username);
        const local = clientSnapshot(localState, username);
        const next = copy(serverState);
        const baseUser = base.registeredUsers[0];
        const localUser = local.registeredUsers[0];
        const me = (next.registeredUsers || []).find(user => userId(user.username) === id);
        if (me && localUser) {
            const merged = applyChanges(select(baseUser, profileFields), select(localUser, profileFields), select(me, profileFields));
            for (const field of profileFields) if (!Object.hasOwn(merged, field)) delete me[field];
            Object.assign(me, merged);
        }

        for (const localAnime of local.animes) {
            const anime = (next.animes || []).find(item => item.id === localAnime.id);
            if (!anime) continue;
            const baseAnime = base.animes.find(item => item.id === localAnime.id);
            const baseRating = baseAnime?.ratings?.[id] || null;
            const localRating = localAnime.ratings[id];
            if (!equal(baseRating, localRating)) {
                anime.ratings ||= {};
                if (!localRating) delete anime.ratings[id];
                else {
                    const combined = applyChanges(baseRating || {}, localRating, anime.ratings[id] || {});
                    const scores = Object.values(combined.episodeRatings || {}).map(Number).filter(score => Number.isFinite(score) && score > 0);
                    if (scores.length) combined.overall = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1));
                    if (Object.keys(combined.watchedEpisodesMap || {}).length || Object.keys(baseRating?.watchedEpisodesMap || {}).length) {
                        combined.episodesWatched = Object.values(combined.watchedEpisodesMap || {}).filter(Boolean).length;
                    }
                    anime.ratings[id] = combined;
                }
            }
            anime.comments = mergeComments(baseAnime?.comments, localAnime.comments, anime.comments, id);
        }
        if (canEditCatalog && !equal(base.featuredAnimeId, local.featuredAnimeId)) next.featuredAnimeId = local.featuredAnimeId;
        const knownActivities = new Set((base.activities || []).map(activity => activity.id));
        const committedActivities = new Set((next.activities || []).map(activity => activity.id));
        next.activities ||= [];
        for (const activity of local.activities.slice(0, 100)) {
            if (!activity.id || knownActivities.has(activity.id) || committedActivities.has(activity.id)) continue;
            next.activities.push({ ...activity, username: me?.username || username, userColor: me?.color || '#FF4500', userAvatar: me?.avatar || '👤' });
            committedActivities.add(activity.id);
        }
        next.activities = next.activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 80);
        return next;
    }

    const api = Object.freeze({ applyChanges, clientSnapshot, mergeClientState, equal, commentMetadata });
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.AnivoidSync = api;
})(typeof globalThis === 'object' ? globalThis : this);
