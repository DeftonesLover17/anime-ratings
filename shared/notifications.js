// One identity rule for the activity feed, server inbox and browser inbox.
const ACTIVITY_TYPES = new Set(['activity', 'rating', 'status', 'progress', 'comment_add', 'comment_edit', 'comment_delete', 'reply_add', 'catalog', 'catalog_edit']);
const nameKey = value => String(value || '').trim().toLowerCase();
const list = value => Array.isArray(value) ? value : [];
const timestamp = notice => Date.parse(notice?.timestamp) || 0;

function sameNotification(a, b) {
    if (a.id && b.id && a.id === b.id) return true;
    if (a.activityId && b.activityId && a.activityId === b.activityId) return true;
    const fields = ['type', 'title', 'message', 'animeId'];
    return fields.every(key => nameKey(a[key]) === nameKey(b[key])) &&
        timestamp(a) > 0 && timestamp(b) > 0 && Math.abs(timestamp(a) - timestamp(b)) <= 120000;
}

function areFriends(viewer, author) {
    return Boolean(viewer && author && nameKey(viewer.username) !== nameKey(author.username) &&
        list(viewer.friends).some(name => nameKey(name) === nameKey(author.username)) &&
        list(author.friends).some(name => nameKey(name) === nameKey(viewer.username)));
}

function visibleNotification(notice, viewer, users) {
    if (!notice || !notice.title || !viewer) return false;
    if (!ACTIVITY_TYPES.has(notice.type)) return true; // Invitations and account notices have their own recipients.
    const author = list(users).find(user => nameKey(user?.username) === nameKey(notice.actorUsername || notice.title));
    return areFriends(viewer, author);
}

function activityNotification(activity) {
    return {
        id: `activity:${activity.id}`, activityId: activity.id,
        actorUsername: activity.username, type: activity.type || 'activity', title: activity.username,
        message: `${activity.details || 'interagiu'} em ${activity.animeTitle || 'um anime'}`,
        animeId: activity.animeId || '', avatar: activity.userAvatar || 'bell',
        color: activity.userColor || '#FF4500', timestamp: activity.timestamp, read: false
    };
}

function compactNotifications(notices, limit = 100) {
    const result = [];
    for (const notice of list(notices).filter(item => item?.title).sort((a, b) => timestamp(b) - timestamp(a))) {
        const previous = result.find(item => sameNotification(item, notice));
        if (previous) previous.read = Boolean(previous.read || notice.read);
        else result.push({ ...notice });
    }
    return result.slice(0, limit);
}

module.exports = { sameNotification, areFriends, visibleNotification, activityNotification, compactNotifications };
