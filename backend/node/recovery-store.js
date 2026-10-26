const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

function createFileRecoveryStore(file) {
    let queue = Promise.resolve();
    function operation(change) {
        const work = queue.then(async () => {
            let rows;
            try { rows = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; rows = []; }
            rows = rows.filter(row => row.expiresAt > Date.now());
            const result = change(rows);
            await fs.mkdir(path.dirname(file), { recursive: true });
            const temporary = file + '.' + crypto.randomUUID() + '.tmp';
            await fs.writeFile(temporary, JSON.stringify(rows), { mode: 0o600 });
            await fs.rename(temporary, file);
            return result;
        });
        queue = work.catch(() => {}); return work;
    }
    return {
        save: (_env, proof) => operation(rows => { for (let i = rows.length - 1; i >= 0; i--) if (rows[i].accountId === proof.accountId) rows.splice(i, 1); rows.push(proof); }),
        restore: (_env, proof) => operation(rows => { if (!rows.some(row => row.accountId === proof.accountId)) rows.push(proof); }),
        consume: (_env, hash, now) => operation(rows => { const index = rows.findIndex(row => row.hash === hash && row.expiresAt > now); return index < 0 ? null : rows.splice(index, 1)[0]; }),
        remove: (_env, hash) => operation(rows => { const index = rows.findIndex(row => row.hash === hash); if (index >= 0) rows.splice(index, 1); })
    };
}
module.exports = { createFileRecoveryStore };
