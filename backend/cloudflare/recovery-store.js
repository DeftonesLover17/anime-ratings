function createD1RecoveryStore({ getDb, ensureStorage }) {
    const decode = row => row ? { hash: row.token_hash, accountId: row.account_id, email: row.email, credentialVersion: row.credential_version, expiresAt: row.expires_at } : null;
    async function initialize(db) {
        await db.prepare('CREATE TABLE IF NOT EXISTS password_recoveries (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE, email TEXT NOT NULL, credential_version INTEGER NOT NULL, expires_at INTEGER NOT NULL)').run();
        await db.prepare('CREATE INDEX IF NOT EXISTS idx_password_recoveries_expiry ON password_recoveries (expires_at)').run();
    }
    const insert = (env, proof, restore) => getDb(env).prepare('INSERT INTO password_recoveries (token_hash,account_id,email,credential_version,expires_at) VALUES (?1,?2,?3,?4,?5) ON CONFLICT(account_id) ' + (restore ? 'DO NOTHING' : 'DO UPDATE SET token_hash=excluded.token_hash,email=excluded.email,credential_version=excluded.credential_version,expires_at=excluded.expires_at'))
        .bind(proof.hash, proof.accountId, proof.email, proof.credentialVersion, proof.expiresAt).run();
    async function save(env, proof) { await ensureStorage(env); await getDb(env).prepare('DELETE FROM password_recoveries WHERE expires_at <= ?1').bind(Date.now()).run(); await insert(env, proof, false); }
    async function restore(env, proof) { await insert(env, proof, true); }
    async function consume(env, hash, now) { await ensureStorage(env); return decode(await getDb(env).prepare('DELETE FROM password_recoveries WHERE token_hash=?1 AND expires_at>?2 RETURNING token_hash,account_id,email,credential_version,expires_at').bind(hash, now).first()); }
    async function remove(env, hash) { await getDb(env).prepare('DELETE FROM password_recoveries WHERE token_hash=?1').bind(hash).run(); }
    return { initialize, save, restore, consume, remove };
}
module.exports = { createD1RecoveryStore };
