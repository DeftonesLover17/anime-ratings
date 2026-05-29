const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH_BITS = 256;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_EXTERNAL_IMAGE_URL_LENGTH = 4096;
const MAX_DATA_IMAGE_LENGTH = 2 * 1024 * 1024;

const DEFAULT_STATE = {
    friends: [],
    animes: [],
    registeredUsers: [
        {
            username: 'Matheus',
            email: 'matheus@example.com',
            color: '#FF4500',
            avatar: '😎',
            friends: [],
            friendRequests: [],
            isVirtual: false,
            passwordHash: 'pC6ROAkz3ioMBm/u1UXfsua87wWlgIuHSkcmQo5nJQc=',
            passwordSalt: 'qO5kFhjpz2X5aq5M2RZfyQ==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        },
        {
            username: 'Lucas',
            email: 'lucas@example.com',
            color: '#00FF00',
            avatar: '🤖',
            friends: [],
            friendRequests: [],
            isVirtual: false,
            passwordHash: 'jgmFb+v6/5YzEvdoQf7p12rZvcyqBwsdUbsslXFIZWI=',
            passwordSalt: 'YvUH9f6rhDAiIILs1ml9wA==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        },
        {
            username: 'Felipe!',
            email: 'mfelipeneto5@gmail.com',
            color: '#FF4500',
            avatar: '👤',
            friends: ['vanitas'],
            friendRequests: [],
            isVirtual: false,
            passwordHash: 'gcsKfuu8ecVMMzNy6uOp4uyaQ7oFWbP+AODk1C6jupo=',
            passwordSalt: 'Z+YU5aMl+huYKZVolVQPVQ==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        },
        {
            username: 'vanitas',
            email: 'vanitas@example.com',
            color: '#9B59B6',
            avatar: '🌙',
            friends: ['Felipe!'],
            friendRequests: [],
            isVirtual: false,
            memberNumber: 1,
            memberDesc: 'Você é o 1º membro a fazer parte do AniVoid. Seu nome está gravado na história desta comunidade.',
            passwordHash: 'f+SU7ynUmFdgJMIh/duYGMbqtJd42z+XlW+It/TOmRY=',
            passwordSalt: 'bTV0UPkEacgHYcavwmD7qA==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        },
        {
            username: 'yamazx',
            email: 'yagomatthews9@gmail.com',
            color: '#00FF7F',
            avatar: '⚡',
            friends: [],
            friendRequests: [],
            isVirtual: false,
            memberNumber: 2,
            memberDesc: 'Você é o 2º membro a fazer parte do AniVoid. Um dos primeiros a descobrir este portal.',
            passwordHash: 'ajwns26nu3T+UQuv00/1CtBuohUjcjl+OXodiYh8TCc=',
            passwordSalt: '7cIuRZy2K2JziuamCQziSg==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        },
        {
            username: 'Júlio Gabriel',
            email: 'ninjazokobr@gmail.com',
            color: '#a78bfa',
            avatar: '👤',
            friends: [],
            friendRequests: [],
            isVirtual: false,
            memberNumber: 3,
            memberDesc: 'Você é o 3º membro a fazer parte do AniVoid. Bem-vindo ao grupo fundador.',
            passwordHash: 'RlGBrtQTHI9Dm7GvIiejdjDIzrRjqh4lBwdDUorjxn0=',
            passwordSalt: 'a7mbsTm91PM9/DiqjbirvQ==',
            passwordIterations: 310000,
            passwordDigest: 'pbkdf2-sha256'
        }
    ],
    studioLogos: {},
    featuredAnimeId: null,
    activities: []
};

function json(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
            'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization'
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
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(covers|logos)\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
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
            : []
    };
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
        safeRatings[escapeHtml(friendId, 80)] = {
            ...rating,
            animation: Number.isFinite(Number(rating.animation)) ? Number(rating.animation) : 0,
            story: Number.isFinite(Number(rating.story)) ? Number(rating.story) : 0,
            sound: Number.isFinite(Number(rating.sound)) ? Number(rating.sound) : 0,
            overall: rating.overall === '-' ? '-' : (Number.isFinite(Number(rating.overall)) ? Number(rating.overall) : 0),
            status: escapeHtml(rating.status || 'Plan to Watch', 80),
            episodesWatched: Number.isFinite(Number(rating.episodesWatched)) ? Number(rating.episodesWatched) : 0,
            episodeRatings: safeEpisodeRatings
        };
    });
    return safeRatings;
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
        studio: escapeHtml(anime.studio || '', 120),
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
            userAvatar: sanitizeAvatar(activity && activity.userAvatar),
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
        ...safeUser
    } = user;
    if (viewerUsername && user.username && sameUsername(user.username, viewerUsername)) return safeUser;
    delete safeUser.email;
    return safeUser;
}

function sanitizeState(state, viewerUsername = '') {
    const storageSafeState = sanitizeStateForStorage(state);
    return {
        ...storageSafeState,
        registeredUsers: Array.isArray(storageSafeState.registeredUsers)
            ? storageSafeState.registeredUsers.map(user => sanitizeUser(user, viewerUsername))
            : []
    };
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

async function setPassword(user, password) {
    Object.assign(user, await hashPassword(password));
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
        (user.friends || []).forEach(friendName => {
            const friendUser = findRegisteredUser(state, friendName);
            if (friendUser) ensureMutualFriendship(user, friendUser);
        });
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
                    return fromUser && !hasFriend(user, fromUser.username) && !hasFriend(fromUser, user.username);
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

function isAdminUser(user, env) {
    const admins = String(env.ADMIN_USERS || 'Felipe!,Felipe')
        .split(',')
        .map(name => normalizeUsername(name))
        .filter(Boolean);
    return admins.includes(normalizeUsername(user && user.username));
}

function getDb(env) {
    if (!env.ANIVOID_DB) throw new Error('missing_d1_binding');
    return env.ANIVOID_DB;
}

async function ensureStorage(env) {
    const db = getDb(env);
    await db.prepare('CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at INTEGER NOT NULL)').run();
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)').run();
    await db.prepare(
        "INSERT INTO app_state (id, state, updated_at) VALUES ('main', ?1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING"
    ).bind(JSON.stringify(sanitizeStateForStorage(clone(DEFAULT_STATE)))).run();
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
    const header = request.headers.get('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    await ensureStorage(env);
    const row = await getDb(env).prepare('SELECT username, expires_at FROM sessions WHERE token = ?1').bind(match[1]).first();
    if (!row || Number(row.expires_at) < Date.now()) {
        if (row) await getDb(env).prepare('DELETE FROM sessions WHERE token = ?1').bind(match[1]).run();
        return null;
    }
    const user = findRegisteredUser(state, row.username);
    if (!user) return null;
    await getDb(env).prepare('UPDATE sessions SET expires_at = ?1 WHERE token = ?2').bind(Date.now() + SESSION_TTL_MS, match[1]).run();
    return user;
}

async function requireAuthenticatedUser(request, env, state) {
    const user = await getAuthenticatedUser(request, env, state);
    if (!user) return { response: json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }, 401) };
    return { user };
}

function isBogusAnime(anime) {
    if (!anime || !anime.id) return true;
    const id = String(anime.id);
    const bogusIds = new Set(['steins-gate', 'sample-anime', 'sample-anime-test', 'sample-anime-special-sync']);
    return bogusIds.has(id) || id.includes('debug') || id.startsWith('sample-anime') || id.includes('-test-') || id.startsWith('test-');
}

function mergeCommentsForUser(serverAnime, localAnime, loggedInId) {
    if (!serverAnime.comments) serverAnime.comments = [];
    const localComments = Array.isArray(localAnime.comments) ? localAnime.comments : [];
    const localCommentIds = new Set(localComments.map(comment => comment && comment.id).filter(Boolean));

    serverAnime.comments = serverAnime.comments.filter(comment => {
        const isAuthor = comment.friendId && comment.friendId.toLowerCase() === loggedInId;
        return !isAuthor || localCommentIds.has(comment.id);
    });

    localComments.forEach(localComment => {
        if (!localComment || !localComment.id) return;
        const index = serverAnime.comments.findIndex(comment => comment.id === localComment.id);
        const isAuthor = localComment.friendId && localComment.friendId.toLowerCase() === loggedInId;

        if (isAuthor) {
            if (index >= 0) {
                const repliesMap = {};
                (serverAnime.comments[index].replies || []).forEach(reply => { if (reply && reply.id) repliesMap[reply.id] = reply; });
                (localComment.replies || []).forEach(reply => { if (reply && reply.id) repliesMap[reply.id] = reply; });
                serverAnime.comments[index] = {
                    ...serverAnime.comments[index],
                    ...localComment,
                    replies: Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                };
            } else {
                serverAnime.comments.push({ ...localComment, replies: localComment.replies || [] });
            }
            return;
        }

        if (index >= 0) {
            const repliesMap = {};
            (serverAnime.comments[index].replies || []).forEach(reply => { if (reply && reply.id) repliesMap[reply.id] = reply; });
            (localComment.replies || []).forEach(reply => {
                if (reply && reply.id && reply.friendId && reply.friendId.toLowerCase() === loggedInId) repliesMap[reply.id] = reply;
            });
            serverAnime.comments[index] = {
                ...serverAnime.comments[index],
                replies: Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            };
        }
    });

    serverAnime.comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function mergeStates(localState, serverState, loggedInUser) {
    const nextState = {
        friends: Array.isArray(serverState.friends) ? [...serverState.friends] : [],
        animes: Array.isArray(serverState.animes) ? serverState.animes.filter(anime => !isBogusAnime(anime)).map(anime => ({ ...anime })) : [],
        studioLogos: { ...(serverState.studioLogos && typeof serverState.studioLogos === 'object' ? serverState.studioLogos : {}) },
        registeredUsers: Array.isArray(serverState.registeredUsers) ? serverState.registeredUsers.map(user => ({ ...user })) : [],
        featuredAnimeId: serverState.featuredAnimeId || null,
        activities: Array.isArray(serverState.activities) ? [...serverState.activities] : []
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

    if (localState.studioLogos && typeof localState.studioLogos === 'object') {
        Object.entries(localState.studioLogos).forEach(([studioName, logoUrl]) => {
            if (studioName && logoUrl) nextState.studioLogos[studioName] = logoUrl;
        });
    }

    if (Array.isArray(localState.animes)) {
        localState.animes.filter(anime => !isBogusAnime(anime)).forEach(localAnime => {
            if (localAnime && localAnime.studio && localAnime.studioLogoUrl) nextState.studioLogos[localAnime.studio] = localAnime.studioLogoUrl;

            let serverAnime = nextState.animes.find(anime => anime.id === localAnime.id);
            if (!serverAnime) {
                nextState.animes.push({ ...localAnime });
                return;
            }

            serverAnime.title = localAnime.title || serverAnime.title;
            serverAnime.japaneseTitle = localAnime.japaneseTitle || serverAnime.japaneseTitle;
            serverAnime.synopsis = localAnime.synopsis || serverAnime.synopsis;
            serverAnime.coverUrl = localAnime.coverUrl || serverAnime.coverUrl;
            serverAnime.studioLogoUrl = localAnime.studioLogoUrl || serverAnime.studioLogoUrl;
            serverAnime.genres = localAnime.genres || serverAnime.genres;
            serverAnime.studio = localAnime.studio || serverAnime.studio;
            serverAnime.season = localAnime.season || serverAnime.season;
            serverAnime.episodes = localAnime.episodes || serverAnime.episodes;

            if (!serverAnime.ratings) serverAnime.ratings = {};
            const localRating = localAnime.ratings && localAnime.ratings[loggedInId];
            if (localRating) {
                const hasRealOverall = localRating.overall && parseFloat(localRating.overall) > 0;
                const hasEpisodeRatings = localRating.episodeRatings && Object.keys(localRating.episodeRatings).length > 0;
                const hasRealStatus = localRating.status && localRating.status !== 'Plan to Watch';
                if (hasRealOverall || hasEpisodeRatings || hasRealStatus || serverAnime.ratings[loggedInId]) {
                    serverAnime.ratings[loggedInId] = { ...serverAnime.ratings[loggedInId], ...localRating };
                }
            }

            mergeCommentsForUser(serverAnime, localAnime, loggedInId);
        });
    }

    if (localState.featuredAnimeId !== undefined) nextState.featuredAnimeId = localState.featuredAnimeId;
    nextState.activities = nextState.activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
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
    if (!body || !body.email || !body.password) return json({ error: 'E-mail e senha são obrigatórios.' }, 400);
    const state = await readState(env);
    const user = (state.registeredUsers || []).find(candidate =>
        candidate && candidate.email && candidate.email.toLowerCase() === String(body.email).toLowerCase()
    );
    if (!user || !(await verifyPassword(user, body.password))) return json({ error: 'E-mail ou senha incorretos.' }, 401);
    if (!user.passwordHash || user.password) {
        await setPassword(user, body.password);
        await writeState(env, state);
    }
    const token = await createSession(env, user.username);
    return json({ success: true, token, user: sanitizeUser(user, user.username), state: sanitizeState(state, user.username) });
}

async function handleRegister(request, env) {
    const newUser = await parseJsonBody(request);
    if (!newUser || !newUser.username || !newUser.email || !newUser.password) return json({ error: 'username, email and password required' }, 400);
    if (String(newUser.password).length < 4) return json({ error: 'A senha deve ter pelo menos 4 caracteres.' }, 400);
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
        isVirtual: false
    };
    await setPassword(userToAdd, newUser.password);
    state.registeredUsers.push(userToAdd);
    await writeState(env, state);
    const token = await createSession(env, userToAdd.username);
    return json({ success: true, token, user: sanitizeUser(userToAdd, userToAdd.username), state: sanitizeState(state, userToAdd.username) });
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
    const nextState = mergeStates(localState, serverState, auth.user.username);
    await writeState(env, nextState);
    return json(sanitizeState(nextState, auth.user.username));
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

    if (hasFriend(fromUser, toUser.username) || hasFriend(toUser, fromUser.username)) {
        ensureMutualFriendship(fromUser, toUser);
        await writeState(env, state);
        return json({ success: true, alreadyFriends: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
    }

    if (Array.isArray(fromUser.friendRequests) && fromUser.friendRequests.some(req => req && sameUsername(req.from, toUser.username))) {
        ensureMutualFriendship(fromUser, toUser);
        await writeState(env, state);
        return json({ success: true, accepted: true, registeredUsers: sanitizeState(state, auth.user.username).registeredUsers });
    }

    if (!Array.isArray(toUser.friendRequests)) toUser.friendRequests = [];
    if (!toUser.friendRequests.some(req => req && sameUsername(req.from, fromUser.username))) {
        toUser.friendRequests.push({ from: fromUser.username, timestamp: new Date().toISOString() });
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
    if (body.action === 'accept') ensureMutualFriendship(user, targetUser);
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

async function route(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
            'Access-Control-Allow-Headers': 'X-Requested-With,content-type,Authorization'
        }
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
    if (path === '/api/login' && request.method === 'POST') return handleLogin(request, env);
    if (path === '/api/register' && request.method === 'POST') return handleRegister(request, env);
    if (path === '/api/patch-user' && request.method === 'POST') return handlePatchUser(request, env);
    if (path === '/api/sync-state' && request.method === 'POST') return handleSyncState(request, env);
    if (path === '/api/clear-user-ratings' && request.method === 'POST') return handleClearUserRatings(request, env);
    if (path === '/api/send-friend-request' && request.method === 'POST') return handleFriendRequest(request, env);
    if (path === '/api/respond-friend-request' && request.method === 'POST') return handleRespondFriendRequest(request, env);
    if (path === '/api/admin/set-friendship' && request.method === 'POST') return handleSetFriendship(request, env);
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
        return json({ error: 'Internal Server Error' }, 500);
    }
}
