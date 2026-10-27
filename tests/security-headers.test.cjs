const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Pages header template has valid path/header blocks and revalidatable logo caching', () => {
    const source = fs.readFileSync(path.join(__dirname, '../config/security-headers.template'), 'utf8');
    const blocks = new Map();
    let current;
    for (const line of source.split(/\r?\n/)) {
        if (!line.trim() || line.startsWith('#')) continue;
        if (line.startsWith('/')) { current = new Map(); blocks.set(line, current); }
        else {
            assert.ok(current, 'Header without a path');
            const header = line.match(/^  ([a-z-]+): (.+)$/i);
            assert.ok(header, `Malformed header line: ${line}`);
            current.set(header[1], header[2]);
        }
    }
    assert.ok(blocks.get('/*').get('Content-Security-Policy').includes("script-src-attr 'none'"));
    assert.match(blocks.get('/logos/*').get('Cache-Control'), /max-age=\d+/);
    assert.ok(!blocks.get('/logos/*').get('Cache-Control').includes('immutable'));
});
