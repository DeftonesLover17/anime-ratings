const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, 'state.json');
const DATABASE_URL = process.env.DATABASE_URL || '';
const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_EXTERNAL_IMAGE_URL_LENGTH = 4096;
const MAX_DATA_IMAGE_LENGTH = 2 * 1024 * 1024;
const sessions = new Map();
const DEFAULT_STATE = {
    friends: [],
    animes: [],
    registeredUsers: [],
    activities: [],
    studioLogos: {}
};

// Ensure data folder and state file exist
if (!DATABASE_URL && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!DATABASE_URL && !fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8'
};

function normalizeUsername(username) {
    return String(username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
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

function sanitizeImageUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';

    if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) {
        const compactValue = value.replace(/\s+/g, '');
        if (compactValue.length <= MAX_DATA_IMAGE_LENGTH && isCompleteDataImage(compactValue)) {
            return compactValue;
        }
        return '';
    }

    if (value.length > MAX_EXTERNAL_IMAGE_URL_LENGTH) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(covers|logos)\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
    return '';
}

function isCompleteDataImage(value) {
    const match = String(value || '').match(/^data:image\/(png|jpe?g|gif|webp);base64,([a-z0-9+/=]+)$/i);
    if (!match) return false;
    const type = match[1].toLowerCase();
    const base64 = match[2];
    if (base64.length % 4 === 1) return false;

    let bytes;
    try {
        bytes = Buffer.from(base64, 'base64');
    } catch (err) {
        return false;
    }
    if (bytes.length < 12) return false;

    if (type === 'jpg' || type === 'jpeg') {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    }
    if (type === 'png') {
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
            && bytes.slice(-8, -4).toString('ascii') === 'IEND';
    }
    if (type === 'gif') {
        const header = bytes.slice(0, 6).toString('ascii');
        return (header === 'GIF87a' || header === 'GIF89a') && bytes[bytes.length - 1] === 0x3b;
    }
    if (type === 'webp') {
        return bytes.slice(0, 4).toString('ascii') === 'RIFF'
            && bytes.slice(8, 12).toString('ascii') === 'WEBP'
            && bytes.readUInt32LE(4) + 8 <= bytes.length;
    }
    return false;
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
            updatedAt: escapeHtml(rating.updatedAt || '', 40),
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

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
}

function getStaticCacheControl(relativePath) {
    if (relativePath === 'index.html') {
        return 'no-cache';
    }
    if (relativePath === 'app.js' || relativePath === 'styles.css') {
        return 'public, max-age=31536000, immutable';
    }
    return 'public, max-age=604800, stale-while-revalidate=86400';
}

function createStaticEtag(stat) {
    return `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
}

function requestHasFreshStaticCache(req, stat, etag) {
    const ifNoneMatch = String(req.headers['if-none-match'] || '');
    if (ifNoneMatch.split(',').map(value => value.trim()).includes(etag)) {
        return true;
    }

    const ifModifiedSince = req.headers['if-modified-since'];
    if (!ifModifiedSince) return false;
    const sinceTime = new Date(ifModifiedSince).getTime();
    const modifiedTime = Math.floor(stat.mtime.getTime() / 1000) * 1000;
    return Number.isFinite(sinceTime) && modifiedTime <= sinceTime;
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
    if (viewerUsername && user.username && user.username.toLowerCase() === viewerUsername.toLowerCase()) {
        return safeUser;
    }
    delete safeUser.email;
    return safeUser;
}

function sanitizeState(state, viewerUsername = '') {
    const storageSafeState = sanitizeStateForStorage(state);
    const safeState = {
        ...storageSafeState,
        viewerUsername: viewerUsername || '',
        registeredUsers: Array.isArray(storageSafeState.registeredUsers)
            ? storageSafeState.registeredUsers.map(user => sanitizeUser(user, viewerUsername))
            : []
    };
    return safeState;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('base64'), iterations = PASSWORD_ITERATIONS) {
    const passwordHash = crypto
        .pbkdf2Sync(String(password || ''), salt, iterations, PASSWORD_KEY_LENGTH, 'sha256')
        .toString('base64');
    return {
        passwordHash,
        passwordSalt: salt,
        passwordIterations: iterations,
        passwordDigest: 'pbkdf2-sha256'
    };
}

function timingSafeCompare(a, b) {
    const aBuffer = Buffer.from(String(a || ''), 'base64');
    const bBuffer = Buffer.from(String(b || ''), 'base64');
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyPassword(user, password) {
    if (!user || !password) return false;
    if (user.passwordHash && user.passwordSalt) {
        const iterations = user.passwordIterations || PASSWORD_ITERATIONS;
        const candidate = hashPassword(password, user.passwordSalt, iterations).passwordHash;
        return timingSafeCompare(candidate, user.passwordHash);
    }
    return typeof user.password === 'string' && user.password === password;
}

function setPassword(user, password) {
    Object.assign(user, hashPassword(password));
    delete user.password;
}

function createSession(username) {
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, {
        username,
        expiresAt: Date.now() + SESSION_TTL_MS
    });
    return token;
}

function getAuthenticatedUser(req, state) {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    const session = sessions.get(match[1]);
    if (!session || session.expiresAt < Date.now()) {
        if (session) sessions.delete(match[1]);
        return null;
    }
    const user = (state.registeredUsers || []).find(u =>
        u && u.username && u.username.toLowerCase() === session.username.toLowerCase()
    );
    if (!user) return null;
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return user;
}

function requireAuthenticatedUser(req, res, state) {
    const user = getAuthenticatedUser(req, state);
    if (!user) {
        sendJson(res, 401, { error: 'Sessão inválida ou expirada. Faça login novamente.' });
        return null;
    }
    return user;
}

function isAdminUser(user) {
    const admins = (process.env.ADMIN_USERS || 'Felipe!,Felipe')
        .split(',')
        .map(name => normalizeUsername(name))
        .filter(Boolean);
    return admins.includes(normalizeUsername(user && user.username));
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

function findRegisteredUser(state, username) {
    return (state.registeredUsers || []).find(user => user && user.username && sameUsername(user.username, username));
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

function hasFriend(user, friendName) {
    return Array.isArray(user && user.friends) && user.friends.some(name => sameUsername(name, friendName));
}

function addFriend(user, friendUser) {
    if (!user || !friendUser || !friendUser.username || sameUsername(user.username, friendUser.username)) return;
    if (!Array.isArray(user.friends)) user.friends = [];
    if (!hasFriend(user, friendUser.username)) {
        user.friends.push(friendUser.username);
    }
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

let pgPool = null;
let pgReadyPromise = null;
let pgSslMode = process.env.PGSSLMODE === 'disable' ? 'disable' : 'require';

function formatPostgresError(err) {
    const message = String((err && err.message) || err || 'Unknown Postgres error')
        .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted-postgres-url]');
    return [err && err.code, message].filter(Boolean).join(' ');
}

function classifyPostgresError(err) {
    const code = err && err.code;
    const message = String((err && err.message) || '').toLowerCase();
    if (message.includes('pg package') || message.includes("cannot find module 'pg'")) return 'missing_pg_dependency';
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'db_host_not_found';
    if (code === 'ETIMEDOUT' || message.includes('timeout')) return 'db_connection_timeout';
    if (code === 'ECONNREFUSED') return 'db_connection_refused';
    if (code === '28P01' || message.includes('password authentication failed')) return 'db_auth_failed';
    if (code === '3D000' || message.includes('database') && message.includes('does not exist')) return 'db_not_found';
    if (message.includes('ssl') || message.includes('pg_hba.conf')) return 'db_ssl_or_access_rule';
    return 'db_unknown_error';
}

function getPgPool() {
    if (!DATABASE_URL) return null;
    if (pgPool) return pgPool;
    try {
        const { Pool } = require('pg');
        pgPool = new Pool({
            connectionString: DATABASE_URL,
            ssl: pgSslMode === 'disable' ? false : { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });
        return pgPool;
    } catch (err) {
        throw new Error('Postgres storage requires the "pg" package. Run npm install or deploy with package.json dependencies.');
    }
}

function switchPgSslMode(nextMode) {
    const oldPool = pgPool;
    pgPool = null;
    pgSslMode = nextMode;
    if (oldPool) {
        oldPool.end().catch(() => {});
    }
}

function getPgSslRetryMode(err) {
    const message = String((err && err.message) || '').toLowerCase();
    if (pgSslMode !== 'disable' && (
        message.includes('server does not support ssl') ||
        message.includes('ssl was required') ||
        message.includes('wrong version number')
    )) {
        return 'disable';
    }
    if (pgSslMode === 'disable' && (
        (message.includes('no pg_hba.conf') && message.includes('no encryption')) ||
        (message.includes('ssl') && message.includes('required'))
    )) {
        return 'require';
    }
    return null;
}

async function queryPostgres(sql, params = []) {
    try {
        return await getPgPool().query(sql, params);
    } catch (err) {
        const retryMode = getPgSslRetryMode(err);
        if (!retryMode) throw err;
        console.warn(`Postgres query failed with ssl=${pgSslMode}; retrying with ssl=${retryMode}. ${formatPostgresError(err)}`);
        switchPgSslMode(retryMode);
        return getPgPool().query(sql, params);
    }
}

async function ensurePostgresState() {
    if (!DATABASE_URL) return;
    if (pgReadyPromise) return pgReadyPromise;

    pgReadyPromise = (async () => {
        await queryPostgres(`
            CREATE TABLE IF NOT EXISTS app_state (
                id text PRIMARY KEY,
                state jsonb NOT NULL,
                updated_at timestamptz NOT NULL DEFAULT now()
            )
        `);

        let initialState = DEFAULT_STATE;
        if (fs.existsSync(STATE_FILE)) {
            try {
                initialState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            } catch (err) {
                initialState = DEFAULT_STATE;
            }
        }

        await queryPostgres(
            `INSERT INTO app_state (id, state)
             VALUES ($1, $2::jsonb)
             ON CONFLICT (id) DO NOTHING`,
            ['main', JSON.stringify(sanitizeStateForStorage(initialState))]
        );
    })().catch(err => {
        pgReadyPromise = null;
        throw err;
    });

    return pgReadyPromise;
}

function readState(callback) {
    if (!DATABASE_URL) {
        fs.readFile(STATE_FILE, 'utf8', callback);
        return;
    }

    ensurePostgresState()
        .then(() => queryPostgres('SELECT state FROM app_state WHERE id = $1', ['main']))
        .then(result => {
            const state = result.rows[0] ? result.rows[0].state : DEFAULT_STATE;
            callback(null, JSON.stringify(state));
        })
        .catch(err => {
            console.error(`Failed to read state from Postgres. ${formatPostgresError(err)}`);
            callback(err);
        });
}

function writeState(state, callback) {
    normalizeSocialGraph(state);
    const safeState = sanitizeStateForStorage(state);
    if (!DATABASE_URL) {
        fs.writeFile(STATE_FILE, JSON.stringify(safeState, null, 2), 'utf8', callback);
        return;
    }

    ensurePostgresState()
        .then(() => queryPostgres(
            `INSERT INTO app_state (id, state, updated_at)
             VALUES ($1, $2::jsonb, now())
             ON CONFLICT (id)
             DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
            ['main', JSON.stringify(safeState)]
        ))
        .then(() => callback(null))
        .catch(err => {
            console.error(`Failed to write state to Postgres. ${formatPostgresError(err)}`);
            callback(err);
        });
}

// Helper to merge state databases on the server
function mergeStates(localState, serverState, loggedInUser) {
    // Get author profile for activity generation
    let authorUser = { username: loggedInUser || 'Desconhecido', color: '#FF4500', avatar: '👤' };
    if (loggedInUser && serverState.registeredUsers) {
        const found = serverState.registeredUsers.find(u => u.username && u.username.toLowerCase() === loggedInUser.toLowerCase());
        if (found) {
            authorUser = { username: found.username, color: found.color || '#FF4500', avatar: found.avatar || '👤' };
        }
    }

    const mergedActivities = serverState.activities ? [...serverState.activities] : [];

    // Helper to generate a unique activity ID
    function generateActivityId() {
        return 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function mergeClientActivities() {
        const loggedInId = normalizeUsername(loggedInUser);
        if (!loggedInId || !Array.isArray(localState.activities)) return;

        localState.activities.slice(0, 100).forEach(activity => {
            if (!activity || !activity.animeId || !activity.details) return;
            const activityUserId = normalizeUsername(activity.username);
            if (activityUserId && activityUserId !== loggedInId) return;

            mergedActivities.push({
                id: activity.id ? String(activity.id).slice(0, 120) : generateActivityId(),
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

    mergeClientActivities();

    // 1. Merge registered users by username
    const mergedUsers = [...serverState.registeredUsers];
    if (localState.registeredUsers && Array.isArray(localState.registeredUsers)) {
        localState.registeredUsers.forEach(u => {
            const index = mergedUsers.findIndex(su => 
                (su.username && u.username && su.username.toLowerCase() === u.username.toLowerCase()) || 
                (su.email && u.email && su.email.toLowerCase() === u.email.toLowerCase())
            );
            if (index >= 0) {
                // If a user name matches the logged-in user, we merge their personal profile updates from the client,
                // but we strictly preserve the server's social graph fields (friends, friendRequests) to prevent client overwrites.
                if (loggedInUser && u.username && u.username.toLowerCase() === loggedInUser.toLowerCase()) {
                    // Safe union of friends: never drop a friend that either server or client knows about.
                    // Friends can only be removed explicitly via /api/remove-friend.
                    const serverFriends = (mergedUsers[index].friends || []).map(f => f.toLowerCase());
                    const clientFriends = (u.friends || []).map(f => f.toLowerCase());
                    const unionFriendNames = [...new Set([...serverFriends, ...clientFriends])];
                    // Resolve canonical username casing from registeredUsers
                    const canonicalFriends = unionFriendNames.map(fl => {
                        const found = mergedUsers.find(mu => mu.username && mu.username.toLowerCase() === fl);
                        return found ? found.username : fl;
                    });

                    mergedUsers[index] = {
                        ...mergedUsers[index], // Server state is base
                        email: u.email || mergedUsers[index].email,
                        color: u.color || mergedUsers[index].color,
                        avatar: u.avatar || mergedUsers[index].avatar,
                        emailVerified: u.emailVerified !== undefined ? u.emailVerified : mergedUsers[index].emailVerified,
                        favoriteGenres: u.favoriteGenres || mergedUsers[index].favoriteGenres,
                        favoriteStudios: u.favoriteStudios || mergedUsers[index].favoriteStudios,
                        favoriteAnimes: u.favoriteAnimes || mergedUsers[index].favoriteAnimes,
                        activeTitle: u.activeTitle || mergedUsers[index].activeTitle,
                        friends: canonicalFriends, // union — never shrinks
                        // Preserve per-user featuredAnimeId (client wins for their own profile)
                        featuredAnimeId: u.featuredAnimeId !== undefined ? u.featuredAnimeId : mergedUsers[index].featuredAnimeId,
                        isVirtual: false
                    };
                }
            } else {
                // New accounts must go through /api/register so credentials are validated and hashed.
            }
        });
    }

    // 2. Friends - backwards compatibility for manual virtual friends if any
    const mergedFriends = [...serverState.friends];
    if (localState.friends && Array.isArray(localState.friends)) {
        localState.friends.forEach(f => {
            const index = mergedFriends.findIndex(sf => 
                (sf.name && f.name && sf.name.toLowerCase() === f.name.toLowerCase())
            );
            if (index < 0) {
                mergedFriends.push(f);
            }
        });
    }

    const mergedStudioLogos = {
        ...(serverState.studioLogos && typeof serverState.studioLogos === 'object' ? serverState.studioLogos : {})
    };
    if (localState.studioLogos && typeof localState.studioLogos === 'object' && !Array.isArray(localState.studioLogos)) {
        Object.entries(localState.studioLogos).forEach(([studioName, logoUrl]) => {
            if (studioName && logoUrl) {
                mergedStudioLogos[studioName] = logoUrl;
            }
        });
    }

    // 3. Merge animes ratings and comments
    // IDs legados/stub que não devem existir no servidor (dados de teste)
    const BOGUS_IDS = new Set(['steins-gate', 'sample-anime', 'sample-anime-test', 'sample-anime-special-sync']);
    function isBogusAnime(a) {
        if (!a || !a.id) return true;
        if (BOGUS_IDS.has(a.id)) return true;
        if (a.id.includes('debug')) return true;
        if (a.id.startsWith('sample-anime')) return true;
        if (a.id.includes('-test-')) return true;
        if (a.id.startsWith('test-')) return true;
        return false;
    }
    const mergedAnimes = [...serverState.animes].filter(a => !isBogusAnime(a));
    if (localState.animes && Array.isArray(localState.animes)) {
        const cleanLocalAnimes = localState.animes.filter(a => !isBogusAnime(a));
        cleanLocalAnimes.forEach(localAnime => {
            if (localAnime && localAnime.studio && localAnime.studioLogoUrl) {
                mergedStudioLogos[localAnime.studio] = localAnime.studioLogoUrl;
            }
            let serverAnime = mergedAnimes.find(sa => sa.id === localAnime.id);
            if (!serverAnime) {
                serverAnime = { ...localAnime };
                mergedAnimes.push(serverAnime);
                
                // Activity: added new anime to catalog
                // Only credit the logged-in user if they actually have ratings on this anime
                // (otherwise it might be an anime added by another user that we're just syncing)
                if (loggedInUser) {
                    const loggedInId = loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const hasOwnRating = localAnime.ratings && localAnime.ratings[loggedInId];
                    const hasOwnComment = (localAnime.comments || []).some(c => 
                        c.friendId && c.friendId.toLowerCase() === loggedInId
                    );
                    // Only create catalog activity if the user has own ratings or is the first to add it
                    // Check if another user already has ratings on this anime
                    const hasOtherUserRating = localAnime.ratings && Object.keys(localAnime.ratings).some(k => k !== loggedInId);
                    if (hasOwnRating || (!hasOtherUserRating && !hasOwnComment)) {
                        mergedActivities.push({
                            id: generateActivityId(),
                            username: authorUser.username,
                            userColor: authorUser.color,
                            userAvatar: authorUser.avatar,
                            type: 'catalog',
                            animeId: localAnime.id,
                            animeTitle: localAnime.title,
                            details: 'adicionou esta obra ao catálogo 🆕',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } else {
                // Populate/Update metadata fields from localAnime if missing or rich
                serverAnime.title = localAnime.title || serverAnime.title;
                serverAnime.japaneseTitle = localAnime.japaneseTitle || serverAnime.japaneseTitle;
                serverAnime.synopsis = localAnime.synopsis || serverAnime.synopsis;
                serverAnime.coverUrl = localAnime.coverUrl || serverAnime.coverUrl;
                serverAnime.studioLogoUrl = localAnime.studioLogoUrl || serverAnime.studioLogoUrl;
                serverAnime.genres = localAnime.genres || serverAnime.genres;
                serverAnime.studio = localAnime.studio || serverAnime.studio;
                serverAnime.season = localAnime.season || serverAnime.season;
                serverAnime.episodes = localAnime.episodes || serverAnime.episodes;

                // Merge ratings map
                if (localAnime.ratings) {
                    if (!serverAnime.ratings) serverAnime.ratings = {};
                    
                    if (loggedInUser) {
                        // Secure: only allow updating ratings for the logged-in user's own ID
                        const loggedInId = loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const localRating = localAnime.ratings[loggedInId];
                        const serverRating = serverAnime.ratings[loggedInId];
                        
                        if (localRating) {
                            // Skip phantom ratings: overall=0 with no episode scores and default status
                            // These are auto-created by initFriendRatingIfMissing and should not persist
                            const hasRealOverall = localRating.overall && parseFloat(localRating.overall) > 0;
                            const hasEpisodeRatings = localRating.episodeRatings && Object.keys(localRating.episodeRatings).length > 0;
                            const hasRealStatus = localRating.status && localRating.status !== 'Plan to Watch';
                            const isRealRating = hasRealOverall || hasEpisodeRatings || hasRealStatus;
                            
                            if (!isRealRating) {
                                // Do not persist empty/default ratings — skip this anime for this user
                            } else {
                            // Check if status changed
                            if (localRating.status && (!serverRating || serverRating.status !== localRating.status)) {
                                const statusPhrases = {
                                    'Watching': 'começou a assistir 📺',
                                    'Completed': 'concluiu a obra! 🏆',
                                    'On Hold': 'colocou em espera ⏸️',
                                    'Dropped': 'abandonou a obra 😭',
                                    'Plan to Watch': 'adicionou à lista de interesse 📌'
                                };
                                const statusText = statusPhrases[localRating.status] || `marcou como ${localRating.status}`;
                                mergedActivities.push({
                                    id: generateActivityId(),
                                    username: authorUser.username,
                                    userColor: authorUser.color,
                                    userAvatar: authorUser.avatar,
                                    type: 'status',
                                    animeId: localAnime.id,
                                    animeTitle: localAnime.title,
                                    details: statusText,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            
                            // Check if overall score changed
                            if (localRating.overall !== undefined && (!serverRating || serverRating.overall !== localRating.overall)) {
                                if (localRating.overall !== '-' && parseFloat(localRating.overall) > 0) {
                                    mergedActivities.push({
                                        id: generateActivityId(),
                                        username: authorUser.username,
                                        userColor: authorUser.color,
                                        userAvatar: authorUser.avatar,
                                        type: 'rating',
                                        animeId: localAnime.id,
                                        animeTitle: localAnime.title,
                                        details: `avaliou esta obra com nota ${localRating.overall} ⭐`,
                                        timestamp: new Date().toISOString()
                                    });
                                }
                            }
                            
                            // Check if episodes progress changed
                            const prevWatched = serverRating ? (serverRating.episodesWatched || 0) : 0;
                            const nextWatched = localRating.episodesWatched || 0;
                            if (nextWatched > prevWatched && nextWatched !== parseInt(localAnime.episodes)) {
                                mergedActivities.push({
                                    id: generateActivityId(),
                                    username: authorUser.username,
                                    userColor: authorUser.color,
                                    userAvatar: authorUser.avatar,
                                    type: 'progress',
                                    animeId: localAnime.id,
                                    animeTitle: localAnime.title,
                                    details: `assistiu ao episódio ${nextWatched} 🍿`,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            
                            serverAnime.ratings[loggedInId] = {
                                ...serverAnime.ratings[loggedInId],
                                ...localRating
                            };
                            } // end isRealRating
                        }
                    } else {
                        // Fallback (initial setup / migration)
                        Object.keys(localAnime.ratings).forEach(friendId => {
                            serverAnime.ratings[friendId] = {
                                ...serverAnime.ratings[friendId],
                                ...localAnime.ratings[friendId]
                            };
                        });
                    }
                }
                
                // Merge comments array by comment id, handling deletion and editing securely
                if (!serverAnime.comments) serverAnime.comments = [];
                
                if (loggedInUser) {
                    const loggedInId = loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    // 1. Identify which comments of the loggedInUser were deleted by the client
                    const localCommentIds = new Set((localAnime.comments || []).map(lc => lc.id));
                    serverAnime.comments = serverAnime.comments.filter(sc => {
                        const isAuthor = sc.friendId && sc.friendId.toLowerCase() === loggedInId;
                        if (isAuthor) {
                            const keep = localCommentIds.has(sc.id);
                            if (!keep) {
                                mergedActivities.push({
                                    id: generateActivityId(),
                                    username: authorUser.username,
                                    userColor: authorUser.color,
                                    userAvatar: authorUser.avatar,
                                    type: 'comment_delete',
                                    animeId: localAnime.id,
                                    animeTitle: localAnime.title,
                                    details: 'removeu sua crítica 🗑️',
                                    timestamp: new Date().toISOString()
                                });
                            }
                            return keep;
                        }
                        return true; // keep other users' comments
                    });

                    // 2. Add or update comments from the client
                    if (localAnime.comments && Array.isArray(localAnime.comments)) {
                        localAnime.comments.forEach(lc => {
                            const isAuthor = lc.friendId && lc.friendId.toLowerCase() === loggedInId;
                            const index = serverAnime.comments.findIndex(sc => sc.id === lc.id);

                            if (isAuthor) {
                                if (index >= 0) {
                                    const prevText = serverAnime.comments[index].comment;
                                    if (prevText !== lc.comment) {
                                        mergedActivities.push({
                                            id: generateActivityId(),
                                            username: authorUser.username,
                                            userColor: authorUser.color,
                                            userAvatar: authorUser.avatar,
                                            type: 'comment_edit',
                                            animeId: localAnime.id,
                                            animeTitle: localAnime.title,
                                            details: 'editou sua crítica ✏️',
                                            timestamp: new Date().toISOString()
                                        });
                                    }
                                    // Merge replies: union by reply id so no reply is ever lost
                                    const serverReplies = serverAnime.comments[index].replies || [];
                                    const localReplies = lc.replies || [];
                                    const repliesMap = {};
                                    serverReplies.forEach(r => { if (r && r.id) repliesMap[r.id] = r; });
                                    localReplies.forEach(r => { if (r && r.id) repliesMap[r.id] = r; });
                                    const mergedReplies = Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                                    serverAnime.comments[index] = {
                                        ...serverAnime.comments[index],
                                        ...lc,
                                        likes: mergeCommentLikes(serverAnime.comments[index].likes, lc.likes, loggedInId),
                                        replies: mergedReplies
                                    };
                                } else {
                                    mergedActivities.push({
                                        id: generateActivityId(),
                                        username: authorUser.username,
                                        userColor: authorUser.color,
                                        userAvatar: authorUser.avatar,
                                        type: 'comment_add',
                                        animeId: localAnime.id,
                                        animeTitle: localAnime.title,
                                        details: 'escreveu uma nova crítica 💬',
                                        timestamp: new Date().toISOString()
                                    });
                                    // Ensure replies array exists on new comment
                                    serverAnime.comments.push({ ...lc, likes: lc.likes || [], replies: lc.replies || [] });
                                }
                            } else if (index >= 0) {
                                // Not the comment author, but may have added a reply.
                                // Merge ONLY the replies array — never overwrite the comment text.
                                const serverReplies = serverAnime.comments[index].replies || [];
                                const localReplies = lc.replies || [];
                                const repliesMap = {};
                                serverReplies.forEach(r => { if (r && r.id) repliesMap[r.id] = r; });
                                // Only accept replies authored by the logged-in user
                                localReplies.forEach(r => {
                                    if (r && r.id) {
                                        if (r.friendId && r.friendId.toLowerCase() === loggedInId) {
                                            repliesMap[r.id] = r; // accept new reply from this user
                                        } else if (!repliesMap[r.id]) {
                                            repliesMap[r.id] = r; // keep existing replies from others
                                        }
                                    }
                                });
                                const mergedReplies = Object.values(repliesMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                                serverAnime.comments[index] = {
                                    ...serverAnime.comments[index],
                                    likes: mergeCommentLikes(serverAnime.comments[index].likes, lc.likes, loggedInId),
                                    replies: mergedReplies
                                };
                            }
                        });
                    }
                } else {
                    // Fallback sync (without loggedInUser)
                    if (localAnime.comments && Array.isArray(localAnime.comments)) {
                        localAnime.comments.forEach(lc => {
                            const index = serverAnime.comments.findIndex(sc => sc.id === lc.id);
                            if (index >= 0) {
                                serverAnime.comments[index] = { ...serverAnime.comments[index], ...lc };
                            } else {
                                serverAnime.comments.push(lc);
                            }
                        });
                    }
                }

                serverAnime.comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
        });
    }

    // Merge featuredAnimeId (client updates win if defined, otherwise preserve server)
    let featuredAnimeId = serverState.featuredAnimeId || null;
    if (localState.featuredAnimeId !== undefined) {
        featuredAnimeId = localState.featuredAnimeId;
    }

    // Limit activities to 50 items (newest first)
    mergedActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const finalActivities = mergedActivities.slice(0, 50);

    return {
        friends: mergedFriends,
        animes: mergedAnimes,
        studioLogos: mergedStudioLogos,
        registeredUsers: mergedUsers,
        featuredAnimeId: featuredAnimeId,
        activities: finalActivities
    };
}

const server = http.createServer((req, res) => {
    // CORS configuration for cross-origin requests (Netlify frontend -> Render backend)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    if (req.url === '/api/health' && req.method === 'GET') {
        if (!DATABASE_URL) {
            sendJson(res, 200, { ok: true, storage: 'file' });
            return;
        }
        ensurePostgresState()
            .then(() => queryPostgres('SELECT 1'))
            .then(() => sendJson(res, 200, { ok: true, storage: 'postgres' }))
            .catch(err => {
                console.error(`Health check failed. ${formatPostgresError(err)}`);
                sendJson(res, 503, {
                    ok: false,
                    storage: 'postgres',
                    error: 'storage_unavailable',
                    reason: classifyPostgresError(err)
                });
            });
        return;
    }

    // API Route: patch current user profile fields
    if (req.url === '/api/patch-user' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { username, fields } = JSON.parse(body);
                if (!username || !fields) {
                    sendJson(res, 400, { error: 'Missing username or fields' }); return;
                }
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [], activities: [] };
                    if (!err && data) { try { state = JSON.parse(data); } catch(e) {} }
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (authUser.username.toLowerCase() !== username.toLowerCase() && !isAdminUser(authUser)) {
                        sendJson(res, 403, { error: 'Você só pode alterar o próprio perfil.' });
                        return;
                    }
                    const idx = state.registeredUsers.findIndex(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
                    if (idx < 0) { sendJson(res, 404, { error: 'User not found' }); return; }
                    const allowedFields = ['email', 'color', 'avatar', 'emailVerified', 'favoriteGenres', 'favoriteStudios', 'favoriteAnimes', 'activeTitle', 'featuredAnimeId'];
                    const safeFields = {};
                    allowedFields.forEach(field => {
                        if (Object.prototype.hasOwnProperty.call(fields, field)) safeFields[field] = fields[field];
                    });
                    Object.assign(state.registeredUsers[idx], safeFields);
                    // If field is explicitly null, delete it
                    Object.keys(safeFields).forEach(k => { if (safeFields[k] === null) delete state.registeredUsers[idx][k]; });
                    writeState(state, (writeErr) => {
                        if (writeErr) { sendJson(res, 500, { error: 'Failed to save' }); return; }
                        sendJson(res, 200, {
                            success: true,
                            user: sanitizeUser(state.registeredUsers[idx], authUser.username),
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                        });
                    });
                });
            } catch(e) { sendJson(res, 400, { error: 'Invalid JSON' }); }
        });
        return;
    }


    // API Route: Get state
    if (req.url === '/api/get-state' && req.method === 'GET') {
        readState((err, data) => {
            if (err) {
                sendJson(res, 500, { error: 'Failed to read state' });
                return;
            }
            let state = { friends: [], animes: [], registeredUsers: [], activities: [] };
            try { state = JSON.parse(data); } catch(e) {}
            const authUser = getAuthenticatedUser(req, state);
            sendJson(res, 200, sanitizeState(state, authUser ? authUser.username : ''));
        });
        return;
    }

    // API Route: Login with server-side password verification
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { email, identifier, password } = JSON.parse(body);
                const loginIdentifier = identifier || email;
                if (!loginIdentifier || !password) {
                    sendJson(res, 400, { error: 'E-mail ou usuario e senha sao obrigatorios.' });
                    return;
                }
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [], activities: [] };
                    if (!err && data) { try { state = JSON.parse(data); } catch(e) {} }
                    if (!state.registeredUsers) state.registeredUsers = [];

                    const user = findRegisteredUserByIdentifier(state, loginIdentifier);

                    if (!user || !verifyPassword(user, password)) {
                        sendJson(res, 401, { error: 'E-mail ou senha incorretos.' });
                        return;
                    }

                    let migrated = false;
                    if (!user.passwordHash || user.password) {
                        setPassword(user, password);
                        migrated = true;
                    }

                    const finishLogin = () => {
                        const token = createSession(user.username);
                        sendJson(res, 200, {
                            success: true,
                            token,
                            user: sanitizeUser(user, user.username),
                            state: sanitizeState(state, user.username)
                        });
                    };

                    if (migrated) {
                        writeState(state, (writeErr) => {
                            if (writeErr) {
                                sendJson(res, 500, { error: 'Falha ao atualizar credenciais.' });
                                return;
                            }
                            finishLogin();
                        });
                    } else {
                        finishLogin();
                    }
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Register new user (dedicated - always persists immediately)
    if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newUser = JSON.parse(body);
                if (!newUser.username || !newUser.email || !newUser.password) {
                    sendJson(res, 400, { error: 'username, email and password required' });
                    return;
                }
                if (String(newUser.password).length < 4) {
                    sendJson(res, 400, { error: 'A senha deve ter pelo menos 4 caracteres.' });
                    return;
                }
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [], activities: [] };
                    if (!err && data) { try { state = JSON.parse(data); } catch(e) {} }
                    if (!state.registeredUsers) state.registeredUsers = [];


                    const existingIdx = state.registeredUsers.findIndex(u =>
                        (u.username && u.username.toLowerCase() === newUser.username.toLowerCase()) ||
                        (u.email && u.email.toLowerCase() === newUser.email.toLowerCase())
                    );
                    if (existingIdx >= 0) {
                        sendJson(res, 409, { error: 'Nome de usuário ou e-mail já cadastrado.' });
                        return;
                    }

                    const nextMemberNumber = state.registeredUsers.filter(u => u.memberNumber).length + 1;
                    const memberDescs = {
                        1: "Você é o 1º membro a fazer parte do AniVoid. Seu nome está gravado na história desta comunidade.",
                        2: "Você é o 2º membro a fazer parte do AniVoid. Um dos primeiros a descobrir este portal.",
                        3: "Você é o 3º membro a fazer parte do AniVoid. Bem-vindo ao grupo fundador.",
                        4: "Você é o 4º membro a fazer parte do AniVoid. Parte dos primeiros a entrar neste universo.",
                        5: "Você é o 5º membro a fazer parte do AniVoid. Chegou cedo e faz parte da história.",
                        6: "Você é o 6º membro a fazer parte do AniVoid. Um dos pioneiros desta comunidade.",
                        7: "Você é o 7º membro a fazer parte do AniVoid. Bem-vindo ao começo de algo grande.",
                        8: "Você é o 8º membro a fazer parte do AniVoid. Sua presença marca esta jornada.",
                        9: "Você é o 9º membro a fazer parte do AniVoid. Faz parte dos que chegaram primeiro.",
                        10: "Você é o 10º membro a fazer parte do AniVoid. Um marco especial nesta comunidade.",
                    };
                    const memberDesc = memberDescs[nextMemberNumber] || `Você é o ${nextMemberNumber}º membro a fazer parte do AniVoid. Bem-vindo a esta comunidade.`;
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
                        memberDesc: memberDesc,
                        isVirtual: false
                    };
                    setPassword(userToAdd, newUser.password);
                    state.registeredUsers.push(userToAdd);
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save user' });
                            return;
                        }
                        const token = createSession(userToAdd.username);
                        sendJson(res, 200, {
                            success: true,
                            token,
                            user: sanitizeUser(userToAdd, userToAdd.username),
                            state: sanitizeState(state, userToAdd.username)
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Sync state
    if (req.url === '/api/sync-state' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const localState = payload.localState || payload;

                readState((err, data) => {
                    let serverState = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { serverState = JSON.parse(data); } catch(e) {}
                    }
                    const authUser = requireAuthenticatedUser(req, res, serverState);
                    if (!authUser) return;
                    const loggedInUser = authUser.username;
                    const newState = mergeStates(localState, serverState, loggedInUser);
                    writeState(newState, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to write state' });
                            return;
                        }
                        sendJson(res, 200, sanitizeState(newState, loggedInUser));
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON body' });
            }
        });
        return;
    }

    // API Route: Clear specific anime ratings for a user (admin cleanup)
    if (req.url === '/api/clear-user-ratings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { username, animeIds } = JSON.parse(body);
                if (!username || !Array.isArray(animeIds)) {
                    sendJson(res, 400, { error: 'Missing username or animeIds' });
                    return;
                }
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) { try { state = JSON.parse(data); } catch(e) {} }
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (authUser.username.toLowerCase() !== username.toLowerCase() && !isAdminUser(authUser)) {
                        sendJson(res, 403, { error: 'Você só pode limpar as próprias avaliações.' });
                        return;
                    }
                    const userId = username.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let cleared = 0;
                    state.animes.forEach(anime => {
                        if (animeIds.includes(anime.id) && anime.ratings && anime.ratings[userId]) {
                            delete anime.ratings[userId];
                            cleared++;
                        }
                    });
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save' });
                            return;
                        }
                        sendJson(res, 200, { success: true, cleared });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Send friend request
    if (req.url === '/api/send-friend-request' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { to } = JSON.parse(body);
                if (!to) {
                    sendJson(res, 400, { error: 'Missing target username' });
                    return;
                }
                
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const from = authUser.username;
                    const fromUser = findRegisteredUser(state, from);
                    const toUser = findRegisteredUser(state, to);
                    
                    if (!fromUser || !toUser) {
                        sendJson(res, 404, { error: 'Usuário não encontrado' });
                        return;
                    }
                    
                    if (sameUsername(from, to)) {
                        sendJson(res, 400, { error: 'Não é possível adicionar a si mesmo' });
                        return;
                    }
                    
                    const fromId = usernameKey(from);
                    const toId = usernameKey(to);
                    if (!fromUser.friends) fromUser.friends = [];
                    if (hasFriend(fromUser, toUser.username) || hasFriend(toUser, fromUser.username)) {
                        ensureMutualFriendship(fromUser, toUser);
                        writeState(state, (writeErr) => {
                            if (writeErr) {
                                sendJson(res, 500, { error: 'Failed to repair friendship' });
                                return;
                            }
                            sendJson(res, 200, {
                                success: true,
                                alreadyFriends: true,
                                registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                            });
                        });
                        return;
                    }

                    if (Array.isArray(fromUser.friendRequests) && fromUser.friendRequests.some(r => r && usernameKey(r.from) === toId)) {
                        ensureMutualFriendship(fromUser, toUser);
                        writeState(state, (writeErr) => {
                            if (writeErr) {
                                sendJson(res, 500, { error: 'Failed to accept request' });
                                return;
                            }
                            sendJson(res, 200, {
                                success: true,
                                accepted: true,
                                registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                            });
                        });
                        return;
                    }
                    
                    if (!toUser.friendRequests) toUser.friendRequests = [];
                    if (!toUser.friendRequests.some(r => r && usernameKey(r.from) === fromId)) {
                        toUser.friendRequests.push({
                            from: fromUser.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save request' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Respond to friend request
    if (req.url === '/api/respond-friend-request' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { target, action } = JSON.parse(body);
                if (!target || !action) {
                    sendJson(res, 400, { error: 'Missing parameters' });
                    return;
                }
                if (!['accept', 'reject', 'decline'].includes(action)) {
                    sendJson(res, 400, { error: 'Ação inválida' });
                    return;
                }
                
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const username = authUser.username;
                    const user = findRegisteredUser(state, username);
                    const targetUser = findRegisteredUser(state, target);
                    
                    if (!user || !targetUser) {
                        sendJson(res, 404, { error: 'User not found' });
                        return;
                    }
                    
                    removeFriendRequestsBetween(user, targetUser);
                    
                    if (action === 'accept') {
                        ensureMutualFriendship(user, targetUser);
                    }
                    
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save request response' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Admin repair/confirm friendship
    if (req.url === '/api/admin/set-friendship' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { username, target } = JSON.parse(body);
                if (!target) {
                    sendJson(res, 400, { error: 'Missing target username' });
                    return;
                }

                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }

                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (!isAdminUser(authUser)) {
                        sendJson(res, 403, { error: 'Admin only' });
                        return;
                    }

                    const sourceUser = findRegisteredUser(state, username || authUser.username);
                    const targetUser = findRegisteredUser(state, target);
                    if (!sourceUser || !targetUser) {
                        sendJson(res, 404, { error: 'User not found' });
                        return;
                    }
                    if (sameUsername(sourceUser.username, targetUser.username)) {
                        sendJson(res, 400, { error: 'Cannot friend self' });
                        return;
                    }

                    ensureMutualFriendship(sourceUser, targetUser);
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save friendship' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // API Route: Remove friend
    if (req.url === '/api/remove-friend' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { target } = JSON.parse(body);
                if (!target) {
                    sendJson(res, 400, { error: 'Missing parameters' });
                    return;
                }
                
                readState((err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const username = authUser.username;
                    const user = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
                    const targetUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === target.toLowerCase());
                    
                    if (user) {
                        if (user.friends) {
                            user.friends = user.friends.filter(f => f.toLowerCase() !== target.toLowerCase());
                        }
                    }
                    if (targetUser) {
                        if (targetUser.friends) {
                            targetUser.friends = targetUser.friends.filter(f => f.toLowerCase() !== username.toLowerCase());
                        }
                    }
                    
                    writeState(state, (writeErr) => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to remove friend' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    // Static files serving
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const rootDir = path.resolve(__dirname);
    const filePath = path.resolve(rootDir, pathname === '/' ? 'index.html' : `.${pathname}`);
    
    if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Forbidden');
        return;
    }

    const relativePath = path.relative(rootDir, filePath);
    const publicRootFiles = new Set(['index.html', 'app.js', 'styles.css', 'favicon.png', 'logo.png']);
    const publicImageExtensions = new Set(['.png', '.jpg', '.jpeg', '.svg']);
    const firstSegment = relativePath.split(path.sep)[0];
    const isPublicAsset =
        publicRootFiles.has(relativePath) ||
        ((firstSegment === 'covers' || firstSegment === 'logos') &&
            publicImageExtensions.has(path.extname(relativePath).toLowerCase()));

    if (!isPublicAsset) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('404 Not Found');
        return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.stat(filePath, (statErr, stat) => {
        if (statErr) {
            if (statErr.code === 'ENOENT') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('404 Not Found');
            } else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Internal Server Error: ' + statErr.code);
            }
            return;
        }

        if (!stat.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('404 Not Found');
            return;
        }

        const etag = createStaticEtag(stat);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', getStaticCacheControl(relativePath));
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', stat.mtime.toUTCString());
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (requestHasFreshStaticCache(req, stat, etag)) {
            res.statusCode = 304;
            res.end();
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end('404 Not Found');
                } else {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end('Internal Server Error: ' + err.code);
                }
            } else {
                res.statusCode = 200;
                res.end(data);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
