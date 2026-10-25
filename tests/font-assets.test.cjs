const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

test('the display font cache key matches its contents after glyph corrections', () => {
    const root = path.resolve(__dirname, '..');
    const css = fs.readFileSync(path.join(root, 'frontend/site/fonts.css'), 'utf8');
    const face = css.match(/@font-face\s*\{[^}]*font-family:\s*'Anivoid Display'[^}]*\}/)[0];
    const [, filename, key] = face.match(/url\('\/(fonts\/syne\.latin\.([a-f0-9]{10,64})\.woff2)'\)/);
    const hash = createHash('sha256').update(fs.readFileSync(path.join(root, filename))).digest('hex');
    assert.equal(hash.startsWith(key), true, 'Publish changed glyphs at a new immutable font URL');
});
