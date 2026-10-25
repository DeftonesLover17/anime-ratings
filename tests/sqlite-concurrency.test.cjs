const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let DatabaseSync;
try { ({ DatabaseSync } = require('node:sqlite')); } catch {}

test('D1 schema and conditional writes work against real SQLite', { skip: !DatabaseSync }, async () => {
    const database = new DatabaseSync(':memory:');
    const db = {
        prepare(sql) {
            let args = [];
            return {
                bind(...values) { args = values; return this; },
                async run() { const result = database.prepare(sql).run(...args); return { success: true, meta: { changes: result.changes } }; },
                async first() { return database.prepare(sql).get(...args) || null; },
                async all() { return { results: database.prepare(sql).all(...args) }; }
            };
        }
    };
    const api = require('./helpers/cloudflare.cjs').loadCloudflare();
    const env = { ANIVOID_DB: db };
    try {
        const initial = await api.readState(env);
        initial.registeredUsers.push({ username: 'Ana', friends: [], friendRequests: [] });
        initial.animes.push({ id: 'a1', title: 'Anime', ratings: { ana: { overall: 8 } }, comments: [] });
        await api.writeState(env, initial);
        const first = await api.readState(env);
        const second = await api.readState(env);
        first.animes[0].ratings.ana.overall = 9;
        second.animes[0].ratings.ana.overall = 6;
        await api.writeState(env, first);
        await assert.rejects(api.writeState(env, second), { code: 'STATE_CONFLICT' });
        const saved = await api.readState(env);
        assert.equal(saved.revision, 2);
        assert.equal(saved.animes[0].ratings.ana.overall, 9);
        assert.equal(saved.registeredUsers[0].username, 'Ana');
    } finally { database.close(); }
});
