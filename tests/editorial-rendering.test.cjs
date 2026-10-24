const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, imageUrl } = require('../frontend/shared/dom');

test('legacy entities display as text without permitting HTML injection', () => {
    assert.equal(escapeHtml('Vivy Eye&#39;s Song'), 'Vivy Eye&#39;s Song');
    assert.equal(escapeHtml('&amp;#39;'), '&#39;');
    assert.equal(
        escapeHtml('&lt;img src=x onerror=alert(1)&gt;'),
        '&lt;img src=x onerror=alert(1)&gt;',
    );
    assert.equal(escapeHtml('" onmouseover="x'), '&quot; onmouseover=&quot;x');
});

test('media URLs reject executable schemes while preserving actual catalog assets', () => {
    assert.equal(imageUrl('javascript:alert(1)'), '');
    assert.equal(imageUrl('covers/a25.jpg'), 'covers/a25.jpg');
    assert.equal(
        imageUrl('https://cdn.example.org/poster.webp'),
        'https://cdn.example.org/poster.webp',
    );
});
