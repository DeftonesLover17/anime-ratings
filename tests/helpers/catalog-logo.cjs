const assert = require('node:assert/strict');

async function verifyCatalogLogoPersistence(send, cookie) {
    const save = async anime => {
        const response = await send('/api/admin/animes', { anime }, cookie);
        assert.equal(response.status, 200);
        return (await response.json()).anime;
    };
    const initial = await save({ title: 'Logo persistence fixture', logoUrl: 'https://example.invalid/old-logo.png' });
    assert.equal(initial.logoUrl, 'https://example.invalid/old-logo.png');
    const unchanged = await save({ id: initial.id, title: initial.title });
    assert.equal(unchanged.logoUrl, initial.logoUrl);
    const removed = await save({ id: initial.id, title: initial.title, logoUrl: '', logoDisabled: true });
    assert.equal(removed.logoUrl, '');
    assert.equal(removed.logoDisabled, true);
    const state = await (await send('/api/get-state')).json();
    const stored = state.animes.find(anime => anime.id === initial.id);
    assert.equal(stored.logoUrl, '');
    assert.equal(stored.logoDisabled, true);
    const invalid = await send('/api/admin/animes', { anime: { id: initial.id, title: initial.title, logoDisabled: 'false' } }, cookie);
    assert.equal(invalid.status, 400);
}

module.exports = { verifyCatalogLogoPersistence };
