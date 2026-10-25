const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
function loadCloudflare() {
    const source = fs
        .readFileSync(path.join(root, 'functions/api/[[path]].js'), 'utf8')
        .replace(
            /^import (\w+) from '([^']+)';\r?$/gm,
            (_match, name, relative) =>
                `const ${name} = loadModule(${JSON.stringify(path.resolve(root, 'functions/api', relative))});`
        )
        .replace('export async function onRequest', 'async function onRequest');
    return new Function(
        'crypto',
        'loadModule',
        source +
            '\nreturn {onRequest, readState, writeState, handleRegister, handleLogin, createSession, setPassword};'
    )(require('node:crypto').webcrypto, require);
}
function sqliteD1() {
    const { DatabaseSync } = require('node:sqlite');
    const sqlite = new DatabaseSync(':memory:');
    return {
        sqlite,
        prepare(sql) {
            let args = [];
            return {
                bind(...values) {
                    args = values;
                    return this;
                },
                async run() {
                    const result = sqlite.prepare(sql).run(...args);
                    return { success: true, meta: { changes: result.changes } };
                },
                async first() {
                    return sqlite.prepare(sql).get(...args) || null;
                },
                async all() {
                    return { results: sqlite.prepare(sql).all(...args) };
                }
            };
        }
    };
}
module.exports = { loadCloudflare, sqliteD1 };
