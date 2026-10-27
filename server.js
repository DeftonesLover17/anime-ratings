require('dotenv').config();
const http = require('http');
const { mergeClientState, snapshotError } = require('./shared/sync-state');
const { parseStoredState } = require('./shared/state-integrity');
const studioMetadata = require('./shared/studio-metadata');
const { normalizeAnimeIdentity } = require('./shared/catalog-identity');
const { standardStudioName } = studioMetadata;
const identity = require('./shared/security/identity');
const { textValue, escapeHtml, sanitizeColor, sanitizeTextArray } = require('./shared/security/text-sanitizers');
const security = require('./shared/security/policy');
const responseTools = require('./shared/security/responses');
const { classifyPublicPath } = require('./shared/security/public-paths');
const { createNodeSessions } = require('./backend/node/sessions');
const { createAccountRoutes } = require('./backend/node/account-routes');
const { createFileRecoveryStore } = require('./backend/node/recovery-store');
const normalizeUsername = identity.legacyId;
let stateWriteQueue = Promise.resolve();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, 'state.json');
const DATABASE_URL = process.env.DATABASE_URL || '';
const PASSWORD_ITERATIONS = parseInt(process.env.PASSWORD_ITERATIONS, 10) || 500000;
const PASSWORD_KEY_LENGTH = 32;

const passwordPolicyError = security.passwordPolicyError;
const MAX_EXTERNAL_IMAGE_URL_LENGTH = 4096;
const MAX_DATA_IMAGE_LENGTH = 2 * 1024 * 1024;
const DEFAULT_ALLOWED_ORIGIN = 'https://anime-ratings.pages.dev';
const sessionStore = createNodeSessions();
const { API_LIMITS, createMemoryLimiter } = require('./shared/security/rate-limits');
const rateLimits = createMemoryLimiter();
const requestLimits = new WeakMap();
let contentSecurityPolicy;
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

function sanitizeImageUrl(url) {
    const value = textValue(url).trim();
    if (!value) return '';

    if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) {
        const compactValue = value.replace(/\s+/g, '');
        if (compactValue.length <= MAX_DATA_IMAGE_LENGTH && isCompleteDataImage(compactValue)) {
            return compactValue;
        }
        return '';
    }

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
    const value = textValue(avatar).trim();
    const safeImage = sanitizeImageUrl(value);
    if (safeImage) return safeImage;
    if (!value || /^data:/i.test(value) || /^https?:\/\//i.test(value) || value.length > 16) return '👤';
    return escapeHtml(value, 16);
}


function sanitizeUserRecord(user) {
    if (!user || typeof user !== 'object') return user;
    return {
        ...user,
        username: escapeHtml(user.username || '', 40),
        email: escapeHtml(String(user.email || '').trim(), 254),
        color: sanitizeColor(user.color),
        avatar: sanitizeAvatar(user.avatar),
        banner: security.encodeCssUrl(sanitizeImageUrl(user.banner)),
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
        safeRatings[escapeHtml(friendId, 80)] = {
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
        studio: escapeHtml(standardStudioName(studioMetadata.studioForAnime(anime)), 120),
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

function sendJson(res, statusCode, payload) {
    if(res.writableEnded) return;
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
    return responseTools.browserUserResponse(user, viewerUsername);
}

function sanitizeState(state, viewerUsername = '') {
    return responseTools.stateResponse(sanitizeStateForStorage(state), viewerUsername);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('base64'), iterations = PASSWORD_ITERATIONS) {
    const passwordHash = crypto
        .pbkdf2Sync(String(password || ''), Buffer.from(salt, 'base64'), iterations, PASSWORD_KEY_LENGTH, 'sha256')
        .toString('base64');
    return {
        passwordHash,
        passwordSalt: salt,
        passwordIterations: iterations,
        passwordDigest: 'pbkdf2-sha256',
        passwordSaltEncoding: 'base64'
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
        const iterations = Number(user.passwordIterations) || PASSWORD_ITERATIONS;
        if (!Number.isSafeInteger(iterations) || iterations < 1) return false;
        const encodings = user.passwordSaltEncoding ? [user.passwordSaltEncoding] : ['utf8', 'base64'];
        try {
            for (const encoding of encodings) {
                if (!['utf8', 'base64'].includes(encoding)) return false;
                const salt = encoding === 'base64' ? Buffer.from(user.passwordSalt, 'base64') : user.passwordSalt;
                const candidate = crypto.pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, 'sha256').toString('base64');
                if (timingSafeCompare(candidate, user.passwordHash)) return true;
            }
        } catch { return false; }
        return false;
    }
    return typeof user.password === 'string' && user.password === password;
}

function setPassword(user, password) {
    Object.assign(user, hashPassword(password));
    user.credentialVersion = (Number(user.credentialVersion) || 0) + 1;
    user.passwordResetRequired = false;
    delete user.password;
}

const createSession = (user, res) => sessionStore.create(user, res);
const getAuthenticatedUser = (req, state) => sessionStore.authenticate(req, state);
function requireAuthenticatedUser(req, res, state) {
    const user = getAuthenticatedUser(req, state);
    if (!user) { sendJson(res, 401, {error: 'Sessão inválida ou expirada. Faça login novamente.'}); return null; }
    if (req.method === 'POST' && enforceRateLimit(req, res, 'account', API_LIMITS.account.max, API_LIMITS.account.windowMs, user.accountId || user.username)) return null;
    return user;
}
function isAdminUser(user, state) { return identity.isAdmin(user, process.env, state); }

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

function usernameKey(username) {
    return String(username || '').trim().toLowerCase();
}

function sameUsername(a, b) {
    return usernameKey(a) === usernameKey(b);
}

function findRegisteredUser(state, username) {
    return (state.registeredUsers || []).find(user => user && user.username && sameUsername(user.username, username));
}

function findRegisteredUserByIdentifier(state, identifier) { return identity.findLoginUser(state, identifier); }

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
                initialState = parseStoredState(fs.readFileSync(STATE_FILE, 'utf8'));
            } catch (err) {
                throw new Error('Cannot initialize Postgres from an invalid state file', { cause: err });
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
            if (!result.rows[0]) throw new Error('Main state row is missing');
            callback(null, JSON.stringify(result.rows[0].state));
        })
        .catch(err => {
            console.error(`Failed to read state from Postgres. ${formatPostgresError(err)}`);
            callback(err);
        });
}

function readParsedState(res, callback) {
    readState((error, data) => {
        if (error || !data) { sendJson(res, 500, { error: 'Failed to read state' }); return; }
        let state;
        try {
            state = parseStoredState(data);
        } catch {
            sendJson(res, 500, { error: 'Invalid stored state' });
            return;
        }
        callback(state);
    });
}

function writeState(state, callback) {
    const operation = stateWriteQueue.then(async () => {
        const revision = Number(state.revision) || 0;
        normalizeSocialGraph(state);
        identity.assignAccountIds(state, () => crypto.randomUUID());
        const safeState = sanitizeStateForStorage(state);
        safeState.revision = revision + 1;
        const conflict = () => Object.assign(new Error('State changed; retry the operation.'), { code: 'STATE_CONFLICT' });
        if (DATABASE_URL) {
            await ensurePostgresState();
            const result = await queryPostgres(
                "UPDATE app_state SET state = $1::jsonb, updated_at = now() WHERE id = 'main' AND COALESCE((state->>'revision')::bigint, 0) = $2",
                [JSON.stringify(safeState), revision]
            );
            if (result.rowCount !== 1) throw conflict();
        } else {
            const current = await new Promise((resolve, reject) => fs.readFile(STATE_FILE, 'utf8', (error, text) => {
                if (error) { reject(error); return; }
                try { resolve(parseStoredState(text)); } catch (parseError) { reject(parseError); }
            }));
            if ((Number(current.revision) || 0) !== revision) throw conflict();
            const tempFile = STATE_FILE + '.' + crypto.randomUUID() + '.tmp';
            await new Promise((resolve, reject) => fs.writeFile(tempFile, JSON.stringify(safeState, null, 2), 'utf8', error => error ? reject(error) : resolve()));
            await new Promise((resolve, reject) => fs.rename(tempFile, STATE_FILE, error => error ? reject(error) : resolve()));
        }
        state.revision = safeState.revision;
    });
    stateWriteQueue = operation.catch(() => {});
    operation.then(() => callback(null), callback);
}

function getSafeCorsHeaders(req) {
    const rawAllowed = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
    const allowedList = rawAllowed
        .split(',')
        .map(origin => origin.trim().toLowerCase())
        .filter(Boolean);

    const requestOrigin = String(req?.headers?.origin || '').trim();
    let selectedOrigin = DEFAULT_ALLOWED_ORIGIN;

    if (requestOrigin) {
        const lowerOrigin = requestOrigin.toLowerCase();
        if (allowedList.includes(lowerOrigin) || allowedList.includes('*')) {
            selectedOrigin = requestOrigin;
        }
    }

    return {
        origin: selectedOrigin,
        methods: 'GET, POST, OPTIONS',
        headers: 'X-Requested-With,Content-Type,Authorization'
    };
}

function getClientIp(req) {
    return String(process.env.TRUST_PROXY === 'true' ? req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress : req.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function enforceRateLimit(req, res, bucket, maxAttempts, windowMs, discriminator = '') {
    const key = ((bucket === 'account' || bucket === 'recovery-account') ? [bucket, discriminator] : [bucket, getClientIp(req), normalizeUsername(discriminator).slice(0, 80)]).filter(Boolean).join(':');
    let accepted = requestLimits.get(req);
    if (!accepted) { accepted = new Set(); requestLimits.set(req, accepted); }
    if (accepted.has(key)) return false;
    const result = rateLimits.consume(key, maxAttempts, windowMs);
    if (!result.allowed) {
        if (res) {
            res.setHeader('Retry-After', String(result.retryAfter));
            sendJson(res, 429, { error: 'Muitas requisições. Aguarde e tente novamente.', code: 'RATE_LIMITED' });
        }
        return true;
    }
    accepted.add(key);
    return false;
}

const recoveryStore = createFileRecoveryStore(path.join(DATA_DIR, 'password-recoveries.json'));
const accountRoutes = createAccountRoutes({ recoveryStore, readState, writeState, sessionStore, verifyPassword, setPassword, sanitizeUser, sanitizeState, sendJson, enforceRateLimit });
const server = http.createServer(async (req, res) => {
    const cors = getSafeCorsHeaders(req);
    res.setHeader('Access-Control-Allow-Origin', cors.origin);
    res.setHeader('Access-Control-Allow-Methods', cors.methods);
    res.setHeader('Access-Control-Allow-Headers', cors.headers);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    // Security Headers (OWASP A05 Hardening)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
    if (contentSecurityPolicy === undefined) contentSecurityPolicy = fs.readFileSync(path.join(__dirname, '_headers'), 'utf8').match(/Content-Security-Policy: ([^\r\n]+)/)?.[1] || '';
    if (contentSecurityPolicy) res.setHeader('Content-Security-Policy', contentSecurityPolicy);

    const allowedOrigins = String(process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN + ',http://localhost:' + PORT + ',http://127.0.0.1:' + PORT).split(',').map(value => value.trim());
    const boundaryError = security.mutationPolicy({method:req.method, origin:req.headers.origin, contentType:req.headers['content-type'], fetchSite:req.headers['sec-fetch-site'], authorization:req.headers.authorization}, allowedOrigins);
    if (boundaryError) { sendJson(res, boundaryError.status, {error:boundaryError.message,code:boundaryError.code}); return; }
    if (Number(req.headers['content-length']) > security.MAX_JSON_BYTES) { sendJson(res, 413, {error:'Requisição grande demais.'}); return; }
    let bodyBytes = 0;
    req.on('data', chunk => {
        bodyBytes += chunk.length;
        if (bodyBytes > security.MAX_JSON_BYTES && !res.writableEnded) {
            req.pause(); res.once('finish', () => req.destroy()); sendJson(res, 413, {error:'Requisição grande demais.'});
        }
    });
    if (req.url.startsWith('/api/') && req.method !== 'OPTIONS') {
        const budget = req.method === 'GET' ? API_LIMITS.read : API_LIMITS.write;
        if (enforceRateLimit(req, res, 'api-burst', API_LIMITS.burst.max, API_LIMITS.burst.windowMs)) return;
        if (enforceRateLimit(req, res, req.method === 'GET' ? 'reads-ip' : 'writes-ip', budget.max, budget.windowMs)) return;
    }
    if (accountRoutes.handles(req)) { await accountRoutes(req, res); return; }

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

    if (['/api/notifications/read', '/api/notifications/clear'].includes(req.url) && req.method === 'POST') {
        readParsedState(res, state => {
            const authUser = requireAuthenticatedUser(req, res, state);
            if (!authUser) return;
            const user = findRegisteredUser(state, authUser.username);
            if (!user) { sendJson(res, 404, { error: 'User not found' }); return; }
            const notifications = Array.isArray(user.notifications) ? user.notifications : [];
            user.notifications = req.url.endsWith('/read')
                ? notifications.map(item => ({ ...item, read: true }))
                : [];
            writeState(state, writeErr => {
                if (writeErr) { sendJson(res, 500, { error: 'Failed to save notifications' }); return; }
                sendJson(res, 200, {
                    success: true,
                    notifications: sanitizeUser(user, authUser.username).notifications || []
                });
            });
        });
        return;
    }

    // API Route: Get state
    if (['/api/get-state', '/api/users'].includes(req.url) && req.method === 'GET') {
        readParsedState(res, state => {
            const authUser = getAuthenticatedUser(req, state);
            if (req.url === '/api/users') {
                sendJson(res, 200, {
                    viewerUsername: authUser ? authUser.username : '',
                    registeredUsers: (state.registeredUsers || []).map(user => sanitizeUser(user, authUser ? authUser.username : ''))
                });
                return;
            }
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
                if (typeof loginIdentifier !== 'string' || loginIdentifier.length > 254 || typeof password !== 'string' || !password || password.length > 256) {
                    sendJson(res, 400, { error: 'E-mail ou usuario e senha sao obrigatorios.' });
                    return;
                }
                if (enforceRateLimit(req, res, 'login-ip', 24, 1000 * 60 * 10) || enforceRateLimit(req, res, 'login', 8, 1000 * 60 * 10, loginIdentifier)) return;
                readParsedState(res, state => {
                    if (!state.registeredUsers) state.registeredUsers = [];

                    const user = findRegisteredUserByIdentifier(state, loginIdentifier);

                    if (!user || !verifyPassword(user, password)) {
                        sendJson(res, 401, { error: 'E-mail ou senha incorretos.' });
                        return;
                    }
                    if (user.passwordResetRequired) {
                        sendJson(res, 426, { error: 'Crie uma nova senha pessoal para continuar.', code: 'PASSWORD_RESET_REQUIRED' });
                        return;
                    }

                    let migrated = !user.accountId;
                    if (!user.accountId) identity.assignAccountIds(state, () => crypto.randomUUID());
                    if (!user.passwordHash || user.password) {
                        setPassword(user, password);
                        migrated = true;
                    }

                    const finishLogin = () => {
                        createSession(user, res);
                        sendJson(res, 200, {
                            success: true,
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
                const policyError = passwordPolicyError(newUser.password);
                if (policyError) {
                    sendJson(res, 400, { error: policyError });
                    return;
                }
                if (enforceRateLimit(req, res, 'register', 5, 1000 * 60 * 30)) return;
                readParsedState(res, state => {
                    if (!state.registeredUsers) state.registeredUsers = [];


                    const registrationError = identity.registrationError(state, newUser, process.env);
                    if (registrationError) { sendJson(res, 409, {error:registrationError}); return; }

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
                        accountId: crypto.randomUUID(),
                        username: newUser.username,
                        email: identity.emailKey(newUser.email),
                        color: newUser.color || '#FF4500',
                        avatar: newUser.avatar || '👤',
                        emailVerified: false,
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
                        createSession(userToAdd, res);
                        sendJson(res, 200, {
                            success: true,
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
        req.on('end', async () => {
            let payload;
            try { payload = JSON.parse(body); }
            catch { sendJson(res, 400, { error: 'Invalid JSON body' }); return; }
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                sendJson(res, 400, { error: 'Invalid JSON body' });
                return;
            }
            if (!payload.baseState || !Array.isArray(payload.baseState.animes)) { sendJson(res, 409, { error: 'Atualize a pagina antes de sincronizar.', code: 'CLIENT_UPDATE_REQUIRED' }); return; }
            const snapshotProblem = snapshotError(payload.baseState) || snapshotError(payload.localState || payload);
            if (snapshotProblem) { sendJson(res, 400, { error: snapshotProblem }); return; }
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const serverState = await new Promise((resolve, reject) => readState((error, text) => {
                        if (error) { reject(error); return; }
                        try { resolve(parseStoredState(text)); } catch (parseError) { reject(parseError); }
                    }));
                    const authUser = requireAuthenticatedUser(req, res, serverState);
                    if (!authUser) return;
                    if (payload.viewerUsername !== undefined && payload.viewerUsername !== authUser.username) {
                        sendJson(res, 409, { error: 'A conta desta aba mudou. Atualize a página antes de salvar.', code: 'SESSION_CHANGED' });
                        return;
                    }
                    const nextState = mergeClientState(payload.localState || payload, payload.baseState, serverState, authUser.username, isAdminUser(authUser, serverState));
                    await new Promise((resolve, reject) => writeState(nextState, error => error ? reject(error) : resolve()));
                    sendJson(res, 200, sanitizeState(nextState, authUser.username));
                    return;
                } catch (error) {
                    if (error.code !== 'STATE_CONFLICT') { console.error('State sync failed', error); sendJson(res, 500, { error: 'Failed to sync state' }); return; }
                }
            }
            sendJson(res, 409, { error: 'Os dados mudaram durante a gravacao. Tente salvar novamente.', code: 'STATE_CONFLICT' });
        });
        return;
    }

    if (req.url === '/api/admin/animes' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const input = payload && payload.anime;
                const inputError = security.catalogAnimeError(input);
                if (inputError) {
                    sendJson(res, 400, { error: inputError });
                    return;
                }
                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (!isAdminUser(authUser, state)) {
                        sendJson(res, 403, { error: 'Apenas o administrador pode alterar o catalogo.' });
                        return;
                    }

                    const requestedId = typeof input.id === 'string' ? input.id.trim() : '';
                    const existingIndex = requestedId
                        ? state.animes.findIndex(anime => anime && anime.id === requestedId)
                        : -1;
                    if (requestedId && existingIndex < 0) {
                        sendJson(res, 404, { error: 'Anime nao encontrado.' });
                        return;
                    }

                    const existingAnime = existingIndex >= 0 ? state.animes[existingIndex] : null;
                    const anime = buildCatalogAnime(input, existingAnime);
                    if (!anime.title) {
                        sendJson(res, 400, { error: 'Titulo do anime e obrigatorio.' });
                        return;
                    }
                    if (!existingAnime) {
                        const duplicate = state.animes.some(item =>
                            item && normalizeAnimeIdentity(item.title) === normalizeAnimeIdentity(anime.title)
                        );
                        if (duplicate) {
                            sendJson(res, 409, { error: 'Este anime ja existe no catalogo.' });
                            return;
                        }
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
                    writeState(state, writeErr => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to save anime' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            anime: responseTools.animeResponse(sanitizeAnimeRecord(anime)),
                            activities: (state.activities || []).map(responseTools.activityResponse)
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
        return;
    }

    if (req.url === '/api/admin/delete-anime' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const animeId = typeof payload?.animeId === 'string' ? payload.animeId.trim() : '';
                if (!animeId) {
                    sendJson(res, 400, { error: 'Anime obrigatorio.' });
                    return;
                }
                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (!isAdminUser(authUser, state)) {
                        sendJson(res, 403, { error: 'Apenas o administrador pode excluir animes.' });
                        return;
                    }
                    const animeIndex = state.animes.findIndex(anime => anime && anime.id === animeId);
                    if (animeIndex < 0) {
                        sendJson(res, 404, { error: 'Anime nao encontrado.' });
                        return;
                    }
                    state.animes.splice(animeIndex, 1);
                    if (state.featuredAnimeId === animeId) state.featuredAnimeId = null;
                    (state.registeredUsers || []).forEach(user => {
                        if (user && user.featuredAnimeId === animeId) user.featuredAnimeId = null;
                    });
                    state.activities = (state.activities || []).filter(activity => activity && activity.animeId !== animeId);
                    writeState(state, writeErr => {
                        if (writeErr) {
                            sendJson(res, 500, { error: 'Failed to delete anime' });
                            return;
                        }
                        sendJson(res, 200, {
                            success: true,
                            deletedAnimeId: animeId,
                            registeredUsers: sanitizeState(state, authUser.username).registeredUsers,
                            activities: state.activities
                        });
                    });
                });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
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
                if (!identity.validUsernameReference(username) || !Array.isArray(animeIds)) {
                    sendJson(res, 400, { error: 'Missing username or animeIds' });
                    return;
                }
                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (authUser.username.toLowerCase() !== username.toLowerCase() && !isAdminUser(authUser, state)) {
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
                if (!identity.validUsernameReference(to)) {
                    sendJson(res, 400, { error: 'Missing target username' });
                    return;
                }
                
                readParsedState(res, state => {
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
                if (!identity.validUsernameReference(target) || !action) {
                    sendJson(res, 400, { error: 'Missing parameters' });
                    return;
                }
                if (!['accept', 'reject', 'decline'].includes(action)) {
                    sendJson(res, 400, { error: 'Ação inválida' });
                    return;
                }
                
                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const username = authUser.username;
                    const user = findRegisteredUser(state, username);
                    const targetUser = findRegisteredUser(state, target);
                    
                    if (!user || !targetUser) {
                        sendJson(res, 404, { error: 'User not found' });
                        return;
                    }

                    const hasIncomingRequest = Array.isArray(user.friendRequests) &&
                        user.friendRequests.some(request => request && sameUsername(request.from, targetUser.username));
                    if (!hasIncomingRequest) {
                        sendJson(res, 409, { error: 'Convite de amizade não encontrado.', code: 'FRIEND_REQUEST_NOT_FOUND' });
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

    // API Route: Cancel an outgoing friend request
    if (req.url === '/api/cancel-friend-request' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            let target;
            try { target = JSON.parse(body)?.target; }
            catch { sendJson(res, 400, { error: 'Invalid JSON' }); return; }
            if (!identity.validUsernameReference(target)) { sendJson(res, 400, { error: 'Missing target username' }); return; }

            readParsedState(res, state => {
                const authUser = requireAuthenticatedUser(req, res, state);
                if (!authUser) return;
                const targetUser = findRegisteredUser(state, target);
                if (!targetUser) { sendJson(res, 404, { error: 'User not found' }); return; }
                if (Array.isArray(targetUser.friendRequests)) {
                    targetUser.friendRequests = targetUser.friendRequests.filter(request =>
                        request && !sameUsername(request.from, authUser.username)
                    );
                }
                writeState(state, (writeErr) => {
                    if (writeErr) { sendJson(res, 500, { error: 'Failed to cancel request' }); return; }
                    sendJson(res, 200, {
                        success: true,
                        registeredUsers: sanitizeState(state, authUser.username).registeredUsers
                    });
                });
            });
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
                if (!identity.validUsernameReference(target) || (username != null && !identity.validUsernameReference(username))) {
                    sendJson(res, 400, { error: 'Missing target username' });
                    return;
                }

                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    if (!isAdminUser(authUser, state)) {
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
                if (!identity.validUsernameReference(target)) {
                    sendJson(res, 400, { error: 'Missing parameters' });
                    return;
                }
                
                readParsedState(res, state => {
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const username = authUser.username;
                    const user = findRegisteredUser(state, username);
                    const targetUser = findRegisteredUser(state, target);
                    
                    if (user) {
                        if (user.friends) {
                            user.friends = user.friends.filter(friend => !sameUsername(friend, target));
                        }
                    }
                    if (targetUser) {
                        if (targetUser.friends) {
                            targetUser.friends = targetUser.friends.filter(friend => !sameUsername(friend, username));
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
    let requestUrl;
    try { requestUrl = new URL(req.url, 'http://localhost'); }
    catch { res.statusCode = 404; res.end('Not found'); return; }
    const publicPath = classifyPublicPath(requestUrl.pathname);
    if (!publicPath.allowed || publicPath.api) { res.statusCode = 404; res.end('Not found'); return; }
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
                res.end('Internal Server Error');
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
                    res.end('Internal Server Error');
                }
            } else {
                res.statusCode = 200;
                res.end(data);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${server.address().port}/`);
});
