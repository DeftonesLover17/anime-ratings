const identity = require('../../shared/security/identity');
const policy = require('../../shared/security/policy');

function createD1Sessions({ crypto, getDb, ensureStorage, randomToken }) {
    const fingerprint = async (token) =>
        Array.from(
            new Uint8Array(
                await crypto.subtle.digest(
                    'SHA-256',
                    new TextEncoder().encode(token)
                )
            ),
            (byte) => byte.toString(16).padStart(2, '0')
        ).join('');
    async function initialize(db) {
        // A versioned table rotates vulnerable legacy sessions without touching
        // accounts, ratings or the old data. Only token hashes are stored here.
        await db
            .prepare(
                'CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, username TEXT NOT NULL, credential_version INTEGER NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)'
            )
            .run();
        await db
            .prepare(
                'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (username)'
            )
            .run();
    }
    async function create(env, user) {
        await ensureStorage(env);
        const token = randomToken(),
            now = Date.now();
        await getDb(env)
            .prepare('DELETE FROM auth_sessions WHERE expires_at < ?1')
            .bind(now)
            .run();
        await getDb(env)
            .prepare(
                'INSERT INTO auth_sessions (token_hash, account_id, username, credential_version, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
            )
            .bind(
                await fingerprint(token),
                user.accountId,
                user.username,
                Number(user.credentialVersion) || 0,
                now,
                now + policy.SESSION_IDLE_MS
            )
            .run();
        return token;
    }
    async function authenticate(request, env, state) {
        const token = policy.authToken(request.headers);
        if (!token) return null;
        await ensureStorage(env);
        const hash = await fingerprint(token);
        const row = await getDb(env)
            .prepare('SELECT * FROM auth_sessions WHERE token_hash = ?1')
            .bind(hash)
            .first();
        if (!row) return null;
        const now = Date.now();
        const user = identity.uniqueUser(state, row.username);
        if (
            !user ||
            user.accountId !== row.account_id ||
            (Number(user.credentialVersion) || 0) !== row.credential_version ||
            now >= row.expires_at ||
            now >= row.created_at + policy.SESSION_ABSOLUTE_MS ||
            user.passwordResetRequired
        ) {
            await getDb(env)
                .prepare('DELETE FROM auth_sessions WHERE token_hash = ?1')
                .bind(hash)
                .run();
            return null;
        }
        await getDb(env)
            .prepare(
                'UPDATE auth_sessions SET expires_at = ?1 WHERE token_hash = ?2'
            )
            .bind(
                Math.min(
                    now + policy.SESSION_IDLE_MS,
                    row.created_at + policy.SESSION_ABSOLUTE_MS
                ),
                hash
            )
            .run();
        return user;
    }
    async function revokeCurrent(request, env) {
        const token = policy.authToken(request.headers);
        if (!token) return;
        await ensureStorage(env);
        await getDb(env)
            .prepare('DELETE FROM auth_sessions WHERE token_hash = ?1')
            .bind(await fingerprint(token))
            .run();
    }
    async function revokeUser(env, username) {
        await ensureStorage(env);
        await getDb(env)
            .prepare('DELETE FROM auth_sessions WHERE username = ?1')
            .bind(username)
            .run();
    }
    return { initialize, create, authenticate, revokeCurrent, revokeUser };
}
module.exports = { createD1Sessions };
