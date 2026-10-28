const { sameNotification, visibleNotification, activityNotification, compactNotifications } = require('../../shared/notifications');

function createNotificationInbox(storage) {
    let initializedViewer = '';
    const keyFor = viewer => `anivoid_notifications_v2:${encodeURIComponent(viewer.toLowerCase())}`;
    const array = value => Array.isArray(value) ? value : [];
    function load(viewer) {
        try {
            const data = JSON.parse(storage.getItem(keyFor(viewer))) || {};
            return { items: array(data.items), seen: array(data.seen) };
        } catch { return { items: [], seen: [] }; }
    }
    function persist(viewer, data) {
        const seen = [...data.seen].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
        storage.setItem(keyFor(viewer), JSON.stringify({ items: data.items.slice(0, 100), seen: seen.slice(0, 300) }));
    }
    function read(viewer, users) {
        if (!viewer) return [];
        const me = array(users).find(user => user?.username === viewer);
        return compactNotifications(load(viewer).items.filter(item => visibleNotification(item, me, users)));
    }
    function write(viewer, items) {
        if (!viewer) return;
        const data = load(viewer);
        // Keep delivery identities when the member reads or clears the inbox.
        persist(viewer, { ...data, items: compactNotifications(items) });
    }
    function sync(snapshot) {
        const viewer = snapshot.viewerUsername || '';
        const users = array(snapshot.registeredUsers);
        const me = users.find(user => user?.username === viewer);
        storage.removeItem('anivoid_notifications_v1'); // Legacy cache had no account owner.
        if (!viewer || !me) { initializedViewer = ''; return []; }
        const firstLoad = initializedViewer !== viewer;
        initializedViewer = viewer;
        const data = load(viewer);
        let items = data.items.filter(item => visibleNotification(item, me, users));
        const seen = [...data.seen];
        const delivered = [];
        const sources = [
            ...array(me.notifications).map(notice => ({ notice, history: true })),
            ...array(snapshot.activities).filter(item => item?.id && item.username).map(item => ({ notice: activityNotification(item), history: false }))
        ];
        for (const { notice, history } of sources) {
            if (!notice?.title) continue;
            const known = seen.some(item => sameNotification(item, notice));
            const existing = items.find(item => sameNotification(item, notice));
            if (existing) existing.read = Boolean(existing.read || notice.read);
            const allowed = visibleNotification(notice, me, users);
            if (!known && !existing && allowed && (history || !firstLoad)) {
                items.push({ ...notice, read: Boolean(notice.read) });
                if (!firstLoad && !notice.read) delivered.push(notice);
            }
            // Remember even non-friends' activity, so accepting a friendship never replays their old feed.
            if (!known) seen.unshift(notice);
        }
        persist(viewer, { items: compactNotifications(items), seen });
        return compactNotifications(delivered);
    }
    return { read, write, sync, reset: () => { initializedViewer = ''; } };
}

module.exports = { createNotificationInbox };
