const { cachedUserResponse, friendResponse, animeResponse, stateResponse } = require('../../shared/security/responses');
const { clientSnapshot } = require('../../shared/sync-state');

function cleanBrowserCache(storage) {
    storage.removeItem('anivoid_auth_token');
    let viewer = '';
    try { viewer = storage.getItem('anivoid_logged_in_username') || ''; } catch {}
    const project = (key, transform) => {
        try {
            const raw = storage.getItem(key);
            if (!raw) return;
            const value = JSON.parse(raw);
            storage.setItem(key, JSON.stringify(transform(value)));
        } catch { storage.removeItem(key); }
    };
    project('anivoid_registered_users', value => Array.isArray(value) ? value.map(user => cachedUserResponse(user, viewer)).filter(Boolean) : []);
    project('anivoid_friends_v2', value => Array.isArray(value) ? value.map(friendResponse) : []);
    project('anivoid_list_v2', value => Array.isArray(value) ? value.map(animeResponse) : []);
    for (const key of storage.keys?.() || []) if (key.startsWith('anivoid_sync_base:')) project(key, value => {
        const owner = value?.registeredUsers?.[0]?.username || key.slice('anivoid_sync_base:'.length);
        return clientSnapshot(stateResponse(value, owner), owner);
    });
}
module.exports = { cleanBrowserCache };
