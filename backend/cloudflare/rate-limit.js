// D1 is authoritative across isolates. This bounded cache only avoids repeated
// database work for clients already denied by D1 in this isolate.
function createD1RateLimiter({ now = Date.now, capacity = 5_000 } = {}) {
    const databases = new WeakMap();
    return async function consume(db, key, max, windowMs) {
        let cache = databases.get(db);
        if (!cache) { cache = { denied: new Map(), cleanupAt: 0 }; databases.set(db, cache); }
        const time = now();
        const deniedUntil = cache.denied.get(key) || 0;
        if (deniedUntil > time) return Math.max(1, Math.ceil((deniedUntil - time) / 1000));
        cache.denied.delete(key);
        if (time >= cache.cleanupAt) {
            cache.cleanupAt = time + 60_000;
            for (const [id, until] of cache.denied) if (until <= time) cache.denied.delete(id);
            await db.prepare('DELETE FROM rate_limits WHERE reset_at < ?1').bind(time).run();
        }
        const row = await db.prepare(
            'INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at <= ?3 THEN 1 ELSE MIN(count + 1, ?4) END, reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END RETURNING count, reset_at'
        ).bind(key, time + windowMs, time, max + 1).first();
        if (Number(row.count) <= max) return 0;
        if (cache.denied.size < capacity) cache.denied.set(key, Number(row.reset_at));
        return Math.max(1, Math.ceil((Number(row.reset_at) - time) / 1000));
    };
}
module.exports = { createD1RateLimiter };
