const normalizeAnimeSearchText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

function scoreAnimeRelevance(anime, rawQuery) {
    const q = normalizeAnimeSearchText(rawQuery);
    const tEn = normalizeAnimeSearchText(anime.title_english || '');
    const tJp = normalizeAnimeSearchText(anime.title || '');
    const allText = tEn + ' ' + tJp;

    let pts = 0;
    const qHasPart1 = /\b(part|parte)\s*1\b/.test(q);
    const qHasPart2 = /\b(part|parte)\s*2\b/.test(q);
    const qHasPart3 = /\b(part|parte)\s*3\b/.test(q) || q.includes('kanketsu') || q.includes('final chapters');
    const qHasFinal = q.includes('final season') || q.includes('temporada final') || q.includes('season 4') || q.includes('temporada 4');

    // Exact query match boost
    if (tEn === q || tJp === q) pts += 500;

    // Specific Part matching
    if (qHasPart2) {
        if (/\b(part|parte)\s*2\b/.test(allText)) pts += 450;
        else pts -= 200;
    }
    if (qHasPart1) {
        if (/\b(part|parte)\s*1\b/.test(allText) || (!allText.includes('part') && allText.includes('final season'))) pts += 350;
        if (/\b(part|parte)\s*2\b/.test(allText)) pts -= 250;
    }
    if (qHasPart3) {
        if (allText.includes('kanketsu') || allText.includes('final chapters') || /\b(part|parte)\s*3\b/.test(allText)) pts += 450;
    }

    // Final season matching
    if (qHasFinal) {
        if (allText.includes('final season') || allText.includes('the final season')) pts += 350;
        if (allText.includes('season 3') || allText.includes('season 2') || allText.includes('season 1')) pts -= 300;
    }

    // Substring inclusion
    const words = q.split(' ').filter(w => w.length > 2);
    words.forEach(w => {
        if (allText.includes(w)) pts += 30;
    });

    // Score bonus
    if (anime.score && !isNaN(anime.score)) {
        pts += Math.min(25, Number(anime.score) * 2.5);
    }

    return pts;
}

function initCatalogAutocomplete({ document, studioMetadata, standardStudioName, escapeHtml, getStudioLogo, updateCatalogLivePreview,
    request = fetch, setTimer = setTimeout, clearTimer = clearTimeout }) {
    // --- MYANIMELIST AUTOCOMPLETE SEARCH (JIKAN API) ---
    const animeTitleInput = document.getElementById('form-anime-title');
    const suggestionsBox = document.getElementById('form-anime-suggestions');
    let searchDebounceTimeout = null;
    let searchGeneration = 0;

    if (animeTitleInput && suggestionsBox) {
        // Translation helper for seasons
        const translateSeason = (season, year) => {
            if (!season) return year ? String(year) : '';
            const trans = {
                'spring': 'Primavera',
                'summer': 'Verão',
                'fall': 'Outono',
                'winter': 'Inverno'
            };
            const ptSeason = trans[season.toLowerCase()] || season;
            return year ? `${ptSeason} ${year}` : ptSeason;
        };

        const addAnimeSearchQuery = (queries, value) => {
            const cleanValue = String(value || '').replace(/\s+/g, ' ').trim();
            if (!cleanValue) return;
            const key = cleanValue.toLowerCase();
            if (!queries.some(query => query.toLowerCase() === key)) queries.push(cleanValue);
        };

        const buildAnimeSearchQueries = (query) => {
            const queries = [];
            const normalized = normalizeAnimeSearchText(query);
            const isAttackOnTitan = normalized.includes('attack on titan') ||
                normalized.includes('attack titan') ||
                normalized.includes('shingeki no kyojin') ||
                normalized.includes('shingeki') ||
                /\baot\b/.test(normalized) ||
                /\bsnk\b/.test(normalized);
            const wantsFinalSeason = normalized.includes('final season') ||
                normalized.includes('temporada final') ||
                normalized.includes('ultima temporada') ||
                normalized.includes('season 4') ||
                normalized.includes('4 temporada') ||
                normalized.includes('temporada 4') ||
                normalized.includes('kanketsu') ||
                normalized.includes('capitulos finais') ||
                normalized.includes('parte final');
            const wantsPartOne = /\b(part|parte)\s*1\b/.test(normalized);
            const wantsPartTwo = /\b(part|parte)\s*2\b/.test(normalized);
            const wantsFinalChapters = /\b(part|parte)\s*3\b/.test(normalized) ||
                normalized.includes('final chapters') ||
                normalized.includes('capitulos finais') ||
                normalized.includes('parte final') ||
                normalized.includes('kanketsu');

            if (isAttackOnTitan && wantsFinalSeason) {
                if (wantsPartOne) addAnimeSearchQuery(queries, 'Shingeki no Kyojin: The Final Season');
                if (wantsPartTwo) addAnimeSearchQuery(queries, 'Shingeki no Kyojin: The Final Season Part 2');
                if (wantsFinalChapters) addAnimeSearchQuery(queries, 'Shingeki no Kyojin: The Final Season - Kanketsu-hen');
                addAnimeSearchQuery(queries, 'Attack on Titan Final Season');
            }

            const asciiQuery = String(query || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const translatedQuery = asciiQuery
                .replace(/\btemporada\s+final\b/gi, 'Final Season')
                .replace(/\bultima\s+temporada\b/gi, 'Final Season')
                .replace(/\bparte\b/gi, 'Part')
                .replace(/\bcapitulos\s+finais\b/gi, 'Final Chapters')
                .replace(/\bfinal\s+chapters\b/gi, 'Final Chapters');

            addAnimeSearchQuery(queries, translatedQuery);
            addAnimeSearchQuery(queries, query);
            return queries.slice(0, 4);
        };

        const getPinnedAnimeIdsForSearch = (query) => {
            const normalized = normalizeAnimeSearchText(query);
            const isAttackOnTitan = normalized.includes('attack on titan') ||
                normalized.includes('attack titan') ||
                normalized.includes('shingeki no kyojin') ||
                normalized.includes('shingeki') ||
                /\baot\b/.test(normalized) ||
                /\bsnk\b/.test(normalized);
            const wantsFinalSeason = normalized.includes('final season') ||
                normalized.includes('temporada final') ||
                normalized.includes('ultima temporada') ||
                normalized.includes('season 4') ||
                normalized.includes('4 temporada') ||
                normalized.includes('temporada 4') ||
                normalized.includes('kanketsu') ||
                normalized.includes('capitulos finais') ||
                normalized.includes('parte final');
            const wantsPartTwo = /\b(part|parte)\s*2\b/.test(normalized);
            const wantsFinalChapters = /\b(part|parte)\s*3\b/.test(normalized) ||
                normalized.includes('final chapters') ||
                normalized.includes('capitulos finais') ||
                normalized.includes('parte final') ||
                normalized.includes('kanketsu');

            if (!isAttackOnTitan || !wantsFinalSeason) return [];
            if (wantsPartTwo) return [48583, 40028, 51535];
            if (wantsFinalChapters) return [51535, 40028, 48583];
            return [40028, 48583, 51535];
        };

        function getStudioFallbackByTitle(title) {
            const confirmed = studioMetadata.verifiedStudio(title);
            if (confirmed) return confirmed;
            const clean = String(title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            if (!clean) return '';
            const fallbacks = {
                'supernouradeyanisuufutari': 'Asahi Production',
                'smokingbehindthesupermarketwithyou': 'Asahi Production',
                'supermarketwithyou': 'Asahi Production',
                'oshinoko': 'Doga Kobo',
                'sololeveling': 'A-1 Pictures',
                'dandadan': 'Science Saru',
                'sakamotodays': 'TMS Entertainment',
                'windbreaker': 'CloverWorks',
                'frieren': 'Madhouse',
                'frierentoys': 'Madhouse',
                'frierenthejourneyends': 'Madhouse',
                'sousounofrieren': 'Madhouse',
                'kaijuno8': 'Production I.G',
                'kaijuu8': 'Production I.G',
                'gushingovermagicalgirls': 'Asahi Production',
                'mahoakono': 'Asahi Production',
                'mahoushoujoakogarete': 'Asahi Production',
                'alyasometimeshidesherfeelingsinrussian': 'Doga Kobo',
                'roshidere': 'Doga Kobo',
                'toomanylosingheroines': 'A-1 Pictures',
                'makeine': 'A-1 Pictures',
                'elusivesamurai': 'CloverWorks',
                'failureframe': 'Seven Arcs',
                'monogatariseries': 'Shaft',
                'sengokuyouko': 'White Fox'
            };
            if (fallbacks[clean]) return fallbacks[clean];
            for (const [key, studio] of Object.entries(fallbacks)) {
                if (clean.includes(key) || key.includes(clean)) return studio;
            }
            return '';
        }

        const fetchWithTimeout = async (url, timeoutMs = 3200) => {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? setTimer(() => controller.abort(), timeoutMs) : null;
            try {
                const response = await request(url, controller ? { signal: controller.signal } : {});
                if (timer) clearTimer(timer);
                return response;
            } catch (err) {
                if (timer) clearTimer(timer);
                throw err;
            }
        };

        const CANONICAL_SEARCH_CATALOG = [
            {
                mal_id: 48583,
                title: 'Shingeki no Kyojin: The Final Season Part 2',
                title_english: 'Attack on Titan: The Final Season Part 2',
                title_japanese: '進撃の巨人 The Final Season Part 2',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1988/119963l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1988/119963l.jpg' }
                },
                type: 'TV',
                episodes: 12,
                year: 2022,
                season: 'winter',
                score: 8.8,
                studios: [{ name: 'MAPPA' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'Virando-se contra seus antigos aliados e inimigos, Eren Yeager coloca em prática um plano devastador. Sob a liderança do Titã Fundador, o avanço colossal ameaça varrer toda a civilização além das muralhas de Paradis.'
            },
            {
                mal_id: 40028,
                title: 'Shingeki no Kyojin: The Final Season',
                title_english: 'Attack on Titan: The Final Season',
                title_japanese: '進撃の巨人 The Final Season',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1000/110531l.jpg' }
                },
                type: 'TV',
                episodes: 16,
                year: 2020,
                season: 'fall',
                score: 8.8,
                studios: [{ name: 'MAPPA' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'Gabi Braun e Falco Grice treinaram suas vidas inteiras para herdar um dos Titãs sob o controle de Marley. Enquanto as tensões com Paradis chegam ao ápice, uma nova e mortal guerra se inicia.'
            },
            {
                mal_id: 51535,
                title: 'Shingeki no Kyojin: The Final Season - Kanketsu-hen',
                title_english: 'Attack on Titan: The Final Season - The Final Chapters',
                title_japanese: '進撃の巨人 The Final Season 完結編',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1279/131078l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1279/131078l.jpg' }
                },
                type: 'TV',
                episodes: 2,
                year: 2023,
                season: 'spring',
                score: 8.9,
                studios: [{ name: 'MAPPA' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'O Rugido da Terra avança implacável em direção a Marley, esmagando incontáveis vidas sob os passos dos Titãs Colossais. Mikasa, Armin e seus aliados restantes reúnem as últimas forças para tentar deter Eren.'
            },
            {
                mal_id: 38524,
                title: 'Shingeki no Kyojin Season 3 Part 2',
                title_english: 'Attack on Titan Season 3 Part 2',
                title_japanese: '進撃の巨人 Season 3 Part 2',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg' }
                },
                type: 'TV',
                episodes: 10,
                year: 2019,
                season: 'spring',
                score: 9.0,
                studios: [{ name: 'Wit Studio' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'Buscando recuperar a Muralha Maria e descobrir a verdade oculta no porão da família Yeager, a Divisão de Reconhecimento parte para o Distrito de Shiganshina.'
            },
            {
                mal_id: 35760,
                title: 'Shingeki no Kyojin Season 3',
                title_english: 'Attack on Titan Season 3',
                title_japanese: '進撃の巨人 Season 3',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1173/92110l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1173/92110l.jpg' }
                },
                type: 'TV',
                episodes: 12,
                year: 2018,
                season: 'summer',
                score: 8.6,
                studios: [{ name: 'Wit Studio' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'A Divisão de Reconhecimento enfrenta agora uma ameaça humana interna vinda da Polícia Militar e do governo secreto que governa as muralhas.'
            },
            {
                mal_id: 25777,
                title: 'Shingeki no Kyojin Season 2',
                title_english: 'Attack on Titan Season 2',
                title_japanese: '進撃の巨人 Season 2',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/4/84177l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/4/84177l.jpg' }
                },
                type: 'TV',
                episodes: 12,
                year: 2017,
                season: 'spring',
                score: 8.5,
                studios: [{ name: 'Wit Studio' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'Com a quebra misteriosa da Muralha Rose e a revelação de traidores dentro de suas próprias fileiras, o Corpo de Exploração é levado ao limite.'
            },
            {
                mal_id: 16498,
                title: 'Shingeki no Kyojin',
                title_english: 'Attack on Titan',
                title_japanese: '進撃の巨人',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg' }
                },
                type: 'TV',
                episodes: 25,
                year: 2013,
                season: 'spring',
                score: 8.5,
                studios: [{ name: 'Wit Studio' }],
                genres: [{ name: 'Ação' }, { name: 'Drama' }, { name: 'Fantasia' }, { name: 'Militar' }],
                synopsis: 'Após testemunhar a destruição de sua cidade natal e a morte de sua mãe por um Titã, Eren Yeager jura erradicar todos os Titãs da face da Terra.'
            },
            {
                mal_id: 40456,
                title: 'Kimetsu no Yaiba Movie: Mugen Ressha-hen',
                title_english: 'Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train',
                title_japanese: '劇場版 鬼滅の刃 無限列車編',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1704/106947l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1704/106947l.jpg' }
                },
                type: 'Filme',
                episodes: 1,
                year: 2020,
                season: 'fall',
                score: 8.6,
                studios: [{ name: 'ufotable' }],
                genres: [{ name: 'Ação' }, { name: 'Fantasia' }, { name: 'Histórico' }],
                synopsis: 'Tanjiro, Nezuko, Zenitsu e Inosuke juntam-se ao Hashira das Chamas, Kyojuro Rengoku, a bordo do misterioso Trem Infinito.'
            },
            {
                mal_id: 47778,
                title: 'Kimetsu no Yaiba: Yuukaku-hen',
                title_english: 'Demon Slayer: Kimetsu no Yaiba Entertainment District Arc',
                title_japanese: '鬼滅の刃 遊郭編',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1908/120036l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1908/120036l.jpg' }
                },
                type: 'TV',
                episodes: 11,
                year: 2021,
                season: 'winter',
                score: 8.8,
                studios: [{ name: 'ufotable' }],
                genres: [{ name: 'Ação' }, { name: 'Fantasia' }, { name: 'Histórico' }],
                synopsis: 'Acompanhados pelo extravagante Hashira do Som, Tengen Uzui, os Caçadores de Onis infiltram-se no radiante Distrito da Luz Vermelha.'
            },
            {
                mal_id: 51009,
                title: 'Jujutsu Kaisen 2nd Season',
                title_english: 'Jujutsu Kaisen Season 2',
                title_japanese: '呪術廻戦 懐玉・玉折 / 渋谷事変',
                images: {
                    webp: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1792/138022l.jpg' },
                    jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/1792/138022l.jpg' }
                },
                type: 'TV',
                episodes: 23,
                year: 2023,
                season: 'summer',
                score: 8.8,
                studios: [{ name: 'MAPPA' }],
                genres: [{ name: 'Ação' }, { name: 'Sobrenatural' }],
                synopsis: 'A narrativa explora o passado de Satoru Gojo e Suguru Geto durante seus dias de escola, culminando no desastroso e épico Incidente de Shibuya.'
            }
        ];

        const fetchAnimeMAL = async (query) => {
            const response = await fetchWithTimeout(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`, 3000);
            if (!response.ok) throw new Error('API request failed');
            const json = await response.json();
            const list = json.data || [];
            list.forEach(anime => {
                if ((!anime.studios || anime.studios.length === 0) && anime.title) {
                    const fb = getStudioFallbackByTitle(anime.title) || getStudioFallbackByTitle(anime.title_english) || getStudioFallbackByTitle(anime.title_japanese);
                    if (fb) anime.studios = [{ name: fb }];
                }
            });
            return list;
        };

        const fetchAnimeMALById = async (malId) => {
            const response = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${malId}`, 2800);
            if (!response.ok) throw new Error('API request failed');
            const json = await response.json();
            const anime = json.data || null;
            if (anime && (!anime.studios || anime.studios.length === 0) && anime.title) {
                const fb = getStudioFallbackByTitle(anime.title) || getStudioFallbackByTitle(anime.title_english) || getStudioFallbackByTitle(anime.title_japanese);
                if (fb) anime.studios = [{ name: fb }];
            }
            return anime;
        };

        const fetchAnimeKitsu = async (query) => {
            try {
                const response = await fetchWithTimeout(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=10&include=animeProductions.producer,genres`, 3500);
                if (!response.ok) throw new Error('Kitsu request failed');
                const json = await response.json();

                const included = json.included || [];
                const findIncluded = (type, id) => included.find(item => item && item.type === type && String(item.id) === String(id));

                const data = json.data || [];
                return data.map(anime => {
                    const attrs = anime.attributes || {};
                    const titleEnglish = attrs.titles?.en || attrs.canonicalTitle || '';
                    const titleJapanese = attrs.titles?.ja_jp || attrs.titles?.ja || '';
                    const titleCanonical = attrs.canonicalTitle || attrs.titles?.en_jp || '';
                    const year = attrs.startDate ? new Date(attrs.startDate).getFullYear() : '';

                    let season = undefined;
                    if (attrs.startDate) {
                        const month = new Date(attrs.startDate).getMonth();
                        if (month >= 0 && month <= 2) season = 'winter';
                        else if (month >= 3 && month <= 5) season = 'spring';
                        else if (month >= 6 && month <= 8) season = 'summer';
                        else if (month >= 9 && month <= 11) season = 'fall';
                    }

                    const genres = [];
                    const genreRefs = anime.relationships?.genres?.data || [];
                    genreRefs.forEach(ref => {
                        const g = findIncluded('genres', ref.id);
                        if (g && g.attributes?.name) {
                            genres.push({ name: g.attributes.name });
                        }
                    });

                    let studioName = studioMetadata.kitsuStudio(anime, included);

                    if (!studioName || studioName.toLowerCase() === 'desconhecido') {
                        const fb = getStudioFallbackByTitle(titleCanonical) || getStudioFallbackByTitle(titleEnglish) || getStudioFallbackByTitle(titleJapanese);
                        if (fb) studioName = fb;
                    }

                    return {
                        mal_id: 'kitsu_' + anime.id,
                        title: titleCanonical,
                        title_english: titleEnglish,
                        title_japanese: titleJapanese,
                        images: {
                            webp: {
                                large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || ''
                            },
                            jpg: {
                                large_image_url: attrs.posterImage?.large || attrs.posterImage?.original || ''
                            }
                        },
                        type: attrs.showType ? attrs.showType.toUpperCase() : 'TV',
                        episodes: attrs.episodeCount || 0,
                        year: year,
                        season: season,
                        aired: {
                            prop: {
                                from: {
                                    year: year
                                }
                            }
                        },
                        studios: studioName ? [{ name: studioName }] : [],
                        genres: genres,
                        synopsis: attrs.synopsis || '',
                        score: attrs.averageRating ? parseFloat((parseFloat(attrs.averageRating) / 10).toFixed(1)) : null,
                        isKitsu: true,
                        kitsuId: anime.id
                    };
                });
            } catch (err) {
                console.error('Kitsu search failed:', err);
                return [];
            }
        };

        // Intelligent resilient multi-provider search (Canonical + Jikan + Kitsu with Relevance Sorting)
        const searchAnimeMAL = async (query) => {
            try {
                const seen = new Set();
                const mergedResults = [];
                const addResult = (anime) => {
                    if (!anime) return;
                    const key = anime.mal_id || anime.kitsuId || `${anime.title}-${anime.title_english}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        mergedResults.push(anime);
                    }
                };

                // 1. Instant match from verified canonical catalog
                const normQuery = normalizeAnimeSearchText(query);
                const queryWords = normQuery.split(' ').filter(w => w.length > 2);
                CANONICAL_SEARCH_CATALOG.forEach(item => {
                    const fullText = normalizeAnimeSearchText((item.title_english || '') + ' ' + (item.title || '') + ' ' + (item.title_japanese || ''));
                    if (queryWords.some(w => fullText.includes(w))) {
                        addResult(item);
                    }
                });

                // 2. Fetch live Jikan and Kitsu in parallel
                const queries = buildAnimeSearchQueries(query);
                const pinnedIds = getPinnedAnimeIdsForSearch(query);

                const jikanTasks = [
                    ...pinnedIds.map(id => fetchAnimeMALById(id).catch(() => null)),
                    ...queries.map(q => fetchAnimeMAL(q).catch(() => []))
                ];

                const kitsuTasks = [
                    fetchAnimeKitsu(query).catch(() => []),
                    ...(queries[0] && queries[0] !== query ? [fetchAnimeKitsu(queries[0]).catch(() => [])] : [])
                ];

                const [jikanOutputs, kitsuOutputs] = await Promise.all([
                    Promise.allSettled(jikanTasks),
                    Promise.allSettled(kitsuTasks)
                ]);

                jikanOutputs.forEach(r => {
                    if (r.status === 'fulfilled' && r.value) {
                        if (Array.isArray(r.value)) r.value.forEach(addResult);
                        else addResult(r.value);
                    }
                });

                kitsuOutputs.forEach(r => {
                    if (r.status === 'fulfilled' && r.value && Array.isArray(r.value)) {
                        r.value.forEach(addResult);
                    }
                });

                // 3. Smart Relevance Re-ranking
                mergedResults.sort((a, b) => scoreAnimeRelevance(b, query) - scoreAnimeRelevance(a, query));

                return mergedResults.slice(0, 12);
            } catch (e) {
                console.error('Error fetching anime search:', e);
                return CANONICAL_SEARCH_CATALOG.filter(c => scoreAnimeRelevance(c, query) > 0).slice(0, 10);
            }
        };

        let activeSuggestionIndex = -1;

        const updateActiveSuggestion = (items) => {
            items.forEach((item, idx) => {
                if (idx === activeSuggestionIndex) {
                    item.classList.add('is-active');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('is-active');
                }
            });
        };

        // Render search results dropdown
        const renderSuggestions = (results, query = '') => {
            activeSuggestionIndex = -1;
            suggestionsBox.innerHTML = '';

            if (results.length === 0) {
                suggestionsBox.innerHTML = `
                    <div class="av-sug-container">
                        <div class="av-sug-header">
                            <div class="av-sug-header-left">
                                <span class="av-sug-radar-dot"></span>
                                <span class="av-sug-header-label">CATÁLOGO GLOBAL</span>
                                <span class="av-sug-header-divider">/</span>
                                <span class="av-sug-header-source">MYANIMELIST & KITSU</span>
                            </div>
                            <div class="av-sug-header-right">
                                <span class="av-sug-count-badge">0 resultados</span>
                            </div>
                        </div>
                        <div class="av-sug-empty-state">
                            <div class="av-sug-empty-icon-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="av-sug-empty-svg">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="m21 21-4.35-4.35"/>
                                    <path d="M8 8l6 6M14 8l-6 6"/>
                                </svg>
                            </div>
                            <div class="av-sug-empty-title">Nenhuma obra localizada para &ldquo;${escapeHtml(query)}&rdquo;</div>
                            <p class="av-sug-empty-desc">Não encontramos correspondências diretas no MyAnimeList ou Kitsu. Tente pesquisar pelo título em inglês ou japonês romanizado.</p>
                            <button type="button" class="av-sug-manual-btn" id="sug-fill-manual">
                                <span>Preencher campos manualmente</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-sug-arrow"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                            </button>
                        </div>
                        <div class="av-sug-footer">
                            <div class="av-sug-shortcuts">
                                <kbd class="av-sug-kbd">ESC</kbd>
                                <span class="av-sug-kbd-label">Fechar sugestões</span>
                            </div>
                        </div>
                    </div>
                `;

                const manualBtn = document.getElementById('sug-fill-manual');
                if (manualBtn) {
                    manualBtn.addEventListener('click', () => {
                        suggestionsBox.classList.add('hidden');
                        document.getElementById('form-anime-jp-title')?.focus();
                    });
                }
                return;
            }

            const container = document.createElement('div');
            container.className = 'av-sug-container';

            // 1. Header
            const header = document.createElement('div');
            header.className = 'av-sug-header';
            header.innerHTML = `
                <div class="av-sug-header-left">
                    <span class="av-sug-radar-dot av-sug-radar-active"></span>
                    <span class="av-sug-header-label">CATÁLOGO GLOBAL</span>
                    <span class="av-sug-header-divider">/</span>
                    <span class="av-sug-header-source">MYANIMELIST & KITSU</span>
                </div>
                <div class="av-sug-header-right">
                    <span class="av-sug-count-badge">${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}</span>
                </div>
            `;
            container.appendChild(header);

            // 2. List
            const list = document.createElement('div');
            list.className = 'av-sug-list';
            list.setAttribute('role', 'listbox');

            results.forEach((anime, index) => {
                const title = anime.title_english || anime.title;
                const jpTitle = anime.title_japanese || (anime.title_english && anime.title !== anime.title_english ? anime.title : '');
                const image = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '';
                const type = anime.type || 'TV';
                const eps = anime.episodes ? (parseInt(anime.episodes) === 1 ? 'Filme' : `${anime.episodes} eps`) : '? eps';
                const year = anime.year || (anime.aired?.prop?.from?.year) || '';
                const score = anime.score || (anime.attributes?.averageRating ? parseFloat((parseFloat(anime.attributes.averageRating) / 10).toFixed(1)) : null);

                const studioName = standardStudioName(studioMetadata.studioForAnime(anime));
                const studioMissing = studioMetadata.isUnknownStudio(studioName);

                const item = document.createElement('div');
                item.className = 'av-sug-item';
                item.setAttribute('role', 'option');
                item.setAttribute('data-index', String(index));

                const scoreBadgeHtml = score && !isNaN(score)
                    ? `<span class="av-sug-score-badge">
                        <svg viewBox="0 0 24 24" class="av-sug-star"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span>${Number(score).toFixed(1)}</span>
                    </span>`
                    : '';

                item.innerHTML = `
                    <div class="av-sug-poster-wrap">
                        <img src="${image || 'covers/cyberpunk-edgerunners-2.jpg'}" class="av-sug-poster-img" alt="" loading="lazy" data-fallback="covers/cyberpunk-edgerunners-2.jpg">
                    </div>
                    <div class="av-sug-info">
                        <div class="av-sug-title-row">
                            <span class="av-sug-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
                            ${scoreBadgeHtml}
                        </div>
                        ${jpTitle ? `<span class="av-sug-jp-title">${escapeHtml(jpTitle)}</span>` : ''}
                        <div class="av-sug-chips">
                            <span class="av-sug-chip av-sug-chip-type">${escapeHtml(type)}</span>
                            <span class="av-sug-chip">${escapeHtml(eps)}</span>
                            ${year ? `<span class="av-sug-chip">${escapeHtml(year)}</span>` : ''}
                            ${!studioMissing && studioName ? `<span class="av-sug-chip av-sug-chip-studio">${escapeHtml(studioName)}</span>` : ''}
                        </div>
                    </div>
                    <div class="av-sug-action-col">
                        <span class="av-sug-import-pill">
                            <span>Preencher</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-sug-arrow"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                        </span>
                    </div>
                `;

                // Handle click on suggestion
                item.addEventListener('click', () => {
                    document.getElementById('form-anime-title').value = title;
                    document.getElementById('form-anime-jp-title').value = jpTitle;

                    const studioInput = document.getElementById('form-anime-studio');
                    if (studioInput) {
                        studioInput.value = studioMissing ? '' : studioName;
                        studioInput.placeholder = studioMissing ? 'Estúdio não informado; preencha se souber' : 'Ex: Ufotable';
                    }

                    const studioLogoInput = document.getElementById('form-studio-logo');
                    if (studioLogoInput) {
                        studioLogoInput.value = getStudioLogo(studioName) || '';
                        if (!studioLogoInput.value && !studioMissing) {
                            const originalPlaceholder = studioLogoInput.placeholder;
                            studioLogoInput.placeholder = 'Buscando logo no MyAnimeList...';
                            fetchStudioLogoFromMal(studioName).then((logo) => {
                                if (logo && !studioLogoInput.value.trim()) studioLogoInput.value = logo;
                            }).finally(() => {
                                studioLogoInput.placeholder = originalPlaceholder;
                            });
                        }
                    }

                    const episodesInput = document.getElementById('form-anime-episodes');
                    if (episodesInput) episodesInput.value = anime.episodes || '';

                    const seasonInput = document.getElementById('form-anime-season');
                    if (seasonInput) {
                        seasonInput.value = translateSeason(anime.season, anime.year || (anime.aired?.prop?.from?.year));
                    }

                    const genresInput = document.getElementById('form-anime-genres');
                    if (genresInput) {
                        genresInput.value = anime.genres?.map(g => g.name).join(', ') || '';
                    }

                    const coverInput = document.getElementById('form-anime-cover');
                    if (coverInput) {
                        coverInput.value = image;
                    }

                    const synopsisInput = document.getElementById('form-anime-synopsis');
                    if (synopsisInput) {
                        synopsisInput.value = anime.synopsis || '';
                    }

                    suggestionsBox.classList.add('hidden');
                    activeSuggestionIndex = -1;

                    const inputs = [
                        document.getElementById('form-anime-title'),
                        document.getElementById('form-anime-jp-title'),
                        document.getElementById('form-anime-studio'),
                        document.getElementById('form-studio-logo'),
                        document.getElementById('form-anime-episodes'),
                        document.getElementById('form-anime-season'),
                        document.getElementById('form-anime-genres'),
                        document.getElementById('form-anime-cover'),
                        document.getElementById('form-anime-synopsis')
                    ].filter(Boolean);

                    inputs.forEach(input => {
                        input.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
                        input.style.borderColor = 'rgba(255, 85, 0, 0.6)';
                        input.style.boxShadow = '0 0 12px rgba(255, 85, 0, 0.25)';
                        setTimer(() => {
                            input.style.borderColor = '';
                            input.style.boxShadow = '';
                        }, 800);
                    });
                    updateCatalogLivePreview();
                });

                list.appendChild(item);
            });

            container.appendChild(list);

            // 3. Footer
            const footer = document.createElement('div');
            footer.className = 'av-sug-footer';
            footer.innerHTML = `
                <div class="av-sug-shortcuts">
                    <kbd class="av-sug-kbd">↑</kbd>
                    <kbd class="av-sug-kbd">↓</kbd>
                    <span class="av-sug-kbd-label">Navegar</span>
                    <span class="av-sug-sep">•</span>
                    <kbd class="av-sug-kbd">↵</kbd>
                    <span class="av-sug-kbd-label">Importar</span>
                    <span class="av-sug-sep">•</span>
                    <kbd class="av-sug-kbd">ESC</kbd>
                    <span class="av-sug-kbd-label">Fechar</span>
                </div>
                <div class="av-sug-footer-tip">
                    <span class="av-sug-sparkle">✦</span>
                    <span>Preenchimento inteligente em 1 clique</span>
                </div>
            `;
            container.appendChild(footer);

            suggestionsBox.appendChild(container);
        };

        // Listen for input changes
        animeTitleInput.addEventListener('input', () => {
            const query = animeTitleInput.value.trim();
            const generation = ++searchGeneration;
            clearTimer(searchDebounceTimeout);

            if (query.length < 3) {
                suggestionsBox.classList.add('hidden');
                activeSuggestionIndex = -1;
                return;
            }

            suggestionsBox.classList.remove('hidden');
            suggestionsBox.innerHTML = `
                <div class="av-sug-container">
                    <div class="av-sug-header">
                        <div class="av-sug-header-left">
                            <span class="av-sug-radar-dot av-sug-radar-pulsing"></span>
                            <span class="av-sug-header-label">CATÁLOGO GLOBAL</span>
                            <span class="av-sug-header-divider">/</span>
                            <span class="av-sug-header-source">MYANIMELIST & KITSU</span>
                        </div>
                        <div class="av-sug-header-right">
                            <span class="av-sug-sync-badge">
                                <svg class="av-sug-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                                </svg>
                                <span>Consultando base oficial...</span>
                            </span>
                        </div>
                    </div>
                    <div class="av-sug-skeletons">
                        <div class="av-sug-skel-item">
                            <div class="av-sug-skel-poster av-shimmer-sweep"></div>
                            <div class="av-sug-skel-meta">
                                <div class="av-sug-skel-bar av-sug-skel-title av-shimmer-sweep"></div>
                                <div class="av-sug-skel-bar av-sug-skel-sub av-shimmer-sweep"></div>
                                <div class="av-sug-skel-tags">
                                    <div class="av-sug-skel-chip av-shimmer-sweep"></div>
                                    <div class="av-sug-skel-chip av-shimmer-sweep"></div>
                                    <div class="av-sug-skel-chip av-shimmer-sweep" style="width: 50px;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="av-sug-skel-item">
                            <div class="av-sug-skel-poster av-shimmer-sweep"></div>
                            <div class="av-sug-skel-meta">
                                <div class="av-sug-skel-bar av-sug-skel-title av-shimmer-sweep" style="width: 72%;"></div>
                                <div class="av-sug-skel-bar av-sug-skel-sub av-shimmer-sweep" style="width: 44%;"></div>
                                <div class="av-sug-skel-tags">
                                    <div class="av-sug-skel-chip av-shimmer-sweep"></div>
                                    <div class="av-sug-skel-chip av-shimmer-sweep" style="width: 60px;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="av-sug-footer">
                        <div class="av-sug-footer-tip">
                            <span class="av-sug-sparkle">✦</span>
                            <span>Buscando arte em alta resolução, estúdio e metadados oficiais</span>
                        </div>
                    </div>
                </div>
            `;

            searchDebounceTimeout = setTimer(async () => {
                const results = await searchAnimeMAL(query);
                if (generation !== searchGeneration || animeTitleInput.value.trim() !== query || suggestionsBox.classList.contains('hidden')) return;
                renderSuggestions(results, query);
            }, 450);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!animeTitleInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
                activeSuggestionIndex = -1;
            }
        });

        // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
        animeTitleInput.addEventListener('keydown', (e) => {
            if (suggestionsBox.classList.contains('hidden')) return;

            const items = suggestionsBox.querySelectorAll('.av-sug-item');
            if (!items.length) {
                if (e.key === 'Escape') {
                    suggestionsBox.classList.add('hidden');
                    activeSuggestionIndex = -1;
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
                updateActiveSuggestion(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
                updateActiveSuggestion(items);
            } else if (e.key === 'Enter') {
                if (activeSuggestionIndex >= 0 && items[activeSuggestionIndex]) {
                    e.preventDefault();
                    items[activeSuggestionIndex].click();
                }
            } else if (e.key === 'Escape') {
                suggestionsBox.classList.add('hidden');
                activeSuggestionIndex = -1;
            }
        });
    }
}

module.exports = { initCatalogAutocomplete, scoreAnimeRelevance };
