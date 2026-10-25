function createMemoryEmailStore() {
    const records = new Map();
    return {
        async save(_env, record) {
            for (const [key, value] of records)
                if (
                    value.accountId === record.accountId ||
                    value.expiresAt <= Date.now()
                )
                    records.delete(key);
            records.set(record.hash, record);
        },
        async consume(_env, hash, now) {
            const record = records.get(hash);
            if (!record || record.expiresAt <= now) return null;
            records.delete(hash);
            return record;
        },
        async remove(_env, hash) {
            records.delete(hash);
        }
    };
}
module.exports = { createMemoryEmailStore };
