// Budgets include background synchronization and allow a short interactive burst.
const API_LIMITS = Object.freeze({
    burst: { max: 40, windowMs: 10_000 },
    read: { max: 180, windowMs: 60_000 },
    write: { max: 120, windowMs: 60_000 },
    account: { max: 90, windowMs: 60_000 }
});

function createMemoryLimiter({ now = Date.now, capacity = 10_000 } = {}) {
    const records = new Map();
    let nextCleanup = 0;
    return {
        consume(key, max, windowMs) {
            const time = now();
            if (time >= nextCleanup) {
                for (const [id, record] of records) if (record.resetAt <= time) records.delete(id);
                nextCleanup = time + 30_000;
            }
            let record = records.get(key);
            if (!record || record.resetAt <= time) {
                // Fail closed under cardinality attacks instead of evicting active limits.
                if (!record && records.size >= capacity) return { allowed: false, retryAfter: 30 };
                record = { count: 0, resetAt: time + windowMs };
                records.set(key, record);
            }
            record.count = Math.min(record.count + 1, max + 1);
            return { allowed: record.count <= max, retryAfter: Math.max(1, Math.ceil((record.resetAt - time) / 1000)) };
        },
        get size() { return records.size; }
    };
}

module.exports = { API_LIMITS, createMemoryLimiter };
