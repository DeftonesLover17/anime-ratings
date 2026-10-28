function getStudioDescription(name, animes) {
    const titles = animes.map(a => `"${a.title}"`).join(', ');
    const fallbackDesc = `${name} é um estúdio de animação japonês de renome, amplamente reconhecido pela excelência técnica e impacto visual de suas produções. Atualmente, destaca-se no grupo pela avaliação das obras ${titles}.`;

    const descriptions = {
        'Ufotable': 'Ufotable é mundialmente aclamado por seu nível técnico absurdo de animação digital, composição 3D dinâmica e efeitos de iluminação em combates de altíssima fidelidade. É o lar de grandes sucessos de crítica e público do Anivoid.',
        'A-1 Pictures': 'A-1 Pictures é uma subsidiária da Aniplex de extrema versatilidade, transitando com maestria entre animes de ação de alta voltagem, dramas escolares emocionantes e mundos fantásticos ricamente detalhados.',
        'Production I.G': 'Production I.G é pioneiro na fusão de animação tradicional com computação gráfica avançada, renomado por thrillers psicológicos, ficções científicas maduras e animes esportivos de imensa dinâmica de quadra.',
        'CloverWorks': 'CloverWorks destaca-se pelas suas composições cinematográficas, paletas de cores expressivas e rica sensibilidade no desenvolvimento de personagens cotidianos ou de coreografia refinada.'
    };

    return descriptions[name] || fallbackDesc;
}

const STUDIO_LOGOS = {
    'Ufotable': 'logos/ufotable.png',
    'A-1 Pictures': 'logos/a_1_pictures.png',
    'Production I.G': 'logos/production_i_g.png',
    'CloverWorks': 'logos/cloverworks.png',
    'Madhouse': 'logos/madhouse.png',
    'MAPPA': 'logos/mappa.png',
    'Bones': 'logos/bones.png',
    'Wit Studio': 'logos/wit_studio.png',
    'Gainax': 'logos/gainax.png',
    'Kyoto Animation': 'logos/kyoto_animation.png',
    'White Fox': 'logos/white_fox.png',
    'CoMix Wave Films': 'logos/comix_wave_films.png',
    'Sunrise': 'logos/sunrise-animation.png',
    'Studio Ghibli': 'logos/studio_ghibli.png',
    'Shaft': 'logos/shaft.png',
    'Tokyo Movie Shinsha': 'logos/tokyo_movie_shinsha.png',
    'Tatsunoko Production': 'logos/tatsunoko_production.png',
    'Bug Film': 'logos/bug_film.png',
    'BUG FILMS': 'logos/bug_film.png',
    'Bug Films': 'logos/bug_film.png',
    'Science Saru': 'logos/science_saru.png',
    'Toei Animation': 'logos/toei_animation.png',
    'Pierrot': 'logos/pierrot.png',
    'David Production': 'logos/david_production.png',
    'J.C.Staff': 'logos/j_c_staff.png',
    'Studio Bind': 'logos/studio_bind.png',
    'Kinema Citrus': 'logos/kinema_citrus.png',
    'Manglobe': 'logos/manglobe.png',
    'Artland': 'logos/artland.png',
    'Triangle Staff': 'logos/triangle_staff.png',
    'Trigger': 'logos/trigger.png',
    'Enishiya': 'logos/enishiya.svg',
    'Studio M2': 'logos/studio_m2.png',
    'Asread': 'logos/asread.png',
    'asread': 'logos/asread.png',
    'asread.': 'logos/asread.png',
    'P.A. Works': 'logos/p_a_works.png',
    'P.A.Works': 'logos/p_a_works.png',
    'PA Works': 'logos/p_a_works.png',
    'Doga Kobo': 'logos/doga_kobo.png',
    'DOGA KOBO': 'logos/doga_kobo.png',
    'Dogakobo': 'logos/doga_kobo.png'
};

function normalizeStudioName(name) {
    return String(name || '').trim().toLowerCase();
}

function normalizeStudioLookupKey(name) {
    return normalizeStudioName(name).replace(/[^a-z0-9]/g, '');
}

function sanitizeStudioLogoUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^logos\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
    if (value.length <= 4096) {
        try {
            const parsed = new URL(value);
            if (parsed.protocol === 'https:') return parsed.href;
        } catch (error) {
            // Ignore invalid external URLs and fall through to the safe empty value.
        }
    }
    if (/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length <= 2 * 1024 * 1024) return value;
    return '';
}

function findLogoInMap(studioName, map) {
    const key = normalizeStudioName(studioName);
    const looseKey = normalizeStudioLookupKey(studioName);
    const entry = Object.entries(map || {}).find(([name]) =>
        normalizeStudioName(name) === key || normalizeStudioLookupKey(name) === looseKey
    );
    return entry ? entry[1] : '';
}

const STUDIO_BRAND_COLORS = {
    'A-1 Pictures':       { border: 'rgba(0, 85, 255, 0.4)', glow: 'rgba(0, 85, 255, 0.15)', text: '#0055ff' },
    'Ufotable':           { border: 'rgba(255, 69, 0, 0.4)', glow: 'rgba(255, 69, 0, 0.15)', text: '#FF4500' },
    'Production I.G':     { border: 'rgba(255, 255, 255, 0.3)', glow: 'rgba(255, 255, 255, 0.1)', text: '#ffffff' },
    'CloverWorks':        { border: 'rgba(0, 204, 102, 0.4)', glow: 'rgba(0, 204, 102, 0.15)', text: '#00cc66' },
    'Madhouse':           { border: 'rgba(114, 9, 183, 0.4)', glow: 'rgba(114, 9, 183, 0.15)', text: '#7209b7' },
    'MAPPA':              { border: 'rgba(235, 94, 40, 0.4)', glow: 'rgba(235, 94, 40, 0.15)', text: '#eb5e28' },
    'Bones':              { border: 'rgba(0, 180, 216, 0.4)', glow: 'rgba(0, 180, 216, 0.15)', text: '#00b4d8' },
    'Wit Studio':         { border: 'rgba(46, 196, 182, 0.4)', glow: 'rgba(46, 196, 182, 0.15)', text: '#2ec4b6' },
    'Gainax':             { border: 'rgba(247, 127, 0, 0.4)', glow: 'rgba(247, 127, 0, 0.15)', text: '#f77f00' },
    'Kyoto Animation':    { border: 'rgba(255, 112, 166, 0.4)', glow: 'rgba(255, 112, 166, 0.15)', text: '#ff70a6' },
    'White Fox':          { border: 'rgba(248, 249, 250, 0.3)', glow: 'rgba(248, 249, 250, 0.1)', text: '#f8f9fa' },
    'CoMix Wave Films':   { border: 'rgba(0, 48, 73, 0.4)', glow: 'rgba(0, 48, 73, 0.15)', text: '#003049' },
    'Sunrise':            { border: 'rgba(230, 57, 70, 0.4)', glow: 'rgba(230, 57, 70, 0.15)', text: '#e63946' },
    'Studio Ghibli':      { border: 'rgba(170, 204, 0, 0.4)', glow: 'rgba(170, 204, 0, 0.15)', text: '#aacc00' },
    'Shaft':              { border: 'rgba(208, 0, 0, 0.4)', glow: 'rgba(208, 0, 0, 0.15)', text: '#d00000' },
    'Tokyo Movie Shinsha':{ border: 'rgba(255, 0, 110, 0.4)', glow: 'rgba(255, 0, 110, 0.15)', text: '#ff006e' },
    'Tatsunoko Production':{ border: 'rgba(255, 190, 11, 0.4)', glow: 'rgba(255, 190, 11, 0.15)', text: '#ffbe0b' },
    'Bug Film':           { border: 'rgba(255, 209, 102, 0.4)', glow: 'rgba(255, 209, 102, 0.15)', text: '#ffd166' },
    'BUG FILMS':          { border: 'rgba(255, 209, 102, 0.4)', glow: 'rgba(255, 209, 102, 0.15)', text: '#ffd166' },
    'Bug Films':          { border: 'rgba(255, 209, 102, 0.4)', glow: 'rgba(255, 209, 102, 0.15)', text: '#ffd166' },
    'Science Saru':       { border: 'rgba(255, 0, 127, 0.4)', glow: 'rgba(255, 0, 127, 0.15)', text: '#ff007f' },
    'Toei Animation':     { border: 'rgba(251, 133, 0, 0.4)', glow: 'rgba(251, 133, 0, 0.15)', text: '#fb8500' },
    'Pierrot':            { border: 'rgba(78, 168, 222, 0.4)', glow: 'rgba(78, 168, 222, 0.15)', text: '#4ea8de' },
    'David Production':   { border: 'rgba(42, 157, 143, 0.4)', glow: 'rgba(42, 157, 143, 0.15)', text: '#2a9d8f' },
    'J.C.Staff':          { border: 'rgba(255, 77, 109, 0.4)', glow: 'rgba(255, 77, 109, 0.15)', text: '#ff4d6d' },
    'Studio Bind':        { border: 'rgba(155, 93, 229, 0.4)', glow: 'rgba(155, 93, 229, 0.15)', text: '#9b5de5' },
    'Kinema Citrus':      { border: 'rgba(247, 127, 0, 0.4)', glow: 'rgba(247, 127, 0, 0.15)', text: '#f77f00' },
    'Manglobe':           { border: 'rgba(6, 214, 160, 0.4)', glow: 'rgba(6, 214, 160, 0.15)', text: '#06d6a0' },
    'Artland':            { border: 'rgba(214, 40, 40, 0.4)', glow: 'rgba(214, 40, 40, 0.15)', text: '#d62828' },
    'Triangle Staff':     { border: 'rgba(255, 190, 11, 0.4)', glow: 'rgba(255, 190, 11, 0.15)', text: '#ffbe0b' },
    'Trigger':            { border: 'rgba(230, 57, 70, 0.4)', glow: 'rgba(230, 57, 70, 0.15)', text: '#e63946' },
    'Enishiya':           { border: 'rgba(253, 186, 116, 0.4)', glow: 'rgba(253, 186, 116, 0.15)', text: '#fdba74' },
    'Studio M2':          { border: 'rgba(255, 255, 255, 0.32)', glow: 'rgba(255, 255, 255, 0.12)', text: '#f5f5f5' },
    'Asread':             { border: 'rgba(0, 112, 74, 0.4)', glow: 'rgba(0, 112, 74, 0.15)', text: '#00704a' },
    'asread':             { border: 'rgba(0, 112, 74, 0.4)', glow: 'rgba(0, 112, 74, 0.15)', text: '#00704a' },
    'asread.':            { border: 'rgba(0, 112, 74, 0.4)', glow: 'rgba(0, 112, 74, 0.15)', text: '#00704a' },
    'Doga Kobo':          { border: 'rgba(255, 51, 51, 0.4)', glow: 'rgba(255, 51, 51, 0.15)', text: '#ff3333' }
};

module.exports = { getStudioDescription, STUDIO_LOGOS, normalizeStudioLookupKey, sanitizeStudioLogoUrl, findLogoInMap, STUDIO_BRAND_COLORS };
