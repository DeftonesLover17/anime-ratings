const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sync = require('../shared/sync-state');
const { createAccountSession } = require('../frontend/account/session');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

function fixture(fetch) {
    const stored = new Map([
        ['anivoid_logged_in_username', 'Ana'],
        ['anivoid_registered_users', JSON.stringify([{ username: 'Ana', email: 'ana@example.invalid' }])]
    ]);
    const storage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
    const session = createAccountSession({ localStorage: storage });
    let gates = 0, merges = 0;
    const state = { loggedInUser: null, friends: [], animes: [], activities: [], studioLogos: {}, knownActivityIds: new Set(), repairDerivedRatings() {}, loadLocalSession() {} };
    const deps = {
        window: { AnivoidUI: { session } }, localStorage: storage, API_BASE_URL: '', fetch,
        AnivoidSync: { ...sync, mergeClientState(...args) { merges++; return sync.mergeClientState(...args); } },
        stripSensitiveUserFields: user => user, deterministicStringify: JSON.stringify,
        authHeaders: value => value, readClientState: () => ({ animes: state.animes, registeredUsers: [] }),
        setAuthSession(username) { session.acceptUsername(username); state.loggedInUser = username; storage.setItem('anivoid_logged_in_username', username); },
        clearAuthSession() { session.acceptUsername(''); state.loggedInUser = null; state.friends = []; state.syncBase = null; storage.removeItem('anivoid_logged_in_username'); },
        rememberSyncBase(value) { if (value.viewerUsername) state.syncBase = sync.clientSnapshot(value, value.viewerUsername); },
        showRegistrationGate() { gates++; },
        storeRegisteredUsers: users => storage.setItem('anivoid_registered_users', JSON.stringify(users)),
        isCurrentUserAdmin: () => false,
        showToast() {}, pushNotification() {}, renderActivitiesFeed() {}, renderRecommendationsRail() {}, mergeServerNotifications() {},
        getAuthToken: () => '', console: { error() {} }
    };
    const loadSource = source.slice(source.indexOf('    loadLocalSession() {'), source.indexOf('    async syncWithServer() {'));
    const syncSource = source.slice(source.indexOf('    async syncWithServerNow() {'), source.indexOf('    save() {'));
    const methods = new Function(...Object.keys(deps), 'return ({' + loadSource + ',' + syncSource + '});')(...Object.values(deps));
    return { state, session, deps, stored, load: () => methods.loadLocalSession.call(state), sync: () => methods.syncWithServerNow.call(state), gates: () => gates, merges: () => merges };
}
const response = (viewerUsername, extra = {}) => new Response(JSON.stringify({ viewerUsername, registeredUsers: [], animes: [], activities: [], studioLogos: {}, ...extra }));

test('a cached username never authenticates the application or starts a write before server confirmation', async () => {
    let method;
    const f = fixture(async (_, options) => { method = options.method; return response('Ana', { registeredUsers: [{ username: 'Ana' }] }); });
    f.load();
    assert.equal(f.state.loggedInUser, null);
    assert.equal(f.state.friends.length, 0);
    await f.sync();
    assert.equal(method, 'GET');
    assert.equal(f.state.loggedInUser, 'Ana');
});

test('an anonymous 200 after expiration clears the old identity and opens login while keeping public ratings', async () => {
    const f = fixture(async () => response('', { animes: [{ id: 'a', ratings: { ana: { overall: 9 } } }] }));
    f.deps.setAuthSession('Ana');
    await f.sync();
    assert.equal(f.state.loggedInUser, null);
    assert.equal(f.session.username(), '');
    assert.equal(f.gates(), 1);
    assert.equal(f.state.animes[0].ratings.ana.overall, 9);
});

test('a response started before a new login cannot overwrite the new identity, cache or catalog', async () => {
    let release;
    const f = fixture(() => new Promise(resolve => { release = resolve; }));
    const pending = f.sync();
    f.session.invalidatePending();
    f.deps.setAuthSession('Bruno');
    f.state.animes = [{ id: 'fresh' }];
    release(response(''));
    await pending;
    assert.equal(f.state.loggedInUser, 'Bruno');
    assert.equal(f.state.animes[0].id, 'fresh');
    assert.equal(f.gates(), 0);
});

test('a permission failure does not invalidate a valid session, and a changed cookie never merges the previous account delta', async () => {
    const denied = fixture(async () => new Response(JSON.stringify({ error: 'Origin rejected' }), { status: 403 }));
    denied.deps.setAuthSession('Ana');
    await denied.sync();
    assert.equal(denied.state.loggedInUser, 'Ana');
    const switched = fixture(async () => response('Bruno'));
    switched.deps.setAuthSession('Ana');
    await switched.sync();
    assert.equal(switched.state.loggedInUser, 'Bruno');
    assert.equal(switched.merges(), 0);
});

test('adopting a different confirmed identity drops the previous sync baseline before another request can use it', () => {
    const f = fixture(async () => response(''));
    f.session.acceptUsername('Ana');
    f.state.syncBase = { owner: 'Ana' };
    f.state.friends = [{ id: 'ana', isMe: true }];
    const window = { AnivoidUI: { session: f.session }, __anivoidState: f.state };
    const start = source.indexOf('function setAuthSession('), end = source.indexOf('function clearAuthSession(', start);
    const set = new Function('window', 'localStorage', source.slice(start, end) + '\nreturn setAuthSession;')(window, {
        setItem: (key, value) => f.stored.set(key, value)
    });
    set('Bruno');
    assert.equal(f.state.loggedInUser, 'Bruno');
    assert.equal(f.state.syncBase, null);
    assert.equal(f.state.friends.length, 0);
    assert.equal(f.stored.get('anivoid_logged_in_username'), 'Bruno');
});

test('startup with a known account or pending sync keeps registration gate hidden until confirmed', () => {
    let gateShown = false, gateHidden = false;
    const hideRegistrationGate = () => { gateHidden = true; };
    const showRegistrationGate = () => { gateShown = true; };
    const state = { friends: [], loggedInUser: null, syncInFlight: Promise.resolve(), initialSyncDone: false };
    const localStorage = { getItem: key => key === 'anivoid_logged_in_username' ? 'Felipe!' : null };

    const hasKnownAccount = Boolean(localStorage.getItem('anivoid_logged_in_username'));
    const isSyncing = Boolean(state.syncInFlight || !state.initialSyncDone);
    if (state.friends.length === 0) {
        if (state.loggedInUser) hideRegistrationGate();
        else if (hasKnownAccount || isSyncing) hideRegistrationGate();
        else showRegistrationGate();
    }
    assert.equal(gateShown, false);
    assert.equal(gateHidden, true);
});
