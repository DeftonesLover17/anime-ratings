const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, 'state.json');
const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const sessions = new Map();

// Ensure data folder and state file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
        friends: [],
        animes: [],
        registeredUsers: []
    }, null, 2));
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

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
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
    const safeState = {
        ...state,
        registeredUsers: Array.isArray(state.registeredUsers)
            ? state.registeredUsers.map(user => sanitizeUser(user, viewerUsername))
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
                                    serverAnime.comments[index] = { ...serverAnime.comments[index], ...lc, replies: mergedReplies };
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
                                    serverAnime.comments.push({ ...lc, replies: lc.replies || [] });
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
                                serverAnime.comments[index] = { ...serverAnime.comments[index], replies: mergedReplies };
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
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
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
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
        fs.readFile(STATE_FILE, 'utf8', (err, data) => {
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
                const { email, password } = JSON.parse(body);
                if (!email || !password) {
                    sendJson(res, 400, { error: 'E-mail e senha são obrigatórios.' });
                    return;
                }
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [], activities: [] };
                    if (!err && data) { try { state = JSON.parse(data); } catch(e) {} }
                    if (!state.registeredUsers) state.registeredUsers = [];

                    const user = state.registeredUsers.find(u =>
                        u && u.email && u.email.toLowerCase() === String(email).toLowerCase()
                    );

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
                        fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
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
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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

                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let serverState = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { serverState = JSON.parse(data); } catch(e) {}
                    }
                    const authUser = requireAuthenticatedUser(req, res, serverState);
                    if (!authUser) return;
                    const loggedInUser = authUser.username;
                    const newState = mergeStates(localState, serverState, loggedInUser);
                    fs.writeFile(STATE_FILE, JSON.stringify(newState, null, 2), 'utf8', (writeErr) => {
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
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
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
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const from = authUser.username;
                    const fromUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === from.toLowerCase());
                    const toUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === to.toLowerCase());
                    
                    if (!fromUser || !toUser) {
                        sendJson(res, 404, { error: 'Usuário não encontrado' });
                        return;
                    }
                    
                    if (from.toLowerCase() === to.toLowerCase()) {
                        sendJson(res, 400, { error: 'Não é possível adicionar a si mesmo' });
                        return;
                    }
                    
                    const fromId = from.toLowerCase();
                    const toId = to.toLowerCase();
                    if (!fromUser.friends) fromUser.friends = [];
                    if (fromUser.friends.some(f => f.toLowerCase() === toId)) {
                        sendJson(res, 400, { error: 'Vocês já são amigos' });
                        return;
                    }
                    
                    if (!toUser.friendRequests) toUser.friendRequests = [];
                    if (!toUser.friendRequests.some(r => r.from.toLowerCase() === fromId)) {
                        toUser.friendRequests.push({
                            from: fromUser.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const authUser = requireAuthenticatedUser(req, res, state);
                    if (!authUser) return;
                    const username = authUser.username;
                    const user = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
                    const targetUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === target.toLowerCase());
                    
                    if (!user || !targetUser) {
                        sendJson(res, 404, { error: 'User not found' });
                        return;
                    }
                    
                    // Remove request
                    if (user.friendRequests) {
                        user.friendRequests = user.friendRequests.filter(r => r.from.toLowerCase() !== target.toLowerCase());
                    }
                    
                    if (action === 'accept') {
                        if (!user.friends) user.friends = [];
                        if (!targetUser.friends) targetUser.friends = [];
                        
                        if (!user.friends.some(f => f.toLowerCase() === target.toLowerCase())) {
                            user.friends.push(targetUser.username);
                        }
                        if (!targetUser.friends.some(f => f.toLowerCase() === username.toLowerCase())) {
                            targetUser.friends.push(user.username);
                        }
                    }
                    
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
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
                    
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
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
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('404 Not Found');
            } else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Internal Server Error: ' + err.code);
            }
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
