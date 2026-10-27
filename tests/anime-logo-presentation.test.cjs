const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_ANIMES } = require('../frontend/catalog/default-animes');
const { imageUrl } = require('../frontend/shared/dom');
const {
    ANIME_LOGO_CATALOG,
    resolveAnimeLogo
} = require('../frontend/site/anime-logo-presentation');

test('every anime logo catalog entry exists on disk with valid optical metrics', () => {
    assert.ok(ANIME_LOGO_CATALOG.length >= 79);
    const validTiers = new Set(['emblem', 'stacked', 'standard', 'wide']);
    for (const entry of ANIME_LOGO_CATALOG) {
        assert.match(entry.url, /^logos\/animes\/[a-z0-9-]+\.png$/);
        const absPath = path.join(__dirname, '..', entry.url);
        assert.ok(fs.existsSync(absPath), `Missing logo file: ${entry.url}`);
        assert.ok(entry.width > 50, `Invalid width for ${entry.slug}`);
        assert.ok(entry.height > 20, `Invalid height for ${entry.slug}`);
        assert.ok(validTiers.has(entry.tier), `Invalid tier for ${entry.slug}: ${entry.tier}`);
        assert.equal(imageUrl(entry.url), entry.url);
    }
});

test('all default catalog animes and multi-season titles resolve to an English clearlogo', () => {
    for (const anime of DEFAULT_ANIMES) {
        const resolved = resolveAnimeLogo(anime);
        assert.ok(resolved, `Expected logo for default anime ${anime.id} (${anime.title})`);
        assert.match(resolved.url, /^logos\/animes\/[a-z0-9-]+\.png$/);
    }

    const swordsmith = resolveAnimeLogo({
        id: 'a_1792963328611_emx3o5',
        title: 'Demon Slayer: Kimetsu no Yaiba - Swordsmith Village Arc'
    });
    assert.ok(swordsmith);
    assert.equal(swordsmith.url, 'logos/animes/demon-slayer-kimetsu-no-yaiba.png');
    assert.equal(swordsmith.tier, 'emblem');

    const monster = resolveAnimeLogo({
        id: 'a29',
        title: 'Monster'
    });
    assert.ok(monster);
    assert.equal(monster.url, 'logos/animes/monster.png');
    assert.equal(monster.lightTone, true);

    const cyberpunk2 = resolveAnimeLogo({
        id: 'a_1792804514219_dusez7',
        title: 'CYBERPUNK: EDGERUNNERS II'
    });
    assert.ok(cyberpunk2);
    assert.equal(cyberpunk2.url, 'logos/animes/cyberpunk-edgerunners-ii.png');
});
