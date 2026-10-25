// --- EMAILJS CONFIGURATION (OPTIONAL FOR REAL EMAILS) ---
// Se você quiser que o site envie e-mails reais de boas-vindas aos usuários,
// registre-se gratuitamente em https://www.emailjs.com/ e preencha as chaves abaixo:
const EMAILJS_CONFIG = (typeof window !== 'undefined' && window.__ANIVOID_EMAILJS_CONFIG) ? window.__ANIVOID_EMAILJS_CONFIG : {
    publicKey: '',
    serviceId: '',
    templateId: ''
};

const DEFAULT_AVATAR_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSI+PHBhdGggZD0iTTEyIDEyYTUgNSAwIDEgMCAwLTEwIDUgNSAwIDAgMCAwIDEwek0xMiAxNGMtMy43MyAwLTExIDEuODYtMTEgNS41VjIwSDIzdi0xYy0xLjEtMy42NC03LjI3LTUuNS0xMS01LjV6Ii8+PC9zdmc+';

// --- DEVTOOLS & CONSOLE SECURITY DEFENSE (ANTI-SELF-XSS) ---
(function installDevToolsSecurityBanner() {
    if (typeof window === 'undefined' || typeof console === 'undefined') return;
    try {
        const titleStyle = 'color: #ff3b30; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 24px; font-weight: 900; -webkit-text-stroke: 1px black; text-shadow: 0 0 10px rgba(255,59,48,0.4);';
        const warnBadgeStyle = 'background: #ff3b30; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px;';
        const bodyStyle = 'color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; line-height: 1.6; font-weight: 500;';
        const alertBoxStyle = 'color: #fbbf24; font-family: monospace; font-size: 12px; background: rgba(251,191,36,0.08); padding: 6px 12px; border-left: 3px solid #fbbf24; border-radius: 4px; margin: 4px 0;';
        const tipStyle = 'color: #9ca3af; font-family: monospace; font-size: 11px;';

        console.log('%c🛑 ÁREA DE SEGURANÇA DO ANIVOID %cDEVTOOLS', titleStyle, warnBadgeStyle);
        console.log(
            '%cATENÇÃO: Esta é uma ferramenta técnica de depuração do navegador destinada exclusivamente a desenvolvedores.\n\n' +
            'Se alguém instruiu você a copiar e colar qualquer código ou script aqui prometendo "acesso de admin", "desbloquear títulos" ou "ver notas secretas", NÃO FAÇA ISSO.\n' +
            'Trata-se de um ataque conhecido como Self-XSS (Scam) para comprometer sua sessão e seus dados.',
            bodyStyle
        );
        console.log('%c🔒 Defesa Ativa: Sessões criptografadas com cookies HttpOnly, isolamento de escopo e proteção anti-tampering.', alertBoxStyle);
        console.log('%cSaiba mais sobre segurança web em https://owasp.org/www-community/attacks/xss/#self-xss', tipStyle);
    } catch (_) {}
})();

// --- CLICKJACKING & IFRAME ISOLATION DEFENSE ---
(function enforceFrameIsolation() {
    if (typeof window === 'undefined') return;
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (_) {
        try { document.documentElement.style.display = 'none'; window.top.location = window.location; } catch (__) {}
    }
})();


(function installAvatarImageFallback() {
    if (typeof document === 'undefined' || window.__anivoidAvatarFallbackInstalled) return;
    window.__anivoidAvatarFallbackInstalled = true;
    document.addEventListener('error', (event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (!String(img.className || '').includes('rounded-full')) return;
        const fallback = document.createElement('span');
        fallback.textContent = img.dataset.fallbackAvatar || '👤';
        fallback.className = String(img.className || '')
            .replace(/\bobject-cover\b/g, '')
            .replace(/\bobject-center\b/g, '') + ' inline-flex items-center justify-center bg-white/5 border border-white/10';
        fallback.setAttribute('aria-label', img.alt || 'avatar');
        img.replaceWith(fallback);
    }, true);
})();

function deterministicStringify(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(deterministicStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const keyVals = keys.map(k => JSON.stringify(k) + ':' + deterministicStringify(obj[k]));
    return '{' + keyVals.join(',') + '}';
}


// Default initial data to make the app feel alive and premium instantly
const DEFAULT_FRIENDS = [];

const STATUS_MAP = {
    'Watching': { label: 'Assistindo', color: '#10b981', bg: 'bg-emerald-600', border: 'border-emerald-500/20', text: 'text-white font-semibold shadow-[0_2px_8px_rgba(16,185,129,0.3)]' },
    'Completed': { label: 'Completo', color: '#3b82f6', bg: 'bg-blue-600', border: 'border-blue-500/20', text: 'text-white font-semibold shadow-[0_2px_8px_rgba(59,130,246,0.3)]' },
    'On Hold': { label: 'Em Espera', color: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-400/20', text: 'text-neutral-950 font-semibold shadow-[0_2px_8px_rgba(245,158,11,0.3)]' },
    'Dropped': { label: 'Abandonado', color: '#ef4444', bg: 'bg-rose-600', border: 'border-rose-500/20', text: 'text-white font-semibold shadow-[0_2px_8px_rgba(244,63,94,0.3)]' },
    'Plan to Watch': { label: 'Planejo Assistir', color: '#9ca3af', bg: 'bg-neutral-800/90', border: 'border-neutral-700/60', text: 'text-neutral-300 font-semibold shadow-[0_2px_5px_rgba(0,0,0,0.15)]' }
};

const DEFAULT_ANIMES = [
    {
        id: 'a1',
        title: 'Demon Slayer: Infinity Castle',
        japaneseTitle: 'Kimetsu no Yaiba: Mugejo',
        synopsis: 'A batalha final começa no Castelo Infinito de Muzan Kibutsuji. Tanjiro, os Hashiras e toda a corporação de caçadores de demônios enfrentam as Luas Superiores em confrontos de vida ou morte que decidirão o destino da humanidade.',
        coverUrl: 'covers/a1.jpg',
        genres: ['Ação', 'Fantasia', 'Shounen'],
        studio: 'Ufotable',
        status: 'Em exibição',
        season: 'Outono 2026',
        episodes: '3',
        ratings: {},
        comments: []
    },
    {
        id: 'a2',
        title: 'Solo Leveling: Season 2',
        japaneseTitle: 'Ore dake Level Up na Ken Season 2',
        synopsis: 'Sung Jinwoo continua a subir de nível após se tornar o Monarca das Sombras. Com ameaças de portais de nível S surgindo em todo o mundo, ele precisa convocar seu exército de sombras para defender a humanidade enquanto investiga o segredo do Sistema.',
        coverUrl: 'covers/a2.jpg',
        genres: ['Ação', 'Fantasia', 'Aventura'],
        studio: 'A-1 Pictures',
        status: 'Em exibição',
        season: 'Primavera 2026',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a3',
        title: 'Kaiju No. 8 Season 2',
        japaneseTitle: 'Kaijuu 8-gou',
        synopsis: 'Kafka Hibino luta para controlar seus poderes de Kaiju e proteger seus amigos na Força de Defesa. Ameaças de monstros inteligentes de nível altíssimo forçam a divisão a cooperar e descobrir se Kafka é um aliado confiável ou um monstro perigoso.',
        coverUrl: 'covers/a3.jpg',
        genres: ['Ação', 'Sci-Fi', 'Militar'],
        studio: 'Production I.G',
        status: 'Em exibição',
        season: 'Primavera 2026',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a4',
        title: 'Wind Breaker Season 2',
        japaneseTitle: 'Uindo Burieikaa',
        synopsis: 'Haruka Sakura encontrou seu lugar protegendo as ruas de Makochi com a Bofurin. Novos grupos rivais decidem testar a força da gangue protetora, desafiando a liderança de Ume e forçando Sakura a aprender o verdadeiro significado de lutar por algo maior.',
        coverUrl: 'covers/a4.jpg',
        genres: ['Ação', 'Comédia', 'Escolar'],
        studio: 'CloverWorks',
        status: 'Em exibição',
        season: 'Primavera 2026',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a5',
        title: 'Frieren: Beyond Journey\'s End',
        japaneseTitle: 'Sousou no Frieren',
        synopsis: 'A aventura acabou, mas a vida continua para uma maga elfa que começa a aprender o significado do tempo e das conexões humanas após a morte de seu antigo companheiro de jornada.',
        coverUrl: 'covers/a5.jpg',
        genres: ['Aventura', 'Drama', 'Fantasia'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Outono 2023',
        episodes: '28',
        ratings: {},
        comments: []
    },
    {
        id: 'a6',
        title: 'Fullmetal Alchemist: Brotherhood',
        japaneseTitle: 'Hagane no Renkinjutsushi: Fullmetal Alchemist',
        synopsis: 'Dois irmãos usam a alquimia em uma tentativa proibida de ressuscitar sua falecida mãe. Após um terrível acidente físico, eles buscam a lendária Pedra Filosofal para restaurar seus corpos.',
        coverUrl: 'covers/a6.jpg',
        genres: ['Ação', 'Aventura', 'Drama', 'Fantasia'],
        studio: 'Bones',
        status: 'Completo',
        season: 'Primavera 2009',
        episodes: '64',
        ratings: {},
        comments: []
    },
    {
        id: 'a7',
        title: 'Steins;Gate',
        japaneseTitle: 'Steins;Gate',
        synopsis: 'Um jovem cientista excêntrico e auto-proclamado louco descobre acidentalmente um método de enviar mensagens de texto para o passado, desencadeando consequências devastadoras nas linhas temporais.',
        coverUrl: 'covers/a7.jpg',
        genres: ['Drama', 'Sci-Fi', 'Suspense'],
        studio: 'White Fox',
        status: 'Completo',
        season: 'Primavera 2011',
        episodes: '24',
        ratings: {},
        comments: []
    },
    {
        id: 'a8',
        title: 'Attack on Titan',
        japaneseTitle: 'Shingeki no Kyojin',
        synopsis: 'A humanidade é forçada a viver dentro de três muralhas gigantescas para se proteger de Titãs, monstros humanoides devoradores de homens. Eren Yeager busca vingança após a queda de sua cidade natal.',
        coverUrl: 'covers/a8.jpg',
        genres: ['Ação', 'Drama', 'Suspense'],
        studio: 'Wit Studio',
        status: 'Completo',
        season: 'Primavera 2013',
        episodes: '25',
        ratings: {},
        comments: []
    },
    {
        id: 'a9',
        title: 'Hunter x Hunter (2011)',
        japaneseTitle: 'Hunter x Hunter (2011)',
        synopsis: 'Gon Freecss decide se tornar um Hunter profissional de elite para encontrar seu pai desaparecido, embarcando em aventuras de alto risco ao lado de leais amigos.',
        coverUrl: 'covers/a9.jpg',
        genres: ['Ação', 'Aventura', 'Fantasia'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Outono 2011',
        episodes: '148',
        ratings: {},
        comments: []
    },
    {
        id: 'a10',
        title: 'Death Note',
        japaneseTitle: 'Death Note',
        synopsis: 'Light Yagami encontra um caderno sobrenatural capaz de matar qualquer pessoa cujo nome seja escrito nele. Ele começa a eliminar criminosos do mundo, iniciando um duelo mental com o detetive L.',
        coverUrl: 'covers/a10.jpg',
        genres: ['Sobrenatural', 'Suspense', 'Drama'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Outono 2006',
        episodes: '37',
        ratings: {},
        comments: []
    },
    {
        id: 'a11',
        title: 'Monster',
        japaneseTitle: 'Monster',
        synopsis: 'Um brilhante neurocirurgião japonês radicado na Alemanha toma a decisão ética de salvar a vida de um garoto ferido em vez da do prefeito da cidade. Anos mais tarde, ele descobre que salvou a vida de um terrível psicopata.',
        coverUrl: 'covers/a11.jpg',
        genres: ['Drama', 'Mystery', 'Suspense'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Primavera 2004',
        episodes: '74',
        ratings: {},
        comments: []
    },
    {
        id: 'a12',
        title: 'Serial Experiments Lain',
        japaneseTitle: 'Serial Experiments Lain',
        synopsis: 'Lain Iwakura, uma garota tímida de colégio, conecta-se à Wired (a rede global de comunicação) após receber e-mails de uma colega morta, desencadeando reflexões filosóficas sobre a própria existência física.',
        coverUrl: 'covers/a12.jpg',
        genres: ['Sci-Fi', 'Drama', 'Sobrenatural', 'Avant-Garde'],
        studio: 'Triangle Staff',
        status: 'Completo',
        season: 'Verão 1998',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a13',
        title: 'Ping Pong the Animation',
        japaneseTitle: 'Ping Pong The Animation',
        synopsis: 'Os amigos Smile e Peco jogam tênis de mesa desde a infância. Ao entrarem no competitivo circuito de ensino médio, enfrentam dramas psicológicos, superações pessoais e o verdadeiro significado de ser um herói.',
        coverUrl: 'covers/a13.jpg',
        genres: ['Esportes', 'Drama', 'Vida Escolar'],
        studio: 'Tatsunoko Production',
        status: 'Completo',
        season: 'Primavera 2014',
        episodes: '11',
        ratings: {},
        comments: []
    },
    {
        id: 'a14',
        title: 'Mushishi',
        japaneseTitle: 'Mushishi',
        synopsis: 'Ginko viaja pelo Japão feudal estudando entidades primitivas e etéreas chamadas Mushi, ajudando pessoas normais cujas vidas foram afetadas de formas estranhas e sobrenaturais por essas criaturas.',
        coverUrl: 'covers/a14.jpg',
        genres: ['Aventura', 'Fantasia', 'Slice of Life', 'Mystery'],
        studio: 'Artland',
        status: 'Completo',
        season: 'Outono 2005',
        episodes: '26',
        ratings: {},
        comments: []
    },
    {
        id: 'a15',
        title: 'The Tatami Galaxy',
        japaneseTitle: 'Yojouhan Shinwa Taikei',
        synopsis: 'Um estudante universitário em Kyoto tenta desesperadamente alcançar a "vida universitária cor-de-rosa" idealizada, repetindo de forma surreal caminhos alternativos através de dimensões paralelas de arrependimento.',
        coverUrl: 'covers/a15.jpg',
        genres: ['Comédia', 'Romance', 'Avant-Garde', 'Mystery'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Primavera 2010',
        episodes: '11',
        ratings: {},
        comments: []
    },
    {
        id: 'a16',
        title: 'Ergo Proxy',
        japaneseTitle: 'Ergo Proxy',
        synopsis: 'Numa cidade futurista protegida em formato de cúpula chamada Romdo, humanos e andróides vivem sob rígido controle totalitário. Uma detetive e um imigrante investigam mistérios envolvendo criaturas semi-divinas conhecidas como Proxies.',
        coverUrl: 'covers/a16.jpg',
        genres: ['Sci-Fi', 'Mystery', 'Suspense'],
        studio: 'Manglobe',
        status: 'Completo',
        season: 'Inverno 2006',
        episodes: '23',
        ratings: {},
        comments: []
    },
    {
        id: 'a17',
        title: 'Cyberpunk: Edgerunners',
        japaneseTitle: 'Cyberpunk: Edgerunners',
        synopsis: 'Um garoto de rua tenta sobreviver em Night City, uma metrópole futurista obcecada por modificações corporais. Ele arrisca tudo ao se juntar aos Edgerunners, um grupo clandestino de mercenários cibernéticos.',
        coverUrl: 'covers/a17.jpg',
        genres: ['Ação', 'Sci-Fi'],
        studio: 'Trigger',
        status: 'Completo',
        season: 'Outono 2022',
        episodes: '10',
        ratings: {},
        comments: []
    },
    {
        id: 'a18',
        title: 'Bocchi the Rock!',
        japaneseTitle: 'Bocchi the Rock!',
        synopsis: 'Hitori Gotou é uma garota extremamente tímida e ansiosa, mas que toca guitarra divinamente no YouTube. Seu sonho de entrar numa banda começa a se realizar após conhecer a Kessoku Band.',
        coverUrl: 'covers/a18.jpg',
        genres: ['Comédia', 'Slice of Life', 'Música'],
        studio: 'CloverWorks',
        status: 'Completo',
        season: 'Outono 2022',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a19',
        title: 'Vinland Saga',
        japaneseTitle: 'Vinland Saga',
        synopsis: 'Thorfinn, filho de um lendário guerreiro viking, cresce no campo de batalha lutando ao lado do bando de mercenários comandado por Askeladd, o assassino de seu pai, buscando um duelo de honra.',
        coverUrl: 'covers/a19.jpg',
        genres: ['Ação', 'Aventura', 'Drama'],
        studio: 'Wit Studio',
        status: 'Completo',
        season: 'Verão 2019',
        episodes: '24',
        ratings: {},
        comments: []
    },
    {
        id: 'a20',
        title: 'Jujutsu Kaisen (Temporada 1)',
        japaneseTitle: 'Jujutsu Kaisen',
        synopsis: 'Yuji Itadori consome um dedo amaldiçoado altamente perigoso para salvar seus amigos de escola, tornando-se o receptáculo do Rei das Maldições Ryomen Sukuna, forçando-o a entrar no mundo dos feiticeiros jujutsu.',
        coverUrl: 'covers/a20.jpg',
        genres: ['Ação', 'Fantasia', 'Sobrenatural'],
        studio: 'MAPPA',
        status: 'Completo',
        season: 'Outono 2020',
        episodes: '24',
        ratings: {},
        comments: []
    },
    {
        id: 'a20_s2',
        title: 'Jujutsu Kaisen (Temporada 2)',
        japaneseTitle: 'Jujutsu Kaisen 2nd Season',
        synopsis: 'A segunda temporada explora o passado de Satoru Gojo e Suguru Geto durante seus dias na escola jujutsu (Arco do Inventário Oculto / Morte Prematura), seguido pelo devastador Incidente de Shibuya, onde maldições planejam selar o feiticeiro mais forte.',
        coverUrl: 'covers/a20_s2.jpg',
        genres: ['Ação', 'Fantasia', 'Sobrenatural'],
        studio: 'MAPPA',
        status: 'Completo',
        season: 'Verão 2023',
        episodes: '23',
        ratings: {},
        comments: []
    },
    {
        id: 'a20_s3',
        title: 'Jujutsu Kaisen (Temporada 3)',
        japaneseTitle: 'Jujutsu Kaisen: Shimetsu Kaiyuu-hen',
        synopsis: 'Após o Incidente de Shibuya, o Japão mergulha no caos. Satoru Gojo é selado e o cruel Jogo do Abate (Culling Game) é iniciado por Kenjaku, forçando feiticeiros e pessoas normais a lutarem até a morte.',
        coverUrl: 'covers/a20_s3.jpg',
        genres: ['Ação', 'Fantasia', 'Sobrenatural'],
        studio: 'MAPPA',
        status: 'Em exibição',
        season: 'Inverno 2026',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a21',
        title: 'Chainsaw Man',
        japaneseTitle: 'Chainsaw Man',
        synopsis: 'Denji vive na miséria caçando demônios para pagar dívidas de seu pai falecido. Após ser traído e fatiado, ele funde seu coração com seu cão-demônio Pochita, tornando-se o lendário Homem-Motosserra.',
        coverUrl: 'covers/a21.jpg',
        genres: ['Ação', 'Fantasia', 'Gore'],
        studio: 'MAPPA',
        status: 'Completo',
        season: 'Outono 2022',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a22',
        title: 'Violet Evergarden',
        japaneseTitle: 'Violet Evergarden',
        synopsis: 'Uma ex-soldado ciborgue sem emoções humanas tenta se reintegrar na sociedade trabalhando como redatora de cartas sentimentais (Auto Memory Doll), buscando compreender o significado das últimas palavras de seu comandante.',
        coverUrl: 'covers/a22.jpg',
        genres: ['Drama', 'Fantasia', 'Slice of Life'],
        studio: 'Kyoto Animation',
        status: 'Completo',
        season: 'Inverno 2018',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a23',
        title: 'Your Name.',
        japaneseTitle: 'Kimi no Na wa.',
        synopsis: 'Dois jovens do ensino médio — uma garota de uma zona rural tranquila e um garoto de Tóquio — descobrem que estão misteriosamente trocando de corpo em dias alternados, mudando suas vidas drasticamente antes de um evento cósmico.',
        coverUrl: 'covers/a23.jpg',
        genres: ['Romance', 'Drama', 'Sobrenatural'],
        studio: 'CoMix Wave Films',
        status: 'Completo',
        season: 'Verão 2016',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a24',
        title: 'Spirited Away',
        japaneseTitle: 'Sen to Chihiro no Kamikakushi',
        synopsis: 'Durante a mudança de sua família, a jovem Chihiro entra em um mundo místico e folclórico japonês governado por deuses e espíritos. Ela deve trabalhar numa casa de banhos mágicos para resgatar seus pais transformados em porcos.',
        coverUrl: 'covers/a24.jpg',
        genres: ['Aventura', 'Fantasia', 'Família'],
        studio: 'Studio Ghibli',
        status: 'Completo',
        season: 'Verão 2001',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a25',
        title: 'Cowboy Bebop',
        japaneseTitle: 'Cowboy Bebop',
        synopsis: 'A bordo da espaçonave Bebop, uma equipe disfuncional de caçadores de recompensas vaga pela galáxia fugindo de seus passados sombrios sob uma trilha sonora regada a muito jazz e melancolia.',
        coverUrl: 'covers/a25.jpg',
        genres: ['Ação', 'Sci-Fi', 'Espaço'],
        studio: 'Sunrise',
        status: 'Completo',
        season: 'Primavera 1998',
        episodes: '26',
        ratings: {},
        comments: []
    },
    {
        id: 'a26',
        title: 'Tengen Toppa Gurren Lagann',
        japaneseTitle: 'Tengen Toppa Gurren Lagann',
        synopsis: 'Num futuro onde a humanidade foi banida para cavernas subterrâneas, o órfão Simon e o audacioso Kamina encontram um mecha minúsculo e escapam para a superfície, liderando uma revolução cósmica contra a opressão.',
        coverUrl: 'covers/a26.jpg',
        genres: ['Ação', 'Sci-Fi', 'Mecha'],
        studio: 'Gainax',
        status: 'Completo',
        season: 'Primavera 2007',
        episodes: '27',
        ratings: {},
        comments: []
    },
    {
        id: 'a27',
        title: 'Neon Genesis Evangelion',
        japaneseTitle: 'Shinseiki Evangelion',
        synopsis: 'Em um mundo pós-apocalíptico desolado, o jovem Shinji Ikari é forçado por seu pai cruel a pilotar o Evangelion Unit-01, um gigante biomecânico construído para enfrentar os enigmáticos monstros destrutivos conhecidos como Anjos.',
        coverUrl: 'covers/a27.jpg',
        genres: ['Sci-Fi', 'Drama', 'Mecha', 'Avant-Garde'],
        studio: 'Gainax',
        status: 'Completo',
        season: 'Outono 1995',
        episodes: '26',
        ratings: {},
        comments: []
    },
    {
        id: 'a28',
        title: 'FLCL',
        japaneseTitle: 'Furi Kuri',
        synopsis: 'A vida do entediado Naota vira de cabeça para baixo quando Haruko Haruhara, uma suposta alienígena louca de cabelos rosa, o atropela com sua Vespa e desfere um golpe de baixo elétrico na sua cabeça, criando protuberâncias robóticas.',
        coverUrl: 'covers/a28.jpg',
        genres: ['Comédia', 'Sci-Fi', 'Avant-Garde'],
        studio: 'Gainax',
        status: 'Completo',
        season: 'Primavera 2000',
        episodes: '6',
        ratings: {},
        comments: []
    },
    {
        id: 'a29',
        title: 'Perfect Blue',
        japaneseTitle: 'Perfect Blue',
        synopsis: 'Mima Kirigoe deixa seu grupo de pop idol de sucesso para seguir carreira de atriz. Ao assumir papéis controversos, sua realidade começa a se despedaçar devido a um stalker fanático e à perda de sua própria sanidade.',
        coverUrl: 'covers/a29.jpg',
        genres: ['Drama', 'Suspense', 'Horror'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Verão 1997',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a30',
        title: 'Mob Psycho 100',
        japaneseTitle: 'Mob Psycho 100',
        synopsis: 'Shigeo "Mob" Kageyama é um garoto comum com dons paranormais assustadoramente poderosos. Sob a mentoria do carismático vigarista Reigen Arataka, Mob tenta viver uma vida pacata para não perder o controle de suas emoções.',
        coverUrl: 'covers/a30.jpg',
        genres: ['Ação', 'Comédia', 'Sobrenatural'],
        studio: 'Bones',
        status: 'Completo',
        season: 'Verão 2016',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a31',
        title: 'Kaguya-sama: Love is War',
        japaneseTitle: 'Kaguya-sama wa Kokurasetai: Tensai-tachi no Renai Zounousen',
        synopsis: 'Os dois gênios e líderes do conselho estudantil da Academia Shuchiin travam uma batalha estratégica intelectual épica: o primeiro que se apaixonar e confessar seus sentimentos perde a guerra do orgulho.',
        coverUrl: 'covers/a31.jpg',
        genres: ['Comédia', 'Romance', 'Escolar'],
        studio: 'A-1 Pictures',
        status: 'Completo',
        season: 'Inverno 2019',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a32',
        title: 'Bleach: Thousand-Year Blood War',
        japaneseTitle: 'Bleach: Sennen Kessen-hen',
        synopsis: 'A Sociedade das Almas enfrenta sua maior ameaça quando a temível força rebelde Quincy, liderada pelo implacável Yhwach, desperta de um sono milenar para destruir os Ceifeiros de Almas para sempre.',
        coverUrl: 'covers/a32.jpg',
        genres: ['Ação', 'Fantasia', 'Shounen'],
        studio: 'Pierrot',
        status: 'Em exibição',
        season: 'Outono 2022',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a33',
        title: 'Code Geass: Lelouch of the Rebellion',
        japaneseTitle: 'Code Geass: Hangyaku no Lelouch',
        synopsis: 'Lelouch Lamperouge, um príncipe exilado morando na colônia japonesa dominada pelo Império de Britannia, recebe o dom sobrenatural absoluto conhecido como Geass e inicia uma revolução sob a máscara de Zero.',
        coverUrl: 'covers/a33.jpg',
        genres: ['Ação', 'Sci-Fi', 'Mecha', 'Drama'],
        studio: 'Sunrise',
        status: 'Completo',
        season: 'Outono 2006',
        episodes: '25',
        ratings: {},
        comments: []
    },
    {
        id: 'a34',
        title: 'One Punch Man',
        japaneseTitle: 'One Punch Man',
        synopsis: 'Saitama é um herói comum que treinou tanto que ficou absurdamente forte, sendo capaz de derrotar qualquer adversário colossal com um único soco, sofrendo de tédio existencial pela falta de desafios.',
        coverUrl: 'covers/a34.jpg',
        genres: ['Ação', 'Comédia', 'Super-Heróis'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Outono 2015',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a35',
        title: 'Made in Abyss',
        japaneseTitle: 'Made in Abyss',
        synopsis: 'A jovem órfã Riko e o robô amnésico Reg descem pelas profundezas misteriosas, belas e aterrorizantes do Abismo, um enorme buraco na terra infestado de perigos sobrenaturais e criaturas alienígenas.',
        coverUrl: 'covers/a35.jpg',
        genres: ['Aventura', 'Fantasia', 'Drama', 'Mystery'],
        studio: 'Kinema Citrus',
        status: 'Completo',
        season: 'Verão 2017',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a36',
        title: 'Haikyu!!',
        japaneseTitle: 'Haikyuu!!',
        synopsis: 'Shouyou Hinata, inspirado por um lendário jogador de vôlei de baixa estatura, entra no time do Colégio Karasuno e une forças com seu antigo rival, o levantador prodígio Kageyama, para reerguer o clube.',
        coverUrl: 'covers/a36.jpg',
        genres: ['Esportes', 'Drama', 'Vida Escolar'],
        studio: 'Production I.G',
        status: 'Completo',
        season: 'Primavera 2014',
        episodes: '25',
        ratings: {},
        comments: []
    },
    {
        id: 'a37',
        title: 'Fate/Zero',
        japaneseTitle: 'Fate/Zero',
        synopsis: 'Sete magos de elite invocam espíritos heroicos históricos lendários para lutarem entre si na Quarta Guerra do Santo Graal na cidade de Fuyuki, disputando o cálice sagrado capaz de realizar qualquer desejo.',
        coverUrl: 'covers/a37.jpg',
        genres: ['Ação', 'Fantasia', 'Sobrenatural', 'Drama'],
        studio: 'Ufotable',
        status: 'Completo',
        season: 'Outono 2011',
        episodes: '13',
        ratings: {},
        comments: []
    },
    {
        id: 'a38',
        title: 'Puella Magi Madoka Magica',
        japaneseTitle: 'Mahou Shoujo Madoka★Magica',
        synopsis: 'Madoka Kaname e Sayaka Miki recebem a proposta da enigmática criatura Kyubey para se tornarem garotas mágicas em troca de terem qualquer desejo realizado, descobrindo o cruel e desesperador segredo daquele pacto.',
        coverUrl: 'covers/a38.jpg',
        genres: ['Drama', 'Suspense', 'Garotas Mágicas'],
        studio: 'Shaft',
        status: 'Completo',
        season: 'Inverno 2011',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a39',
        title: 'Bakemonogatari',
        japaneseTitle: 'Bakemonogatari',
        synopsis: 'Koyomi Araragi, um estudante que sobreviveu recentemente a um ataque de vampiro, ajuda diversas garotas de sua escola a lidarem com aparições e espíritos folclóricos sob a direção de Meme Oshino.',
        coverUrl: 'covers/a39.jpg',
        genres: ['Comédia', 'Sobrenatural', 'Avant-Garde', 'Romance'],
        studio: 'Shaft',
        status: 'Completo',
        season: 'Verão 2009',
        episodes: '15',
        ratings: {},
        comments: []
    },
    {
        id: 'a40',
        title: 'Akira',
        japaneseTitle: 'Akira',
        synopsis: 'Numa Neo-Tóquio pós-apocalíptica cyberpunk de 2019 reconstruída sobre as cinzas de uma explosão atômica, o jovem motoqueiro Tetsuo Shima sofre um acidente militar e desenvolve poderes telecinéticos devastadores.',
        coverUrl: 'covers/a40.jpg',
        genres: ['Ação', 'Sci-Fi', 'Avant-Garde'],
        studio: 'Tokyo Movie Shinsha',
        status: 'Completo',
        season: 'Verão 1988',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a41',
        title: 'Ghost in the Shell',
        japaneseTitle: 'Koukaku Kidoutai',
        synopsis: 'No ano de 2029, a Major cibernética Motoko Kusanagi e a Seção de Segurança Pública 9 perseguem o Mestre das Marionetes, um hacker misterioso que invade cérebros computadorizados de políticos e cidadãos.',
        coverUrl: 'covers/a41.jpg',
        genres: ['Sci-Fi', 'Drama', 'Avant-Garde', 'Mystery'],
        studio: 'Production I.G',
        status: 'Completo',
        season: 'Outono 1995',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a42',
        title: 'Witch Hat Atelier',
        japaneseTitle: 'Tongari Boushi no Atelier',
        synopsis: 'Coco, uma garota da vila fascinada pela magia, descobre acidentalmente como os magos desenham feitiços. Após um trágico acidente petrificar sua mãe, o mago Qifrey a aceita como sua aprendiz para tentar desfazer a maldição.',
        coverUrl: 'covers/a42.jpg',
        genres: ['Fantasia', 'Aventura', 'Drama'],
        studio: 'BUG FILMS',
        status: 'Completo',
        season: 'Inverno 2025',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a43',
        title: 'Dandadan',
        japaneseTitle: 'Dandadan',
        synopsis: 'Momo Ayase, uma colegial que acredita em fantasmas, e seu colega Ken Takakura (Okarun), que acredita em alienígenas, decidem provar um ao outro que suas crenças são reais, envolvendo-se em batalhas sobrenaturais insanas.',
        coverUrl: 'covers/a43.jpg',
        genres: ['Ação', 'Comédia', 'Sobrenatural', 'Sci-Fi'],
        studio: 'Science Saru',
        status: 'Completo',
        season: 'Outono 2024',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a44',
        title: 'Makeine: Too Many Losing Heroines!',
        japaneseTitle: 'Make Heroine ga Oosugiru!',
        synopsis: 'Kazuhiko Nukumizu é um estudante comum que acaba presenciando a popular garota Anna Yanami ser rejeitada por seu amigo de infância, tornando-se confidente dela e de várias outras "heroínas perdedoras" da escola.',
        coverUrl: 'covers/a44.jpg',
        genres: ['Comédia', 'Romance', 'Vida Escolar'],
        studio: 'A-1 Pictures',
        status: 'Completo',
        season: 'Verão 2024',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a45',
        title: 'One Piece',
        japaneseTitle: 'ONE PIECE',
        synopsis: 'Monkey D. Luffy e seu bando de piratas navegam pela Grand Line em busca do tesouro lendário de Gol D. Roger para que Luffy se torne o próximo Rei dos Piratas.',
        coverUrl: 'covers/a45.jpg',
        genres: ['Ação', 'Aventura', 'Fantasia', 'Shounen'],
        studio: 'Toei Animation',
        status: 'Em exibição',
        season: 'Outono 1999',
        episodes: '1100',
        ratings: {},
        comments: []
    },
    {
        id: 'a46',
        title: 'Naruto: Shippuden',
        japaneseTitle: 'Naruto: Shippuuden',
        synopsis: 'Naruto Uzumaki retorna à Vila da Folha após dois anos de treinamento com Jiraiya, focado em resgatar seu amigo Sasuke Uchiha e enfrentar a perigosa organização Akatsuki.',
        coverUrl: 'covers/a46.jpg',
        genres: ['Ação', 'Aventura', 'Fantasia', 'Shounen'],
        studio: 'Pierrot',
        status: 'Completo',
        season: 'Inverno 2007',
        episodes: '500',
        ratings: {},
        comments: []
    },
    {
        id: 'a47',
        title: 'A Silent Voice',
        japaneseTitle: 'Koe no Katachi',
        synopsis: 'Anos após ter praticado bullying severo contra Shoko Nishimiya, uma colega de classe surda, Shoya Ishida busca reencontrá-la para se redimir e encontrar seu próprio caminho de aceitação.',
        coverUrl: 'covers/a47.jpg',
        genres: ['Drama', 'Vida Escolar'],
        studio: 'Kyoto Animation',
        status: 'Completo',
        season: 'Outono 2016',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a48',
        title: 'Princess Mononoke',
        japaneseTitle: 'Mononoke Hime',
        synopsis: 'O príncipe Ashitaka viaja para o oeste para curar uma maldição mortal e se encontra no meio de um conflito sangrento entre os humanos mineradores de uma colônia de ferro e os deuses animais da floresta, liderados por San.',
        coverUrl: 'covers/a48.jpg',
        genres: ['Aventura', 'Fantasia'],
        studio: 'Studio Ghibli',
        status: 'Completo',
        season: 'Verão 1997',
        episodes: '1',
        ratings: {},
        comments: []
    },
    {
        id: 'a49',
        title: 'Your Lie in April',
        japaneseTitle: 'Shigatsu wa Kimi no Uso',
        synopsis: 'Kousei Arima, um prodígio do piano que perdeu a capacidade de ouvir a própria música após a morte de sua mãe, recupera o brilho da vida ao conhecer Kaori Miyazono, uma violinista de espírito livre e extrovertida.',
        coverUrl: 'covers/a49.jpg',
        genres: ['Drama', 'Romance', 'Música'],
        studio: 'A-1 Pictures',
        status: 'Completo',
        season: 'Outono 2014',
        episodes: '22',
        ratings: {},
        comments: []
    },
    {
        id: 'a50',
        title: 'Re:Zero - Starting Life in Another World',
        japaneseTitle: 'Re:Zero kara Hajimeru Isekai Seikatsu',
        synopsis: 'Subaru Natsuki é transportado de repente para um mundo de fantasia, onde descobre que possui o poder de voltar no tempo toda vez que morre, usando essa habilidade dolorosa para proteger a meio-elfa Emilia.',
        coverUrl: 'covers/a50.jpg',
        genres: ['Fantasia', 'Drama', 'Suspense'],
        studio: 'White Fox',
        status: 'Completo',
        season: 'Primavera 2016',
        episodes: '25',
        ratings: {},
        comments: []
    },
    {
        id: 'a51',
        title: 'JoJo\'s Bizarre Adventure: Stardust Crusaders',
        japaneseTitle: 'JoJo no Kimyou na Bouken Part 3: Stardust Crusaders',
        synopsis: 'Jotaro Kujo viaja com seu avô Joseph Joestar até o Egito para derrotar o vampiro ressuscitado DIO, desperto com poderes sobrenaturais conhecidos como "Stands", e salvar a vida de sua mãe.',
        coverUrl: 'covers/a51.jpg',
        genres: ['Ação', 'Aventura', 'Sobrenatural'],
        studio: 'David Production',
        status: 'Completo',
        season: 'Primavera 2014',
        episodes: '24',
        ratings: {},
        comments: []
    },
    {
        id: 'a52',
        title: 'Tokyo Ghoul',
        japaneseTitle: 'Tokyo Ghoul',
        synopsis: 'O estudante universitário Ken Kaneki torna-se um meio-ghoul após sobreviver a um ataque e receber o transplante de órgãos de uma ghoul, tendo que aprender a viver escondido na sociedade e a se alimentar de carne humana.',
        coverUrl: 'covers/a52.jpg',
        genres: ['Ação', 'Suspense', 'Sobrenatural', 'Gore'],
        studio: 'Pierrot',
        status: 'Completo',
        season: 'Verão 2014',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a53',
        title: 'Psycho-Pass',
        japaneseTitle: 'Psycho-Pass',
        synopsis: 'Em um tempo futurista, a sociedade é controlada pelo Sistema Sibyl, que mede o estado mental e o potencial criminal de cada cidadão. A inspetora novata Akane Tsunemori investiga crimes junto ao executor Shinya Kogami.',
        coverUrl: 'covers/a53.jpg',
        genres: ['Sci-Fi', 'Suspense', 'Militar'],
        studio: 'Production I.G',
        status: 'Completo',
        season: 'Outono 2012',
        episodes: '22',
        ratings: {},
        comments: []
    },
    {
        id: 'a54',
        title: 'Spy x Family',
        japaneseTitle: 'SPY x FAMILY',
        synopsis: 'Para realizar uma missão ultrassecreta, o espião de elite "Twilight" adota o codinome Loid Forger e constrói uma família falsa com uma assassina profissional como esposa e uma garota telepata como filha adotiva, todos escondendo suas reais identidades.',
        coverUrl: 'covers/a54.jpg',
        genres: ['Ação', 'Comédia'],
        studio: 'CloverWorks',
        status: 'Completo',
        season: 'Primavera 2022',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a55',
        title: 'Toradora!',
        japaneseTitle: 'Toradora!',
        synopsis: 'Ryuuji Takasu, um jovem de olhar intimidador mas coração dócil, e Taiga Aisaka, uma garota de baixa estatura e temperamento feroz, decidem ajudar um ao outro a se declarar para seus respectivos melhores amigos.',
        coverUrl: 'covers/a55.jpg',
        genres: ['Romance', 'Comédia', 'Vida Escolar'],
        studio: 'J.C.Staff',
        status: 'Completo',
        season: 'Outono 2008',
        episodes: '25',
        ratings: {},
        comments: []
    },
    {
        id: 'a56',
        title: 'No Game No Life',
        japaneseTitle: 'No Game No Life',
        synopsis: 'Os irmãos hikikomori Sora e Shiro, conhecidos como a lenda dos jogos online "Blank", são desafiados pelo deus Tet a entrar em Disboard, um mundo onde todos os conflitos e guerras são resolvidos estritamente por meio de jogos.',
        coverUrl: 'covers/a56.jpg',
        genres: ['Comédia', 'Fantasia', 'Ecchi'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Primavera 2014',
        episodes: '12',
        ratings: {},
        comments: []
    },
    {
        id: 'a57',
        title: 'Gintama',
        japaneseTitle: 'Gintama',
        synopsis: 'Em uma Edo conquistada por alienígenas chamados Amanto, o samurai preguiçoso Gintoki Sakata trabalha como faz-tudo ao lado do jovem Shinpachi Shimura e da garota alienígena Kagura para pagar o aluguel.',
        coverUrl: 'covers/a57.jpg',
        genres: ['Ação', 'Comédia', 'Sci-Fi'],
        studio: 'Sunrise',
        status: 'Completo',
        season: 'Primavera 2006',
        episodes: '201',
        ratings: {},
        comments: []
    },
    {
        id: 'a58',
        title: 'Mushoku Tensei: Jobless Reincarnation',
        japaneseTitle: 'Mushoku Tensei: Isekai Ittara Honki Dasu',
        synopsis: 'Um NEET de 34 anos morre atropelado e reencarna como o bebê Rudeus Greyrat em um mundo de magia e espadas, determinado a viver sua nova vida ao máximo e a não repetir os arrependimentos do passado.',
        coverUrl: 'covers/a58.jpg',
        genres: ['Fantasia', 'Aventura'],
        studio: 'Studio Bind',
        status: 'Completo',
        season: 'Inverno 2021',
        episodes: '11',
        ratings: {},
        comments: []
    },
    {
        id: 'a59',
        title: 'Parasyte -the maxim-',
        japaneseTitle: 'Kiseijuu: Sei no Kakuritsu',
        synopsis: 'Parasitas alienígenas invadem a Terra infiltrando-se nos cérebros humanos. O jovem Shinichi Izumi consegue impedir que o parasita Migi atinja seu cérebro, forçando ambos a cooperarem para sobreviver.',
        coverUrl: 'covers/a59.jpg',
        genres: ['Ação', 'Sci-Fi', 'Suspense', 'Gore'],
        studio: 'Madhouse',
        status: 'Completo',
        season: 'Outono 2014',
        episodes: '24',
        ratings: {},
        comments: []
    },
    {
        id: 'a60',
        title: 'Clannad: After Story',
        japaneseTitle: 'Clannad: After Story',
        synopsis: 'A sequência emocionante da vida de Tomoya Okazaki e Nagisa Furukawa após terminarem o ensino médio, retratando as lutas da vida adulta, casamento, paternidade e a superação de perdas trágicas.',
        coverUrl: 'covers/a60.jpg',
        genres: ['Drama', 'Romance', 'Slice of Life'],
        studio: 'Kyoto Animation',
        status: 'Completo',
        season: 'Outono 2008',
        episodes: '24',
        ratings: {},
        comments: []
    }
];

// App State Management
const currentOrigin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin
    : 'https://anime-ratings.pages.dev';
const API_BASE_URL = (typeof window !== 'undefined' && window.ANIVOID_API_BASE_URL) || '';
const originalFetch = window.fetch;
const ANIVOID_API_ORIGIN = new URL(API_BASE_URL || currentOrigin, currentOrigin).origin;

function isAniVoidApiRequest(input) {
    try {
        const requestUrl = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
        return requestUrl.origin === ANIVOID_API_ORIGIN && requestUrl.pathname.startsWith('/api/');
    } catch (error) {
        return false;
    }
}

window.fetch = function(input, init) {
    if (!isAniVoidApiRequest(input)) {
        return originalFetch.call(this, input, init);
    }

    return originalFetch.call(this, input, {
        ...(init || {}),
        credentials: 'include'
    });
};
const AUTH_TOKEN_KEY = 'anivoid_auth_token';
const MIN_PASSWORD_LENGTH = 10;

function getAuthToken() {
    return '';
}

function hasAuthSession() {
    return !!localStorage.getItem('anivoid_logged_in_username');
}

function setAuthSession(username, token) {
    if (username) localStorage.setItem('anivoid_logged_in_username', username);
    const activeState = window.__anivoidState;
    if (activeState) {
        if (username) activeState.loggedInUser = username;
        if (token) activeState.authToken = token;
    }
}

function clearAuthSession() {
    window.AnivoidUI.session.clearCache();
    localStorage.removeItem('anivoid_logged_in_username');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    const activeState = window.__anivoidState;
    if (activeState) {
        activeState.loggedInUser = null;
        activeState.authToken = '';
    }
}

function authHeaders(extraHeaders = {}) {
    const token = getAuthToken();
    return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : extraHeaders;
}

async function submitLogin(identifier, password) {
    return fetch(API_BASE_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, identifier, password })
    });
}

async function buildRegisterPayload(userRecord, password) {
    return { ...userRecord, password };
}

function stripSensitiveUserFields(user) {
    if (!user || typeof user !== 'object') return user;
    const {
        password,
        passwordHash,
        passwordSalt,
        passwordIterations,
        passwordDigest,
        passwordResetRequired,
        ...safeUser
    } = user;
    const currentUsername = (typeof localStorage !== 'undefined' && localStorage.getItem('anivoid_logged_in_username')) || '';
    if (safeUser.username && currentUsername && safeUser.username.toLowerCase() !== currentUsername.toLowerCase()) {
        delete safeUser.email;
        delete safeUser.notifications;
    }
    return safeUser;
}

function storeRegisteredUsers(users) {
    if (!Array.isArray(users)) return;
    localStorage.setItem('anivoid_registered_users', JSON.stringify(users.map(stripSensitiveUserFields)));
}

let registeredUsersRefreshPromise = null;
let registeredUsersLastRefreshAt = 0;

function normalizeUserSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function getAnimeSearchAliases(anime) {
    const title = `${anime?.title || ''} ${anime?.japaneseTitle || ''}`.toLowerCase();
    const aliases = [];
    if (title.includes('attack on titan') || title.includes('shingeki')) {
        aliases.push('snk shingeki no kyojin attack titan final season season 4 part 1 part 2 parte final');
    }
    if (title.includes('jujutsu kaisen')) aliases.push('jjk feiticeiros jujutsu temporada season shibuya');
    if (title.includes('fullmetal alchemist')) aliases.push('fma brotherhood hagane');
    if (title.includes('neon genesis evangelion')) aliases.push('eva evangelion');
    return aliases;
}

function buildAnimeSearchHaystack(anime) {
    return normalizeUserSearchText([
        anime?.title,
        anime?.japaneseTitle,
        anime?.studio,
        anime?.season,
        anime?.status,
        ...(anime?.genres || []),
        ...getAnimeSearchAliases(anime)
    ].filter(Boolean).join(' '));
}

function matchesAnimeSearch(anime, rawQuery) {
    const query = normalizeUserSearchText(rawQuery);
    if (!query) return true;
    const haystack = buildAnimeSearchHaystack(anime);
    if (haystack.includes(query)) return true;
    return query.split(' ').filter(Boolean).every(token => haystack.includes(token));
}

async function refreshRegisteredUsersFromServer({ force = false } = {}) {
    const now = Date.now();
    if (!force && now - registeredUsersLastRefreshAt < 15000) return true;
    if (registeredUsersRefreshPromise) return registeredUsersRefreshPromise;

    registeredUsersRefreshPromise = (async () => {
        try {
            let response = await fetch(API_BASE_URL + '/api/users', {
                method: 'GET',
                headers: authHeaders(),
                cache: 'no-store'
            });
            if (response.status === 404) {
                response = await fetch(API_BASE_URL + '/api/get-state', {
                    method: 'GET',
                    headers: authHeaders(),
                    cache: 'no-store'
                });
            }
            if (response.status === 401 || response.status === 403) return false;
            if (!response.ok) throw new Error('Failed to refresh registered users');
            const serverState = await response.json();
            if (serverState.viewerUsername) {
                setAuthSession(serverState.viewerUsername);
            }
            if (Array.isArray(serverState.registeredUsers)) {
                storeRegisteredUsers(serverState.registeredUsers);
                if (typeof state !== 'undefined' && state && state.loggedInUser) {
                    state.loadLocalSession();
                }
                registeredUsersLastRefreshAt = Date.now();
                return true;
            }
        } catch (err) {
            console.warn('Could not refresh registered users:', err);
        } finally {
            registeredUsersRefreshPromise = null;
        }
        return false;
    })();

    return registeredUsersRefreshPromise;
}

function sanitizeStoredRegisteredUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        if (Array.isArray(users)) storeRegisteredUsers(users);
    } catch (err) {}
}

function normalizeProfileId(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeAnimeIdentity(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function hasMeaningfulRating(rating) {
    if (!rating || typeof rating !== 'object') return false;
    const overall = parseFloat(rating.overall);
    const hasOverall = !isNaN(overall) && overall > 0;
    const hasEpisodes = rating.episodeRatings &&
        typeof rating.episodeRatings === 'object' &&
        Object.values(rating.episodeRatings).some(score => {
            const value = parseFloat(score);
            return !isNaN(value) && value > 0;
        });
    const hasStatus = rating.status && rating.status !== 'Plan to Watch';
    return hasOverall || hasEpisodes || hasStatus;
}

function ratingStrength(rating) {
    if (!rating || typeof rating !== 'object') return 0;
    const episodeCount = rating.episodeRatings && typeof rating.episodeRatings === 'object'
        ? Object.values(rating.episodeRatings).filter(score => {
            const value = parseFloat(score);
            return !isNaN(value) && value > 0;
        }).length
        : 0;
    const overall = parseFloat(rating.overall);
    return episodeCount * 3 + (!isNaN(overall) && overall > 0 ? 2 : 0) + (rating.status && rating.status !== 'Plan to Watch' ? 1 : 0);
}

function normalizeRatingMapKeys(ratings) {
    if (!ratings || typeof ratings !== 'object') return false;
    let changed = false;

    Object.keys(ratings).forEach(rawKey => {
        const normalizedKey = normalizeProfileId(rawKey);
        if (!normalizedKey || normalizedKey === rawKey) return;

        const rawRating = ratings[rawKey];
        const existingRating = ratings[normalizedKey];
        ratings[normalizedKey] = ratingStrength(existingRating) >= ratingStrength(rawRating)
            ? { ...rawRating, ...existingRating }
            : { ...existingRating, ...rawRating };
        delete ratings[rawKey];
        changed = true;
    });

    return changed;
}

function getRatingForProfile(ratings, userId) {
    if (!ratings || typeof ratings !== 'object') return null;
    const normalizedUserId = normalizeProfileId(userId);
    if (!normalizedUserId) return null;
    if (ratings[normalizedUserId]) return ratings[normalizedUserId];

    const aliasEntry = Object.entries(ratings).find(([key]) => normalizeProfileId(key) === normalizedUserId);
    return aliasEntry ? aliasEntry[1] : null;
}

function animeRecoveryKeys(anime) {
    if (!anime || typeof anime !== 'object') return [];
    const keys = new Set();
    if (anime.id) keys.add(`id:${anime.id}`);

    const title = normalizeAnimeIdentity(anime.title);
    const japaneseTitle = normalizeAnimeIdentity(anime.japaneseTitle);
    if (title) keys.add(`title:${title}`);
    if (japaneseTitle) keys.add(`title:${japaneseTitle}`);

    const joined = `${title} ${japaneseTitle}`.trim();
    if (joined.includes('jujutsu kaisen')) {
        if (anime.id === 'a20_s2' || /\b(2|2nd|segunda|temporada 2)\b/.test(joined)) {
            keys.add('series:jujutsu-kaisen-season-2');
        } else if (anime.id === 'a20' || !joined.includes('shimetsu kaiyuu') && !joined.includes('culling game')) {
            keys.add('series:jujutsu-kaisen-season-1');
        }
    }

    return Array.from(keys);
}

function mergeLocalOwnRatings(serverAnimes, localAnimes, userId) {
    const normalizedUserId = normalizeProfileId(userId);
    if (!normalizedUserId || !Array.isArray(serverAnimes) || !Array.isArray(localAnimes)) return serverAnimes;

    const localRatingsByKey = new Map();
    localAnimes.forEach(localAnime => {
        const localRating = getRatingForProfile(localAnime?.ratings, normalizedUserId) || localAnime?.ratings?.['1'];
        if (!hasMeaningfulRating(localRating)) return;
        animeRecoveryKeys(localAnime).forEach(key => {
            const current = localRatingsByKey.get(key);
            if (!current || ratingStrength(localRating) > ratingStrength(current.rating)) {
                localRatingsByKey.set(key, { rating: { ...localRating }, anime: localAnime });
            }
        });
    });

    return serverAnimes.map(serverAnime => {
        const keys = animeRecoveryKeys(serverAnime);
        const found = keys.map(key => localRatingsByKey.get(key)).find(Boolean);
        if (!found) return serverAnime;

        const currentRating = serverAnime?.ratings?.[normalizedUserId];
        if (hasMeaningfulRating(currentRating) && ratingStrength(currentRating) >= ratingStrength(found.rating)) {
            return serverAnime;
        }

        return {
            ...serverAnime,
            ratings: {
                ...(serverAnime.ratings || {}),
                [normalizedUserId]: {
                    ...(currentRating || {}),
                    ...found.rating
                }
            }
        };
    });
}

function applyServerStateSnapshot(serverState) {
    if (!serverState || typeof serverState !== 'object') return;
    rememberSyncBase(serverState);
    if (serverState.viewerUsername) {
        setAuthSession(serverState.viewerUsername);
    }
    let previousAnimes = [];
    try {
        previousAnimes = JSON.parse(localStorage.getItem('anivoid_list_v2')) || [];
    } catch (err) {}

    if (Array.isArray(serverState.registeredUsers)) {
        storeRegisteredUsers(serverState.registeredUsers);
    }
    if (Array.isArray(serverState.animes)) {
        const activeUserId = normalizeProfileId(localStorage.getItem('anivoid_logged_in_username'));
        const animesToStore = serverState.animes;
        localStorage.setItem('anivoid_list_v2', JSON.stringify(animesToStore));
    }
    if (serverState.studioLogos && typeof serverState.studioLogos === 'object') {
        localStorage.setItem('anivoid_studio_logos', JSON.stringify(serverState.studioLogos));
    }
    if (Array.isArray(serverState.activities)) {
        localStorage.setItem('anivoid_activities_v1', JSON.stringify(serverState.activities));
    }
}

function readClientState(appState) {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('anivoid_registered_users')) || []; } catch {}
    return { registeredUsers: users, animes: appState.animes, activities: appState.activities || [], featuredAnimeId: appState.featuredAnimeId };
}

function rememberSyncBase(serverState) {
    const username = serverState.viewerUsername || localStorage.getItem('anivoid_logged_in_username');
    if (!username) return null;
    const snapshot = AnivoidSync.clientSnapshot(serverState, username);
    localStorage.setItem('anivoid_sync_base:' + normalizeProfileId(username), JSON.stringify(snapshot));
    if (window.__anivoidState) window.__anivoidState.syncBase = snapshot;
    return snapshot;
}

class AppState {
    constructor() {
        this.loggedInUser = localStorage.getItem('anivoid_logged_in_username') || null;
        this.authToken = getAuthToken();
        try { this.syncBase = JSON.parse(localStorage.getItem('anivoid_sync_base:' + normalizeProfileId(this.loggedInUser))); } catch { this.syncBase = null; }
        sanitizeStoredRegisteredUsers();
        this.friends = [];
        this.activities = [];
        this.knownActivityIds = new Set();
        try {
            const cachedActivities = JSON.parse(localStorage.getItem('anivoid_activities_v1')) || [];
            this.activities = Array.isArray(cachedActivities) ? cachedActivities : [];
        } catch (e) {
            this.activities = [];
        }
        try {
            const storedStudioLogos = JSON.parse(localStorage.getItem('anivoid_studio_logos')) || {};
            this.studioLogos = storedStudioLogos && typeof storedStudioLogos === 'object' && !Array.isArray(storedStudioLogos)
                ? storedStudioLogos
                : {};
        } catch (e) {
            this.studioLogos = {};
        }

        try {
            this.animes = JSON.parse(localStorage.getItem('anivoid_list_v2'));
            if (Array.isArray(this.animes)) {
                const BOGUS_IDS = new Set(['steins-gate', 'sample-anime', 'sample-anime-test', 'sample-anime-special-sync']);
                this.animes = this.animes.filter(a => a && a.id && 
                    !BOGUS_IDS.has(a.id) &&
                    !a.id.includes('debug') &&
                    !a.id.startsWith('sample-anime') &&
                    a.id !== 'sample-anime-test' && 
                    !a.id.includes('-test-') && 
                    !a.id.startsWith('test-'));
            }
            if (!Array.isArray(this.animes) || this.animes.length === 0) {
                this.animes = DEFAULT_ANIMES;
            } else {
                // Fusão dinâmica de dados: atualiza a lista de animes do localStorage com todas as novas entradas
                // da base de dados padrão (incluindo novas temporadas e novos títulos), mantendo as avaliações/comentários existentes do usuário
                const oldAnimesMap = {};
                this.animes.forEach(a => {
                    oldAnimesMap[a.id] = a;
                });

                const defaultIds = new Set(DEFAULT_ANIMES.map(da => da.id));
                const userAddedAnimes = this.animes.filter(a => !defaultIds.has(a.id));

                const mergedAnimes = DEFAULT_ANIMES.map(defaultAnime => {
                    const oldAnime = oldAnimesMap[defaultAnime.id];
                    if (oldAnime) {
                        return {
                            ...defaultAnime,
                            ratings: oldAnime.ratings || {},
                            comments: oldAnime.comments || []
                        };
                    }
                    return defaultAnime;
                });

                // Preservar animes adicionados pelo usuário
                userAddedAnimes.forEach(userAnime => {
                    mergedAnimes.push(userAnime);
                });

                // Garante que todas as imagens apontem localmente (apenas para animes padrões)
                mergedAnimes.forEach(anime => {
                    if (defaultIds.has(anime.id) && anime.coverUrl && (anime.coverUrl.startsWith('https://cdn.myanimelist.net') || anime.coverUrl.startsWith('http://') || anime.coverUrl.startsWith('https://'))) {
                        anime.coverUrl = `covers/${anime.id}.jpg`;
                    }
                });

                this.animes = mergedAnimes;
                localStorage.setItem('anivoid_list_v2', JSON.stringify(this.animes));
            }
        } catch (e) {
            this.animes = DEFAULT_ANIMES;
        }

        // Migrate legacy unsanitized ratings/comments keys
        try {
            let registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
            if (Array.isArray(registeredUsers) && Array.isArray(this.animes)) {
                registeredUsers.forEach(user => {
                    if (user && user.username) {
                        const rawLower = user.username.toLowerCase();
                        const sanitized = rawLower.replace(/[^a-z0-9]/g, '');
                        if (rawLower !== sanitized) {
                            this.animes.forEach(anime => {
                                if (anime.ratings) {
                                    if (anime.ratings[rawLower]) {
                                        anime.ratings[sanitized] = {
                                            ...anime.ratings[sanitized],
                                            ...anime.ratings[rawLower]
                                        };
                                        delete anime.ratings[rawLower];
                                    }
                                }
                                if (anime.comments) {
                                    anime.comments.forEach(comment => {
                                        if (comment.friendId && comment.friendId.toLowerCase() === rawLower) {
                                            comment.friendId = sanitized;
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
                localStorage.setItem('anivoid_list_v2', JSON.stringify(this.animes));
            }
        } catch (err) {}

        if (this.repairDerivedRatings()) {
            localStorage.setItem('anivoid_list_v2', JSON.stringify(this.animes));
        }

        try {
            this.currentFriendId = localStorage.getItem('anivoid_current_friend_v2');
        } catch (e) {
            this.currentFriendId = null;
        }

        try {
            // featuredAnimeId is now per-user, stored in registeredUsers
            // We keep a legacy local key as fallback for migration
            this.featuredAnimeId = localStorage.getItem('anivoid_featured_anime_id') || null;
        } catch (e) {
            this.featuredAnimeId = null;
        }
        
        // Filters
        this.filterSeason = 'All';
        this.filterGenre = 'All';
        this.filterStudio = 'All';
        this.filterYear = 'All';
        this.filterScore = 'All';
        this.filterMALStatus = 'All'; // 'All', 'Watching', 'Completed', 'On Hold', 'Dropped', 'Plan to Watch'
        this.searchQuery = '';
        this.sortBy = 'group-score'; // 'group-score', 'my-score', 'title'
        this.syncInFlight = null;
        this.needsFollowUpSync = false;
        this.saveRefreshTimer = null;
        
        this.activeDetailAnimeId = null;

        // Load local cached session before server sync
        this.loadLocalSession();
    }

    loadLocalSession() {
        try {
            this.loggedInUser = localStorage.getItem('anivoid_logged_in_username') || null;
            this.authToken = getAuthToken();
            if (this.loggedInUser) {
                let registeredUsers = [];
                try {
                    registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                } catch (err) {}
                
                const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                if (curUser) {
                    const list = [];
                    list.push({
                        id: curUser.username.toLowerCase().replace(/[^a-z0-9]/g, ''),
                        name: curUser.username + ' (Você)',
                        avatar: curUser.avatar,
                        color: curUser.color,
                        email: curUser.email,
                        emailVerified: curUser.emailVerified || false,
                        favoriteGenres: curUser.favoriteGenres || [],
                        favoriteStudios: curUser.favoriteStudios || [],
                        favoriteAnimes: curUser.favoriteAnimes || [],
                        activeTitle: curUser.activeTitle || 'admin',
                        isMe: true
                    });
                    
                    if (curUser.friends && Array.isArray(curUser.friends)) {
                        curUser.friends.forEach(fUsername => {
                            if (fUsername) {
                                const fUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === fUsername.toLowerCase());
                                if (fUser) {
                                    list.push({
                                        id: fUser.username.toLowerCase().replace(/[^a-z0-9]/g, ''),
                                        name: fUser.username,
                                        avatar: fUser.avatar,
                                        color: fUser.color,
                                        email: fUser.email,
                                        emailVerified: fUser.emailVerified || false,
                                        favoriteGenres: fUser.favoriteGenres || [],
                                        favoriteStudios: fUser.favoriteStudios || [],
                                        favoriteAnimes: fUser.favoriteAnimes || [],
                                        activeTitle: fUser.activeTitle || 'admin'
                                    });
                                }
                            }
                        });
                    }
                    this.friends = list;
                    
                    if (!this.currentFriendId || !this.friends.some(f => f.id === this.currentFriendId)) {
                        this.currentFriendId = this.friends[0]?.id || null;
                    }
                } else {
                    this.friends = [];
                }
            } else {
                this.friends = [];
            }
        } catch (e) {
            console.error('Error loading session:', e);
            this.friends = [];
            this.loggedInUser = null;
        }
    }

    async syncWithServer() {
        if (this.syncInFlight) {
            this.needsFollowUpSync = true;
            return this.syncInFlight.then(() => {
                if (!this.needsFollowUpSync) return false;
                this.needsFollowUpSync = false;
                return this.syncWithServer();
            });
        }

        this.syncInFlight = this.syncWithServerNow();
        try {
            return await this.syncInFlight;
        } finally {
            this.syncInFlight = null;
        }
    }

    async syncWithServerNow() {
        this.lastSyncError = null;
        try {
            let registeredUsers = [];
            try {
                registeredUsers = (JSON.parse(localStorage.getItem('anivoid_registered_users')) || []).map(stripSensitiveUserFields);
            } catch (err) {}

            const localState = {
                registeredUsers: registeredUsers,
                animes: this.animes,
                studioLogos: this.studioLogos || {},
                activities: this.activities || [],
                friends: [],
                featuredAnimeId: this.featuredAnimeId
            };

            // Capture state before request
            const prevAnimesStr = deterministicStringify(this.animes);
            const prevFeaturedId = this.featuredAnimeId;
            let prevUsersStr = '';
            try {
                const parsedUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                prevUsersStr = deterministicStringify(parsedUsers);
            } catch (e) {}

            const hasLoginSession = !!this.loggedInUser;
            const sentSnapshot = AnivoidSync.clientSnapshot(localState, this.loggedInUser);
            const shouldWrite = hasLoginSession && this.syncBase && !AnivoidSync.equal(sentSnapshot, this.syncBase);
            const response = shouldWrite
                ? await fetch(API_BASE_URL + '/api/sync-state', {
                    method: 'POST',
                    headers: authHeaders({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        localState: sentSnapshot,
                        baseState: this.syncBase
                    })
                })
                : await fetch(API_BASE_URL + '/api/get-state', {
                    method: 'GET'
                });

            if (response.status === 401 || response.status === 403) {
                clearAuthSession();
                this.loggedInUser = null;
                this.friends = [];
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            if (!response.ok) {
                const failure = await response.json().catch(() => ({}));
                if (response.status === 409) showToast('Sincronizacao pendente', failure.error || 'Tente salvar novamente em instantes.', '↻', '#FF4500');
                throw new Error(failure.error || 'API sync request failed');
            }
            let serverState = await response.json();
            rememberSyncBase(serverState);
            // Keep edits made while the request was in flight; the next sync sends
            // their delta against this response rather than losing them on render.
            if (hasLoginSession) {
                const currentSnapshot = AnivoidSync.clientSnapshot(readClientState(this), this.loggedInUser);
                if (!AnivoidSync.equal(sentSnapshot, currentSnapshot)) serverState = AnivoidSync.mergeClientState(currentSnapshot, sentSnapshot, serverState, this.loggedInUser, isCurrentUserAdmin());
            }
            if (serverState.viewerUsername) {
                setAuthSession(serverState.viewerUsername);
                this.loggedInUser = serverState.viewerUsername;
            }

            // Update local memory and localStorage with the merged server state
            if (serverState.animes && Array.isArray(serverState.animes)) {
                this.animes = serverState.animes;

                this.repairDerivedRatings();
                localStorage.setItem('anivoid_list_v2', JSON.stringify(this.animes));
            }
            if (serverState.studioLogos && typeof serverState.studioLogos === 'object') {
                this.studioLogos = serverState.studioLogos;
                localStorage.setItem('anivoid_studio_logos', JSON.stringify(this.studioLogos));
            }
            // Check new activities and trigger Toasts
            if (serverState.activities && Array.isArray(serverState.activities)) {
                const isFirstLoad = this.knownActivityIds.size === 0;
                const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';

                serverState.activities.forEach(act => {
                    if (!this.knownActivityIds.has(act.id)) {
                        this.knownActivityIds.add(act.id);
                        if (!isFirstLoad) {
                            if (!loggedInUsername || act.username.toLowerCase() !== loggedInUsername.toLowerCase()) {
                                showToast(
                                    act.username,
                                    `${act.details} em **${act.animeTitle}**`,
                                    act.userAvatar,
                                    act.userColor
                                );
                                pushNotification({
                                    type: act.type || 'activity',
                                    title: act.username,
                                    message: `${act.details || 'interagiu'} em ${act.animeTitle || 'um anime'}`,
                                    avatar: act.userAvatar,
                                    color: act.userColor,
                                    animeId: act.animeId,
                                    timestamp: act.timestamp
                                });
                            }
                        }
                    }
                });
                this.activities = serverState.activities;
                localStorage.setItem('anivoid_activities_v1', JSON.stringify(this.activities));
                renderActivitiesFeed();
                renderRecommendationsRail();
            }

            // Check new friend requests/acceptances before updating localStorage
            if (serverState.registeredUsers && Array.isArray(serverState.registeredUsers) && this.loggedInUser) {
                try {
                    const prevUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                    const prevMe = prevUsers.find(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                    const nextMe = serverState.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
 
                    if (prevMe && nextMe) {
                        mergeServerNotifications(nextMe.notifications || []);
                        const prevReqs = new Set((prevMe.friendRequests || []).map(r => r.from.toLowerCase()));
                        (nextMe.friendRequests || []).forEach(r => {
                            if (r.from && !prevReqs.has(r.from.toLowerCase())) {
                                pushNotification({
                                    type: 'friend_request',
                                    title: 'Solicitacao de amizade',
                                    message: `${r.from} te enviou um convite.`,
                                    color: '#FF4500',
                                    timestamp: r.createdAt || new Date().toISOString()
                                });
                                const sender = serverState.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === r.from.toLowerCase()) || { avatar: '👤', color: '#FF4500' };
                                showToast('Solicitação de Amizade 🤝', `**${r.from}** te enviou um convite!`, sender.avatar, sender.color);
                            }
                        });
 
                        const prevFrs = new Set((prevMe.friends || []).map(f => f.toLowerCase()));
                        (nextMe.friends || []).forEach(f => {
                            if (f && !prevFrs.has(f.toLowerCase())) {
                                pushNotification({
                                    type: 'friend_accept',
                                    title: 'Nova amizade',
                                    message: `${f} agora esta na sua lista.`,
                                    color: '#22c55e'
                                });
                                const friendObj = serverState.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === f.toLowerCase()) || { avatar: '👤', color: '#00FF00' };
                                showToast('Nova Amizade! 🎉', `**${f}** aceitou seu convite de amizade!`, friendObj.avatar, friendObj.color);
                            }
                        });
                    }
                } catch (err) {}
            }

            if (serverState.registeredUsers && Array.isArray(serverState.registeredUsers)) {
                if (this.loggedInUser) {
                    const nextMeForNotifications = serverState.registeredUsers.find(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                    if (nextMeForNotifications) mergeServerNotifications(nextMeForNotifications.notifications || []);
                }
                const mergedUsers = serverState.registeredUsers;
                storeRegisteredUsers(mergedUsers);
            }
            // After updating registeredUsers in localStorage, also read current user's featuredAnimeId
            // (so when we switch friend tabs the banner shows the right anime)
            if (this.loggedInUser) {
                try {
                    const updatedUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                    const me = updatedUsers.find(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                    if (me && me.featuredAnimeId !== undefined) {
                        this.featuredAnimeId = me.featuredAnimeId;
                        if (this.featuredAnimeId) {
                            localStorage.setItem('anivoid_featured_anime_id', this.featuredAnimeId);
                        } else {
                            localStorage.removeItem('anivoid_featured_anime_id');
                        }
                    }
                } catch(e) {}
            }
            if (serverState.featuredAnimeId !== undefined && !this.loggedInUser) {
                this.featuredAnimeId = serverState.featuredAnimeId;
                if (this.featuredAnimeId) {
                    localStorage.setItem('anivoid_featured_anime_id', this.featuredAnimeId);
                } else {
                    localStorage.removeItem('anivoid_featured_anime_id');
                }
            }

            // Reload dynamic friends list
            this.loadLocalSession();

            // Capture state after update
            const nextAnimesStr = deterministicStringify(this.animes);
            const nextFeaturedId = this.featuredAnimeId;
            let nextUsersStr = '';
            try {
                const parsedUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                nextUsersStr = deterministicStringify(parsedUsers);
            } catch (e) {}

            const hasChanged = prevAnimesStr !== nextAnimesStr || 
                               prevFeaturedId !== nextFeaturedId || 
                               prevUsersStr !== nextUsersStr;

            return hasChanged;
        } catch (err) {
            this.lastSyncError = err;
            console.error('Error during state synchronization:', err);
            return false;
        }
    }

    save() {
        this.repairDerivedRatings();
        localStorage.setItem('anivoid_friends_v2', JSON.stringify(this.friends));
        localStorage.setItem('anivoid_list_v2', JSON.stringify(this.animes));
        localStorage.setItem('anivoid_studio_logos', JSON.stringify(this.studioLogos || {}));
        localStorage.setItem('anivoid_current_friend_v2', this.currentFriendId);
        if (this.featuredAnimeId) {
            localStorage.setItem('anivoid_featured_anime_id', this.featuredAnimeId);
        } else {
            localStorage.removeItem('anivoid_featured_anime_id');
        }
        localStorage.setItem('anivoid_activities_v1', JSON.stringify(this.activities || []));
        // Also persist featuredAnimeId into the logged-in user's profile
        if (this.loggedInUser) {
            try {
                const users = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                const meIdx = users.findIndex(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                if (meIdx >= 0) {
                    users[meIdx] = { ...users[meIdx], featuredAnimeId: this.featuredAnimeId || null };
                    storeRegisteredUsers(users);
                }
            } catch(e) {}
        }
        
        if (this.saveRefreshTimer) clearTimeout(this.saveRefreshTimer);
        this.saveRefreshTimer = setTimeout(() => {
            this.saveRefreshTimer = null;
            this.syncWithServer().then((hasChanged) => {
            // Reload session so state.friends reflects the server's authoritative friends list
            this.loadLocalSession();
            updateProfileIndicator();
            renderFriendsDropdown();
            updateNotificationBadges();
            if (!hasChanged) return;

            if (!this.activeDetailAnimeId) {
                renderAnimeGrid();
                renderFeaturedBanner();
                renderRecommendationsRail();
                return;
            }

            if (this.activeDetailAnimeId) {
                const anime = this.animes.find(a => a.id === this.activeDetailAnimeId);
                if (anime) {
                    renderComments(anime);
                    renderAnimeHistory(anime);
                    // Update breakdown list
                    const breakdownContainer = document.getElementById('detail-ratings-breakdown');
                    if (breakdownContainer) {
                        breakdownContainer.innerHTML = '';
                        this.friends.forEach(friend => {
                            const rating = anime.ratings?.[friend.id];
                            const status = rating?.status || 'Plan to Watch';
                            const epsWatched = rating?.episodesWatched || 0;
                            const totalEps = parseInt(anime.episodes) || 0;
                            const overall = rating?.overall || '-';
                            const statusObj = STATUS_MAP[status] || STATUS_MAP['Plan to Watch'];
                            
                            const ratedEpsCount = rating?.episodeRatings ? Object.keys(rating.episodeRatings).length : 0;
                            let ratedText = '';
                            if (totalEps === 1) {
                                ratedText = ratedEpsCount > 0 ? 'filme avaliado' : 'sem nota';
                            } else {
                                ratedText = ratedEpsCount > 0 ? `${ratedEpsCount} eps avaliados` : 'sem notas de ep';
                            }
                            
                            const overallColorInfo = getScoreColor(overall);
                            const overallTextStyle = overall !== '-' ? `color: ${overallColorInfo.text}; text-shadow: 0 0 6px ${overallColorInfo.glow}` : 'color: #7f8c8d';
                            
                            const card = document.createElement('div');
                            const isFriendAdmin = friend.id === 'felipe' || (friend.name && friend.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe');
                            const adminBadge = getUserBadgesHtml(friend);
                            card.className = `glass-panel border rounded-2xl p-4 flex justify-between items-center text-sm cursor-pointer hover:border-brand/25 transition-colors ${isFriendAdmin ? 'border-brand/35 shadow-[0_0_15px_rgba(255,69,0,0.12)] bg-brand/[0.03]' : 'border-white/5'}`;
                            const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
                                ? `<img src="${friend.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
                                : `<span class="text-2xl">${friend.avatar || '👤'}</span>`;
                            card.innerHTML = `
                                <div class="flex items-center gap-3">
                                    ${avatarHtml}
                                    <div>
                                        <p class="font-semibold text-white" style="color: ${getUserDisplayNameColor(friend, friend.color)}">${friend.name}${adminBadge}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-[8px] uppercase tracking-wider font-mono px-2 py-0.5 border ${statusObj.border} ${statusObj.bg} ${statusObj.text} rounded-full">
                                                ${statusObj.label} (${epsWatched}/${totalEps > 0 ? totalEps : '?'})
                                            </span>
                                            <span class="text-[9px] text-gray-500 font-mono">${ratedText}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="text-[9px] uppercase text-gray-500 font-mono">Nota</span>
                                    <span class="text-lg font-serif font-bold" style="${overallTextStyle}">${overall}</span>
                                </div>
                            `;
                            card.addEventListener('click', () => renderPlayerProfileModal(friend.id));
                            breakdownContainer.appendChild(card);
                        });
                    }
                }
            }
            });
        }, 350);
    }

    recordActivity(type, anime, details, friendId = this.currentFriendId) {
        const actorId = normalizeProfileId(this.loggedInUser || localStorage.getItem('anivoid_logged_in_username') || '');
        const targetId = normalizeProfileId(friendId);
        if (!actorId || !anime || !anime.id || !details || (targetId && targetId !== actorId)) return;

        const profile = findRegisteredUserById(actorId) || {};
        const friendProfile = (this.friends || []).find(friend => friend && friend.id === actorId) || {};
        const username = profile.username || this.loggedInUser || friendProfile.name || 'Usu\u00e1rio';
        const userColor = profile.color || friendProfile.color || '#FF4500';
        const userAvatar = profile.avatar || friendProfile.avatar || '&#128100;';
        const timestamp = new Date().toISOString();
        const minuteBucket = Math.floor(Date.now() / 60000);
        const eventKey = [normalizeProfileId(username), type, anime.id, details, minuteBucket].join('|');

        const hasSameRecentActivity = (this.activities || []).some(activity => {
            if (!activity) return false;
            const activityTime = new Date(activity.timestamp || 0).getTime();
            const activityMinute = Number.isFinite(activityTime) ? Math.floor(activityTime / 60000) : 0;
            const currentKey = [normalizeProfileId(activity.username), activity.type, activity.animeId, activity.details, activityMinute].join('|');
            return currentKey === eventKey;
        });
        if (hasSameRecentActivity) return;

        const nextActivity = {
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            username,
            userColor,
            userAvatar,
            type,
            animeId: anime.id,
            animeTitle: anime.title || 'Anime',
            details,
            timestamp
        };

        const seen = new Set();
        this.activities = [nextActivity, ...(this.activities || [])]
            .filter(activity => {
                if (!activity || !activity.id) return false;
                if (seen.has(activity.id)) return false;
                seen.add(activity.id);
                return true;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 80);

        localStorage.setItem('anivoid_activities_v1', JSON.stringify(this.activities));
        if (typeof renderActivitiesFeed === 'function') renderActivitiesFeed();
    }

    async sendFriendRequest(targetUsername) {
        if (!this.loggedInUser) return { error: 'Faça login primeiro' };
        try {
            const response = await fetch(API_BASE_URL + '/api/send-friend-request', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ to: targetUsername })
            });
            const data = await response.json();
            if (!response.ok) {
                return { error: data.error || 'Erro ao enviar solicitação' };
            }
            if (data.registeredUsers) {
                storeRegisteredUsers(data.registeredUsers);
                this.loadLocalSession();
            }
            return { success: true };
        } catch (err) {
            console.error('Error sending friend request:', err);
            return { error: 'Erro de conexão com o servidor' };
        }
    }

    async respondFriendRequest(targetUsername, action) {
        if (!this.loggedInUser) return { error: 'Faça login primeiro' };
        try {
            const response = await fetch(API_BASE_URL + '/api/respond-friend-request', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ target: targetUsername, action })
            });
            const data = await response.json();
            if (!response.ok) {
                return { error: data.error || 'Erro ao responder solicitação' };
            }
            if (data.registeredUsers) {
                storeRegisteredUsers(data.registeredUsers);
                this.loadLocalSession();
            }
            return { success: true };
        } catch (err) {
            console.error('Error responding to friend request:', err);
            return { error: 'Erro de conexão com o servidor' };
        }
    }

    async cancelFriendRequest(targetUsername) {
        if (!this.loggedInUser) return { error: 'Faca login primeiro' };
        try {
            const response = await fetch(API_BASE_URL + '/api/cancel-friend-request', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ target: targetUsername })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { error: data.error || 'Erro ao cancelar solicitacao' };
            }
            if (data.registeredUsers) {
                storeRegisteredUsers(data.registeredUsers);
                this.loadLocalSession();
            }
            return { success: true };
        } catch (err) {
            console.error('Error canceling friend request:', err);
            return { error: 'Erro de conexao com o servidor' };
        }
    }

    async setFriendship(targetUsername) {
        if (!this.loggedInUser) return { error: 'Faça login primeiro' };
        try {
            const response = await fetch(API_BASE_URL + '/api/admin/set-friendship', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ target: targetUsername })
            });
            const data = await response.json();
            if (!response.ok) {
                return { error: data.error || 'Erro ao confirmar amizade' };
            }
            if (data.registeredUsers) {
                storeRegisteredUsers(data.registeredUsers);
                this.loadLocalSession();
            }
            return { success: true };
        } catch (err) {
            console.error('Error confirming friendship:', err);
            return { error: 'Erro de conexão com o servidor' };
        }
    }

    async removeFriend(targetUsername) {
        if (!this.loggedInUser) return { error: 'Faça login primeiro' };
        try {
            const response = await fetch(API_BASE_URL + '/api/remove-friend', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ target: targetUsername })
            });
            const data = await response.json();
            if (!response.ok) {
                return { error: data.error || 'Erro ao remover amigo' };
            }
            if (data.registeredUsers) {
                storeRegisteredUsers(data.registeredUsers);
                
                // If we were currently viewing this friend's profile, switch back to ourselves!
                const targetId = targetUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (this.currentFriendId === targetId) {
                    this.currentFriendId = this.loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
                }
                
                this.loadLocalSession();
            }
            return { success: true };
        } catch (err) {
            console.error('Error removing friend:', err);
            return { error: 'Erro de conexão com o servidor' };
        }
    }

    getCurrentFriend() {
        return this.friends.find(f => f.id === this.currentFriendId) || this.friends[0];
    }

    getGenres() {
        const genresSet = new Set();
        this.animes.forEach(anime => {
            if (anime.genres && Array.isArray(anime.genres)) {
                anime.genres.forEach(g => genresSet.add(g));
            }
        });
        return Array.from(genresSet);
    }

    getSeasons() {
        const seasonsSet = new Set();
        this.animes.forEach(anime => seasonsSet.add(anime.season));
        return Array.from(seasonsSet).filter(Boolean);
    }

    getStudios() {
        const studiosSet = new Set();
        this.animes.forEach(anime => {
            if (anime.studio) studiosSet.add(anime.studio);
        });
        return Array.from(studiosSet).sort((a, b) => a.localeCompare(b));
    }

    getYears() {
        const yearsSet = new Set();
        this.animes.forEach(anime => {
            const match = String(anime.season || '').match(/\b(19|20)\d{2}\b/);
            if (match) yearsSet.add(match[0]);
        });
        return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    }

    calculateAverageScore(animeId) {
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime || !anime.ratings) return 0;

        // Include ALL users who have rated this anime (friends + any registered user)
        // This ensures non-friends like yamazx still contribute to the group score
        const ratingsEntries = Object.entries(anime.ratings);

        const ratingsValues = ratingsEntries
            .map(([_, r]) => parseFloat(r.overall))
            .filter(val => val !== undefined && val !== null && !isNaN(val) && val > 0);
            
        if (ratingsValues.length === 0) return 0;
        const sum = ratingsValues.reduce((acc, val) => acc + val, 0);
        return parseFloat((sum / ratingsValues.length).toFixed(2));
    }

    calculateCategoryAverage(animeId, category) {
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime || !anime.ratings) return 0;
        
        // Identify allowed user IDs for the group (logged-in user + their friends)
        const groupUserIds = new Set();
        if (this.loggedInUser) {
            groupUserIds.add(this.loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
        if (this.friends && Array.isArray(this.friends)) {
            this.friends.forEach(f => {
                if (f.id) groupUserIds.add(f.id.toLowerCase().replace(/[^a-z0-9]/g, ''));
            });
        }

        let ratingsEntries = Object.entries(anime.ratings);
        
        // If logged in, restrict to group members
        if (this.loggedInUser) {
            ratingsEntries = ratingsEntries.filter(([userId]) => groupUserIds.has(userId));
        }

        const ratingsValues = ratingsEntries
            .map(([_, r]) => parseFloat(r[category]))
            .filter(val => val !== undefined && val !== null && !isNaN(val) && val > 0);
            
        if (ratingsValues.length === 0) return 0;
        const sum = ratingsValues.reduce((acc, val) => acc + val, 0);
        return parseFloat((sum / ratingsValues.length).toFixed(1));
    }

    initFriendRatingIfMissing(anime, friendId) {
        if (!anime.ratings) anime.ratings = {};
        if (!anime.ratings[friendId]) {
            anime.ratings[friendId] = {
                animation: 0,
                story: 0,
                sound: 0,
                overall: 0,
                status: 'Plan to Watch',
                episodesWatched: 0,
                episodeRatings: {},
                watchedEpisodesMap: {}
            };
        } else {
            if (!anime.ratings[friendId].episodeRatings) {
                anime.ratings[friendId].episodeRatings = {};
            }
            if (!anime.ratings[friendId].watchedEpisodesMap) {
                anime.ratings[friendId].watchedEpisodesMap = {};
            }
        }
    }

    calculateUserOverallFromEpisodes(anime, friendId) {
        const rating = anime.ratings?.[friendId];
        if (!rating || !rating.episodeRatings) return 0;
        const vals = Object.values(rating.episodeRatings).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        if (vals.length === 0) return 0;
        const sum = vals.reduce((a, b) => a + b, 0);
        return parseFloat((sum / vals.length).toFixed(1));
    }

    repairDerivedRatings() {
        if (!Array.isArray(this.animes)) return false;
        let changed = false;

        this.animes.forEach(anime => {
            if (!anime || !anime.ratings) return;
            if (normalizeRatingMapKeys(anime.ratings)) changed = true;
            Object.values(anime.ratings).forEach(rating => {
                if (!rating || typeof rating !== 'object') return;
                if (!rating.episodeRatings || typeof rating.episodeRatings !== 'object') {
                    rating.episodeRatings = {};
                }

                const episodeScores = Object.values(rating.episodeRatings)
                    .map(score => parseFloat(score))
                    .filter(score => !isNaN(score) && score > 0);

                if (episodeScores.length === 0) return;

                const episodeAverage = parseFloat((episodeScores.reduce((sum, score) => sum + score, 0) / episodeScores.length).toFixed(1));
                const currentOverall = parseFloat(rating.overall);

                if (isNaN(currentOverall) || currentOverall <= 0 || currentOverall.toFixed(1) !== episodeAverage.toFixed(1)) {
                    rating.overall = episodeAverage;
                    changed = true;
                }
            });
        });

        return changed;
    }

    setEpisodeRating(animeId, friendId, epNum, ratingVal) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            
            if (ratingVal === 0 || ratingVal === null || ratingVal === '') {
                delete r.episodeRatings[epNum];
            } else {
                r.episodeRatings[epNum] = parseFloat(ratingVal);
                // Also implicitly mark as watched if rated!
                const epInt = parseInt(epNum);
                if (!r.watchedEpisodesMap || typeof r.watchedEpisodesMap !== 'object' || Object.keys(r.watchedEpisodesMap).length === 0) {
                    r.watchedEpisodesMap = {};
                    const prevWatched = parseInt(r.episodesWatched) || 0;
                    for (let k = 1; k <= prevWatched; k++) {
                        r.watchedEpisodesMap[k] = true;
                    }
                }
                r.watchedEpisodesMap[epInt] = true;
                const count = Object.values(r.watchedEpisodesMap).filter(Boolean).length;
                r.episodesWatched = count;
                const maxEps = parseInt(anime.episodes) || 0;
                if (maxEps > 0 && count === maxEps) r.status = 'Completed';
                else if (count > 0 && r.status === 'Plan to Watch') r.status = 'Watching';
            }
            
            // Recalculate overall rating
            const epOverall = this.calculateUserOverallFromEpisodes(anime, friendId);
            if (epOverall > 0) {
                r.overall = epOverall;
            } else {
                const catAvg = parseFloat(((r.animation + r.story + r.sound) / 3).toFixed(1));
                r.overall = catAvg > 0 ? catAvg : 0;
            }
            r.updatedAt = new Date().toISOString();
            if (parseFloat(ratingVal) > 0) {
                this.recordActivity('rating', anime, `avaliou com nota ${r.overall}`, friendId);
            }
            
            this.save();
        }
    }

    setGeneralRating(animeId, friendId, generalScore, applyToAll = false) {
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime) return;
        this.initFriendRatingIfMissing(anime, friendId);
        const r = anime.ratings[friendId];
        const score = parseFloat(generalScore);
        if (isNaN(score) || score < 0.1 || score > 10) return;
        const maxEps = parseInt(anime.episodes) || 0;
        let epsWatched = r.episodesWatched || 0;
        if (!r.episodeRatings) r.episodeRatings = {};

        if (maxEps <= 1) {
            r.episodeRatings[1] = score;
            r.overall = score;
            r.episodesWatched = 1;
            if (!r.watchedEpisodesMap) r.watchedEpisodesMap = {};
            r.watchedEpisodesMap[1] = true;
            r.status = 'Completed';
        } else if (applyToAll || epsWatched === 0) {
            const targetCount = maxEps > 0 ? maxEps : Math.max(1, epsWatched);
            if (!r.watchedEpisodesMap) r.watchedEpisodesMap = {};
            for (let i = 1; i <= targetCount; i++) {
                r.episodeRatings[i] = score;
                r.watchedEpisodesMap[i] = true;
            }
            r.episodesWatched = targetCount;
            r.status = 'Completed';
            r.overall = score;
        } else {
            for (let i = 1; i <= epsWatched; i++) {
                r.episodeRatings[i] = score;
            }
            const epOverall = this.calculateUserOverallFromEpisodes(anime, friendId);
            r.overall = epOverall > 0 ? epOverall : score;
        }
        r.updatedAt = new Date().toISOString();
        this.recordActivity('rating', anime, `avaliou com nota ${r.overall}`, friendId);
        this.save();
    }

    toggleEpisodeWatched(animeId, friendId, epNum, isWatched) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const maxEps = parseInt(anime.episodes) || 0;
            const epInt = parseInt(epNum);
            
            if (!r.watchedEpisodesMap || typeof r.watchedEpisodesMap !== 'object' || Object.keys(r.watchedEpisodesMap).length === 0) {
                r.watchedEpisodesMap = {};
                const prevWatched = parseInt(r.episodesWatched) || 0;
                for (let k = 1; k <= prevWatched; k++) {
                    r.watchedEpisodesMap[k] = true;
                }
            }
            
            if (isWatched) {
                // Ao marcar um episódio (ex: 19), todos os anteriores (1 até 19) são marcados automaticamente
                for (let k = 1; k <= epInt; k++) {
                    r.watchedEpisodesMap[k] = true;
                }
            } else {
                // Ao desmarcar um episódio, desmarca o episódio e os superiores
                const limit = maxEps > 0 ? maxEps : Math.max(0, ...Object.keys(r.watchedEpisodesMap).map(Number), epInt);
                for (let k = epInt; k <= limit; k++) {
                    delete r.watchedEpisodesMap[k];
                    if (r.episodeRatings && r.episodeRatings[k]) {
                        delete r.episodeRatings[k];
                    }
                }
                const epOverall = this.calculateUserOverallFromEpisodes(anime, friendId);
                if (epOverall > 0) {
                    r.overall = epOverall;
                } else {
                    const catAvg = parseFloat(((r.animation + r.story + r.sound) / 3).toFixed(1));
                    r.overall = catAvg > 0 ? catAvg : 0;
                }
            }
            
            const count = Object.values(r.watchedEpisodesMap).filter(Boolean).length;
            r.episodesWatched = count;
            
            // Auto status transition
            if (maxEps > 0 && count === maxEps) {
                r.status = 'Completed';
            } else if (r.status === 'Completed') {
                r.status = count > 0 ? 'Watching' : 'Plan to Watch';
            } else if (count > 0 && r.status === 'Plan to Watch') {
                r.status = 'Watching';
            }
            
            r.updatedAt = new Date().toISOString();
            this.save();
        }
    }

    calculateEpisodeAverage(animeId, epNum) {
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime || !anime.ratings) return 0;
        
        const ratings = Object.values(anime.ratings)
            .map(r => r.episodeRatings?.[epNum])
            .filter(val => val !== undefined && val !== null && val > 0);
            
        if (ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, val) => acc + val, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    getRelatedSeasons(animeId) {
        const currentAnime = this.animes.find(a => a.id === animeId);
        if (!currentAnime) return [];
        
        // Clean and tokenize the current title to find core words
        // e.g. "Solo Leveling Season 2" -> "Solo Leveling"
        const cleanTitle = currentAnime.title.split(/Season|season|Temporada|:/)[0].trim().toLowerCase();
        const words = cleanTitle.split(/\s+/).filter(w => w.length > 3);
        
        if (words.length === 0) return [];
        
        return this.animes.filter(a => {
            if (a.id === animeId) return false;
            const targetTitle = a.title.toLowerCase();
            return words.some(word => targetTitle.includes(word));
        });
    }

    setRating(animeId, friendId, category, val) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            r[category] = parseFloat(val);
            
            // Auto calculate overall
            r.overall = parseFloat(((r.animation + r.story + r.sound) / 3).toFixed(1));
            r.updatedAt = new Date().toISOString();
            if (Number.isFinite(Number(r.overall)) && Number(r.overall) > 0) {
                this.recordActivity('rating', anime, `avaliou com nota ${r.overall}`, friendId);
            }
            this.save();
        }
    }

    setStatus(animeId, friendId, statusVal) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const previousStatus = r.status || 'Plan to Watch';
            r.status = statusVal;
            
            // Auto episodes watched on completed
            const totalEps = parseInt(anime.episodes) || 0;
            if (statusVal === 'Completed' && totalEps > 0) {
                r.episodesWatched = totalEps;
            }
            r.updatedAt = new Date().toISOString();
            if (statusVal !== previousStatus) {
                const statusPhrases = {
                    Watching: 'comecou a assistir',
                    Completed: 'concluiu a obra',
                    'On Hold': 'colocou em espera',
                    Dropped: 'abandonou a obra',
                    'Plan to Watch': 'adicionou a lista'
                };
                this.recordActivity('status', anime, statusPhrases[statusVal] || `marcou como ${statusVal}`, friendId);
            }
            this.save();
        }
    }

    setEpisodesWatched(animeId, friendId, epCount) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const maxEps = parseInt(anime.episodes) || 0;
            const previousWatched = Number(r.episodesWatched || 0);
            const previousStatus = r.status || 'Plan to Watch';
            let val = Math.max(0, epCount);
            if (maxEps > 0) val = Math.min(val, maxEps);
            r.episodesWatched = val;
            
            // Sync watchedEpisodesMap to be contiguous up to val
            r.watchedEpisodesMap = {};
            for (let k = 1; k <= val; k++) {
                r.watchedEpisodesMap[k] = true;
            }
            
            // Auto status transition
            if (maxEps > 0 && val === maxEps) {
                r.status = 'Completed';
            } else if (r.status === 'Completed') {
                r.status = val > 0 ? 'Watching' : 'Plan to Watch';
            } else if (val > 0 && r.status === 'Plan to Watch') {
                r.status = 'Watching';
            }
            r.updatedAt = new Date().toISOString();
            if (val > previousWatched && val !== maxEps) {
                this.recordActivity('progress', anime, `assistiu ao episodio ${val}`, friendId);
            }
            if (r.status !== previousStatus) {
                const statusPhrases = {
                    Watching: 'comecou a assistir',
                    Completed: 'concluiu a obra',
                    'On Hold': 'colocou em espera',
                    Dropped: 'abandonou a obra',
                    'Plan to Watch': 'adicionou a lista'
                };
                this.recordActivity('status', anime, statusPhrases[r.status] || `marcou como ${r.status}`, friendId);
            }
            this.save();
        }
    }

    incrementEpisode(animeId, friendId) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const maxEps = parseInt(anime.episodes) || 0;
            const current = r.episodesWatched || 0;
            
            if (maxEps === 0 || current < maxEps) {
                this.setEpisodesWatched(animeId, friendId, current + 1);
            }
        }
    }

    getGroupStatusStats(animeId) {
        const anime = this.animes.find(a => a.id === animeId);
        const stats = { 'Watching': 0, 'Completed': 0, 'On Hold': 0, 'Dropped': 0, 'Plan to Watch': 0 };
        if (!anime || !anime.ratings) return stats;
        const counted = new Set();

        // Include logged-in user status
        if (this.loggedInUser) {
            const myId = this.loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
            const r = anime.ratings[myId];
            if (r && r.status) {
                stats[r.status] = (stats[r.status] || 0) + 1;
                counted.add(myId);
            }
        }

        // Group members statuses
        if (this.friends && Array.isArray(this.friends)) {
            this.friends.forEach(f => {
                if (counted.has(f.id)) return;
                counted.add(f.id);
                const r = anime.ratings[f.id];
                const status = r?.status || 'Plan to Watch';
                stats[status] = (stats[status] || 0) + 1;
            });
        }
        return stats;
    }

    addComment(animeId, friendId, text, metadata = {}) {
        if (!friendId || typeof friendId !== 'string') return;
        const anime = this.animes.find(a => a.id === animeId);
        let friend = this.friends.find(f => f.id === friendId);
        
        if (!friend) {
            try {
                const registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                const foundUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === friendId.toLowerCase());
                if (foundUser) {
                    friend = { id: friendId, name: foundUser.username, color: foundUser.color, avatar: foundUser.avatar };
                }
            } catch(e) {}
        }
        
        if (!friend) {
            friend = { id: friendId, name: friendId, color: '#FF4500', avatar: '👤' };
        }
        
        if (anime && text.trim()) {
            if (!anime.comments) anime.comments = [];
            anime.comments.push({
                id: 'c_' + Date.now(),
                friendId: friendId,
                friendName: friend.name.replace(' (Você)', ''),
                comment: text.trim(),
                ...window.AnivoidSync.commentMetadata(metadata),
                timestamp: new Date().toISOString(),
                likes: [],
                replies: []
            });
            this.recordActivity('comment_add', anime, 'escreveu uma critica', friendId);
            this.save();
        }
    }

    addReply(animeId, commentId, friendId, text) {
        if (!friendId || !text.trim()) return;
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime) return;
        const comment = (anime.comments || []).find(c => c.id === commentId);
        if (!comment) return;
        if (!comment.replies) comment.replies = [];

        let friend = this.friends.find(f => f.id === friendId);
        if (!friend) {
            try {
                const reg = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                const found = reg.find(u => u && u.username && u.username.toLowerCase() === friendId.toLowerCase());
                if (found) friend = { id: friendId, name: found.username, color: found.color, avatar: found.avatar };
            } catch(e) {}
        }
        if (!friend) friend = { id: friendId, name: friendId, color: '#FF4500', avatar: '👤' };

        comment.replies.push({
            id: 'r_' + Date.now(),
            friendId: friendId,
            friendName: friend.name.replace(' (Você)', ''),
            reply: text.trim(),
            timestamp: new Date().toISOString()
        });
        this.recordActivity('reply_add', anime, 'respondeu uma critica', friendId);
        this.save();
    }

    addNewAnime(title, japaneseTitle, synopsis, genres, studio, season, episodes, coverUrl, studioLogoUrl = '') {
        if (!isCurrentUserAdmin()) {
            throw new Error('Apenas o administrador pode adicionar animes.');
        }
        const studioName = studio.trim() || 'Desconhecido';
        const resolvedStudioLogo = sanitizeStudioLogoUrl(studioLogoUrl) || getStudioLogo(studioName) || '';
        if (resolvedStudioLogo && studioName.toLowerCase() !== 'desconhecido') {
            this.studioLogos = {
                ...(this.studioLogos || {}),
                [studioName]: resolvedStudioLogo
            };
            localStorage.setItem('anivoid_studio_logos', JSON.stringify(this.studioLogos));
        }

        const newAnime = {
            id: 'a_' + Date.now(),
            title: title.trim(),
            japaneseTitle: japaneseTitle.trim() || 'N/A',
            synopsis: synopsis.trim() || 'Sem sinopse disponível.',
            coverUrl: coverUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
            genres: genres.map(g => g.trim()).filter(Boolean),
            studio: studioName,
            studioLogoUrl: resolvedStudioLogo,
            season: season.trim() || 'Outras',
            episodes: episodes.trim() || 'Desconhecido',
            ratings: {},
            comments: []
        };
        this.animes.push(newAnime);
        this.recordActivity('catalog', newAnime, 'adicionou esta obra ao catalogo', getLoggedInProfileId());
        this.save();
        return newAnime;
    }

    addNewFriend(name, avatar, color) {
        const friendUsername = name.trim();
        const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
        
        let registeredUsers = [];
        try {
            registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        } catch (err) {}

        const friendId = friendUsername.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check if this friend is already registered. If not, create a virtual account for them.
        let matchedUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === friendUsername.toLowerCase());
        if (!matchedUser) {
            matchedUser = {
                username: friendUsername,
                email: `${friendId}@virtual.anivoid`,
                color: color || '#FF4500',
                avatar: avatar || '👤',
                isVirtual: true,
                friends: [],
                favoriteGenres: [],
                favoriteStudios: [],
                favoriteAnimes: []
            };
            registeredUsers.push(matchedUser);
            storeRegisteredUsers(registeredUsers);
        }

        // Add this friend to the logged-in user's friend list
        if (loggedInUsername) {
            const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
            if (curUser) {
                if (!curUser.friends) curUser.friends = [];
                if (!curUser.friends.some(f => f.toLowerCase().replace(/[^a-z0-9]/g, '') === friendId)) {
                    curUser.friends.push(matchedUser.username);
                    storeRegisteredUsers(registeredUsers);
                }
            }
        }

        // Reload local session from cached data so the friends list is updated instantly
        this.loadLocalSession();

        const addedFriend = this.friends.find(f => f.id === friendId) || {
            id: friendId,
            name: matchedUser.username,
            avatar: matchedUser.avatar,
            color: matchedUser.color
        };

        this.save();
        return addedFriend;
    }

    getFilteredAnimeList() {
        // ── Deduplicate by normalized title (keep entry with most ratings) ──
        const titleMap = new Map();
        this.animes.forEach(anime => {
            const key = (anime.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
            if (!titleMap.has(key)) {
                titleMap.set(key, anime);
            } else {
                const existing = titleMap.get(key);
                const existingScore = Object.keys(existing.ratings || {}).length;
                const newScore = Object.keys(anime.ratings || {}).length;
                // Keep the one with more ratings; on tie keep the one with more comments
                if (newScore > existingScore ||
                   (newScore === existingScore && (anime.comments || []).length > (existing.comments || []).length)) {
                    titleMap.set(key, anime);
                }
            }
        });
        const dedupedAnimes = Array.from(titleMap.values());

        return dedupedAnimes.filter(anime => {
            const archivedJujutsuSeason = anime.id === 'a20' || anime.id === 'a20_s2';
            const shouldShowArchivedSeason = this.sortBy === 'my-score' ||
                this.searchQuery.trim().length > 0 ||
                this.filterSeason !== 'All' ||
                this.filterGenre !== 'All' ||
                this.filterStudio !== 'All' ||
                this.filterYear !== 'All' ||
                this.filterScore !== 'All' ||
                this.filterMALStatus !== 'All';
            if (archivedJujutsuSeason && !shouldShowArchivedSeason) return false;

            // Search match
            const matchesSearch = matchesAnimeSearch(anime, this.searchQuery);
            
            // Season match
            const matchesSeason = this.filterSeason === 'All' || anime.season === this.filterSeason;
            
            // Genre match
            const matchesGenre = this.filterGenre === 'All' || (anime.genres && Array.isArray(anime.genres) && anime.genres.includes(this.filterGenre));

            const matchesStudio = this.filterStudio === 'All' || anime.studio === this.filterStudio;
            const animeYearMatch = String(anime.season || '').match(/\b(19|20)\d{2}\b/);
            const animeYear = animeYearMatch ? animeYearMatch[0] : '';
            const matchesYear = this.filterYear === 'All' || animeYear === this.filterYear;
            const avgScoreForFilter = this.calculateAverageScore(anime.id);
            const myScoreForFilter = parseFloat(anime.ratings?.[this.currentFriendId]?.overall) || 0;
            const scoreBase = this.sortBy === 'my-score' ? myScoreForFilter : avgScoreForFilter;
            const scoreThresholds = {
                '9+': 9,
                '8+': 8,
                '7+': 7,
                'unrated': 0
            };
            const matchesScore = this.filterScore === 'All'
                || (this.filterScore === 'unrated' ? scoreBase <= 0 : scoreBase >= scoreThresholds[this.filterScore]);

            // MAL Status match
            const friendRating = anime.ratings?.[this.currentFriendId];
            const activeStatus = friendRating?.status || 'Plan to Watch';
            const matchesMALStatus = this.filterMALStatus === 'All' || activeStatus === this.filterMALStatus;
            
            // When sorting by personal score, only show animes the user actually rated
            const friendRatingForSort = anime.ratings?.[this.currentFriendId];
            const hasPersonalScore = friendRatingForSort && parseFloat(friendRatingForSort.overall) > 0;
            const matchesMyScore = this.sortBy !== 'my-score' || hasPersonalScore || this.searchQuery.trim().length > 0;

            return matchesSearch && matchesSeason && matchesGenre && matchesStudio && matchesYear && matchesScore && matchesMALStatus && matchesMyScore;
        }).sort((a, b) => {
            if (this.sortBy === 'group-score') {
                return this.calculateAverageScore(b.id) - this.calculateAverageScore(a.id);
            } else if (this.sortBy === 'my-score') {
                const scoreA = parseFloat(a.ratings?.[this.currentFriendId]?.overall) || 0;
                const scoreB = parseFloat(b.ratings?.[this.currentFriendId]?.overall) || 0;
                return scoreB - scoreA;
            } else if (this.sortBy === 'year-desc') {
                const yearA = Number((String(a.season || '').match(/\b(19|20)\d{2}\b/) || [0])[0]) || 0;
                const yearB = Number((String(b.season || '').match(/\b(19|20)\d{2}\b/) || [0])[0]) || 0;
                return yearB - yearA || a.title.localeCompare(b.title);
            } else if (this.sortBy === 'recent-added') {
                const idTime = anime => Number(String(anime.id || '').replace(/^a_/, '')) || 0;
                return idTime(b) - idTime(a) || a.title.localeCompare(b.title);
            } else {
                return a.title.localeCompare(b.title);
            }
        });
    }
}

// Initialise Global State
const state = new AppState();
window.__anivoidState = state;
const projectUI = window.AnivoidUI?.site.connect({
    state,
    statuses: STATUS_MAP,
    users: getRegisteredUsersSafe,
    viewerId: getLoggedInProfileId,
    normalizeId: normalizeProfileId,
    studioLogo: getStudioLogo,
    studioDescription: getStudioDescription,
    standardStudio: getStandardStudioName,
    open: (id, animate = true) => openAnimeDetail(id, animate),
    studio: (name, animate = true) => window.switchTabToStudio(name, animate),
    catalog: () => window.switchTabToAll('#anime-grid-section', true),
    allStudios: () => window.backToStudiosLanding(),
    like: toggleCommentLike,
    history: renderAnimeHistory,
    metadata: value => window.AnivoidSync.commentMetadata(value),
    status: renderDetailStatus
});

const NOTIFICATIONS_KEY = 'anivoid_notifications_v1';

function escapeHtml(value) {
    const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
    let text = String(value ?? '');
    for (let pass = 0; pass < 4; pass++) {
        const decoded = text.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity]);
        if (decoded === text) break;
        text = decoded;
    }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getRegisteredUsersSafe() {
    try {
        const users = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        return Array.isArray(users) ? users.map(stripSensitiveUserFields) : [];
    } catch (err) {
        return [];
    }
}

function getLoggedInProfileId() {
    return normalizeProfileId(state.loggedInUser || localStorage.getItem('anivoid_logged_in_username') || '');
}

function findRegisteredUserById(profileId) {
    const cleanId = normalizeProfileId(profileId);
    return getRegisteredUsersSafe().find(user => normalizeProfileId(user?.username) === cleanId) || null;
}

function getRecommendationPeerIds(profileId) {
    const cleanId = normalizeProfileId(profileId);
    const peerIds = new Set();
    const users = getRegisteredUsersSafe();
    const profileUser = users.find(user => normalizeProfileId(user?.username) === cleanId);

    (profileUser?.friends || []).forEach(friendName => {
        const friendId = normalizeProfileId(friendName);
        if (friendId && friendId !== cleanId) peerIds.add(friendId);
    });

    if (!peerIds.size && cleanId === getLoggedInProfileId()) {
        (state.friends || []).forEach(friend => {
            const friendId = normalizeProfileId(friend?.id || friend?.name);
            if (friendId && friendId !== cleanId) peerIds.add(friendId);
        });
    }

    if (!peerIds.size) {
        users.forEach(user => {
            const userId = normalizeProfileId(user?.username);
            if (userId && userId !== cleanId) peerIds.add(userId);
        });
    }

    return peerIds;
}

function recommendationTieBreak(profileId, animeId) {
    const key = `${normalizeProfileId(profileId)}:${animeId || ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 1000) / 1000;
}

function getProfileDisplayUser(profileId = state.currentFriendId) {
    const cleanId = normalizeProfileId(profileId);
    const friend = (state.friends || []).find(item => item && item.id === cleanId);
    const registered = findRegisteredUserById(cleanId);
    if (friend || registered) {
        return {
            id: cleanId,
            username: registered?.username || friend?.name?.replace(' (Voce)', '').replace(' (Voc\u00ea)', '') || cleanId || 'Usu\u00e1rio',
            name: friend?.name || registered?.username || cleanId || 'Usuario',
            avatar: registered?.avatar || friend?.avatar || DEFAULT_AVATAR_SVG,
            banner: registered?.banner || friend?.banner || '',
            color: registered?.color || friend?.color || '#FF4500',
            emailVerified: Boolean(registered?.emailVerified || friend?.emailVerified),
            favoriteGenres: registered?.favoriteGenres || friend?.favoriteGenres || [],
            favoriteStudios: registered?.favoriteStudios || friend?.favoriteStudios || [],
            favoriteAnimes: registered?.favoriteAnimes || friend?.favoriteAnimes || [],
            activeTitle: registered?.activeTitle || friend?.activeTitle || 'admin',
            memberNumber: registered?.memberNumber || friend?.memberNumber
        };
    }
    return {
        id: cleanId,
        username: cleanId || 'Usuario',
        name: cleanId || 'Usuario',
        avatar: DEFAULT_AVATAR_SVG,
        color: '#FF4500',
        favoriteGenres: [],
        favoriteStudios: [],
        favoriteAnimes: []
    };
}

function avatarMarkup(user, sizeClass = 'w-14 h-14', fallbackText = '') {
    const avatar = user?.avatar || DEFAULT_AVATAR_SVG;
    const label = escapeHtml(user?.username || user?.name || fallbackText || 'Usuario');
    if (avatar && (String(avatar).startsWith('data:') || String(avatar).startsWith('http') || String(avatar).startsWith('covers/') || String(avatar).startsWith('logos/'))) {
        return `<img src="${escapeHtml(avatar)}" class="${sizeClass} rounded-full object-cover border border-white/10 shadow-[0_0_18px_rgba(0,0,0,0.45)]" alt="${label}">`;
    }
    return `<span class="${sizeClass} rounded-full bg-white/5 border border-white/10 inline-flex items-center justify-center text-2xl shadow-[0_0_18px_rgba(0,0,0,0.45)]">${escapeHtml(avatar || fallbackText || 'U')}</span>`;
}

function getProfileStats(profileId = state.currentFriendId) {
    const userId = normalizeProfileId(profileId);
    const statusCounts = { Watching: 0, Completed: 0, 'On Hold': 0, Dropped: 0, 'Plan to Watch': 0 };
    const genreScores = {};
    const studioScores = {};
    const ratedAnime = [];
    let totalEpisodes = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let commentsCount = 0;
    let repliesCount = 0;

    (state.animes || []).forEach(anime => {
        const rating = anime?.ratings?.[userId];
        if (rating) {
            const status = rating.status || 'Plan to Watch';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totalEpisodes += Number(rating.episodesWatched) || 0;
            const overall = parseFloat(rating.overall);
            if (!isNaN(overall) && overall > 0) {
                ratingSum += overall;
                ratingCount++;
                ratedAnime.push({ anime, rating, overall });
                (anime.genres || []).forEach(genre => {
                    if (!genreScores[genre]) genreScores[genre] = { sum: 0, count: 0 };
                    genreScores[genre].sum += overall;
                    genreScores[genre].count++;
                });
                const studio = anime.studio || 'Desconhecido';
                if (!studioScores[studio]) studioScores[studio] = { sum: 0, count: 0 };
                studioScores[studio].sum += overall;
                studioScores[studio].count++;
            }
        }

        (anime.comments || []).forEach(comment => {
            if (normalizeProfileId(comment.friendId) === userId) commentsCount++;
            (comment.replies || []).forEach(reply => {
                if (normalizeProfileId(reply.friendId) === userId) repliesCount++;
            });
        });
    });

    const topAnime = ratedAnime.sort((a, b) => b.overall - a.overall).slice(0, 5);
    const topGenres = Object.entries(genreScores)
        .map(([name, data]) => ({ name, avg: data.sum / data.count, count: data.count }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 5);
    const topStudios = Object.entries(studioScores)
        .map(([name, data]) => ({ name, avg: data.sum / data.count, count: data.count }))
        .sort((a, b) => b.avg - a.avg || b.count - a.count)
        .slice(0, 5);
    const recentActivities = (state.activities || [])
        .filter(activity => normalizeProfileId(activity.username) === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    const avgScore = ratingCount > 0 ? ratingSum / ratingCount : 0;
    const xp = Math.round(totalEpisodes * 18 + ratingCount * 75 + commentsCount * 120 + repliesCount * 45 + statusCounts.Completed * 95);
    const level = Math.max(1, Math.floor(Math.sqrt(Math.max(1, xp)) / 3));
    const nextLevelXp = Math.pow((level + 1) * 3, 2);
    const currentLevelXp = Math.pow(level * 3, 2);
    const levelProgress = Math.max(5, Math.min(100, ((xp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)) * 100));

    return {
        userId,
        avgScore,
        totalEpisodes,
        ratingCount,
        commentsCount,
        repliesCount,
        statusCounts,
        topAnime,
        topGenres,
        topStudios,
        recentActivities,
        xp,
        level,
        levelProgress
    };
}

function getProfileRank(stats) {
    const score = (stats.avgScore * 12) + (stats.ratingCount * 1.6) + (stats.totalEpisodes * 0.18) + (stats.commentsCount * 3);
    if (score >= 210) return { label: 'Mythic Critic', tier: 'S+', icon: 'lucide:gem', color: '#22c55e' };
    if (score >= 145) return { label: 'Elite Curator', tier: 'S', icon: 'lucide:crown', color: '#10b981' };
    if (score >= 90) return { label: 'Veteran Watcher', tier: 'A', icon: 'lucide:shield', color: '#84cc16' };
    if (score >= 45) return { label: 'Rising Analyst', tier: 'B', icon: 'lucide:sparkles', color: '#facc15' };
    return { label: 'New Challenger', tier: 'C', icon: 'lucide:badge', color: '#fb923c' };
}

function getStoredNotifications() {
    try {
        const items = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
        return Array.isArray(items) ? items : [];
    } catch (err) {
        return [];
    }
}

function setStoredNotifications(items) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify((items || []).slice(0, 100)));
}

function pushNotification(notification) {
    if (!notification || !notification.title) return;
    const items = getStoredNotifications();
    const timestamp = notification.timestamp || new Date().toISOString();
    const dedupeKey = [
        notification.type || 'system',
        notification.title,
        notification.message || '',
        notification.animeId || '',
        timestamp.slice(0, 16)
    ].join('|');
    if (items.some(item => item.dedupeKey === dedupeKey)) return;
    items.unshift({
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: notification.type || 'system',
        title: notification.title,
        message: notification.message || '',
        avatar: notification.avatar || 'bell',
        color: notification.color || '#FF4500',
        animeId: notification.animeId || '',
        timestamp,
        read: false,
        dedupeKey
    });
    setStoredNotifications(items);
    updateNotificationBadges();
}

function mergeServerNotifications(notifications = []) {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    const existing = getStoredNotifications();
    const existingByServerId = new Map(existing.filter(item => item.serverId).map(item => [item.serverId, item]));
    const existingByDedupe = new Map(existing.filter(item => item.dedupeKey).map(item => [item.dedupeKey, item]));
    const merged = [...existing];

    notifications.forEach(notification => {
        if (!notification || !notification.title) return;
        const serverId = notification.id || '';
        const timestamp = notification.timestamp || new Date().toISOString();
        const dedupeKey = [
            notification.type || 'system',
            notification.title,
            notification.message || '',
            notification.animeId || '',
            timestamp.slice(0, 16)
        ].join('|');
        const known = (serverId && existingByServerId.get(serverId)) || existingByDedupe.get(dedupeKey);
        if (known) return;
        merged.unshift({
            id: serverId || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            serverId,
            type: notification.type || 'system',
            title: notification.title,
            message: notification.message || '',
            avatar: notification.avatar || 'bell',
            color: notification.color || '#FF4500',
            animeId: notification.animeId || '',
            timestamp,
            read: Boolean(notification.read),
            dedupeKey
        });
    });

    setStoredNotifications(merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100));
    updateNotificationBadges();
}

function isCurrentUserAdmin() {
    const id = normalizeProfileId(state.loggedInUser || localStorage.getItem('anivoid_logged_in_username') || '');
    return id === 'felipe';
}

function decodeCatalogText(value) {
    return String(value || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&amp;/g, '&');
}

function setAdminCatalogControlsVisibility() {
    const addButton = document.getElementById('open-add-anime');
    if (!addButton) return;
    if (isCurrentUserAdmin()) {
        addButton.classList.remove('hidden');
        addButton.classList.add('inline-flex');
    } else {
        addButton.classList.add('hidden');
        addButton.classList.remove('inline-flex');
    }
}

function updateCatalogLivePreview() {
    const title = document.getElementById('form-anime-title')?.value.trim();
    const jpTitle = document.getElementById('form-anime-jp-title')?.value.trim();
    const studio = document.getElementById('form-anime-studio')?.value.trim();
    const studioLogo = document.getElementById('form-studio-logo')?.value.trim();
    const season = document.getElementById('form-anime-season')?.value.trim();
    const episodes = document.getElementById('form-anime-episodes')?.value.trim();
    const cover = document.getElementById('form-anime-cover')?.value.trim();
    const genresRaw = document.getElementById('form-anime-genres')?.value.trim();
    const synopsis = document.getElementById('form-anime-synopsis')?.value.trim();

    // 1. Title
    const titleEl = document.getElementById('anime-preview-title');
    if (titleEl) titleEl.textContent = title || 'Título Oficial da Obra';

    // 2. Japanese Title
    const jpEl = document.getElementById('anime-preview-jp-title');
    if (jpEl) {
        jpEl.textContent = jpTitle || (title ? '' : 'タイトル');
        jpEl.style.display = jpTitle ? 'block' : (title ? 'none' : 'block');
    }

    // 3. Cover
    const coverEl = document.getElementById('anime-preview-cover');
    if (coverEl) {
        const fallbackCover = 'covers/cyberpunk-edgerunners-2.jpg';
        const coverSrc = cover ? (window.AnivoidUI ? window.AnivoidUI.imageUrl(cover) : cover) : fallbackCover;
        coverEl.src = coverSrc;
    }

    // 4. Studio & Logo
    const studioEl = document.getElementById('anime-preview-studio');
    if (studioEl) studioEl.textContent = studio || 'Estúdio';

    const logoBox = document.getElementById('anime-preview-studio-logo-box');
    const logoImg = document.getElementById('anime-preview-studio-logo');
    if (logoBox && logoImg) {
        const logoUrl = studioLogo || (studio ? (state.studioLogos?.[studio] || (typeof STUDIO_LOGOS !== 'undefined' ? STUDIO_LOGOS[studio] : '')) : '');
        if (logoUrl) {
            logoImg.src = logoUrl;
            logoBox.classList.remove('hidden');
        } else {
            logoBox.classList.add('hidden');
        }
    }

    // 5. Season & Episodes badges
    const seasonBadge = document.getElementById('anime-preview-season-badge');
    if (seasonBadge) seasonBadge.textContent = season || 'Temporada / Ano';

    const epBadge = document.getElementById('anime-preview-ep-badge');
    if (epBadge) epBadge.textContent = episodes ? (parseInt(episodes) === 1 ? 'Filme' : episodes.includes('ep') ? episodes : `${episodes} eps`) : '12 eps';

    // 6. Genres
    const genresContainer = document.getElementById('anime-preview-genres');
    if (genresContainer) {
        const genreList = genresRaw ? genresRaw.split(',').map(g => g.trim()).filter(Boolean) : ['Ação', 'Sci-Fi'];
        genresContainer.innerHTML = genreList.slice(0, 4).map(g => `<span class="av-genre-chip">${escapeHtml(g)}</span>`).join('');
    }

    // 7. Synopsis
    const synopsisEl = document.getElementById('anime-preview-synopsis');
    if (synopsisEl) {
        synopsisEl.textContent = synopsis || 'Sinopse da obra aparecerá aqui em tempo real conforme você digita ou seleciona uma sugestão do MyAnimeList...';
    }
}
window.updateCatalogLivePreview = updateCatalogLivePreview;

function closeAnimeCatalogModal() {
    const modal = document.getElementById('add-anime-modal');
    const form = document.getElementById('add-anime-form');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    if (form) {
        form.reset();
        form.dataset.mode = 'create';
    }
    document.body.classList.remove('overflow-hidden');
    updateCatalogLivePreview();
}

function openAnimeCatalogModal(anime = null) {
    if (!isCurrentUserAdmin()) {
        alert('Apenas o administrador pode alterar o catálogo de animes.');
        return;
    }

    const modal = document.getElementById('add-anime-modal');
    const form = document.getElementById('add-anime-form');
    if (!modal || !form) return;

    form.reset();
    form.dataset.mode = anime ? 'edit' : 'create';
    document.getElementById('form-anime-id').value = anime?.id || '';
    
    const modalTitle = document.getElementById('anime-form-modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = anime
            ? 'Editar Obra<span>.</span>'
            : 'Adicionar Obra<span>.</span>';
    }

    const submitBtn = document.getElementById('anime-form-submit');
    if (submitBtn) {
        submitBtn.innerHTML = anime 
            ? '<span>Salvar Alterações</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-submit-arrow"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
            : '<span>Adicionar ao Catálogo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-submit-arrow"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
    }

    if (anime) {
        document.getElementById('form-anime-title').value = decodeCatalogText(anime.title);
        document.getElementById('form-anime-jp-title').value = decodeCatalogText(anime.japaneseTitle);
        document.getElementById('form-anime-synopsis').value = decodeCatalogText(anime.synopsis);
        document.getElementById('form-anime-studio').value = decodeCatalogText(anime.studio);
        document.getElementById('form-anime-season').value = decodeCatalogText(anime.season);
        document.getElementById('form-anime-episodes').value = decodeCatalogText(anime.episodes);
        document.getElementById('form-anime-cover').value = anime.coverUrl || '';
        document.getElementById('form-studio-logo').value = anime.studioLogoUrl || '';
        document.getElementById('form-anime-genres').value = Array.isArray(anime.genres)
            ? anime.genres.map(decodeCatalogText).join(', ')
            : '';
    }

    updateCatalogLivePreview();

    const suggestions = document.getElementById('form-anime-suggestions');
    if (suggestions) suggestions.classList.add('hidden');

    if (!modal.dataset.catalogBackdropHooked) {
        modal.dataset.catalogBackdropHooked = 'true';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAnimeCatalogModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeAnimeCatalogModal();
            }
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    document.getElementById('form-anime-title')?.focus();
}

function applyCatalogMutationResponse(payload, savedAnime = null) {
    if (savedAnime) {
        const index = state.animes.findIndex(anime => anime.id === savedAnime.id);
        const localAnime = index >= 0 ? state.animes[index] : null;
        const mergedAnime = localAnime
            ? {
                ...savedAnime,
                ratings: savedAnime.ratings || localAnime.ratings || {},
                comments: savedAnime.comments || localAnime.comments || []
            }
            : savedAnime;
        if (index >= 0) state.animes[index] = mergedAnime;
        else state.animes.push(mergedAnime);
        if (savedAnime.studio && savedAnime.studioLogoUrl) {
            state.studioLogos = {
                ...(state.studioLogos || {}),
                [decodeCatalogText(savedAnime.studio)]: savedAnime.studioLogoUrl
            };
            localStorage.setItem('anivoid_studio_logos', JSON.stringify(state.studioLogos));
        }
    }
    if (Array.isArray(payload?.activities)) {
        state.activities = payload.activities;
        localStorage.setItem('anivoid_activities_v1', JSON.stringify(state.activities));
    }
    if (Array.isArray(payload?.registeredUsers)) {
        storeRegisteredUsers(payload.registeredUsers);
    }
    localStorage.setItem('anivoid_list_v2', JSON.stringify(state.animes));
}

async function deleteAnimeAsAdmin(anime) {
    if (!isCurrentUserAdmin() || !anime?.id) return;
    const confirmed = confirm(`Excluir "${decodeCatalogText(anime.title)}" do catálogo?\n\nNotas, comentários e avaliações desta obra também serão removidos. Um backup será criado antes da exclusão.`);
    if (!confirmed) return;

    try {
        await state.syncWithServer();
        const response = await fetch(API_BASE_URL + '/api/admin/delete-anime', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ animeId: anime.id })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Não foi possível excluir o anime.');

        state.animes = state.animes.filter(item => item.id !== anime.id);
        if (state.featuredAnimeId === anime.id) {
            state.featuredAnimeId = null;
            localStorage.removeItem('anivoid_featured_anime_id');
        }
        applyCatalogMutationResponse(payload);
        state.activeDetailAnimeId = null;
        closeAnimeDetail();
        renderFilters();
        renderAnimeGrid();
        renderFeaturedBanner();
        renderActivitiesFeed();
    } catch (error) {
        alert(error.message || 'Não foi possível excluir o anime.');
    }
}

function updateNotificationBadges() {
    const unread = getStoredNotifications().filter(item => !item.read).length;
    const badge = document.getElementById('notifications-dropdown-badge');
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : String(unread);
            badge.classList.remove('hidden');
            badge.classList.add('inline-flex');
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('inline-flex');
        }
    }
}

function renderNotificationsModal() {
    const list = document.getElementById('notifications-list');
    if (!list) return;
    const items = getStoredNotifications();

    const unread = items.filter(item => !item.read).length;
    const countBadge = document.getElementById('notifications-modal-unread-count');
    if (countBadge) {
        if (unread > 0) {
            countBadge.textContent = `${unread} não lida${unread === 1 ? '' : 's'}`;
            countBadge.classList.remove('is-empty');
        } else {
            countBadge.textContent = 'Todas lidas';
            countBadge.classList.add('is-empty');
        }
    }

    if (items.length === 0) {
        list.innerHTML = `
            <div class="av-notif-empty">
                <div class="av-notif-empty-glow" aria-hidden="true"></div>
                <div class="av-notif-empty-emblem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                </div>
                <h4 class="av-notif-empty-title">Nenhuma notificação por enquanto</h4>
                <p class="av-notif-empty-sub">Você está completamente em dia! Quando outros críticos interagirem com seu acervo, você verá os alertas aqui.</p>
                <div class="av-notif-empty-status">
                    <span class="av-notif-status-dot"></span>
                    <span>Coletivo Ativo &middot; Feed Sincronizado</span>
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => {
        const color = item.color || '#FF4500';
        let timeText = '';
        try {
            const date = new Date(item.timestamp);
            timeText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (err) {}

        let iconSvg = '';
        if (item.type === 'friend_request') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
        } else if (item.type === 'friend_accept') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L13 12"/><path d="m3 11 2.6-2.6a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L7 15"/></svg>`;
        } else if (item.type === 'rating') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        }

        const actionAttr = item.animeId ? `data-anime-id="${escapeHtml(item.animeId)}"` : '';
        const linkHint = item.animeId ? `
            <span class="av-notif-action-tag">
                <span>Ver obra no acervo</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </span>
        ` : '';

        return `
            <button type="button" class="notification-row av-notification-card ${item.read ? 'is-read' : 'is-unread'}" style="--note-color:${color}" ${actionAttr}>
                <div class="av-notif-icon-box" style="color:${color}; border-color:${color}44; box-shadow:0 0 16px ${color}22">
                    ${iconSvg}
                </div>
                <div class="av-notif-content">
                    <div class="av-notif-top-row">
                        <h4 class="av-notif-title">${escapeHtml(item.title)}</h4>
                        <span class="av-notif-time-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span>${escapeHtml(timeText)}</span>
                        </span>
                    </div>
                    <p class="av-notif-message">${escapeHtml(item.message)}</p>
                    ${linkHint}
                </div>
                ${item.read ? '' : `<span class="av-notif-unread-dot" style="background:${color}; box-shadow:0 0 10px ${color}"></span>`}
            </button>
        `;
    }).join('');

    list.querySelectorAll('.notification-row[data-anime-id]').forEach(row => {
        row.addEventListener('click', () => {
            const animeId = row.dataset.animeId;
            if (window.closeNotificationsModal) {
                window.closeNotificationsModal();
            } else {
                const modal = document.getElementById('notifications-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            }
            if (animeId) openAnimeDetail(animeId);
        });
    });
}

function markNotificationsRead() {
    const items = getStoredNotifications().map(item => ({ ...item, read: true }));
    setStoredNotifications(items);
    updateNotificationBadges();
    renderNotificationsModal();
    if (hasAuthSession()) {
        fetch(API_BASE_URL + '/api/notifications/read', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' })
        }).catch(() => {});
    }
}

function clearNotifications() {
    setStoredNotifications([]);
    updateNotificationBadges();
    renderNotificationsModal();
    if (hasAuthSession()) {
        fetch(API_BASE_URL + '/api/notifications/clear', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' })
        }).catch(() => {});
    }
}

function buildPersonalRecommendations(limit = 3, profileId = state.currentFriendId || getLoggedInProfileId()) {
    const myId = normalizeProfileId(profileId || getLoggedInProfileId());
    if (!myId) return [];
    const profileUser = findRegisteredUserById(myId);
    const preferredGenres = {};
    const preferredStudios = {};

    (profileUser?.favoriteGenres || []).forEach(genre => {
        preferredGenres[genre] = (preferredGenres[genre] || 0) + 12;
    });
    (profileUser?.favoriteStudios || []).forEach(studio => {
        preferredStudios[studio] = (preferredStudios[studio] || 0) + 12;
    });

    (state.animes || []).forEach(anime => {
        const rating = anime?.ratings?.[myId];
        const score = parseFloat(rating?.overall);
        if (!isNaN(score) && score >= 8) {
            (anime.genres || []).forEach(genre => {
                preferredGenres[genre] = (preferredGenres[genre] || 0) + score;
            });
            if (anime.studio) preferredStudios[anime.studio] = (preferredStudios[anime.studio] || 0) + score;
        }
    });

    const groupIds = getRecommendationPeerIds(myId);

    return (state.animes || [])
        .map(anime => {
            const myRating = anime?.ratings?.[myId];
            const myScore = parseFloat(myRating?.overall);
            if (!isNaN(myScore) && myScore > 0) return null;
            if (myRating?.status === 'Completed') return null;

            const friendScores = Object.entries(anime.ratings || {})
                .filter(([userId]) => groupIds.has(normalizeProfileId(userId)))
                .map(([_, rating]) => parseFloat(rating?.overall))
                .filter(score => !isNaN(score) && score > 0);
            const friendAvg = friendScores.length ? friendScores.reduce((sum, score) => sum + score, 0) / friendScores.length : 0;
            const genreBoost = (anime.genres || []).reduce((sum, genre) => sum + (preferredGenres[genre] || 0), 0) / 10;
            const studioBoost = (preferredStudios[anime.studio] || 0) / 12;
            const tasteSeed = recommendationTieBreak(myId, anime.id) * 0.42;
            const score = friendAvg * 1.35 + genreBoost + studioBoost + tasteSeed;
            if (score <= 0) return null;

            const reason = friendAvg >= 8
                ? 'Amigos deram nota alta'
                : genreBoost > 0
                    ? 'Combina com seus g\u00eaneros fortes'
                    : studioBoost > 0
                        ? `Voc\u00ea costuma curtir ${anime.studio}`
                        : 'Boa aposta para testar';
            return { anime, score, friendAvg, reason };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

function renderRecommendationsRail() {
    const rail = document.getElementById('recommendations-rail');
    const list = document.getElementById('recommendations-rail-list');
    if (!rail || !list) return;
    const hidden = !!state.activeDetailAnimeId || state.filterMALStatus === 'Studios';
    const recommendations = hidden ? [] : buildPersonalRecommendations(3, state.currentFriendId || getLoggedInProfileId());
    rail.classList.toggle('hidden', !recommendations.length);
    if (recommendations.length) projectUI.renderRecommendations(list, recommendations);
}

function renderAnimeHistory(anime) {
    const list = document.getElementById('detail-history-list');
    const section = document.getElementById('detail-history-section');
    if (!list || !section || !anime) return;

    const rows = [];
    (state.activities || []).forEach(activity => {
        if (activity.animeId === anime.id) {
            rows.push({
                type: activity.type || 'activity',
                title: activity.username || 'Grupo',
                message: `${activity.details || 'interagiu'} em ${activity.animeTitle || anime.title}`,
                timestamp: activity.timestamp,
                color: activity.userColor || '#FF4500',
                icon: getActivityMeta(activity).icon
            });
        }
    });
    (anime.comments || []).forEach(comment => {
        rows.push({
            type: 'comment',
            title: comment.friendName || comment.friendId || 'Review',
            message: `review: ${String(comment.comment || '').slice(0, 90)}`,
            timestamp: comment.timestamp,
            color: getProfileDisplayUser(comment.friendId).color,
            icon: 'lucide:message-circle'
        });
        (comment.replies || []).forEach(reply => {
            rows.push({
                type: 'reply',
                title: reply.friendName || reply.friendId || 'Resposta',
                message: `respondeu: ${String(reply.reply || '').slice(0, 80)}`,
                timestamp: reply.timestamp,
                color: getProfileDisplayUser(reply.friendId).color,
                icon: 'lucide:reply'
            });
        });
    });

    Object.entries(anime.ratings || {}).forEach(([userId, rating]) => {
        const overall = parseFloat(rating?.overall);
        if (!isNaN(overall) && overall > 0) {
            const user = getProfileDisplayUser(userId);
            rows.push({
                type: 'rating_snapshot',
                title: user.username,
                message: `nota atual ${overall} com status ${(STATUS_MAP[rating.status] || STATUS_MAP['Plan to Watch']).label}`,
                timestamp: rating.updatedAt || '',
                color: user.color,
                icon: 'lucide:star'
            });
        }
    });

    const sortedRows = rows
        .filter(row => row.timestamp || row.type === 'rating_snapshot')
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 7);

    if (sortedRows.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-gray-500 italic py-2">Sem historico registrado para esta obra ainda.</p>`;
        return;
    }

    list.innerHTML = sortedRows.map(row => {
        let timeText = '';
        if (row.timestamp) {
            try {
                const date = new Date(row.timestamp);
                timeText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            } catch (err) {}
        } else {
            timeText = 'atual';
        }
        return `
            <div class="history-row rounded-2xl border border-white/5 bg-white/[0.035] p-3 flex gap-3 items-start">
                <div class="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0" style="color:${row.color}; box-shadow:0 0 16px ${row.color}20">
                    <iconify-icon icon="${row.icon}" class="text-sm"></iconify-icon>
                </div>
                <div class="min-w-0 flex-grow">
                    <div class="flex items-center justify-between gap-2">
                        <b class="text-[11px] font-mono truncate" style="color:${row.color}">${escapeHtml(row.title)}</b>
                        <span class="text-[9px] text-gray-600 font-mono shrink-0">${escapeHtml(timeText)}</span>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-0.5 leading-relaxed">${escapeHtml(row.message)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function toggleCommentLike(animeId, commentId) {
    const userId = getLoggedInProfileId();
    const anime = state.animes.find(item => item.id === animeId);
    const comment = anime?.comments?.find(item => item.id === commentId);
    if (!anime || !comment || !userId) return;
    if (!Array.isArray(comment.likes)) comment.likes = [];
    const normalizedLikes = comment.likes.map(normalizeProfileId).filter(Boolean);
    if (normalizedLikes.includes(userId)) {
        comment.likes = normalizedLikes.filter(id => id !== userId);
    } else {
        comment.likes = [...new Set([...normalizedLikes, userId])];
    }
    state.save();
    renderComments(anime);
}

async function exportBackupData() {
    let payload = null;
    if (isCurrentUserAdmin() && hasAuthSession()) {
        try {
            const response = await fetch(API_BASE_URL + '/api/admin/export-state', {
                method: 'GET',
                headers: authHeaders(),
                cache: 'no-store'
            });
            if (response.ok) payload = await response.json();
        } catch (err) {
            console.warn('Server backup export failed:', err);
        }
    }
    if (!payload) payload = {
        app: 'anivoid',
        version: 2,
        exportedAt: new Date().toISOString(),
        loggedInUser: state.loggedInUser,
        registeredUsers: getRegisteredUsersSafe(),
        currentFriendId: state.currentFriendId,
        featuredAnimeId: state.featuredAnimeId,
        studioLogos: state.studioLogos || {},
        animes: state.animes || [],
        notifications: getStoredNotifications()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `anivoid-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exportado', 'Arquivo de seguranca criado neste navegador.', 'backup', '#22c55e');
}

function importBackupData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const payload = JSON.parse(String(reader.result || '{}'));
            if (!payload || payload.app !== 'anivoid' || !Array.isArray(payload.animes)) {
                alert('Arquivo de backup invalido.');
                return;
            }
            if (!confirm('Importar este backup vai substituir os dados locais deste navegador. Continuar?')) return;
            state.animes = payload.animes;
            state.studioLogos = payload.studioLogos && typeof payload.studioLogos === 'object' ? payload.studioLogos : {};
            state.currentFriendId = payload.currentFriendId || state.currentFriendId;
            state.featuredAnimeId = payload.featuredAnimeId || state.featuredAnimeId;
            localStorage.setItem('anivoid_list_v2', JSON.stringify(state.animes));
            localStorage.setItem('anivoid_studio_logos', JSON.stringify(state.studioLogos));
            if (Array.isArray(payload.registeredUsers)) storeRegisteredUsers(payload.registeredUsers);
            if (Array.isArray(payload.notifications)) setStoredNotifications(payload.notifications);
            state.loadLocalSession();
            renderFilters();
            renderFriendsDropdown();
            updateProfileIndicator();
            renderAnimeGrid();
            renderFeaturedBanner();
            renderRecommendationsRail();
            showToast('Backup importado', 'Dados locais restaurados com sucesso.', 'backup', '#22c55e');
        } catch (err) {
            console.error(err);
            alert('Nao foi possivel importar este backup.');
        }
    };
    reader.readAsText(file);
}

function closePlayerProfileModal() {
    const modal = document.getElementById('player-profile-modal');
    if (!modal || modal.classList.contains('hidden') || modal.classList.contains('is-closing')) return;

    if (window.lenisStart) window.lenisStart();

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        return;
    }

    modal.classList.add('is-closing');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'is-closing');
        document.body.classList.remove('overflow-hidden');
    }, 220);
}
window.closePlayerProfileModal = closePlayerProfileModal;

function renderPlayerProfileModal(profileId = state.currentFriendId) {
    const modal = document.getElementById('player-profile-modal');
    const content = document.getElementById('player-profile-content');
    if (!modal || !content) return;
    const user = getProfileDisplayUser(profileId);
    const stats = getProfileStats(user.id);
    const badges = getUserBadgesHtml({ ...user, username: user.username, name: user.username });
    const scoreColor = getScoreColor(stats.avgScore);
    const completed = stats.statusCounts.Completed || 0;
    const watching = stats.statusCounts.Watching || 0;
    const completionRate = stats.ratingCount > 0 ? Math.round((completed / stats.ratingCount) * 100) : 0;

    const bannerUrl = user.banner || 'covers/cyberpunk-edgerunners-2.jpg';
    const bannerStyle = `background-image: linear-gradient(180deg, rgba(8,9,10,0.3) 0%, rgba(8,9,10,0.85) 60%, rgba(12,13,16,1) 100%), url('${escapeHtml(bannerUrl)}'); background-size: cover; background-position: center;`;

    // Achievement cards
    const achievementCards = [
        { 
            label: 'Maratonista', 
            value: `${stats.totalEpisodes} episódios`, 
            active: stats.totalEpisodes >= 50,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 11 2-6h3l-2 6M7 11l2-6h3l-2 6M10 11l2-6h3l-2 6M2 11h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>`
        },
        { 
            label: 'Crítico', 
            value: `${stats.ratingCount} avaliações`, 
            active: stats.ratingCount >= 10,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        },
        { 
            label: 'Voz do Coletivo', 
            value: `${stats.commentsCount} análises`, 
            active: stats.commentsCount >= 3,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
        },
        { 
            label: 'Finalizador', 
            value: `${completed} animes`, 
            active: completed >= 5,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`
        }
    ].map(card => `
        <div class="av-player-trophy-card ${card.active ? 'is-active' : ''}">
            <div class="av-player-trophy-top">
                <div class="av-player-trophy-icon">
                    ${card.icon}
                </div>
                <span class="av-player-trophy-status ${card.active ? 'is-unlocked' : ''}">
                    <span class="av-trophy-dot"></span>
                    ${card.active ? 'Desbloqueado' : 'Em Progresso'}
                </span>
            </div>
            <div class="av-player-trophy-meta">
                <h4 class="av-player-trophy-title">${escapeHtml(card.label)}</h4>
                <p class="av-player-trophy-val">${escapeHtml(card.value)}</p>
            </div>
        </div>
    `).join('');

    // Favorite Anime Cards (Top 3)
    const favoriteAnimeCards = stats.topAnime.slice(0, 3).map(item => {
        const color = getScoreColor(item.overall);
        return `
            <button type="button" class="av-player-poster-card group" data-anime-id="${escapeHtml(item.anime.id)}" title="${escapeHtml(item.anime.title)}">
                <div class="av-player-poster-media">
                    <img src="${escapeHtml(window.AnivoidUI.imageUrl(item.anime.coverUrl))}" alt="${escapeHtml(item.anime.title)}" loading="lazy">
                    <div class="av-player-poster-tint"></div>
                    <span class="av-player-poster-score" style="color:${color.text}; border-color:${color.text}44; box-shadow:0 0 16px ${color.glow}">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span>${item.overall.toFixed(1)}</span>
                    </span>
                    <div class="av-player-poster-info">
                        <h4 class="av-player-poster-title">${escapeHtml(item.anime.title)}</h4>
                    </div>
                </div>
            </button>
        `;
    }).join('');

    // Genre meters (Top 4)
    const genreRows = stats.topGenres.length ? stats.topGenres.slice(0, 4).map(genre => {
        const color = getScoreColor(genre.avg);
        const percent = Math.min(100, Math.max(10, genre.avg * 10));
        return `
            <div class="av-genre-meter-item">
                <div class="av-genre-meter-header">
                    <span class="av-genre-meter-name">${escapeHtml(genre.name)}</span>
                    <span class="av-genre-meter-score" style="color:${color.text}">${genre.avg.toFixed(1)}</span>
                </div>
                <div class="av-genre-meter-track">
                    <span class="av-genre-meter-bar" style="width:${percent}%; background:${color.text}; box-shadow:0 0 10px ${color.glow}"></span>
                </div>
            </div>
        `;
    }).join('') : `<p class="av-player-empty-text">Sem gêneros registrados ainda.</p>`;

    // Studio rows (Top 4)
    const studioRows = stats.topStudios.length ? stats.topStudios.slice(0, 4).map(studio => {
        const color = getScoreColor(studio.avg);
        return `
            <button type="button" class="av-studio-pill-item group" data-studio="${escapeHtml(studio.name)}" title="Ver animes do estúdio ${escapeHtml(studio.name)}">
                <div class="av-studio-pill-left">
                    <span class="av-studio-pill-dot"></span>
                    <span class="av-studio-pill-name">${escapeHtml(studio.name)}</span>
                </div>
                <div class="av-studio-pill-right">
                    <span class="av-studio-pill-score" style="color:${color.text}">★ ${studio.avg.toFixed(1)}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-studio-pill-arrow"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                </div>
            </button>
        `;
    }).join('') : `<p class="av-player-empty-text">Sem estúdios favoritos ainda.</p>`;

    // Activity timeline (Top 5)
    const activityRows = stats.recentActivities.length ? stats.recentActivities.slice(0, 5).map(activity => {
        const meta = getActivityMeta(activity);
        return `
            <button type="button" class="av-activity-timeline-row group" data-anime-id="${escapeHtml(activity.animeId || '')}">
                <div class="av-activity-icon-badge" style="color:${meta.color}; border-color:${meta.color}40; background:${meta.color}14">
                    <iconify-icon icon="${meta.icon}"></iconify-icon>
                </div>
                <div class="av-activity-row-body">
                    <p class="av-activity-details-text">${escapeHtml(activity.details || 'Atividade')}</p>
                    <span class="av-activity-anime-name">${escapeHtml(activity.animeTitle || '')}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-activity-row-arrow"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `;
    }).join('') : `<p class="av-player-empty-text">Sem atividade recente visível.</p>`;

    content.innerHTML = `
        <!-- HERO SECTION (Cinematic Banner & Profile Identity) -->
        <div class="av-player-hero av-player-stagger-1" style="--profile-accent:${user.color}">
            <div class="av-player-hero-banner" style="${bannerStyle}">
                <div class="av-player-hero-tint"></div>
                <button type="button" id="close-player-profile" class="av-stats-close-btn av-player-close-btn" aria-label="Fechar perfil">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <!-- Identity Row -->
            <div class="av-player-identity-strip">
                <div class="av-player-avatar-box">
                    <div class="av-player-avatar-ring" style="--profile-accent:${user.color}">
                        ${avatarMarkup(user, 'w-20 h-20 md:w-24 md:h-24', user.username?.[0] || 'U')}
                    </div>
                </div>
                <div class="av-player-identity-meta">
                    <div class="av-stats-eyebrow">
                        <span class="av-stats-dot" style="background:${user.color}; box-shadow:0 0 8px ${user.color}"></span>
                        <span>Perfil Oficial &middot; ANIVØID Collective</span>
                    </div>
                    <div class="av-player-title-row">
                        <h2 class="av-player-name">${escapeHtml(user.username)}</h2>
                        <div class="av-player-badges">${badges}</div>
                    </div>
                    <div class="av-player-meta-chips">
                        <span class="av-player-chip">
                            <span class="av-chip-label">Nível</span>
                            <b class="text-white">${stats.level}</b>
                        </span>
                        <span class="av-player-chip">
                            <span class="av-chip-label">Catálogo</span>
                            <b class="text-white">${stats.ratingCount} títulos</b>
                        </span>
                        <span class="av-player-chip">
                            <span class="av-chip-label">Total Assistido</span>
                            <b class="text-white">${stats.totalEpisodes} eps</b>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCROLLABLE BODY (HUD, Trophies, Top Animes, DNA & History) -->
        <div class="av-player-scroll-body">
            
            <!-- SECTION 1: KEY METRIC HUD -->
            <div class="av-player-hud-grid av-player-stagger-2">
                <div class="av-player-hud-card">
                    <div class="av-hud-card-top">
                        <span class="av-hud-eyebrow">Média Geral</span>
                        <span class="av-hud-badge-dot" style="background:${scoreColor.text}; box-shadow:0 0 8px ${scoreColor.glow}"></span>
                    </div>
                    <div class="av-hud-card-val" style="color:${scoreColor.text}; text-shadow:0 0 20px ${scoreColor.glow}">
                        ${stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
                    </div>
                    <p class="av-hud-card-sub">Padrão de rigor avaliativo</p>
                </div>

                <div class="av-player-hud-card">
                    <div class="av-hud-card-top">
                        <span class="av-hud-eyebrow">Obras Avaliadas</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-hud-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>
                    </div>
                    <div class="av-hud-card-val text-white">
                        ${stats.ratingCount}
                    </div>
                    <p class="av-hud-card-sub">${completed} concluídos &middot; ${watching} em andamento</p>
                </div>

                <div class="av-player-hud-card">
                    <div class="av-hud-card-top">
                        <span class="av-hud-eyebrow">Episódios Vistos</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-hud-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="av-hud-card-val text-white">
                        ${stats.totalEpisodes}
                    </div>
                    <p class="av-hud-card-sub">~${Math.round(stats.totalEpisodes * 23 / 60)}h estimadas em tela</p>
                </div>

                <div class="av-player-hud-card">
                    <div class="av-hud-card-top">
                        <span class="av-hud-eyebrow">Taxa de Conclusão</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="av-hud-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="av-hud-card-val text-white">
                        ${completionRate}%
                    </div>
                    <div class="av-hud-mini-progress">
                        <span style="width:${completionRate}%; background:var(--av-accent)"></span>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: CONQUISTAS & DISTINÇÕES -->
            <div class="av-player-trophies-grid av-player-stagger-3">
                ${achievementCards}
            </div>

            <!-- SECTION 3: TOP OBRAS + DNA + HISTÓRICO -->
            <div class="av-player-content-grid av-player-stagger-4">
                
                <!-- Left Column (60%): Top Obras + Gêneros + Estúdios -->
                <div class="av-player-main-col">
                    
                    <!-- Top Obras -->
                    <div class="av-player-section-card">
                        <div class="av-section-card-header">
                            <div>
                                <span class="av-eyebrow">Curadoria Pessoal</span>
                                <h3 class="av-section-title">Obras Mais Bem Avaliadas</h3>
                            </div>
                            <span class="av-section-badge">Top 3 Notas</span>
                        </div>
                        <div class="av-player-posters-grid">
                            ${favoriteAnimeCards || '<p class="av-player-empty-text">Nenhuma obra avaliada com nota ainda.</p>'}
                        </div>
                    </div>

                    <!-- DNA Gêneros & Estúdios -->
                    <div class="av-player-dna-grid">
                        
                        <!-- Assinatura de Gênero -->
                        <div class="av-player-sub-card">
                            <div class="av-section-card-header">
                                <div>
                                    <span class="av-eyebrow">Preferências</span>
                                    <h4 class="av-sub-title">Gêneros Fortes</h4>
                                </div>
                            </div>
                            <div class="av-genre-meters-list">
                                ${genreRows}
                            </div>
                        </div>

                        <!-- Estúdios Fortes -->
                        <div class="av-player-sub-card">
                            <div class="av-section-card-header">
                                <div>
                                    <span class="av-eyebrow">Produção</span>
                                    <h4 class="av-sub-title">Estúdios Fortes</h4>
                                </div>
                            </div>
                            <div class="av-studios-pills-list">
                                ${studioRows}
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Right Column (40%): Atividade Recente + Distribuição -->
                <div class="av-player-side-col">
                    
                    <!-- Atividade Recente -->
                    <div class="av-player-section-card">
                        <div class="av-section-card-header">
                            <div>
                                <span class="av-eyebrow">Timeline</span>
                                <h3 class="av-section-title">Histórico Recente</h3>
                            </div>
                            <span class="av-pulse-indicator">
                                <span class="av-live-pulse"></span>
                                Ativo
                            </span>
                        </div>
                        <div class="av-activity-list">
                            ${activityRows}
                        </div>
                    </div>

                    <!-- Distribuição do Acervo -->
                    <div class="av-player-sub-card">
                        <div class="av-section-card-header">
                            <div>
                                <span class="av-eyebrow">Acervo</span>
                                <h4 class="av-sub-title">Distribuição</h4>
                            </div>
                        </div>
                        <div class="av-status-distrib-grid">
                            <div class="av-distrib-item">
                                <span class="av-distrib-label">Assistindo</span>
                                <b class="av-distrib-val text-emerald-400">${watching}</b>
                            </div>
                            <div class="av-distrib-item">
                                <span class="av-distrib-label">Concluídos</span>
                                <b class="av-distrib-val text-white">${completed}</b>
                            </div>
                            <div class="av-distrib-item">
                                <span class="av-distrib-label">Na Fila</span>
                                <b class="av-distrib-val text-white/70">${stats.statusCounts['Plan to Watch'] || 0}</b>
                            </div>
                            <div class="av-distrib-item">
                                <span class="av-distrib-label">Reviews</span>
                                <b class="av-distrib-val text-white">${stats.commentsCount}</b>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    `;

    // Modal listeners
    const closeModal = () => {
        closePlayerProfileModal();
    };

    content.querySelector('#close-player-profile')?.addEventListener('click', closeModal);

    content.querySelectorAll('[data-anime-id]').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.animeId;
            closeModal();
            if (id) openAnimeDetail(id);
        });
    });

    content.querySelectorAll('[data-studio]').forEach(item => {
        item.addEventListener('click', () => {
            const studio = item.dataset.studio;
            closeModal();
            if (studio) window.switchTabToStudio(studio);
        });
    });

    // Backdrop click listener
    if (!modal.dataset.profileBackdropHooked) {
        modal.dataset.profileBackdropHooked = 'true';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Escape key listener
    if (!modal.dataset.profileEscapeHooked) {
        modal.dataset.profileEscapeHooked = 'true';
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    // Open modal with entrance animation
    modal.classList.remove('hidden', 'is-closing');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    if (window.lenisStop) window.lenisStop();
    const shell = modal.querySelector('.av-player-modal-shell');
    if (shell) shell.scrollTop = 0;
}

function setupUtilityModals() {
    const closeDropdown = () => window.AnivoidUI.account.close({ animate: false, restoreFocus: false });

    const bindOnce = (id, event, handler) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.utilityHooked === id) return;
        el.dataset.utilityHooked = id;
        el.addEventListener(event, handler);
    };

    bindOnce('open-player-profile', 'click', (event) => {
        event.stopPropagation();
        closeDropdown();
        renderPlayerProfileModal(state.currentFriendId);
    });
    function closeNotificationsModal() {
        const modal = document.getElementById('notifications-modal');
        if (!modal || modal.classList.contains('hidden') || modal.classList.contains('is-closing')) return;
        if (window.lenisStart) window.lenisStart();
        modal.classList.add('is-closing');
        setTimeout(() => {
            modal.classList.remove('is-closing');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 220);
    }
    window.closeNotificationsModal = closeNotificationsModal;

    bindOnce('open-notifications', 'click', (event) => {
        event.stopPropagation();
        closeDropdown();
        if (window.lenisStop) window.lenisStop();
        renderNotificationsModal();
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    });
    bindOnce('close-notifications', 'click', () => {
        closeNotificationsModal();
    });
    const notifModal = document.getElementById('notifications-modal');
    if (notifModal) {
        bindElementOnce(notifModal, 'backdropNotif', 'click', (e) => {
            if (e.target === notifModal) {
                closeNotificationsModal();
            }
        });
        if (!document.documentElement.dataset.notifEscHooked) {
            document.documentElement.dataset.notifEscHooked = 'true';
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !notifModal.classList.contains('hidden')) {
                    closeNotificationsModal();
                }
            });
        }
    }
    bindOnce('mark-notifications-read', 'click', markNotificationsRead);
    bindOnce('clear-notifications', 'click', clearNotifications);
    bindOnce('open-activity-history', 'click', () => {
        renderActivityHistoryModal();
        const modal = document.getElementById('activity-history-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    });
    bindOnce('close-activity-history', 'click', () => {
        const modal = document.getElementById('activity-history-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
    bindOnce('open-admin-center', 'click', (event) => {
        event.stopPropagation();
        closeDropdown();
        if (!isCurrentUserAdmin()) return;
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            renderAdminCenter();
        }
    });
    bindOnce('close-admin-center', 'click', () => {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
    bindOnce('admin-create-backup', 'click', async () => {
        try {
            const data = await loadAdminBackups(true);
            renderAdminBackups(data.backups || []);
            showToast('Backup criado', 'Snapshot do D1 salvo com sucesso.', 'backup', '#22c55e');
        } catch (err) {
            alert('Nao foi possivel criar backup agora.');
        }
    });
    bindOnce('open-backup-center', 'click', (event) => {
        event.stopPropagation();
        closeDropdown();
        const modal = document.getElementById('backup-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    });
    bindOnce('close-backup-center', 'click', () => {
        const modal = document.getElementById('backup-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
    bindOnce('export-backup-btn', 'click', exportBackupData);
    bindOnce('import-backup-btn', 'click', () => document.getElementById('import-backup-file')?.click());
    bindOnce('import-backup-file', 'change', (event) => importBackupData(event.target.files?.[0]));
}

function markViewEntered(element) {
    if (!element) return;
    if (element.dataset.viewEntered) return;
    element.dataset.viewEntered = 'true';
    element.classList.add('view-enter-soft');
}

function bindElementOnce(element, key, event, handler) {
    if (!element) return false;
    const attr = `bound${key.replace(/[^a-z0-9]/gi, '')}`;
    if (element.dataset[attr]) return false;
    element.dataset[attr] = 'true';
    element.addEventListener(event, handler);
    return true;
}

let authGateReturnFocus = null;
function setAuthBackgroundInert(active) {
    for (const child of document.body.children) {
        if (child.id === 'registration-gate' || child.id === 'splash-screen' || child.tagName === 'SCRIPT') continue;
        if (active) {
            if (!child.inert) { child.inert = true; child.dataset.authGateInert = 'true'; }
        } else if (child.dataset.authGateInert) {
            child.inert = false;
            delete child.dataset.authGateInert;
        }
    }
}

function hideRegistrationGate() {
    document.body.classList.remove('auth-gate-active');
    setAuthBackgroundInert(false);
    if (authGateReturnFocus?.isConnected) authGateReturnFocus.focus({ preventScroll: true });
    const regGate = document.getElementById('registration-gate');
    if (regGate) {
        regGate.classList.add('hidden');
        regGate.classList.remove('flex');
    }
    document.body.classList.remove('overflow-hidden');
}

function removeLegacyRecoveryAccessLinks() {
    document.querySelectorAll('button, a').forEach(el => {
        const text = (el.textContent || '').trim().toLowerCase();
        if (text.includes('recuperar acesso')) el.remove();
    });
}

function showRegistrationGate() {
    document.body.classList.add('overflow-hidden');
    document.body.classList.add('auth-gate-active');
    const regGate = document.getElementById('registration-gate');
    if (regGate) {
        removeLegacyRecoveryAccessLinks();
        regGate.classList.remove('hidden');
        regGate.classList.add('flex');
        initRegistrationOptions();
        if (!regGate.contains(document.activeElement)) authGateReturnFocus = document.activeElement;
        setAuthBackgroundInert(true);
        if (!regGate.dataset.focusBound) {
            regGate.dataset.focusBound = 'true';
            regGate.addEventListener('keydown', event => {
                if (event.key !== 'Tab') return;
                const controls = [...regGate.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(element => !element.disabled && element.getClientRects().length && element.tabIndex >= 0);
                const first = controls[0], last = controls[controls.length - 1];
                if (!first) return;
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            });
        }
        requestAnimationFrame(() => regGate.querySelector('button:not([disabled])')?.focus({ preventScroll: true }));
    }
}

// --- DOM ELEMENTS AND EVENT LISTENERS ---

// ==========================================================================
// AWWWARDS MOTION SUITE: LENIS SMOOTH SCROLL & GSAP CREATIVE CHOREOGRAPHY
// ==========================================================================

function initMotionSuite() {
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Tag only overlay modals and internal dropdowns with data-lenis-prevent
    const preventSelectors = [
        '#edit-profile-modal',
        '#player-profile-modal',
        '#group-stats-modal',
        '#notifications-modal',
        '#friends-dropdown',
        '#registration-gate',
        '#security-notice-modal',
        '#activity-history-modal',
        '#admin-modal',
        '#backup-modal',
        '#add-anime-modal',
        '#add-friend-modal',
        '.av-friends-shell',
        '.av-friends-studio-layout',
        '.av-player-modal-shell',
        '.av-stats-scroll-content',
        '.av-account-scroll',
        '.av-sug-list'
    ];
    preventSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.setAttribute('data-lenis-prevent', 'true');
        });
    });

    // 2. Initialize Lenis Smooth Scroll
    if (typeof Lenis !== 'undefined' && !reducedMotion && !window.lenis) {
        try {
            window.lenis = new Lenis({
                duration: 1.15,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 1.0,
                touchMultiplier: 1.5,
                infinite: false,
                prevent: (node) => {
                    if (!node || typeof node.closest !== 'function') return false;
                    const activeModal = node.closest(
                        '#edit-profile-modal:not(.hidden), #player-profile-modal:not(.hidden), #group-stats-modal:not(.hidden), #notifications-modal:not(.hidden), #activity-history-modal:not(.hidden), #admin-modal:not(.hidden), #backup-modal:not(.hidden), #security-notice-modal:not(.hidden), #add-anime-modal:not(.hidden), #add-friend-modal:not(.hidden)'
                    );
                    if (activeModal) return true;
                    return Boolean(
                        node.closest('.av-account-scroll') ||
                        node.closest('.av-sug-list') ||
                        node.closest('.av-stats-scroll-content')
                    );
                }
            });

            // Connect Lenis to GSAP ticker if available, or fallback to requestAnimationFrame
            if (typeof gsap !== 'undefined') {
                if (typeof ScrollTrigger !== 'undefined') {
                    gsap.registerPlugin(ScrollTrigger);
                    window.lenis.on('scroll', ScrollTrigger.update);
                }
                gsap.ticker.add((time) => {
                    window.lenis?.raf(time * 1000);
                });
                gsap.ticker.lagSmoothing(0);
            } else {
                function raf(time) {
                    window.lenis?.raf(time);
                    requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
            }

            // Global scroll control helpers
            window.lenisStop = () => window.lenis?.stop();
            window.lenisStart = () => window.lenis?.start();

            // Smooth anchor links interceptor
            document.addEventListener('click', (e) => {
                const anchor = e.target.closest('a[href^="#"]');
                if (!anchor) return;
                const targetId = anchor.getAttribute('href');
                if (!targetId || targetId === '#' || targetId === '#!') return;
                if (targetId.startsWith('#obra/') || targetId.startsWith('#estudio/')) return;
                try {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl && window.lenis) {
                        e.preventDefault();
                        window.lenis.scrollTo(targetEl, { offset: -24, duration: 1.15 });
                    }
                } catch (_) {}
            });
        } catch (err) {
            console.warn('Lenis init notice:', err);
        }
    }

    // 3. GSAP Creative Choreography
    if (typeof gsap !== 'undefined' && !reducedMotion) {
        try {
            // A. Hero Parallax on Scroll
            const heroWrapper = document.getElementById('featured-banner-wrapper');
            const heroMedia = heroWrapper?.querySelector('.av-hero-media');
            if (heroWrapper && heroMedia && typeof ScrollTrigger !== 'undefined') {
                gsap.to(heroMedia, {
                    yPercent: 16,
                    scale: 1.04,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroWrapper,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }

            // B. Ambient Depth Planes Float
            const planeA = document.querySelector('.ambient-plane-a');
            const planeB = document.querySelector('.ambient-plane-b');
            if (planeA && typeof ScrollTrigger !== 'undefined') {
                gsap.to(planeA, {
                    yPercent: -20,
                    xPercent: 8,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: document.body,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1.5
                    }
                });
            }
            if (planeB && typeof ScrollTrigger !== 'undefined') {
                gsap.to(planeB, {
                    yPercent: 25,
                    xPercent: -10,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: document.body,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 2
                    }
                });
            }

            // C. Magnetic Micro-Physics disabled per user request

        } catch (err) {
            console.warn('GSAP motion setup notice:', err);
        }
    }
}
window.initMotionSuite = initMotionSuite;

function setupMagneticPhysics() {
    // Magnetic physics disabled per user preference
}
window.setupMagneticPhysics = setupMagneticPhysics;

function startApp() {
    window.AnivoidUI.site.mount();
    window.AnivoidUI.account.mount();
    window.AnivoidUI.session.consumeVerification();
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }
    window.AnivoidUI.site.navigation.configure({ open: openAnimeDetail, studio: (name, animate) => window.switchTabToStudio(name, animate), catalog: () => window.switchTabToAll('#anime-grid-section', true), featured: () => window.switchTabToFeatured() });
    // 1. Reveal Elements on Scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    window.initObserver = (root = document) => {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('.reveal:not(.active)').forEach(el => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) el.classList.add('active');
            else revealObserver.observe(el);
        });
    };

    window.releaseRevealElement = element => revealObserver.unobserve(element);

    // 2. Loading Splash Screen Setup
    setupSplashScreen();
    
    // 3. Populate and Render Dashboard UI
    initUI();
    initMotionSuite();

    // Setup security notice modal close listener
    const secModal = document.getElementById('security-notice-modal');
    const closeSecBtn = document.getElementById('close-security-notice');
    if (secModal && closeSecBtn) {
        closeSecBtn.addEventListener('click', () => {
            secModal.classList.add('hidden');
            secModal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
            localStorage.setItem('anivoid_seen_security_notice_v2', 'true');
        });
    }

    // Setup Group Stats Modal listeners
    const openStatsBtn = document.getElementById('open-group-stats');
    const closeStatsBtn = document.getElementById('close-group-stats');
    const statsModal = document.getElementById('group-stats-modal');
    
    if (openStatsBtn && statsModal) {
        openStatsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            renderGroupStats();
            document.body.classList.add('overflow-hidden');
            statsModal.classList.remove('hidden');
            statsModal.classList.add('flex');
            
            window.AnivoidUI.account.close({ animate: false, restoreFocus: false });
        });
    }
    
    if (closeStatsBtn && statsModal) {
        const closeStats = () => {
            statsModal.classList.add('hidden');
            statsModal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        };
        closeStatsBtn.addEventListener('click', closeStats);
        statsModal.addEventListener('click', (e) => {
            if (e.target === statsModal) closeStats();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !statsModal.classList.contains('hidden')) closeStats();
        });
    }

    // Trigger asynchronous central state synchronization and periodic polling
    state.syncWithServer().then(() => {
        window.AnivoidUI.site.navigation.applyRoute(true);
        initUI();
    });

    // Polling leve para atualizações multiplayer. Evita re-render pesado em sequência.
    setInterval(() => {
        if (document.hidden) return;
        if (document.body.classList.contains('auth-gate-active')) return;
        state.syncWithServer().then((hasChanged) => {
            if (!hasChanged) return;
            
            updateProfileIndicator();
            renderFriendsDropdown();
            renderAnimeGrid();
            renderFeaturedBanner();
            
            // Real-time Central de Amigos update if open
            const addFriendModal = document.getElementById('add-friend-modal');
            if (addFriendModal && !addFriendModal.classList.contains('hidden')) {
                renderCentralDeAmigos();
            }
            
            if (state.activeDetailAnimeId) {
                const anime = state.animes.find(a => a.id === state.activeDetailAnimeId);
                if (anime) {
                    renderComments(anime);
                    // Update breakdown list
                    const breakdownContainer = document.getElementById('detail-ratings-breakdown');
                    if (breakdownContainer) {
                        breakdownContainer.innerHTML = '';
                        state.friends.forEach(friend => {
                            const rating = anime.ratings?.[friend.id];
                            const status = rating?.status || 'Plan to Watch';
                            const epsWatched = rating?.episodesWatched || 0;
                            const totalEps = parseInt(anime.episodes) || 0;
                            const overall = rating?.overall || '-';
                            const statusObj = STATUS_MAP[status] || STATUS_MAP['Plan to Watch'];
                            
                            const ratedEpsCount = rating?.episodeRatings ? Object.keys(rating.episodeRatings).length : 0;
                            let ratedText = '';
                            if (totalEps === 1) {
                                ratedText = ratedEpsCount > 0 ? 'filme avaliado' : 'sem nota';
                            } else {
                                ratedText = ratedEpsCount > 0 ? `${ratedEpsCount} eps avaliados` : 'sem notas de ep';
                            }
                            
                            const overallColorInfo = getScoreColor(overall);
                            const overallTextStyle = overall !== '-' ? `color: ${overallColorInfo.text}; text-shadow: 0 0 6px ${overallColorInfo.glow}` : 'color: #7f8c8d';
                            
                            const card = document.createElement('div');
                            const isFriendAdmin = friend.id === 'felipe' || (friend.name && friend.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe');
                            const adminBadge = getUserBadgesHtml(friend);
                            card.className = `glass-panel border rounded-2xl p-4 flex justify-between items-center text-sm ${isFriendAdmin ? 'border-brand/35 shadow-[0_0_15px_rgba(255,69,0,0.12)] bg-brand/[0.03]' : 'border-white/5'}`;
                            const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
                                ? `<img src="${friend.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
                                : `<span class="text-2xl">${friend.avatar || '👤'}</span>`;
                            card.innerHTML = `
                                <div class="flex items-center gap-3">
                                    ${avatarHtml}
                                    <div>
                                        <p class="font-semibold text-white" style="color: ${getUserDisplayNameColor(friend, friend.color)}">${friend.name}${adminBadge}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-[8px] uppercase tracking-wider font-mono px-2 py-0.5 border ${statusObj.border} ${statusObj.bg} ${statusObj.text} rounded-full">
                                                ${statusObj.label} (${epsWatched}/${totalEps > 0 ? totalEps : '?'})
                                            </span>
                                            <span class="text-[9px] text-gray-500 font-mono">${ratedText}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="text-[9px] uppercase text-gray-500 font-mono">Nota</span>
                                    <span class="text-lg font-serif font-bold" style="${overallTextStyle}">${overall}</span>
                                </div>
                            `;
                            breakdownContainer.appendChild(card);
                        });
                    }
                }
            }
        });
    }, 25000);
}

// App execution trigger moved to the bottom of the file to prevent TDZ ReferenceErrors

// Intro Splash Screen Logic (Auto-Transition + Click to Skip Fallback)
function checkAndShowSecurityModal() {
    if (!state.loggedInUser) return;
    const secModal = document.getElementById('security-notice-modal');
    if (secModal && !localStorage.getItem('anivoid_seen_security_notice_v2')) {
        secModal.classList.remove('hidden');
        secModal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
    }
}

function setupSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (!splashScreen) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let transitioned = false;
    const finish = () => {
        splashScreen.classList.add('hidden');
        splashScreen.style.display = 'none';
        if (!window.location.hash || window.location.hash === '#featured-banner-wrapper' || window.location.hash === '#anime-grid-section') {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
        if (state.friends.length === 0 && !state.loggedInUser) showRegistrationGate();
        else { hideRegistrationGate(); checkAndShowSecurityModal(); }
        if (window.initObserver) window.initObserver();
        if (window.initMotionSuite) window.initMotionSuite();
    };
    const transitionOut = (instant = false) => {
        if (transitioned) return;
        transitioned = true;
        if (reduced || instant) { finish(); return; }
        document.getElementById('splash-logo')?.classList.add('splash-logo-warp-active');
        splashScreen.classList.add('splash-warp-active');
        setTimeout(finish, 950);
    };
    // Cinematic entrance: lets the logo letters assemble, then dissolves into the site
    const timer = setTimeout(() => transitionOut(), reduced ? 0 : 2300);
    splashScreen.addEventListener('click', () => { clearTimeout(timer); transitionOut(false); });
}

// Initialise the interface elements and logic
function initUI() {
    removeLegacyRecoveryAccessLinks();

    // If no friends, show registration gate and stop
    if (state.friends.length === 0) {
        if (state.loggedInUser) {
            hideRegistrationGate();
        } else {
            showRegistrationGate();
        }
        return;
    }

    hideRegistrationGate();

    // Render current selection
    const currentFriend = state.getCurrentFriend();
    if (currentFriend) {
        applyUserThemeColor(currentFriend.color);
    }
    updateProfileIndicator();
    renderFriendsDropdown();
    renderFilters();
    renderAnimeGrid();
    renderFeaturedBanner();
    renderRecommendationsRail();
    updateNotificationBadges();
    setupUtilityModals();

    // Event Listeners for Filters
    const searchInput = document.getElementById('search-anime');
    if (searchInput) {
        bindElementOnce(searchInput, 'animeSearchInput', 'input', (e) => {
            state.searchQuery = e.target.value;
            renderAnimeGrid();
        });
    }

    renderSortDropdown();

    // Toggle Advanced Filters Panel
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const advancedFiltersPanel = document.getElementById('advanced-filters-panel');
    if (toggleFiltersBtn && advancedFiltersPanel) {
        bindElementOnce(toggleFiltersBtn, 'advancedFiltersToggle', 'click', () => {
            const isHidden = advancedFiltersPanel.classList.contains('hidden');
            if (isHidden) {
                advancedFiltersPanel.classList.remove('hidden');
                advancedFiltersPanel.classList.add('flex');
                toggleFiltersBtn.classList.add('border-brand', 'text-brand', 'bg-brand/5');
            } else {
                advancedFiltersPanel.classList.add('hidden');
                advancedFiltersPanel.classList.remove('flex');
                toggleFiltersBtn.classList.remove('border-brand', 'text-brand', 'bg-brand/5');
            }
        });
    }

    // Detail Page Back Button Control
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    if (backToHomeBtn) {
        bindElementOnce(backToHomeBtn, 'backToHome', 'click', () => {
            closeAnimeDetail();
        });
    }

    // Modal Control: Add Anime Modal
    const addAnimeModal = document.getElementById('add-anime-modal');
    const openAddAnimeBtn = document.getElementById('open-add-anime');
    const closeAddAnimeBtn = document.getElementById('close-add-anime');
    if (openAddAnimeBtn && addAnimeModal) {
        bindElementOnce(openAddAnimeBtn, 'openAddAnime', 'click', () => {
            openAnimeCatalogModal();
        });
    }
    if (closeAddAnimeBtn && addAnimeModal) {
        bindElementOnce(closeAddAnimeBtn, 'closeAddAnime', 'click', () => {
            closeAnimeCatalogModal();
        });
    }

    // Modal Control: Add Friend Modal (Awwwards Studio)
    const addFriendModal = document.getElementById('add-friend-modal');
    const openAddFriendBtn = document.getElementById('open-add-friend');
    const closeAddFriendBtn = document.getElementById('close-add-friend');
    const logoutBtn = document.getElementById('logout-btn');

    function closeAddFriendModal() {
        if (!addFriendModal || addFriendModal.classList.contains('hidden') || addFriendModal.classList.contains('is-closing')) return;
        if (window.lenisStart) window.lenisStart();
        addFriendModal.classList.add('is-closing');
        setTimeout(() => {
            addFriendModal.classList.remove('is-closing');
            addFriendModal.classList.add('hidden');
            addFriendModal.classList.remove('flex');
        }, 220);
    }
    window.closeAddFriendModal = closeAddFriendModal;

    if (openAddFriendBtn && addFriendModal) {
        bindElementOnce(openAddFriendBtn, 'openAddFriend', 'click', async () => {
            if (window.lenisStop) window.lenisStop();
            addFriendModal.classList.remove('hidden');
            addFriendModal.classList.add('flex');
            renderCentralDeAmigos();
            const refreshed = await refreshRegisteredUsersFromServer({ force: true });
            if (refreshed) renderCentralDeAmigos();
        });
    }
    if (logoutBtn && !logoutBtn.dataset.listenerHooked) {
        logoutBtn.dataset.listenerHooked = 'true';
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.disabled=true;
            try { await window.AnivoidUI.session.logout(clearAuthSession); }
            catch(error) {logoutBtn.disabled=false;alert(error.message);}
        });
    }
    if (closeAddFriendBtn && addFriendModal) {
        bindElementOnce(closeAddFriendBtn, 'closeAddFriend', 'click', () => {
            closeAddFriendModal();
        });
    }
    if (addFriendModal) {
        bindElementOnce(addFriendModal, 'backdropAddFriend', 'click', (e) => {
            if (e.target === addFriendModal) {
                closeAddFriendModal();
            }
        });
        if (!document.documentElement.dataset.addFriendEscHooked) {
            document.documentElement.dataset.addFriendEscHooked = 'true';
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !addFriendModal.classList.contains('hidden')) {
                    closeAddFriendModal();
                }
            });
        }
    }

    // Setup MAL style tabs click listeners
    const malTabs = {
        'mal-tab-All': 'All',
        'mal-tab-Watching': 'Watching',
        'mal-tab-Completed': 'Completed',
        'mal-tab-OnHold': 'On Hold',
        'mal-tab-Dropped': 'Dropped',
        'mal-tab-PlanToWatch': 'Plan to Watch'
    };

    Object.entries(malTabs).forEach(([id, status]) => {
        const btn = document.getElementById(id);
        if (btn) {
            bindElementOnce(btn, `malTab${id}`, 'click', () => {
                state.filterMALStatus = status;
                
                // Update active tab visual state
                Object.keys(malTabs).forEach(tabId => {
                    const tabBtn = document.getElementById(tabId);
                    if (tabBtn) {
                        if (tabId === id) {
                            tabBtn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-brand border-brand';
                        } else {
                            tabBtn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-white/40 border-transparent hover:text-white';
                        }
                    }
                });
                
                renderAnimeGrid();
            });
        }
    });



    // Form Submissions
    setupFormSubmissions();
    
    // Setup Comments handler


    // Setup Profile Editor Modal
    setupEditProfileModal();
    setupUtilityModals();
}

function updateProfileIndicator() {
    const friend = state.getCurrentFriend();
    const activeAvatar = document.getElementById('active-avatar');
    const activeName = document.getElementById('active-name');
    const profileIndicator = document.getElementById('profile-indicator');
    const badge = document.getElementById('friend-requests-badge');

    if (activeAvatar) {
        if (friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))) {
            activeAvatar.innerHTML = `<img src="${escapeHtml(friend.avatar)}" class="w-6 h-6 rounded-full object-cover" alt="">`;
        } else {
            activeAvatar.textContent = friend.avatar || '👤';
        }
    }
    if (activeName) {
        const badgesHtml = getUserBadgesHtml(friend);
        activeName.innerHTML = `${escapeHtml(friend.name)}${badgesHtml}`;
    }
    
    // Style borders and text with user theme
    if (profileIndicator) {
        profileIndicator.classList.add('profile-orbit-control');
        profileIndicator.style.setProperty('--profile-color', friend.color || '#FF4500');
        profileIndicator.style.borderColor = friend.color;
        profileIndicator.style.boxShadow = `0 0 15px ${friend.color}40`;
    }
    const adminBtn = document.getElementById('open-admin-center');
    if (adminBtn) {
        if (isCurrentUserAdmin()) {
            adminBtn.classList.remove('hidden');
            adminBtn.classList.add('flex');
        } else {
            adminBtn.classList.add('hidden');
            adminBtn.classList.remove('flex');
        }
    }
    setAdminCatalogControlsVisibility();

    // Update friend requests badge
    if (badge) {
        let registeredUsers = [];
        try {
            registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        } catch (err) {}
        
        const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
        const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
        
        if (curUser && curUser.friendRequests && curUser.friendRequests.length > 0) {
            badge.textContent = curUser.friendRequests.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    updateNotificationBadges();
}

function renderFriendsDropdown() {
    window.AnivoidUI.account.renderReviewers(state.friends, state.currentFriendId, (friend, event) => {
        state.currentFriendId = friend.id;
        state.save();
        applyUserThemeColor(friend.color);
        updateProfileIndicator();
        renderFriendsDropdown();
        renderAnimeGrid();
        renderFeaturedBanner();
        window.AnivoidUI.account.close({ animate: event.detail > 0 });
        if (state.activeDetailAnimeId) openAnimeDetail(state.activeDetailAnimeId);
    }, getUserBadgesHtml);
}

function renderFilters() {
    // Seasons
    const seasonsContainer = document.getElementById('seasons-filter');
    if (seasonsContainer) {
        seasonsContainer.innerHTML = '';
        
        // Add "Tudo" button
        const allBtn = createFilterButton('Todos', state.filterSeason === 'All', () => {
            state.filterSeason = 'All';
            renderFilters();
            renderAnimeGrid();
        });
        seasonsContainer.appendChild(allBtn);

        state.getSeasons().forEach(season => {
            const btn = createFilterButton(season, state.filterSeason === season, () => {
                state.filterSeason = season;
                renderFilters();
                renderAnimeGrid();
            });
            seasonsContainer.appendChild(btn);
        });
    }

    // Genres
    const genresContainer = document.getElementById('genres-filter');
    if (genresContainer) {
        genresContainer.innerHTML = '';
        
        const allBtn = createFilterButton('Gêneros: Todos', state.filterGenre === 'All', () => {
            state.filterGenre = 'All';
            renderFilters();
            renderAnimeGrid();
        });
        genresContainer.appendChild(allBtn);

        state.getGenres().forEach(genre => {
            const btn = createFilterButton(genre, state.filterGenre === genre, () => {
                state.filterGenre = genre;
                renderFilters();
                renderAnimeGrid();
            });
            genresContainer.appendChild(btn);
        });
    }

    const studiosContainer = document.getElementById('studios-filter');
    if (studiosContainer) {
        studiosContainer.innerHTML = '';
        studiosContainer.appendChild(createFilterButton('Todos', state.filterStudio === 'All', () => {
            state.filterStudio = 'All';
            renderFilters();
            renderAnimeGrid();
        }));
        state.getStudios().slice(0, 18).forEach(studio => {
            studiosContainer.appendChild(createFilterButton(studio, state.filterStudio === studio, () => {
                state.filterStudio = studio;
                renderFilters();
                renderAnimeGrid();
            }));
        });
    }

    const yearsContainer = document.getElementById('years-filter');
    if (yearsContainer) {
        yearsContainer.innerHTML = '';
        yearsContainer.appendChild(createFilterButton('Todos', state.filterYear === 'All', () => {
            state.filterYear = 'All';
            renderFilters();
            renderAnimeGrid();
        }));
        state.getYears().slice(0, 12).forEach(year => {
            yearsContainer.appendChild(createFilterButton(year, state.filterYear === year, () => {
                state.filterYear = year;
                renderFilters();
                renderAnimeGrid();
            }));
        });
    }

    const scoreContainer = document.getElementById('score-filter');
    if (scoreContainer) {
        scoreContainer.innerHTML = '';
        [
            ['All', 'Todas'],
            ['9+', '9+ Elite'],
            ['8+', '8+ Forte'],
            ['7+', '7+ Boa'],
            ['unrated', 'Sem nota']
        ].forEach(([value, label]) => {
            scoreContainer.appendChild(createFilterButton(label, state.filterScore === value, () => {
                state.filterScore = value;
                renderFilters();
                renderAnimeGrid();
            }));
        });
    }
}

function createFilterButton(text, isActive, onClick) {
    const btn = document.createElement('button');
    btn.className = `px-4 py-1.5 rounded-full text-xs uppercase tracking-widest border transition-all duration-300 font-mono ${
        isActive 
            ? 'bg-white text-black border-white scale-105 shadow-md shadow-white/10' 
            : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'
    }`;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
}

// Helper to get member badge HTML based on member number
function getMemberBadgeHtml(user, compact = false) {
    if (!user) return '';
    // Felipe is the Founder/Creator — he uses his own special admin/founder badges, no number
    const username = user.username || user.name || '';
    const usernameLower = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (usernameLower === 'felipe') return '';

    // Try to get memberNumber from the user object or from localStorage
    let memberNumber = user.memberNumber;
    if (!memberNumber) {
        try {
            const registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
            const username = user.username || user.name || '';
            const usernameLower = username.toLowerCase().replace(/[^a-z0-9]/g, '');
            const realUser = registeredUsers.find(u => u && u.username &&
                u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === usernameLower);
            if (realUser) memberNumber = realUser.memberNumber;
        } catch(e) {}
    }
    if (!memberNumber) return '';

    // Tier config based on member number
    const num = parseInt(memberNumber);
    let style, icon, label;
    if (num === 1) {
        style = 'background: linear-gradient(135deg, #ffd700, #ff8c00, #ffd700); color: #1a0a00; border-color: #ffd700;';
        icon = '👑'; label = compact ? `N°${num}` : `MEMBRO OURO  N°${num}`;
    } else if (num === 2) {
        style = 'background: linear-gradient(135deg, #064e3b, #065f46, #047857); color: #6ee7b7; border-color: #10b981; box-shadow: 0 0 14px rgba(16,185,129,0.5);';
        icon = '⚡'; label = compact ? `N°${num}` : `MEMBRO ELITE  N°${num}`;
    } else if (num <= 5) {
        style = 'background: linear-gradient(135deg, #7B2FBE, #4a1080); color: #e8d5ff; border-color: #a855f7;';
        icon = '⚡'; label = compact ? `N°${num}` : `MEMBRO ELITE  N°${num}`;
    } else if (num <= 20) {
        style = 'background: linear-gradient(135deg, #0ea5e9, #0369a1); color: #e0f2fe; border-color: #38bdf8;';
        icon = '🌟'; label = compact ? `N°${num}` : `MEMBRO ANTIGO  N°${num}`;
    } else {
        style = 'background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.2);';
        icon = '✦'; label = compact ? `N°${num}` : `MEMBRO  N°${num}`;
    }

    // Always show full label with icon in pill style (matching Felipe's ADMIN/FUNDADOR badges)
    const fullLabel = num === 1 ? `MEMBRO OURO N°${num}` :
                      num <= 5 ? `MEMBRO ELITE N°${num}` :
                      num <= 20 ? `MEMBRO ANTIGO N°${num}` :
                      `MEMBRO N°${num}`;
    if (compact) {
        return `<span class="premium-badge ml-1" style="${style} display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:6px; font-size:9px; font-family:monospace; font-weight:900; letter-spacing:0.06em; text-transform:uppercase; border:1px solid; box-shadow: 0 0 8px rgba(255,255,255,0.15);">${icon} ${fullLabel}</span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold border ml-1.5 shrink-0" style="${style} box-shadow: 0 0 8px rgba(255,255,255,0.12); letter-spacing: 0.05em;">${icon} ${fullLabel}</span>`;
}

// Helper to detect Felipe and ensure his display name is always pure white
function isFelipe(nameOrUser) {
    if (!nameOrUser) return false;
    const name = typeof nameOrUser === 'string'
        ? nameOrUser
        : (nameOrUser.username || nameOrUser.name || nameOrUser.id || '');
    return String(name).toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
}

function getUserDisplayNameColor(nameOrUser, customColor = null) {
    if (isFelipe(nameOrUser)) {
        return 'var(--av-ink)';
    }
    const color = customColor || (typeof nameOrUser === 'object' ? nameOrUser.color : null);
    if (!color || color === '#0000ff' || color.toLowerCase() === 'blue' || color === '#0000EE') {
        return 'var(--av-ink)';
    }
    const isLight = typeof document !== 'undefined' && document.documentElement?.getAttribute('data-color-scheme') === 'light';
    if (isLight && (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color.toLowerCase() === 'white')) {
        return 'var(--av-ink)';
    }
    return color;
}

// Helper to get HTML badges for Felipe dynamically based on active title choice (admin, founder, or both)
function getUserBadgesHtml(user) {
    if (!user) return '';
    const username = user.username || user.name || '';
    const usernameLower = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isFelipe = user.id === 'felipe' || usernameLower === 'felipe';

    let titleHtml = '';
    if (isFelipe) {
        let activeTitle = user.activeTitle;
        if (!activeTitle) {
            try {
                const registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                const realUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe');
                if (realUser) activeTitle = realUser.activeTitle;
            } catch (e) {}
        }
        if (!activeTitle) activeTitle = 'admin';
        const adminHtml = `<span class="premium-badge premium-badge-admin ml-1"><iconify-icon icon="lucide:shield-check"></iconify-icon>ADMIN</span>`;
        const founderHtml = `<span class="premium-badge premium-badge-founder ml-1"><iconify-icon icon="lucide:crown"></iconify-icon>FUNDADOR</span>`;
        if (activeTitle === 'admin') titleHtml = adminHtml;
        else if (activeTitle === 'founder') titleHtml = founderHtml;
        else if (activeTitle === 'both') titleHtml = adminHtml + founderHtml;
        else titleHtml = adminHtml;
    }

    // Add member number badge for all users
    const memberBadge = getMemberBadgeHtml(user, true);
    return titleHtml + memberBadge;
}

// Helper to calculate dynamic colors based on score (red to yellow to green)
function getScoreColor(score) {
    return window.AnivoidUI.scoreColor(score);
}

function renderFeaturedBanner() {
    if (state.activeDetailAnimeId) return;
    const container = document.getElementById('featured-banner-wrapper');
    if (container) projectUI.renderFeatured(container);
}

let catalogPanelsFrame = null;

function renderAnimeGrid() {
    if (catalogPanelsFrame !== null) cancelAnimationFrame(catalogPanelsFrame);
    catalogPanelsFrame = null;
    const grid = document.getElementById('anime-grid-container');
    const studiosContainer = document.getElementById('studios-directory-container');
    const filterBar = document.querySelector('#anime-grid-section .glass-panel');
    const gridHeader = document.getElementById('grid-header-section');
    const featuredBanner = document.getElementById('featured-banner-wrapper');
    const gridSection = document.getElementById('anime-grid-section');
    const activitiesWrapper = document.getElementById('activities-section-wrapper');
    if (!grid || !studiosContainer) return;

    if (state.activeDetailAnimeId) {
        if (featuredBanner) featuredBanner.style.display = 'none';
        if (gridSection) gridSection.style.display = 'none';
        if (activitiesWrapper) activitiesWrapper.style.display = 'none';
        return;
    }

    if (state.filterMALStatus === 'Studios') {
        grid.classList.add('hidden');
        if (filterBar) filterBar.classList.add('hidden');
        if (gridHeader) gridHeader.classList.add('hidden');
        if (featuredBanner) featuredBanner.style.display = 'none';
        if (activitiesWrapper) activitiesWrapper.style.display = 'none';
        
        const recRail = document.getElementById('recommendations-rail');
        if (recRail) recRail.classList.add('hidden');
        
        if (gridSection) {
            gridSection.classList.remove('py-20');
            gridSection.classList.add('pt-32', 'pb-20');
        }

        studiosContainer.classList.remove('hidden');
        studiosContainer.classList.add('block');
        renderStudiosDirectory();
        return;
    } else {
        grid.classList.remove('hidden');
        if (filterBar) filterBar.classList.remove('hidden');
        if (gridHeader) gridHeader.classList.remove('hidden');
        if (featuredBanner) featuredBanner.style.display = '';
        if (activitiesWrapper) activitiesWrapper.style.display = '';

        if (gridSection) {
            gridSection.classList.remove('pt-32', 'pb-20');
            gridSection.classList.add('py-20');
        }

        studiosContainer.classList.add('hidden');
        studiosContainer.classList.remove('block');
        
    }

    window.AnivoidUI.site.release(grid);
    document.body.dataset.avView = 'catalog';
    grid.querySelectorAll('.reveal').forEach(element => window.releaseRevealElement?.(element));
    grid.innerHTML = '';
    const filteredList = state.getFilteredAnimeList();

    if (filteredList.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center glass-panel rounded-3xl p-12 border border-white/5">
                <p class="text-gray-500 font-light text-lg">Nenhum anime encontrado para esta seleção de filtros.</p>
                <button data-reset-filters class="text-xs uppercase font-mono text-brand mt-4 hover:underline">Resetar Filtros</button>
            </div>
        `;
        return;
    }

    const gridFragment = document.createDocumentFragment();

    filteredList.forEach((anime, index) => gridFragment.appendChild(projectUI.createCard(anime, index)));

    grid.appendChild(gridFragment);

    window.AnivoidUI.site.reveal(grid);
    markViewEntered(grid);
    catalogPanelsFrame = requestAnimationFrame(() => {
        catalogPanelsFrame = null;
        renderActivitiesFeed();
        renderRecommendationsRail();
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
}

let activeStudioName = null;

// Helper to get descriptive text for studio profiles
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

// Studio logo map — local files in /logos/ folder, fallback to initials
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
    'PA Works': 'logos/p_a_works.png'
};

function normalizeStudioName(name) {
    return String(name || '').trim().toLowerCase();
}

function getStandardStudioName(name) {
    const raw = String(name || '').trim();
    if (!raw) return 'Desconhecido';
    
    const known = {
        'ufotable': 'Ufotable',
        'madhouse': 'Madhouse',
        'mappa': 'MAPPA',
        'bones': 'Bones',
        'witstudio': 'Wit Studio',
        'gainax': 'Gainax',
        'kyotoanimation': 'Kyoto Animation',
        'whitefox': 'White Fox',
        'comixwavefilms': 'CoMix Wave Films',
        'sunrise': 'Sunrise',
        'studioghibli': 'Studio Ghibli',
        'shaft': 'Shaft',
        'tokyomovieshinsha': 'Tokyo Movie Shinsha',
        'tatsunokoproduction': 'Tatsunoko Production',
        'bugfilm': 'BUG FILMS',
        'bugfilms': 'BUG FILMS',
        'sciencesaru': 'Science Saru',
        'toeianimation': 'Toei Animation',
        'pierrot': 'Pierrot',
        'davidproduction': 'David Production',
        'jcstaff': 'J.C.Staff',
        'studiobind': 'Studio Bind',
        'kinemacitrus': 'Kinema Citrus',
        'manglobe': 'Manglobe',
        'artland': 'Artland',
        'trianglestaff': 'Triangle Staff',
        'trigger': 'Trigger',
        'enishiya': 'Enishiya',
        'studiom2': 'Studio M2',
        'asread': 'Asread',
        'paworks': 'P.A. Works',
        'cloverworks': 'CloverWorks',
        'a1pictures': 'A-1 Pictures',
        'productionig': 'Production I.G',
        'tmsentertainment': 'TMS Entertainment'
    };
    
    const lookup = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (known[lookup]) return known[lookup];
    
    return raw
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
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

function getStudioLogo(studioName) {
    const staticLogo = STUDIO_LOGOS[studioName] || findLogoInMap(studioName, STUDIO_LOGOS);
    if (staticLogo) return staticLogo;
    const customLogos = state && state.studioLogos ? state.studioLogos : {};
    return sanitizeStudioLogoUrl(customLogos[studioName]) || sanitizeStudioLogoUrl(findLogoInMap(studioName, customLogos));
}

function rememberStudioLogo(studioName, logoUrl) {
    const studio = String(studioName || '').trim();
    const logo = sanitizeStudioLogoUrl(logoUrl);
    if (!studio || !logo || studio.toLowerCase() === 'desconhecido') return '';
    state.studioLogos = {
        ...(state.studioLogos || {}),
        [studio]: logo
    };
    localStorage.setItem('anivoid_studio_logos', JSON.stringify(state.studioLogos));
    return logo;
}

async function fetchStudioLogoFromMal(studioName) {
    const studio = String(studioName || '').trim();
    if (!studio || studio.toLowerCase() === 'desconhecido') return '';

    const existing = getStudioLogo(studio);
    if (existing) return existing;

    try {
        const response = await fetch(`https://api.jikan.moe/v4/producers?q=${encodeURIComponent(studio)}&limit=5`);
        if (!response.ok) return '';
        const json = await response.json();
        const producers = Array.isArray(json.data) ? json.data : [];
        const lookupKey = normalizeStudioLookupKey(studio);
        const producer = producers.find(item =>
            (item.titles || []).some(title => normalizeStudioLookupKey(title.title) === lookupKey) ||
            normalizeStudioLookupKey(item.title) === lookupKey ||
            normalizeStudioLookupKey(item.name) === lookupKey
        ) || producers[0];
        const logo = sanitizeStudioLogoUrl(
            producer?.images?.webp?.image_url ||
            producer?.images?.jpg?.image_url ||
            ''
        );
        return logo ? rememberStudioLogo(studio, logo) : '';
    } catch (err) {
        console.warn('Unable to fetch studio logo from MAL:', studio, err);
        return '';
    }
}

function hydrateStudioLogosFromAnimes(animes) {
    let changed = false;
    (animes || []).forEach(anime => {
        if (!anime || !anime.studio || !anime.studioLogoUrl) return;
        const logo = sanitizeStudioLogoUrl(anime.studioLogoUrl);
        if (!logo) return;
        const existing = getStudioLogo(anime.studio);
        if (!existing || existing !== logo) {
            state.studioLogos = {
                ...(state.studioLogos || {}),
                [anime.studio]: logo
            };
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem('anivoid_studio_logos', JSON.stringify(state.studioLogos));
    }
}

// Global Studio Brand Theme Colors (shared across landing cards and previews)
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
    'asread.':            { border: 'rgba(0, 112, 74, 0.4)', glow: 'rgba(0, 112, 74, 0.15)', text: '#00704a' }
};



function renderStudiosDirectory() {
    const container = document.getElementById('studios-directory-container');
    if (container) projectUI.renderStudios(container, activeStudioName);
}

window.switchTabToFeatured = () => {
    window.switchTabToAll('#featured-banner-wrapper', false);
    if (window.lenis) {
        window.lenis.scrollTo(0, { duration: 1.0 });
    } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('featured-banner-wrapper')?.scrollIntoView({ behavior: 'instant' });
    }
};

window.backToStudiosLanding = () => window.switchTabToStudio(null);

window.switchTabToAll = (targetHash = null, shouldScroll = false) => {
    state.filterMALStatus = 'All';
    ['mal-tab-All','mal-tab-Watching','mal-tab-Completed','mal-tab-OnHold','mal-tab-Dropped','mal-tab-PlanToWatch'].forEach(id => {
        const tab = document.getElementById(id);
        if (tab) { tab.classList.toggle('text-brand', id === 'mal-tab-All'); tab.classList.toggle('border-brand', id === 'mal-tab-All'); tab.classList.toggle('border-transparent', id !== 'mal-tab-All'); }
    });
    if (state.activeDetailAnimeId) closeAnimeDetail(false, targetHash);
    else { if (targetHash && targetHash !== '#anime-grid-section') window.AnivoidUI.site.navigation.mark(targetHash); renderAnimeGrid(); }
    renderFeaturedBanner();
    if (shouldScroll) {
        const gridSec = document.getElementById('anime-grid-section');
        if (window.lenis && gridSec) {
            window.lenis.scrollTo(gridSec, { offset: -24, duration: 1.15 });
        } else {
            gridSec?.scrollIntoView({ behavior: 'instant' });
        }
    }
};

window.switchTabToStudio = (studioName, animate = true) => {
    const update = () => {
        state.filterMALStatus = 'Studios'; activeStudioName = studioName || null;
        const detail = document.getElementById('anime-detail-page');
        if (detail) detail.classList.add('hidden');
        state.activeDetailAnimeId = null;
        const grid = document.getElementById('anime-grid-section');
        if (grid) grid.style.display = '';
        renderAnimeGrid();
        grid?.scrollIntoView({ behavior: 'instant' });
    };
    window.AnivoidUI.site.navigation.studio(studioName, update, animate === true);
};

window.quickAddEpisode = (animeId) => {
    state.incrementEpisode(animeId, state.currentFriendId);
    renderAnimeGrid();
    renderFeaturedBanner();
    if (state.activeDetailAnimeId === animeId) {
        openAnimeDetail(animeId);
    }
};

function resetFilters() {
    state.filterSeason = 'All';
    state.filterGenre = 'All';
    state.filterStudio = 'All';
    state.filterYear = 'All';
    state.filterScore = 'All';
    state.searchQuery = '';
    state.sortBy = 'group-score';
    state.filterMALStatus = 'All';
    
    const searchInput = document.getElementById('search-anime');
    if (searchInput) searchInput.value = '';
    
    renderSortDropdown();

    // Reset MAL tabs visual state
    const malTabs = ['mal-tab-All', 'mal-tab-Watching', 'mal-tab-Completed', 'mal-tab-OnHold', 'mal-tab-Dropped', 'mal-tab-PlanToWatch'];
    malTabs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            if (id === 'mal-tab-All') {
                btn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-brand border-brand';
            } else {
                btn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-white/40 border-transparent hover:text-white';
            }
        }
    });

    // Close advanced filters panel on reset
    const advancedFiltersPanel = document.getElementById('advanced-filters-panel');
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    if (advancedFiltersPanel && toggleFiltersBtn) {
        advancedFiltersPanel.classList.add('hidden');
        advancedFiltersPanel.classList.remove('flex');
        toggleFiltersBtn.classList.remove('border-brand', 'text-brand', 'bg-brand/5');
    }

    renderFilters();
    renderAnimeGrid();
}

// Render dynamic custom sort dropdown
function renderSortDropdown() {
    const container = document.getElementById('sort-select-container');
    if (!container) return;

    const options = [
        { value: 'group-score', label: 'Ordenar: Média do Grupo' },
        { value: 'my-score', label: 'Ordenar: Minha Nota' },
        { value: 'year-desc', label: 'Ordenar: Ano Recente' },
        { value: 'recent-added', label: 'Ordenar: Adicionados' },
        { value: 'title', label: 'Ordenar: Nome A-Z' }
    ];

    renderCustomDropdown(container, options, state.sortBy, (newValue) => {
        state.sortBy = newValue;
        renderAnimeGrid();
        renderSortDropdown(); // Re-render to update trigger label
    });
}

// Helper to render radial SVG progress chart for ratings with dynamic color based on score (red to green)


function renderCircularRating(containerId, score) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = window.AnivoidUI.site.scoreMarkup(score);
}

// Smooth animated dropdown closing helper honoring reduced motion
function closeDropdownAnimated(listEl, triggerEl, onClosed) {
    if (listEl?.id === 'friends-dropdown') {
        return window.AnivoidUI.account.close().then(() => { if (onClosed) onClosed(); });
    }
    if (!listEl || listEl.classList.contains('hidden')) {
        if (onClosed) onClosed();
        return;
    }
    if (listEl.__closingTimer) {
        clearTimeout(listEl.__closingTimer);
        listEl.__closingTimer = null;
    }
    const trigger = triggerEl || listEl.__dropdownTrigger;
    const chev = trigger?.querySelector('.select-chevron');
    if (chev) chev.classList.remove('rotate-180');

    const container = listEl.__dropdownContainer;
    const parentRow = container?.closest('.episode-row') || listEl.closest('.episode-row');
    if (parentRow) parentRow.classList.remove('active-dropdown-row');
    const parentPanel = container?.closest('.glass-panel') || listEl.closest('.glass-panel');
    if (parentPanel) parentPanel.classList.remove('active-dropdown-panel');

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        listEl.classList.add('hidden');
        listEl.classList.remove('flex', 'av-closing');
        if (onClosed) onClosed();
        return;
    }

    listEl.classList.add('av-closing');
    listEl.__closingTimer = setTimeout(() => {
        listEl.__closingTimer = null;
        listEl.classList.add('hidden');
        listEl.classList.remove('flex', 'av-closing');
        if (onClosed) onClosed();
    }, 160);
}

// Custom select dropdown component renderer matching Awwwards-tier micro-physics design system
function renderCustomDropdown(container, options, currentValue, onChange, isCompact = false, disabled = false, usePortal = false) {
    const containerId = typeof container === 'string' ? container : (container?.id || '');
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;

    if (containerId) {
        document.querySelectorAll('.select-options-list[data-dropdown-owner]').forEach(el => {
            if (el.dataset.dropdownOwner === containerId) el.remove();
        });
    }

    container.innerHTML = '';
    const shouldPortal = usePortal && !isCompact;
    
    // Find current label & status info
    const currentOpt = options.find(o => String(o.value) === String(currentValue));
    const currentLabel = currentOpt ? currentOpt.label : (isCompact ? '-' : 'Selecione');

    let triggerStatusGem = '';
    if (currentOpt && currentOpt.value && typeof STATUS_MAP !== 'undefined' && STATUS_MAP[currentOpt.value]) {
        const s = STATUS_MAP[currentOpt.value];
        triggerStatusGem = `<span class="av-status-dot-wrap" style="--status-color: ${s.color}; margin-right: 8px;"><span class="av-status-dot-halo"></span><span class="av-status-dot"></span></span>`;
    }

    const hadRendered = container.dataset.avRendered === 'true';
    container.dataset.avRendered = 'true';
    const textRevealClass = hadRendered ? ' av-text-swap' : '';

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    if (isCompact) {
        if (disabled) {
            trigger.disabled = true;
            trigger.style.cursor = 'not-allowed';
            if (!currentValue || currentValue === '') {
                trigger.className = 'av-dropdown-trigger inline-flex items-center justify-center bg-white/5 border border-white/5 rounded-lg py-1 px-2.5 text-[11px] font-mono text-gray-500 transition-all opacity-50';
                trigger.innerHTML = `<span>Sem Nota</span>`;
            } else {
                const colors = getScoreColor(currentValue);
                trigger.className = 'av-dropdown-trigger inline-flex items-center justify-center border rounded-lg py-1 px-2.5 text-[11px] font-mono font-bold transition-all opacity-70';
                trigger.style.borderColor = `color-mix(in srgb, ${colors.text} 19%, transparent)`;
                trigger.style.backgroundColor = `color-mix(in srgb, ${colors.text} 3%, transparent)`;
                trigger.style.color = colors.text;
                trigger.style.boxShadow = `0 0 6px ${colors.glow}`;
                trigger.style.textShadow = `0 0 2px ${colors.glow}`;
                trigger.innerHTML = `<span class="av-trigger-text${textRevealClass}">Nota: ${currentValue}</span>`;
            }
        } else {
            if (!currentValue || currentValue === '') {
                trigger.className = 'av-dropdown-trigger inline-flex items-center justify-center bg-[#050505] border border-white/10 hover:border-white/20 rounded-lg py-1 px-2.5 text-[11px] font-mono text-gray-400 hover:text-white transition-all cursor-pointer';
                trigger.innerHTML = `
                    <span>+ Nota</span>
                    <iconify-icon icon="lucide:plus" class="text-[10px] text-gray-500 ml-1"></iconify-icon>
                `;
            } else {
                const colors = getScoreColor(currentValue);
                trigger.className = 'av-dropdown-trigger inline-flex items-center justify-center border rounded-lg py-1 px-2.5 text-[11px] font-mono font-bold transition-all hover:scale-105 cursor-pointer';
                trigger.style.borderColor = `color-mix(in srgb, ${colors.text} 31%, transparent)`;
                trigger.style.backgroundColor = `color-mix(in srgb, ${colors.text} 7%, transparent)`;
                trigger.style.color = colors.text;
                trigger.style.boxShadow = `0 0 10px ${colors.glow}`;
                trigger.style.textShadow = `0 0 4px ${colors.glow}`;
                trigger.innerHTML = `
                    <span class="av-trigger-text${textRevealClass}">Nota: ${currentValue}</span>
                    <iconify-icon icon="lucide:edit-2" class="text-[9px] ml-1.5 opacity-60"></iconify-icon>
                `;
            }
        }
    } else {
        if (disabled) {
            trigger.disabled = true;
            trigger.style.cursor = 'not-allowed';
            trigger.className = 'av-dropdown-trigger flex items-center justify-between w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono uppercase text-gray-500 opacity-60';
            trigger.innerHTML = `<span class="inline-flex items-center min-w-0">${triggerStatusGem}<span class="av-trigger-text truncate${textRevealClass}">${currentLabel}</span></span>`;
        } else {
            trigger.className = 'av-dropdown-trigger flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono uppercase text-gray-300 hover:bg-white/10 focus:outline-none focus:border-brand/50 transition-all cursor-pointer';
            trigger.innerHTML = `
                <span class="inline-flex items-center min-w-0">${triggerStatusGem}<span class="av-trigger-text truncate${textRevealClass}">${currentLabel}</span></span>
                <iconify-icon icon="lucide:chevron-down" class="select-chevron text-gray-400 transition-transform duration-300 text-xs flex-shrink-0 ml-2"></iconify-icon>
            `;
        }
    }
    
    // Create options list container
    const list = document.createElement('div');
    if (isCompact) {
        list.className = 'absolute right-0 mt-1 w-24 select-options-list av-dropdown-drawer rounded-xl p-1 hidden flex-col shadow-2xl z-50 border border-white/10 max-h-48 overflow-y-auto';
    } else if (shouldPortal) {
        list.className = 'fixed select-options-list av-dropdown-drawer rounded-2xl p-2 hidden flex-col shadow-2xl border border-white/10';
        list.style.zIndex = '10050';
        list.style.maxHeight = '18rem';
        list.style.overflowY = 'auto';
    } else {
        list.className = 'absolute left-0 right-0 mt-2 select-options-list av-dropdown-drawer rounded-2xl p-2 hidden flex-col shadow-2xl z-50 border border-white/10';
    }
    if (containerId) list.dataset.dropdownOwner = containerId;
    list.__dropdownTrigger = trigger;
    list.__dropdownContainer = container;

    const positionPortalList = () => {
        if (!shouldPortal) return;

        const rect = trigger.getBoundingClientRect();
        const padding = 12;
        const width = Math.min(Math.max(rect.width, 220), window.innerWidth - padding * 2);
        const left = Math.min(Math.max(rect.left, padding), window.innerWidth - width - padding);
        const estimatedHeight = Math.min((options.length * 44) + 16, 288, window.innerHeight - padding * 2);
        let top = rect.bottom + 8;

        if (top + estimatedHeight > window.innerHeight - padding && rect.top - estimatedHeight - 8 > padding) {
            top = rect.top - estimatedHeight - 8;
        }

        list.style.left = `${left}px`;
        list.style.top = `${Math.max(padding, top)}px`;
        list.style.width = `${width}px`;
    };

    if (!disabled) {
        options.forEach((opt, idx) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.setProperty('--item-idx', idx);
            const isSelected = String(opt.value) === String(currentValue);

            if (isCompact) {
                item.className = `av-dropdown-item w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono transition-colors ${
                    isSelected
                        ? 'av-option-selected text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`;
                item.innerHTML = `<span class="av-option-label"><span class="av-option-text">${opt.label}</span></span>`;
            } else {
                let bulletColor = '';
                if (opt.value && typeof STATUS_MAP !== 'undefined' && STATUS_MAP[opt.value]) {
                    const statusDetails = STATUS_MAP[opt.value];
                    item.style.setProperty('--status-color', statusDetails.color);
                    bulletColor = `<span class="av-status-dot-wrap"><span class="av-status-dot-halo"></span><span class="av-status-dot"></span></span>`;
                }

                const selectedIndicator = isSelected
                    ? `<span class="av-selected-pill-beam"></span><iconify-icon icon="lucide:check" class="av-check-icon text-xs ml-auto flex-shrink-0"></iconify-icon>`
                    : '';

                item.className = `av-dropdown-item w-full text-left px-3.5 py-2.5 rounded-xl flex items-center text-xs font-mono uppercase transition-all ${
                    isSelected
                        ? 'av-option-selected text-white font-semibold'
                        : 'text-gray-400 hover:text-white'
                }`;
                item.innerHTML = `${bulletColor}<span class="av-option-label"><span class="av-option-text">${opt.label}</span></span>${selectedIndicator}`;
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                item.style.transform = 'scale(0.96)';

                const triggerText = trigger.querySelector('.av-trigger-text');
                if (triggerText) {
                    triggerText.classList.remove('av-text-swap');
                    void triggerText.offsetWidth;
                    triggerText.classList.add('av-text-swap');
                }

                closeDropdownAnimated(list, trigger, () => {
                    onChange(opt.value);
                });
            });
            list.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const parentRow = container.closest('.episode-row');
            const parentPanel = container.closest('.glass-panel');
            
            // Close all other custom dropdown lists first
            document.querySelectorAll('.select-options-list').forEach(el => {
                if (el !== list && !el.classList.contains('hidden')) {
                    closeDropdownAnimated(el, el.__dropdownTrigger);
                }
            });

            if (list.__closingTimer) {
                clearTimeout(list.__closingTimer);
                list.__closingTimer = null;
            }
            const isHidden = list.classList.contains('hidden') || list.classList.contains('av-closing');
            if (isHidden) {
                if (isCompact) {
                    const scrollParent = trigger.closest('#detail-episodes-rating-list');
                    if (scrollParent) {
                        const scrollRect = scrollParent.getBoundingClientRect();
                        const triggerRect = trigger.getBoundingClientRect();
                        const relativeTop = triggerRect.top - scrollRect.top;
                        
                        // If the trigger is in the bottom half of the scroll container, open upward
                        if (relativeTop > scrollRect.height * 0.5) {
                            list.style.bottom = '100%';
                            list.style.top = 'auto';
                            list.style.marginTop = '0';
                            list.style.marginBottom = '4px';
                        } else {
                            list.style.bottom = 'auto';
                            list.style.top = '100%';
                            list.style.marginTop = '4px';
                            list.style.marginBottom = '0';
                        }
                    }
                }
                positionPortalList();
                list.classList.remove('hidden', 'av-closing');
                list.classList.add('flex');
                
                // Re-trigger cascade animations on items
                list.querySelectorAll('.av-dropdown-item').forEach(btn => {
                    btn.style.animation = 'none';
                    void btn.offsetWidth;
                    btn.style.animation = '';
                });
                list.querySelectorAll('.av-option-text').forEach(txt => {
                    txt.style.animation = 'none';
                    void txt.offsetWidth;
                    txt.style.animation = '';
                });

                const chev = trigger.querySelector('.select-chevron');
                if (chev) chev.classList.add('rotate-180');
                if (parentRow) parentRow.classList.add('active-dropdown-row');
                if (parentPanel) parentPanel.classList.add('active-dropdown-panel');
            } else {
                closeDropdownAnimated(list, trigger);
            }
        });
    }

    // Make sure we append list and trigger to container
    container.appendChild(trigger);
    if (shouldPortal) {
        document.body.appendChild(list);
    } else {
        container.appendChild(list);
    }
}

function renderDetailStatus(anime) {
    const container = document.getElementById('status-select-container');
    if (!container) return;
    const status = anime.ratings?.[state.currentFriendId]?.status || 'Plan to Watch';
    const readOnly = state.currentFriendId !== getLoggedInProfileId();
    const key = [anime.id, state.currentFriendId, status, readOnly].join(':');
    if (container.dataset.avStatus === key) return;
    const options = Object.entries(STATUS_MAP).map(([value, item]) => ({ value, label: item.label }));
    renderCustomDropdown(container, options, status, newStatus => {
        state.setStatus(anime.id, state.currentFriendId, newStatus);
        updateAnimeDetailView(anime.id);
        renderAnimeGrid();
        renderFeaturedBanner();
    }, false, readOnly, true);
    container.dataset.avStatus = key;
}

function updateAnimeDetailView(animeId) {
    const anime = state.animes.find(item => item.id === animeId);
    if (!anime) return;
    projectUI.refreshNumbers(animeId);
    const readOnly = state.currentFriendId !== getLoggedInProfileId();
    const host = document.getElementById('av-rating-workbench');
    if (host) projectUI.renderWorkbench(host, anime, readOnly);
    renderComments(anime);
    renderAnimeHistory(anime);
}

// Open Detail Page
let detailReturnContext = null;

function openAnimeDetail(animeId, animate = true) {
    if (!state.animes.some(anime => anime.id === animeId)) return;
    const returnHash = window.location.hash;
    const update = () => showAnimeDetail(animeId, returnHash);
    if (state.activeDetailAnimeId === animeId) update();
    else window.AnivoidUI.site.navigation.anime(animeId, update, animate === true);
}

function showAnimeDetail(animeId, returnHash) {
    const anime = state.animes.find(item => item.id === animeId);
    const detailPage = document.getElementById('anime-detail-page');
    if (!anime || !detailPage) return;
    const alreadyOpen = !detailPage.classList.contains('hidden');
    const changingAnime = state.activeDetailAnimeId !== animeId;
    window.AnivoidUI.cancel('detail');
    const currentY = (window.lenis && typeof window.lenis.scroll === 'number') ? window.lenis.scroll : window.scrollY;
    if (!alreadyOpen) detailReturnContext = { scrollTop: currentY, animeId, hash: returnHash };
    state.activeDetailAnimeId = animeId;
    document.body.dataset.avView = 'detail';
    const banner = document.getElementById('featured-banner-wrapper');
    const grid = document.getElementById('anime-grid-section');
    if (banner) banner.style.display = 'none';
    if (grid) grid.style.display = 'none';
    detailPage.classList.remove('hidden');
    detailPage.classList.remove('av-detail-entering');
    detailPage.style.opacity = '';
    detailPage.style.transform = '';
    detailPage.style.transition = '';
    void detailPage.offsetWidth;
    detailPage.classList.add('av-detail-entering');
    if (detailPage.__enterTimer) clearTimeout(detailPage.__enterTimer);
    detailPage.__enterTimer = setTimeout(() => {
        detailPage.__enterTimer = null;
        detailPage.classList.remove('av-detail-entering');
    }, 1000);
    renderAnimeDetailBody(anime);
    const resetDetailScroll = () => {
        if (window.lenis) {
            try {
                window.lenis.scrollTo(0, { immediate: true, force: true });
                window.lenis.resize();
            } catch (_) {}
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (typeof ScrollTrigger !== 'undefined') {
            try { ScrollTrigger.refresh(); } catch (_) {}
        }
    };

    resetDetailScroll();
    requestAnimationFrame(() => {
        if (window.lenis) {
            try { window.lenis.resize(); } catch (_) {}
        }
        if (typeof ScrollTrigger !== 'undefined') {
            try { ScrollTrigger.refresh(); } catch (_) {}
        }
    });

    const title = document.getElementById('detail-title');
    if (title) {
        title.tabIndex = -1;
        try {
            title.focus({ preventScroll: true });
        } catch (_) {}
    }
}

function renderAnimeDetailBody(anime) {
    const animeId = anime.id;
    const detailPage = document.getElementById('anime-detail-page');
    // Set anime base details
    const detailPoster = document.getElementById('detail-poster');
    if (detailPoster) {
        detailPoster.src = window.AnivoidUI.imageUrl(anime.coverUrl);
        detailPoster.dataset.avCover = anime.id;
        detailPoster.alt = 'Capa de ' + anime.title;
    }
    document.getElementById('detail-title').innerHTML = escapeHtml(anime.title);
    document.getElementById('detail-japanese-title').innerHTML = escapeHtml(anime.japaneseTitle);
    document.getElementById('detail-synopsis').innerHTML = escapeHtml(anime.synopsis);

    // Set Featured Anime Button (Fixar Destaque)
    const featuredBtn = document.getElementById('detail-set-featured-btn');
    if (featuredBtn) {
        const isFeatured = state.featuredAnimeId === animeId;
        if (isFeatured) {
            featuredBtn.className = 'anivoid-action inline-flex items-center gap-1.5 px-3 py-1.5 border border-brand bg-brand text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-all mt-3 cursor-pointer shadow-lg';
            featuredBtn.innerHTML = `
                <iconify-icon icon="lucide:check-circle" class="text-xs"></iconify-icon>
                <span>Destaque fixo</span>
            `;
        } else {
            featuredBtn.className = 'anivoid-action inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-brand/30 hover:bg-brand/5 text-gray-400 hover:text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-all mt-3 cursor-pointer';
            featuredBtn.innerHTML = `
                <iconify-icon icon="lucide:pin" class="text-xs"></iconify-icon>
                <span>Fixar no Destaque</span>
            `;
        }
        
        featuredBtn.onclick = () => {
            if (isFeatured) {
                state.featuredAnimeId = null;
            } else {
                state.featuredAnimeId = animeId;
            }
            state.save();
            openAnimeDetail(animeId);
        };
    }

    const adminActions = document.getElementById('detail-admin-actions');
    const editAnimeButton = document.getElementById('detail-edit-anime-btn');
    const deleteAnimeButton = document.getElementById('detail-delete-anime-btn');
    if (adminActions) {
        if (isCurrentUserAdmin()) {
            adminActions.classList.remove('hidden');
            adminActions.classList.add('flex');
        } else {
            adminActions.classList.add('hidden');
            adminActions.classList.remove('flex');
        }
    }
    if (editAnimeButton) {
        editAnimeButton.onclick = () => openAnimeCatalogModal(anime);
    }
    if (deleteAnimeButton) {
        deleteAnimeButton.onclick = () => deleteAnimeAsAdmin(anime);
    }
    
    const studioBadge = document.getElementById('detail-studio');
    if (studioBadge) projectUI.renderCredit(studioBadge, anime);

    const maxEps = parseInt(anime.episodes) || 0;

    document.getElementById('detail-season').textContent = anime.season;
    document.getElementById('detail-episodes').textContent = maxEps === 1 ? 'Filme' : anime.episodes + ' Episódios';

    const avgScore = state.calculateAverageScore(animeId);
    
    // Scores share the same color policy across cards and the workbench.
    const friendRating = anime.ratings?.[state.currentFriendId];
    const myRating = friendRating || { animation: 0, story: 0, sound: 0, overall: 0, status: 'Plan to Watch', episodesWatched: 0, episodeRatings: {} };
    const myOverall = myRating.overall || 0;

    renderCircularRating('my-rating-overall-container', myOverall);
    renderCircularRating('group-rating-avg-container', avgScore);

    // Genres Tags
    const genresContainer = document.getElementById('detail-genres');
    genresContainer.innerHTML = (anime.genres && Array.isArray(anime.genres)) ? anime.genres.map(g => `<span class="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70 font-mono">${escapeHtml(g)}</span>`).join('') : '';

    // Active Friend info and Read-Only badge check
    const currentFriend = state.getCurrentFriend();
    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    const isReadOnly = state.currentFriendId !== loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const activeFriendLabel = document.getElementById('active-friend-name-label');
    if (activeFriendLabel) {
        activeFriendLabel.style.color = getUserDisplayNameColor(currentFriend, currentFriend.color);
        const adminBadge = getUserBadgesHtml(currentFriend);
        if (isReadOnly) {
            activeFriendLabel.innerHTML = `${escapeHtml(currentFriend.name)}${adminBadge} <span class="text-[9px] bg-white/10 text-white/50 border border-white/5 px-2 py-0.5 rounded-md ml-1 font-mono tracking-normal font-normal">Apenas Leitura</span>`;
        } else {
            activeFriendLabel.innerHTML = `<span class="block leading-tight">${escapeHtml(currentFriend.name)}</span><span class="flex flex-wrap gap-1 mt-1">${adminBadge}</span>`;
        }
    }

    // Render custom status dropdown
    renderDetailStatus(anime);

    // Set Episode progress labels and hide if movie
    const progressContainer = document.getElementById('detail-progress-container');
    if (progressContainer) {
        progressContainer.style.display = maxEps === 1 ? 'none' : 'block';
    }

    const epWatchedLabel = document.getElementById('detail-ep-watched-label');
    const epTotalLabel = document.getElementById('detail-ep-total-label');
    const progressFill = document.getElementById('detail-progress-bar');
    
    const myEpsWatched = myRating.episodesWatched || 0;
    if (epWatchedLabel) epWatchedLabel.textContent = myEpsWatched;
    if (epTotalLabel) epTotalLabel.textContent = maxEps > 0 ? maxEps : '?';
    if (progressFill) {
        const percentage = maxEps > 0 ? (myEpsWatched / maxEps) * 100 : 0;
        progressFill.style.width = `${percentage}%`;
    }

    const workbench = document.getElementById('av-rating-workbench');
    if (workbench) projectUI.renderWorkbench(workbench, anime, isReadOnly);

    // Render Related Seasons
    const relatedSection = document.getElementById('detail-related-seasons-section');
    const relatedList = document.getElementById('detail-related-seasons-list');
    if (relatedSection && relatedList) {
        const related = state.getRelatedSeasons(anime.id);
        if (related.length === 0) {
            relatedSection.classList.add('hidden');
        } else {
            relatedSection.classList.remove('hidden');
            relatedList.innerHTML = '';
            
            related.forEach(rel => {
                const relAvg = state.calculateAverageScore(rel.id);
                const relAvgColor = getScoreColor(relAvg);
                const relAvgStyle = relAvg > 0 ? `color: ${relAvgColor.text}; text-shadow: 0 0 5px ${relAvgColor.glow}` : 'color: #7f8c8d';
                const relRow = document.createElement('button');
                relRow.className = 'w-full text-left p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center gap-3 text-xs';
                relRow.innerHTML = `
                    <img src="${escapeHtml(window.AnivoidUI.imageUrl(rel.coverUrl))}" class="w-10 h-12 object-cover rounded-md" alt="${rel.title}">
                    <div class="flex-grow min-w-0">
                        <p class="font-serif font-semibold text-white truncate">${rel.title}</p>
                        <p class="text-[9px] text-gray-500 font-mono uppercase">${rel.season} • ${rel.studio}</p>
                    </div>
                    <span class="text-[10px] font-mono shrink-0" style="${relAvgStyle}">★ ${relAvg > 0 ? relAvg : '-'}</span>
                `;
                relRow.addEventListener('click', () => {
                    openAnimeDetail(rel.id);
                });
                relatedList.appendChild(relRow);
            });
        }
    }

    // Group Statistics Values
    const stats = state.getGroupStatusStats(animeId);
    const watchingEl = document.getElementById('group-stat-watching');
    const completedEl = document.getElementById('group-stat-completed');
    const onholdEl = document.getElementById('group-stat-onhold');
    const droppedEl = document.getElementById('group-stat-dropped');
    const plantowatchEl = document.getElementById('group-stat-plantowatch');

    if (watchingEl) watchingEl.textContent = stats['Watching'] || 0;
    if (completedEl) completedEl.textContent = stats['Completed'] || 0;
    if (onholdEl) onholdEl.textContent = stats['On Hold'] || 0;
    if (droppedEl) droppedEl.textContent = stats['Dropped'] || 0;
    if (plantowatchEl) plantowatchEl.textContent = stats['Plan to Watch'] || 0;

    // Comments/Reviews Section
    renderComments(anime);
    renderAnimeHistory(anime);

    // Group Members breakdown card container
    const breakdownContainer = document.getElementById('detail-ratings-breakdown');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = '';
        state.friends.forEach(friend => {
            const rating = anime.ratings?.[friend.id];
            const status = rating?.status || 'Plan to Watch';
            const epsWatched = rating?.episodesWatched || 0;
            const totalEps = parseInt(anime.episodes) || 0;
            const overall = rating?.overall || '-';
            const statusObj = STATUS_MAP[status] || STATUS_MAP['Plan to Watch'];
            
            // Count rated episodes for this friend
            const ratedEpsCount = rating?.episodeRatings ? Object.keys(rating.episodeRatings).length : 0;
            let ratedText = '';
            if (totalEps === 1) {
                ratedText = ratedEpsCount > 0 ? 'filme avaliado' : 'sem nota';
            } else {
                ratedText = ratedEpsCount > 0 ? `${ratedEpsCount} eps avaliados` : 'sem notas de ep';
            }
            
            const overallColorInfo = getScoreColor(overall);
            const overallTextStyle = overall !== '-' ? `color: ${overallColorInfo.text}; text-shadow: 0 0 6px ${overallColorInfo.glow}` : 'color: #7f8c8d';

            const card = document.createElement('div');
            const isFriendAdmin = friend.id === 'felipe' || (friend.name && friend.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe');
            const adminBadge = getUserBadgesHtml(friend);
            card.className = `glass-panel border rounded-2xl p-4 flex justify-between items-center text-sm cursor-pointer hover:border-brand/25 transition-colors ${isFriendAdmin ? 'border-brand/35 shadow-[0_0_15px_rgba(255,69,0,0.12)] bg-brand/[0.03]' : 'border-white/5'}`;
            const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
                ? `<img src="${friend.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
                : `<span class="text-2xl">${friend.avatar || '👤'}</span>`;
            card.innerHTML = `
                <div class="flex items-center gap-3">
                    ${avatarHtml}
                    <div>
                        <p class="font-semibold text-white" style="color: ${getUserDisplayNameColor(friend, friend.color)}">${friend.name}${adminBadge}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[8px] uppercase tracking-wider font-mono px-2 py-0.5 border ${statusObj.border} ${statusObj.bg} ${statusObj.text} rounded-full">
                                ${statusObj.label} (${epsWatched}/${totalEps > 0 ? totalEps : '?'})
                            </span>
                            <span class="text-[9px] text-gray-500 font-mono">${ratedText}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col items-end">
                    <span class="text-[9px] uppercase text-gray-500 font-mono">Nota</span>
                    <span class="text-lg font-serif font-bold" style="${overallTextStyle}">${overall}</span>
                </div>
            `;
            card.addEventListener('click', () => renderPlayerProfileModal(friend.id));
            breakdownContainer.appendChild(card);
        });
    }
}

// The community module owns composition, drafts and publication rendering.
function renderComments(anime) {
    const host = document.getElementById('av-conversation');
    if (host) projectUI.renderConversation(host, anime);
}

function closeAnimeDetail(animate = true, targetHash) {
    const detail = document.getElementById('anime-detail-page');
    if (!detail || detail.classList.contains('hidden')) return;
    const useMotion = typeof animate === 'boolean' ? animate : animate.detail > 0;
    window.AnivoidUI.site.navigation.catalog(hideAnimeDetail, useMotion, targetHash || detailReturnContext?.hash);
}

function hideAnimeDetail() {
    const detailPage = document.getElementById('anime-detail-page');
    if (!detailPage || detailPage.classList.contains('hidden')) return;
    window.AnivoidUI.cancel('detail');
    detailPage.classList.add('hidden');
    detailPage.classList.remove('page-transition-active', 'av-detail-entering');
    detailPage.style.opacity = '';
    detailPage.style.transform = '';
    detailPage.style.transition = '';
    state.activeDetailAnimeId = null;
    const banner = document.getElementById('featured-banner-wrapper');
    const grid = document.getElementById('anime-grid-section');
    if (banner) banner.style.display = '';
    if (grid) grid.style.display = '';
    renderAnimeGrid();
    renderFeaturedBanner();
    const context = detailReturnContext;
    detailReturnContext = null;
    const returnY = context?.scrollTop || 0;
    if (window.lenis) {
        try {
            window.lenis.scrollTo(returnY, { immediate: true, force: true });
            window.lenis.resize();
        } catch (_) {}
    }
    window.scrollTo({ top: returnY, behavior: 'instant' });
    document.documentElement.scrollTop = returnY;
    document.body.scrollTop = returnY;
    if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.refresh(); } catch (_) {}
    }
    const origin = Array.from(document.querySelectorAll('[data-anime-id]')).find(item => item.dataset.animeId === context?.animeId);
    if (origin) {
        origin.tabIndex = -1;
        try {
            origin.focus({ preventScroll: true });
        } catch (_) {}
    }

}

function setupFormSubmissions() {
    // Add Anime Form
    const addAnimeForm = document.getElementById('add-anime-form');
    if (addAnimeForm) {
        const studioInput = document.getElementById('form-anime-studio');
        const studioLogoInput = document.getElementById('form-studio-logo');
        if (studioInput && studioLogoInput && !studioInput.dataset.logoHooked) {
            studioInput.dataset.logoHooked = 'true';
            const fillKnownLogo = async () => {
                if (studioLogoInput.value.trim()) return;
                const knownLogo = getStudioLogo(studioInput.value);
                if (knownLogo) {
                    studioLogoInput.value = knownLogo;
                    return;
                }

                const originalPlaceholder = studioLogoInput.placeholder;
                studioLogoInput.placeholder = 'Buscando logo no MyAnimeList...';
                const malLogo = await fetchStudioLogoFromMal(studioInput.value);
                if (malLogo && !studioLogoInput.value.trim()) studioLogoInput.value = malLogo;
                studioLogoInput.placeholder = originalPlaceholder;
            };
            studioInput.addEventListener('change', fillKnownLogo);
            studioInput.addEventListener('blur', fillKnownLogo);
        }

        addAnimeForm.addEventListener('input', () => updateCatalogLivePreview());
        addAnimeForm.addEventListener('change', () => updateCatalogLivePreview());

        const cancelBtn = document.getElementById('cancel-add-anime');
        if (cancelBtn) {
            bindElementOnce(cancelBtn, 'cancelAddAnime', 'click', () => {
                closeAnimeCatalogModal();
            });
        }

        bindElementOnce(addAnimeForm, 'addAnimeSubmit', 'submit', async (e) => {
            e.preventDefault();
            if (!isCurrentUserAdmin()) {
                alert('Apenas o administrador pode alterar o catálogo de animes.');
                closeAnimeCatalogModal();
                return;
            }
            
            const animeId = document.getElementById('form-anime-id').value.trim();
            const title = document.getElementById('form-anime-title').value;
            const japaneseTitle = document.getElementById('form-anime-jp-title').value;
            const synopsis = document.getElementById('form-anime-synopsis').value;
            const studio = getStandardStudioName(window.AnivoidUI.studioMetadata.studioForAnime({
                title,
                japaneseTitle,
                studio: document.getElementById('form-anime-studio').value
            }));
            const season = document.getElementById('form-anime-season').value;
            const episodes = document.getElementById('form-anime-episodes').value;
            const coverUrl = document.getElementById('form-anime-cover').value;
            const studioLogoUrl = document.getElementById('form-studio-logo')?.value || '';
            
            // Genres (comma separated list)
            const genresRaw = document.getElementById('form-anime-genres').value;
            const genres = genresRaw.split(',').map(g => g.trim()).filter(Boolean);

            if (title) {
                const submitButton = document.getElementById('anime-form-submit');
                const originalLabel = submitButton?.textContent || 'Salvar Anime';
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = animeId ? 'Salvando Alterações...' : 'Adicionando Anime...';
                }
                try {
                    const response = await fetch(API_BASE_URL + '/api/admin/animes', {
                        method: 'POST',
                        headers: authHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({
                            anime: {
                                id: animeId || undefined,
                                title,
                                japaneseTitle,
                                synopsis,
                                genres,
                                studio,
                                season,
                                episodes,
                                coverUrl,
                                studioLogoUrl
                            }
                        })
                    });
                    const payload = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(payload.error || 'Não foi possível salvar o anime.');

                    applyCatalogMutationResponse(payload, payload.anime);
                    closeAnimeCatalogModal();
                    renderFilters();
                    renderAnimeGrid();
                    renderFeaturedBanner();
                    renderActivitiesFeed();
                    if (animeId && state.activeDetailAnimeId === animeId) {
                        openAnimeDetail(animeId);
                    }
                } catch (error) {
                    alert(error.message || 'Não foi possível salvar o anime.');
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalLabel;
                    }
                }
            }
        });
    }

    // Initialize Add Friend Options
    initAddFriendModalOptions();
}

// Time Clock Update function for Splash Screen
function updateTime() {
    const clockEl = document.getElementById('current-time');
    if (!clockEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
}

// Global click and escape event listeners to dismiss all custom dropdown overlays with smooth micro-physics
document.addEventListener('click', () => {
    document.querySelectorAll('.select-options-list').forEach(el => {
        if (!el.classList.contains('hidden')) {
            closeDropdownAnimated(el, el.__dropdownTrigger);
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.select-options-list:not(.hidden)').forEach(el => {
            closeDropdownAnimated(el, el.__dropdownTrigger);
        });
    }
});

setInterval(updateTime, 60000);
updateTime();

let selectedGenres = [];
let selectedStudios = [];
let selectedAnimeIds = [];
let regAvatarSelection = DEFAULT_AVATAR_SVG;

function initRegistrationOptions() {
    const genresList = document.getElementById('reg-genres-list');
    const studiosList = document.getElementById('reg-studios-list');
    const selectedAnimesList = document.getElementById('reg-selected-animes');
    const animeResults = document.getElementById('reg-anime-results');
    const animeSearch = document.getElementById('reg-anime-search');
    const avatarTrigger = document.getElementById('reg-avatar-trigger');
    const avatarInput = document.getElementById('reg-avatar');
    const avatarUploadBtn = document.getElementById('reg-avatar-upload-btn');
    const avatarFileInput = document.getElementById('reg-avatar-file');
    const regForm = document.getElementById('registration-form');

    if (!regForm) return;

    // Hook custom photo upload
    if (avatarUploadBtn && avatarFileInput) {
        avatarUploadBtn.addEventListener('click', () => {
            avatarFileInput.click();
        });
        
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert('Por favor, selecione uma imagem com menos de 2MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Url = event.target.result;
                    regAvatarSelection = base64Url;
                    if (avatarInput) avatarInput.value = base64Url;
                    
                    if (avatarTrigger) {
                        avatarTrigger.innerHTML = `<img src="${escapeHtml(base64Url)}" class="w-8 h-8 rounded-full object-cover mx-auto border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.4)]" alt="avatar">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- STEP NAVIGATION LOGIC ---
    let regCurrentStep = 1;

    function showRegStep(stepNum) {
        regCurrentStep = stepNum;
        
        // Hide all steps, show current step
        document.querySelectorAll('.reg-step').forEach(stepEl => {
            if (parseInt(stepEl.getAttribute('data-step')) === stepNum) {
                stepEl.classList.remove('hidden');
                stepEl.classList.add('space-y-6'); // Maintain spacing
            } else {
                stepEl.classList.add('hidden');
                stepEl.classList.remove('space-y-6');
            }
        });
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            const indStep = parseInt(indicator.getAttribute('data-step'));
            const circle = indicator.querySelector('span');
            const label = indicator.querySelector('.hidden');
            
            if (indStep === stepNum) {
                indicator.classList.add('active');
                circle.className = 'w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px] scale-110 shadow-md shadow-brand/20 transition-all duration-300';
                if (label) label.className = 'hidden sm:inline text-white font-bold transition-all';
            } else if (indStep < stepNum) {
                indicator.classList.remove('active');
                circle.className = 'w-5 h-5 rounded-full bg-brand/30 text-brand flex items-center justify-center font-bold text-[10px] transition-all duration-300';
                if (label) label.className = 'hidden sm:inline text-brand/70 transition-all';
            } else {
                indicator.classList.remove('active');
                circle.className = 'w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] transition-all duration-300';
                if (label) label.className = 'hidden sm:inline text-gray-500 transition-all';
            }
        });
        
        // Update buttons
        const prevBtn = document.getElementById('reg-prev-btn');
        const nextBtn = document.getElementById('reg-next-btn');
        
        if (stepNum === 1) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
        
        if (stepNum === 4) {
            nextBtn.textContent = 'Entrar no Anivoid';
            nextBtn.type = 'submit';
        } else {
            nextBtn.textContent = 'Próximo';
            nextBtn.type = 'button';
        }
    }

    const prevBtn = document.getElementById('reg-prev-btn');
    const nextBtn = document.getElementById('reg-next-btn');

    if (nextBtn && !nextBtn.dataset.listenerHooked) {
        nextBtn.dataset.listenerHooked = 'true';
        nextBtn.addEventListener('click', (e) => {
            if (regCurrentStep < 4) {
                if (regCurrentStep === 1) {
                    // Validate step 1 fields
                    const nameVal = document.getElementById('reg-name').value.trim();
                    const emailVal = document.getElementById('reg-email').value.trim();
                    const passwordVal = document.getElementById('reg-password').value.trim();
                    
                    if (!nameVal) {
                        alert('Por favor, preencha o seu nome de usuário/apelido.');
                        return;
                    }
                    if (!emailVal || !emailVal.includes('@')) {
                        alert('Por favor, insira um e-mail válido.');
                        return;
                    }
                    if (!passwordVal || passwordVal.length < MIN_PASSWORD_LENGTH) {
                        alert(`A senha deve conter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
                        return;
                    }
                }
                showRegStep(regCurrentStep + 1);
            }
        });
    }

    if (prevBtn && !prevBtn.dataset.listenerHooked) {
        prevBtn.dataset.listenerHooked = 'true';
        prevBtn.addEventListener('click', () => {
            if (regCurrentStep > 1) {
                showRegStep(regCurrentStep - 1);
            }
        });
    }

    // Force step 1 visibility initially
    showRegStep(1);

    // --- HOVER PREVIEW TOOLTIP LOGIC ---
    const tooltip = document.getElementById('reg-hover-tooltip');
    let tooltipTransitionToken = 0;
    
    function setupTooltipHover(element, title, filterFn) {
        let tooltipFrameId = null;
        let latestPointer = null;

        const positionTooltip = () => {
            tooltipFrameId = null;
            if (!tooltip || !latestPointer) return;
            const x = latestPointer.clientX + 15;
            const y = latestPointer.clientY + 15;

            const tooltipWidth = tooltip.offsetWidth || 350;
            const tooltipHeight = tooltip.offsetHeight || 220;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let posX = x;
            let posY = y;

            if (x + tooltipWidth > windowWidth) {
                posX = latestPointer.clientX - tooltipWidth - 15;
            }
            if (y + tooltipHeight > windowHeight) {
                posY = latestPointer.clientY - tooltipHeight - 15;
            }

            tooltip.style.left = `${posX}px`;
            tooltip.style.top = `${posY}px`;
        };

        element.addEventListener('mouseenter', () => {
            if (!tooltip) return;
            const matchingAnimes = state.animes.filter(a => filterFn(a) && a.id !== 'a20' && a.id !== 'a20_s2').slice(0, 4);
            
            const upperTitle = title.toUpperCase();
            const isStudio = title.toLowerCase().includes('estúdio');
            const iconHtml = isStudio 
                ? '<iconify-icon icon="lucide:clapperboard" class="text-[11px] text-brand"></iconify-icon>' 
                : '<iconify-icon icon="lucide:hash" class="text-[11px] text-brand"></iconify-icon>';
            
            document.getElementById('tooltip-title').innerHTML = `${iconHtml} <span>${upperTitle}</span>`;
            const listContainer = document.getElementById('tooltip-animes-list');
            listContainer.innerHTML = '';
            
            if (matchingAnimes.length === 0) {
                listContainer.innerHTML = '<p class="text-gray-500 italic text-[10px] py-2 text-center w-full">Nenhum anime encontrado.</p>';
            } else {
                matchingAnimes.forEach((anime, idx) => {
                    const avgScore = state.calculateAverageScore(anime.id);
                    const studioInfo = STUDIO_BRAND_COLORS[anime.studio] || { border: 'rgba(255, 69, 0, 0.4)', glow: 'rgba(255, 69, 0, 0.15)', text: '#FF4500' };
                    const glowColor = studioInfo.text;
                    const animationDelay = idx * 60; // 60ms stagger delay
                    const seasonYear = anime.season ? anime.season.split(' ').pop() : '';
                    
                    const item = document.createElement('div');
                    item.className = 'relative flex items-center gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)] overflow-hidden tooltip-item-animate';
                    item.style.animationDelay = `${animationDelay}ms`;
                    
                    item.innerHTML = `
                        <!-- Ambient Studio Brand Glow -->
                        <div class="absolute -right-10 -bottom-10 w-24 h-24 rounded-full filter blur-[20px] opacity-[0.25] pointer-events-none glow-pulse-bg" style="background: radial-gradient(circle, ${glowColor} 0%, transparent 70%);"></div>
                        
                        <img src="${escapeHtml(window.AnivoidUI.imageUrl(anime.coverUrl))}" class="w-[48px] h-[68px] object-cover rounded-xl border border-white/10 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.6)] z-10" alt="">
                        
                        <div class="min-w-0 flex-grow z-10 flex flex-col justify-between h-full py-0.5">
                            <div>
                                <p class="font-serif font-bold text-white/95 truncate max-w-[200px] leading-tight text-[12.5px]">${anime.title}</p>
                                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span class="text-[8.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/5">${anime.studio}</span>
                                    ${seasonYear ? `<span class="text-[8.5px] font-mono text-white/40">${seasonYear}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Rating Badge -->
                        <div class="shrink-0 z-10 flex flex-col items-end">
                            ${avgScore > 0 
                                ? `
                                <div class="flex items-center gap-0.5 bg-brand/10 border border-brand/25 px-2 py-0.5 rounded-lg text-[10px] font-bold text-brand shadow-[0_2px_8px_rgba(255,69,0,0.15)]">
                                    <iconify-icon icon="lucide:star" class="text-[10px]"></iconify-icon>
                                    <span>${avgScore.toFixed(1)}</span>
                                </div>
                                `
                                : `
                                <div class="flex items-center gap-0.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white/30">
                                    <span>S/N</span>
                                </div>
                                `
                            }
                        </div>
                    `;
                    listContainer.appendChild(item);
                });
            }
            tooltip.classList.remove('hidden');
            void tooltip.offsetWidth; // Reflow
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1) translateY(0)';
        });
        
        element.addEventListener('mousemove', (e) => {
            if (!tooltip) return;
            latestPointer = e;
            if (tooltipFrameId === null) {
                tooltipFrameId = requestAnimationFrame(positionTooltip);
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (!tooltip) return;
            if (tooltipFrameId !== null) cancelAnimationFrame(tooltipFrameId);
            tooltipFrameId = null;
            latestPointer = null;
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.95) translateY(12px)';
            
            const currentToken = ++tooltipTransitionToken;
            setTimeout(() => {
                if (currentToken === tooltipTransitionToken && tooltip.style.opacity === '0') {
                    tooltip.classList.add('hidden');
                }
            }, 220);
        });
    }

    if (avatarTrigger && avatarFileInput) {
        avatarTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarFileInput.click();
        });
    }

    // 2. Render Genres List
    const genres = ['Ação', 'Aventura', 'Drama', 'Fantasia', 'Sci-Fi', 'Suspense', 'Slice of Life', 'Comédia', 'Romance', 'Militar', 'Escolar', 'Esportes', 'Mecha', 'Mystery', 'Sobrenatural', 'Gore'];
    if (genresList && genresList.childElementCount === 0) {
        genresList.innerHTML = '';
        genres.forEach(genre => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'px-4 py-2 border border-white/10 rounded-full text-[11px] font-mono text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer';
            btn.textContent = genre;
            btn.addEventListener('click', () => {
                if (selectedGenres.includes(genre)) {
                    selectedGenres = selectedGenres.filter(g => g !== genre);
                    btn.className = 'px-4 py-2 border border-white/10 rounded-full text-[11px] font-mono text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer';
                } else {
                    selectedGenres.push(genre);
                    btn.className = 'px-4 py-2 bg-brand border border-brand rounded-full text-[11px] font-mono text-white scale-105 shadow-md shadow-brand/20 transition-all cursor-pointer';
                }
            });
            
            // Set up hover preview tooltips for genres
            setupTooltipHover(btn, `Gênero: ${genre}`, (anime) => anime.genres && Array.isArray(anime.genres) && anime.genres.includes(genre));
            
            genresList.appendChild(btn);
        });
    }

    // 3. Render Studios List
    const studios = ['Ufotable', 'A-1 Pictures', 'Production I.G', 'CloverWorks', 'Madhouse', 'MAPPA', 'Bones', 'Wit Studio', 'Gainax', 'Kyoto Animation', 'White Fox', 'Studio Ghibli', 'Sunrise', 'Shaft', 'Tokyo Movie Shinsha', 'Tatsunoko Production', 'CoMix Wave Films', 'BUG FILMS', 'Science Saru', 'Toei Animation', 'Pierrot', 'David Production', 'J.C.Staff', 'Studio Bind'];
    if (studiosList && studiosList.childElementCount === 0) {
        studiosList.innerHTML = '';
        studios.forEach(studio => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'px-4 py-2 border border-white/10 rounded-full text-[11px] font-mono text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer';
            btn.textContent = studio;
            btn.addEventListener('click', () => {
                if (selectedStudios.includes(studio)) {
                    selectedStudios = selectedStudios.filter(s => s !== studio);
                    btn.className = 'px-4 py-2 border border-white/10 rounded-full text-[11px] font-mono text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer';
                } else {
                    selectedStudios.push(studio);
                    btn.className = 'px-4 py-2 bg-brand border border-brand rounded-full text-[11px] font-mono text-white scale-105 shadow-md shadow-brand/20 transition-all cursor-pointer';
                }
            });
            
            // Set up hover preview tooltips for studios
            setupTooltipHover(btn, `Estúdio: ${studio}`, (anime) => anime.studio === studio);
            
            studiosList.appendChild(btn);
        });
    }

    // 4. Update selected anime list view
    const updateSelectedAnimesUI = () => {
        if (!selectedAnimesList) return;
        selectedAnimesList.innerHTML = '';
        if (selectedAnimeIds.length === 0) {
            selectedAnimesList.innerHTML = `<p class="text-[11px] text-gray-500 italic py-2">Nenhum anime selecionado.</p>`;
            return;
        }

        selectedAnimeIds.forEach(id => {
            const anime = state.animes.find(a => a.id === id);
            if (!anime) return;
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl gap-3 animate-[fadeIn_0.2s_ease-out]';
            row.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <img src="${escapeHtml(window.AnivoidUI.imageUrl(anime.coverUrl))}" class="w-8 h-10 object-cover rounded shrink-0" alt="">
                    <div class="min-w-0">
                        <p class="font-serif font-bold text-white text-[11px] truncate leading-tight">${anime.title}</p>
                        <p class="text-[9px] text-gray-500 font-mono">${anime.studio}</p>
                    </div>
                </div>
                <button type="button" class="text-red-500 hover:text-red-400 p-1 flex items-center justify-center shrink-0">
                    <iconify-icon icon="lucide:x" class="text-sm"></iconify-icon>
                </button>
            `;
            row.querySelector('button').addEventListener('click', () => {
                selectedAnimeIds = selectedAnimeIds.filter(animeId => animeId !== id);
                updateSelectedAnimesUI();
                renderAnimeListUI();
            });
            selectedAnimesList.appendChild(row);
        });
    };

    // 5. Render suggestions or search results
    const renderAnimeListUI = () => {
        if (!animeResults) return;
        const query = (animeSearch && animeSearch.value) ? animeSearch.value.trim().toLowerCase() : '';
        const recommendLabel = document.getElementById('reg-recommend-label');
        
        let filtered = [];
        if (query) {
            if (recommendLabel) recommendLabel.textContent = 'Resultados da Busca:';
            filtered = state.animes.filter(a => 
                (a.title.toLowerCase().includes(query) || 
                a.japaneseTitle.toLowerCase().includes(query) || 
                a.studio.toLowerCase().includes(query)) &&
                a.id !== 'a20' && a.id !== 'a20_s2'
            );
        } else {
            if (recommendLabel) recommendLabel.textContent = 'Sugestões Populares:';
            // Display popular default items
            const popularTitles = [
                'Frieren: Beyond Journey\'s End',
                'Demon Slayer: Infinity Castle',
                'Attack on Titan',
                'Hunter x Hunter (2011)',
                'Steins;Gate',
                'Death Note',
                'Jujutsu Kaisen (Temporada 3)',
                'Your Name.',
                'Witch Hat Atelier',
                'Dandadan'
            ];
            filtered = state.animes.filter(a => popularTitles.includes(a.title) && a.id !== 'a20' && a.id !== 'a20_s2');
        }

        animeResults.innerHTML = '';
        if (filtered.length === 0) {
            animeResults.innerHTML = `<p class="text-[11px] text-gray-500 italic py-2 flex justify-center w-full">Nenhum anime encontrado.</p>`;
            return;
        }

        filtered.forEach(anime => {
            const isSelected = selectedAnimeIds.includes(anime.id);
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `w-full text-left p-2 rounded-xl flex items-center justify-between border transition-all ${
                isSelected 
                    ? 'bg-brand/10 border-brand/50 text-white' 
                    : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`;
            item.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <img src="${escapeHtml(window.AnivoidUI.imageUrl(anime.coverUrl))}" class="w-8 h-10 object-cover rounded shrink-0" alt="">
                    <div class="min-w-0 text-left">
                        <p class="font-serif font-bold text-[11px] truncate leading-tight text-white">${anime.title}</p>
                        <p class="text-[9px] text-white/40 font-mono">${anime.studio} • ${anime.season}</p>
                    </div>
                </div>
                <div class="shrink-0 flex items-center justify-center p-1">
                    <iconify-icon icon="${isSelected ? 'lucide:check-circle' : 'lucide:plus-circle'}" class="text-sm ${isSelected ? 'text-brand' : 'text-white/40'}"></iconify-icon>
                </div>
            `;
            item.addEventListener('click', () => {
                if (isSelected) {
                    selectedAnimeIds = selectedAnimeIds.filter(id => id !== anime.id);
                } else {
                    selectedAnimeIds.push(anime.id);
                }
                updateSelectedAnimesUI();
                renderAnimeListUI();
            });
            animeResults.appendChild(item);
        });
    };

    // 6. Hook search input
    if (animeSearch && !animeSearch.dataset.listenerHooked) {
        animeSearch.dataset.listenerHooked = 'true';
        animeSearch.addEventListener('input', renderAnimeListUI);
    }

    // --- LOGIN AND VIEW TOGGLES ---
    const loginForm = document.getElementById('login-form');
    const toggleToLogin = document.getElementById('toggle-to-login');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const tabRegister = document.getElementById('tab-register');
    const tabLogin = document.getElementById('tab-login');
    const regIndicators = document.getElementById('reg-indicators');
    const regHeaderTag = document.getElementById('reg-header-tag');
    const regHeaderTitle = document.getElementById('reg-header-title');
    const regHeaderDesc = document.getElementById('reg-header-desc');

    const showLoginView = () => {
        const regPasswordInput = document.getElementById('reg-password');
        if (regPasswordInput) regPasswordInput.value = '';
        if (regForm && loginForm) {
            regForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            if (regIndicators) regIndicators.classList.add('hidden');
            if (regHeaderTag) regHeaderTag.textContent = 'Entrar no Anivoid';
            if (regHeaderTitle) regHeaderTitle.innerHTML = 'Bem-vindo de <span class="italic text-brand font-light">Volta</span>';
            if (regHeaderDesc) regHeaderDesc.textContent = 'Insira suas credenciais para acessar sua biblioteca personalizada.';
            
            if (tabLogin && tabRegister) {
                tabLogin.className = 'flex-grow py-1.5 rounded-full text-white bg-brand font-bold transition-all uppercase tracking-wider text-center';
                tabRegister.className = 'flex-grow py-1.5 rounded-full text-white/50 hover:text-white transition-all uppercase tracking-wider text-center';
            }
        }
    };

    const showRegisterView = () => {
        const loginPasswordInput = document.getElementById('login-password');
        if (loginPasswordInput) loginPasswordInput.value = '';
        if (regForm && loginForm) {
            loginForm.classList.add('hidden');
            regForm.classList.remove('hidden');
            if (regIndicators) regIndicators.classList.remove('hidden');
            if (regHeaderTag) regHeaderTag.textContent = 'Bem-vindo ao Anivoid';
            if (regHeaderTitle) regHeaderTitle.innerHTML = 'Crie seu <span class="italic text-brand font-light">Perfil de Otaku</span>';
            if (regHeaderDesc) regHeaderDesc.textContent = 'Antes de entrar, precisamos de algumas informações para personalizar sua experiência.';

            if (tabLogin && tabRegister) {
                tabRegister.className = 'flex-grow py-1.5 rounded-full text-white bg-brand font-bold transition-all uppercase tracking-wider text-center';
                tabLogin.className = 'flex-grow py-1.5 rounded-full text-white/50 hover:text-white transition-all uppercase tracking-wider text-center';
            }
        }
    };

    const completeAuthenticatedLogin = (loginData, passwordToRemember = '') => {
        const matchedUser = stripSensitiveUserFields(loginData.user);
        const userId = normalizeProfileId(matchedUser.username);
        setAuthSession(matchedUser.username, loginData.token);
        state.loggedInUser = matchedUser.username;

        if (loginData.state) {
            applyServerStateSnapshot(loginData.state);
            try {
                const restoredAnimes = JSON.parse(localStorage.getItem('anivoid_list_v2')) || [];
                if (Array.isArray(restoredAnimes)) state.animes = restoredAnimes;
            } catch (err) {}
        }

        // Migrate ratings and reviews from key '1' if they exist in localStorage
        state.animes.forEach(anime => {
            if (anime.ratings && anime.ratings['1']) {
                anime.ratings[userId] = { ...anime.ratings['1'] };
                delete anime.ratings['1'];
            }
            if (anime.comments) {
                anime.comments.forEach(comment => {
                    if (comment.friendId === '1') {
                        comment.friendId = userId;
                        comment.friendName = matchedUser.username;
                    }
                });
            }
        });
        state.repairDerivedRatings();
        localStorage.setItem('anivoid_list_v2', JSON.stringify(state.animes));

        state.currentFriendId = userId;
        localStorage.setItem('anivoid_current_friend_v2', userId);
        state.loadLocalSession();

        const regGate = document.getElementById('registration-gate');
        if (regGate) {
            hideRegistrationGate();
        }
        document.body.classList.remove('overflow-hidden');

        // Clean password inputs from memory and DOM immediately after authentication
        const loginPasswordInput = document.getElementById('login-password');
        if (loginPasswordInput) loginPasswordInput.value = '';
        const regPasswordInput = document.getElementById('reg-password');
        if (regPasswordInput) regPasswordInput.value = '';

        initUI();
        checkAndShowSecurityModal();
        showWelcomeToast(matchedUser.username);
        state.syncWithServer().then(() => {
            renderAnimeGrid();
            renderFeaturedBanner();
        });
    };

    if (toggleToLogin) {
        toggleToLogin.addEventListener('click', showLoginView);
    }
    if (tabLogin) {
        tabLogin.addEventListener('click', showLoginView);
    }

    if (toggleToRegister) {
        toggleToRegister.addEventListener('click', showRegisterView);
    }
    if (tabRegister) {
        tabRegister.addEventListener('click', showRegisterView);
    }

    if (loginForm && !loginForm.dataset.listenerHooked) {
        loginForm.dataset.listenerHooked = 'true';
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('login-email').value.trim();
            const passwordVal = document.getElementById('login-password').value.trim();

            let loginData = null;
            try {
                const loginResp = await submitLogin(emailVal, passwordVal);
                loginData = await loginResp.json().catch(() => ({}));

                if (loginData.code === 'LEGACY_PASSWORD_RESET_ADMIN_REQUIRED') {
                    alert(loginData.error || 'Esta conta precisa de reset administrativo antes do login.');
                    return;
                }

                if (loginResp.status === 426 || loginData.code === 'PASSWORD_RESET_REQUIRED') {
                    const resetNotice = [
                        'Aviso de segurança do AniVoid:',
                        '',
                        'Esta conta entrou com uma senha temporária criada durante a migração de segurança.',
                        'Para continuar, você precisa criar uma senha pessoal agora.',
                        '',
                        `Digite sua NOVA senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres, com letras e números):`
                    ].join('\n');
                    const newPassword = prompt(resetNotice);
                    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
                        alert(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres, contendo letras e números. Cancelado.`);
                        return;
                    }
                    const resetResp = await fetch(API_BASE_URL + '/api/account/change-password-forced', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailVal, oldPassword: passwordVal, newPassword: newPassword })
                    });
                    const resetData = await resetResp.json().catch(() => ({}));
                    if (!resetResp.ok) {
                        alert(resetData.error || 'Falha ao redefinir senha.');
                        return;
                    }
                    const freshLoginResp = await submitLogin(emailVal, newPassword);
                    const freshLoginData = await freshLoginResp.json().catch(() => ({}));
                    if (!freshLoginResp.ok || !freshLoginData.user) {
                        alert('Senha redefinida com sucesso! Entre novamente usando sua nova senha.');
                        return;
                    }
                    completeAuthenticatedLogin(freshLoginData);
                    return;
                }

                if (!loginResp.ok || !loginData.user) {
                    alert(loginData.error || 'E-mail ou senha incorretos! Por favor, tente novamente.');
                    return;
                }
            } catch (err) {
                console.error('Login request failed:', err);
                alert(err && err.message ? err.message : 'Nao foi possivel conectar ao servidor de login. Tente novamente em alguns instantes.');
                return;
            }

            completeAuthenticatedLogin(loginData);
        });
    }

    // 7. Form submission handler
    if (!regForm.dataset.listenerHooked) {
        regForm.dataset.listenerHooked = 'true';
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value.trim();
            const color = document.getElementById('reg-color').value;
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value.trim();
            const avatar = regAvatarSelection;

            if (!name) return;

            // Load registered users to check duplicates
            let registeredUsers = [];
            try {
                registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
            } catch (err) {
                registeredUsers = [];
            }

            const exists = registeredUsers.some(u => u && u.username && u.username.toLowerCase() === name.toLowerCase());
            if (exists) {
                alert('Este nome de usuário já está cadastrado por outro otaku. Escolha outro nome!');
                return;
            }
            const emailExists = registeredUsers.some(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                alert('Este e-mail já está em uso por outra conta. Faça login ou utilize outro e-mail!');
                return;
            }

            const userId = name.toLowerCase().replace(/[^a-z0-9]/g, '');

            const mainFriend = {
                id: userId,
                name: name,
                avatar: avatar,
                color: color,
                email: email,
                emailVerified: false,
                favoriteGenres: selectedGenres,
                favoriteStudios: selectedStudios,
                favoriteAnimes: selectedAnimeIds,
                friends: []
            };

            // Migrate ratings and reviews from key '1' if they exist in localStorage
            state.animes.forEach(anime => {
                if (anime.ratings && anime.ratings['1']) {
                    anime.ratings[userId] = { ...anime.ratings['1'] };
                    delete anime.ratings['1'];
                }
                if (anime.comments) {
                    anime.comments.forEach(comment => {
                        if (comment.friendId === '1') {
                            comment.friendId = userId;
                            comment.friendName = name;
                        }
                    });
                }
            });

            // Pre-populate status for selected favorite animes (mark as Completed, NO rating)
            selectedAnimeIds.forEach(animeId => {
                const anime = state.animes.find(a => a.id === animeId);
                if (anime) {
                    const totalEps = parseInt(anime.episodes) || 0;
                    // Only set watch status — never pre-populate a score the user didn't give
                    if (!anime.ratings[userId]) {
                        anime.ratings[userId] = {
                            animation: 0,
                            story: 0,
                            sound: 0,
                            overall: 0,
                            status: 'Completed',
                            episodesWatched: totalEps,
                            episodeRatings: {}
                        };
                    }
                    // Add a cute initial review
                    if (!anime.comments) anime.comments = [];
                    anime.comments.push({
                        id: 'c_init_' + Date.now(),
                        friendId: userId,
                        friendName: name,
                        comment: `Favoritado no registro! Essa obra é uma das minhas favoritas absolutas! ❤️`,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            const newUserRecord = {
                username: name,
                email: email,
                color: color,
                avatar: avatar,
                emailVerified: false,
                favoriteGenres: selectedGenres,
                favoriteStudios: selectedStudios,
                favoriteAnimes: selectedAnimeIds,
                friends: []
            };

            // Immediately register on the server and get member number
            let assignedMemberNumber = null;
            try {
                const registerPayload = await buildRegisterPayload(newUserRecord, password);
                const regResp = await fetch(API_BASE_URL + '/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registerPayload)
                });
                const regData = await regResp.json().catch(() => ({}));
                if (!regResp.ok || !regData.user) {
                    alert(regData.error || 'Não foi possível criar sua conta agora.');
                    return;
                }
                setAuthSession(regData.user.username || name, null);
                if (regData.state) {
                    applyServerStateSnapshot(regData.state);
                } else {
                    registeredUsers.push(stripSensitiveUserFields(regData.user));
                    storeRegisteredUsers(registeredUsers);
                }
                if (regData.user && regData.user.memberNumber) {
                    assignedMemberNumber = regData.user.memberNumber;
                }
            } catch(e) {
                console.error('Registration failed:', e);
                alert('Não foi possível criar sua conta agora. Tente novamente em alguns instantes.');
                return;
            }

            // Set session and save
            state.currentFriendId = userId;
            
            state.loadLocalSession();
            state.save();
            
            const regGate = document.getElementById('registration-gate');
            if (regGate) {
                hideRegistrationGate();
            }
            document.body.classList.remove('overflow-hidden');

            // Reload UI
            initUI();
            checkAndShowSecurityModal();

            // Show member welcome modal
            showMemberWelcomeModal(name, assignedMemberNumber);

            // Trigger welcome email (mapping template object correctly)
            const emailFriendObj = {
                name: name,
                email: email,
                favoriteGenres: selectedGenres,
                favoriteStudios: selectedStudios
            };
            triggerSimulatedWelcomeEmail(emailFriendObj);
        });
    }

    // Initial render call inside modal options
    updateSelectedAnimesUI();
    renderAnimeListUI();
}

// --- EMAIL AND TOAST NOTIFICATION HELPERS ---

// Member welcome modal — shown after registration OR first login with a member badge
function showMemberWelcomeModal(username, memberNumber) {
    const num = parseInt(memberNumber) || 0;
    let tierIcon, tierLabel, tierStyle, tierBorder, tierDesc, particleColor, glowColor;

    if (num === 1) {
        tierIcon = '👑';
        tierLabel = 'MEMBRO OURO';
        tierStyle = 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)';
        tierBorder = '#fbbf24';
        particleColor = '#fcd34d';
        glowColor = 'rgba(251, 191, 36, 0.4)';
        tierDesc = `Você é o <strong style="color:#fcd34d">1º membro</strong> a fazer parte do AniVoid.<br>Seu nome está gravado na história desta comunidade.`;
    } else if (num <= 5) {
        tierIcon = '⚡';
        tierLabel = 'MEMBRO ELITE';
        tierStyle = 'linear-gradient(135deg, #7c3aed, #6d28d9, #4c1d95)';
        tierBorder = '#a78bfa';
        particleColor = '#c4b5fd';
        glowColor = 'rgba(167, 139, 250, 0.4)';
        tierDesc = `Você é o <strong style="color:#c4b5fd">${num}º membro</strong> a fazer parte do AniVoid.<br>Um dos primeiros a descobrir este portal.`;
    } else if (num <= 20) {
        tierIcon = '🌟';
        tierLabel = 'MEMBRO ANTIGO';
        tierStyle = 'linear-gradient(135deg, #0284c7, #0369a1, #075985)';
        tierBorder = '#38bdf8';
        particleColor = '#7dd3fc';
        glowColor = 'rgba(56, 189, 248, 0.4)';
        tierDesc = `Você é o <strong style="color:#7dd3fc">${num}º membro</strong> a fazer parte do AniVoid.<br>Parte da geração que moldou esta comunidade.`;
    } else if (num === 0) {
        tierIcon = '⭐';
        tierLabel = 'MEMBRO ELITE';
        tierStyle = 'linear-gradient(135deg, #7c3aed, #6d28d9, #4c1d95)';
        tierBorder = '#a78bfa';
        particleColor = '#c4b5fd';
        glowColor = 'rgba(167, 139, 250, 0.4)';
        tierDesc = `Você faz parte do <strong style="color:#c4b5fd">grupo fundador</strong> do AniVoid.<br>Sua insígnia de membro está sendo processada.`;
    } else {
        tierIcon = '✦';
        tierLabel = 'MEMBRO';
        tierStyle = 'linear-gradient(135deg, #475569, #334155, #1e293b)';
        tierBorder = '#94a3b8';
        particleColor = '#cbd5e1';
        glowColor = 'rgba(148, 163, 184, 0.3)';
        tierDesc = `Você é o <strong style="color:#cbd5e1">${num}º membro</strong> do AniVoid.<br>Bem-vindo à nossa comunidade!`;
    }

    // Generate floating particles
    const particles = Array.from({ length: 18 }, (_, i) => {
        const size = 3 + Math.random() * 6;
        return `<div style="
            position:absolute; border-radius:50%;
            width:${size}px; height:${size}px;
            background:${particleColor}; opacity:${0.15 + Math.random() * 0.35};
            left:${Math.random()*100}%; top:${Math.random()*100}%;
            box-shadow: 0 0 ${size*2}px ${particleColor};
            animation: float ${5 + Math.random()*6}s ease-in-out infinite alternate;
            animation-delay:${Math.random()*4}s;
        "></div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'member-welcome-modal';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:10000;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.85); backdrop-filter:blur(16px);
        opacity:0; transition:opacity 0.5s ease;
    `;

    overlay.innerHTML = `
        <!-- Particles -->
        <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">${particles}</div>

        <!-- Card -->
        <div id="member-modal-card" style="
            position:relative; z-index:10;
            width:100%; max-width:420px; margin:0 16px;
            background:linear-gradient(160deg,#111111,#1a1a1a,#111111);
            border:1px solid rgba(255,255,255,0.08);
            border-radius:28px; overflow:hidden;
            box-shadow:0 60px 120px rgba(0,0,0,0.9), 0 0 60px ${glowColor};
            transform:translateY(24px) scale(0.96);
            transition:transform 0.55s cubic-bezier(0.34,1.56,0.64,1);
        ">
            <!-- Gradient top bar -->
            <div style="height:3px; background:${tierStyle}; width:100%;"></div>

            <!-- Glow halo behind badge -->
            <div style="
                position:absolute; top:40px; left:50%; transform:translateX(-50%);
                width:200px; height:200px; border-radius:50%;
                background:radial-gradient(circle, ${glowColor} 0%, transparent 70%);
                pointer-events:none; filter:blur(20px);
            "></div>

            <div style="padding:40px 36px 36px; text-align:center;">
                <!-- Icon -->
                <div style="font-size:64px; line-height:1; margin-bottom:20px; animation:badge-pulse 2s ease-in-out infinite;">${tierIcon}</div>

                <!-- Badge pill -->
                <div style="
                    display:inline-flex; align-items:center; gap:10px;
                    padding:10px 24px; border-radius:100px;
                    background:${tierStyle};
                    border:1.5px solid ${tierBorder};
                    box-shadow:0 0 24px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5);
                    font-family:monospace; font-weight:900;
                    font-size:13px; letter-spacing:0.12em; text-transform:uppercase;
                    color:#fff; margin-bottom:24px;
                ">
                    ${tierIcon} &nbsp;${tierLabel}${num > 0 ? ` &nbsp;·&nbsp; N°${num}` : ""}
                </div>

                <!-- Welcome heading -->
                <p style="font-size:10px;font-family:monospace;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:6px;">AniVoid — Bem-vindo</p>
                <h2 style="font-size:26px;font-weight:700;color:#fff;font-family:serif;margin:0 0 16px;">
                    Olá, <span style="background:${tierStyle};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${username}</span>!
                </h2>

                <!-- Description -->
                <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:24px;">
                    ${tierDesc}
                </p>

                <!-- Divider -->
                <div style="width:100%;height:1px;background:rgba(255,255,255,0.06);margin-bottom:24px;"></div>

                <!-- Founder message -->
                <div style="
                    background:rgba(255,255,255,0.03);
                    border:1px solid rgba(255,255,255,0.07);
                    border-radius:16px; padding:18px 20px;
                    text-align:left; margin-bottom:28px;
                ">
                    <p style="font-size:9px;font-family:monospace;text-transform:uppercase;letter-spacing:0.2em;color:#FF4500;margin-bottom:8px;">✦ Mensagem do Fundador</p>
                    <p style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.75;font-style:italic;margin:0;">
                        &ldquo;Sua insignia de membro é permanente e única. Obrigado por fazer parte do AniVoid desde o início. Espero que cada anime da sua lista te marque tanto quanto você já marcou este lugar.&rdquo;
                    </p>
                    <p style="font-size:10px;color:rgba(255,255,255,0.25);font-family:monospace;margin-top:10px;margin-bottom:0;">— Felipe!&nbsp;&nbsp;|&nbsp;&nbsp;Fundador &amp; Admin do AniVoid</p>
                </div>

                <!-- CTA -->
                <button
                    data-dismiss-welcome
                    style="
                        width:100%; padding:16px;
                        border-radius:16px; border:none; cursor:pointer;
                        background:${tierStyle};
                        box-shadow:0 0 20px ${glowColor};
                        color:#fff; font-weight:800;
                        font-size:13px; letter-spacing:0.1em;
                        text-transform:uppercase; font-family:monospace;
                        transition:transform 0.15s, box-shadow 0.15s;
                    "
                    onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 0 32px ${glowColor}'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 20px ${glowColor}'"
                >
                    ${tierIcon}&nbsp;&nbsp;Exibir minha insignia no perfil
                </button>
            </div>
        </div>
    `;

    // Inject keyframes if not yet injected
    if (!document.getElementById('member-modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'member-modal-keyframes';
        style.textContent = `
            @keyframes float {
                from { transform: translateY(0px) rotate(0deg); }
                to   { transform: translateY(-18px) rotate(10deg); }
            }
            @keyframes badge-pulse {
                0%, 100% { transform: scale(1) rotate(-3deg); }
                50%       { transform: scale(1.12) rotate(3deg); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const card = document.getElementById('member-modal-card');
            if (card) { card.style.transform = 'translateY(0) scale(1)'; }
        });
    });
}

function showWelcomeToast(username) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0a0a0a]/95 backdrop-blur-xl border border-brand/50 rounded-2xl p-4 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(255,69,0,0.15)] animate-[fadeIn_0.3s_ease-out] transition-all duration-500';
    toast.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-sm shrink-0">
            <span>✨</span>
        </div>
        <div class="min-w-0 flex-grow font-mono text-[11px]">
            <p class="font-bold text-brand uppercase tracking-widest text-[9px] mb-0.5">Entrada Autorizada</p>
            <p class="text-white font-serif font-bold text-[12px] truncate leading-tight">Bem-vindo(a) de volta, ${username}!</p>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function triggerSimulatedWelcomeEmail(user) {
    const toast = document.getElementById('email-toast');
    const toastSubject = document.getElementById('email-toast-subject');
    const toastClose = document.getElementById('email-toast-close');
    const modal = document.getElementById('email-modal');
    const modalClose = document.getElementById('email-modal-close');
    const modalTo = document.getElementById('email-modal-to');
    const modalSubject = document.getElementById('email-modal-subject');
    const modalUsername = document.getElementById('email-modal-username');
    const modalGenres = document.getElementById('email-modal-genres');
    const modalStudios = document.getElementById('email-modal-studios');
    const modalConfirmBtn = document.getElementById('email-confirm-btn');
    const modalDate = document.getElementById('email-modal-date');

    if (!toast || !modal) return;

    // --- REAL EMAIL DISPATCH VIA EMAILJS (IF CONFIGURED) ---
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey) {
        emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
        
        const genresStr = user.favoriteGenres.join(', ') || 'Nenhum selecionado';
        const studiosStr = user.favoriteStudios.join(', ') || 'Nenhum selecionado';
        
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
            name: user.name,
            email: user.email,
            title: `Cadastro de Onboarding (Gêneros: ${genresStr} | Estúdios: ${studiosStr})`,
            favorite_genres: genresStr,
            favorite_studios: studiosStr,
            reply_to: "no-reply@anivoid.anime"
        }).then(() => {
            console.log('Real email welcome template dispatched successfully.');
        }).catch(err => {
            console.error('Failed to send real welcome email via EmailJS:', err);
        });
    }

    // 1. Configure toast subject
    toastSubject.textContent = `Bem-vindo ao Anivoid, ${user.name}! 🌸`;
    
    // 2. Show toast with transition
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    void toast.offsetWidth; // Reflow
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';

    // Auto fadeout toast after 12 seconds
    let toastTimeout = setTimeout(() => {
        hideToast();
    }, 12000);

    function hideToast() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('flex');
        }, 500);
    }

    // Hook toast close
    if (toastClose) {
        toastClose.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(toastTimeout);
            hideToast();
        });
    }

    // Hook toast click to open email reader modal
    toast.addEventListener('click', () => {
        clearTimeout(toastTimeout);
        hideToast();

        // Populate modal data
        if (modalTo) modalTo.textContent = user.email;
        if (modalSubject) modalSubject.textContent = `Bem-vindo ao Anivoid, ${user.name}! 🌸`;
        if (modalUsername) modalUsername.textContent = user.name;
        if (modalGenres) modalGenres.textContent = user.favoriteGenres.join(', ') || 'Nenhum selecionado';
        if (modalStudios) modalStudios.textContent = user.favoriteStudios.join(', ') || 'Nenhum selecionado';
        if (modalDate) {
            const now = new Date();
            modalDate.textContent = `Hoje, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }

        // Configure confirmation button state
        if (modalConfirmBtn) {
            modalConfirmBtn.innerHTML = `
                <iconify-icon icon="lucide:check-circle" class="text-xs"></iconify-icon>
                <span>Enviar link de verificação</span>
            `;
            modalConfirmBtn.className = 'px-6 py-2.5 rounded-full bg-brand text-white hover:bg-brand/80 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest font-semibold text-[9px] border border-brand/40 shadow-[0_4px_15px_rgba(255,69,0,0.3)] flex items-center gap-2';
            modalConfirmBtn.disabled = false;
        }

        // Open modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    // Close modal click
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    // Confirm button listener
    if (modalConfirmBtn) {
        const newBtn = modalConfirmBtn.cloneNode(true);
        modalConfirmBtn.parentNode.replaceChild(newBtn, modalConfirmBtn);
        newBtn.textContent='Enviar link de verificação';
        newBtn.disabled=false;
        window.AnivoidUI.session.bindVerification(newBtn);
    }
}

// --- PROFILE EDITOR MODAL AND CUSTOM THEME STYLES ---

function applyUserThemeColor(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--brand', color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}40`);

    // Dynamically calculate contrast text color (black/dark-gray for light accents, white for dark/saturated accents)
    let contrastColor = '#ffffff';
    try {
        let cleanHex = color.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
        }
        if (cleanHex.length === 6) {
            const r = parseInt(cleanHex.substring(0, 2), 16);
            const g = parseInt(cleanHex.substring(2, 4), 16);
            const b = parseInt(cleanHex.substring(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                document.documentElement.style.setProperty('--brand-rgb', r + ' ' + g + ' ' + b);
                // YIQ formula to calculate perceived brightness
                const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                if (yiq >= 135) {
                    contrastColor = '#09090b'; // Tailwind zinc-950
                }
            }
        }
    } catch (e) {
        console.error('Error computing color contrast:', e);
    }
    document.documentElement.style.setProperty('--accent-text', contrastColor);
}

// ── TITLE PICKER: visual card selector for Felipe's active title ──────────
window.selectAdminTitle = function(title) {
    const hiddenInput = document.getElementById('edit-profile-active-title');
    if (hiddenInput) hiddenInput.value = title;

    document.querySelectorAll('.title-picker-card').forEach(card => {
        const isActive = card.dataset.title === title;
        const checkMark = card.querySelector('.check-mark');
        const checkCircle = card.querySelector('.title-check-icon');
        card.classList.toggle('is-selected', isActive);
        if (isActive) {
            card.style.transform = '';
            card.style.opacity = '1';
            card.style.borderColor = 'var(--av-accent)';
            if (checkMark) checkMark.classList.remove('hidden');
            if (checkCircle) checkCircle.style.borderColor = 'var(--av-accent)';
        } else {
            card.style.transform = '';
            card.style.opacity = '0.65';
            card.style.borderColor = '';
            if (checkMark) checkMark.classList.add('hidden');
            if (checkCircle) checkCircle.style.borderColor = '';
        }
    });

    const previewBadge = document.getElementById('profile-preview-badge');
    if (previewBadge) {
        previewBadge.innerHTML = getUserBadgesHtml({ activeTitle: title, id: 'felipe' });
    }
};

function getSessionUsername() {
    return state.loggedInUser || localStorage.getItem('anivoid_logged_in_username') || '';
}

function getCachedRegisteredUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        return Array.isArray(users) ? users : [];
    } catch (err) {
        return [];
    }
}

function findCachedUserByUsername(users, username) {
    const targetId = normalizeProfileId(username);
    if (!targetId) return null;
    return users.find(user => user && normalizeProfileId(user.username) === targetId) || null;
}

function getEditableProfileUserFromCache() {
    const registeredUsers = getCachedRegisteredUsers();
    const sessionUsername = getSessionUsername();
    const user = findCachedUserByUsername(registeredUsers, sessionUsername);
    if (user) return { user, registeredUsers };

    const loggedInFriendObj = state.friends.find(friend => friend && friend.isMe);
    if (!loggedInFriendObj) return { user: null, registeredUsers };

    return {
        registeredUsers,
        user: {
            username: String(loggedInFriendObj.name || sessionUsername || '').replace(/\s*\([^)]*\)\s*$/, ''),
            email: loggedInFriendObj.email || '',
            color: loggedInFriendObj.color || '#FF4500',
            avatar: loggedInFriendObj.avatar || '👤',
            activeTitle: loggedInFriendObj.activeTitle || ''
        }
    };
}

function setupEditProfileModal() {
    const openBtn = document.getElementById('open-edit-profile');
    const closeBtn = document.getElementById('close-edit-profile');
    const cancelBtn = document.getElementById('cancel-edit-profile');
    const modal = document.getElementById('edit-profile-modal');
    const form = document.getElementById('edit-profile-form');
    
    const nameInput = document.getElementById('edit-profile-name');
    const emailInput = document.getElementById('edit-profile-email');
    const colorInput = document.getElementById('edit-profile-color');
    const colorLabel = document.getElementById('edit-profile-color-label');
    
    const bannerInput = document.getElementById('edit-profile-banner');
    const bannerFileInput = document.getElementById('edit-profile-banner-file');
    const bannerUploadBtn = document.getElementById('edit-profile-banner-upload-btn');
    const bannerRemoveBtn = document.getElementById('edit-profile-banner-remove-btn');
    const previewChangeBannerBtn = document.getElementById('preview-change-banner-btn');
    const previewBanner = document.getElementById('profile-preview-banner');
    
    const avatarInput = document.getElementById('edit-profile-avatar');
    const avatarTrigger = document.getElementById('edit-profile-avatar-trigger');
    const avatarUploadBtn = document.getElementById('edit-profile-avatar-upload-btn');
    const avatarFileInput = document.getElementById('edit-profile-avatar-file');
    const previewChangeAvatarBtn = document.getElementById('preview-change-avatar-btn');
    const previewAvatar = document.getElementById('profile-preview-avatar');
    const previewName = document.getElementById('profile-preview-name');
    const previewBadge = document.getElementById('profile-preview-badge');
    const previewColorDot = document.getElementById('profile-preview-color-dot');
    
    const currentPasswordInput = document.getElementById('edit-profile-current-password');
    const newPasswordInput = document.getElementById('edit-profile-new-password');
    const signOutAllBtn = document.getElementById('edit-profile-signout-all');

    if (!modal || !form) return;

    const closeModal = () => {
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    };

    // Backdrop click & Escape handling
    if (!modal.dataset.modalCloseHooked) {
        modal.dataset.modalCloseHooked = 'true';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
        });
    }

    if (closeBtn && !closeBtn.dataset.editProfileHooked) {
        closeBtn.dataset.editProfileHooked = 'true';
        closeBtn.addEventListener('click', closeModal);
    }
    if (cancelBtn && !cancelBtn.dataset.editProfileHooked) {
        cancelBtn.dataset.editProfileHooked = 'true';
        cancelBtn.addEventListener('click', closeModal);
    }

    // Sign out all
    if (signOutAllBtn && !signOutAllBtn.dataset.editProfileHooked) {
        signOutAllBtn.dataset.editProfileHooked = 'true';
        signOutAllBtn.addEventListener('click', async () => {
            if (!confirm('Sair de todos os dispositivos? Voce precisara entrar de novo aqui tambem.')) return;
            const response = await fetch(API_BASE_URL + '/api/account/signout-all', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' })
            }).catch(() => null);
            if (!response || !response.ok) {
                alert('Nao foi possivel encerrar as sessoes agora.');
                return;
            }
            clearAuthSession();
            window.location.reload();
        });
    }

    // Live sync helpers
    const syncBannerPreview = (url) => {
        if (bannerInput) bannerInput.value = url || '';
        if (previewBanner) {
            if (url) {
                previewBanner.style.backgroundImage = `url('${url}')`;
                previewBanner.style.backgroundSize = 'cover';
                previewBanner.style.backgroundPosition = 'center';
            } else {
                previewBanner.style.backgroundImage = '';
            }
        }
    };

    const syncAvatarPreview = (avatar) => {
        if (avatarInput) avatarInput.value = avatar || '👤';
        const isImg = avatar && (avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/'));
        if (previewAvatar) {
            if (isImg) {
                previewAvatar.innerHTML = `<img src="${escapeHtml(avatar)}" class="w-full h-full rounded-full object-cover" alt="avatar">`;
            } else {
                previewAvatar.innerHTML = `<span class="text-2xl">${escapeHtml(avatar || '👤')}</span>`;
            }
        }
        if (avatarTrigger) {
            if (isImg) {
                avatarTrigger.innerHTML = `<img src="${escapeHtml(avatar)}" class="w-10 h-10 rounded-full object-cover mx-auto border border-white/20 shadow-md" alt="avatar">`;
            } else {
                avatarTrigger.innerHTML = `<span class="text-2xl">${escapeHtml(avatar || '👤')}</span>`;
            }
        }
    };

    const syncThemeColor = (color) => {
        if (!color) color = '#ff7957';
        if (colorInput) colorInput.value = color;
        if (colorLabel) colorLabel.textContent = color.toUpperCase();
        if (previewColorDot) previewColorDot.style.background = color;
        modal.querySelectorAll('.av-palette-pill').forEach(pill => {
            pill.classList.toggle('is-selected', pill.dataset.color.toLowerCase() === color.toLowerCase());
        });
    };

    // Banner file upload & compression
    const handleBannerFile = (file) => {
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            alert('Por favor, selecione uma imagem com menos de 8MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 1280;
                const maxH = 720;
                let w = img.width;
                let h = img.height;
                if (w > maxW || h > maxH) {
                    if (w / h > maxW / maxH) {
                        h = Math.round((h * maxW) / w);
                        w = maxW;
                    } else {
                        w = Math.round((w * maxH) / h);
                        h = maxH;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.85);
                syncBannerPreview(compressed);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    if (bannerUploadBtn && bannerFileInput && !bannerUploadBtn.dataset.hooked) {
        bannerUploadBtn.dataset.hooked = 'true';
        bannerUploadBtn.addEventListener('click', () => bannerFileInput.click());
    }
    if (previewChangeBannerBtn && bannerFileInput && !previewChangeBannerBtn.dataset.hooked) {
        previewChangeBannerBtn.dataset.hooked = 'true';
        previewChangeBannerBtn.addEventListener('click', () => bannerFileInput.click());
    }
    if (bannerFileInput && !bannerFileInput.dataset.hooked) {
        bannerFileInput.dataset.hooked = 'true';
        bannerFileInput.addEventListener('change', (e) => handleBannerFile(e.target.files?.[0]));
    }
    if (bannerRemoveBtn && !bannerRemoveBtn.dataset.hooked) {
        bannerRemoveBtn.dataset.hooked = 'true';
        bannerRemoveBtn.addEventListener('click', () => syncBannerPreview(''));
    }

    // Banner presets
    modal.querySelectorAll('.av-banner-preset-btn').forEach(btn => {
        if (!btn.dataset.hooked) {
            btn.dataset.hooked = 'true';
            btn.addEventListener('click', () => {
                const banner = btn.dataset.banner;
                if (banner) syncBannerPreview(banner);
            });
        }
    });

    // Avatar handlers
    const triggerAvatarUpload = () => avatarFileInput && avatarFileInput.click();
    if (avatarTrigger && !avatarTrigger.dataset.hooked) {
        avatarTrigger.dataset.hooked = 'true';
        avatarTrigger.addEventListener('click', triggerAvatarUpload);
    }
    if (avatarUploadBtn && !avatarUploadBtn.dataset.hooked) {
        avatarUploadBtn.dataset.hooked = 'true';
        avatarUploadBtn.addEventListener('click', triggerAvatarUpload);
    }
    if (previewChangeAvatarBtn && !previewChangeAvatarBtn.dataset.hooked) {
        previewChangeAvatarBtn.dataset.hooked = 'true';
        previewChangeAvatarBtn.addEventListener('click', triggerAvatarUpload);
    }
    if (avatarFileInput && !avatarFileInput.dataset.hooked) {
        avatarFileInput.dataset.hooked = 'true';
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) {
                alert('Por favor, selecione uma imagem com menos de 3MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                syncAvatarPreview(event.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Palette pills & color picker
    modal.querySelectorAll('.av-palette-pill').forEach(pill => {
        if (!pill.dataset.hooked) {
            pill.dataset.hooked = 'true';
            pill.addEventListener('click', () => {
                const color = pill.dataset.color;
                if (color) syncThemeColor(color);
            });
        }
    });

    if (colorInput && !colorInput.dataset.hooked) {
        colorInput.dataset.hooked = 'true';
        colorInput.addEventListener('input', (e) => syncThemeColor(e.target.value));
    }

    // Open modal
    if (openBtn && !openBtn.dataset.editProfileHooked) {
        openBtn.dataset.editProfileHooked = 'true';
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.AnivoidUI.account.close({ animate: false, restoreFocus: false });

            const fillModalFromCache = () => {
                const loggedInUsername = getSessionUsername();
                let registeredUsers = [];
                try {
                    registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                } catch (err) {}
                
                let user = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
                if (!user) {
                    const loggedInFriendObj = state.friends.find(f => f.isMe);
                    if (loggedInFriendObj) {
                        user = {
                            username: loggedInFriendObj.name.replace(' (Você)', ''),
                            email: loggedInFriendObj.email || '',
                            color: loggedInFriendObj.color || '#ff7957',
                            avatar: loggedInFriendObj.avatar || '😎',
                            banner: loggedInFriendObj.banner || '',
                            activeTitle: loggedInFriendObj.activeTitle || 'admin'
                        };
                    }
                }

                const editableProfile = getEditableProfileUserFromCache();
                if (editableProfile.user && editableProfile.user.username) {
                    user = editableProfile.user;
                }

                if (!user || !user.username) return null;

                modal.dataset.editUsername = user.username;

                if (nameInput) {
                    nameInput.value = user.username;
                    nameInput.disabled = true;
                }
                if (emailInput) emailInput.value = user.email || '';
                
                syncBannerPreview(user.banner || '');
                syncAvatarPreview(user.avatar || '👤');
                syncThemeColor(user.color || '#ff7957');

                if (previewName) previewName.textContent = user.username;
                if (previewBadge) previewBadge.innerHTML = getUserBadgesHtml(user);

                const editTitleContainer = document.getElementById('edit-profile-title-container');
                const isFelipeUser = isFelipe(user);
                if (isFelipeUser && editTitleContainer) {
                    editTitleContainer.classList.remove('hidden');
                    selectAdminTitle(user.activeTitle || 'admin');
                } else if (editTitleContainer) {
                    editTitleContainer.classList.add('hidden');
                }

                return user;
            };

            const userLoaded = fillModalFromCache();
            if (!userLoaded) {
                alert('Nao foi possivel identificar sua sessao. Entre novamente antes de editar o perfil.');
                return;
            }

            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');

            (async () => {
                try {
                    await refreshRegisteredUsersFromServer({ force: true });
                    await state.syncWithServer();
                    fillModalFromCache();
                } catch (err) {
                    console.warn('Could not refresh profile before edit:', err);
                }
            })();
        });
    }

    // Form submit
    if (form.dataset.editProfileHooked) return;
    form.dataset.editProfileHooked = 'true';
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newEmail = emailInput ? emailInput.value.trim() : '';
        const newColor = colorInput ? colorInput.value : '#ff7957';
        const newAvatar = avatarInput ? avatarInput.value : '👤';
        const newBanner = bannerInput ? bannerInput.value : '';
        const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
        const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';

        const editUsername = modal.dataset.editUsername || getSessionUsername();
        if (!editUsername) {
            alert('Nao foi possivel identificar sua sessao. Entre novamente antes de editar o perfil.');
            return;
        }

        const originalEmail = getCachedRegisteredUsers().find(user => user.username === editUsername)?.email || '';
        if ((newPassword || newEmail.toLowerCase() !== originalEmail.toLowerCase()) && !currentPassword) {
            alert('Digite sua senha atual para alterar o e-mail ou a senha.'); return;
        }
        if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
            alert('A nova senha deve ter pelo menos 10 caracteres, com letras e números.'); return;
        }

        const registeredUsers = getCachedRegisteredUsers();
        const userRecord = findCachedUserByUsername(registeredUsers, editUsername);
        const fields = {
            email: newEmail,
            color: newColor,
            avatar: newAvatar,
            banner: newBanner
        };

        if (userRecord) {
            userRecord.email = newEmail;
            userRecord.color = newColor;
            userRecord.avatar = newAvatar;
            userRecord.banner = newBanner;
            
            const editTitleSelect = document.getElementById('edit-profile-active-title');
            if (isFelipe(userRecord) && editTitleSelect) {
                userRecord.activeTitle = editTitleSelect.value;
                fields.activeTitle = editTitleSelect.value;
            }
            
            storeRegisteredUsers(registeredUsers);
        }

        try {
            const response = await fetch(API_BASE_URL + '/api/patch-user', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ username: editUsername, fields, currentPassword })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                alert(data.error || 'Nao foi possivel salvar seu perfil. Entre novamente e tente outra vez.');
                return;
            }
            if (data.registeredUsers) storeRegisteredUsers(data.registeredUsers);
            if (data.user && data.user.username) {
                setAuthSession(data.user.username);
            }
        } catch (err) {
            console.error('Profile update failed:', err);
            alert('Nao foi possivel salvar seu perfil agora. Tente novamente em instantes.');
            return;
        }

        if (newPassword) {
            const passwordResp = await fetch(API_BASE_URL + '/api/account/change-password', {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ password: newPassword, currentPassword })
            }).catch(() => null);
            if (!passwordResp || !passwordResp.ok) {
                alert('Perfil salvo, mas nao foi possivel trocar a senha agora.');
            } else {
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
            }
        }

        state.loadLocalSession();
        await state.syncWithServer();
        
        applyUserThemeColor(newColor);
        closeModal();

        initUI();

        // Show elegant toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#121510]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-[fadeIn_0.3s_ease-out] transition-all duration-500';
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-sm shrink-0">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div class="min-w-0 flex-grow font-sans text-[11px]">
                <p class="font-bold text-white uppercase tracking-widest text-[9px] mb-0.5">Perfil Atualizado</p>
                <p class="text-white/70 text-[12px] truncate leading-tight">Sua identidade e capa foram salvas com sucesso!</p>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    });
}

// --- ADD FRIEND REGISTRY MATCHING AND MANUAL CUSTOMIZATION ---

function initAddFriendModalOptions() {
    const searchInput = document.getElementById('form-friend-search');
    const clearBtn = document.getElementById('clear-friend-search');
    if (!searchInput) return;

    const handleSearchInput = () => {
        const hasText = Boolean(searchInput.value && searchInput.value.trim());
        if (clearBtn) {
            if (hasText) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }
        renderRegisteredUsersSuggestions();
    };

    // Search query listener
    bindElementOnce(searchInput, 'friendSearchInput', 'input', () => {
        handleSearchInput();
        refreshRegisteredUsersFromServer().then((refreshed) => {
            if (refreshed) renderRegisteredUsersSuggestions();
        });
    });

    if (clearBtn) {
        bindElementOnce(clearBtn, 'clearFriendSearchBtn', 'click', () => {
            searchInput.value = '';
            handleSearchInput();
            searchInput.focus();
        });
    }

    // Reset suggestion list on click-outside search input if empty
    if (!document.documentElement.dataset.friendSearchDismissHooked) {
        document.documentElement.dataset.friendSearchDismissHooked = 'true';
        document.addEventListener('click', (e) => {
            const listContainer = document.getElementById('registered-users-list');
            if (listContainer && !listContainer.contains(e.target) && e.target !== searchInput && (!clearBtn || e.target !== clearBtn)) {
                if (!searchInput.value.trim()) {
                    listContainer.classList.add('hidden');
                }
            }
        });
    }
}

    // --- MYANIMELIST AUTOCOMPLETE SEARCH (JIKAN API) ---
    const animeTitleInput = document.getElementById('form-anime-title');
    const suggestionsBox = document.getElementById('form-anime-suggestions');
    let searchDebounceTimeout = null;

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

        const normalizeAnimeSearchText = (value) => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

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
            const confirmed = window.AnivoidUI.studioMetadata.verifiedStudio(title);
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
            const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
            try {
                const response = await fetch(url, controller ? { signal: controller.signal } : {});
                if (timer) clearTimeout(timer);
                return response;
            } catch (err) {
                if (timer) clearTimeout(timer);
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

        function scoreAnimeRelevance(anime, rawQuery) {
            const q = normalizeAnimeSearchText(rawQuery);
            const tEn = normalizeAnimeSearchText(anime.title_english || '');
            const tJp = normalizeAnimeSearchText(anime.title || '');
            const allText = tEn + ' ' + tJp;
            
            let pts = 0;
            const qHasPart1 = /(part|parte)s*1/.test(q);
            const qHasPart2 = /(part|parte)s*2/.test(q);
            const qHasPart3 = /(part|parte)s*3/.test(q) || q.includes('kanketsu') || q.includes('final chapters');
            const qHasFinal = q.includes('final season') || q.includes('temporada final') || q.includes('season 4') || q.includes('temporada 4');
            
            // Exact query match boost
            if (tEn === q || tJp === q) pts += 500;

            // Specific Part matching
            if (qHasPart2) {
                if (/(part|parte)s*2/.test(allText)) pts += 450;
                else pts -= 200;
            }
            if (qHasPart1) {
                if (/(part|parte)s*1/.test(allText) || (!allText.includes('part') && allText.includes('final season'))) pts += 350;
                if (/(part|parte)s*2/.test(allText)) pts -= 250;
            }
            if (qHasPart3) {
                if (allText.includes('kanketsu') || allText.includes('final chapters') || /(part|parte)s*3/.test(allText)) pts += 450;
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
                    
                    let studioName = window.AnivoidUI.studioMetadata.kitsuStudio(anime, included);
                    
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
                
                const studioName = getStandardStudioName(window.AnivoidUI.studioMetadata.studioForAnime(anime));
                const studioMissing = window.AnivoidUI.studioMetadata.isUnknownStudio(studioName);

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
                        setTimeout(() => {
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
            clearTimeout(searchDebounceTimeout);

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

            searchDebounceTimeout = setTimeout(async () => {
                const results = await searchAnimeMAL(query);
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

function updateCentralDeAmigosMeta() {
    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase()) || {
        username: loggedInUsername || 'Membro',
        avatar: '👤',
        friends: [],
        friendRequests: []
    };

    const nameEl = document.getElementById('friends-modal-my-name');
    if (nameEl) nameEl.textContent = curUser.username;

    const avatarEl = document.getElementById('friends-modal-my-avatar');
    if (avatarEl) {
        if (curUser.avatar && (curUser.avatar.startsWith('data:') || curUser.avatar.startsWith('http'))) {
            avatarEl.innerHTML = `<img src="${escapeHtml(curUser.avatar)}" alt="" class="w-full h-full object-cover">`;
        } else {
            avatarEl.textContent = curUser.avatar || '👤';
        }
    }

    const friendsCount = Array.isArray(curUser.friends) ? curUser.friends.length : 0;
    const countBadge = document.getElementById('friends-roster-count-badge');
    if (countBadge) {
        countBadge.textContent = `${friendsCount} ${friendsCount === 1 ? 'amigo' : 'amigos'}`;
    }
}

function renderCentralDeAmigos() {
    updateCentralDeAmigosMeta();
    renderRegisteredUsersSuggestions();
    renderPendingRequests();
    renderSentRequests();
    renderModalFriendsList();
}

function renderRegisteredUsersSuggestions() {
    const listContainer = document.getElementById('registered-users-list');
    const searchInput = document.getElementById('form-friend-search');
    if (!listContainer) return;

    const query = searchInput ? normalizeUserSearchText(searchInput.value) : '';

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {
        registeredUsers = [];
    }

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) return;

    const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
    if (!curUser) return;

    // Filter out ourselves and virtual users
    const filteredUsers = registeredUsers.filter(u => 
        u && u.username && u.username.toLowerCase() !== loggedInUsername.toLowerCase() && !u.isVirtual
    );

    // Filter by query
    const matched = filteredUsers.filter(u => {
        const usernameText = normalizeUserSearchText(u && u.username);
        const emailText = normalizeUserSearchText(u && u.email);
        return usernameText.includes(query) || emailText.includes(query);
    });

    listContainer.innerHTML = '';
    if (!query) {
        listContainer.classList.add('hidden');
        return;
    }

    listContainer.classList.remove('hidden');

    if (matched.length === 0) {
        listContainer.innerHTML = `
            <div class="av-friends-no-match">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="m9 9 4 4m0-4-4 4"/></svg>
                <p>Nenhum usuário correspondente encontrado.</p>
            </div>
        `;
        return;
    }

    matched.forEach(user => {
        const item = document.createElement('div');
        const isUserAdmin = user.username && user.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
        const adminBadge = getUserBadgesHtml(user);
        item.className = `av-friend-suggestion-card ${isUserAdmin ? 'is-admin' : ''}`;
        
        const avatarHtml = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))
            ? `<img src="${escapeHtml(user.avatar)}" class="w-full h-full object-cover" alt="">`
            : `<span>${user.avatar || '👤'}</span>`;

        // Determine status and button
        let actionBtnHtml = '';
        const isFriend = curUser.friends && curUser.friends.some(f => user && user.username && f.toLowerCase() === user.username.toLowerCase());
        const hasSentRequest = user && user.friendRequests && user.friendRequests.some(r => r.from && r.from.toLowerCase() === loggedInUsername.toLowerCase());
        const hasReceivedRequest = curUser.friendRequests && curUser.friendRequests.some(r => r.from && user && user.username && r.from.toLowerCase() === user.username.toLowerCase());

        if (isFriend) {
            actionBtnHtml = `<span class="av-status-chip is-friend"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>Amigos</span>`;
        } else if (hasReceivedRequest) {
            actionBtnHtml = `
                <button type="button" class="btn-accept av-btn-pill-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>Aceitar</span>
                </button>
            `;
        } else if (hasSentRequest) {
            actionBtnHtml = `<span class="av-status-chip is-pending"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Pendente</span>`;
        } else {
            actionBtnHtml = `
                <button type="button" class="btn-add av-btn-pill-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                    <span>Adicionar</span>
                </button>
            `;
        }

        item.innerHTML = `
            <div class="av-friend-card-main">
                <div class="av-friend-avatar-wrap">
                    ${avatarHtml}
                </div>
                <div class="av-friend-info">
                    <div class="av-friend-name-row">
                        <span class="av-friend-name">${escapeHtml(user.username)}</span>
                        ${adminBadge}
                    </div>
                    <span class="av-friend-sub">${escapeHtml(user.email || 'Membro do Coletivo')}</span>
                </div>
            </div>
            <div class="av-friend-actions">
                ${actionBtnHtml}
            </div>
        `;

        // Add event listeners
        const addBtn = item.querySelector('.btn-add');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                addBtn.disabled = true;
                addBtn.innerHTML = `<iconify-icon icon="lucide:loader-2" class="animate-spin text-xs"></iconify-icon><span>Enviando...</span>`;
                const res = await state.sendFriendRequest(user.username);
                if (res.error) {
                    alert(res.error);
                    renderCentralDeAmigos();
                } else {
                    showWelcomeToast(`Solicitação enviada para ${user.username}!`);
                    state.save(); // syncs and updates UI
                    renderCentralDeAmigos();
                }
            });
        }

        const acceptBtn = item.querySelector('.btn-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', async () => {
                acceptBtn.disabled = true;
                const res = await state.respondFriendRequest(user.username, 'accept');
                if (res.error) {
                    alert(res.error);
                } else {
                    showWelcomeToast(`Agora você e ${user.username} são amigos!`);
                    state.save();
                    renderCentralDeAmigos();
                }
            });
        }

        const confirmFriendBtn = item.querySelector('.btn-confirm-friend');
        if (confirmFriendBtn) {
            confirmFriendBtn.addEventListener('click', async () => {
                confirmFriendBtn.disabled = true;
                confirmFriendBtn.innerHTML = `<iconify-icon icon="lucide:loader-2" class="animate-spin text-xs"></iconify-icon><span>Confirmando...</span>`;
                const res = await state.setFriendship(user.username);
                if (res.error) {
                    alert(res.error);
                    renderCentralDeAmigos();
                } else {
                    showWelcomeToast(`Agora você e ${user.username} são amigos!`);
                    state.save();
                    renderCentralDeAmigos();
                }
            });
        }

        listContainer.appendChild(item);
    });
}

function renderPendingRequests() {
    const section = document.getElementById('pending-requests-section');
    const container = document.getElementById('pending-requests-list');
    const badge = document.getElementById('pending-requests-count-badge');
    if (!section || !container) return;

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) {
        section.classList.add('hidden');
        return;
    }

    const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
    if (!curUser || !curUser.friendRequests || curUser.friendRequests.length === 0) {
        section.classList.add('hidden');
        container.innerHTML = '';
        if (badge) badge.textContent = '0';
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';
    if (badge) badge.textContent = String(curUser.friendRequests.length);

    curUser.friendRequests.forEach(req => {
        const sender = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === req.from.toLowerCase()) || {
            username: req.from,
            avatar: '👤',
            color: '#FF4500'
        };

        const item = document.createElement('div');
        item.className = 'av-friend-request-card is-incoming';
        
        const avatarHtml = sender.avatar && (sender.avatar.startsWith('data:') || sender.avatar.startsWith('http'))
            ? `<img src="${escapeHtml(sender.avatar)}" class="w-full h-full object-cover" alt="">`
            : `<span>${sender.avatar || '👤'}</span>`;

        item.innerHTML = `
            <div class="av-friend-card-main">
                <div class="av-friend-avatar-wrap">
                    ${avatarHtml}
                    <span class="av-request-alert-dot"></span>
                </div>
                <div class="av-friend-info">
                    <span class="av-friend-name">${escapeHtml(sender.username)}</span>
                    <span class="av-friend-request-tag">Deseja se conectar com você</span>
                </div>
            </div>
            <div class="av-request-buttons">
                <button type="button" class="btn-accept av-btn-icon-green" title="Aceitar Solicitação">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                </button>
                <button type="button" class="btn-decline av-btn-icon-muted" title="Recusar Solicitação">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
            </div>
        `;

        item.querySelector('.btn-accept').addEventListener('click', async () => {
            const res = await state.respondFriendRequest(sender.username, 'accept');
            if (res.error) {
                alert(res.error);
            } else {
                showWelcomeToast(`Agora você e ${sender.username} são amigos!`);
                state.save();
                renderCentralDeAmigos();
            }
        });

        item.querySelector('.btn-decline').addEventListener('click', async () => {
            const res = await state.respondFriendRequest(sender.username, 'decline');
            if (res.error) {
                alert(res.error);
            } else {
                state.save();
                renderCentralDeAmigos();
            }
        });

        container.appendChild(item);
    });
}

function renderSentRequests() {
    const section = document.getElementById('sent-requests-section');
    const container = document.getElementById('sent-requests-list');
    const badge = document.getElementById('sent-requests-count-badge');
    if (!section || !container) return;

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) {
        section.classList.add('hidden');
        return;
    }

    const sent = registeredUsers
        .filter(user => user && user.username && Array.isArray(user.friendRequests))
        .filter(user => user.friendRequests.some(req => req && req.from && req.from.toLowerCase() === loggedInUsername.toLowerCase()));

    if (sent.length === 0) {
        section.classList.add('hidden');
        container.innerHTML = '';
        if (badge) badge.textContent = '0';
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';
    if (badge) badge.textContent = String(sent.length);

    sent.forEach(target => {
        const item = document.createElement('div');
        item.className = 'av-friend-request-card is-outgoing';
        const avatarHtml = target.avatar && (target.avatar.startsWith('data:') || target.avatar.startsWith('http'))
            ? `<img src="${escapeHtml(target.avatar)}" class="w-full h-full object-cover" alt="">`
            : `<span>${target.avatar || '👤'}</span>`;
        item.innerHTML = `
            <div class="av-friend-card-main">
                <div class="av-friend-avatar-wrap">
                    ${avatarHtml}
                </div>
                <div class="av-friend-info">
                    <span class="av-friend-name">${escapeHtml(target.username)}</span>
                    <span class="av-friend-pending-tag">Aguardando resposta</span>
                </div>
            </div>
            <button type="button" class="btn-cancel-request av-btn-cancel-tag">
                Cancelar
            </button>
        `;
        item.querySelector('.btn-cancel-request').addEventListener('click', async () => {
            const res = await state.cancelFriendRequest(target.username);
            if (res.error) {
                alert(res.error);
                return;
            }
            state.save();
            renderCentralDeAmigos();
        });
        container.appendChild(item);
    });
}

function renderModalFriendsList() {
    const container = document.getElementById('modal-friends-list');
    if (!container) return;

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) {
        container.innerHTML = `<p class="text-gray-500 italic text-[11px] py-4 text-center w-full">Faça login para ver seus amigos.</p>`;
        return;
    }

    const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
    if (!curUser || !curUser.friends || curUser.friends.length === 0) {
        container.innerHTML = `
            <div class="av-friends-empty">
                <div class="av-friends-empty-glow" aria-hidden="true"></div>
                <div class="av-friends-empty-emblem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <h4 class="av-friends-empty-title">Nenhum amigo adicionado ainda</h4>
                <p class="av-friends-empty-sub">Conecte-se com outros críticos para comparar pontuações, ver resenhas nos animes e acompanhar as maratonas do grupo.</p>
                <button type="button" id="empty-search-focus-btn" class="av-friends-empty-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <span>Buscar membros no coletivo</span>
                </button>
            </div>
        `;
        const focusBtn = container.querySelector('#empty-search-focus-btn');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('form-friend-search');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
        return;
    }

    container.innerHTML = '';

    curUser.friends.forEach(fUsername => {
        const friend = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === fUsername.toLowerCase());
        if (!friend) return;

        const item = document.createElement('div');
        const isFriendAdmin = friend.username && friend.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
        const adminBadge = getUserBadgesHtml(friend);
        item.className = `av-friend-card ${isFriendAdmin ? 'is-admin' : ''}`;
        
        const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
            ? `<img src="${escapeHtml(friend.avatar)}" class="w-full h-full object-cover" alt="">`
            : `<span>${friend.avatar || '👤'}</span>`;

        item.innerHTML = `
            <div class="av-friend-card-main">
                <div class="av-friend-avatar-wrap">
                    ${avatarHtml}
                    <span class="av-friend-online-dot"></span>
                </div>
                <div class="av-friend-info">
                    <div class="av-friend-name-row">
                        <span class="av-friend-name">${escapeHtml(friend.username)}</span>
                        ${adminBadge}
                    </div>
                    <span class="av-friend-sub">${escapeHtml(friend.email || 'Membro do Coletivo')}</span>
                </div>
            </div>
            <div class="av-friend-actions">
                <button type="button" class="av-friend-view-profile-btn" title="Ver perfil de ${escapeHtml(friend.username)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Perfil</span>
                </button>
                <button type="button" class="btn-remove av-friend-remove-btn" title="Desfazer Amizade">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    <span>Remover</span>
                </button>
            </div>
        `;

        const viewProfileBtn = item.querySelector('.av-friend-view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', () => {
                if (window.closeAddFriendModal) window.closeAddFriendModal();
                const playerModal = document.getElementById('player-profile-modal');
                if (playerModal) {
                    playerModal.classList.remove('hidden');
                    playerModal.classList.add('flex');
                    renderPlayerProfileModal(friend.username);
                }
            });
        }

        item.querySelector('.btn-remove').addEventListener('click', async () => {
            if (confirm(`Deseja desfazer a amizade com ${friend.username}?`)) {
                const res = await state.removeFriend(friend.username);
                if (res.error) {
                    alert(res.error);
                } else {
                    state.save();
                    renderCentralDeAmigos();
                }
            }
        });

        container.appendChild(item);
    });
}

function renderSentRequests() {
    const section = document.getElementById('sent-requests-section');
    const container = document.getElementById('sent-requests-list');
    if (!section || !container) return;

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) {
        section.classList.add('hidden');
        return;
    }

    const sent = registeredUsers
        .filter(user => user && user.username && Array.isArray(user.friendRequests))
        .filter(user => user.friendRequests.some(req => req && req.from && req.from.toLowerCase() === loggedInUsername.toLowerCase()));

    if (sent.length === 0) {
        section.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';

    sent.forEach(target => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 bg-amber-500/[0.06] border border-amber-400/15 rounded-2xl gap-3 animate-[fadeIn_0.2s_ease-out]';
        const avatarHtml = target.avatar && (target.avatar.startsWith('data:') || target.avatar.startsWith('http'))
            ? `<img src="${target.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
            : `<span class="text-xl shrink-0">${target.avatar || '&#128100;'}</span>`;
        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-grow">
                ${avatarHtml}
                <div class="min-w-0">
                    <p class="font-bold text-white text-[11.5px] truncate leading-tight">${escapeHtml(target.username)}</p>
                    <p class="text-[9px] text-amber-300/80 font-mono font-semibold">Aguardando resposta</p>
                </div>
            </div>
            <button type="button" class="btn-cancel-request px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-xl text-[9px] font-mono uppercase tracking-wider font-semibold transition-colors shrink-0">
                Cancelar
            </button>
        `;
        item.querySelector('.btn-cancel-request').addEventListener('click', async () => {
            const res = await state.cancelFriendRequest(target.username);
            if (res.error) {
                alert(res.error);
                return;
            }
            state.save();
            renderCentralDeAmigos();
        });
        container.appendChild(item);
    });
}

function renderModalFriendsList() {
    const container = document.getElementById('modal-friends-list');
    if (!container) return;

    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (err) {}

    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (!loggedInUsername) {
        container.innerHTML = `<p class="text-gray-500 italic text-[11px] py-2 text-center w-full">Faça login para ver seus amigos.</p>`;
        return;
    }

    const curUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
    if (!curUser || !curUser.friends || curUser.friends.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic text-[11px] py-4 text-center w-full">Nenhum amigo adicionado ainda. Procure por outros usuários acima!</p>`;
        return;
    }

    container.innerHTML = '';

    curUser.friends.forEach(fUsername => {
        const friend = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === fUsername.toLowerCase());
        if (!friend) return;

        const item = document.createElement('div');
        const isFriendAdmin = friend.username && friend.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
        const adminBadge = getUserBadgesHtml(friend);
        item.className = `flex items-center justify-between p-2.5 rounded-2xl gap-3 animate-[fadeIn_0.2s_ease-out] ${isFriendAdmin ? 'bg-brand/[0.03] border border-brand/35 shadow-[0_0_12px_rgba(255,69,0,0.08)]' : 'bg-white/5 border border-white/10'}`;
        
        const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
            ? `<img src="${friend.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
            : `<span class="text-xl shrink-0">${friend.avatar || '👤'}</span>`;

        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-grow">
                ${avatarHtml}
                <div class="min-w-0">
                    <p class="font-bold text-white text-[11.5px] truncate leading-tight">${friend.username}</p>
                    <p class="text-[9px] text-gray-500 font-mono truncate">${friend.email || ''}</p>
                </div>
            </div>
            <button type="button" class="btn-remove px-2.5 py-1.5 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl text-[9px] font-mono uppercase tracking-wider font-semibold transition-colors shrink-0" title="Desfazer Amizade">
                Remover
            </button>
        `;

        item.querySelector('.btn-remove').addEventListener('click', async () => {
            if (confirm(`Deseja desfazer a amizade com ${friend.username}?`)) {
                const res = await state.removeFriend(friend.username);
                if (res.error) {
                    alert(res.error);
                } else {
                    state.save();
                    renderCentralDeAmigos();
                }
            }
        });

        container.appendChild(item);
    });
}

// ──────────────────────────────────────────────────────────────────────────
// REAL-TIME TOAST SYSTEM
// ──────────────────────────────────────────────────────────────────────────
function showToast(title, message, avatarOrEmoji = '🔔', colorTheme = '#FF4500') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)] pointer-events-none';
        document.body.appendChild(container);
    }

    const card = document.createElement('div');
    card.className = 'toast-card w-full rounded-2xl p-4 flex gap-3 relative overflow-hidden select-none';
    
    const avatarHtml = avatarOrEmoji && (avatarOrEmoji.startsWith('data:') || avatarOrEmoji.startsWith('http'))
        ? `<img src="${avatarOrEmoji}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
        : `<div class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">${avatarOrEmoji || '👤'}</div>`;

    // Process markdown-like bold inside the message
    const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    card.innerHTML = `
        ${avatarHtml}
        <div class="flex-grow min-w-0 pr-2">
            <h4 class="text-[11px] font-bold font-mono tracking-wide uppercase" style="color: ${colorTheme}">${title}</h4>
            <p class="text-[10px] text-gray-300 font-light mt-0.5 leading-snug">${formattedMessage}</p>
        </div>
        <button class="toast-close-btn absolute top-3 right-3 text-gray-500 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center">
            <iconify-icon icon="lucide:x" class="text-[10px]"></iconify-icon>
        </button>
        <div class="absolute bottom-0 left-0 h-[2px] toast-progress-bar" style="background-color: ${colorTheme}"></div>
    `;

    container.appendChild(card);
    
    // Animate display
    setTimeout(() => {
        card.classList.add('show');
    }, 10);

    const closeBtn = card.querySelector('.toast-close-btn');
    const dismiss = () => {
        card.classList.remove('show');
        card.classList.add('hide');
        setTimeout(() => {
            card.remove();
        }, 400);
    };

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
    });

    // Auto dismiss after 4 seconds
    setTimeout(dismiss, 4000);
}

// ──────────────────────────────────────────────────────────────────────────
// GROUP ACTIVITIES FEED
// ──────────────────────────────────────────────────────────────────────────
function getActivityMeta(activity) {
    const type = String(activity?.type || '').toLowerCase();
    const details = String(activity?.details || '').toLowerCase();

    if (type === 'rating' || details.includes('avaliou')) return { icon: 'lucide:star', emoji: '&#11088;', label: 'Nota', color: '#facc15' };
    if (type === 'progress' || details.includes('episodio') || details.includes('epis\u00f3dio')) return { icon: 'lucide:play-circle', emoji: '&#9654;', label: 'Epis\u00f3dio', color: '#38bdf8' };
    if (type === 'comment_add' || details.includes('critica') || details.includes('cr\u00edtica')) return { icon: 'lucide:message-circle', emoji: '&#128172;', label: 'Cr\u00edtica', color: '#c084fc' };
    if (type === 'comment_edit') return { icon: 'lucide:pencil', emoji: '&#9999;', label: 'Editou', color: '#fb923c' };
    if (type === 'comment_delete') return { icon: 'lucide:trash-2', emoji: '&#128465;', label: 'Removeu', color: '#f87171' };
    if (type === 'reply_add' || details.includes('respondeu')) return { icon: 'lucide:reply', emoji: '&#8617;', label: 'Resposta', color: '#a78bfa' };
    if (details.includes('concluiu')) return { icon: 'lucide:trophy', emoji: '&#127942;', label: 'Concluiu', color: '#22c55e' };
    if (details.includes('lista')) return { icon: 'lucide:bookmark-plus', emoji: '&#128278;', label: 'Lista', color: '#fb7185' };
    if (details.includes('espera')) return { icon: 'lucide:pause-circle', emoji: '&#9208;', label: 'Espera', color: '#f59e0b' };
    if (details.includes('abandonou')) return { icon: 'lucide:x-circle', emoji: '&#10060;', label: 'Dropou', color: '#ef4444' };
    if (type.startsWith('catalog') || details.includes('catalogo') || details.includes('cat\u00e1logo')) return { icon: 'lucide:sparkles', emoji: '&#10024;', label: 'Cat\u00e1logo', color: '#2dd4bf' };
    return { icon: 'lucide:zap', emoji: '&#9889;', label: 'A\u00e7\u00e3o', color: '#22d3ee' };
}

function renderActivitiesFeed() {
    if (state.activeDetailAnimeId || state.filterMALStatus === 'Studios') return;
    const list = document.getElementById('activities-feed-list');
    if (!list) return;

    const normalizeActivityUser = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const visibleUserIds = new Set((state.friends || []).map(friend => friend && friend.id).filter(Boolean));
    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (loggedInUsername) visibleUserIds.add(normalizeActivityUser(loggedInUsername));

    const seen = new Set();
    const allActivities = (state.activities || []).filter(act => {
        if (!act.username) return false;
        const key = act.id || `${act.username}|${act.type}|${act.animeId}|${act.details}|${act.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const filteredActivities = allActivities.filter(act => visibleUserIds.has(normalizeActivityUser(act.username)));

    const activities = (filteredActivities.length ? filteredActivities : allActivities).slice(0, 6);
    if (activities.length === 0) {
        list.innerHTML = `
            <div class="activity-card-3d py-8 text-center text-gray-500 font-light text-[10px] italic col-span-full rounded-3xl border border-white/5 bg-white/[0.02]">
                <div class="activity-icon-disc mx-auto mb-3" style="--activity-color:#22d3ee">
                    <span class="activity-emoji">&#9889;</span>
                </div>
                Nenhuma atividade recente registrada.
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    activities.forEach(act => {
        const item = document.createElement('div');
        const isAdminAct = act.username && act.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
        const activityMeta = getActivityMeta(act);
        item.className = `activity-card-3d tilt-card relative flex gap-3.5 p-4 rounded-2xl text-[11px] transition-all duration-300 animate-[fadeIn_0.3s_ease-out] ${isAdminAct ? 'bg-brand/[0.03] border border-brand/35 hover:bg-brand/[0.06] shadow-[0_0_12px_rgba(255,69,0,0.08)]' : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'}`;
        item.style.setProperty('--activity-color', activityMeta.color);
        item.style.boxShadow = `${isAdminAct ? '0 0 12px rgba(255,69,0,0.08), ' : ''}inset 3px 0 0 ${activityMeta.color}`;
        
        // Resolve user's actual avatar from cache (registeredUsers) if stripped
        let userAvatar = act.userAvatar;
        if (!userAvatar || userAvatar === '👤' || (userAvatar.startsWith('data:') && userAvatar.length > 2000)) {
            let registeredUsers = [];
            try {
                registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
            } catch (e) {}
            const foundUser = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === (act.username || '').toLowerCase());
            if (foundUser && foundUser.avatar) {
                userAvatar = foundUser.avatar;
            }
        }

        const avatarHtml = userAvatar && (userAvatar.startsWith('data:') || userAvatar.startsWith('http'))
            ? `<img src="${escapeHtml(userAvatar)}" class="w-5 h-5 rounded-full object-cover border border-black/70" alt="">`
            : `<div class="w-5 h-5 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-[10px]">${userAvatar || '&#128100;'}</div>`;

        const activityVisualHtml = `
            <div class="relative shrink-0 mt-0.5">
                <div class="activity-icon-disc">
                    <span class="activity-emoji">${activityMeta.emoji}</span>
                </div>
                <div class="absolute -bottom-1 -right-1 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.65)]">
                    ${avatarHtml}
                </div>
            </div>
        `;

        let timeText = '';
        try {
            const date = new Date(act.timestamp);
            const diff = Date.now() - date.getTime();
            if (diff < 60000) {
                timeText = 'agora';
            } else if (diff < 3600000) {
                timeText = `${Math.floor(diff / 60000)}m atrás`;
            } else if (diff < 86400000) {
                timeText = `${Math.floor(diff / 3600000)}h atrás`;
            } else {
                timeText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }
        } catch (e) {
            timeText = '';
        }

        const adminBadgeHtml = getUserBadgesHtml({ username: act.username });
        const activityPillHtml = `
            <span class="activity-pill inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest mr-1.5 align-middle"
                style="color: ${activityMeta.color}; border-color: ${activityMeta.color}55; background: ${activityMeta.color}16; box-shadow: 0 0 12px ${activityMeta.color}22">
                <iconify-icon icon="${activityMeta.icon}" class="text-[11px]"></iconify-icon>
                <span>${activityMeta.label}</span>
            </span>
        `;

        item.innerHTML = `
            ${activityVisualHtml}
            <div class="activity-copy flex-grow min-w-0">
                <div class="flex justify-between items-baseline gap-1.5">
                    <span class="font-bold truncate" style="color: ${getUserDisplayNameColor(act.username, act.userColor)}">${escapeHtml(act.username)}${adminBadgeHtml}</span>
                    <span class="text-[8px] text-gray-500 font-mono shrink-0">${timeText}</span>
                </div>
                <p class="text-gray-400 font-light mt-0.5 leading-relaxed">
                    ${activityPillHtml}
                    <span>${escapeHtml(act.details)}</span> em
                    <a href="#anime-grid-section" class="font-mono text-white/90 hover:text-brand font-semibold select-anime-trigger border-b border-dashed border-white/20 hover:border-brand/40 transition-colors" data-id="${escapeHtml(act.animeId)}">
                        ${escapeHtml(act.animeTitle)}
                    </a>
                </p>
            </div>
        `;

        // Click on anime name inside activity triggers details view
        const trigger = item.querySelector('.select-anime-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (act.animeId) openAnimeDetail(act.animeId);
            });
        }

        list.appendChild(item);
    });
    markViewEntered(list);
}

function renderActivityHistoryModal() {
    const list = document.getElementById('activity-history-list');
    if (!list) return;
    const activities = [...(state.activities || [])]
        .filter(activity => activity && activity.username && activity.animeId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 80);
    if (!activities.length) {
        list.innerHTML = `<div class="col-span-full rounded-3xl border border-white/5 bg-white/[0.025] p-8 text-center text-[11px] text-gray-500 italic">Nenhuma atividade registrada ainda.</div>`;
        return;
    }
    list.innerHTML = activities.map(activity => {
        const meta = getActivityMeta(activity);
        let timeText = '';
        try {
            const date = new Date(activity.timestamp);
            timeText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (err) {}
        return `
            <button class="activity-history-row text-left rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.055] p-4 flex gap-3 transition-colors" data-anime-id="${escapeHtml(activity.animeId || '')}">
                <div class="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0" style="color:${meta.color}; box-shadow:0 0 18px ${meta.color}22">
                    <span class="text-lg">${meta.emoji}</span>
                </div>
                <div class="min-w-0 flex-grow">
                    <div class="flex items-center justify-between gap-3">
                        <b class="text-[11px] font-mono truncate" style="color:${getUserDisplayNameColor(activity.username, activity.userColor)}">${escapeHtml(activity.username)}</b>
                        <span class="text-[9px] text-gray-500 font-mono shrink-0">${escapeHtml(timeText)}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        <span class="font-bold" style="color:${meta.color}">${escapeHtml(meta.label)}</span>
                        ${escapeHtml(activity.details || 'interagiu')} em
                        <span class="text-white/85 font-semibold">${escapeHtml(activity.animeTitle || 'Anime')}</span>
                    </p>
                </div>
            </button>
        `;
    }).join('');
    list.querySelectorAll('[data-anime-id]').forEach(row => {
        row.addEventListener('click', () => {
            const modal = document.getElementById('activity-history-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            if (row.dataset.animeId) openAnimeDetail(row.dataset.animeId);
        });
    });
}

async function loadAdminOverview() {
    if (!isCurrentUserAdmin()) {
        throw new Error('Você não está identificado como administrador no painel local.');
    }
    const response = await fetchAdminEndpointWithRetry('/api/admin/overview', {
        method: 'GET',
        headers: authHeaders(),
        cache: 'no-store'
    });
    if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;
        try {
            const errData = await response.json();
            if (errData && errData.error) {
                errorMsg = errData.error;
            }
        } catch (e) {}
        throw new Error(errorMsg);
    }
    return response.json();
}

async function fetchAdminEndpointWithRetry(path, options, attempts = 2) {
    let response = null;
    for (let attempt = 0; attempt < attempts; attempt++) {
        response = await fetch(API_BASE_URL + path, options);
        if (response.status !== 503 || attempt === attempts - 1) return response;
        await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
    }
    return response;
}

async function loadAdminBackups(create = false) {
    const response = await fetchAdminEndpointWithRetry('/api/admin/backups', {
        method: create ? 'POST' : 'GET',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store'
    });
    if (!response.ok) throw new Error('admin_backups_failed');
    return response.json();
}

function renderAdminMetric(label, value, icon) {
    return `
        <div class="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <div class="flex items-center justify-between gap-3 text-white/45">
                <span class="text-[9px] font-mono uppercase tracking-widest">${escapeHtml(label)}</span>
                <iconify-icon icon="${icon}" class="text-brand text-sm"></iconify-icon>
            </div>
            <b class="block text-2xl font-serif text-white mt-3">${escapeHtml(value)}</b>
        </div>
    `;
}

async function renderAdminCenter() {
    const overviewEl = document.getElementById('admin-overview');
    const usersEl = document.getElementById('admin-users-list');
    const backupsEl = document.getElementById('admin-backups-list');
    if (!overviewEl || !usersEl || !backupsEl) return;
    overviewEl.innerHTML = `<div class="col-span-full text-[11px] text-gray-500 font-mono">Carregando painel...</div>`;
    usersEl.innerHTML = '';
    backupsEl.innerHTML = '';
    try {
        const data = await loadAdminOverview();
        if (!data) {
            overviewEl.innerHTML = `<div class="col-span-full rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[11px] text-red-300 font-mono">Erro: Você não é administrador.</div>`;
            return;
        }
        const overview = data.overview || {};
        overviewEl.innerHTML = [
            renderAdminMetric('Usuarios', overview.users || 0, 'lucide:users'),
            renderAdminMetric('Animes', overview.animes || 0, 'lucide:clapperboard'),
            renderAdminMetric('Notas', overview.ratings || 0, 'lucide:star'),
            renderAdminMetric('Backups', overview.backups || 0, 'lucide:database-backup')
        ].join('');

        usersEl.innerHTML = (data.users || []).map(user => {
            const userId = normalizeProfileId(user.username);
            const isMe = userId === getLoggedInProfileId();
            const avatar = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))
                ? `<img src="${escapeHtml(user.avatar)}" class="w-8 h-8 rounded-full object-cover" alt="">`
                : `<span class="text-xl">${escapeHtml(user.avatar || '&#128100;')}</span>`;
            return `
                <div class="rounded-2xl border border-white/8 bg-white/[0.03] p-3 flex items-center gap-3">
                    ${avatar}
                    <div class="min-w-0 flex-grow">
                        <p class="text-xs font-mono font-bold text-white truncate">${escapeHtml(user.username)}</p>
                        <p class="text-[9px] text-gray-500 font-mono truncate">${escapeHtml(user.email || 'email privado')} &middot; ${user.friends?.length || 0} amigos</p>
                    </div>
                    <button class="admin-delete-user px-3 py-2 rounded-xl border border-red-500/25 text-red-300 hover:bg-red-500/10 text-[9px] font-mono uppercase tracking-widest ${isMe ? 'opacity-30 pointer-events-none' : ''}" data-username="${escapeHtml(user.username)}">Remover</button>
                </div>
            `;
        }).join('') || `<p class="text-[11px] text-gray-500 italic">Sem usuarios.</p>`;

        usersEl.querySelectorAll('.admin-delete-user').forEach(button => {
            button.addEventListener('click', async () => {
                const username = button.dataset.username;
                if (!username || !confirm(`Remover ${username} e limpar dados ligados a essa conta?`)) return;
                const response = await fetch(API_BASE_URL + '/api/admin/delete-user', {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ username })
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || !payload.success) {
                    alert(payload.error || 'Nao foi possivel remover usuario.');
                    return;
                }
                if (payload.state) applyServerStateSnapshot(payload.state);
                await state.syncWithServer();
                renderAdminCenter();
            });
        });

        const backupData = await loadAdminBackups(false);
        renderAdminBackups(backupData.backups || []);
    } catch (err) {
        console.error("Failed to render admin center:", err);
        overviewEl.innerHTML = `<div class="col-span-full rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-[11px] text-red-300 font-mono">Não foi possível carregar o painel admin: ${escapeHtml(err.message)}</div>`;
    }
}

function renderAdminBackups(backups) {
    const backupsEl = document.getElementById('admin-backups-list');
    if (!backupsEl) return;
    if (!Array.isArray(backups) || backups.length === 0) {
        backupsEl.innerHTML = `<p class="text-[11px] text-gray-500 italic">Nenhum snapshot ainda.</p>`;
        return;
    }
    backupsEl.innerHTML = backups.map(backup => {
        const kb = Math.max(1, Math.round((Number(backup.bytes) || 0) / 1024));
        return `
            <div class="rounded-2xl border border-white/8 bg-white/[0.03] p-3 flex items-center gap-3">
                <iconify-icon icon="lucide:database-backup" class="text-brand text-lg"></iconify-icon>
                <div class="min-w-0 flex-grow">
                    <p class="text-xs font-mono font-bold text-white truncate">#${escapeHtml(backup.id)} &middot; ${escapeHtml(backup.reason || 'backup')}</p>
                    <p class="text-[9px] text-gray-500 font-mono truncate">${escapeHtml(backup.createdAt || '')} &middot; ${kb} KB</p>
                </div>
                <button class="admin-download-backup px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest" data-id="${escapeHtml(backup.id)}">Baixar</button>
            </div>
        `;
    }).join('');
    backupsEl.querySelectorAll('.admin-download-backup').forEach(button => {
        button.addEventListener('click', async () => {
            const response = await fetch(API_BASE_URL + `/api/admin/backups/${button.dataset.id}`, {
                method: 'GET',
                headers: authHeaders(),
                cache: 'no-store'
            });
            if (!response.ok) {
                alert('Nao foi possivel baixar este backup.');
                return;
            }
            const payload = await response.json();
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `anivoid-server-backup-${button.dataset.id}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    });
}

// ──────────────────────────────────────────────────────────────────────────
// GROUP STATISTICS & RECOMMENDATIONS
// ──────────────────────────────────────────────────────────────────────────
function renderGroupStats() {
    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
    } catch (e) {}

    // Identify allowed user IDs for the group (logged-in user + their friends)
    const groupUserIds = new Set();
    if (state.loggedInUser) {
        groupUserIds.add(state.loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    if (state.friends && Array.isArray(state.friends)) {
        state.friends.forEach(f => {
            if (f.id) groupUserIds.add(f.id.toLowerCase().replace(/[^a-z0-9]/g, ''));
        });
    }

    if (state.loggedInUser) {
        registeredUsers = registeredUsers.filter(u => {
            const uId = u && u.username ? u.username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
            return groupUserIds.has(uId);
        });
    }

    if (registeredUsers.length === 0) return;

    // 1. Calculate stats per user
    const userStats = registeredUsers.map(user => {
        const userId = user && user.username ? user.username.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        let totalEpisodes = 0;
        let ratingSum = 0;
        let ratingCount = 0;
        let commentsCount = 0;

        state.animes.forEach(anime => {
            const rating = anime.ratings?.[userId];
            if (rating) {
                totalEpisodes += parseInt(rating.episodesWatched) || 0;
                const score = parseFloat(rating.overall);
                if (!isNaN(score) && rating.overall !== '-') {
                    ratingSum += score;
                    ratingCount++;
                }
            }
            if (anime.comments) {
                anime.comments.forEach(c => {
                    if (c.friendId && c.friendId.toLowerCase() === userId) {
                        commentsCount++;
                    }
                });
            }
        });

        const avgScore = ratingCount > 0 ? (ratingSum / ratingCount) : 0;

        return {
            username: user.username,
            avatar: user.avatar,
            color: user.color,
            totalEpisodes,
            avgScore,
            ratingCount,
            commentsCount
        };
    });

    // 2. Determine Achievements / Awards
    // A: Maratonista (Highest episodes)
    const maratonista = [...userStats].sort((a, b) => b.totalEpisodes - a.totalEpisodes)[0];
    const statMarName = document.getElementById('stat-maratonista-name');
    const statMarVal = document.getElementById('stat-maratonista-val');
    if (maratonista && maratonista.totalEpisodes > 0) {
        if (statMarName) {
            statMarName.innerText = maratonista.username;
            statMarName.style.color = '#ffffff';
        }
        if (statMarVal) statMarVal.innerText = `${maratonista.totalEpisodes} eps assistidos`;
    } else {
        if (statMarName) statMarName.innerText = 'Sem dados';
        if (statMarVal) statMarVal.innerText = '0 eps';
    }

    // B: Crítico Rigoroso (Lowest average rating)
    const ratedUsers = userStats.filter(u => u.ratingCount > 0);
    const rigoroso = [...ratedUsers].sort((a, b) => a.avgScore - b.avgScore)[0];
    const statRigName = document.getElementById('stat-rigoroso-name');
    const statRigVal = document.getElementById('stat-rigoroso-val');
    if (rigoroso) {
        if (statRigName) {
            statRigName.innerText = rigoroso.username;
            statRigName.style.color = '#ffffff';
        }
        if (statRigVal) statRigVal.innerText = `Média: ${rigoroso.avgScore.toFixed(1)} ⭐`;
    } else {
        if (statRigName) statRigName.innerText = 'Sem dados';
        if (statRigVal) statRigVal.innerText = 'Média -';
    }

    // C: Mais Empolgado (Highest average rating)
    const empolgado = [...ratedUsers].sort((a, b) => b.avgScore - a.avgScore)[0];
    const statEmpName = document.getElementById('stat-empolgado-name');
    const statEmpVal = document.getElementById('stat-empolgado-val');
    if (empolgado) {
        if (statEmpName) {
            statEmpName.innerText = empolgado.username;
            statEmpName.style.color = '#ffffff';
        }
        if (statEmpVal) statEmpVal.innerText = `Média: ${empolgado.avgScore.toFixed(1)} ⭐`;
    } else {
        if (statEmpName) statEmpName.innerText = 'Sem dados';
        if (statEmpVal) statEmpVal.innerText = 'Média -';
    }

    // D: Líder de Reviews (Highest comments count)
    const escritor = [...userStats].sort((a, b) => b.commentsCount - a.commentsCount)[0];
    const statEscName = document.getElementById('stat-escritor-name');
    const statEscVal = document.getElementById('stat-escritor-val');
    if (escritor && escritor.commentsCount > 0) {
        if (statEscName) {
            statEscName.innerText = escritor.username;
            statEscName.style.color = '#ffffff';
        }
        if (statEscVal) statEscVal.innerText = `${escritor.commentsCount} reviews escritas`;
    } else {
        if (statEscName) statEscName.innerText = 'Sem dados';
        if (statEscVal) statEscVal.innerText = '0 reviews';
    }

    // 3. Render Rankings List (Editorial Leaderboard)
    const rankingContainer = document.getElementById('stats-ranking-container');
    if (rankingContainer) {
        rankingContainer.innerHTML = '';
        const sortedRanking = [...userStats].sort((a, b) => b.avgScore - a.avgScore);
        sortedRanking.forEach((u, i) => {
            const row = document.createElement('div');
            row.className = 'av-stats-rank-item';
            
            const avatarHtml = u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http'))
                ? `<img src="${u.avatar}" class="av-stats-rank-avatar" alt="">`
                : `<span class="av-stats-rank-avatar-fallback">${u.avatar || '👤'}</span>`;
                
            const pct = Math.min(100, Math.max(0, u.avgScore * 10)); // Out of 100 for width

            const adminBadgeHtml = getUserBadgesHtml({ username: u.username });
            const rankFormatted = String(i + 1).padStart(2, '0');
            const scoreFormatted = u.avgScore > 0 ? u.avgScore.toFixed(1) : '-';
            
            row.innerHTML = `
                <div class="av-stats-rank-header">
                    <div class="av-stats-rank-user">
                        <span class="av-stats-rank-num">${rankFormatted}</span>
                        ${avatarHtml}
                        <span class="av-stats-rank-name" style="color: ${getUserDisplayNameColor(u.username, u.color)}">${escapeHtml(u.username)}</span>
                        ${adminBadgeHtml}
                    </div>
                    <div class="av-stats-rank-score">
                        <b>${scoreFormatted}</b><span>/ 10</span>
                    </div>
                </div>
                <div class="av-stats-progress-track">
                    <div class="av-stats-progress-fill" style="width: ${pct}%; background: ${u.color || 'var(--av-accent)'};"></div>
                </div>
            `;
            rankingContainer.appendChild(row);
        });
    }

    // 4. Render Genres Distribution (Architectural Gauges)
    const genresContainer = document.getElementById('stats-genres-container');
    if (genresContainer) {
        genresContainer.innerHTML = '';
        const genreCounts = {};
        
        state.animes.forEach(anime => {
            let activeGroupCount = 0;
            if (anime.ratings) {
                Object.entries(anime.ratings).forEach(([friendId, r]) => {
                    if (groupUserIds.has(friendId)) {
                        if (r.status === 'Watching' || r.status === 'Completed') {
                            activeGroupCount++;
                        }
                    }
                });
            }
            if (activeGroupCount > 0 && anime.genres && Array.isArray(anime.genres)) {
                anime.genres.forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + activeGroupCount;
                });
            }
        });

        const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxCount = sortedGenres[0]?.[1] || 1;

        if (sortedGenres.length === 0) {
            genresContainer.innerHTML = `<p class="av-stats-empty">Nenhum anime avaliado no grupo ainda.</p>`;
        } else {
            sortedGenres.forEach(([genre, count], idx) => {
                const row = document.createElement('div');
                row.className = 'av-stats-genre-item';
                const pct = (count / maxCount) * 100;
                const indexFormatted = String(idx + 1).padStart(2, '0');

                row.innerHTML = `
                    <div class="av-stats-genre-header">
                        <div class="av-stats-genre-info">
                            <span class="av-stats-genre-index">${indexFormatted}</span>
                            <span class="av-stats-genre-name">${escapeHtml(genre)}</span>
                        </div>
                        <span class="av-stats-genre-count">${count} <small>obras</small></span>
                    </div>
                    <div class="av-stats-progress-track">
                        <div class="av-stats-progress-fill av-stats-genre-fill" style="width: ${pct}%;"></div>
                    </div>
                `;
                genresContainer.appendChild(row);
            });
        }
    }

    // 5. Group Recommendations Algorithm
    // A: Consenso do Grupo
    const consensusAnimes = [];
    state.animes.forEach(anime => {
        const scores = [];
        if (anime.ratings) {
            Object.entries(anime.ratings).forEach(([friendId, r]) => {
                if (groupUserIds.has(friendId)) {
                    const score = parseFloat(r.overall);
                    if (!isNaN(score) && r.overall !== '-') {
                        scores.push(score);
                    }
                }
            });
        }
        if (scores.length >= 2) {
            const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
            consensusAnimes.push({ anime, avg });
        }
    });

    const bestConsensus = consensusAnimes.sort((a, b) => b.avg - a.avg)[0];
    const recConsTitle = document.getElementById('rec-consenso-title');
    const recConsVal = document.getElementById('rec-consenso-val');
    const consensusCard = document.getElementById('rec-consenso-card');
    if (bestConsensus) {
        if (recConsTitle) recConsTitle.innerText = bestConsensus.anime.title;
        if (recConsVal) recConsVal.innerText = `${bestConsensus.avg.toFixed(1)} / 10`;
        if (consensusCard) {
            consensusCard.classList.add('is-clickable');
            consensusCard.onclick = () => {
                const statsModal = document.getElementById('group-stats-modal');
                if (statsModal) {
                    statsModal.classList.add('hidden');
                    statsModal.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                }
                openAnimeDetail(bestConsensus.anime.id);
            };
        }
    } else {
        if (recConsTitle) recConsTitle.innerText = 'Sem consenso ainda';
        if (recConsVal) recConsVal.innerText = '- / 10';
        if (consensusCard) {
            consensusCard.classList.remove('is-clickable');
            consensusCard.onclick = null;
        }
    }

    // B: Recomendado para Você (Personalized)
    const recList = document.getElementById('rec-personalized-list');
    if (recList) {
        recList.innerHTML = '';
        const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
        const loggedInId = loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const recommendations = [];
        
        state.animes.forEach(anime => {
            const myRating = anime.ratings?.[loggedInId];
            const hasMyRating = myRating && myRating.overall !== '-' && myRating.overall !== undefined;
            const isCompleted = myRating && myRating.status === 'Completed';

            if (!hasMyRating && !isCompleted) {
                const scores = [];
                if (anime.ratings) {
                    Object.entries(anime.ratings).forEach(([friendId, r]) => {
                        const isFriend = friendId !== loggedInId && groupUserIds.has(friendId);
                        if (isFriend) {
                            const score = parseFloat(r.overall);
                            if (!isNaN(score) && r.overall !== '-') {
                                scores.push(score);
                            }
                        }
                    });
                }
                
                if (scores.length > 0) {
                    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                    if (avg >= 7.5) {
                        recommendations.push({ anime, avg });
                    }
                }
            }
        });

        const topRecs = recommendations.sort((a, b) => b.avg - a.avg).slice(0, 2);
        
        if (topRecs.length === 0) {
            recList.innerHTML = `<p class="av-stats-empty col-span-full">Nenhuma recomendação disponível. Seus amigos precisam avaliar mais obras para cruzamento de dados.</p>`;
        } else {
            topRecs.forEach(rec => {
                const card = document.createElement('div');
                card.className = 'av-stats-rec-card select-none';
                
                const coverSrc = rec.anime.coverUrl ? window.AnivoidUI.imageUrl(rec.anime.coverUrl) : '';
                const posterHtml = coverSrc
                    ? `<img src="${escapeHtml(coverSrc)}" class="av-stats-rec-poster" alt="${escapeHtml(rec.anime.title)}">`
                    : `<div class="av-stats-rec-poster-placeholder"><span>AV</span></div>`;

                card.innerHTML = `
                    ${posterHtml}
                    <div class="av-stats-rec-body">
                        <h5 class="av-stats-rec-title">${escapeHtml(rec.anime.title)}</h5>
                        <p class="av-stats-rec-meta">Média do grupo: <b class="av-stats-rec-score">${rec.avg.toFixed(1)}</b></p>
                    </div>
                    <span class="av-stats-rec-arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                    </span>
                `;

                card.addEventListener('click', () => {
                    const statsModal = document.getElementById('group-stats-modal');
                    if (statsModal) {
                        statsModal.classList.add('hidden');
                        statsModal.classList.remove('flex');
                        document.body.classList.remove('overflow-hidden');
                    }
                    openAnimeDetail(rec.anime.id);
                });

                recList.appendChild(card);
            });
        }
    }
}

// App execution trigger placed at the very end of the file so all let/const declarations are initialized
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
