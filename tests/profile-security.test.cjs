const test = require('node:test');
const assert = require('node:assert/strict');
const { displayUser, profileStats } = require('../frontend/profiles/model');
const { createProfileDialogs } = require('../frontend/profiles/dialog');

test('deleted, ambiguous and malformed profiles never become another member or expose private fields', () => {
    assert.equal(displayUser('missing', []).available, false);
    assert.equal(displayUser('ana', [{ username: 'Ana' }, { username: 'Ana!' }]).available, false);
    const user = displayUser('ana', [null, { username: 'Ana', email: 'private@example.invalid', passwordHash: 'secret', color: 'red;position:fixed', banner: 'javascript:alert(1)', favoriteGenres: {} }]);
    assert.equal(user.available, true);
    assert.equal(user.email, undefined); assert.equal(user.passwordHash, undefined);
    assert.equal(user.color, '#FF4500'); assert.equal(user.banner, '');
    assert.equal(user.activeTitle, ''); assert.deepEqual(user.favoriteGenres, []);
});

test('profile statistics tolerate legacy shapes, prototype names and unrated completions', () => {
    const animes = [null,
        { id: '1', genres: ['__proto__', 'constructor'], studio: '__proto__', ratings: { ana: { overall: '8,4', status: 'Completed', episodesWatched: 12 } }, comments: [{ friendId: 'Ana', replies: {} }, null] },
        { id: '2', genres: {}, ratings: { ana: { overall: '', status: 'Completed', episodesWatched: -4 } }, comments: {} },
        { id: '3', ratings: { ana: { overall: Infinity, status: '__proto__', episodesWatched: Infinity }, bruno: { overall: 10 } } }
    ];
    const stats = profileStats('Ana', animes, [null, { username: 'Ana', timestamp: 'invalid' }]);
    assert.equal(stats.ratingCount, 1); assert.equal(stats.trackedCount, 3);
    assert.equal(stats.completionRate, 67); assert.equal(stats.totalEpisodes, 12);
    assert.equal(stats.avgScore, 8.4); assert.equal(stats.topStudios[0].name, '__proto__');
    assert.equal(stats.commentsCount, 1); assert.deepEqual(stats.recentActivities, []);
    assert.equal(profileStats('Bruno', animes, []).avgScore, 10);
    assert.equal(profileStats('', null, null).ratingCount, 0);
});

function fixture(reduced = false) {
    const timers = new Map(); let timerId = 0;
    const doc = { activeElement: null };
    function node() {
        const classes = new Set(['hidden']), events = {};
        return {
            id: 'player-profile-modal', isConnected: true, tabIndex: 0,
            classList: { add: (...items) => items.forEach(item => classes.add(item)), remove: (...items) => items.forEach(item => classes.delete(item)), contains: item => classes.has(item) },
            setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], closest: () => null,
            getClientRects: () => [1], focus() { doc.activeElement = this; },
            addEventListener: (type, handler) => events[type] = handler,
            emit: (type, event) => events[type]?.(event)
        };
    }
    const modal = node(), other = node(), opener = node(); doc.activeElement = opener;
    doc.body = node(); doc.body.classList.remove('hidden');
    doc.querySelectorAll = () => [modal, other];
    const win = { document: doc, matchMedia: () => ({ matches: reduced }), getComputedStyle: () => ({ display: 'flex' }),
        setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id) };
    const dialogs = createProfileDialogs(win);
    const finish = () => { for (const fn of [...timers.values()]) fn(); timers.clear(); };
    return { doc, modal, other, opener, dialogs, finish, timers };
}

test('a closing profile can reopen without a stale timer hiding it; another modal retains scroll lock', () => {
    const f = fixture(); f.dialogs.open(f.modal); f.dialogs.close(f.modal); f.dialogs.open(f.modal); f.finish();
    assert.equal(f.modal.classList.contains('hidden'), false);
    assert.equal(f.doc.activeElement, f.modal);
    f.other.classList.remove('hidden'); f.dialogs.close(f.modal); f.finish();
    assert.equal(f.doc.body.classList.contains('overflow-hidden'), true);
    f.dialogs.close(f.other, { immediate: true });
    assert.equal(f.doc.body.classList.contains('overflow-hidden'), false);
});

test('reduced motion and Escape finish closing, restore focus and do not accumulate timers', () => {
    const f = fixture(true); f.dialogs.open(f.modal);
    f.modal.emit('keydown', { key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(f.modal.classList.contains('hidden'), true);
    assert.equal(f.doc.activeElement, f.opener); assert.equal(f.timers.size, 0);
});

test('the real friends renderer keeps untrusted names as text and visiting does not switch the signed-in account', () => {
    const fs = require('node:fs'), path = require('node:path');
    const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    assert.equal((source.match(/function renderModalFriendsList\(/g) || []).length, 1);
    const body = source.slice(source.indexOf('function renderModalFriendsList()'), source.indexOf('// ──', source.indexOf('function renderModalFriendsList()')));
    const name = 'Ana <img src=x onerror=alert(1)>', users = [{ username: 'Owner', friends: [name] }, { username: name, avatar: '<script>unsafe</script>', email: 'private@example.invalid' }];
    const events = {}, nodes = [], container = { innerHTML: '', appendChild: node => nodes.push(node) };
    const document = { getElementById: () => container, createElement: () => ({ className: '', innerHTML: '', querySelector: selector => ({ addEventListener: (type, fn) => events[selector] = fn }) }) };
    const state = { loggedInUser: 'Owner', currentFriendId: 'owner' };
    let visited, closed;
    const run = new Function('document', 'state', 'getRegisteredUsersSafe', 'escapeHtml', 'getUserBadgesHtml', 'window', 'renderPlayerProfileModal', 'DEFAULT_AVATAR_SVG', body + ';renderModalFriendsList();');
    run(document, state, () => users, require('../frontend/shared/dom').escapeHtml, () => '', { closeAddFriendModal: options => closed = options, AnivoidUI: { profiles: { displayUser } } }, id => visited = id, '👤');
    assert.equal(nodes.length, 1); assert.ok(nodes[0].innerHTML.includes('&lt;img'));
    assert.equal(nodes[0].innerHTML.includes('<script>'), false);
    assert.equal(nodes[0].innerHTML.includes('private@example.invalid'), false);
    events['.av-friend-view-profile-btn']();
    assert.equal(visited, name); assert.equal(closed.immediate, true);
    assert.equal(state.loggedInUser, 'Owner'); assert.equal(state.currentFriendId, 'owner');
});
