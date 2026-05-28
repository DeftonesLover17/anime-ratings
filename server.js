const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

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
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

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
                    mergedUsers[index] = {
                        ...mergedUsers[index], // Server state is base
                        email: u.email || mergedUsers[index].email,
                        password: u.password || mergedUsers[index].password,
                        color: u.color || mergedUsers[index].color,
                        avatar: u.avatar || mergedUsers[index].avatar,
                        emailVerified: u.emailVerified !== undefined ? u.emailVerified : mergedUsers[index].emailVerified,
                        favoriteGenres: u.favoriteGenres || mergedUsers[index].favoriteGenres,
                        favoriteStudios: u.favoriteStudios || mergedUsers[index].favoriteStudios,
                        favoriteAnimes: u.favoriteAnimes || mergedUsers[index].favoriteAnimes,
                        activeTitle: u.activeTitle || mergedUsers[index].activeTitle,
                        // Preserve per-user featuredAnimeId (client wins for their own profile)
                        featuredAnimeId: u.featuredAnimeId !== undefined ? u.featuredAnimeId : mergedUsers[index].featuredAnimeId,
                        isVirtual: false
                    };
                }
            } else {
                // New registration (not found in server database)
                mergedUsers.push(u);
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
                                if (localRating.overall !== '-') {
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

    // API Route: Get state
    if (req.url === '/api/get-state' && req.method === 'GET') {
        fs.readFile(STATE_FILE, 'utf8', (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to read state' }));
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
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
                if (!newUser.username || !newUser.email) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'username and email required' }));
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
                        // User already exists — return success without overwriting social graph
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, user: state.registeredUsers[existingIdx] }));
                        return;
                    }

                    const userToAdd = {
                        username: newUser.username,
                        email: newUser.email,
                        password: newUser.password || '',
                        color: newUser.color || '#FF4500',
                        avatar: newUser.avatar || '👤',
                        emailVerified: newUser.emailVerified !== undefined ? newUser.emailVerified : false,
                        friends: [],
                        friendRequests: [],
                        favoriteGenres: newUser.favoriteGenres || [],
                        favoriteStudios: newUser.favoriteStudios || [],
                        favoriteAnimes: newUser.favoriteAnimes || [],
                        activeTitle: newUser.activeTitle || '',
                        isVirtual: false
                    };
                    state.registeredUsers.push(userToAdd);
                    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to save user' }));
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, user: userToAdd }));
                    });
                });
            } catch(e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
                const loggedInUser = payload.loggedInUser || '';
                const localState = payload.localState || payload;

                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let serverState = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { serverState = JSON.parse(data); } catch(e) {}
                    }
                    const newState = mergeStates(localState, serverState, loggedInUser);
                    fs.writeFile(STATE_FILE, JSON.stringify(newState, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to write state' }));
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(newState));
                    });
                });
            } catch(e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
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
                const { from, to } = JSON.parse(body);
                if (!from || !to) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing from or to username' }));
                    return;
                }
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const fromUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === from.toLowerCase());
                    const toUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === to.toLowerCase());
                    
                    if (!fromUser || !toUser) {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Usuário não encontrado' }));
                        return;
                    }
                    
                    if (from.toLowerCase() === to.toLowerCase()) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Não é possível adicionar a si mesmo' }));
                        return;
                    }
                    
                    const fromId = from.toLowerCase();
                    const toId = to.toLowerCase();
                    if (!fromUser.friends) fromUser.friends = [];
                    if (fromUser.friends.some(f => f.toLowerCase() === toId)) {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Vocês já são amigos' }));
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
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to save request' }));
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, registeredUsers: state.registeredUsers }));
                    });
                });
            } catch(e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
                const { username, target, action } = JSON.parse(body);
                if (!username || !target || !action) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing parameters' }));
                    return;
                }
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
                    const user = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
                    const targetUser = state.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === target.toLowerCase());
                    
                    if (!user || !targetUser) {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'User not found' }));
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
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to save request response' }));
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, registeredUsers: state.registeredUsers }));
                    });
                });
            } catch(e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
                const { username, target } = JSON.parse(body);
                if (!username || !target) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing parameters' }));
                    return;
                }
                
                fs.readFile(STATE_FILE, 'utf8', (err, data) => {
                    let state = { friends: [], animes: [], registeredUsers: [] };
                    if (!err && data) {
                        try { state = JSON.parse(data); } catch(e) {}
                    }
                    
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
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Failed to remove friend' }));
                            return;
                        }
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, registeredUsers: state.registeredUsers }));
                    });
                });
            } catch(e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Static files serving
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    if (!filePath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Forbidden');
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
