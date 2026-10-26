const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, sanitizeColor, sanitizeTextArray } = require('../shared/security/text-sanitizers');

test('shared text sanitizers keep the existing escaping and length limits', () => {
    assert.equal(escapeHtml('&lt;script&gt;\u0000"'), '&lt;script&gt;&quot;');
    assert.equal(escapeHtml('abcdef', 3), 'abc');
    assert.deepEqual(sanitizeTextArray(['<script>', 'Beta', 'Gamma'], 2, 4), ['&lt;scr', 'Beta']);
    assert.deepEqual(sanitizeTextArray('not an array'), []);
});

test('shared colors reject CSS values outside the stored hex format', () => {
    assert.equal(sanitizeColor(' #a1B2c3 '), '#a1B2c3');
    assert.equal(sanitizeColor('var(--brand)'), '#FF4500');
    assert.equal(sanitizeColor('#fff'), '#FF4500');
});
