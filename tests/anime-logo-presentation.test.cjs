const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_ANIMES } = require('../frontend/catalog/default-animes');
const { imageUrl } = require('../frontend/shared/dom');
const {
    ANIME_LOGO_CATALOG,
    resolveAnimeLogo,
    computeLogoOpticalMetrics,
    toWeservClearlogoUrl
} = require('../frontend/site/anime-logo-presentation');
const { discoverAnimeLogo } = require('../frontend/catalog/logo-discovery');
const policy = require('../shared/security/policy');
const responses = require('../shared/security/responses');

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
    assert.equal(swordsmith.url, 'logos/animes/demon-slayer-swordsmith-village-arc.png');
    assert.equal(swordsmith.tier, 'emblem');

    const entertainmentDistrict = resolveAnimeLogo({
        id: 'a_1792962014649_q27neh',
        title: 'Demon Slayer: Kimetsu no Yaiba Entertainment District Arc'
    });
    assert.ok(entertainmentDistrict);
    assert.equal(entertainmentDistrict.url, 'logos/animes/demon-slayer-entertainment-district-arc.png');

    const hashiraTraining = resolveAnimeLogo({
        id: 'a_1792963451393_r7ztva',
        title: 'Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc'
    });
    assert.ok(hashiraTraining);
    assert.equal(hashiraTraining.url, 'logos/animes/demon-slayer-hashira-training-arc.png');

    const aotS2 = resolveAnimeLogo({
        id: 'a_1780115319837',
        title: 'Attack on Titan Season 2'
    });
    assert.ok(aotS2);
    assert.equal(aotS2.url, 'logos/animes/attack-on-titan-season-2.png');

    const aotS3 = resolveAnimeLogo({
        id: 'a_1780116042599',
        title: 'Attack on Titan Season 3'
    });
    assert.ok(aotS3);
    assert.equal(aotS3.url, 'logos/animes/attack-on-titan-season-3.png');

    const aotFinal = resolveAnimeLogo({
        id: 'a_1792902450694_03j4go',
        title: 'Attack on Titan: The Final Season'
    });
    assert.ok(aotFinal);
    assert.equal(aotFinal.url, 'logos/animes/attack-on-titan-the-final-season.png');

    const soloLevelingS2 = resolveAnimeLogo({
        id: 'a2',
        title: 'Solo Leveling: Season 2 -Arise from the Shadow-'
    });
    assert.ok(soloLevelingS2);
    assert.equal(soloLevelingS2.url, 'logos/animes/solo-leveling-season-2.png');

    const windBreakerS2 = resolveAnimeLogo({
        id: 'a4',
        title: 'Wind Breaker Season 2'
    });
    assert.ok(windBreakerS2);
    assert.equal(windBreakerS2.url, 'logos/animes/wind-breaker-season-2.png');

    const jjkS2 = resolveAnimeLogo({
        id: 'a20_s2',
        title: 'Jujutsu Kaisen Temporada 2: Hidden Inventory / Premature Death • Shibuya Incident'
    });
    assert.ok(jjkS2);
    assert.equal(jjkS2.url, 'logos/animes/jujutsu-kaisen-season-2.png');

    const jjkS3 = resolveAnimeLogo({
        id: 'a20_s3',
        title: 'Jujutsu Kaisen Temporada 3: The Culling Game'
    });
    assert.ok(jjkS3);
    assert.equal(jjkS3.url, 'logos/animes/jujutsu-kaisen-season-3.png');

    const jojoPart3 = resolveAnimeLogo({
        id: 'a51',
        title: "JoJo's Bizarre Adventure: Stardust Crusaders"
    });
    assert.ok(jojoPart3);
    assert.equal(jojoPart3.url, 'logos/animes/jojos-bizarre-adventure-stardust-crusaders.png');

    const vanitasPart2 = resolveAnimeLogo({
        id: 'a_1779980415391',
        title: 'The Case Study of Vanitas Part 2'
    });
    assert.ok(vanitasPart2);
    assert.equal(vanitasPart2.url, 'logos/animes/the-case-study-of-vanitas-part-2.png');

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

test('discoverAnimeLogo and resolveAnimeLogo support newly added animes automatically', async () => {
    // 1. Exact catalog match returns local clearlogo immediately without external calls
    let networkCalled = false;
    const catalogUrl = await discoverAnimeLogo(
        { title: 'Steins;Gate 0' },
        {
            request: async () => {
                networkCalled = true;
                return { ok: false };
            }
        }
    );
    assert.equal(catalogUrl, 'logos/animes/steins-gate-0.png');
    assert.equal(networkCalled, false);

    // 2. Newly added anime resolves via ani.zip mappings -> IMDb ID -> Metahub + Weserv clearlogo
    const oshiNoKoTarget = {
        id: 'a_new_oshinoko',
        title: 'Oshi no Ko',
        japaneseTitle: '【推しの子】',
        malId: 52034
    };
    const expectedMetahubWeserv = toWeservClearlogoUrl('https://images.metahub.space/logo/medium/tt21030032/img');

    const discoveredOshi = await discoverAnimeLogo(oshiNoKoTarget, {
        request: async (url) => {
            if (String(url).includes('api.ani.zip/mappings?mal_id=52034')) {
                return {
                    ok: true,
                    json: async () => ({
                        titles: { en: 'Oshi No Ko' },
                        mappings: { imdb_id: 'tt21030032' },
                        images: []
                    })
                };
            }
            return { ok: false, json: async () => ({}) };
        },
        probeImage: async (candidateUrl) => {
            assert.equal(candidateUrl, expectedMetahubWeserv);
            return { width: 520, height: 158 };
        }
    });

    assert.equal(discoveredOshi, expectedMetahubWeserv);
    assert.equal(oshiNoKoTarget.logoUrl, undefined);

    const resolvedOshi = resolveAnimeLogo({ ...oshiNoKoTarget, logoUrl: discoveredOshi });
    assert.ok(resolvedOshi);
    assert.equal(resolvedOshi.url, expectedMetahubWeserv);
    assert.equal(resolvedOshi.width, 520);
    assert.equal(resolvedOshi.height, 158);
    assert.equal(resolvedOshi.tier, 'standard');

    // 3. Cinemeta fallback when ani.zip has no mapping
    const blueLockTarget = {
        id: 'a_new_bluelock',
        title: 'Blue Lock',
        japaneseTitle: 'ブルーロック'
    };
    const expectedBlueLockWeserv = toWeservClearlogoUrl('https://images.metahub.space/logo/medium/tt15222080/img');

    const discoveredBlueLock = await discoverAnimeLogo(blueLockTarget, {
        request: async (url) => {
            const u = String(url);
            if (u.includes('v3-cinemeta.strem.io/catalog/series/top/search=')) {
                return {
                    ok: true,
                    json: async () => ({
                        metas: [{ id: 'tt15222080', name: 'Blue Lock' }]
                    })
                };
            }
            return { ok: false, json: async () => ({}) };
        },
        probeImage: async (candidateUrl) => {
            if (candidateUrl === expectedBlueLockWeserv) {
                return { width: 500, height: 185 };
            }
            return null;
        }
    });

    assert.equal(discoveredBlueLock, expectedBlueLockWeserv);
    const resolvedBlueLock = resolveAnimeLogo({ ...blueLockTarget, logoUrl: discoveredBlueLock });
    assert.ok(resolvedBlueLock);
    assert.equal(resolvedBlueLock.url, expectedBlueLockWeserv);
    assert.equal(resolvedBlueLock.tier, 'stacked');

    // 4. Security policy and response sanitizer accept and preserve logoUrl
    assert.equal(
        policy.catalogAnimeError({
            title: 'Blue Lock',
            logoUrl: expectedBlueLockWeserv
        }),
        ''
    );
    const projected = responses.animeResponse({
        id: 'a_new_bluelock',
        title: 'Blue Lock',
        logoUrl: expectedBlueLockWeserv
    });
    assert.equal(projected.logoUrl, expectedBlueLockWeserv);

    // 5. Optical tier classification matches CSS data-logo-tier values
    assert.equal(computeLogoOpticalMetrics(560, 80).tier, 'wide');
    assert.equal(computeLogoOpticalMetrics(520, 120).tier, 'standard');
    assert.equal(computeLogoOpticalMetrics(420, 210).tier, 'stacked');
    assert.equal(computeLogoOpticalMetrics(240, 200).tier, 'emblem');
});
