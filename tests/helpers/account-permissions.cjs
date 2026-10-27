const assert = require('node:assert/strict');

async function verifyAccountPermissions(send) {
    const ownerLogin = await send('/api/login', { identifier: 'Felipe!', password: 'LocalFixtureOnly123' });
    assert.equal(ownerLogin.status, 200);
    const owner = ownerLogin.headers.get('Set-Cookie').split(';')[0];
    const created = await send('/api/register', {
        username: 'NewMember', email: 'newmember@example.invalid', password: 'NewFixturePassword123',
        isAdmin: true, viewerPermissions: { canManageSystem: true }
    });
    assert.equal(created.status, 200);
    const member = created.headers.get('Set-Cookie').split(';')[0];
    for (const path of ['/api/users', '/api/get-state']) {
        for (const [cookie, allowed] of [['', false], [member, false], [owner, true]]) {
            const response = await send(path, undefined, cookie);
            assert.equal(response.status, 200);
            const body = await response.json();
            assert.equal(body.viewerPermissions.canManageSystem, allowed);
        }
    }
}

module.exports = { verifyAccountPermissions };
