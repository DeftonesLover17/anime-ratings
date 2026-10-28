const test = require('node:test');
const assert = require('node:assert/strict');
const { createNotificationInbox } = require('../frontend/community/notifications');
const { activityNotification, sameNotification } = require('../shared/notifications');
const { stateResponse } = require('../shared/security/responses');

function fixture() {
    const values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    const snapshot = { viewerUsername: 'Felipe', registeredUsers: [
        { username: 'Felipe', friends: ['Ana'], notifications: [] },
        { username: 'Ana', friends: ['Felipe'] },
        { username: 'Bruno', friends: [] }
    ], activities: [] };
    const activity = { id: 'a1', username: 'Ana', type: 'rating', animeId: 'anime1', animeTitle: 'A Silent Voice', details: 'avaliou com nota 10', timestamp: '2026-10-28T12:00:59Z' };
    return { storage, snapshot, activity, inbox: createNotificationInbox(storage) };
}

test('one rating arriving through feed and server three times has one delivery and one inbox entry', () => {
    const { snapshot, activity, inbox } = fixture();
    assert.deepEqual(inbox.sync(snapshot), []); // An empty first feed is still initialized.
    snapshot.activities = [activity, { ...activity, id: 'a2', timestamp: '2026-10-28T12:01:01Z' }];
    snapshot.registeredUsers[0].notifications = [activityNotification({ ...activity, id: 'a3' })];
    assert.equal(inbox.sync(snapshot).length, 1);
    assert.equal(inbox.read('Felipe', snapshot.registeredUsers).length, 1);
    assert.deepEqual(inbox.sync(snapshot), []);
    snapshot.activities.push({ ...activity, id: 'a4', timestamp: '2026-10-28T12:01:20Z' });
    assert.deepEqual(inbox.sync(snapshot), []);
});

test('first visit never replays history, but a later different score is delivered', () => {
    const { snapshot, activity, inbox } = fixture();
    snapshot.activities = [activity];
    snapshot.registeredUsers[0].notifications = [activityNotification(activity)];
    assert.deepEqual(inbox.sync(snapshot), []);
    assert.equal(inbox.read('Felipe', snapshot.registeredUsers).length, 1);
    snapshot.activities.unshift({ ...activity, id: 'new-score', details: 'avaliou com nota 9' });
    assert.equal(inbox.sync(snapshot).length, 1);
});

test('non-friends and unilateral friendships never notify; accepting does not replay old activities', () => {
    const { snapshot, activity, inbox } = fixture();
    inbox.sync(snapshot);
    const stranger = { ...activity, username: 'Bruno' };
    snapshot.activities = [stranger];
    snapshot.registeredUsers[0].notifications = [activityNotification(stranger)];
    snapshot.registeredUsers[0].friends.push('Bruno');
    assert.deepEqual(inbox.sync(snapshot), []);
    assert.deepEqual(inbox.read('Felipe', snapshot.registeredUsers), []);
    snapshot.registeredUsers[2].friends.push('Felipe');
    assert.deepEqual(inbox.sync(snapshot), []);
    snapshot.activities.unshift({ ...stranger, id: 'new-event', details: 'avaliou com nota 8' });
    assert.equal(inbox.sync(snapshot).length, 1);
    snapshot.registeredUsers[0].friends = ['Ana'];
    inbox.sync(snapshot);
    assert.deepEqual(inbox.read('Felipe', snapshot.registeredUsers), []);
});

test('read or cleared notifications stay that way after polls and reload; caches never cross accounts', () => {
    const { snapshot, activity, inbox, storage } = fixture();
    inbox.sync(snapshot);
    snapshot.activities = [activity];
    inbox.sync(snapshot);
    const items = inbox.read('Felipe', snapshot.registeredUsers);
    inbox.write('Felipe', items.map(item => ({ ...item, read: true })));
    inbox.sync(snapshot);
    assert.equal(inbox.read('Felipe', snapshot.registeredUsers)[0].read, true);
    assert.deepEqual(inbox.read('Ana', snapshot.registeredUsers), []);
    inbox.write('Felipe', []);
    snapshot.registeredUsers[0].notifications = [activityNotification(activity)];
    const reloaded = createNotificationInbox(storage);
    assert.deepEqual(reloaded.sync(snapshot), []);
    assert.deepEqual(reloaded.read('Felipe', snapshot.registeredUsers), []);
});

test('server DTO removes old nonfriend notifications and duplicates, keeping invitations', () => {
    const { snapshot, activity } = fixture();
    const notice = activityNotification(activity);
    snapshot.registeredUsers[0].notifications = [notice, { ...notice, id: 'duplicate' }, activityNotification({ ...activity, username: 'Bruno', id: 'bruno' }), { id: 'invite', type: 'friend_request', title: 'Convite', message: 'Bruno te convidou' }];
    const response = stateResponse(snapshot, 'Felipe');
    assert.equal(response.registeredUsers[0].notifications.length, 2);
    assert.equal(response.registeredUsers[0].notifications[0].activityId, activity.id);
    assert.equal(response.registeredUsers[1].notifications, undefined);
});

test('dedupe preserves distinct scores, authors, works, and later legitimate repeated ratings', () => {
    const { activity } = fixture();
    const a = activityNotification(activity);
    for (const change of [{ details: 'avaliou com nota 9' }, { username: 'Bruno' }, { animeId: 'other' }, { timestamp: '2026-10-28T13:00:00Z' }]) {
        assert.equal(sameNotification(a, activityNotification({ ...activity, ...change, id: 'different' })), false);
    }
});
