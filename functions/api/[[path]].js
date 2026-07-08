const PASSWORD_ITERATIONS = 100000;
const PASSWORD_KEY_LENGTH_BITS = 256;
const MIN_PASSWORD_LENGTH = 10;
const LEGACY_PASSWORD_RESET_ITERATION_THRESHOLD = 150000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_EXTERNAL_IMAGE_URL_LENGTH = 4096;
const MAX_DATA_IMAGE_LENGTH = 2 * 1024 * 1024;
const BACKUP_RETENTION = 20;
const AUTO_BACKUP_INTERVAL_MS = 1000 * 60 * 30;
const DEFAULT_ALLOWED_ORIGIN = 'https://anime-ratings.pages.dev';

const DEFAULT_STATE = {
    friends: [],
    animes: [],
    registeredUsers: [],
    studioLogos: {},
    featuredAnimeId: null,
    activities: []
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': DEFAULT_ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin'
    };
}

function json(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            ...corsHeaders(),
            ...extraHeaders
        }
    });
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeUsername(username) {
    return String(username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function usernameKey(username) {
    return String(username || '').trim().toLowerCase();
}

function sameUsername(a, b) {
    return usernameKey(a) === usernameKey(b);
}

function identifierKey(identifier) {
    return String(identifier || '').trim().toLowerCase();
}

function findRegisteredUserByIdentifier(state, identifier) {
    const rawKey = identifierKey(identifier);
    const normalizedKey = normalizeUsername(identifier);
    if (!rawKey && !normalizedKey) return null;

    return (state.registeredUsers || []).find(user => {
        if (!user) return false;
        const email = identifierKey(user.email);
        const username = identifierKey(user.username);
        const normalizedUsername = normalizeUsername(user.username);
        return (email && email === rawKey)
            || (username && username === rawKey)
            || (normalizedUsername && normalizedUsername === normalizedKey);
    }) || null;
}

function normalizeAnimeIdentity(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function hasMeaningfulRating(rating) {
    if (!rating || typeof rating !== 'object') return false;
    const overall = parseFloat(rating.overall);
    const hasOverall = Number.isFinite(overall) && overall > 0;
    const hasEpisodes = rating.episodeRatings &&
        typeof rating.episodeRatings === 'object' &&
        Object.values(rating.episodeRatings).some(score => {
            const value = parseFloat(score);
            return Number.isFinite(value) && value > 0;
        });
    const hasStatus = rating.status && rating.status !== 'Plan to Watch';
    return hasOverall || hasEpisodes || hasStatus;
}

function ratingStrength(rating) {
    if (!rating || typeof rating !== 'object') return 0;
    const episodeCount = rating.episodeRatings && typeof rating.episodeRatings === 'object'
        ? Object.values(rating.episodeRatings).filter(score => {
            const value = parseFloat(score);
            return Number.isFinite(value) && value > 0;
        }).length
        : 0;
    const overall = parseFloat(rating.overall);
    return episodeCount * 3 + (Number.isFinite(overall) && overall > 0 ? 2 : 0) + (rating.status && rating.status !== 'Plan to Watch' ? 1 : 0);
}

function getRatingForProfile(ratings, userId) {
    if (!ratings || typeof ratings !== 'object') return null;
    const normalizedUserId = normalizeUsername(userId);
    if (!normalizedUserId) return null;
    if (ratings[normalizedUserId]) return ratings[normalizedUserId];
    const aliasEntry = Object.entries(ratings).find(([key]) => normalizeUsername(key) === normalizedUserId);
    return aliasEntry ? aliasEntry[1] : null;
}

function animeRecoveryKeys(anime) {
    if (!anime || typeof anime !== 'object') return [];
    const keys = new Set();
    if (anime.id) keys.add(`id:${anime.id}`);

    const title = normalizeAnimeIdentity(anime.title);
    const japaneseTitle = normalizeAnimeIdentity(anime.japaneseTitle);
    if (title) keys.add(`title:${title}`);
    if (japaneseTitle) keys.add(`title:${japaneseTitle}`);

    const joined = `${title} ${japaneseTitle}`.trim();
    if (joined.includes('jujutsu kaisen')) {
        if (anime.id === 'a20_s2' || /\b(2|2nd|segunda|temporada 2)\b/.test(joined)) {
            keys.add('series:jujutsu-kaisen-season-2');
        } else if (anime.id === 'a20' || !joined.includes('shimetsu kaiyuu') && !joined.includes('culling game')) {
            keys.add('series:jujutsu-kaisen-season-1');
        }
    }

    return Array.from(keys);
}

function findLocalRatingForAnime(localAnimes, serverAnime, loggedInId) {
    const targetKeys = new Set(animeRecoveryKeys(serverAnime));
    let bestRating = null;

    (localAnimes || []).forEach(localAnime => {
        if (!localAnime || !localAnime.ratings) return;
        if (!animeRecoveryKeys(localAnime).some(key => targetKeys.has(key))) return;
        const localRating = getRatingForProfile(localAnime.ratings, loggedInId) || localAnime.ratings['1'];
        if (!hasMeaningfulRating(localRating)) return;
        if (!bestRating || ratingStrength(localRating) > ratingStrength(bestRating)) {
            bestRating = localRating;
        }
    });

    return bestRating;
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

function escapeHtml(value, maxLength = 5000) {
    const text = decodeHtmlEntities(value)
        .replace(/\u0000/g, '')
        .slice(0, maxLength);
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeColor(color) {
    const value = String(color || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#FF4500';
}

function isSafeDataImage(value) {
    if (!/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) return false;
    if (value.length > MAX_DATA_IMAGE_LENGTH) return false;
    const base64 = value.replace(/^data:image\/(png|jpe?g|gif|webp);base64,/i, '');
    return /^[a-z0-9+/=\s]+$/i.test(base64) && base64.replace(/\s+/g, '').length % 4 !== 1;
}

function sanitizeImageUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';

    if (isSafeDataImage(value)) return value.replace(/\s+/g, '');
    if (value.length > MAX_EXTERNAL_IMAGE_URL_LENGTH) return '';
    if (/^(covers|logos)\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
    if (/^https:\/\//i.test(value)) {
        try {
            const parsed = new URL(value);
            if (parsed.protocol !== 'https:') return '';
            return parsed.toString();
        } catch (err) {
            return '';
        }
    }
    return '';
}

function sanitizeAvatar(avatar) {
    const value = String(avatar || '').trim();
    const safeImage = sanitizeImageUrl(value);
    if (safeImage) return safeImage;
    if (!value || /^data:/i.test(value) || /^https?:\/\//i.test(value) || value.length > 16) return '👤';
    return escapeHtml(value, 16);
}

function sanitizeTextArray(values, maxItems = 20, maxLength = 80) {
    return Array.isArray(values)
        ? values.slice(0, maxItems).map(value => escapeHtml(value, maxLength)).filter(Boolean)
        : [];
}

function sanitizeUserRecord(user) {
    if (!user || typeof user !== 'object') return user;
    return {
        ...user,
        username: escapeHtml(user.username || '', 40),
        email: escapeHtml(String(user.email || '').trim(), 254),
        color: sanitizeColor(user.color),
        avatar: sanitizeAvatar(user.avatar),
        favoriteGenres: sanitizeTextArray(user.favoriteGenres),
        favoriteStudios: sanitizeTextArray(user.favoriteStudios),
        favoriteAnimes: sanitizeTextArray(user.favoriteAnimes, 50, 120),
        activeTitle: escapeHtml(user.activeTitle || '', 80),
        memberDesc: user.memberDesc ? escapeHtml(user.memberDesc, 300) : user.memberDesc,
        friends: Array.isArray(user.friends) ? user.friends.slice(0, 500).map(name => escapeHtml(name, 40)).filter(Boolean) : [],
        friendRequests: Array.isArray(user.friendRequests)
            ? user.friendRequests.slice(0, 500).map(req => ({
                ...req,
                from: escapeHtml(req && req.from || '', 40),
                timestamp: escapeHtml(req && req.timestamp || '', 40)
            }))
            : [],
        notifications: sanitizeNotifications(user.notifications)
    };
}

function sanitizeNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.slice(0, 100).map(notification => ({
        id: escapeHtml(notification && notification.id || '', 120),
        type: escapeHtml(notification && notification.type || 'system', 60),
        title: escapeHtml(notification && notification.title || '', 120),
        message: escapeHtml(notification && notification.message || '', 300),
        animeId: escapeHtml(notification && notification.animeId || '', 120),
        color: sanitizeColor(notification && notification.color),
        read: Boolean(notification && notification.read),
        timestamp: escapeHtml(notification && notification.timestamp || '', 40)
    })).filter(notification => notification.title);
}

function sanitizeComment(comment) {
    if (!comment || typeof comment !== 'object') return comment;
    return {
        ...comment,
        id: escapeHtml(comment.id || '', 100),
        friendId: escapeHtml(comment.friendId || '', 80),
        friendName: escapeHtml(comment.friendName || '', 80),
        comment: escapeHtml(comment.comment || '', 5000),
        timestamp: escapeHtml(comment.timestamp || '', 40),
        likes: Array.isArray(comment.likes)
            ? comment.likes.slice(0, 200).map(like => normalizeUsername(like) || escapeHtml(like, 80)).filter(Boolean)
            : [],
        replies: Array.isArray(comment.replies)
            ? comment.replies.slice(0, 500).map(reply => ({
                ...reply,
                id: escapeHtml(reply && reply.id || '', 100),
                friendId: escapeHtml(reply && reply.friendId || '', 80),
                friendName: escapeHtml(reply && reply.friendName || '', 80),
                reply: escapeHtml(reply && reply.reply || '', 3000),
                timestamp: escapeHtml(reply && reply.timestamp || '', 40)
            }))
            : []
    };
}

function textCorruptionScore(value) {
    const text = String(value || '');
    const replacementChars = (text.match(/\uFFFD/g) || []).length;
    const mojibakeSequences = (text.match(/(?:\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00F0\u0178)/g) || []).length;
    return (replacementChars * 10) + mojibakeSequences;
}

function preferCleanerText(serverText, localText) {
    const serverValue = String(serverText || '');
    const localValue = String(localText || '');
    return textCorruptionScore(localValue) > textCorruptionScore(serverValue)
        ? serverValue
        : localValue;
}

function mergeReplyPreservingCleanText(serverReply, localReply) {
    if (!serverReply) return localReply;
    if (!localReply) return serverReply;
    return {
        ...serverReply,
        ...localReply,
        reply: preferCleanerText(serverReply.reply, localReply.reply)
    };
}

function sanitizeRatings(ratings) {
    if (!ratings || typeof ratings !== 'object') return {};
    const safeRatings = {};
    Object.entries(ratings).slice(0, 1000).forEach(([friendId, rating]) => {
        if (!rating || typeof rating !== 'object') return;
        const safeEpisodeRatings = {};
        if (rating.episodeRatings && typeof rating.episodeRatings === 'object') {
            Object.entries(rating.episodeRatings).slice(0, 1000).forEach(([episode, score]) => {
                const safeEpisode = escapeHtml(episode, 20);
                const numericScore = Number(score);
                safeEpisodeRatings[safeEpisode] = Number.isFinite(numericScore) ? numericScore : 0;
            });
        }
        const safeWatchedEpisodesMap = {};
        if (rating.watchedEpisodesMap && typeof rating.watchedEpisodesMap === 'object') {
            Object.entries(rating.watchedEpisodesMap).slice(0, 1000).forEach(([episode, watched]) => {
                const safeEpisode = escapeHtml(episode, 20);
                safeWatchedEpisodesMap[safeEpisode] = !!watched;
            });
        }
        const safeFriendId = normalizeUsername(friendId) || escapeHtml(friendId, 80);
        const nextRating = {
            ...rating,
            animation: Number.isFinite(Number(rating.animation)) ? Number(rating.animation) : 0,
            story: Number.isFinite(Number(rating.story)) ? Number(rating.story) : 0,
            sound: Number.isFinite(Number(rating.sound)) ? Number(rating.sound) : 0,
            overall: rating.overall === '-' ? '-' : (Number.isFinite(Number(rating.overall)) ? Number(rating.overall) : 0),
            status: escapeHtml(rating.status || 'Plan to Watch', 80),
            episodesWatched: Number.isFinite(Number(rating.episodesWatched)) ? Number(rating.episodesWatched) : 0,
            updatedAt: escapeHtml(rating.updatedAt || '', 40),
            episodeRatings: safeEpisodeRatings,
            watchedEpisodesMap: safeWatchedEpisodesMap
        };
        safeRatings[safeFriendId] = ratingStrength(safeRatings[safeFriendId]) >= ratingStrength(nextRating)
            ? { ...nextRating, ...safeRatings[safeFriendId] }
            : { ...safeRatings[safeFriendId], ...nextRating };
    });
    return safeRatings;
}

function getStandardStudioName(name) {
    const raw = String(name || '').trim();
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
        'cloverworks': 'CloverWorks',
        'a1pictures': 'A-1 Pictures',
        'productionig': 'Production I.G',
        'tmsentertainment': 'TMS Entertainment'
    };
    
    const lookup = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (known[lookup]) return known[lookup];
    
    return raw
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function sanitizeAnimeRecord(anime) {
    if (!anime || typeof anime !== 'object') return anime;
    return {
        ...anime,
        id: escapeHtml(anime.id || '', 120),
        title: escapeHtml(anime.title || '', 180),
        japaneseTitle: escapeHtml(anime.japaneseTitle || '', 180),
        synopsis: escapeHtml(anime.synopsis || '', 5000),
        coverUrl: sanitizeImageUrl(anime.coverUrl) || '',
        studioLogoUrl: sanitizeImageUrl(anime.studioLogoUrl) || '',
        genres: sanitizeTextArray(anime.genres, 20, 80),
        studio: escapeHtml(getStandardStudioName(anime.studio || ''), 120),
        status: escapeHtml(anime.status || '', 80),
        season: escapeHtml(anime.season || '', 80),
        episodes: escapeHtml(anime.episodes || '', 40),
        ratings: sanitizeRatings(anime.ratings),
        comments: Array.isArray(anime.comments) ? anime.comments.map(sanitizeComment).filter(Boolean) : []
    };
}

function sanitizeStudioLogos(studioLogos) {
    if (!studioLogos || typeof studioLogos !== 'object' || Array.isArray(studioLogos)) return {};
    const safeLogos = {};
    Object.entries(studioLogos).slice(0, 500).forEach(([studioName, logoUrl]) => {
        const safeName = escapeHtml(studioName, 120);
        const safeLogo = sanitizeImageUrl(logoUrl);
        if (safeName && safeLogo) safeLogos[safeName] = safeLogo;
    });
    return safeLogos;
}

function sanitizeStateForStorage(state) {
    const safeState = state && typeof state === 'object' ? state : DEFAULT_STATE;
    return {
        ...safeState,
        friends: Array.isArray(safeState.friends) ? safeState.friends.slice(0, 500).map(friend => ({
            ...friend,
            name: escapeHtml(friend && friend.name || '', 80),
            avatar: sanitizeAvatar(friend && friend.avatar),
            color: sanitizeColor(friend && friend.color)
        })) : [],
        animes: Array.isArray(safeState.animes) ? safeState.animes.map(sanitizeAnimeRecord).filter(Boolean) : [],
        studioLogos: sanitizeStudioLogos(safeState.studioLogos),
        registeredUsers: Array.isArray(safeState.registeredUsers) ? safeState.registeredUsers.map(sanitizeUserRecord).filter(Boolean) : [],
        activities: Array.isArray(safeState.activities) ? safeState.activities.slice(0, 100).map(activity => ({
            ...activity,
            id: escapeHtml(activity && activity.id || '', 120),
            username: escapeHtml(activity && activity.username || '', 80),
            userColor: sanitizeColor(activity && activity.userColor),
            userAvatar: (activity && activity.userAvatar && activity.userAvatar.startsWith('data:')) ? '👤' : sanitizeAvatar(activity && activity.userAvatar),
            type: escapeHtml(activity && activity.type || '', 60),
            animeId: escapeHtml(activity && activity.animeId || '', 120),
            animeTitle: escapeHtml(activity && activity.animeTitle || '', 180),
            details: escapeHtml(activity && activity.details || '', 300),
            timestamp: escapeHtml(activity && activity.timestamp || '', 40)
        })) : [],
        featuredAnimeId: safeState.featuredAnimeId ? escapeHtml(safeState.featuredAnimeId, 120) : null
    };
}

function sanitizeUser(user, viewerUsername = '') {
    if (!user || typeof user !== 'object') return user;
    const {
        password,
        passwordHash,
        passwordSalt,
        passwordIterations,
        passwordDigest,
        passwordResetRequired,
        ...safeUser
    } = user;
    if (viewerUsername && user.username && sameUsername(user.username, viewerUsername)) return safeUser;
    delete safeUser.email;
    delete safeUser.notifications;
    return safeUser;
}

function sanitizeAdminUserSummary(user) {
    if (!user || typeof user !== 'object') return null;
    const rawAvatar = String(user.avatar || '');
    return {
        username: escapeHtml(user.username || '', 40),
        email: escapeHtml(String(user.email || '').trim(), 254),
        color: sanitizeColor(user.color),
        avatar: rawAvatar.startsWith('data:') ? '\uD83D\uDC64' : sanitizeAvatar(rawAvatar),
        friends: Array.isArray(user.friends)
            ? user.friends.slice(0, 500).map(name => escapeHtml(name, 40)).filter(Boolean)
            : [],
        isVirtual: Boolean(user.isVirtual)
    };
}

function sanitizeState(state, viewerUsername = '') {
    const storageSafeState = sanitizeStateForStorage(state);
    return {
        ...storageSafeState,
        viewerUsername: viewerUsername || '',
        registeredUsers: Array.isArray(storageSafeState.registeredUsers)
            ? storageSafeState.registeredUsers.map(user => sanitizeUser(user, viewerUsername))
            : []
    };
}

function sanitizeRegisteredUsersOnly(state, viewerUsername = '') {
    const users = Array.isArray(state && state.registeredUsers) ? state.registeredUsers : [];
    return users
        .map(sanitizeUserRecord)
        .filter(Boolean)
        .map(user => sanitizeUser(user, viewerUsername));
}

function base64ToBytes(base64) {
    const binary = atob(String(base64 || ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
    }
    return btoa(binary);
}

function randomBase64(byteLength) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
}

function randomToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createTemporaryPassword() {
    return `Ani${randomToken().replace(/[^a-zA-Z0-9]/g, '').slice(0, 22)}7`;
}

async function hashPassword(password, salt = randomBase64(16), iterations = PASSWORD_ITERATIONS) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(String(password || '')),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: base64ToBytes(salt), iterations, hash: 'SHA-256' },
        key,
        PASSWORD_KEY_LENGTH_BITS
    );
    return {
        passwordHash: bytesToBase64(new Uint8Array(bits)),
        passwordSalt: salt,
        passwordIterations: iterations,
        passwordDigest: 'pbkdf2-sha256'
    };
}

function timingSafeEqual(a, b) {
    const aText = String(a || '');
    const bText = String(b || '');
    if (aText.length !== bText.length) return false;
    let mismatch = 0;
    for (let i = 0; i < aText.length; i++) mismatch |= aText.charCodeAt(i) ^ bText.charCodeAt(i);
    return mismatch === 0;
}

async function verifyPassword(user, password) {
    if (!user || !password) return false;
    if (user.passwordHash && user.passwordSalt) {
        const iterations = user.passwordIterations || PASSWORD_ITERATIONS;
        const candidate = await hashPassword(password, user.passwordSalt, iterations);
        return timingSafeEqual(candidate.passwordHash, user.passwordHash);
    }
    return typeof user.password === 'string' && user.password === password;
}

function passwordRequiresReset(user) {
    if (!user) return false;
    return Boolean(user.passwordResetRequired || hasUnsupportedLegacyPassword(user));
}

function hasUnsupportedLegacyPassword(user) {
    if (!user) return false;
    const iterations = Number(user.passwordIterations) || 0;
    return iterations > LEGACY_PASSWORD_RESET_ITERATION_THRESHOLD;
}

function passwordPolicyError(password) {
    const value = String(password || '');
    if (value.length < MIN_PASSWORD_LENGTH || !/\d/.test(value) || !/[a-zA-Z]/.test(value)) {
        return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres, contendo letras e numeros.`;
    }
    return '';
}

async function setPassword(user, password) {
    Object.assign(user, await hashPassword(password));
    user.passwordResetRequired = false;
    delete user.password;
}

function findRegisteredUser(state, username) {
    return (state.registeredUsers || []).find(user => user && user.username && sameUsername(user.username, username));
}

function hasFriend(user, friendName) {
    return Array.isArray(user && user.friends) && user.friends.some(name => sameUsername(name, friendName));
}

function addFriend(user, friendUser) {
    if (!user || !friendUser || !friendUser.username || sameUsername(user.username, friendUser.username)) return;
    if (!Array.isArray(user.friends)) user.friends = [];
    if (!hasFriend(user, friendUser.username)) user.friends.push(friendUser.username);
}

function removeFriendRequestsBetween(user, otherUser) {
    if (!user || !otherUser) return;
    if (Array.isArray(user.friendRequests)) {
        user.friendRequests = user.friendRequests.filter(req => req && !sameUsername(req.from, otherUser.username));
    }
    if (Array.isArray(otherUser.friendRequests)) {
        otherUser.friendRequests = otherUser.friendRequests.filter(req => req && !sameUsername(req.from, user.username));
    }
}

function ensureMutualFriendship(user, otherUser) {
    addFriend(user, otherUser);
    addFriend(otherUser, user);
    removeFriendRequestsBetween(user, otherUser);
}

function removeFriendship(user, otherUser) {
    if (!user || !otherUser) return;
    if (Array.isArray(user.friends)) {
        user.friends = user.friends.filter(friend => !sameUsername(friend, otherUser.username));
    }
    if (Array.isArray(otherUser.friends)) {
        otherUser.friends = otherUser.friends.filter(friend => !sameUsername(friend, user.username));
    }
}

function normalizeSocialGraph(state) {
    const users = Array.isArray(state && state.registeredUsers) ? state.registeredUsers : [];
    users.forEach(user => {
        if (!user || !user.username) return;
        const seenFriends = new Set();
        user.friends = Array.isArray(user.friends)
            ? user.friends
                .map(friendName => findRegisteredUser(state, friendName))
                .filter(friendUser => friendUser && !sameUsername(friendUser.username, user.username))
                .filter(friendUser => {
                    const key = usernameKey(friendUser.username);
                    if (seenFriends.has(key)) return false;
                    seenFriends.add(key);
                    return true;
                })
                .map(friendUser => friendUser.username)
            : [];
    });

    users.forEach(user => {
        if (!user || !user.username) return;
        const seenRequests = new Set();
        user.friendRequests = Array.isArray(user.friendRequests)
            ? user.friendRequests
                .filter(req => req && req.from)
                .map(req => {
                    const fromUser = findRegisteredUser(state, req.from);
                    return fromUser ? { ...req, from: fromUser.username } : null;
                })
                .filter(req => req && !sameUsername(req.from, user.username))
                .filter(req => {
                    const fromUser = findRegisteredUser(state, req.from);
                    return fromUser && !(hasFriend(user, fromUser.username) && hasFriend(fromUser, user.username));
                })
                .filter(req => {
                    const key = usernameKey(req.from);
                    if (seenRequests.has(key)) return false;
                    seenRequests.add(key);
                    return true;
                })
            : [];
    });

    return state;
}

function pushUserNotification(user, notification) {
    if (!user || !notification || !notification.title) return;
    if (!Array.isArray(user.notifications)) user.notifications = [];
    const timestamp = notification.timestamp || new Date().toISOString();
    const dedupeKey = [
        notification.type || 'system',
        notification.title,
        notification.message || '',
        notification.animeId || '',
        timestamp.slice(0, 16)
    ].join('|');
    const alreadyExists = user.notifications.some(item => item && item.dedupeKey === dedupeKey);
    if (alreadyExists) return;
    user.notifications.unshift({
        id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: notification.type || 'system',
        title: notification.title,
        message: notification.message || '',
        animeId: notification.animeId || '',
        color: notification.color || user.color || '#FF4500',
        read: false,
        timestamp,
        dedupeKey
    });
    user.notifications = user.notifications.slice(0, 100);
}

function notifyFriendsOfActivity(state, authorUser, activity) {
    if (!state || !authorUser || !activity || !Array.isArray(authorUser.friends)) return;
    authorUser.friends.forEach(friendName => {
        const friendUser = findRegisteredUser(state, friendName);
        if (!friendUser || sameUsername(friendUser.username, authorUser.username)) return;
        pushUserNotification(friendUser, {
            type: activity.type || 'activity',
            title: authorUser.username,
            message: `${activity.details || 'interagiu'} em ${activity.animeTitle || 'um anime'}`,
            animeId: activity.animeId || '',
            color: authorUser.color || '#FF4500',
            avatar: authorUser.avatar || 'bell',
            timestamp: activity.timestamp
        });
    });
}

function isAdminUser(user, env) {
    const admins = String(env.ADMIN_USERS || 'felipe')
        .split(',')
        .map(name => normalizeUsername(name))
        .filter(Boolean);
    return admins.includes(normalizeUsername(user && user.username));
}

function buildCatalogAnime(input, existingAnime = null) {
    const source = input && typeof input === 'object' ? input : {};
    const existing = existingAnime && typeof existingAnime === 'object' ? existingAnime : {};
    return sanitizeAnimeRecord({
        ...existing,
        id: existing.id || `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: source.title,
        japaneseTitle: source.japaneseTitle || 'N/A',
        synopsis: source.synopsis || 'Sem sinopse disponivel.',
        coverUrl: source.coverUrl || '',
        studioLogoUrl: source.studioLogoUrl || '',
        genres: Array.isArray(source.genres) ? source.genres : [],
        studio: source.studio || 'Desconhecido',
        season: source.season || 'Outras',
        episodes: source.episodes || 'Desconhecido',
        ratings: existing.ratings || {},
        comments: existing.comments || []
    });
}

function getDb(env) {
    if (!env.ANIVOID_DB) throw new Error('missing_d1_binding');
    return env.ANIVOID_DB;
}

async function ensureStorage(env) {
    const db = getDb(env);
    await db.prepare('CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at INTEGER NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS state_backups (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reason TEXT NOT NULL, state TEXT NOT NULL)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_state_backups_created_at ON state_backups (created_at)').run();
    await db.prepare(
        "INSERT INTO app_state (id, state, updated_at) VALUES ('main', ?1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING"
    ).bind(JSON.stringify(sanitizeStateForStorage(clone(DEFAULT_STATE)))).run();
}

async function pruneBackups(env) {
    await getDb(env).prepare(
        'DELETE FROM state_backups WHERE id NOT IN (SELECT id FROM state_backups ORDER BY id DESC LIMIT ?1)'
    ).bind(BACKUP_RETENTION).run();
}

async function createStateBackup(env, stateText, reason = 'manual') {
    if (!stateText) return null;
    const safeReason = escapeHtml(reason || 'manual', 80);
    await getDb(env).prepare(
        'INSERT INTO state_backups (reason, state) VALUES (?1, ?2)'
    ).bind(safeReason, stateText).run();
    await pruneBackups(env);
    return true;
}

async function maybeCreateAutomaticBackup(env, reason = 'auto') {
    try {
        const db = getDb(env);
        const last = await db.prepare("SELECT created_at FROM state_backups WHERE reason = 'auto' ORDER BY id DESC LIMIT 1").first();
        if (last && last.created_at) {
            const age = Date.now() - new Date(last.created_at).getTime();
            if (Number.isFinite(age) && age < AUTO_BACKUP_INTERVAL_MS) return false;
        }
        const row = await db.prepare('SELECT state FROM app_state WHERE id = ?1').bind('main').first();
        if (!row || !row.state) return false;
        await createStateBackup(env, row.state, reason);
        return true;
    } catch (err) {
        return false;
    }
}

async function readState(env) {
    await ensureStorage(env);
    const row = await getDb(env).prepare('SELECT state FROM app_state WHERE id = ?1').bind('main').first();
    if (!row || !row.state) return clone(DEFAULT_STATE);
    try {
        return JSON.parse(row.state);
    } catch (err) {
        return clone(DEFAULT_STATE);
    }
}

async function writeState(env, state) {
    await ensureStorage(env);
    normalizeSocialGraph(state);
    await maybeCreateAutomaticBackup(env, 'auto');
    const safeState = sanitizeStateForStorage(state);
    await getDb(env).prepare(
        "INSERT INTO app_state (id, state, updated_at) VALUES ('main', ?1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = CURRENT_TIMESTAMP"
    ).bind(JSON.stringify(safeState)).run();
    return safeState;
}

async function createSession(env, username) {
    await ensureStorage(env);
    const token = randomToken();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    await getDb(env).prepare('INSERT INTO sessions (token, username, expires_at) VALUES (?1, ?2, ?3)').bind(token, username, expiresAt).run();
    return token;
}

async function getAuthenticatedUser(request, env, state) {
    let token = '';
    const authHeader = request.headers.get('Authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) token = match[1];

    const cookieHeader = request.headers.get('Cookie') || '';
    const cookieMatch = cookieHeader.match(/anivoid_auth_token=([^;]+)/);
    if (!token && cookieMatch) token = cookieMatch[1];

    if (!token) return null;
    await ensureStorage(env);
    const row = await getDb(env).prepare('SELECT username, expires_at FROM sessions WHERE token = ?1').bind(token).first();
    if (!row || Number(row.expires_at) < Date.now()) {
        if (row) await getDb(env).prepare('DELETE FROM sessions WHERE token = ?1').bind(token).run();
        return null;
    }
    const user = findRegisteredUser(state, row.username);
    if (!user) return null;
    await getDb(env).prepare('UPDATE sessions SET expires_at = ?1 WHERE token = ?2').bind(Date.now() + SESSION_TTL_MS, token).run();
    return user;
}

async function requireAuthenticatedUser(request, env, state) {
    const user = await getAuthenticatedUser(request, env, state);
    if (!user) return { response: json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, 401) };
    return { user };
}

function clientRateLimitKey(request, bucket, discriminator = '') {
    const ip = request.headers.get('CF-Connecting-IP')
        || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
        || 'unknown';
    const safeDiscriminator = normalizeUsername(discriminator).slice(0, 80);
    return [bucket, ip, safeDiscriminator].filter(Boolean).join(':');
}

async function enforceRateLimit(request, env, bucket, maxAttempts, windowMs, discriminator = '') {
    await ensureStorage(env);
    const now = Date.now();
    const resetAt = now + windowMs;
    const key = clientRateLimitKey(request, bucket, discriminator);
    await getDb(env).prepare('DELETE FROM rate_limits WHERE reset_at < ?1').bind(now).run();
    const row = await getDb(env).prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?1').bind(key).first();
    if (!row || Number(row.reset_at) < now) {
        await getDb(env).prepare(
            'INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = ?2'
        ).bind(key, resetAt).run();
        return null;
    }
    if (Number(row.count) >= maxAttempts) {
        const retryAfter = Math.max(1, Math.ceil((Number(row.reset_at) - now) / 1000));
        return json(
            { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
            429,
            { 'Retry-After': String(retryAfter) }
        );
    }
    await getDb(env).prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?1').bind(key).run();
    return null;
}

function isBogusAnime(anime) {
    if (!anime || !anime.id) return true;
    const id = String(anime.id);
    const bogusIds = new Set(['steins-gate', 'sample-anime', 'sample-anime-test', 'sample-anime-special-sync']);
    return bogusIds.has(id) || id.includes('debug') || id.startsWith('sample-anime') || id.includes('-test-') || id.startsWith('test-');
}

function mergeCommentLikes(serverLikes, localLikes, loggedInId = '') {
    const likes = new Set();
    const localLikeIds = new Set();
    [serverLikes, localLikes].forEach(list => {
        if (!Array.isArray(list)) return;
        list.forEach(item => {
            const id = normalizeUsername(item);
            if (id) likes.add(id);
        });
    });
    if (Array.isArray(localLikes)) {
        localLikes.forEach(item => {
            const id = normalizeUsername(item);
            if (id) localLikeIds.add(id);
        });
    }
    if (loggedInId) {
        if (localLikeIds.has(loggedInId)) likes.add(loggedInId);
        else likes.delete(loggedInId);
    }
    return Array.from(likes).slice(0, 200);
}

function mergeCommentsForUser(serverAnime, localAnime, loggedInId, onActivity = () => {}) {
    if (!serverAnime.comments) serverAnime.comments = [];
    const localComments = Array.isArray(localAnime.comments) ? localAnime.comments : [];
    const localCommentIds = new Set(localComments.map(comment => comment && comment.id).filter(Boolean));

    serverAnime.comments = serverAnime.comments.filter(comment => {
        const isAuthor = comment.friendId && comment.friendId.toLowerCase() === loggedInId;
        if (isAuthor && !localCommentIds.has(comment.id)) {
            onActivity('comment_delete', 'removeu uma critica');
        }
        return !isAuthor || localCommentIds.has(comment.id);
    });

    localComments.forEach(localComment => {
        if (!localComment || !localComment.id) return;
        const index = serverAnime.comments.findIndex(comment => comment.id === localComment.id);
        const isAuthor = localComment.friendId && localComment.friendId.toLowerCase() === loggedInId;

        if (isAuthor) {
            if (index >= 0) {
                const serverComment = serverAnime.comments[index];
                const mergedCommentText = preferCleanerText(serverComment.comment, localComment.comment);
                if (String(serverComment.comment || '') !== mergedCommentText) {
                    onActivity('comment_edit', 'editou uma critica');
                }
                const repliesMap = {};
                (serverComment.replies || []).forEach(reply => { if (reply && reply.id) repliesMap[reply.id] = reply; });
                (localComment.replies || []).forEach(reply => {
                    if (reply && reply.id) {
                        repliesMap[reply.id] = mergeReplyPreservingCleanText(repliesMap[reply.id], reply);
                    }
                });
                serverAnime.comments[index] = {
                    ...serverComment,
                    ...localComment,
                    comment: mergedCommentText,
                    likes: mergeCommentLikes(serverComment.likes, localComment.likes, loggedInId),
                    replies: Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                };
            } else {
                onActivity('comment_add', 'escreveu uma critica');
                serverAnime.comments.push({ ...localComment, likes: localComment.likes || [], replies: localComment.replies || [] });
            }
            return;
        }

        if (index >= 0) {
            const repliesMap = {};
            (serverAnime.comments[index].replies || []).forEach(reply => { if (reply && reply.id) repliesMap[reply.id] = reply; });
            let addedReply = false;
            (localComment.replies || []).forEach(reply => {
                if (reply && reply.id && reply.friendId && reply.friendId.toLowerCase() === loggedInId) {
                    if (!repliesMap[reply.id]) addedReply = true;
                    repliesMap[reply.id] = mergeReplyPreservingCleanText(repliesMap[reply.id], reply);
                }
            });
            if (addedReply) onActivity('reply_add', 'respondeu uma critica');
            serverAnime.comments[index] = {
                ...serverAnime.comments[index],
                likes: mergeCommentLikes(serverAnime.comments[index].likes, localComment.likes, loggedInId),
                replies: Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            };
        }
    });

    serverAnime.comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function createActivity(authorUser, type, anime, details) {
    return {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        username: authorUser.username,
        userColor: authorUser.color || '#FF4500',
        userAvatar: authorUser.avatar || '👤',
        type,
        animeId: anime.id,
        animeTitle: anime.title || 'Anime',
        details,
        timestamp: new Date().toISOString()
    };
}

function mergeClientActivities(mergedActivities, localActivities, authorUser, loggedInUser) {
    const loggedInId = normalizeUsername(loggedInUser);
    if (!loggedInId || !Array.isArray(localActivities)) return;

    localActivities.slice(0, 100).forEach(activity => {
        if (!activity || !activity.animeId || !activity.details) return;
        const activityUserId = normalizeUsername(activity.username);
        if (activityUserId && activityUserId !== loggedInId) return;

        mergedActivities.push({
            id: activity.id ? String(activity.id).slice(0, 120) : `act_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            username: authorUser.username,
            userColor: authorUser.color || '#FF4500',
            userAvatar: authorUser.avatar || '&#128100;',
            type: String(activity.type || 'activity').slice(0, 60),
            animeId: String(activity.animeId).slice(0, 120),
            animeTitle: String(activity.animeTitle || 'Anime').slice(0, 180),
            details: String(activity.details).slice(0, 300),
            timestamp: activity.timestamp && !Number.isNaN(new Date(activity.timestamp).getTime())
                ? String(activity.timestamp).slice(0, 40)
                : new Date().toISOString()
        });
    });
}

function compactActivities(activities, limit = 80) {
    const seenIds = new Set();
    const seenEvents = new Set();
    return (Array.isArray(activities) ? activities : [])
        .filter(activity => activity && activity.id && activity.username && activity.animeId && activity.details)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .filter(activity => {
            if (seenIds.has(activity.id)) return false;
            seenIds.add(activity.id);
            const minuteBucket = Math.floor(new Date(activity.timestamp).getTime() / 60000);
            const eventKey = [activity.username, activity.type, activity.animeId, activity.details, minuteBucket].join('|');
            if (seenEvents.has(eventKey)) return false;
            seenEvents.add(eventKey);
            return true;
        })
        .slice(0, limit);
}

function mergeStates(localState, serverState, loggedInUser, canEditCatalog = false) {
    const authorUser = findRegisteredUser(serverState, loggedInUser) || {
        username: loggedInUser || 'Desconhecido',
        color: '#FF4500',
        avatar: '👤'
    };
    const mergedActivities = Array.isArray(serverState.activities) ? [...serverState.activities] : [];
    mergeClientActivities(mergedActivities, localState.activities, authorUser, loggedInUser);
    const pushActivity = (type, anime, details) => {
        if (!loggedInUser || !anime || !anime.id) return;
        const activity = createActivity(authorUser, type, anime, details);
        mergedActivities.push(activity);
        notifyFriendsOfActivity(serverState, authorUser, activity);
    };

    const nextState = {
        friends: Array.isArray(serverState.friends) ? [...serverState.friends] : [],
        animes: Array.isArray(serverState.animes) ? serverState.animes.filter(anime => !isBogusAnime(anime)).map(anime => ({ ...anime })) : [],
        studioLogos: { ...(serverState.studioLogos && typeof serverState.studioLogos === 'object' ? serverState.studioLogos : {}) },
        registeredUsers: Array.isArray(serverState.registeredUsers) ? serverState.registeredUsers.map(user => ({ ...user })) : [],
        featuredAnimeId: serverState.featuredAnimeId || null,
        activities: mergedActivities
    };

    const loggedInId = normalizeUsername(loggedInUser);
    const localUsers = Array.isArray(localState.registeredUsers) ? localState.registeredUsers : [];
    const localMe = localUsers.find(user => user && user.username && sameUsername(user.username, loggedInUser));
    const serverMeIndex = nextState.registeredUsers.findIndex(user => user && user.username && sameUsername(user.username, loggedInUser));
    if (localMe && serverMeIndex >= 0) {
        const current = nextState.registeredUsers[serverMeIndex];
        nextState.registeredUsers[serverMeIndex] = {
            ...current,
            email: localMe.email || current.email,
            color: localMe.color || current.color,
            avatar: localMe.avatar || current.avatar,
            emailVerified: localMe.emailVerified !== undefined ? localMe.emailVerified : current.emailVerified,
            favoriteGenres: localMe.favoriteGenres || current.favoriteGenres,
            favoriteStudios: localMe.favoriteStudios || current.favoriteStudios,
            favoriteAnimes: localMe.favoriteAnimes || current.favoriteAnimes,
            activeTitle: localMe.activeTitle || current.activeTitle,
            featuredAnimeId: localMe.featuredAnimeId !== undefined ? localMe.featuredAnimeId : current.featuredAnimeId
        };
    }

    if (Array.isArray(localState.animes)) {
        localState.animes.filter(anime => !isBogusAnime(anime)).forEach(localAnime => {
            let serverAnime = nextState.animes.find(anime => anime.id === localAnime.id);
            if (!serverAnime) {
                return;
            }

            if (!serverAnime.ratings) serverAnime.ratings = {};
            const localRating = localAnime.ratings && localAnime.ratings[loggedInId];
            if (localRating) {
                const hasRealOverall = localRating.overall && parseFloat(localRating.overall) > 0;
                const hasEpisodeRatings = localRating.episodeRatings && Object.keys(localRating.episodeRatings).length > 0;
                const hasRealStatus = localRating.status && localRating.status !== 'Plan to Watch';
                if (hasRealOverall || hasEpisodeRatings || hasRealStatus || serverAnime.ratings[loggedInId]) {
                    const serverRating = serverAnime.ratings[loggedInId] || {};
                    if (localRating.status && localRating.status !== serverRating.status && (localRating.status !== 'Plan to Watch' || serverRating.status)) {
                        const statusPhrases = {
                            Watching: 'comecou a assistir',
                            Completed: 'concluiu a obra',
                            'On Hold': 'colocou em espera',
                            Dropped: 'abandonou a obra',
                            'Plan to Watch': 'adicionou a lista'
                        };
                        pushActivity('status', localAnime, statusPhrases[localRating.status] || `marcou como ${localRating.status}`);
                    }
                    if (localRating.overall !== undefined && String(localRating.overall) !== String(serverRating.overall || '')) {
                        const score = parseFloat(localRating.overall);
                        if (Number.isFinite(score) && score > 0) {
                            pushActivity('rating', localAnime, `avaliou com nota ${localRating.overall}`);
                        }
                    }
                    const prevWatched = Number(serverRating.episodesWatched || 0);
                    const nextWatched = Number(localRating.episodesWatched || 0);
                    const totalEpisodes = Number(localAnime.episodes || serverAnime.episodes || 0);
                    if (nextWatched > prevWatched && nextWatched !== totalEpisodes) {
                        pushActivity('progress', localAnime, `assistiu ao episodio ${nextWatched}`);
                    }
                    serverAnime.ratings[loggedInId] = { ...serverAnime.ratings[loggedInId], ...localRating };
                }
            }

            mergeCommentsForUser(serverAnime, localAnime, loggedInId, (type, details) => {
                pushActivity(type, localAnime, details);
            });
        });

        nextState.animes.forEach(serverAnime => {
            if (!serverAnime || !serverAnime.id) return;
            const recoveredRating = findLocalRatingForAnime(localState.animes, serverAnime, loggedInId);
            if (!hasMeaningfulRating(recoveredRating)) return;

            if (!serverAnime.ratings) serverAnime.ratings = {};
            const serverRating = serverAnime.ratings[loggedInId];
            if (hasMeaningfulRating(serverRating) && ratingStrength(serverRating) >= ratingStrength(recoveredRating)) return;

            if (recoveredRating.overall !== undefined && String(recoveredRating.overall) !== String(serverRating?.overall || '')) {
                const score = parseFloat(recoveredRating.overall);
                if (Number.isFinite(score) && score > 0) {
                    pushActivity('rating', serverAnime, `avaliou com nota ${recoveredRating.overall}`);
                }
            }
            serverAnime.ratings[loggedInId] = { ...(serverRating || {}), ...recoveredRating };
        });
    }

    if (canEditCatalog && localState.featuredAnimeId !== undefined) nextState.featuredAnimeId = localState.featuredAnimeId;
    nextState.activities = compactActivities(nextState.activities, 80);
    return normalizeSocialGraph(nextState);
}

async function parseJsonBody(request) {
    try {
        return await request.json();
    } catch (err) {
        return null;
    }
}

async function handleLogin(request, env) {
    const body = await parseJsonBody(request);
    const identifier = body && (body.identifier || body.email);
    if (!body || !identifier || !body.password) return json({ error: 'E-mail ou usuario e senha sao obrigatorios.' }, 400);
    const limited = await enforceRateLimit(request, env, 'login', 8, 1000 * 60 * 10, identifier);
    if (limited) return limited;
    const state = await readState(env);
    const user = findRegisteredUserByIdentifier(state, identifier);

    if (!user) {
        return json({ error: 'E-mail ou senha incorretos.' }, 401);
    }

    if (hasUnsupportedLegacyPassword(user)) {
        return json({
            error: 'Esta conta usa uma credencial legada que precisa de reset administrativo antes do login.',
            code: 'LEGACY_PASSWORD_RESET_ADMIN_REQUIRED'
        }, 426);
    }

    if (user.passwordResetRequired) {
        if (!(await verifyPassword(user, body.password))) {
            return json({ error: 'E-mail ou senha incorretos.' }, 401);
        }
        return json({ error: 'Sua conta exige uma redefinição de segurança. Insira uma nova senha forte na tela de redefinição.', code: 'PASSWORD_RESET_REQUIRED' }, 426);
    }

    if (!(await verifyPassword(user, body.password))) {
        return json({ error: 'E-mail ou senha incorretos.' }, 401);
    }

    const token = await createSession(env, user.username);
    const cookie = `anivoid_auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS/1000)}`;
    return json({
        success: true,
        user: sanitizeUser(user, user.username),
        state: sanitizeState(state, user.username)
    }, 200, { 'Set-Cookie': cookie });
}

async function handleLoginChallenge(request, env) {
    const limited = await enforceRateLimit(request, env, 'login-challenge', 4, 1000 * 60 * 10);
    if (limited) return limited;
    return json({ error: 'Fluxo de desafio de senha desativado. Atualize a pagina e tente novamente.' }, 410);
}

async function handleRegister(request, env) {
    const newUser = await parseJsonBody(request);
    if (!newUser || !newUser.username || !newUser.email || !newUser.password) {
        return json({ error: 'username, email and password required' }, 400);
    }
    const passwordError = passwordPolicyError(newUser.password);
    if (passwordError) return json({ error: passwordError }, 400);
    const limited = await enforceRateLimit(request, env, 'register', 5, 1000 * 60 * 30, newUser.email || newUser.username);
    if (limited) return limited;
    const state = await readState(env);
    if (!Array.isArray(state.registeredUsers)) state.registeredUsers = [];
    const exists = state.registeredUsers.some(user =>
        (user.username && sameUsername(user.username, newUser.username)) ||
        (user.email && user.email.toLowerCase() === String(newUser.email).toLowerCase())
    );
    if (exists) return json({ error: 'Nome de usuário ou e-mail já cadastrado.' }, 409);

    const nextMemberNumber = state.registeredUsers.filter(user => user.memberNumber).length + 1;
    const userToAdd = {
        username: newUser.username,
        email: newUser.email,
        color: newUser.color || '#FF4500',
        avatar: newUser.avatar || '👤',
        emailVerified: newUser.emailVerified !== undefined ? newUser.emailVerified : false,
        friends: [],
        friendRequests: [],
        favoriteGenres: newUser.favoriteGenres || [],
        favoriteStudios: newUser.favoriteStudios || [],
        favoriteAnimes: newUser.favoriteAnimes || [],
        activeTitle: newUser.activeTitle || '',
        memberNumber: nextMemberNumber,
        memberDesc: `Você é o ${nextMemberNumber}º membro a fazer parte do AniVoid. Bem-vindo a esta comunidade.`,
        notifications: [],
        isVirtual: false
    };
    pushUserNotification(userToAdd, {
        type: 'welcome',
        title: 'Bem-vindo ao AniVoid',
        message: 'Sua conta foi criada. Agora suas notas e perfil ficam sincronizados.',
        color: userToAdd.color,
        avatar: userToAdd.avatar
    });
    await setPassword(userToAdd, newUser.password);
    state.registeredUsers.push(userToAdd);
    await writeState(env, state);
    const token = await createSession(env, userToAdd.username);
    const cookie = `anivoid_auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS/1000)}`;
    return json({ success: true, user: sanitizeUser(userToAdd, userToAdd.username), state: sanitizeState(state, userToAdd.username) }, 200, { 'Set-Cookie': cookie });
}

async function handlePatchUser(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.username || !body.fields) return json({ error: 'Missing username or fields' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!sameUsername(auth.user.username, body.username) && !isAdminUser(auth.user, env)) return json({ error: 'Você só pode alterar o próprio perfil.' }, 403);
    const index = state.registeredUsers.findIndex(user => user && user.username && sameUsername(user.username, body.username));
    if (index < 0) return json({ error: 'User not found' }, 404);
    const allowedFields = ['email', 'color', 'avatar', 'emailVerified', 'favoriteGenres', 'favoriteStudios', 'favoriteAnimes', 'activeTitle', 'featuredAnimeId'];
    const safeFields = {};
    allowedFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(body.fields, field)) safeFields[field] = body.fields[field];
    });
    Object.assign(state.registeredUsers[index], safeFields);
    Object.keys(safeFields).forEach(field => {
        if (safeFields[field] === null) delete state.registeredUsers[index][field];
    });
    await writeState(env, state);
    return json({ success: true, user: sanitizeUser(state.registeredUsers[index], auth.user.username), registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleSyncState(request, env) {
    const body = await parseJsonBody(request);
    if (!body) return json({ error: 'Invalid JSON body' }, 400);
    const localState = body.localState || body;
    const serverState = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, serverState);
    if (auth.response) return auth.response;
    const nextState = mergeStates(localState, serverState, auth.user.username, isAdminUser(auth.user, env));
    await writeState(env, nextState);
    return json(sanitizeState(nextState, auth.user.username));
}

async function handleAdminUpsertAnime(request, env) {
    const body = await parseJsonBody(request);
    const input = body && body.anime;
    if (!input || typeof input !== 'object') return json({ error: 'Dados do anime sao obrigatorios.' }, 400);

    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Apenas o administrador pode alterar o catalogo.' }, 403);

    const requestedId = String(input.id || '').trim();
    const existingIndex = requestedId
        ? state.animes.findIndex(anime => anime && anime.id === requestedId)
        : -1;
    if (requestedId && existingIndex < 0) return json({ error: 'Anime nao encontrado.' }, 404);

    const existingAnime = existingIndex >= 0 ? state.animes[existingIndex] : null;
    const anime = buildCatalogAnime(input, existingAnime);
    if (!anime.title) return json({ error: 'Titulo do anime e obrigatorio.' }, 400);

    if (!existingAnime) {
        const duplicate = state.animes.some(item =>
            item && normalizeAnimeIdentity(item.title) === normalizeAnimeIdentity(anime.title)
        );
        if (duplicate) return json({ error: 'Este anime ja existe no catalogo.' }, 409);
        state.animes.push(anime);
    } else {
        state.animes[existingIndex] = anime;
    }

    if (anime.studio && anime.studioLogoUrl && anime.studio.toLowerCase() !== 'desconhecido') {
        state.studioLogos = {
            ...(state.studioLogos && typeof state.studioLogos === 'object' ? state.studioLogos : {}),
            [anime.studio]: anime.studioLogoUrl
        };
    }

    const activity = createActivity(
        auth.user,
        existingAnime ? 'catalog_edit' : 'catalog',
        anime,
        existingAnime ? 'atualizou os dados desta obra' : 'adicionou esta obra ao catalogo'
    );
    state.activities = compactActivities([activity, ...(state.activities || [])], 80);
    notifyFriendsOfActivity(state, auth.user, activity);

    const savedState = await writeState(env, state);
    return json({
        success: true,
        anime: savedState.animes.find(item => item.id === anime.id),
        activities: savedState.activities
    });
}

async function handleAdminDeleteAnime(request, env) {
    const body = await parseJsonBody(request);
    const animeId = String(body && body.animeId || '').trim();
    if (!animeId) return json({ error: 'Anime obrigatorio.' }, 400);

    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Apenas o administrador pode excluir animes.' }, 403);

    const animeIndex = state.animes.findIndex(anime => anime && anime.id === animeId);
    if (animeIndex < 0) return json({ error: 'Anime nao encontrado.' }, 404);

    await createStateBackup(
        env,
        JSON.stringify(sanitizeStateForStorage(state)),
        `before-delete-anime:${animeId}`
    );

    state.animes.splice(animeIndex, 1);
    if (state.featuredAnimeId === animeId) state.featuredAnimeId = null;
    (state.registeredUsers || []).forEach(user => {
        if (user && user.featuredAnimeId === animeId) user.featuredAnimeId = null;
    });
    state.activities = (state.activities || []).filter(activity => activity && activity.animeId !== animeId);

    const savedState = await writeState(env, state);
    return json({
        success: true,
        deletedAnimeId: animeId,
        registeredUsers: sanitizeState(savedState, auth.user.username).registeredUsers,
        activities: savedState.activities
    });
}

async function handleFriendRequest(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.to) return json({ error: 'Missing target username' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const fromUser = findRegisteredUser(state, auth.user.username);
    const toUser = findRegisteredUser(state, body.to);
    if (!fromUser || !toUser) return json({ error: 'Usuário não encontrado' }, 404);
    if (sameUsername(fromUser.username, toUser.username)) return json({ error: 'Não é possível adicionar a si mesmo' }, 400);

    const fromHasTarget = hasFriend(fromUser, toUser.username);
    const targetHasFrom = hasFriend(toUser, fromUser.username);
    if (fromHasTarget && targetHasFrom) {
        await writeState(env, state);
        return json({ success: true, alreadyFriends: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
    }
    if (fromHasTarget || targetHasFrom) {
        removeFriendship(fromUser, toUser);
    }

    if (Array.isArray(fromUser.friendRequests) && fromUser.friendRequests.some(req => req && sameUsername(req.from, toUser.username))) {
        ensureMutualFriendship(fromUser, toUser);
        pushUserNotification(toUser, {
            type: 'friend_accept',
            title: 'Convite aceito',
            message: `${fromUser.username} aceitou seu convite de amizade.`,
            color: fromUser.color || '#22c55e',
            avatar: fromUser.avatar || 'bell'
        });
        pushUserNotification(fromUser, {
            type: 'friend_accept',
            title: 'Nova amizade',
            message: `${toUser.username} agora esta na sua lista.`,
            color: toUser.color || '#22c55e',
            avatar: toUser.avatar || 'bell'
        });
        await writeState(env, state);
        return json({ success: true, accepted: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
    }

    if (!Array.isArray(toUser.friendRequests)) toUser.friendRequests = [];
    if (!toUser.friendRequests.some(req => req && sameUsername(req.from, fromUser.username))) {
        toUser.friendRequests.push({ from: fromUser.username, timestamp: new Date().toISOString() });
        pushUserNotification(toUser, {
            type: 'friend_request',
            title: 'Solicitacao de amizade',
            message: `${fromUser.username} quer te adicionar.`,
            color: fromUser.color || '#FF4500',
            avatar: fromUser.avatar || 'bell'
        });
    }
    await writeState(env, state);
    return json({ success: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleRespondFriendRequest(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.target || !body.action) return json({ error: 'Missing parameters' }, 400);
    if (!['accept', 'reject', 'decline'].includes(body.action)) return json({ error: 'Ação inválida' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const user = findRegisteredUser(state, auth.user.username);
    const targetUser = findRegisteredUser(state, body.target);
    if (!user || !targetUser) return json({ error: 'User not found' }, 404);
    removeFriendRequestsBetween(user, targetUser);
    if (body.action === 'accept') {
        ensureMutualFriendship(user, targetUser);
        pushUserNotification(targetUser, {
            type: 'friend_accept',
            title: 'Convite aceito',
            message: `${user.username} aceitou sua solicitacao.`,
            color: user.color || '#22c55e',
            avatar: user.avatar || 'bell'
        });
        pushUserNotification(user, {
            type: 'friend_accept',
            title: 'Nova amizade',
            message: `${targetUser.username} agora esta na sua lista.`,
            color: targetUser.color || '#22c55e',
            avatar: targetUser.avatar || 'bell'
        });
    }
    await writeState(env, state);
    return json({ success: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleCancelFriendRequest(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.target) return json({ error: 'Missing target username' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const targetUser = findRegisteredUser(state, body.target);
    if (!targetUser) return json({ error: 'User not found' }, 404);
    if (Array.isArray(targetUser.friendRequests)) {
        targetUser.friendRequests = targetUser.friendRequests.filter(req => req && !sameUsername(req.from, auth.user.username));
    }
    await writeState(env, state);
    return json({ success: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleSetFriendship(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.target) return json({ error: 'Missing target username' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    const sourceUser = findRegisteredUser(state, body.username || auth.user.username);
    const targetUser = findRegisteredUser(state, body.target);
    if (!sourceUser || !targetUser) return json({ error: 'User not found' }, 404);
    if (sameUsername(sourceUser.username, targetUser.username)) return json({ error: 'Cannot friend self' }, 400);
    ensureMutualFriendship(sourceUser, targetUser);
    await writeState(env, state);
    return json({ success: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleRemoveFriend(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.target) return json({ error: 'Missing parameters' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const user = findRegisteredUser(state, auth.user.username);
    const targetUser = findRegisteredUser(state, body.target);
    if (user && Array.isArray(user.friends)) user.friends = user.friends.filter(friend => !sameUsername(friend, body.target));
    if (targetUser && Array.isArray(targetUser.friends)) targetUser.friends = targetUser.friends.filter(friend => !sameUsername(friend, auth.user.username));
    await writeState(env, state);
    return json({ success: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
}

async function handleClearUserRatings(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.username || !Array.isArray(body.animeIds)) return json({ error: 'Missing username or animeIds' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!sameUsername(auth.user.username, body.username) && !isAdminUser(auth.user, env)) return json({ error: 'Você só pode limpar as próprias avaliações.' }, 403);
    const userId = normalizeUsername(body.username);
    let cleared = 0;
    (state.animes || []).forEach(anime => {
        if (body.animeIds.includes(anime.id) && anime.ratings && anime.ratings[userId]) {
            delete anime.ratings[userId];
            cleared++;
        }
    });
    await writeState(env, state);
    return json({ success: true, cleared });
}

async function handleForcedChangePassword(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.email || !body.oldPassword || !body.newPassword) return json({ error: 'Faltam dados obrigatórios.' }, 400);
    const passwordError = passwordPolicyError(body.newPassword);
    if (passwordError) return json({ error: passwordError }, 400);
    const limited = await enforceRateLimit(request, env, 'forced-password-reset', 5, 1000 * 60 * 30, body.email);
    if (limited) return limited;
    const state = await readState(env);
    const user = findRegisteredUserByIdentifier(state, body.email);
    if (!user) return json({ error: 'Credenciais inválidas.' }, 401);
    if (hasUnsupportedLegacyPassword(user)) {
        return json({
            error: 'Nao foi possivel validar a senha antiga desta credencial legada. Peça um reset administrativo.',
            code: 'LEGACY_PASSWORD_RESET_ADMIN_REQUIRED'
        }, 409);
    }
    let oldPasswordValid = false;
    try {
        oldPasswordValid = await verifyPassword(user, body.oldPassword);
    } catch (err) {
        if (passwordRequiresReset(user)) {
            return json({
                error: 'Nao foi possivel validar a senha antiga desta credencial legada. Peça um reset administrativo.',
                code: 'LEGACY_PASSWORD_RESET_ADMIN_REQUIRED'
            }, 409);
        }
        throw err;
    }
    if (!oldPasswordValid) return json({ error: 'Credenciais inválidas.' }, 401);
    await setPassword(user, body.newPassword);
    user.passwordResetRequired = false;
    await writeState(env, state);
    return json({ success: true });
}

async function handleChangePassword(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.password) {
        return json({ error: 'Nova senha obrigatoria.' }, 400);
    }
    if (String(body.password).length < MIN_PASSWORD_LENGTH) return json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const user = findRegisteredUser(state, auth.user.username);
    if (!user) return json({ error: 'User not found' }, 404);
    await setPassword(user, body.password);
    pushUserNotification(user, {
        type: 'account',
        title: 'Senha alterada',
        message: 'Sua senha foi atualizada com sucesso.',
        color: user.color || '#22c55e',
        avatar: user.avatar || 'bell'
    });
    await writeState(env, state);
    return json({ success: true });
}

async function handleSignOutAll(request, env) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    await ensureStorage(env);
    await getDb(env).prepare('DELETE FROM sessions WHERE username = ?1').bind(auth.user.username).run();
    return json({ success: true });
}

async function handleNotificationsAction(request, env, action) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    const user = findRegisteredUser(state, auth.user.username);
    if (!user) return json({ error: 'User not found' }, 404);
    if (!Array.isArray(user.notifications)) user.notifications = [];
    if (action === 'read') {
        user.notifications = user.notifications.map(item => ({ ...item, read: true }));
    } else if (action === 'clear') {
        user.notifications = [];
    }
    await writeState(env, state);
    return json({ success: true, notifications: sanitizeNotifications(user.notifications) });
}

function scrubUserFromState(state, targetUsername) {
    const targetId = normalizeUsername(targetUsername);
    const targetKey = usernameKey(targetUsername);
    let removed = 0;
    if (Array.isArray(state.registeredUsers)) {
        const before = state.registeredUsers.length;
        state.registeredUsers = state.registeredUsers.filter(user => user && !sameUsername(user.username, targetUsername));
        removed += before - state.registeredUsers.length;
    }
    (state.registeredUsers || []).forEach(user => {
        if (Array.isArray(user.friends)) user.friends = user.friends.filter(friend => !sameUsername(friend, targetUsername));
        if (Array.isArray(user.friendRequests)) user.friendRequests = user.friendRequests.filter(req => req && !sameUsername(req.from, targetUsername));
    });
    (state.animes || []).forEach(anime => {
        if (anime.ratings && typeof anime.ratings === 'object') {
            Object.keys(anime.ratings).forEach(key => {
                if (normalizeUsername(key) === targetId) delete anime.ratings[key];
            });
        }
        if (Array.isArray(anime.comments)) {
            anime.comments = anime.comments
                .filter(comment => normalizeUsername(comment && comment.friendId) !== targetId)
                .map(comment => ({
                    ...comment,
                    replies: Array.isArray(comment.replies)
                        ? comment.replies.filter(reply => normalizeUsername(reply && reply.friendId) !== targetId)
                        : []
                }));
        }
    });
    if (Array.isArray(state.activities)) {
        state.activities = state.activities.filter(activity => {
            const activityUser = normalizeUsername(activity && activity.username);
            return activityUser !== targetId && usernameKey(activity && activity.username) !== targetKey;
        });
    }
    return removed;
}

async function handleAdminOverview(request, env) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    const users = Array.isArray(state.registeredUsers) ? state.registeredUsers : [];
    const animes = Array.isArray(state.animes) ? state.animes : [];
    let ratings = 0;
    let comments = 0;
    animes.forEach(anime => {
        ratings += Object.keys(anime.ratings || {}).length;
        comments += Array.isArray(anime.comments) ? anime.comments.length : 0;
    });
    const backupInfo = await getDb(env).prepare('SELECT COUNT(*) AS count, MAX(created_at) AS latest FROM state_backups').first();
    return json({
        success: true,
        overview: {
            users: users.length,
            animes: animes.length,
            ratings,
            comments,
            activities: Array.isArray(state.activities) ? state.activities.length : 0,
            pendingRequests: users.reduce((sum, user) => sum + (Array.isArray(user.friendRequests) ? user.friendRequests.length : 0), 0),
            backups: Number(backupInfo && backupInfo.count) || 0,
            latestBackup: backupInfo && backupInfo.latest || null
        },
        users: users.slice(-20).reverse().map(sanitizeAdminUserSummary).filter(Boolean)
    });
}

async function handleAdminDeleteUser(request, env) {
    const body = await parseJsonBody(request);
    if (!body || !body.username) return json({ error: 'Missing username' }, 400);
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    if (sameUsername(auth.user.username, body.username)) return json({ error: 'Nao remova sua propria conta por aqui.' }, 400);
    await maybeCreateAutomaticBackup(env, 'auto');
    await createStateBackup(env, JSON.stringify(sanitizeStateForStorage(state)), `before-delete-user:${normalizeUsername(body.username)}`);
    const removed = scrubUserFromState(state, body.username);
    await writeState(env, state);
    await getDb(env).prepare('DELETE FROM sessions WHERE username = ?1').bind(body.username).run();
    return json({ success: true, removed, state: sanitizeState(state, auth.user.username) });
}

async function handleAdminBackups(request, env) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);

    if (request.method === 'POST') {
        await createStateBackup(env, JSON.stringify(sanitizeStateForStorage(state)), 'manual');
    }

    const rows = await getDb(env).prepare(
        'SELECT id, created_at, reason, length(state) AS bytes FROM state_backups ORDER BY id DESC LIMIT ?1'
    ).bind(BACKUP_RETENTION).all();
    return json({
        success: true,
        backups: (rows.results || []).map(row => ({
            id: row.id,
            createdAt: row.created_at,
            reason: row.reason,
            bytes: row.bytes
        }))
    });
}

async function handleAdminBackupDownload(request, env, backupId) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    const row = await getDb(env).prepare('SELECT id, created_at, reason, state FROM state_backups WHERE id = ?1').bind(Number(backupId)).first();
    if (!row) return json({ error: 'Backup not found' }, 404);
    return json({
        app: 'anivoid',
        type: 'server-backup',
        id: row.id,
        createdAt: row.created_at,
        reason: row.reason,
        state: JSON.parse(row.state)
    });
}

async function handleAdminExportState(request, env) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    return json({
        app: 'anivoid',
        type: 'server-state-export',
        exportedAt: new Date().toISOString(),
        state: sanitizeStateForStorage(state)
    });
}

async function handleAdminCleanSessions(request, env) {
    const state = await readState(env);
    const auth = await requireAuthenticatedUser(request, env, state);
    if (auth.response) return auth.response;
    if (!isAdminUser(auth.user, env)) return json({ error: 'Admin only' }, 403);
    await getDb(env).prepare('DELETE FROM sessions').run();
    return json({ success: true, message: 'Todas as sessões antigas foram invalidadas com sucesso no banco de dados D1.' });
}

async function handleAdminResetPassword(request, env) {
    const body = await parseJsonBody(request);
    const configuredKey = String(env.ADMIN_RESET_KEY || '').trim();
    if (!configuredKey) {
        return json({ error: 'ADMIN_RESET_KEY nao configurada no Cloudflare Pages.' }, 503);
    }

    const resetKey = String(request.headers.get('X-Admin-Reset-Key') || (body && body.resetKey) || '').trim();
    const identifier = body && (body.identifier || body.email || body.username);
    const keyLimited = await enforceRateLimit(request, env, 'admin-password-reset-key', 10, 1000 * 60 * 30, identifier || 'unknown');
    if (keyLimited) return keyLimited;

    if (!resetKey || !timingSafeEqual(resetKey, configuredKey)) {
        return json({ error: 'Reset administrativo nao autorizado.' }, 403);
    }

    const newPassword = body && body.newPassword;
    if (!identifier || !newPassword) {
        return json({ error: 'identifier e newPassword sao obrigatorios.' }, 400);
    }

    const passwordError = passwordPolicyError(newPassword);
    if (passwordError) return json({ error: passwordError }, 400);

    const limited = await enforceRateLimit(request, env, 'admin-password-reset', 5, 1000 * 60 * 30, identifier);
    if (limited) return limited;

    const state = await readState(env);
    const user = findRegisteredUserByIdentifier(state, identifier);
    if (!user) return json({ error: 'Usuario nao encontrado.' }, 404);

    await setPassword(user, newPassword);
    user.passwordResetRequired = body.requireChange !== false;
    await writeState(env, state);
    await getDb(env).prepare('DELETE FROM sessions WHERE username = ?1').bind(user.username).run();

    return json({
        success: true,
        username: user.username,
        message: 'Senha redefinida e sessoes antigas invalidadas.'
    });
}

async function handleAdminResetLegacyPasswords(request, env) {
    const body = await parseJsonBody(request).catch(() => ({}));
    const configuredKey = String(env.ADMIN_RESET_KEY || '').trim();
    if (!configuredKey) {
        return json({ error: 'ADMIN_RESET_KEY nao configurada no Cloudflare Pages.' }, 503);
    }

    const resetKey = String(request.headers.get('X-Admin-Reset-Key') || (body && body.resetKey) || '').trim();
    const keyLimited = await enforceRateLimit(request, env, 'admin-bulk-password-reset-key', 6, 1000 * 60 * 30);
    if (keyLimited) return keyLimited;

    if (!resetKey || !timingSafeEqual(resetKey, configuredKey)) {
        return json({ error: 'Reset administrativo nao autorizado.' }, 403);
    }

    const limited = await enforceRateLimit(request, env, 'admin-bulk-password-reset', 2, 1000 * 60 * 60);
    if (limited) return limited;

    const state = await readState(env);
    const users = Array.isArray(state.registeredUsers) ? state.registeredUsers : [];
    const resetUsers = [];

    for (const user of users) {
        if (!user || !user.username || !passwordRequiresReset(user)) continue;
        const temporaryPassword = createTemporaryPassword();
        await setPassword(user, temporaryPassword);
        user.passwordResetRequired = true;
        resetUsers.push({
            username: user.username,
            email: user.email || '',
            temporaryPassword
        });
    }

    if (resetUsers.length) {
        await writeState(env, state);
        for (const resetUser of resetUsers) {
            await getDb(env).prepare('DELETE FROM sessions WHERE username = ?1').bind(resetUser.username).run();
        }
    }

    return json({
        success: true,
        count: resetUsers.length,
        users: resetUsers
    });
}

async function handleAdminRequirePasswordChange(request, env) {
    const body = await parseJsonBody(request).catch(() => ({}));
    const configuredKey = String(env.ADMIN_RESET_KEY || '').trim();
    if (!configuredKey) {
        return json({ error: 'ADMIN_RESET_KEY nao configurada no Cloudflare Pages.' }, 503);
    }

    const resetKey = String(request.headers.get('X-Admin-Reset-Key') || (body && body.resetKey) || '').trim();
    const keyLimited = await enforceRateLimit(request, env, 'admin-require-password-change-key', 10, 1000 * 60 * 30);
    if (keyLimited) return keyLimited;

    if (!resetKey || !timingSafeEqual(resetKey, configuredKey)) {
        return json({ error: 'Reset administrativo nao autorizado.' }, 403);
    }

    const identifiers = Array.isArray(body && body.identifiers) ? body.identifiers : [];
    if (!identifiers.length && !body.all) {
        return json({ error: 'Envie identifiers ou all=true.' }, 400);
    }

    const limited = await enforceRateLimit(request, env, 'admin-require-password-change', 3, 1000 * 60 * 30);
    if (limited) return limited;

    const state = await readState(env);
    const users = Array.isArray(state.registeredUsers) ? state.registeredUsers : [];
    const changedUsers = [];

    for (const user of users) {
        if (!user || !user.username) continue;
        const shouldChange = body.all || identifiers.some(identifier =>
            sameUsername(identifier, user.username) ||
            String(identifier || '').toLowerCase() === String(user.email || '').toLowerCase()
        );
        if (!shouldChange) continue;
        user.passwordResetRequired = true;
        changedUsers.push({
            username: user.username,
            email: user.email || ''
        });
    }

    if (changedUsers.length) {
        await writeState(env, state);
        for (const changedUser of changedUsers) {
            await getDb(env).prepare('DELETE FROM sessions WHERE username = ?1').bind(changedUser.username).run();
        }
    }

    return json({
        success: true,
        count: changedUsers.length,
        users: changedUsers
    });
}

async function route(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });

    if (path === '/api/health' && request.method === 'GET') {
        await ensureStorage(env);
        return json({ ok: true, storage: 'cloudflare-d1' });
    }
    if (path === '/api/get-state' && request.method === 'GET') {
        const state = await readState(env);
        const authUser = await getAuthenticatedUser(request, env, state);
        return json(sanitizeState(state, authUser ? authUser.username : ''));
    }
    if (path === '/api/users' && request.method === 'GET') {
        const state = await readState(env);
        normalizeSocialGraph(state);
        const authUser = await getAuthenticatedUser(request, env, state);
        return json({
            viewerUsername: authUser ? authUser.username : '',
            registeredUsers: sanitizeRegisteredUsersOnly(state, authUser ? authUser.username : '')
        });
    }
    if (path === '/api/login-challenge' && request.method === 'POST') return handleLoginChallenge(request, env);
    if (path === '/api/login' && request.method === 'POST') return handleLogin(request, env);
    if (path === '/api/register' && request.method === 'POST') return handleRegister(request, env);
    if (path === '/api/patch-user' && request.method === 'POST') return handlePatchUser(request, env);
    if (path === '/api/account/change-password' && request.method === 'POST') return handleChangePassword(request, env);
    if (path === '/api/account/change-password-forced' && request.method === 'POST') return handleForcedChangePassword(request, env);
    if (path === '/api/account/signout-all' && request.method === 'POST') return handleSignOutAll(request, env);
    if (path === '/api/notifications/read' && request.method === 'POST') return handleNotificationsAction(request, env, 'read');
    if (path === '/api/notifications/clear' && request.method === 'POST') return handleNotificationsAction(request, env, 'clear');
    if (path === '/api/sync-state' && request.method === 'POST') return handleSyncState(request, env);
    if (path === '/api/clear-user-ratings' && request.method === 'POST') return handleClearUserRatings(request, env);
    if (path === '/api/send-friend-request' && request.method === 'POST') return handleFriendRequest(request, env);
    if (path === '/api/respond-friend-request' && request.method === 'POST') return handleRespondFriendRequest(request, env);
    if (path === '/api/cancel-friend-request' && request.method === 'POST') return handleCancelFriendRequest(request, env);
    if (path === '/api/admin/animes' && request.method === 'POST') return handleAdminUpsertAnime(request, env);
    if (path === '/api/admin/delete-anime' && request.method === 'POST') return handleAdminDeleteAnime(request, env);
    if (path === '/api/admin/reset-password' && request.method === 'POST') return handleAdminResetPassword(request, env);
    if (path === '/api/admin/reset-legacy-passwords' && request.method === 'POST') return handleAdminResetLegacyPasswords(request, env);
    if (path === '/api/admin/require-password-change' && request.method === 'POST') return handleAdminRequirePasswordChange(request, env);
    if (path === '/api/admin/set-friendship' && request.method === 'POST') return handleSetFriendship(request, env);
    if (path === '/api/admin/clean-sessions' && request.method === 'POST') return handleAdminCleanSessions(request, env);
    if (path === '/api/admin/overview' && request.method === 'GET') return handleAdminOverview(request, env);
    if (path === '/api/admin/delete-user' && request.method === 'POST') return handleAdminDeleteUser(request, env);
    if (path === '/api/admin/backups' && (request.method === 'GET' || request.method === 'POST')) return handleAdminBackups(request, env);
    if (path === '/api/admin/export-state' && request.method === 'GET') return handleAdminExportState(request, env);
    const backupMatch = path.match(/^\/api\/admin\/backups\/(\d+)$/);
    if (backupMatch && request.method === 'GET') return handleAdminBackupDownload(request, env, backupMatch[1]);
    if (path === '/api/remove-friend' && request.method === 'POST') return handleRemoveFriend(request, env);

    return json({ error: 'Not found' }, 404);
}

export async function onRequest(context) {
    try {
        return await route(context.request, context.env);
    } catch (err) {
        if (String(err && err.message) === 'missing_d1_binding') {
            return json({
                ok: false,
                error: 'missing_d1_binding',
                message: 'Configure um binding D1 chamado ANIVOID_DB no Cloudflare Pages.'
            }, 503);
        }
        console.error('Unhandled API error', err);
        return json({ error: 'Internal Server Error' }, 500);
    }
}
