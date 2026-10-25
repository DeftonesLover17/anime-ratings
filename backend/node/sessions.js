const crypto = require('node:crypto');
const identity = require('../../shared/security/identity');
const policy = require('../../shared/security/policy');
function createNodeSessions() {
    const sessions = new Map();
    const fingerprint = (token) =>
        crypto.createHash('sha256').update(token).digest('hex');
    function create(user, res) {
        const now = Date.now();
        for (const [key, session] of sessions)
            if (session.expiresAt <= now) sessions.delete(key);
        const token = crypto.randomBytes(32).toString('base64url');
        sessions.set(fingerprint(token), {
            accountId: user.accountId,
            username: user.username,
            credentialVersion: Number(user.credentialVersion) || 0,
            createdAt: now,
            expiresAt: now + policy.SESSION_IDLE_MS
        });
        res?.setHeader('Set-Cookie', policy.sessionCookie(token));
        return token;
    }
    const tokenFrom = (req) => policy.authToken(new Headers(req.headers));
    function authenticate(req, state) {
        const token = tokenFrom(req);
        if (!token) return null;
        const hash = fingerprint(token),
            session = sessions.get(hash),
            now = Date.now();
        const user = session && identity.uniqueUser(state, session.username);
        if (
            !user ||
            user.accountId !== session.accountId ||
            (Number(user.credentialVersion) || 0) !==
                session.credentialVersion ||
            now >= session.expiresAt ||
            now >= session.createdAt + policy.SESSION_ABSOLUTE_MS ||
            user.passwordResetRequired
        ) {
            sessions.delete(hash);
            return null;
        }
        session.expiresAt = Math.min(
            now + policy.SESSION_IDLE_MS,
            session.createdAt + policy.SESSION_ABSOLUTE_MS
        );
        return user;
    }
    function revokeCurrent(req) {
        const token = tokenFrom(req);
        if (token) sessions.delete(fingerprint(token));
    }
    function revokeUser(username) {
        for (const [key, session] of sessions)
            if (
                identity.usernameKey(session.username) ===
                identity.usernameKey(username)
            )
                sessions.delete(key);
    }
    return { create, authenticate, revokeCurrent, revokeUser };
}
module.exports = { createNodeSessions };
