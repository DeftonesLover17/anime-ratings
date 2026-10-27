const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccountSession } = require('../frontend/account/session');
const { createAccountAccess } = require('../frontend/account/access');
const { canManageSystem } = require('../shared/security/identity');

function fixture() {
    const nodes = new Map();
    for (const id of ['av-account-tools', 'open-backup-center', 'open-admin-center', 'backup-modal', 'admin-modal',
        'admin-overview', 'admin-users-list', 'admin-backups-list']) {
        const classes = new Set(['flex']);
        nodes.set(id, { hidden: false, disabled: false, content: 'old private content',
            replaceChildren() { this.content = ''; },
            classList: {
                add: value => classes.add(value), remove: value => classes.delete(value),
                contains: value => classes.has(value), toggle: (value, active) => active ? classes.add(value) : classes.delete(value)
            }
        });
    }
    const storage = { getItem: () => 'Felipe!' };
    const session = createAccountSession({ localStorage: storage });
    const access = createAccountAccess({ getElementById: id => nodes.get(id) }, session);
    return { session, access, node: id => nodes.get(id) };
}

test('cached owner names cannot show tools before server confirmation', () => {
    const f = fixture();
    f.access.refresh();
    assert.equal(f.node('av-account-tools').hidden, true);
    for (const username of ['Felipe!', 'Ana']) {
        f.session.acceptUsername(username);
        f.access.refresh();
        assert.equal(f.node('open-backup-center').hidden, true);
        assert.equal(f.node('open-admin-center').disabled, true);
    }
    f.session.acceptViewerPermissions('Felipe!', { canManageSystem: true });
    assert.equal(f.access.canManageSystem(), false, 'permissions for a different viewer are discarded');
    f.session.acceptViewerPermissions('Ana', { canManageSystem: 'true' });
    assert.equal(f.access.canManageSystem(), false);
});

test('server-confirmed owner access disappears on account change and clears private panels', () => {
    const f = fixture();
    f.session.acceptUsername('Felipe!');
    f.session.acceptViewerPermissions('Felipe!', { canManageSystem: true });
    f.access.refresh();
    assert.equal(f.node('av-account-tools').hidden, false);
    assert.equal(f.node('open-backup-center').disabled, false);
    assert.equal(f.node('open-admin-center').hidden, false);
    f.session.acceptUsername('Ana');
    f.access.refresh();
    assert.equal(f.node('av-account-tools').hidden, true);
    for (const id of ['backup-modal', 'admin-modal']) assert.equal(f.node(id).classList.contains('hidden'), true);
    for (const id of ['admin-overview', 'admin-users-list', 'admin-backups-list']) assert.equal(f.node(id).content, '');
    f.session.acceptUsername('Felipe!');
    assert.equal(f.access.canManageSystem(), false, 'returning to a cached username requires a fresh proof');
});

test('system tools belong only to the unique owner, even when another admin is configured', () => {
    const owner = { username: 'Felipe!', accountId: 'owner-id' }, anotherAdmin = { username: 'Ana', accountId: 'other-id' };
    const state = { registeredUsers: [owner, anotherAdmin] };
    const env = { ADMIN_ACCOUNT_IDS: 'owner-id,other-id' };
    assert.equal(canManageSystem(owner, env, state), true);
    assert.equal(canManageSystem(anotherAdmin, env, state), false);
    assert.equal(canManageSystem(null, env, state), false);
    state.registeredUsers.push({ username: 'Feli.pe', accountId: 'ambiguous' });
    assert.equal(canManageSystem(owner, env, state), false);
});
