function createD1EmailStore({ getDb, ensureStorage }) {
    async function initialize(db) {
        await db
            .prepare(
                'CREATE TABLE IF NOT EXISTS email_verifications (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL, expires_at INTEGER NOT NULL)'
            )
            .run();
    }
    async function save(env, record) {
        await ensureStorage(env);
        await getDb(env)
            .prepare('DELETE FROM email_verifications WHERE expires_at <= ?1')
            .bind(Date.now())
            .run();
        await getDb(env)
            .prepare(
                'INSERT INTO email_verifications (token_hash,account_id,email,expires_at) VALUES (?1,?2,?3,?4) ON CONFLICT(account_id) DO UPDATE SET token_hash=excluded.token_hash,email=excluded.email,expires_at=excluded.expires_at'
            )
            .bind(record.hash, record.accountId, record.email, record.expiresAt)
            .run();
    }
    async function consume(env, hash, now) {
        await ensureStorage(env);
        const row = await getDb(env)
            .prepare(
                'DELETE FROM email_verifications WHERE token_hash = ?1 AND expires_at > ?2 RETURNING account_id, email, expires_at'
            )
            .bind(hash, now)
            .first();
        return row
            ? {
                  accountId: row.account_id,
                  email: row.email,
                  expiresAt: row.expires_at
              }
            : null;
    }
    async function remove(env, hash) {
        await getDb(env)
            .prepare('DELETE FROM email_verifications WHERE token_hash = ?1')
            .bind(hash)
            .run();
    }
    return { initialize, save, consume, remove };
}
module.exports = { createD1EmailStore };
