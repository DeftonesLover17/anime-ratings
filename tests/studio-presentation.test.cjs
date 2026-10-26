const test = require('node:test');
const assert = require('node:assert/strict');
const studios = require('../frontend/site/studio-presentation');

test('studio presentation resolves local logo aliases and keeps descriptions', () => {
    assert.equal(studios.findLogoInMap('p.a works', studios.STUDIO_LOGOS), 'logos/p_a_works.png');
    assert.equal(studios.findLogoInMap('Tokyo Movie Shinsha', studios.STUDIO_LOGOS), 'logos/tokyo_movie_shinsha.png');
    assert.match(studios.getStudioDescription('Trigger', [{ title: 'Cyberpunk: Edgerunners II' }]), /Cyberpunk: Edgerunners II/);
    assert.equal(studios.STUDIO_BRAND_COLORS.Trigger.text, '#e63946');
});

test('studio presentation only accepts the existing safe logo URL formats', () => {
    assert.equal(studios.sanitizeStudioLogoUrl('logos/trigger.png'), 'logos/trigger.png');
    assert.equal(studios.sanitizeStudioLogoUrl('https://example.com/trigger.png'), 'https://example.com/trigger.png');
    assert.equal(studios.sanitizeStudioLogoUrl('javascript:alert(1)'), '');
});
