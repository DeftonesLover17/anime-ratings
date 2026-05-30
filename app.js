// --- EMAILJS CONFIGURATION (OPTIONAL FOR REAL EMAILS) ---
// Se você quiser que o site envie e-mails reais de boas-vindas aos usuários,
// registre-se gratuitamente em https://www.emailjs.com/ e preencha as chaves abaixo:
const EMAILJS_CONFIG = {
    publicKey: '6qFuSGQ8aUf6zFsbY',    // Cole sua Public Key aqui (ex: 'user_xyz...')
    serviceId: 'service_c57m7os',    // Cole seu Service ID aqui (ex: 'service_abc...')
    templateId: 'template_w7b4c1j'    // Cole seu Template ID aqui (ex: 'template_123...')
};

const DEFAULT_AVATAR_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSI+PHBhdGggZD0iTTEyIDEyYTUgNSAwIDEgMCAwLTEwIDUgNSAwIDAgMCAwIDEwek0xMiAxNGMtMy43MyAwLTExIDEuODYtMTEgNS41VjIwSDIzdi0xYy0xLjEtMy42NC03LjI3LTUuNS0xMS01LjV6Ii8+PC9zdmc+';

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
const RENDER_API_BASE_URL = 'https://anime-ratings.onrender.com';
const API_BASE_URL = window.ANIVOID_API_BASE_URL
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? ''
        : (window.location.hostname === 'anime-ratings.onrender.com' ? RENDER_API_BASE_URL : ''));
const AUTH_TOKEN_KEY = 'anivoid_auth_token';

function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function setAuthSession(username, token) {
    if (username) localStorage.setItem('anivoid_logged_in_username', username);
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthSession() {
    localStorage.removeItem('anivoid_logged_in_username');
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(extraHeaders = {}) {
    const token = getAuthToken();
    return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : extraHeaders;
}

const USE_CLIENT_PASSWORD_PROOF = API_BASE_URL === ''
    && window.location.hostname !== 'localhost'
    && window.location.hostname !== '127.0.0.1'
    && window.crypto
    && window.crypto.subtle;

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
    }
    return btoa(binary);
}

function base64ToBytes(base64) {
    const binary = atob(String(base64 || ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function randomBase64(byteLength) {
    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
}

async function derivePasswordHashBytes(password, salt, iterations) {
    const key = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(String(password || '')),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await window.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: base64ToBytes(salt),
            iterations,
            hash: 'SHA-256'
        },
        key,
        256
    );
    return new Uint8Array(bits);
}

async function createPasswordCredential(password) {
    const passwordSalt = randomBase64(16);
    const passwordIterations = 310000;
    const passwordHash = bytesToBase64(await derivePasswordHashBytes(password, passwordSalt, passwordIterations));
    return {
        passwordHash,
        passwordSalt,
        passwordIterations,
        passwordDigest: 'pbkdf2-sha256'
    };
}

async function createPasswordProof(password, challenge) {
    const hashBytes = await derivePasswordHashBytes(
        password,
        challenge.passwordSalt,
        Number(challenge.passwordIterations) || 310000
    );
    const key = await window.crypto.subtle.importKey(
        'raw',
        hashBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(challenge.nonce));
    return bytesToBase64(new Uint8Array(signature));
}

async function submitLogin(email, password) {
    if (USE_CLIENT_PASSWORD_PROOF) {
        const challengeResp = await fetch(API_BASE_URL + '/api/login-challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const challenge = await challengeResp.json().catch(() => ({}));
        if (!challengeResp.ok || !challenge.nonce || !challenge.passwordSalt) {
            return challengeResp;
        }
        const passwordProof = await createPasswordProof(password, challenge);
        return fetch(API_BASE_URL + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, nonce: challenge.nonce, passwordProof })
        });
    }

    return fetch(API_BASE_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
}

async function buildRegisterPayload(userRecord, password) {
    if (USE_CLIENT_PASSWORD_PROOF) {
        return {
            ...userRecord,
            passwordCredential: await createPasswordCredential(password)
        };
    }
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
        ...safeUser
    } = user;
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
    let previousAnimes = [];
    try {
        previousAnimes = JSON.parse(localStorage.getItem('anivoid_list_v2')) || [];
    } catch (err) {}

    if (Array.isArray(serverState.registeredUsers)) {
        storeRegisteredUsers(serverState.registeredUsers);
    }
    if (Array.isArray(serverState.animes)) {
        const activeUserId = normalizeProfileId(localStorage.getItem('anivoid_logged_in_username'));
        const animesToStore = mergeLocalOwnRatings(serverState.animes, previousAnimes, activeUserId);
        localStorage.setItem('anivoid_list_v2', JSON.stringify(animesToStore));
    }
    if (serverState.studioLogos && typeof serverState.studioLogos === 'object') {
        localStorage.setItem('anivoid_studio_logos', JSON.stringify(serverState.studioLogos));
    }
}

class AppState {
    constructor() {
        this.loggedInUser = localStorage.getItem('anivoid_logged_in_username') || null;
        this.authToken = getAuthToken();
        if (this.loggedInUser && !this.authToken) {
            clearAuthSession();
            this.loggedInUser = null;
        }
        sanitizeStoredRegisteredUsers();
        this.friends = [];
        this.activities = [];
        this.knownActivityIds = new Set();
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
        
        this.activeDetailAnimeId = null;

        // Load local cached session before server sync
        this.loadLocalSession();
    }

    loadLocalSession() {
        try {
            this.loggedInUser = localStorage.getItem('anivoid_logged_in_username') || null;
            this.authToken = getAuthToken();
            if (this.loggedInUser && !this.authToken) {
                clearAuthSession();
                this.loggedInUser = null;
            }
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
        try {
            let registeredUsers = [];
            try {
                registeredUsers = (JSON.parse(localStorage.getItem('anivoid_registered_users')) || []).map(stripSensitiveUserFields);
            } catch (err) {}

            const localState = {
                registeredUsers: registeredUsers,
                animes: this.animes,
                studioLogos: this.studioLogos || {},
                friends: [],
                featuredAnimeId: this.featuredAnimeId
            };

            // Also embed featuredAnimeId in the logged-in user's profile before syncing
            if (this.loggedInUser && this.featuredAnimeId !== undefined) {
                const meIdx = registeredUsers.findIndex(u => u && u.username && u.username.toLowerCase() === this.loggedInUser.toLowerCase());
                if (meIdx >= 0) {
                    registeredUsers[meIdx] = { ...registeredUsers[meIdx], featuredAnimeId: this.featuredAnimeId };
                    localState.registeredUsers = registeredUsers;
                }
            }

            // Capture state before request
            const prevAnimesStr = deterministicStringify(this.animes);
            const prevFeaturedId = this.featuredAnimeId;
            let prevUsersStr = '';
            try {
                const parsedUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                prevUsersStr = deterministicStringify(parsedUsers);
            } catch (e) {}

            const hasAuthSession = !!this.loggedInUser && !!getAuthToken();
            const response = hasAuthSession
                ? await fetch(API_BASE_URL + '/api/sync-state', {
                    method: 'POST',
                    headers: authHeaders({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        localState: localState
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
            if (!response.ok) throw new Error('API sync request failed');
            const serverState = await response.json();

            // Update local memory and localStorage with the merged server state
            if (serverState.animes && Array.isArray(serverState.animes)) {
                const serverAnimesWithLocalRatings = mergeLocalOwnRatings(
                    serverState.animes,
                    this.animes,
                    this.loggedInUser
                );
                const serverAnimesMap = {};
                serverAnimesWithLocalRatings.forEach(sa => {
                    serverAnimesMap[sa.id] = sa;
                });

                // Merge server ratings and comments into local rich animes
                // IMPORTANT: preserve local replies when merging comments from server
                this.animes = this.animes.map(localAnime => {
                    const sa = serverAnimesMap[localAnime.id];
                    if (sa) {
                        // Merge comments: use server as base, but restore local replies
                        const localCommentsMap = {};
                        (localAnime.comments || []).forEach(lc => {
                            if (lc.id) localCommentsMap[lc.id] = lc;
                        });
                        const mergedComments = (sa.comments || []).map(sc => {
                            const localComment = localCommentsMap[sc.id];
                            return {
                                ...sc,
                                likes: (sc.likes && sc.likes.length > 0)
                                    ? sc.likes
                                    : (localComment?.likes || []),
                                // Preserve local replies (server doesn't know about them yet)
                                replies: (localComment && localComment.replies && localComment.replies.length > 0)
                                    ? localComment.replies
                                    : (sc.replies || [])
                            };
                        });
                        return {
                            ...localAnime,
                            studioLogoUrl: localAnime.studioLogoUrl || sa.studioLogoUrl || '',
                            ratings: sa.ratings || {},
                            comments: mergedComments
                        };
                    }
                    return localAnime;
                });

                // Add new animes from server not in local (deduplicate by id)
                const localIds = new Set(this.animes.map(a => a.id));
                serverAnimesWithLocalRatings.forEach(sa => {
                    if (sa && sa.id && !localIds.has(sa.id)) {
                        this.animes.push(sa);
                        localIds.add(sa.id);
                    }
                });

                // Final deduplication safeguard
                const seen = new Set();
                this.animes = this.animes.filter(a => {
                    if (seen.has(a.id)) return false;
                    seen.add(a.id);
                    return true;
                });

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
                // Preserve local friend connections: the server may have a stale version
                // of the logged-in user's friends list. Merge to keep local additions.
                let localRegisteredUsers = [];
                try {
                    localRegisteredUsers = (JSON.parse(localStorage.getItem('anivoid_registered_users')) || []).map(stripSensitiveUserFields);
                } catch(e) {}

                const mergedUsers = serverState.registeredUsers.map(serverUser => {
                    const localUser = localRegisteredUsers.find(u => u && u.username &&
                        u.username.toLowerCase() === (serverUser.username || '').toLowerCase());
                    if (localUser && this.loggedInUser &&
                        serverUser.username && serverUser.username.toLowerCase() === this.loggedInUser.toLowerCase()) {
                        // For the logged-in user: server friends list is authoritative.
                        // Local profile fields (avatar, color, title) are preserved if server doesn't have them yet.
                        return {
                            ...serverUser,
                            friends: serverUser.friends || [], // server is source of truth for social graph
                            activeTitle: localUser.activeTitle || serverUser.activeTitle,
                            avatar: localUser.avatar || serverUser.avatar,
                            color: localUser.color || serverUser.color
                        };
                    }
                    return serverUser;
                });

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
        
        // Trigger server sync in background and silently reload parts of UI when it returns
        this.syncWithServer().then(() => {
            // Reload session so state.friends reflects the server's authoritative friends list
            this.loadLocalSession();
            updateProfileIndicator();
            renderFriendsDropdown();
            renderAnimeGrid();
            renderFeaturedBanner();
            renderRecommendationsRail();
            updateNotificationBadges();
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
                                        <p class="font-semibold text-white" style="color: ${friend.color}">${friend.name}${adminBadge}</p>
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
                episodeRatings: {}
            };
        } else if (!anime.ratings[friendId].episodeRatings) {
            anime.ratings[friendId].episodeRatings = {};
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
                if ((r.episodesWatched || 0) < epInt) {
                    this.setEpisodesWatched(animeId, friendId, epInt);
                }
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
            
            this.save();
        }
    }

    setGeneralRating(animeId, friendId, generalScore) {
        const anime = this.animes.find(a => a.id === animeId);
        if (!anime) return;
        this.initFriendRatingIfMissing(anime, friendId);
        const r = anime.ratings[friendId];
        const score = parseFloat(generalScore);
        if (isNaN(score) || score < 1 || score > 10) return;
        const maxEps = parseInt(anime.episodes) || 0;
        const epsWatched = r.episodesWatched || 0;
        if (!r.episodeRatings) r.episodeRatings = {};
        if (maxEps <= 1) {
            r.episodeRatings[1] = score;
            r.overall = score;
        } else {
            for (let i = 1; i <= epsWatched; i++) {
                r.episodeRatings[i] = score;
            }
            const epOverall = this.calculateUserOverallFromEpisodes(anime, friendId);
            r.overall = epOverall > 0 ? epOverall : score;
        }
        r.updatedAt = new Date().toISOString();
        this.save();
    }

    toggleEpisodeWatched(animeId, friendId, epNum, isWatched) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const maxEps = parseInt(anime.episodes) || 0;
            const epInt = parseInt(epNum);
            
            if (isWatched) {
                if ((r.episodesWatched || 0) < epInt) {
                    this.setEpisodesWatched(animeId, friendId, epInt);
                }
            } else {
                if ((r.episodesWatched || 0) >= epInt) {
                    this.setEpisodesWatched(animeId, friendId, epInt - 1);
                }
                if (r.episodeRatings && r.episodeRatings[epNum]) {
                    delete r.episodeRatings[epNum];
                    const epOverall = this.calculateUserOverallFromEpisodes(anime, friendId);
                    if (epOverall > 0) {
                        r.overall = epOverall;
                    } else {
                        const catAvg = parseFloat(((r.animation + r.story + r.sound) / 3).toFixed(1));
                        r.overall = catAvg > 0 ? catAvg : 0;
                    }
                }
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
            this.save();
        }
    }

    setStatus(animeId, friendId, statusVal) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            r.status = statusVal;
            
            // Auto episodes watched on completed
            const totalEps = parseInt(anime.episodes) || 0;
            if (statusVal === 'Completed' && totalEps > 0) {
                r.episodesWatched = totalEps;
            }
            r.updatedAt = new Date().toISOString();
            this.save();
        }
    }

    setEpisodesWatched(animeId, friendId, epCount) {
        const anime = this.animes.find(a => a.id === animeId);
        if (anime) {
            this.initFriendRatingIfMissing(anime, friendId);
            const r = anime.ratings[friendId];
            const maxEps = parseInt(anime.episodes) || 0;
            let val = Math.max(0, epCount);
            if (maxEps > 0) val = Math.min(val, maxEps);
            r.episodesWatched = val;
            
            // Auto status transition
            if (maxEps > 0 && val === maxEps) {
                r.status = 'Completed';
            } else if (val > 0 && r.status === 'Plan to Watch') {
                r.status = 'Watching';
            }
            r.updatedAt = new Date().toISOString();
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

        // Include logged-in user status
        if (this.loggedInUser) {
            const myId = this.loggedInUser.toLowerCase().replace(/[^a-z0-9]/g, '');
            const r = anime.ratings[myId];
            if (r && r.status) {
                stats[r.status] = (stats[r.status] || 0) + 1;
            }
        }

        // Group members statuses
        if (this.friends && Array.isArray(this.friends)) {
            this.friends.forEach(f => {
                const r = anime.ratings[f.id];
                const status = r?.status || 'Plan to Watch';
                stats[status] = (stats[status] || 0) + 1;
            });
        }
        return stats;
    }

    addComment(animeId, friendId, text) {
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
                timestamp: new Date().toISOString(),
                likes: [],
                replies: []
            });
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
        this.save();
    }

    addNewAnime(title, japaneseTitle, synopsis, genres, studio, season, episodes, coverUrl, studioLogoUrl = '') {
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
            const query = normalizeUserSearchText(this.searchQuery);
            const animeTitleLower = normalizeUserSearchText(anime.title || '');
            const animeJpTitleLower = normalizeUserSearchText(anime.japaneseTitle || '');
            const animeStudioLower = normalizeUserSearchText(anime.studio || '');
            const animeGenreText = normalizeUserSearchText((anime.genres || []).join(' '));
            const matchesSearch = !query ||
                                 animeTitleLower.includes(query) ||
                                 animeJpTitleLower.includes(query) ||
                                 animeStudioLower.includes(query) ||
                                 animeGenreText.includes(query);
            
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
const tiltBoundCards = new WeakSet();

const NOTIFICATIONS_KEY = 'anivoid_notifications_v1';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

function getProfileDisplayUser(profileId = state.currentFriendId) {
    const cleanId = normalizeProfileId(profileId);
    const friend = (state.friends || []).find(item => item && item.id === cleanId);
    const registered = findRegisteredUserById(cleanId);
    if (friend || registered) {
        return {
            id: cleanId,
            username: registered?.username || friend?.name?.replace(' (Voce)', '').replace(' (VocÃª)', '') || cleanId || 'Usuario',
            name: friend?.name || registered?.username || cleanId || 'Usuario',
            avatar: registered?.avatar || friend?.avatar || DEFAULT_AVATAR_SVG,
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
    if (items.length === 0) {
        list.innerHTML = `
            <div class="rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
                <iconify-icon icon="lucide:bell-off" class="text-2xl text-white/25"></iconify-icon>
                <p class="mt-3 text-[11px] text-gray-500 font-mono uppercase tracking-widest">Nenhuma notificacao ainda</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map(item => {
        const color = item.color || '#FF4500';
        let timeText = '';
        try {
            const date = new Date(item.timestamp);
            timeText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (err) {}
        const icon = item.type === 'friend_request' ? 'lucide:user-plus' : item.type === 'friend_accept' ? 'lucide:handshake' : item.type === 'rating' ? 'lucide:star' : 'lucide:zap';
        const actionAttr = item.animeId ? `data-anime-id="${escapeHtml(item.animeId)}"` : '';
        return `
            <button class="notification-row w-full text-left rounded-2xl border p-4 flex gap-3 transition-all hover:scale-[1.01] ${item.read ? 'bg-white/[0.025] border-white/5' : 'bg-white/[0.055] border-white/10'}" style="--note-color:${color}" ${actionAttr}>
                <div class="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0" style="color:${color}; box-shadow:0 0 18px ${color}22">
                    <iconify-icon icon="${icon}" class="text-lg"></iconify-icon>
                </div>
                <div class="min-w-0 flex-grow">
                    <div class="flex items-center justify-between gap-3">
                        <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-white truncate">${escapeHtml(item.title)}</h4>
                        <span class="text-[9px] text-gray-500 font-mono shrink-0">${escapeHtml(timeText)}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 mt-1 leading-relaxed">${escapeHtml(item.message)}</p>
                </div>
                ${item.read ? '' : '<span class="w-2 h-2 rounded-full shrink-0 mt-2" style="background:var(--note-color); box-shadow:0 0 12px var(--note-color)"></span>'}
            </button>
        `;
    }).join('');

    list.querySelectorAll('.notification-row[data-anime-id]').forEach(row => {
        row.addEventListener('click', () => {
            const animeId = row.dataset.animeId;
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
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
}

function clearNotifications() {
    setStoredNotifications([]);
    updateNotificationBadges();
    renderNotificationsModal();
}

function buildPersonalRecommendations(limit = 3) {
    const myId = getLoggedInProfileId();
    if (!myId) return [];
    const preferredGenres = {};
    const preferredStudios = {};

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

    const groupIds = new Set((state.friends || []).map(friend => normalizeProfileId(friend.id)).filter(Boolean));
    groupIds.delete(myId);

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
            const score = friendAvg * 1.35 + genreBoost + studioBoost;
            if (score <= 0) return null;

            const reason = friendAvg >= 8
                ? `amigos deram media ${friendAvg.toFixed(1)}`
                : genreBoost > 0
                    ? 'combina com seus generos fortes'
                    : studioBoost > 0
                        ? `voce costuma curtir ${anime.studio}`
                        : 'boa aposta para testar';
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
    const recs = buildPersonalRecommendations(3);
    if (recs.length === 0) {
        rail.classList.add('hidden');
        return;
    }

    rail.classList.remove('hidden');
    list.innerHTML = recs.map(rec => {
        const avg = rec.friendAvg > 0 ? rec.friendAvg.toFixed(1) : state.calculateAverageScore(rec.anime.id).toFixed(1);
        const color = getScoreColor(avg);
        return `
            <button class="recommendation-card tilt-card group text-left rounded-3xl overflow-hidden border border-white/8 bg-white/[0.035] hover:bg-white/[0.055] transition-all" data-anime-id="${escapeHtml(rec.anime.id)}">
                <div class="flex gap-4 p-4">
                    <img src="${escapeHtml(rec.anime.coverUrl)}" class="w-16 h-24 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform" alt="${escapeHtml(rec.anime.title)}">
                    <div class="min-w-0 flex-grow">
                        <div class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-mono uppercase tracking-widest mb-3" style="color:${color.text}; border-color:${color.text}55; background:${color.text}13">
                            <iconify-icon icon="lucide:radar" class="text-[11px]"></iconify-icon>
                            Recomendado
                        </div>
                        <h4 class="text-sm font-serif font-bold text-white line-clamp-2">${escapeHtml(rec.anime.title)}</h4>
                        <p class="text-[10px] text-gray-500 font-mono mt-1">${escapeHtml(rec.reason)}</p>
                        <div class="mt-3 flex items-center gap-2 text-[10px] font-mono">
                            <span class="text-white/40">${escapeHtml(rec.anime.studio || 'Studio')}</span>
                            <span style="color:${color.text}; text-shadow:0 0 10px ${color.glow}">★ ${avg}</span>
                        </div>
                    </div>
                </div>
            </button>
        `;
    }).join('');

    list.querySelectorAll('.recommendation-card').forEach(card => {
        card.addEventListener('click', () => openAnimeDetail(card.dataset.animeId));
    });
    initSoftTiltCards(list);
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

function exportBackupData() {
    const payload = {
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

function renderPlayerProfileModal(profileId = state.currentFriendId) {
    const modal = document.getElementById('player-profile-modal');
    const content = document.getElementById('player-profile-content');
    if (!modal || !content) return;
    const user = getProfileDisplayUser(profileId);
    const stats = getProfileStats(user.id);
    const rank = getProfileRank(stats);
    const badges = getUserBadgesHtml({ ...user, username: user.username, name: user.username });
    const scoreColor = getScoreColor(stats.avgScore);
    const completed = stats.statusCounts.Completed || 0;
    const watching = stats.statusCounts.Watching || 0;
    const completionRate = stats.ratingCount > 0 ? Math.round((completed / stats.ratingCount) * 100) : 0;
    const favoriteAnimeCards = stats.topAnime.slice(0, 3).map(item => {
        const color = getScoreColor(item.overall);
        return `
            <button class="profile-fav-card rounded-2xl overflow-hidden border border-white/8 bg-white/[0.035] text-left group" data-anime-id="${escapeHtml(item.anime.id)}">
                <div class="relative aspect-[3/4]">
                    <img src="${escapeHtml(item.anime.coverUrl)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${escapeHtml(item.anime.title)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>
                    <span class="absolute top-3 right-3 rounded-xl border bg-black/75 px-2 py-1 text-[10px] font-mono font-bold" style="color:${color.text}; border-color:${color.text}55; box-shadow:0 0 14px ${color.glow}">★ ${item.overall}</span>
                    <h4 class="absolute bottom-3 left-3 right-3 text-xs font-serif font-bold text-white line-clamp-2">${escapeHtml(item.anime.title)}</h4>
                </div>
            </button>
        `;
    }).join('');

    const achievementCards = [
        { icon: 'lucide:clapperboard', label: 'Maratonista', value: `${stats.totalEpisodes} eps`, active: stats.totalEpisodes >= 50 },
        { icon: 'lucide:star', label: 'Critico', value: `${stats.ratingCount} notas`, active: stats.ratingCount >= 10 },
        { icon: 'lucide:message-square', label: 'Voz do grupo', value: `${stats.commentsCount} reviews`, active: stats.commentsCount >= 3 },
        { icon: 'lucide:trophy', label: 'Finalizador', value: `${completed} completos`, active: completed >= 5 }
    ].map(card => `
        <div class="achievement-card rounded-2xl border p-4 ${card.active ? 'is-active' : ''}">
            <div class="flex items-center justify-between gap-3">
                <iconify-icon icon="${card.icon}" class="text-xl"></iconify-icon>
                <span class="text-[9px] font-mono uppercase tracking-widest">${card.active ? 'desbloqueado' : 'em progresso'}</span>
            </div>
            <h4 class="mt-4 text-sm font-serif text-white">${escapeHtml(card.label)}</h4>
            <p class="text-[11px] text-gray-500 font-mono mt-1">${escapeHtml(card.value)}</p>
        </div>
    `).join('');

    const genreRows = stats.topGenres.length ? stats.topGenres.map(genre => `
        <div class="profile-meter-row">
            <div class="flex justify-between text-[10px] font-mono">
                <span class="text-white/75">${escapeHtml(genre.name)}</span>
                <span style="color:${getScoreColor(genre.avg).text}">${genre.avg.toFixed(1)}</span>
            </div>
            <div class="profile-meter-track"><span style="width:${Math.min(100, genre.avg * 10)}%; background:${getScoreColor(genre.avg).text}"></span></div>
        </div>
    `).join('') : `<p class="text-[11px] text-gray-500 italic">Sem generos fortes ainda.</p>`;

    const studioRows = stats.topStudios.length ? stats.topStudios.map(studio => `
        <button class="profile-studio-row rounded-xl border border-white/5 bg-white/[0.03] p-3 flex justify-between items-center hover:bg-white/[0.055] transition-colors" data-studio="${escapeHtml(studio.name)}">
            <span class="text-[11px] text-white font-mono truncate">${escapeHtml(studio.name)}</span>
            <span class="text-[11px] font-mono font-bold" style="color:${getScoreColor(studio.avg).text}">★ ${studio.avg.toFixed(1)}</span>
        </button>
    `).join('') : `<p class="text-[11px] text-gray-500 italic">Sem estudios favoritos ainda.</p>`;

    const activityRows = stats.recentActivities.length ? stats.recentActivities.map(activity => {
        const meta = getActivityMeta(activity);
        return `
            <button class="profile-activity-row rounded-xl border border-white/5 bg-white/[0.03] p-3 flex gap-3 items-center text-left hover:bg-white/[0.055] transition-colors" data-anime-id="${escapeHtml(activity.animeId || '')}">
                <span class="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0" style="color:${meta.color}">
                    <iconify-icon icon="${meta.icon}" class="text-sm"></iconify-icon>
                </span>
                <span class="min-w-0 flex-grow">
                    <span class="block text-[11px] text-white/75 font-mono truncate">${escapeHtml(activity.details || 'acao')}</span>
                    <span class="block text-[10px] text-gray-500 truncate">${escapeHtml(activity.animeTitle || '')}</span>
                </span>
            </button>
        `;
    }).join('') : `<p class="text-[11px] text-gray-500 italic">Sem atividade recente visivel.</p>`;

    content.innerHTML = `
        <div class="profile-hero-game relative overflow-hidden p-6 md:p-8" style="--profile-accent:${user.color}; --rank-color:${rank.color}">
            <div class="profile-hero-bg"></div>
            <div class="relative z-10 flex items-start justify-between gap-4">
                <div class="flex items-center gap-5 min-w-0">
                    <div class="profile-avatar-ring" style="--profile-accent:${user.color}">
                        ${avatarMarkup(user, 'w-20 h-20 md:w-24 md:h-24', user.username?.[0] || 'U')}
                    </div>
                    <div class="min-w-0">
                        <p class="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">Player Card</p>
                        <h2 class="text-3xl md:text-5xl font-serif font-black text-white leading-none truncate mt-2">${escapeHtml(user.username)}${badges}</h2>
                        <div class="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest" style="color:${rank.color}; border-color:${rank.color}55; background:${rank.color}14; box-shadow:0 0 22px ${rank.color}20">
                            <iconify-icon icon="${rank.icon}" class="text-sm"></iconify-icon>
                            Rank ${rank.tier} · ${rank.label}
                        </div>
                    </div>
                </div>
                <button id="close-player-profile" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white border border-white/10">
                    <iconify-icon icon="lucide:x" class="text-lg"></iconify-icon>
                </button>
            </div>

            <div class="relative z-10 mt-8 grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6">
                <div class="space-y-5">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div class="profile-stat-card"><span>Media</span><b style="color:${scoreColor.text}; text-shadow:0 0 16px ${scoreColor.glow}">${stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}</b></div>
                        <div class="profile-stat-card"><span>Animes</span><b>${stats.ratingCount}</b></div>
                        <div class="profile-stat-card"><span>Episodios</span><b>${stats.totalEpisodes}</b></div>
                        <div class="profile-stat-card"><span>Concluidos</span><b>${completed}</b></div>
                    </div>

                    <div class="profile-level-card rounded-3xl border border-white/10 bg-black/30 p-5">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <p class="text-[9px] font-mono uppercase tracking-widest text-white/40">Nivel de conta</p>
                                <h3 class="text-xl font-serif text-white">Nivel ${stats.level}</h3>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] font-mono uppercase tracking-widest text-white/40">XP</p>
                                <b class="text-sm font-mono text-white">${stats.xp}</b>
                            </div>
                        </div>
                        <div class="h-3 rounded-full bg-white/5 overflow-hidden border border-white/5">
                            <div class="h-full rounded-full" style="width:${stats.levelProgress}%; background:linear-gradient(90deg, ${user.color}, ${rank.color}); box-shadow:0 0 20px ${rank.color}55"></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${achievementCards}
                    </div>
                </div>

                <div class="profile-public-card rounded-3xl border border-white/10 bg-black/35 p-5 space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-mono uppercase tracking-widest text-white/65">Painel publico</h3>
                        <iconify-icon icon="lucide:scan-line" class="text-brand"></iconify-icon>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-center">
                        <div class="rounded-2xl bg-white/[0.04] border border-white/5 p-3"><b class="block text-lg text-white">${watching}</b><span class="text-[9px] text-gray-500 font-mono uppercase">assistindo</span></div>
                        <div class="rounded-2xl bg-white/[0.04] border border-white/5 p-3"><b class="block text-lg text-white">${completionRate}%</b><span class="text-[9px] text-gray-500 font-mono uppercase">clear rate</span></div>
                    </div>
                    <p class="text-[11px] text-gray-400 leading-relaxed">Cartao rapido para comparar gosto, ritmo e conquistas quando voce abre o perfil de alguem.</p>
                </div>
            </div>
        </div>

        <div class="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="text-xs font-mono uppercase tracking-widest text-white/70">Top obras</h3>
                    <span class="text-[9px] text-gray-500 font-mono uppercase">notas mais altas</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    ${favoriteAnimeCards || '<p class="text-[11px] text-gray-500 italic col-span-full">Sem obras avaliadas ainda.</p>'}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="rounded-3xl border border-white/8 bg-white/[0.025] p-5 space-y-3">
                        <h3 class="text-xs font-mono uppercase tracking-widest text-white/70">Assinatura de genero</h3>
                        ${genreRows}
                    </div>
                    <div class="rounded-3xl border border-white/8 bg-white/[0.025] p-5 space-y-3">
                        <h3 class="text-xs font-mono uppercase tracking-widest text-white/70">Studios fortes</h3>
                        ${studioRows}
                    </div>
                </div>
            </section>

            <aside class="space-y-4">
                <div class="rounded-3xl border border-white/8 bg-white/[0.025] p-5 space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-mono uppercase tracking-widest text-white/70">Historico recente</h3>
                        <iconify-icon icon="lucide:activity" class="text-brand"></iconify-icon>
                    </div>
                    ${activityRows}
                </div>
                <div class="rounded-3xl border border-white/8 bg-white/[0.025] p-5 space-y-3">
                    <h3 class="text-xs font-mono uppercase tracking-widest text-white/70">Estilo de jogo</h3>
                    <div class="profile-style-grid">
                        <span>Precisao <b>${stats.avgScore > 0 ? Math.min(100, Math.round(stats.avgScore * 10)) : 0}</b></span>
                        <span>Consistencia <b>${Math.min(100, stats.ratingCount * 6)}</b></span>
                        <span>Exploracao <b>${Math.min(100, Object.keys(stats.statusCounts).reduce((sum, key) => sum + (stats.statusCounts[key] > 0 ? 12 : 0), 0))}</b></span>
                    </div>
                </div>
            </aside>
        </div>
    `;

    content.querySelector('#close-player-profile')?.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
    content.querySelectorAll('[data-anime-id]').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.animeId;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (id) openAnimeDetail(id);
        });
    });
    content.querySelectorAll('[data-studio]').forEach(item => {
        item.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            window.switchTabToStudio(item.dataset.studio);
        });
    });
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    initSoftTiltCards(content);
}

function setupUtilityModals() {
    const closeDropdown = () => {
        const dropdown = document.getElementById('friends-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
        }
    };

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
    bindOnce('open-notifications', 'click', (event) => {
        event.stopPropagation();
        closeDropdown();
        renderNotificationsModal();
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    });
    bindOnce('close-notifications', 'click', () => {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
    bindOnce('mark-notifications-read', 'click', markNotificationsRead);
    bindOnce('clear-notifications', 'click', clearNotifications);
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

function initSoftTiltCards(root = document) {
    if (!root || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = root.querySelectorAll ? root.querySelectorAll('.tilt-card') : [];
    cards.forEach(card => {
        if (tiltBoundCards.has(card)) return;
        tiltBoundCards.add(card);

        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 5.5;
            const rotateX = (0.5 - y) * 5.5;
            card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
            card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--tilt-y', '0deg');
            card.style.setProperty('--tilt-x', '0deg');
        });
    });
}

function markViewEntered(element) {
    if (!element) return;
    element.classList.remove('view-enter-soft');
    void element.offsetWidth;
    element.classList.add('view-enter-soft');
}

// --- DOM ELEMENTS AND EVENT LISTENERS ---
function startApp() {
    // 1. Reveal Elements on Scroll
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    window.initObserver = () => {
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
        initSoftTiltCards();
    };

    // 2. Loading Splash Screen Setup
    setupSplashScreen();
    
    // 3. Populate and Render Dashboard UI
    initUI();

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
            
            // Close dropdown
            const dropdown = document.getElementById('friends-dropdown');
            if (dropdown) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
            }
        });
    }
    
    if (closeStatsBtn && statsModal) {
        closeStatsBtn.addEventListener('click', () => {
            statsModal.classList.add('hidden');
            statsModal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        });
    }

    // Trigger asynchronous central state synchronization and periodic polling
    state.syncWithServer().then(() => {
        initUI();
    });

    // Polling every 6 seconds for real-time multiplayer updates (ratings, comments, user edits)
    setInterval(() => {
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
                                        <p class="font-semibold text-white" style="color: ${friend.color}">${friend.name}${adminBadge}</p>
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
    }, 6000);
}

// App execution trigger moved to the bottom of the file to prevent TDZ ReferenceErrors

// Intro Splash Screen Logic (Auto-Transition + Click to Skip Fallback)
function setupSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (!splashScreen) return;

    let transitioned = false;

    const transitionOut = () => {
        if (transitioned) return;
        transitioned = true;
        
        // Add warp classes for the new empty set morph exit transition
        const logo = document.getElementById('splash-logo');
        if (logo) {
            logo.classList.add('splash-logo-warp-active');
        }
        splashScreen.classList.add('splash-warp-active');
        
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            splashScreen.style.display = 'none';
            
            // Check registration
            if (state.friends.length === 0) {
                document.body.classList.add('overflow-hidden');
                const regGate = document.getElementById('registration-gate');
                if (regGate) {
                    regGate.classList.remove('hidden');
                    regGate.classList.add('flex');
                    initRegistrationOptions();
                }
            } else {
                document.body.classList.remove('overflow-hidden');
            }
            if (window.initObserver) window.initObserver();
        }, 1500);
    };

    // After 2.5 seconds, auto-transition to main dashboard
    const timer = setTimeout(transitionOut, 2500);

    // Fallback click to skip transition immediately
    splashScreen.addEventListener('click', () => {
        clearTimeout(timer);
        transitionOut();
    });
}

// Initialise the interface elements and logic
function initUI() {
    // If no friends, show registration gate and stop
    if (state.friends.length === 0) {
        document.body.classList.add('overflow-hidden');
        const regGate = document.getElementById('registration-gate');
        if (regGate) {
            regGate.classList.remove('hidden');
            regGate.classList.add('flex');
            initRegistrationOptions();
        }
        return;
    }

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
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderAnimeGrid();
        });
    }

    renderSortDropdown();

    // Toggle Advanced Filters Panel
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const advancedFiltersPanel = document.getElementById('advanced-filters-panel');
    if (toggleFiltersBtn && advancedFiltersPanel) {
        toggleFiltersBtn.addEventListener('click', () => {
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
        backToHomeBtn.addEventListener('click', () => {
            closeAnimeDetail();
        });
    }

    // Modal Control: Add Anime Modal
    const addAnimeModal = document.getElementById('add-anime-modal');
    const openAddAnimeBtn = document.getElementById('open-add-anime');
    const closeAddAnimeBtn = document.getElementById('close-add-anime');
    if (openAddAnimeBtn && addAnimeModal) {
        openAddAnimeBtn.addEventListener('click', () => {
            addAnimeModal.classList.remove('hidden');
            addAnimeModal.classList.add('flex');
        });
    }
    if (closeAddAnimeBtn && addAnimeModal) {
        closeAddAnimeBtn.addEventListener('click', () => {
            addAnimeModal.classList.add('hidden');
            addAnimeModal.classList.remove('flex');
        });
    }

    // Modal Control: Add Friend Modal
    const addFriendModal = document.getElementById('add-friend-modal');
    const openAddFriendBtn = document.getElementById('open-add-friend');
    const closeAddFriendBtn = document.getElementById('close-add-friend');
    const logoutBtn = document.getElementById('logout-btn');

    if (openAddFriendBtn && addFriendModal) {
        openAddFriendBtn.addEventListener('click', async () => {
            addFriendModal.classList.remove('hidden');
            addFriendModal.classList.add('flex');
            renderCentralDeAmigos();
            const refreshed = await refreshRegisteredUsersFromServer({ force: true });
            if (refreshed) renderCentralDeAmigos();
        });
    }
    if (logoutBtn && !logoutBtn.dataset.listenerHooked) {
        logoutBtn.dataset.listenerHooked = 'true';
        logoutBtn.addEventListener('click', () => {
            // Disconnect session
            clearAuthSession();
            state.friends = [];
            state.currentFriendId = null;
            
            // Force reload to open login gate
            window.location.reload();
        });
    }
    if (closeAddFriendBtn && addFriendModal) {
        closeAddFriendBtn.addEventListener('click', () => {
            addFriendModal.classList.add('hidden');
            addFriendModal.classList.remove('flex');
        });
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
            btn.addEventListener('click', () => {
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
    setupCommentForm();

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
            activeAvatar.innerHTML = `<img src="${friend.avatar}" class="w-6 h-6 rounded-full object-cover" alt="">`;
        } else {
            activeAvatar.textContent = friend.avatar || '👤';
        }
    }
    if (activeName) {
        const badgesHtml = getUserBadgesHtml(friend);
        activeName.innerHTML = `${friend.name}${badgesHtml}`;
    }
    
    // Style borders and text with user theme
    if (profileIndicator) {
        profileIndicator.classList.add('profile-orbit-control');
        profileIndicator.style.setProperty('--profile-color', friend.color || '#FF4500');
        profileIndicator.style.borderColor = friend.color;
        profileIndicator.style.boxShadow = `0 0 15px ${friend.color}40`;
    }

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
    const container = document.getElementById('friends-dropdown-list');
    if (!container) return;

    container.innerHTML = '';
    state.friends.forEach(friend => {
        const activeClass = friend.id === state.currentFriendId ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5';
        const item = document.createElement('button');
        item.className = `profile-switch-card tilt-card w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm transition-colors duration-200 ${activeClass}`;
        item.style.setProperty('--profile-color', friend.color || '#FF4500');
        const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
            ? `<img src="${friend.avatar}" class="w-6 h-6 rounded-full object-cover shrink-0" alt="">`
            : `<span class="text-lg">${friend.avatar || '👤'}</span>`;
        const adminBadge = getUserBadgesHtml(friend);
        item.innerHTML = `
            ${avatarHtml}
            <span class="flex-grow">${friend.name}${adminBadge}</span>
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${friend.color}; box-shadow: 0 0 8px ${friend.color}"></span>
        `;

        item.addEventListener('click', () => {
            state.currentFriendId = friend.id;
            state.save();
            applyUserThemeColor(friend.color);
            updateProfileIndicator();
            renderFriendsDropdown();
            renderAnimeGrid();
            renderFeaturedBanner();
            
            // Toggle dropdown close
            const dropdown = document.getElementById('friends-dropdown');
            if (dropdown) dropdown.classList.add('hidden');

            // If detail modal is active, refresh it too
            if (state.activeDetailAnimeId) {
                openAnimeDetail(state.activeDetailAnimeId);
            }
        });

        container.appendChild(item);
    });
    initSoftTiltCards(container);
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
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore === 0) {
        return { text: '#7f8c8d', glow: 'rgba(127, 140, 141, 0)' };
    }
    const hue = Math.min(120, Math.max(0, (numScore / 10) * 120));
    return {
        text: `hsl(${hue}, 100%, 45%)`,
        glow: `hsla(${hue}, 100%, 50%, 0.55)`
    };
}

function getStudioScoreColor(score) {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore <= 0) {
        return { text: '#facc15', glow: 'hsla(45, 95%, 55%, 0.45)' };
    }

    const clampedScore = Math.min(10, Math.max(0, numScore));
    const normalizedScore = Math.min(1, Math.max(0, (clampedScore - 5) / 5));
    const hue = Math.round(45 + normalizedScore * 85);

    return {
        text: `hsl(${hue}, 95%, 52%)`,
        glow: `hsla(${hue}, 95%, 55%, 0.5)`
    };
}

function renderFeaturedBanner() {
    const bannerContainer = document.getElementById('featured-banner-wrapper');
    if (!bannerContainer || state.animes.length === 0) return;

    // Get the featured anime for the currently viewed user (currentFriendId)
    let viewedFeaturedId = null;
    try {
        const regUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        const viewedUser = regUsers.find(u => u && u.username &&
            u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === state.currentFriendId);
        if (viewedUser && viewedUser.featuredAnimeId) {
            viewedFeaturedId = viewedUser.featuredAnimeId;
        }
    } catch(e) {}

    // Fallback: if viewing ourselves, use our own state.featuredAnimeId
    const isViewingMe = state.friends.length > 0 && state.friends[0]?.id === state.currentFriendId;
    if (!viewedFeaturedId && isViewingMe) {
        viewedFeaturedId = state.featuredAnimeId;
    }

    // Get custom featured anime or top anime by group score
    let featuredAnime = null;
    if (viewedFeaturedId) {
        featuredAnime = state.animes.find(a => a.id === viewedFeaturedId);
    }
    
    if (!featuredAnime) {
        let maxScore = -1;
        featuredAnime = state.animes[0];
        state.animes.forEach(a => {
            const score = state.calculateAverageScore(a.id);
            if (score > maxScore) {
                maxScore = score;
                featuredAnime = a;
            }
        });
    }

    const avgScore = state.calculateAverageScore(featuredAnime.id);
    const friendRating = featuredAnime.ratings?.[state.currentFriendId];
    const myScore = friendRating?.overall || '-';
    const myStatus = friendRating?.status || 'Plan to Watch';
    const myStatusObj = STATUS_MAP[myStatus] || STATUS_MAP['Plan to Watch'];
    const myEps = friendRating?.episodesWatched || 0;
    const maxEps = parseInt(featuredAnime.episodes) || 0;

    const avgColorInfo = getScoreColor(avgScore);
    const scoreColorInfo = getScoreColor(myScore);
    const boxStyle = myScore !== '-' ? `border-color: ${scoreColorInfo.text}35; box-shadow: 0 0 15px ${scoreColorInfo.glow}` : '';
    const textStyle = myScore !== '-' ? `color: ${scoreColorInfo.text}; text-shadow: 0 0 8px ${scoreColorInfo.glow}` : 'color: #7f8c8d';

    const isPinned = viewedFeaturedId === featuredAnime.id;
    const highlightColor = avgColorInfo.text !== '#7f8c8d' ? avgColorInfo.text : '#FF4500';
    const highlightGlow = avgColorInfo.glow !== 'rgba(127, 140, 141, 0)' ? avgColorInfo.glow : 'rgba(255, 69, 0, 0.4)';

    const posterCardHtml = isPinned
        ? `
        <!-- Pinned Highlight Poster Card -->
        <div class="featured-poster-3d tilt-card relative shrink-0 w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-3xl overflow-hidden border-2 shadow-[0_0_35px_${highlightGlow}] transition-all duration-500 hover:scale-[1.04] hover:shadow-[0_0_50px_${highlightGlow}] animate-[pulse-glow_4s_infinite_ease-in-out] self-center z-10" style="border-color: ${highlightColor}">
            <img src="${featuredAnime.coverUrl}" class="w-full h-full object-cover" alt="${featuredAnime.title}">
            <div class="absolute top-4 right-4 bg-brand text-white text-[9px] font-bold font-mono tracking-widest px-2.5 py-1 rounded-full border border-brand/50 shadow-[0_4px_12px_rgba(255,69,0,0.4)] uppercase flex items-center gap-1 select-none">
                <iconify-icon icon="lucide:pin" class="text-[10px] animate-bounce"></iconify-icon>
                <span>Destaque Fixo</span>
            </div>
            <!-- Ambient Inner Border Glow -->
            <div class="absolute inset-0 border border-white/10 pointer-events-none rounded-3xl"></div>
        </div>
        `
        : `
        <!-- Normal Highlight Poster Card -->
        <div class="featured-poster-3d tilt-card relative shrink-0 w-48 sm:w-56 lg:w-60 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] self-center z-10">
            <img src="${featuredAnime.coverUrl}" class="w-full h-full object-cover" alt="${featuredAnime.title}">
        </div>
        `;

    bannerContainer.innerHTML = `
        <div class="absolute inset-0 z-0">
            <img src="${featuredAnime.coverUrl}" alt="Featured Banner" class="w-full h-full object-cover object-center opacity-25 blur-md scale-105 select-none">
            <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
        </div>
        
        <div class="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12 w-full py-6">
            <div class="max-w-2xl flex-grow">
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <span class="px-3 py-1 rounded-full border text-xs font-mono tracking-widest uppercase inline-block transition-all duration-300" style="${
                        avgScore > 0 
                            ? `border-color: ${avgColorInfo.text}50; background-color: ${avgColorInfo.text}15; color: ${avgColorInfo.text}; box-shadow: 0 0 10px ${avgColorInfo.glow}; text-shadow: 0 0 4px ${avgColorInfo.glow}` 
                            : 'border-brand/50 bg-brand/10 text-brand'
                    }">
                        ${isPinned ? 'Destaque Escolhido 🌟' : `Destaque da Galera ⭐ ${avgScore || 'S/N'}`}
                    </span>
                    <span class="px-3 py-1 rounded-full border ${myStatusObj.border} ${myStatusObj.bg} text-xs font-mono tracking-widest ${myStatusObj.text} uppercase inline-block">
                        ${myStatusObj.label}
                    </span>
                </div>
                <h1 class="text-4xl md:text-6xl font-medium tracking-tight mb-4 font-serif leading-none">
                    ${featuredAnime.title}
                </h1>
                <p class="text-gray-400 text-sm md:text-base line-clamp-3 leading-relaxed mb-6 font-light max-w-xl">
                    ${featuredAnime.synopsis}
                </p>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${featuredAnime.genres && Array.isArray(featuredAnime.genres) ? featuredAnime.genres.map(g => `<span class="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 font-mono">${g}</span>`).join('') : ''}
                </div>
                
                <!-- Progress bar in hero -->
                <div class="max-w-xs space-y-1.5 font-mono text-xs mb-8">
                    <div class="flex justify-between text-white/50">
                        <span>Progresso: <b class="text-white">${myEps} / ${maxEps > 0 ? maxEps : '?'} eps</b></span>
                        <span>${maxEps > 0 ? Math.round((myEps / maxEps) * 100) : 0}%</span>
                    </div>
                    <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-brand" style="width: ${maxEps > 0 ? (myEps / maxEps) * 100 : 0}%"></div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-4">
                    <button onclick="openAnimeDetail('${featuredAnime.id}')" class="anivoid-action px-8 py-3.5 rounded-full text-xs uppercase tracking-widest font-bold bg-white text-black hover:scale-105 transition-all duration-300 shadow-xl cursor-pointer">
                        Detalhes e Notas
                    </button>
                    <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 gap-3 transition-all duration-300" style="${boxStyle}">
                        <div class="flex flex-col">
                            <span class="text-[8px] uppercase text-white/40 tracking-wider font-mono">Sua Nota</span>
                            <span class="text-[8px] text-brand font-mono font-semibold">Geral</span>
                        </div>
                        <span class="text-2xl font-serif font-bold transition-all duration-300" style="${textStyle}">${myScore}</span>
                    </div>
                </div>
            </div>

            <!-- Right Side: Poster -->
            ${posterCardHtml}
        </div>
    `;
    initSoftTiltCards(bannerContainer);
    markViewEntered(bannerContainer);
}

function renderAnimeGrid() {
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

    grid.innerHTML = '';
    const filteredList = state.getFilteredAnimeList();
    const loggedInUserId = (state.loggedInUser || localStorage.getItem('anivoid_logged_in_username') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const isViewingOtherProfile = Boolean(loggedInUserId && state.currentFriendId && state.currentFriendId !== loggedInUserId);
    const shouldShowScoreComparison = isViewingOtherProfile && state.sortBy === 'my-score';

    if (filteredList.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center glass-panel rounded-3xl p-12 border border-white/5">
                <p class="text-gray-500 font-light text-lg">Nenhum anime encontrado para esta seleção de filtros.</p>
                <button onclick="resetFilters()" class="text-xs uppercase font-mono text-brand mt-4 hover:underline">Resetar Filtros</button>
            </div>
        `;
        return;
    }

    filteredList.forEach(anime => {
        const avgScore = state.calculateAverageScore(anime.id);
        const friendRating = anime.ratings?.[state.currentFriendId];
        const myScore = friendRating?.overall || null;
        const myStatus = friendRating?.status || 'Plan to Watch';
        const myStatusObj = STATUS_MAP[myStatus] || STATUS_MAP['Plan to Watch'];
        const myEps = friendRating?.episodesWatched || 0;
        const maxEps = parseInt(anime.episodes) || 0;
        const ownRating = loggedInUserId ? anime.ratings?.[loggedInUserId] : null;
        const ownScore = ownRating?.overall || null;
        
        const avgColorInfo = getScoreColor(avgScore);
        const avgBadgeStyle = avgScore > 0 ? `border-color: ${avgColorInfo.text}30; box-shadow: 0 0 8px ${avgColorInfo.glow}; color: ${avgColorInfo.text}; text-shadow: 0 0 4px ${avgColorInfo.glow}` : '';

        const myScoreColorInfo = getScoreColor(myScore);
        const ownScoreColorInfo = getScoreColor(ownScore);
        const profileScoreNumber = parseFloat(myScore);
        const ownScoreNumber = parseFloat(ownScore);
        const hasProfileScore = Number.isFinite(profileScoreNumber) && profileScoreNumber > 0;
        const hasOwnScore = Number.isFinite(ownScoreNumber) && ownScoreNumber > 0;
        const comparisonHtml = shouldShowScoreComparison
            ? `<div class="mb-3 rounded-2xl border border-white/15 bg-white/[0.055] p-2.5 shadow-[0_0_26px_rgba(255,255,255,0.055)]">
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="rounded-xl border px-3 py-2.5" style="background: ${hasProfileScore ? `${myScoreColorInfo.text}12` : 'rgba(255,255,255,0.035)'}; border-color: ${hasProfileScore ? `${myScoreColorInfo.text}55` : 'rgba(255,255,255,0.1)'}; box-shadow: ${hasProfileScore ? `0 0 16px ${myScoreColorInfo.glow}` : 'none'}">
                        <span class="block text-[8px] font-mono uppercase tracking-widest text-white/45">Perfil</span>
                        <b class="block text-2xl font-serif leading-none mt-1" style="color: ${hasProfileScore ? myScoreColorInfo.text : '#6b7280'}; text-shadow: ${hasProfileScore ? `0 0 12px ${myScoreColorInfo.glow}` : 'none'}">${hasProfileScore ? myScore : '-'}</b>
                    </div>
                    <div class="rounded-xl border px-3 py-2.5" style="background: ${hasOwnScore ? `${ownScoreColorInfo.text}12` : 'rgba(255,255,255,0.035)'}; border-color: ${hasOwnScore ? `${ownScoreColorInfo.text}55` : 'rgba(255,255,255,0.1)'}; box-shadow: ${hasOwnScore ? `0 0 16px ${ownScoreColorInfo.glow}` : 'none'}">
                        <span class="block text-[8px] font-mono uppercase tracking-widest text-white/45">Voce</span>
                        <b class="block text-2xl font-serif leading-none mt-1" style="color: ${hasOwnScore ? ownScoreColorInfo.text : '#6b7280'}; text-shadow: ${hasOwnScore ? `0 0 12px ${ownScoreColorInfo.glow}` : 'none'}">${hasOwnScore ? ownScore : '-'}</b>
                    </div>
                </div>
               </div>`
            : '';
        const scoreBadgeLabel = isViewingOtherProfile ? 'Nota Perfil' : 'Sua Nota';
        // Personal score badge on image (bottom-right overlay)
        const myScoreBadgeHtml = myScore
            ? `<div class="poster-depth-badge absolute bottom-10 right-3 flex flex-col items-center justify-center gap-0" style="z-index:2">
                <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold font-mono" style="background: rgba(0,0,0,0.75); border: 2px solid ${myScoreColorInfo.text}; color: ${myScoreColorInfo.text}; font-size:18px; text-shadow: 0 0 16px ${myScoreColorInfo.glow}; box-shadow: 0 0 28px ${myScoreColorInfo.glow}, 0 0 10px ${myScoreColorInfo.glow}60, inset 0 1px 0 ${myScoreColorInfo.text}40">
                    <span style="font-size:13px">★</span>
                    <span>${myScore}</span>
                </div>
                <span class="text-[8px] font-mono font-bold uppercase tracking-widest mt-1" style="color: ${myScoreColorInfo.text}; text-shadow: 0 0 8px ${myScoreColorInfo.glow}">${scoreBadgeLabel}</span>
               </div>`
            : `<div class="poster-depth-badge absolute bottom-10 right-3 flex flex-col items-center justify-center gap-0" style="z-index:2">
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold font-mono backdrop-blur-md" style="font-size:16px; background: rgba(255,255,255,0.04); border: 2px dashed rgba(255,255,255,0.18); color: rgba(255,255,255,0.25)">
                    <span style="font-size:12px">★</span>
                    <span>—</span>
                </div>
                <span class="text-[7px] font-mono uppercase tracking-widest mt-1 text-white/25">${scoreBadgeLabel}</span>
               </div>`;

        const card = document.createElement('div');
        card.className = 'glass-card anime-card-3d tilt-card rounded-2xl overflow-hidden flex flex-col justify-between h-full reveal';
        card.innerHTML = `
            <div class="relative w-full aspect-[2/3] overflow-hidden group cursor-pointer" onclick="openAnimeDetail('${anime.id}')">
                <img src="${anime.coverUrl}" alt="${anime.title}" class="poster-parallax w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                
                <!-- Group Average Score Badge (top-right) -->
                <div class="poster-depth-badge absolute top-4 right-4 flex flex-col items-center gap-0.5 group" style="z-index:3">
                    <div class="flex items-center justify-center gap-1 bg-[#050505]/90 backdrop-blur-sm border px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300" style="${avgBadgeStyle}; border-width: 1.5px;">
                        <span class="${avgScore > 0 ? '' : 'text-yellow-400'}">★</span>
                        <span>${avgScore > 0 ? avgScore : 'S/N'}</span>
                    </div>
                    <span class="text-[7px] font-mono uppercase tracking-widest text-white font-bold px-1.5 py-0.5 rounded" style="background:rgba(0,0,0,0.75); letter-spacing:0.12em;">Nota Geral</span>
                </div>

                <!-- Personal Status Badge (top-left) -->
                <div class="poster-depth-chip absolute top-4 left-4 flex items-center justify-center gap-1 ${myStatusObj.bg} ${myStatusObj.border} border backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider ${myStatusObj.text}">
                    ${myStatusObj.label}
                </div>
                
                <!-- Personal Score Badge (bottom-right overlay) -->
                ${myScoreBadgeHtml}

                <span onclick="event.stopPropagation(); window.switchTabToStudio('${anime.studio}')" class="poster-depth-chip absolute bottom-3 left-4 text-[10px] uppercase font-mono tracking-wider text-white/60 bg-black/40 hover:bg-brand/20 hover:border-brand/40 hover:text-white transition-all px-2 py-0.5 rounded border border-white/5 cursor-pointer hover:scale-105">
                    ${anime.studio}
                </span>
            </div>
            
            <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="text-base font-serif font-semibold text-white/95 line-clamp-1 leading-snug cursor-pointer hover:text-brand transition-colors" onclick="openAnimeDetail('${anime.id}')">
                        ${anime.title}
                    </h3>
                    <p class="text-[9px] text-gray-500 font-mono mb-2 line-clamp-1">${anime.japaneseTitle}</p>
                    
                    <p class="text-xs text-gray-400 font-light line-clamp-2 leading-relaxed mb-3">
                        ${anime.synopsis}
                    </p>
                    ${comparisonHtml}
                </div>
                
                <div>
                    <!-- Watched Episodes Progress Bar -->
                    <div class="flex justify-between items-center text-[9px] text-gray-500 font-mono mb-1">
                        <span>Progresso: <b class="text-white/80">${myEps} / ${maxEps > 0 ? maxEps : '?'} eps</b></span>
                        ${myStatus !== 'Completed' && maxEps > 0 && myEps < maxEps ? `
                            <button onclick="event.stopPropagation(); quickAddEpisode('${anime.id}')" class="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-brand/20 hover:border-brand/40 text-[8px] text-white/80 hover:text-white transition-all font-semibold uppercase tracking-wider font-mono">
                                +1 Ep
                            </button>
                        ` : ''}
                    </div>
                    <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                        <div class="h-full bg-brand" style="width: ${maxEps > 0 ? (myEps / maxEps) * 100 : 0}%; transition: width 0.3s ease;"></div>
                    </div>

                    <div class="flex flex-wrap gap-1 mb-3">
                        ${anime.genres && Array.isArray(anime.genres) ? anime.genres.slice(0, 3).map(g => `<span class="text-[8px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">${g}</span>`).join('') : ''}
                    </div>
                    
                    <div class="w-full h-px bg-white/5 mb-3"></div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] text-gray-500 font-mono uppercase">${anime.season}</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    if (window.initObserver) window.initObserver();
    initSoftTiltCards(grid);
    markViewEntered(grid);
    renderActivitiesFeed();
    renderRecommendationsRail();
}

let activeStudioName = null;

// Helper to get studio initials logo fallback
function getStudioInitials(name) {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

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
    'Sunrise': 'logos/sunrise.png',
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

function normalizeStudioLookupKey(name) {
    return normalizeStudioName(name).replace(/[^a-z0-9]/g, '');
}

function sanitizeStudioLogoUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^logos\/[a-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(value)) return value;
    if (/^https?:\/\//i.test(value) && value.length <= 4096) return value;
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

// Dynamic cinematic transition for studio profile entries
function triggerStudioTransition(studioName, onComplete) {
    let logoSrc = getStudioLogo(studioName) || null;
    if (studioName === 'A-1 Pictures') {
        logoSrc = 'logos/a1_pictures_white.png';
    }
    const initials = getStudioInitials(studioName);

    const dynamicImgStyle = studioName === 'Production I.G' ? 'filter: invert(1)' : '';

    const logoTransitionSizes = {
        'A-1 Pictures':   'max-w-[440px]',
        'Ufotable':       'max-w-[460px]',
        'Production I.G': 'max-w-[490px]',
        'CloverWorks':    'max-w-[470px]',
    };
    const dynamicMaxW = logoTransitionSizes[studioName] || 'max-w-[440px]';

    // Studio-specific transition colors (Auroras and spotlight)
    const transitionThemes = {
        'A-1 Pictures': {
            aurora1: 'bg-[#0055ff]',
            aurora2: 'bg-[#002288]',
            spotlight: 'rgba(255, 255, 255, 0.55)',
        },
        'Ufotable': {
            aurora1: 'bg-[#FF4500]',
            aurora2: 'bg-[#800000]',
            spotlight: 'rgba(255, 69, 0, 0.45)',
        },
        'Production I.G': {
            aurora1: 'bg-[#ffffff]',
            aurora2: 'bg-[#444444]',
            spotlight: 'rgba(255, 255, 255, 0.35)',
        },
        'CloverWorks': {
            aurora1: 'bg-[#00cc66]',
            aurora2: 'bg-[#0077ff]',
            spotlight: 'rgba(255, 255, 255, 0.55)',
        },
        'Madhouse': {
            aurora1: 'bg-[#7209b7]',
            aurora2: 'bg-[#3f37c9]',
            spotlight: 'rgba(114, 9, 183, 0.45)',
        },
        'MAPPA': {
            aurora1: 'bg-[#eb5e28]',
            aurora2: 'bg-[#252422]',
            spotlight: 'rgba(235, 94, 40, 0.45)',
        },
        'Bones': {
            aurora1: 'bg-[#00b4d8]',
            aurora2: 'bg-[#0077b6]',
            spotlight: 'rgba(0, 180, 216, 0.45)',
        },
        'Wit Studio': {
            aurora1: 'bg-[#2ec4b6]',
            aurora2: 'bg-[#011627]',
            spotlight: 'rgba(46, 196, 182, 0.45)',
        },
        'Gainax': {
            aurora1: 'bg-[#f77f00]',
            aurora2: 'bg-[#d62828]',
            spotlight: 'rgba(247, 127, 0, 0.45)',
        },
        'Kyoto Animation': {
            aurora1: 'bg-[#ff70a6]',
            aurora2: 'bg-[#ff9770]',
            spotlight: 'rgba(255, 112, 166, 0.45)',
        },
        'White Fox': {
            aurora1: 'bg-[#f8f9fa]',
            aurora2: 'bg-[#adb5bd]',
            spotlight: 'rgba(255, 255, 255, 0.45)',
        },
        'CoMix Wave Films': {
            aurora1: 'bg-[#003049]',
            aurora2: 'bg-[#d62828]',
            spotlight: 'rgba(0, 48, 73, 0.45)',
        },
        'Sunrise': {
            aurora1: 'bg-[#e63946]',
            aurora2: 'bg-[#1d3557]',
            spotlight: 'rgba(230, 57, 70, 0.45)',
        },
        'Studio Ghibli': {
            aurora1: 'bg-[#aacc00]',
            aurora2: 'bg-[#007f5f]',
            spotlight: 'rgba(170, 204, 0, 0.45)',
        },
        'Shaft': {
            aurora1: 'bg-[#d00000]',
            aurora2: 'bg-[#03071e]',
            spotlight: 'rgba(208, 0, 0, 0.45)',
        },
        'Tokyo Movie Shinsha': {
            aurora1: 'bg-[#ff006e]',
            aurora2: 'bg-[#3a0ca3]',
            spotlight: 'rgba(255, 0, 110, 0.45)',
        },
        'Tatsunoko Production': {
            aurora1: 'bg-[#ffbe0b]',
            aurora2: 'bg-[#fb5607]',
            spotlight: 'rgba(255, 190, 11, 0.45)',
        },
        'Bug Film': {
            aurora1: 'bg-[#ffd166]',
            aurora2: 'bg-[#06d6a0]',
            spotlight: 'rgba(255, 209, 102, 0.45)',
        },
        'BUG FILMS': {
            aurora1: 'bg-[#ffd166]',
            aurora2: 'bg-[#06d6a0]',
            spotlight: 'rgba(255, 209, 102, 0.45)',
        },
        'Bug Films': {
            aurora1: 'bg-[#ffd166]',
            aurora2: 'bg-[#06d6a0]',
            spotlight: 'rgba(255, 209, 102, 0.45)',
        },
        'Science Saru': {
            aurora1: 'bg-[#ff007f]',
            aurora2: 'bg-[#7b2cbf]',
            spotlight: 'rgba(255, 0, 127, 0.45)',
        },
        'Toei Animation': {
            aurora1: 'bg-[#ffb703]',
            aurora2: 'bg-[#fb8500]',
            spotlight: 'rgba(251, 133, 0, 0.45)',
        },
        'Pierrot': {
            aurora1: 'bg-[#4ea8de]',
            aurora2: 'bg-[#5e60ce]',
            spotlight: 'rgba(78, 168, 222, 0.45)',
        },
        'David Production': {
            aurora1: 'bg-[#2a9d8f]',
            aurora2: 'bg-[#264653]',
            spotlight: 'rgba(42, 157, 143, 0.45)',
        },
        'J.C.Staff': {
            aurora1: 'bg-[#ff4d6d]',
            aurora2: 'bg-[#800f2f]',
            spotlight: 'rgba(255, 77, 109, 0.45)',
        },
        'Studio Bind': {
            aurora1: 'bg-[#9b5de5]',
            aurora2: 'bg-[#f15bb5]',
            spotlight: 'rgba(155, 93, 229, 0.45)',
        }
    };

    const theme = transitionThemes[studioName] || {
        aurora1: 'bg-[#FF4500]',
        aurora2: 'bg-[#800000]',
        spotlight: 'rgba(255, 255, 255, 0.4)',
    };

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'studio-cinematic-transition';
    overlay.className = 'fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#050505] transition-all duration-500 ease-out opacity-0 pointer-events-auto';
    
    overlay.innerHTML = `
        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <div class="absolute top-[15%] left-[-15%] w-[60vw] h-[60vw] rounded-full ${theme.aurora1} opacity-15 blur-[140px] animate-drift-left"></div>
            <div class="absolute bottom-[10%] right-[-15%] w-[60vw] h-[60vw] rounded-full ${theme.aurora2} opacity-20 blur-[140px] animate-drift-right"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center justify-center w-full h-full text-center px-6">
            <div id="transition-studio-card" class="relative flex flex-col items-center justify-center">
                <!-- Ambient circular spotlight in the background -->
                <div id="transition-spotlight" class="absolute w-[700px] h-[700px] rounded-full filter blur-[70px] opacity-0 pointer-events-none" style="background: radial-gradient(circle, ${theme.spotlight} 0%, transparent 70%); transform: scale(0.7); transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s ease;"></div>
                
                <!-- Floating dust particles for extra texture -->
                <div class="absolute w-[680px] h-[400px] pointer-events-none z-0 overflow-hidden select-none">
                    <div class="transition-particle absolute w-1 h-1 bg-white/40 rounded-full" style="top: 15%; left: 20%; animation-delay: 0.1s; animation-duration: 7s;"></div>
                    <div class="transition-particle absolute w-1.5 h-1.5 bg-white/20 rounded-full" style="top: 65%; left: 12%; animation-delay: 0.6s; animation-duration: 9s;"></div>
                    <div class="transition-particle absolute w-1.2 h-1.2 bg-white/35 rounded-full" style="top: 80%; left: 85%; animation-delay: 1.4s; animation-duration: 8s;"></div>
                    <div class="transition-particle absolute w-2 h-2 bg-white/10 rounded-full" style="top: 25%; left: 78%; animation-delay: 0.9s; animation-duration: 10s;"></div>
                    <div class="transition-particle absolute w-1 h-1 bg-white/30 rounded-full" style="top: 45%; left: 30%; animation-delay: 2.1s; animation-duration: 7.5s;"></div>
                    <div class="transition-particle absolute w-1.5 h-1.5 bg-white/15 rounded-full" style="top: 50%; left: 70%; animation-delay: 1.8s; animation-duration: 8.5s;"></div>
                </div>

                <!-- Logo Section with slide reveal states -->
                <div id="transition-logo-container" class="flex items-center justify-center w-[640px] h-[220px] opacity-0" style="transform: translateY(25px); transition: transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.9s ease, filter 0.9s ease; filter: blur(8px) brightness(1.3);">
                    ${logoSrc 
                        ? `<div class="shine-sweep-wrap flex items-center justify-center p-4">
                               <img src="${logoSrc}" alt="${studioName}" class="${dynamicMaxW} h-auto max-h-[195px] object-contain select-none relative z-10" style="${dynamicImgStyle}">
                           </div>`
                        : `<div class="w-full h-full flex items-center justify-center text-7xl font-serif font-black text-brand select-none relative z-10" style="text-shadow: 0 0 25px rgba(255, 69, 0, 0.35);">${initials}</div>`
                    }
                </div>

                <!-- Cinematic Separator Line -->
                <div id="transition-separator" class="h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent my-6 opacity-0" style="width: 0px; transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease;"></div>

                <!-- Text Section with elegant vertical mask reveal -->
                <div id="transition-text-container" class="flex flex-col items-center justify-center">
                    <div class="overflow-hidden h-4 mb-2 flex items-center justify-center">
                        <p id="transition-subtitle" class="text-xs font-mono uppercase tracking-[0.85em] text-brand opacity-0" style="transform: translateY(100%); transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease, letter-spacing 1.1s cubic-bezier(0.16, 1, 0.3, 1);">Estúdio de Animação</p>
                    </div>
                    <div class="overflow-hidden py-1 flex items-center justify-center">
                        <h3 id="transition-title" class="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-wide leading-tight opacity-0" style="transform: translateY(100%); transition: transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease;">
                            ${studioName}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger reflow
    void overlay.offsetWidth;

    // Fade in overlay
    overlay.classList.remove('opacity-0');

    // Phase 1: Separator line expanding and spotlight acending (T=100ms)
    setTimeout(() => {
        const card = document.getElementById('transition-studio-card');
        if (card) {
            card.classList.add('transition-active');
        }
        
        const spotlight = document.getElementById('transition-spotlight');
        if (spotlight) {
            spotlight.style.opacity = '0.65';
            spotlight.style.transform = 'scale(1.0)';
        }

        const separator = document.getElementById('transition-separator');
        if (separator) {
            separator.style.width = '320px';
            separator.style.opacity = '1';
        }
    }, 100);

    // Phase 2: Logo slides in & fades (T=250ms)
    setTimeout(() => {
        const logoWrap = document.getElementById('transition-logo-container');
        if (logoWrap) {
            logoWrap.style.opacity = '1';
            logoWrap.style.transform = 'translateY(0)';
            logoWrap.style.filter = 'blur(0px) brightness(1)';
        }
    }, 250);

    // Phase 3: Text elements reveal (T=400ms)
    setTimeout(() => {
        const subtitle = document.getElementById('transition-subtitle');
        if (subtitle) {
            subtitle.style.opacity = '0.85';
            subtitle.style.transform = 'translateY(0)';
            subtitle.style.letterSpacing = '0.6em';
        }

        const title = document.getElementById('transition-title');
        if (title) {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }
    }, 400);

    // Phase 4: Zoom In & Dissolve Exit (Passing through the logo to the destination page) (T=1350ms)
    setTimeout(() => {
        // Swap background content
        if (onComplete) onComplete();

        const logoWrap = document.getElementById('transition-logo-container');
        if (logoWrap) {
            logoWrap.style.transition = 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.6s ease-out, filter 0.6s ease-out';
            logoWrap.style.transform = 'scale(2.5)';
            logoWrap.style.opacity = '0';
            logoWrap.style.filter = 'blur(20px) brightness(1.6)';
        }

        const separator = document.getElementById('transition-separator');
        if (separator) {
            separator.style.width = '0px';
            separator.style.opacity = '0';
        }

        const title = document.getElementById('transition-title');
        if (title) {
            title.style.transform = 'translateY(-30px)';
            title.style.opacity = '0';
        }

        const subtitle = document.getElementById('transition-subtitle');
        if (subtitle) {
            subtitle.style.transform = 'translateY(-20px)';
            subtitle.style.opacity = '0';
        }

        const spotlight = document.getElementById('transition-spotlight');
        if (spotlight) {
            spotlight.style.transition = 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.6s ease-out';
            spotlight.style.transform = 'scale(1.8)';
            spotlight.style.opacity = '0';
        }
    }, 1350);

    // Phase 5: Fade out full screen overlay smoothly (T=1950ms)
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
        overlay.classList.add('opacity-0');
        
        // Phase 6: Cleanup DOM (T=2550ms)
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 600);
    }, 1950);
}

// Render dynamic, glassmorphic studio directory
function renderStudiosDirectory() {
    const container = document.getElementById('studios-directory-container');
    if (!container) return;
    hydrateStudioLogosFromAnimes(state.animes);

    container.innerHTML = '';

    // Group anime by studio (skip animes without a known studio)
    // First deduplicate by normalized title globally
    const _titleDedup = new Map();
    state.animes.forEach(a => {
        const key = (a.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
        if (!_titleDedup.has(key)) {
            _titleDedup.set(key, a);
        } else {
            const ex = _titleDedup.get(key);
            if (Object.keys(a.ratings || {}).length > Object.keys(ex.ratings || {}).length) {
                _titleDedup.set(key, a);
            }
        }
    });
    const dedupedForStudios = Array.from(_titleDedup.values());

    const studiosMap = {};
    dedupedForStudios.forEach(anime => {
        const studio = anime.studio && anime.studio.trim() ? anime.studio.trim() : null;
        if (!studio || studio.toLowerCase() === 'desconhecido') return;
        if (!studiosMap[studio]) studiosMap[studio] = [];
        studiosMap[studio].push(anime);
    });

    const studiosList = Object.keys(studiosMap).sort();

    if (studiosList.length === 0) {
        container.innerHTML = `
            <div class="py-20 text-center glass-panel rounded-3xl p-12 border border-white/5">
                <p class="text-gray-500 font-light text-lg">Nenhum estúdio encontrado.</p>
            </div>
        `;
        return;
    }

    // ── STATE A: NO STUDIO SELECTED → show landing grid ──────────────────────
    if (!activeStudioName || !studiosList.includes(activeStudioName)) {
        const landingHeader = document.createElement('div');
        landingHeader.className = 'mb-10';
        landingHeader.innerHTML = `
            <button onclick="window.switchTabToAll()" class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-brand mb-6 group transition-colors cursor-pointer">
                <iconify-icon icon="lucide:arrow-left" class="text-sm group-hover:-translate-x-1 transition-transform"></iconify-icon>
                <span>Voltar para a Temporada</span>
            </button>
            <h2 class="text-4xl md:text-6xl font-serif text-white/90 mb-2">
                Diretório de <span class="italic text-brand font-light">Estúdios</span>
            </h2>
            <p class="text-xs text-gray-500 font-mono tracking-widest uppercase">Selecione um estúdio para explorar seu perfil completo</p>
            <div class="w-full h-px bg-white/5 mt-8"></div>
        `;
        container.appendChild(landingHeader);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6';

        studiosList.forEach((studioName, i) => {
            const animes = studiosMap[studioName];
            const logoSrc = getStudioLogo(studioName) || null;
            const initials = getStudioInitials(studioName);
            const scores = animes.map(a => state.calculateAverageScore(a.id)).filter(s => s > 0);
            const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
            const scoreCfg = getStudioScoreColor(avg);
            const count = animes.length;
            const countText = count === 1 ? '1 Anime' : `${count} Animes`;

            const card = document.createElement('div');
            card.className = 'studio-landing-card studio-card-animate tilt-card h-72 group';
            card.style.animationDelay = `${i * 80}ms`;

            const hoverCfg = STUDIO_BRAND_COLORS[studioName] || { border: 'rgba(255, 69, 0, 0.4)', glow: 'rgba(255, 69, 0, 0.15)', text: '#FF4500' };

            card.style.setProperty('--studio-brand-color', hoverCfg.border);
            card.style.setProperty('--studio-glow-color', hoverCfg.glow);
            card.style.setProperty('--studio-text-color', hoverCfg.text);

            card.innerHTML = `
                <div class="studio-logo-bg"></div>
                ${avg ? `
                    <div class="studio-score-badge" style="--score-color: ${scoreCfg.text}; --score-glow: ${scoreCfg.glow};">
                        <span class="studio-score-star">&#9733;</span>
                        <span class="studio-score-value">${avg}</span>
                        <span class="studio-score-label">Media</span>
                    </div>
                ` : ''}

                <!-- Logo image or initials fallback (transparent, borderless, clean on themed radial spotlight glow) -->
                <div class="w-full h-[80%] flex flex-col items-center justify-center p-2 relative">
                    <!-- Ambient radial spotlight under the logo -->
                    <div class="absolute w-[240px] h-[240px] rounded-full filter blur-[20px] opacity-35 pointer-events-none transition-transform duration-500 group-hover:scale-125" style="background: radial-gradient(circle, ${hoverCfg.border} 0%, transparent 70%);"></div>
                    
                    ${logoSrc
                        ? (() => {
                            const logoSizes = {
                                'A-1 Pictures':   'max-w-[270px] max-h-[160px]',
                                'Ufotable':       'max-w-[300px] max-h-[175px]',
                                'Production I.G': 'max-w-[280px] max-h-[170px]',
                                'CloverWorks':    'max-w-[280px] max-h-[170px]',
                            };
                            const maxWCls = logoSizes[studioName] || 'max-w-[250px] max-h-[155px]';
                            return `<img src="${logoSrc}" alt="${studioName}" class="studio-logo-mark ${maxWCls} h-auto object-contain select-none relative z-10 transition-transform duration-500 group-hover:scale-105" style="">`;
                          })()
                        : `<div class="studio-logo-mark w-24 h-24 rounded-full flex items-center justify-center text-4xl font-serif font-black transition-all duration-300 relative z-10" style="color:${hoverCfg.text}; background:${hoverCfg.text}10; border:1px solid ${hoverCfg.border}; text-shadow:0 0 15px ${hoverCfg.border}">${initials}</div>`
                    }
                </div>

                <!-- Name overlay at bottom -->
                <div class="studio-name-overlay">
                    <p class="text-white font-serif font-bold text-xl tracking-tight transition-colors duration-300 group-hover:text-[var(--studio-text-color)]">${studioName}</p>
                    <div class="flex items-center gap-3 mt-1">
                        <span class="text-[10px] font-mono text-gray-400 uppercase">${countText}</span>
                        ${avg ? `<span class="text-[10px] font-mono font-semibold" style="color: ${hoverCfg.text}">★ ${avg}</span>` : ''}
                    </div>
                </div>
            `;

            const legacyInlineScore = card.querySelector('.studio-name-overlay span[style*="color"]');
            if (legacyInlineScore) legacyInlineScore.remove();

            card.addEventListener('click', () => {
                triggerStudioTransition(studioName, () => {
                    activeStudioName = studioName;
                    renderStudiosDirectory();
                });
            });

            grid.appendChild(card);
        });

        container.appendChild(grid);
        if (window.initObserver) window.initObserver();
        initSoftTiltCards(grid);
        markViewEntered(grid);
        return;
    }

    // ── STATE B: STUDIO SELECTED → show studio profile ───────────────────────
    // Deduplicate by id to avoid duplicate cards
    const activeAnimes = Array.from(new Map((studiosMap[activeStudioName] || []).map(a => [a.id, a])).values());
    const initials = getStudioInitials(activeStudioName);
    const description = getStudioDescription(activeStudioName, activeAnimes);
    const logoSrc = getStudioLogo(activeStudioName) || null;

    // Calculate studio average score
    const scores = activeAnimes.map(a => state.calculateAverageScore(a.id)).filter(s => s > 0);
    const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
    const colorInfo = getScoreColor(avgScore);

    // Top anime by score
    let topAnime = null;
    let topScore = 0;
    activeAnimes.forEach(a => {
        const s = state.calculateAverageScore(a.id);
        if (s > topScore) { topScore = s; topAnime = a; }
    });

    const countText = activeAnimes.length === 1 ? '1 Anime produzido' : `${activeAnimes.length} Animes produzidos`;
    const ratingBadgeHtml = avgScore > 0
        ? `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border" style="color:${colorInfo.text}; border-color:${colorInfo.text}50; background:${colorInfo.text}15; box-shadow:0 0 12px ${colorInfo.glow}">★ ${avgScore.toFixed(1)}</div>`
        : '';

    // Calculate dynamic genre counts
    const genreCounts = {};
    activeAnimes.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        }
    });
    const topGenres = Object.keys(genreCounts)
        .sort((a, b) => genreCounts[b] - genreCounts[a])
        .slice(0, 3);

    const themeColors = {
        'A-1 Pictures':       'rgba(0, 85, 255, 0.45)',
        'Ufotable':           'rgba(255, 69, 0, 0.4)',
        'Production I.G':     'rgba(255, 255, 255, 0.3)',
        'CloverWorks':        'rgba(0, 204, 102, 0.45)',
        'Madhouse':           'rgba(114, 9, 183, 0.45)',
        'MAPPA':              'rgba(235, 94, 40, 0.45)',
        'Bones':              'rgba(0, 180, 216, 0.45)',
        'Wit Studio':         'rgba(46, 196, 182, 0.45)',
        'Gainax':             'rgba(247, 127, 0, 0.45)',
        'Kyoto Animation':    'rgba(255, 112, 166, 0.45)',
        'White Fox':          'rgba(255, 255, 255, 0.35)',
        'CoMix Wave Films':   'rgba(0, 48, 73, 0.45)',
        'Sunrise':            'rgba(230, 57, 70, 0.45)',
        'Studio Ghibli':      'rgba(170, 204, 0, 0.45)',
        'Shaft':              'rgba(208, 0, 0, 0.45)',
        'Tokyo Movie Shinsha':'rgba(255, 0, 110, 0.45)',
        'Tatsunoko Production':'rgba(255, 190, 11, 0.45)',
        'Bug Film':           'rgba(255, 209, 102, 0.45)',
        'BUG FILMS':          'rgba(255, 209, 102, 0.45)',
        'Bug Films':          'rgba(255, 209, 102, 0.45)',
        'Science Saru':       'rgba(255, 0, 127, 0.45)',
        'Toei Animation':     'rgba(251, 133, 0, 0.45)',
        'Pierrot':            'rgba(78, 168, 222, 0.45)',
        'David Production':   'rgba(42, 157, 143, 0.45)',
        'J.C.Staff':          'rgba(255, 77, 109, 0.45)',
        'Studio Bind':        'rgba(155, 93, 229, 0.45)',
        'Kinema Citrus':      'rgba(247, 127, 0, 0.45)',
        'Manglobe':           'rgba(6, 214, 160, 0.45)',
        'Artland':            'rgba(214, 40, 40, 0.45)',
        'Triangle Staff':     'rgba(255, 190, 11, 0.45)',
        'Trigger':            'rgba(230, 57, 70, 0.45)'
    };
    const themeColor = themeColors[activeStudioName] || 'rgba(255, 69, 0, 0.4)';

    const profile = document.createElement('div');
    profile.className = 'w-full space-y-10 animate-profile-enter';

    profile.innerHTML = `
        <!-- Back button -->
        <button onclick="window.backToStudiosLanding()" class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-400 hover:text-brand group transition-colors cursor-pointer mb-2">
            <iconify-icon icon="lucide:arrow-left" class="text-sm group-hover:-translate-x-1 transition-transform"></iconify-icon>
            <span>Todos os Estúdios</span>
        </button>

        <!-- Hero Header -->
        <div class="studio-profile-hero relative rounded-3xl overflow-hidden border border-white/10">
            <div class="absolute inset-0 z-0 pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#070707] to-[#050505]"></div>
                <div class="absolute top-0 left-0 w-72 h-72 rounded-full bg-brand opacity-5 blur-[100px]"></div>
                <div class="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white/5 opacity-5 blur-[80px]"></div>
            </div>

            <div class="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
                <!-- Logo or Initials (Transparent, borderless on themed spotlight glow) -->
                <div class="shrink-0 relative flex items-center justify-center w-72 h-72 md:w-96 md:h-96">
                    <!-- Ambient spotlight glow -->
                    <div class="absolute w-[360px] h-[360px] rounded-full filter blur-[40px] opacity-40 pointer-events-none" style="background: radial-gradient(circle, ${themeColor} 0%, transparent 70%);"></div>
                    
                    ${logoSrc
                        ? (() => {
                            const logoSizes = {
                                'A-1 Pictures':   'max-w-[320px] max-h-[220px]',
                                'Ufotable':       'max-w-[360px] max-h-[240px]',
                                'Production I.G': 'max-w-[340px] max-h-[230px]',
                                'CloverWorks':    'max-w-[340px] max-h-[230px]'
                            };
                            const maxWCls = logoSizes[activeStudioName] || 'max-w-[320px] max-h-[210px]';
                            return `<img src="${logoSrc}" alt="${activeStudioName}" class="studio-logo-mark ${maxWCls} h-auto object-contain select-none relative z-10" style="">`;
                          })()
                        : `<div class="studio-logo-mark w-44 h-44 rounded-full flex items-center justify-center text-7xl font-serif font-black text-brand relative z-10" style="background:rgba(255,69,0,0.12); border:1px solid rgba(255,69,0,0.25)">
                                ${initials}
                           </div>`
                    }
                </div>

                <!-- Name & Meta -->
                <div class="flex-grow text-center md:text-left space-y-4">
                    <div>
                        <p class="text-[10px] font-mono uppercase tracking-[0.3em] text-brand/70 mb-2">Estúdio de Animação · Japão</p>
                        <h2 class="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter leading-none" style="text-shadow:0 2px 40px rgba(255,255,255,0.08)">${activeStudioName}</h2>
                    </div>
                    <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        ${ratingBadgeHtml}
                        <span class="text-xs text-gray-500 font-mono">${countText}</span>
                        <div class="flex items-center gap-2.5 text-gray-500">
                            <a href="#" class="hover:text-brand transition-colors text-base"><iconify-icon icon="lucide:globe"></iconify-icon></a>
                            <a href="#" class="hover:text-brand transition-colors text-base"><iconify-icon icon="lucide:twitter"></iconify-icon></a>
                            <a href="#" class="hover:text-brand transition-colors text-base"><iconify-icon icon="lucide:facebook"></iconify-icon></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Topic Highlight: Sobre o Estúdio -->
        <div class="glass-panel border-l-4 border-l-brand border-y-white/5 border-r-white/5 rounded-2xl p-8 hover:border-r-brand/10 transition-all duration-300 relative overflow-hidden group">
            <div class="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-brand/5 blur-[50px] pointer-events-none transition-transform group-hover:scale-110"></div>
            
            <div class="flex items-center gap-3 mb-4">
                <iconify-icon icon="lucide:info" class="text-brand text-lg"></iconify-icon>
                <h4 class="text-xs font-mono uppercase tracking-widest text-white/70">Sobre o Estúdio</h4>
            </div>
            <p class="text-base text-gray-300 font-light leading-relaxed font-serif italic">${description}</p>
        </div>

        <!-- Topic Highlight: Métricas de Desempenho -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card 1: Média Geral -->
            <div class="metric-depth-card glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-brand/20 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Avaliação Média</span>
                    <iconify-icon icon="lucide:star" class="text-brand text-base"></iconify-icon>
                </div>
                <div class="mt-4">
                    <span class="text-4xl font-serif font-black" style="color: ${colorInfo.text}; text-shadow: 0 0 15px ${colorInfo.glow}">
                        ${avgScore > 0 ? avgScore.toFixed(1) : 'S/N'}
                    </span>
                    <p class="text-xs text-gray-500 font-mono mt-1">Pontuação média no Anivoid</p>
                </div>
            </div>
            
            <!-- Card 2: Volume -->
            <div class="metric-depth-card glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-brand/20 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Volume de Obras</span>
                    <iconify-icon icon="lucide:clapperboard" class="text-brand text-base"></iconify-icon>
                </div>
                <div class="mt-4">
                    <span class="text-4xl font-serif font-black text-white">
                        ${activeAnimes.length}
                    </span>
                    <p class="text-xs text-gray-500 font-mono mt-1">${activeAnimes.length === 1 ? 'Anime cadastrado' : 'Animes cadastrados'}</p>
                </div>
            </div>
            
            <!-- Card 3: Especialidades -->
            <div class="metric-depth-card glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-brand/20 transition-all duration-300">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Foco de Gêneros</span>
                    <iconify-icon icon="lucide:tags" class="text-brand text-base"></iconify-icon>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-4">
                    ${topGenres.map(g => `<span class="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white/70 font-mono hover:bg-brand/10 hover:border-brand/35 transition-colors cursor-default">${g}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="w-full h-px bg-white/5"></div>

        <!-- Topic Highlight: Catálogo de Produções -->
        <div class="space-y-6">
            <div class="flex items-center gap-3 mb-2">
                <iconify-icon icon="lucide:grid" class="text-brand text-lg"></iconify-icon>
                <h4 class="text-xs font-mono uppercase tracking-widest text-white/70">Catálogo de Produções (${activeAnimes.length})</h4>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                ${activeAnimes.map(anime => {
                    const animeAvg = state.calculateAverageScore(anime.id);
                    const animeColor = getScoreColor(animeAvg);
                    const animeRatingStyle = animeAvg > 0 ? `color: ${animeColor.text}; text-shadow: 0 0 5px ${animeColor.glow}` : 'color: #555';
                    const avgBorderStyle = animeAvg > 0 ? `border-color: ${animeColor.text}30; box-shadow: 0 0 10px ${animeColor.glow}` : '';

                    return `
                        <div onclick="openAnimeDetail('${anime.id}')" class="studio-catalog-card glass-panel border border-white/5 hover:border-brand/25 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5),_0_0_20px_rgba(255,69,0,0.08)] overflow-hidden group flex flex-col h-full">
                            <div class="relative w-full aspect-[2/3] overflow-hidden">
                                <img src="${anime.coverUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${anime.title}">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
                                ${animeAvg > 0 ? `
                                    <div class="absolute top-3 right-3 bg-[#050505]/85 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10" style="${avgBorderStyle}">
                                        <span style="${animeRatingStyle}">★ ${animeAvg.toFixed(1)}</span>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="p-4 flex-grow flex flex-col justify-between">
                                <p class="font-serif font-bold text-xs text-white/90 line-clamp-2 group-hover:text-brand transition-colors leading-snug">${anime.title}</p>
                                <p class="text-[9px] text-gray-500 font-mono uppercase tracking-wider">${anime.season}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.appendChild(profile);
    if (window.initObserver) window.initObserver();
    initSoftTiltCards(profile);
    markViewEntered(profile);
}

window.switchTabToFeatured = () => {
    closeAnimeDetail();
};

// Go back to studio landing grid with slide-in-from-right transition
window.backToStudiosLanding = () => {
    activeStudioName = null;
    renderStudiosDirectory();
};

window.switchTabToAll = () => {
    state.filterMALStatus = 'All';
    const malTabs = ['mal-tab-All', 'mal-tab-Watching', 'mal-tab-Completed', 'mal-tab-OnHold', 'mal-tab-Dropped', 'mal-tab-PlanToWatch'];
    malTabs.forEach(tabId => {
        const tabBtn = document.getElementById(tabId);
        if (tabBtn) {
            if (tabId === 'mal-tab-All') {
                tabBtn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-brand border-brand';
            } else {
                tabBtn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-white/40 border-transparent hover:text-white';
            }
        }
    });
    renderAnimeGrid();
    closeAnimeDetail();
};

window.switchTabToStudio = (studioName) => {
    const doSwitch = () => {
        state.filterMALStatus = 'Studios';
        activeStudioName = studioName || null;
        
        const malTabs = ['mal-tab-All', 'mal-tab-Watching', 'mal-tab-Completed', 'mal-tab-OnHold', 'mal-tab-Dropped', 'mal-tab-PlanToWatch'];
        malTabs.forEach(tabId => {
            const tabBtn = document.getElementById(tabId);
            if (tabBtn) {
                tabBtn.className = 'mal-tab py-3 border-b-2 font-semibold transition-all px-2 whitespace-nowrap text-white/40 border-transparent hover:text-white';
            }
        });

        const detailPage = document.getElementById('anime-detail-page');
        const isDetailOpen = detailPage && !detailPage.classList.contains('hidden');

        if (isDetailOpen) {
            // Close detail page instantly under the cover of the overlay transition
            detailPage.classList.remove('page-transition-active');
            detailPage.classList.add('hidden');
            const banner = document.getElementById('featured-banner-wrapper');
            const grid = document.getElementById('anime-grid-section');
            if (banner) banner.style.display = '';
            if (grid) grid.style.display = '';
            state.activeDetailAnimeId = null;
        }

        renderAnimeGrid();
        renderFeaturedBanner();

        // Scroll instantly to grid section
        const gridSection = document.getElementById('anime-grid-section');
        if (gridSection) {
            gridSection.scrollIntoView({ behavior: 'auto' });
        }

        // Trigger entry animation
        const studiosContainer = document.getElementById('studios-directory-container');
        if (studiosContainer) {
            studiosContainer.classList.remove('animate-studio-in');
            void studiosContainer.offsetWidth; // force browser layout recalculation
            studiosContainer.classList.add('animate-studio-in');
        }
    };

    if (studioName) {
        triggerStudioTransition(studioName, doSwitch);
    } else {
        doSwitch();
    }
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
    if (!container) return;
    
    const numScore = parseFloat(score);
    const displayScore = isNaN(numScore) || numScore === 0 ? '-' : numScore.toFixed(1);
    const percent = isNaN(numScore) || numScore === 0 ? 0 : Math.round(numScore * 10);
    
    const colors = getScoreColor(score);
    
    // Create perfectly round wrapper with border-radius and box-shadow to prevent square clipping bug on SVG path filters
    const wrapperStyle = numScore > 0 
        ? `box-shadow: 0 0 14px ${colors.glow}, inset 0 0 8px ${colors.glow}; border: 1px solid ${colors.text}35; background: rgba(5, 5, 5, 0.6);`
        : `border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(5, 5, 5, 0.2);`;

    container.innerHTML = `
        <div class="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500" style="${wrapperStyle}">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <!-- Background track -->
                <path class="text-white/5 stroke-current" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <!-- Filled circular path with dynamic stroke color -->
                <path class="transition-all duration-1000 ease-out" stroke-width="3" stroke-dasharray="${percent}, 100" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style="stroke: ${colors.text};" />
            </svg>
            <span class="absolute text-xs font-mono font-bold text-white">${displayScore}</span>
        </div>
    `;
}

// Custom select dropdown component renderer matching premium crimson design system
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
    
    // Find current label
    const currentOpt = options.find(o => String(o.value) === String(currentValue));
    const currentLabel = currentOpt ? currentOpt.label : (isCompact ? '-' : 'Selecione');

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    if (isCompact) {
        if (disabled) {
            trigger.disabled = true;
            trigger.style.cursor = 'not-allowed';
            if (!currentValue || currentValue === '') {
                trigger.className = 'inline-flex items-center justify-center bg-white/5 border border-white/5 rounded-lg py-1 px-2.5 text-[11px] font-mono text-gray-500 transition-all opacity-50';
                trigger.innerHTML = `<span>Sem Nota</span>`;
            } else {
                const colors = getScoreColor(currentValue);
                trigger.className = 'inline-flex items-center justify-center border rounded-lg py-1 px-2.5 text-[11px] font-mono font-bold transition-all opacity-70';
                trigger.style.borderColor = `${colors.text}30`;
                trigger.style.backgroundColor = `${colors.text}08`;
                trigger.style.color = colors.text;
                trigger.style.boxShadow = `0 0 6px ${colors.glow}`;
                trigger.style.textShadow = `0 0 2px ${colors.glow}`;
                trigger.innerHTML = `<span>Nota: ${currentValue}</span>`;
            }
        } else {
            if (!currentValue || currentValue === '') {
                trigger.className = 'inline-flex items-center justify-center bg-[#050505] border border-white/10 hover:border-white/20 rounded-lg py-1 px-2.5 text-[11px] font-mono text-gray-400 hover:text-white transition-all cursor-pointer';
                trigger.innerHTML = `
                    <span>+ Nota</span>
                    <iconify-icon icon="lucide:plus" class="text-[10px] text-gray-500 ml-1"></iconify-icon>
                `;
            } else {
                const colors = getScoreColor(currentValue);
                trigger.className = 'inline-flex items-center justify-center border rounded-lg py-1 px-2.5 text-[11px] font-mono font-bold transition-all hover:scale-105 cursor-pointer';
                trigger.style.borderColor = `${colors.text}50`;
                trigger.style.backgroundColor = `${colors.text}12`;
                trigger.style.color = colors.text;
                trigger.style.boxShadow = `0 0 10px ${colors.glow}`;
                trigger.style.textShadow = `0 0 4px ${colors.glow}`;
                trigger.innerHTML = `
                    <span>Nota: ${currentValue}</span>
                    <iconify-icon icon="lucide:edit-2" class="text-[9px] ml-1.5 opacity-60"></iconify-icon>
                `;
            }
        }
    } else {
        if (disabled) {
            trigger.disabled = true;
            trigger.style.cursor = 'not-allowed';
            trigger.className = 'flex items-center justify-between w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono uppercase text-gray-500 opacity-60';
            trigger.innerHTML = `<span class="truncate">${currentLabel}</span>`;
        } else {
            trigger.className = 'flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono uppercase text-gray-300 hover:bg-white/10 focus:outline-none focus:border-brand/50 transition-all cursor-pointer';
            trigger.innerHTML = `
                <span class="truncate">${currentLabel}</span>
                <iconify-icon icon="lucide:chevron-down" class="select-chevron text-gray-400 transition-transform duration-300 text-xs flex-shrink-0"></iconify-icon>
            `;
        }
    }
    
    // Create options list container
    const list = document.createElement('div');
    if (isCompact) {
        list.className = 'absolute right-0 mt-1 w-24 select-options-list rounded-xl p-1 hidden flex-col shadow-2xl z-50 border border-white/10 max-h-48 overflow-y-auto animate-[fadeIn_0.15s_ease-out]';
    } else if (shouldPortal) {
        list.className = 'fixed select-options-list rounded-2xl p-2 hidden flex-col shadow-2xl border border-white/10 animate-[fadeIn_0.2s_ease-out]';
        list.style.zIndex = '10050';
        list.style.maxHeight = '18rem';
        list.style.overflowY = 'auto';
    } else {
        list.className = 'absolute left-0 right-0 mt-2 select-options-list rounded-2xl p-2 hidden flex-col shadow-2xl z-50 border border-white/10 animate-[fadeIn_0.2s_ease-out]';
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
        options.forEach(opt => {
            const item = document.createElement('button');
            item.type = 'button';
            if (isCompact) {
                item.className = `w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono transition-colors ${
                    String(opt.value) === String(currentValue)
                        ? 'bg-brand/20 text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`;
            } else {
                let bulletColor = '';
                if (opt.value && STATUS_MAP[opt.value]) {
                    const statusDetails = STATUS_MAP[opt.value];
                    bulletColor = `<span class="w-2 h-2 rounded-full mr-2.5" style="background-color: ${statusDetails.color}; box-shadow: 0 0 6px ${statusDetails.color}"></span>`;
                }
                item.className = `w-full text-left px-4 py-3 rounded-xl flex items-center text-xs font-mono uppercase transition-colors ${
                    String(opt.value) === String(currentValue)
                        ? 'bg-white/10 text-white font-semibold border-l-2 border-brand pl-3'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`;
                item.innerHTML = `${bulletColor}<span class="truncate">${opt.label}</span>`;
            }
            
            if (isCompact) {
                item.textContent = opt.label;
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                list.classList.add('hidden');
                list.classList.remove('flex');
                const chev = trigger.querySelector('.select-chevron');
                if (chev) chev.classList.remove('rotate-180');
                const parentRow = container.closest('.episode-row');
                if (parentRow) parentRow.classList.remove('active-dropdown-row');
                const parentPanel = container.closest('.glass-panel');
                if (parentPanel) parentPanel.classList.remove('active-dropdown-panel');
                onChange(opt.value);
            });
            list.appendChild(item);
        });

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const parentRow = container.closest('.episode-row');
            const parentPanel = container.closest('.glass-panel');
            
            // Close all other custom dropdown lists first
            document.querySelectorAll('.select-options-list').forEach(el => {
                if (el !== list) {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                    const parent = el.__dropdownContainer || el.parentElement;
                    const triggerEl = el.__dropdownTrigger || parent;
                    if (triggerEl) {
                        const chev = triggerEl.querySelector('.select-chevron');
                        if (chev) chev.classList.remove('rotate-180');
                    }
                    const row = parent?.closest?.('.episode-row') || el.closest('.episode-row');
                    if (row) row.classList.remove('active-dropdown-row');
                    const panel = parent?.closest?.('.glass-panel') || el.closest('.glass-panel');
                    if (panel) panel.classList.remove('active-dropdown-panel');
                }
            });

            const isHidden = list.classList.contains('hidden');
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
                list.classList.remove('hidden');
                list.classList.add('flex');
                const chev = trigger.querySelector('.select-chevron');
                if (chev) chev.classList.add('rotate-180');
                if (parentRow) parentRow.classList.add('active-dropdown-row');
                if (parentPanel) parentPanel.classList.add('active-dropdown-panel');
            } else {
                list.classList.add('hidden');
                list.classList.remove('flex');
                const chev = trigger.querySelector('.select-chevron');
                if (chev) chev.classList.remove('rotate-180');
                if (parentRow) parentRow.classList.remove('active-dropdown-row');
                if (parentPanel) parentPanel.classList.remove('active-dropdown-panel');
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

// Open Detail Page
function openAnimeDetail(animeId) {
    const anime = state.animes.find(a => a.id === animeId);
    if (!anime) return;

    state.activeDetailAnimeId = animeId;

    const banner = document.getElementById('featured-banner-wrapper');
    const grid = document.getElementById('anime-grid-section');
    const detailPage = document.getElementById('anime-detail-page');

    // Cinematic page transition — fade out current view, slide in detail
    const transitionOverlay = document.createElement('div');
    transitionOverlay.style.cssText = `
        position:fixed; inset:0; z-index:10001;
        background:#050505;
        opacity:0; pointer-events:none;
        transition: opacity 0.35s cubic-bezier(0.4,0,0.2,1);
    `;
    document.body.appendChild(transitionOverlay);

    requestAnimationFrame(() => {
        transitionOverlay.style.opacity = '1';
    });

    setTimeout(() => {
        if (banner) banner.style.display = 'none';
        if (grid) grid.style.display = 'none';

        if (detailPage) {
            detailPage.classList.remove('hidden');
            detailPage.style.opacity = '0';
            detailPage.style.transform = 'translateY(32px)';
            detailPage.style.transition = 'none';
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Fade overlay out and slide detail page in
        requestAnimationFrame(() => {
            transitionOverlay.style.opacity = '0';
            if (detailPage) {
                detailPage.style.transition = 'opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.34,1.1,0.64,1)';
                detailPage.style.opacity = '1';
                detailPage.style.transform = 'translateY(0)';
            }
            setTimeout(() => {
                transitionOverlay.remove();
                if (detailPage) detailPage.classList.add('page-transition-active');
            }, 450);
        });
    }, 350);

    // Set anime base details
    document.getElementById('detail-banner').src = anime.coverUrl;
    const detailPoster = document.getElementById('detail-poster');
    if (detailPoster) {
        detailPoster.src = anime.coverUrl;
    }
    if (detailPage) initSoftTiltCards(detailPage);
    document.getElementById('detail-title').textContent = anime.title;
    document.getElementById('detail-japanese-title').textContent = anime.japaneseTitle;
    document.getElementById('detail-synopsis').textContent = anime.synopsis;

    // Set Featured Anime Button (Fixar Destaque)
    const featuredBtn = document.getElementById('detail-set-featured-btn');
    if (featuredBtn) {
        const isFeatured = state.featuredAnimeId === animeId;
        if (isFeatured) {
            featuredBtn.className = 'anivoid-action inline-flex items-center gap-1.5 px-3 py-1.5 border border-brand bg-brand text-white text-[10px] font-mono uppercase tracking-widest rounded-full transition-all mt-3 cursor-pointer shadow-lg';
            featuredBtn.innerHTML = `
                <iconify-icon icon="lucide:check-circle" class="text-xs"></iconify-icon>
                <span>Destaque Fixo 🌟</span>
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
    
    // Highlighted Studio Badge
    const studioBadge = document.getElementById('detail-studio');
    if (studioBadge) {
        studioBadge.className = 'group studio-glow px-5 py-2.5 rounded-full text-xs font-mono tracking-widest font-semibold uppercase bg-brand/15 border border-brand text-white inline-flex items-center gap-2.5 cursor-pointer shadow-lg select-none';
        studioBadge.innerHTML = `
            <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            <span class="font-bold tracking-widest text-white/90 group-hover:text-white">${anime.studio || 'Desconhecido'}</span>
            <iconify-icon icon="lucide:arrow-up-right" class="text-white/50 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[11px]"></iconify-icon>
        `;
        studioBadge.onclick = (e) => {
            e.stopPropagation();
            window.switchTabToStudio(anime.studio);
        };
    }
    
    const maxEps = parseInt(anime.episodes) || 0;

    document.getElementById('detail-season').textContent = anime.season;
    document.getElementById('detail-episodes').textContent = maxEps === 1 ? 'Filme' : anime.episodes + ' Episódios';

    const avgScore = state.calculateAverageScore(animeId);
    
    // Render Circular Rating SVGs
    const friendRating = anime.ratings?.[state.currentFriendId];
    const myRating = friendRating || { animation: 0, story: 0, sound: 0, overall: 0, status: 'Plan to Watch', episodesWatched: 0, episodeRatings: {} };
    const myOverall = myRating.overall || 0;

    renderCircularRating('my-rating-overall-container', myOverall);
    renderCircularRating('group-rating-avg-container', avgScore);

    // Genres Tags
    const genresContainer = document.getElementById('detail-genres');
    genresContainer.innerHTML = (anime.genres && Array.isArray(anime.genres)) ? anime.genres.map(g => `<span class="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70 font-mono">${g}</span>`).join('') : '';

    // Active Friend info and Read-Only badge check
    const currentFriend = state.getCurrentFriend();
    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    const isReadOnly = state.currentFriendId !== loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const activeFriendLabel = document.getElementById('active-friend-name-label');
    if (activeFriendLabel) {
        activeFriendLabel.style.color = currentFriend.color;
        const adminBadge = getUserBadgesHtml(currentFriend);
        if (isReadOnly) {
            activeFriendLabel.innerHTML = `${currentFriend.name}${adminBadge} <span class="text-[9px] bg-white/10 text-white/50 border border-white/5 px-2 py-0.5 rounded-md ml-1 font-mono tracking-normal font-normal">Apenas Leitura</span>`;
        } else {
            activeFriendLabel.innerHTML = `<span class="block leading-tight">${currentFriend.name}</span><span class="flex flex-wrap gap-1 mt-1">${adminBadge}</span>`;
        }
    }

    // Render custom status dropdown
    const statusOptions = Object.entries(STATUS_MAP).map(([key, val]) => ({
        value: key,
        label: val.label
    }));
    renderCustomDropdown('status-select-container', statusOptions, myRating.status || 'Plan to Watch', (newStatus) => {
        state.setStatus(anime.id, state.currentFriendId, newStatus);
        openAnimeDetail(anime.id);
        renderAnimeGrid();
        renderFeaturedBanner();
    }, false, isReadOnly, true);

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

    // Render Episodes List with individual checkboxes and rating selectors
    const epListContainer = document.getElementById('detail-episodes-rating-list');
    if (epListContainer) {
        epListContainer.innerHTML = '';
        
        // Remove or adjust scroll limit classes dynamically for movies or short series
        if (maxEps <= 3) {
            epListContainer.classList.remove('overflow-y-auto', 'max-h-[300px]');
            epListContainer.style.overflow = 'visible';
            epListContainer.style.maxHeight = 'none';
        } else {
            epListContainer.classList.add('overflow-y-auto', 'max-h-[300px]');
            epListContainer.style.overflow = '';
            epListContainer.style.maxHeight = '';
        }
        
        const epHeader = epListContainer.previousElementSibling?.querySelector('h3');
        if (epHeader) {
            epHeader.textContent = maxEps === 1 ? 'Avaliar Filme' : 'Avaliar Episódios';
        }

        // Dynamic "Média Geral" display + quick-fill input in header
        const epSectionHeader = epListContainer.previousElementSibling;
        if (epSectionHeader) {
            const existingQuickFill = epSectionHeader.querySelector('.quick-fill-area');
            if (existingQuickFill) existingQuickFill.remove();

            if (maxEps > 1 && !isReadOnly) {
                // Compute avg from episodeRatings directly
                const epVals = Object.values(myRating.episodeRatings || {}).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                const computedAvg = epVals.length > 0 ? parseFloat((epVals.reduce((a,b)=>a+b,0)/epVals.length).toFixed(1)) : null;

                const quickFill = document.createElement('div');
                quickFill.className = 'quick-fill-area flex items-center gap-2 w-full mt-3 p-3 bg-brand/8 border border-brand/20 rounded-xl';
                quickFill.innerHTML = `
                    <iconify-icon icon="lucide:wand-2" class="text-brand text-sm shrink-0"></iconify-icon>
                    <div class="flex-grow min-w-0">
                        <p class="text-[9px] font-mono text-brand/80 uppercase tracking-widest">Nota Geral Rápida</p>
                        <p class="text-[8px] text-gray-500 font-mono">Preenche todos os eps assistidos com essa nota base</p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <span id="quick-fill-avg-label" class="text-[9px] text-gray-400 font-mono" style="${computedAvg !== null ? '' : 'display:none'}">Média atual: <b id="quick-fill-avg-value" class="text-white">${computedAvg !== null ? computedAvg : ''}</b></span>
                        <div id="quick-fill-rating-container" class="relative"></div>
                    </div>
                `;
                epSectionHeader.appendChild(quickFill);

                const qfContainer = quickFill.querySelector('#quick-fill-rating-container');
                qfContainer.innerHTML = `
                    <div class="flex items-center gap-1.5">
                        <input
                            id="quick-fill-input"
                            type="number" min="0" max="10" step="0.1"
                            placeholder="0–10"
                            class="w-16 bg-white/5 border border-brand/30 rounded-lg px-2 py-1.5 text-xs font-mono text-white text-center focus:outline-none focus:border-brand/70 transition-colors"
                        >
                        <button id="quick-fill-btn" class="px-3 py-1.5 rounded-lg bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-colors font-bold">
                            Ok
                        </button>
                    </div>
                `;
                const qfInput = qfContainer.querySelector('#quick-fill-input');
                const qfBtn = qfContainer.querySelector('#quick-fill-btn');
                const applyQuickFill = () => {
                    let val = parseFloat(qfInput.value);
                    if (isNaN(val) || val < 0) return;
                    if (val > 10) val = 10;
                    val = Math.round(val * 10) / 10; // round to 1 decimal place
                    state.setGeneralRating(anime.id, state.currentFriendId, val);
                    openAnimeDetail(anime.id);
                    renderAnimeGrid();
                };
                qfBtn.addEventListener('click', applyQuickFill);
                qfInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyQuickFill(); });
            } else if (maxEps > 1 && isReadOnly) {
                const epVals = Object.values(myRating.episodeRatings || {}).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                const computedAvg = epVals.length > 0 ? parseFloat((epVals.reduce((a,b)=>a+b,0)/epVals.length).toFixed(1)) : null;
                if (computedAvg !== null) {
                    const avgBadge = document.createElement('div');
                    avgBadge.className = 'quick-fill-area mt-2 text-[9px] font-mono text-gray-400';
                    avgBadge.textContent = `Média dos eps: ${computedAvg}`;
                    epSectionHeader.appendChild(avgBadge);
                }
            }
        }

        const mediaGeralSpan = epListContainer.previousElementSibling?.querySelector('span.media-geral-span');
        if (mediaGeralSpan) {
            mediaGeralSpan.style.display = maxEps === 1 ? 'none' : 'inline';
        }

        if (maxEps === 0) {
            epListContainer.innerHTML = `
                <div class="py-4 text-center text-gray-500 font-light text-xs italic">
                    Nenhum episódio cadastrado.
                </div>
            `;
        } else if (maxEps === 1) {
            const isWatched = 1 <= myEpsWatched;
            const epRating = myRating.episodeRatings?.[1] || '';
            
            const row = document.createElement('div');
            row.className = `episode-row flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 gap-4 ${isWatched ? 'watched-active' : ''} ${isReadOnly ? 'opacity-80' : ''}`;
            row.style.animationDelay = '0.04s';
            
            row.innerHTML = `
                <div class="flex items-center gap-3">
                    <label class="relative flex items-center cursor-pointer select-none group ${isReadOnly ? 'pointer-events-none' : ''}">
                        <input type="checkbox" id="ep-checkbox-1" ${isWatched ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} class="sr-only peer">
                        <div class="w-5 h-5 rounded-lg border border-white/20 bg-white/5 peer-checked:bg-brand peer-checked:border-brand peer-checked:box-glow transition-all duration-300 flex items-center justify-center group-hover:border-white/40">
                            <iconify-icon icon="lucide:check" class="text-white text-xs scale-0 peer-checked:scale-100 transition-transform duration-300 font-bold"></iconify-icon>
                        </div>
                    </label>
                    <span class="text-xs font-mono font-medium text-white/80">Marcar como Assistido</span>
                </div>
                
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] text-gray-500 font-mono">Nota do Filme:</span>
                    <div id="ep-rating-container-1" class="relative"></div>
                </div>
            `;
            
            const chk = row.querySelector('#ep-checkbox-1');
            if (!isReadOnly && chk) {
                chk.addEventListener('change', (e) => {
                    state.toggleEpisodeWatched(anime.id, state.currentFriendId, 1, e.target.checked);
                    openAnimeDetail(anime.id);
                });
            }
            
            const epRatingContainer1 = row.querySelector('#ep-rating-container-1');
            const currentVal1 = epRating ? String(epRating) : '';
            epRatingContainer1.innerHTML = `
                <input
                    type="number" min="0" max="10" step="0.5"
                    value="${currentVal1}"
                    placeholder="-"
                    ${isReadOnly ? 'disabled' : ''}
                    class="ep-rating-input w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-brand/60 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30'}"
                    style="appearance:textfield;"
                >
            `;
            if (!isReadOnly) {
                const inp1 = epRatingContainer1.querySelector('input');
                const save1 = () => {
                    let v = parseFloat(inp1.value);
                    if (isNaN(v)) { state.setEpisodeRating(anime.id, state.currentFriendId, 1, ''); }
                    else {
                        v = Math.min(10, Math.max(0, Math.round(v * 10) / 10));
                        inp1.value = v;
                        state.setEpisodeRating(anime.id, state.currentFriendId, 1, v);
                    }
                    renderAnimeGrid();
                        // Update avg label live
                        const allEpInputs = document.querySelectorAll('.ep-rating-input');
                        const epValsLive = Array.from(allEpInputs).map(el => parseFloat(el.value)).filter(n => !isNaN(n) && n > 0);
                        const avgLabelEl = document.getElementById('quick-fill-avg-label');
                        const avgValEl = document.getElementById('quick-fill-avg-value');
                        if (avgLabelEl && avgValEl) {
                            if (epValsLive.length > 0) {
                                const liveAvg = Math.round((epValsLive.reduce((a,b)=>a+b,0)/epValsLive.length) * 10) / 10;
                                avgValEl.textContent = liveAvg;
                                avgLabelEl.style.display = '';
                                // Update the circular rating in the panel
                                renderCircularRating('my-rating-overall-container', liveAvg);
                            } else { avgLabelEl.style.display = 'none'; }
                        }
                };
                inp1.addEventListener('change', save1);
                inp1.addEventListener('keydown', (e) => { if (e.key === 'Enter') { inp1.blur(); } });
            }
            
            epListContainer.appendChild(row);
        } else {
            for (let i = 1; i <= maxEps; i++) {
                const isWatched = i <= myEpsWatched;
                const epRating = myRating.episodeRatings?.[i] || '';
                
                const row = document.createElement('div');
                row.className = `episode-row flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 gap-4 ${isWatched ? 'watched-active' : ''} ${isReadOnly ? 'opacity-80' : ''}`;
                row.style.animationDelay = `${i * 0.04}s`;
                
                row.innerHTML = `
                    <div class="flex items-center gap-3">
                        <!-- Custom animated checkmark peer selector -->
                        <label class="relative flex items-center cursor-pointer select-none group ${isReadOnly ? 'pointer-events-none' : ''}">
                            <input type="checkbox" id="ep-checkbox-${i}" ${isWatched ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''} class="sr-only peer">
                            <div class="w-5 h-5 rounded-lg border border-white/20 bg-white/5 peer-checked:bg-brand peer-checked:border-brand peer-checked:box-glow transition-all duration-300 flex items-center justify-center group-hover:border-white/40">
                                <iconify-icon icon="lucide:check" class="text-white text-xs scale-0 peer-checked:scale-100 transition-transform duration-300 font-bold"></iconify-icon>
                            </div>
                        </label>
                        <span class="text-xs font-mono font-medium text-white/80">Ep. ${String(i).padStart(2, '0')}</span>
                    </div>
                    
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] text-gray-500 font-mono">Nota:</span>
                        <div id="ep-rating-container-${i}" class="relative"></div>
                    </div>
                `;
                
                const chk = row.querySelector(`#ep-checkbox-${i}`);
                if (!isReadOnly && chk) {
                    chk.addEventListener('change', (e) => {
                        state.toggleEpisodeWatched(anime.id, state.currentFriendId, i, e.target.checked);
                        openAnimeDetail(anime.id);
                    });
                }
                
                const epRatingContainerI = row.querySelector(`#ep-rating-container-${i}`);
                const currentValI = epRating ? String(epRating) : '';
                epRatingContainerI.innerHTML = `
                    <input
                        type="number" min="0" max="10" step="0.5"
                        value="${currentValI}"
                        placeholder="-"
                        ${isReadOnly ? 'disabled' : ''}
                        class="ep-rating-input w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-brand/60 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30'}"
                        style="appearance:textfield;"
                    >
                `;
                if (!isReadOnly) {
                    const inpI = epRatingContainerI.querySelector('input');
                    const epIndex = i;
                    const saveI = () => {
                        let v = parseFloat(inpI.value);
                        if (isNaN(v)) { state.setEpisodeRating(anime.id, state.currentFriendId, epIndex, ''); }
                        else {
                            v = Math.min(10, Math.max(0, Math.round(v * 10) / 10));
                            inpI.value = v;
                            state.setEpisodeRating(anime.id, state.currentFriendId, epIndex, v);
                        }
                        renderAnimeGrid();
                        // Update avg label live
                        const allEpInputs = document.querySelectorAll('.ep-rating-input');
                        const epValsLive = Array.from(allEpInputs).map(el => parseFloat(el.value)).filter(n => !isNaN(n) && n > 0);
                        const avgLabelEl = document.getElementById('quick-fill-avg-label');
                        const avgValEl = document.getElementById('quick-fill-avg-value');
                        if (avgLabelEl && avgValEl) {
                            if (epValsLive.length > 0) {
                                const liveAvg = Math.round((epValsLive.reduce((a,b)=>a+b,0)/epValsLive.length) * 10) / 10;
                                avgValEl.textContent = liveAvg;
                                avgLabelEl.style.display = '';
                                // Update the circular rating in the panel
                                renderCircularRating('my-rating-overall-container', liveAvg);
                            } else { avgLabelEl.style.display = 'none'; }
                        }
                    };
                    inpI.addEventListener('change', saveI);
                    inpI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { inpI.blur(); } });
                }
                
                epListContainer.appendChild(row);
            }
        }
    }

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
                    <img src="${rel.coverUrl}" class="w-10 h-12 object-cover rounded-md" alt="${rel.title}">
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
                        <p class="font-semibold text-white" style="color: ${friend.color}">${friend.name}${adminBadge}</p>
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

// Render comments section dynamically matching the crimson glassmorphic styling
function renderComments(anime) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    commentsList.innerHTML = '';
    
    // Populate current logged-in user profile info in the comment input box
    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    const currentUser = state.friends.find(f => f.name.toLowerCase() === loggedInUsername.toLowerCase()) || { name: loggedInUsername || 'Você', avatar: '👤', color: '#ff4500' };
    const commentAuthorContainer = document.getElementById('comment-input-author-container');
    if (commentAuthorContainer) {
        const authorAvatarHtml = currentUser.avatar && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http'))
            ? `<img src="${currentUser.avatar}" class="w-12 h-12 rounded-full object-cover shrink-0" alt="">`
            : `<div class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">${currentUser.avatar || '👤'}</div>`;
            
        const curUserAdminBadge = getUserBadgesHtml(currentUser);
        commentAuthorContainer.innerHTML = `
            ${authorAvatarHtml}
            <div class="space-y-0.5">
                <h4 class="text-[9px] font-mono uppercase tracking-[0.15em] text-gray-400">Escreva sua Review</h4>
                <p class="text-[15px] font-bold font-mono leading-tight" style="color: ${currentUser.color}">${currentUser.name}${curUserAdminBadge} <span class="text-[10px] text-gray-500 font-normal font-sans">(Você)</span></p>
            </div>
        `;
    }
    
    const comments = anime.comments || [];
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="py-6 text-center text-gray-500 font-light text-xs italic bg-white/5 border border-white/5 rounded-2xl">
                Nenhuma review deixada ainda. Seja o primeiro a comentar!
            </div>
        `;
        return;
    }

    // Sort comments by timestamp (newest first)
    const sortedComments = [...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedComments.forEach(comment => {
        // Try to find author in friends first, then fall back to registeredUsers
        let friend = state.friends.find(f => f.id === comment.friendId);
        if (!friend) {
            try {
                const regUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                const regUser = regUsers.find(u => u && u.username &&
                    u.username.toLowerCase().replace(/[^a-z0-9]/g, '') === comment.friendId);
                if (regUser) {
                    friend = {
                        id: comment.friendId,
                        name: regUser.username,
                        avatar: regUser.avatar || '👤',
                        color: regUser.color || '#7f8c8d'
                    };
                }
            } catch(e) {}
        }
        if (!friend) {
            friend = { id: comment.friendId, avatar: '👤', name: comment.friendName || 'Desconhecido', color: '#7f8c8d' };
        }

        // Get this user's overall score for this anime
        const userRating = anime.ratings?.[comment.friendId];
        const userScore = userRating?.overall > 0 ? userRating.overall : null;
        let dateText = '';
        try {
            const date = new Date(comment.timestamp);
            dateText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { dateText = ''; }

        const div = document.createElement('div');
        const isAdminComment = comment.friendId && comment.friendId.toLowerCase() === 'felipe';
        div.className = `glass-panel border rounded-2xl p-4 space-y-2.5 animate-[fadeIn_0.3s_ease-out] ${isAdminComment ? 'border-brand/35 shadow-[0_0_15px_rgba(255,69,0,0.12)] bg-brand/[0.03]' : 'border-white/5'}`;

        const avatarHtml = friend.avatar && (friend.avatar.startsWith('data:') || friend.avatar.startsWith('http'))
            ? `<img src="${friend.avatar}" class="w-11 h-11 rounded-full object-cover shrink-0" alt="">`
            : `<div class="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">${friend.avatar || '👤'}</div>`;

        const isMyComment = loggedInUsername && comment.friendId && comment.friendId.toLowerCase() === loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
        const myActionsHtml = isMyComment ? `
            <button class="edit-comment-btn hover:text-brand transition-colors flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 text-gray-500">
                <iconify-icon icon="lucide:edit-3" class="text-[10px]"></iconify-icon><span class="text-[10px] font-mono"> Editar</span>
            </button>
            <span class="text-white/10 text-[10px]">|</span>
            <button class="delete-comment-btn hover:text-red-500 transition-colors flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 text-gray-500">
                <iconify-icon icon="lucide:trash-2" class="text-[10px]"></iconify-icon><span class="text-[10px] font-mono"> Apagar</span>
            </button>
            <span class="text-white/10 text-[10px]">|</span>
        ` : '';

        const adminBadgeHtml = getUserBadgesHtml(friend);
        const repliesCount = (comment.replies || []).length;
        const repliesLabel = repliesCount > 0 ? `${repliesCount} resposta${repliesCount > 1 ? 's' : ''}` : 'Responder';
        const commentLikes = Array.isArray(comment.likes) ? comment.likes.map(normalizeProfileId).filter(Boolean) : [];
        const likedByMe = commentLikes.includes(getLoggedInProfileId());
        const likeLabel = commentLikes.length > 0 ? `${commentLikes.length}` : 'Curtir';

        // Score badge shown next to the commenter's name
        let scoreBadgeHtml = '';
        if (userScore !== null && userScore !== undefined) {
            const scoreColorInfo = getScoreColor(userScore);
            scoreBadgeHtml = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ml-1.5" style="background: ${scoreColorInfo.text}18; border: 1px solid ${scoreColorInfo.text}40; color: ${scoreColorInfo.text}; text-shadow: 0 0 6px ${scoreColorInfo.glow}">★ ${userScore}</span>`;
        }

        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    ${avatarHtml}
                    <span class="font-mono text-sm font-bold" style="color: ${friend.color}">${friend.name}${adminBadgeHtml}${scoreBadgeHtml}</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-2 text-[10px] mr-1">
                        ${myActionsHtml}
                        <button class="like-comment-btn ${likedByMe ? 'active' : ''} flex items-center gap-1 text-gray-500 hover:text-brand transition-colors cursor-pointer bg-transparent border-none p-0 font-mono" title="Curtir review">
                            <iconify-icon icon="lucide:heart" class="text-[11px]"></iconify-icon>
                            <span>${likeLabel}</span>
                        </button>
                        <span class="text-white/10 text-[10px]">|</span>
                        <button class="reply-toggle-btn flex items-center gap-1 text-gray-500 hover:text-brand transition-colors cursor-pointer bg-transparent border-none p-0 font-mono">
                            <iconify-icon icon="lucide:message-circle" class="text-[11px]"></iconify-icon>
                            <span class="reply-btn-label">${repliesLabel}</span>
                        </button>
                    </div>
                    <span class="text-[9px] text-gray-500 font-mono">${dateText}</span>
                </div>
            </div>
            <div class="comment-content-container">
                <p class="text-xs text-gray-300 font-light leading-relaxed whitespace-pre-wrap comment-text">${comment.comment}</p>
            </div>

            <!-- Replies section: auto-visible when there are replies -->
            <div class="replies-section mt-1${repliesCount > 0 ? '' : ' hidden'}">
                <!-- Existing replies -->
                <div class="replies-list space-y-2 mb-3 pl-4 border-l-2 border-white/8">
                    ${(comment.replies || []).map(reply => {
                        const rf = state.friends.find(f => f.id === reply.friendId) || { avatar: '👤', name: reply.friendName || '?', color: '#7f8c8d' };
                        let rDate = '';
                        try { const d = new Date(reply.timestamp); rDate = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' às ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); } catch(e){}
                        const rAvatar = rf.avatar && (rf.avatar.startsWith('data:') || rf.avatar.startsWith('http'))
                            ? `<img src="${rf.avatar}" class="w-7 h-7 rounded-full object-cover shrink-0" alt="">`
                            : `<div class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">${rf.avatar || '👤'}</div>`;
                        const rBadge = getUserBadgesHtml(rf);
                        return `
                            <div class="flex gap-2.5 py-2" data-reply-id="${reply.id}">
                                ${rAvatar}
                                <div class="flex-grow min-w-0">
                                    <div class="flex items-center justify-between gap-2 mb-0.5">
                                        <span class="font-mono text-[11px] font-bold" style="color:${rf.color}">${rf.name}${rBadge}</span>
                                        <span class="text-[9px] text-gray-600 font-mono shrink-0">${rDate}</span>
                                    </div>
                                    <p class="text-[11px] text-gray-300 font-light leading-relaxed">${reply.reply}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <!-- Reply input -->
                <div class="reply-input-area flex gap-2.5 items-start">
                    <div class="reply-user-avatar-slot w-7 h-7 shrink-0"></div>
                    <div class="flex-grow relative">
                        <textarea class="reply-textarea w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-brand/40 focus:bg-white/8 resize-none font-sans transition-all duration-200" rows="2" placeholder="Escreva uma resposta..."></textarea>
                        <div class="flex justify-end mt-1.5 gap-2">
                            <button class="cancel-reply-btn px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer uppercase tracking-wide">Cancelar</button>
                            <button class="submit-reply-btn px-3 py-1 rounded-lg bg-brand text-white text-[9px] font-mono font-semibold hover:bg-brand/80 hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wide shadow-[0_2px_8px_rgba(255,69,0,0.3)]">Enviar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ── Reply toggle logic ─────────────────────────────────────────────────
        const replyToggleBtn = div.querySelector('.reply-toggle-btn');
        const repliesSection = div.querySelector('.replies-section');
        const replyTextarea = div.querySelector('.reply-textarea');
        const cancelReplyBtn = div.querySelector('.cancel-reply-btn');
        const submitReplyBtn = div.querySelector('.submit-reply-btn');
        const replyBtnLabel = div.querySelector('.reply-btn-label');
        const replyAvatarSlot = div.querySelector('.reply-user-avatar-slot');
        const likeCommentBtn = div.querySelector('.like-comment-btn');

        if (likeCommentBtn) {
            likeCommentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCommentLike(anime.id, comment.id);
            });
        }

        // Fill current user avatar in reply box
        const cuAvatar = currentUser.avatar;
        if (replyAvatarSlot) {
            replyAvatarSlot.innerHTML = cuAvatar && (cuAvatar.startsWith('data:') || cuAvatar.startsWith('http'))
                ? `<img src="${cuAvatar}" class="w-7 h-7 rounded-full object-cover" alt="">`
                : `<div class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base">${cuAvatar || '👤'}</div>`;
        }

        replyToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Always open the section (never close it if it has replies)
            repliesSection.classList.remove('hidden');
            replyTextarea.focus();
        });

        cancelReplyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            replyTextarea.value = '';
            // Only hide section if there are no existing replies
            if ((comment.replies || []).length === 0) {
                repliesSection.classList.add('hidden');
            }
        });

        submitReplyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const replyText = replyTextarea.value.trim();
            if (!replyText) return;
            const authorId = loggedInUsername ? loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '') : state.currentFriendId;
            state.addReply(anime.id, comment.id, authorId, replyText);

            // Inject the new reply directly into the DOM (avoid full re-render that collapses replies)
            const newReply = comment.replies[comment.replies.length - 1];
            const rf = currentUser;
            const rAvatar = rf.avatar && (rf.avatar.startsWith('data:') || rf.avatar.startsWith('http'))
                ? `<img src="${rf.avatar}" class="w-7 h-7 rounded-full object-cover shrink-0" alt="">`
                : `<div class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0">${rf.avatar || '👤'}</div>`;
            const rBadge = getUserBadgesHtml(rf);
            const now = new Date();
            const rDate = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' às ' + now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

            const replyEl = document.createElement('div');
            replyEl.className = 'flex gap-2.5 py-2 animate-[fadeIn_0.25s_ease-out]';
            replyEl.dataset.replyId = newReply.id;
            replyEl.innerHTML = `
                ${rAvatar}
                <div class="flex-grow min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-0.5">
                        <span class="font-mono text-[11px] font-bold" style="color:${rf.color}">${rf.name}${rBadge}</span>
                        <span class="text-[9px] text-gray-600 font-mono shrink-0">${rDate}</span>
                    </div>
                    <p class="text-[11px] text-gray-300 font-light leading-relaxed">${newReply.reply}</p>
                </div>
            `;

            const repliesList = div.querySelector('.replies-list');
            if (repliesList) repliesList.appendChild(replyEl);

            // Update button label count
            const count = comment.replies.length;
            if (replyBtnLabel) replyBtnLabel.textContent = `${count} resposta${count > 1 ? 's' : ''}`;

            replyTextarea.value = '';
            replyTextarea.focus();
        });

        // ── Edit & Delete (my comment) ─────────────────────────────────────────
        if (isMyComment) {
            const editBtn = div.querySelector('.edit-comment-btn');
            const deleteBtn = div.querySelector('.delete-comment-btn');
            const contentContainer = div.querySelector('.comment-content-container');
            const originalText = comment.comment;

            if (editBtn && contentContainer) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    contentContainer.innerHTML = `
                        <textarea class="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-brand/40 resize-none font-sans font-light mt-1" rows="3">${originalText}</textarea>
                        <div class="flex justify-end gap-2 mt-2">
                            <button class="cancel-edit-btn px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 text-[9px] font-mono rounded-lg hover:bg-white/10 transition-colors uppercase cursor-pointer">Cancelar</button>
                            <button class="save-edit-btn px-2.5 py-1 bg-brand text-white text-[9px] font-mono rounded-lg hover:bg-brand/80 transition-colors uppercase font-semibold cursor-pointer">Salvar</button>
                        </div>
                    `;
                    const cancelBtn = contentContainer.querySelector('.cancel-edit-btn');
                    const saveBtn = contentContainer.querySelector('.save-edit-btn');
                    const textarea = contentContainer.querySelector('textarea');
                    cancelBtn.addEventListener('click', (ev) => { ev.stopPropagation(); renderComments(anime); });
                    saveBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const updatedText = textarea.value.trim();
                        if (updatedText) { comment.comment = updatedText; state.save(); renderComments(anime); }
                    });
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm("Deseja realmente apagar esta review?")) {
                        anime.comments = anime.comments.filter(c => c.id !== comment.id);
                        state.save();
                        renderComments(anime);
                    }
                });
            }
        }

        commentsList.appendChild(div);
    });
}

function closeAnimeDetail() {
    const banner = document.getElementById('featured-banner-wrapper');
    const grid = document.getElementById('anime-grid-section');
    const detailPage = document.getElementById('anime-detail-page');

    if (detailPage) {
        detailPage.classList.remove('page-transition-active');

        // Slide detail page out
        detailPage.style.transition = 'opacity 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        detailPage.style.opacity = '0';
        detailPage.style.transform = 'translateY(24px)';

        // Fade overlay in
        const transitionOverlay = document.createElement('div');
        transitionOverlay.style.cssText = `
            position:fixed; inset:0; z-index:10001;
            background:#050505;
            opacity:0; pointer-events:none;
            transition: opacity 0.3s cubic-bezier(0.4,0,0.2,1);
        `;
        document.body.appendChild(transitionOverlay);
        requestAnimationFrame(() => { transitionOverlay.style.opacity = '1'; });

        setTimeout(() => {
            detailPage.classList.add('hidden');
            detailPage.style.opacity = '';
            detailPage.style.transform = '';
            detailPage.style.transition = '';
            if (banner) banner.style.display = '';
            if (grid) grid.style.display = '';
            state.activeDetailAnimeId = null;
            renderAnimeGrid();
            renderFeaturedBanner();

            requestAnimationFrame(() => {
                transitionOverlay.style.opacity = '0';
                setTimeout(() => transitionOverlay.remove(), 350);
            });
        }, 300);
    }
}

// Setup Comments logic
function setupCommentForm() {
    const submitBtn = document.getElementById('submit-comment-btn');
    const commentInput = document.getElementById('comment-textarea');

    if (submitBtn && commentInput) {
        submitBtn.addEventListener('click', () => {
            const commentText = commentInput.value;
            if (!commentText.trim() || !state.activeDetailAnimeId) return;

            // Save comment under the logged-in user's ID
            const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
            const authorId = loggedInUsername ? loggedInUsername.toLowerCase().replace(/[^a-z0-9]/g, '') : state.currentFriendId;

            state.addComment(state.activeDetailAnimeId, authorId, commentText);
            commentInput.value = '';

            // Re-render comments list
            const anime = state.animes.find(a => a.id === state.activeDetailAnimeId);
            renderComments(anime);
        });
    }
}

// Forms: Add Anime & Add Friend
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

        addAnimeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('form-anime-title').value;
            const japaneseTitle = document.getElementById('form-anime-jp-title').value;
            const synopsis = document.getElementById('form-anime-synopsis').value;
            const studio = document.getElementById('form-anime-studio').value;
            const season = document.getElementById('form-anime-season').value;
            const episodes = document.getElementById('form-anime-episodes').value;
            const coverUrl = document.getElementById('form-anime-cover').value;
            const studioLogoUrl = document.getElementById('form-studio-logo')?.value || '';
            
            // Genres (comma separated list)
            const genresRaw = document.getElementById('form-anime-genres').value;
            const genres = genresRaw.split(',').map(g => g.trim()).filter(Boolean);

            if (title) {
                state.addNewAnime(title, japaneseTitle, synopsis, genres, studio, season, episodes, coverUrl, studioLogoUrl);
                
                // Reset form and close modal
                addAnimeForm.reset();
                const modal = document.getElementById('add-anime-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }

                // Refresh UI
                renderFilters();
                renderAnimeGrid();
                renderFeaturedBanner();
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

// Global click event listener to dismiss all custom dropdown select overlays when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.select-options-list').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex');
    });
    document.querySelectorAll('.select-chevron').forEach(el => {
        el.classList.remove('rotate-180');
    });
    document.querySelectorAll('.episode-row').forEach(el => {
        el.classList.remove('active-dropdown-row');
    });
    document.querySelectorAll('.glass-panel').forEach(el => {
        el.classList.remove('active-dropdown-panel');
    });
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
                        avatarTrigger.innerHTML = `<img src="${base64Url}" class="w-8 h-8 rounded-full object-cover mx-auto border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.4)]" alt="avatar">`;
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
                    if (!passwordVal || passwordVal.length < 4) {
                        alert('A senha deve conter pelo menos 4 caracteres.');
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
                        
                        <img src="${anime.coverUrl}" class="w-[48px] h-[68px] object-cover rounded-xl border border-white/10 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.6)] z-10" alt="">
                        
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
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            
            const tooltipWidth = tooltip.offsetWidth || 350;
            const tooltipHeight = tooltip.offsetHeight || 220;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            let posX = x;
            let posY = y;
            
            if (x + tooltipWidth > windowWidth) {
                posX = e.clientX - tooltipWidth - 15;
            }
            if (y + tooltipHeight > windowHeight) {
                posY = e.clientY - tooltipHeight - 15;
            }
            
            tooltip.style.left = `${posX}px`;
            tooltip.style.top = `${posY}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            if (!tooltip) return;
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
                    <img src="${anime.coverUrl}" class="w-8 h-10 object-cover rounded shrink-0" alt="">
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
                    <img src="${anime.coverUrl}" class="w-8 h-10 object-cover rounded shrink-0" alt="">
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
            regGate.classList.add('hidden');
            regGate.classList.remove('flex');
        }
        document.body.classList.remove('overflow-hidden');

        if (passwordToRemember) {
            const passwordInput = document.getElementById('login-password');
            if (passwordInput) passwordInput.value = passwordToRemember;
        }

        initUI();
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

    const recoverAccessBtn = document.getElementById('recover-access-btn');
    if (recoverAccessBtn && !recoverAccessBtn.dataset.listenerHooked) {
        recoverAccessBtn.dataset.listenerHooked = 'true';
        recoverAccessBtn.addEventListener('click', async () => {
            const emailVal = document.getElementById('login-email')?.value.trim() || 'mfelipeneto5@gmail.com';
            const recoveryToken = prompt('Digite o código temporário de recuperação configurado no Cloudflare:');
            if (!recoveryToken) return;
            const rawPassword = prompt('Digite a nova senha para esta conta:');
            const newPassword = String(rawPassword || '').trim();
            if (!newPassword || newPassword.length < 4) {
                alert('A senha deve ter pelo menos 4 caracteres.');
                return;
            }
            if (!USE_CLIENT_PASSWORD_PROOF) {
                alert('Recuperação disponível apenas no site da Cloudflare.');
                return;
            }
            try {
                const passwordCredential = await createPasswordCredential(newPassword);
                const response = await fetch(API_BASE_URL + '/api/recover-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailVal,
                        token: recoveryToken,
                        passwordCredential
                    })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.success) {
                    alert(data.error || 'Não foi possível recuperar o acesso agora.');
                    return;
                }
                if (data.user && data.token) {
                    completeAuthenticatedLogin(data, newPassword);
                    alert('Senha atualizada. Voce ja esta conectado.');
                    return;
                }
                const passwordInput = document.getElementById('login-password');
                if (passwordInput) passwordInput.value = newPassword;
                alert('Senha atualizada. Agora clique em Entrar.');
            } catch (err) {
                console.error('Password recovery failed:', err);
                alert('Não foi possível recuperar o acesso agora.');
            }
        });
    }

    if (loginForm && !loginForm.dataset.listenerHooked) {
        loginForm.dataset.listenerHooked = 'true';
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('login-email').value.trim();
            const passwordVal = document.getElementById('login-password').value.trim();

            try {
                const loginResp = await submitLogin(emailVal, passwordVal);
                const loginData = await loginResp.json().catch(() => ({}));

                if (!loginResp.ok || !loginData.user || !loginData.token) {
                    alert(loginData.error || 'E-mail ou senha incorretos! Por favor, tente novamente.');
                    return;
                }

                const matchedUser = stripSensitiveUserFields(loginData.user);
                const userId = matchedUser.username.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (loginData.state) {
                    applyServerStateSnapshot(loginData.state);
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

                // Save logged-in username
                setAuthSession(matchedUser.username, loginData.token);
                state.currentFriendId = userId;
                
                // Reconstruct friends and save/sync
                state.loadLocalSession();
                state.save();

                const regGate = document.getElementById('registration-gate');
                if (regGate) {
                    regGate.classList.add('hidden');
                    regGate.classList.remove('flex');
                }
                document.body.classList.remove('overflow-hidden');

                // Reload UI
                initUI();

                // Show a welcome toast!
                showWelcomeToast(matchedUser.username);

                // Modal only shown on new registration, not on login
            } catch (err) {
                console.error('Login failed:', err);
                alert('Não foi possível entrar agora. Tente novamente em alguns instantes.');
            }
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
                if (!regResp.ok || !regData.user || !regData.token) {
                    alert(regData.error || 'Não foi possível criar sua conta agora.');
                    return;
                }
                setAuthSession(regData.user.username || name, regData.token);
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
                regGate.classList.add('hidden');
                regGate.classList.remove('flex');
            }
            document.body.classList.remove('overflow-hidden');

            // Reload UI
            initUI();

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
                    onclick="document.getElementById('member-welcome-modal').style.opacity='0'; setTimeout(()=>{const m=document.getElementById('member-welcome-modal');if(m)m.remove();document.body.style.overflow='';},400);"
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
            console.log('Real email welcome template dispatched successfully to:', user.email);
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
                <span>Confirmar Inscrição</span>
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
        // Clear previous listener
        const newBtn = modalConfirmBtn.cloneNode(true);
        modalConfirmBtn.parentNode.replaceChild(newBtn, modalConfirmBtn);
        
        newBtn.addEventListener('click', () => {
            newBtn.disabled = true;
            newBtn.innerHTML = `
                <iconify-icon icon="lucide:loader" class="text-xs animate-spin"></iconify-icon>
                <span>Confirmando...</span>
            `;

            setTimeout(() => {
                // Success state
                newBtn.innerHTML = `
                    <iconify-icon icon="lucide:check" class="text-xs"></iconify-icon>
                    <span>Inscrição Confirmada!</span>
                `;
                newBtn.className = 'px-6 py-2.5 rounded-full bg-green-600 text-white transition-all uppercase tracking-widest font-semibold text-[9px] flex items-center gap-2 shadow-[0_4px_15px_rgba(34,197,94,0.3)]';

                // Mark email verified in active profile
                if (state.friends[0]) {
                    state.friends[0].emailVerified = true;
                    
                    // Also update the persistent database record
                    let registeredUsers = [];
                    try {
                        registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
                    } catch (err) {}
                    const userRecord = registeredUsers.find(u => u.email === user.email);
                    if (userRecord) {
                        userRecord.emailVerified = true;
                        storeRegisteredUsers(registeredUsers);
                    }
                }
                state.save();
                updateProfileIndicator();

                // Unveil celebration confetti visually via welcome toast
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    
                    // Show a gorgeous verified success toast
                    const successToast = document.createElement('div');
                    successToast.className = 'fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0a0a0a]/95 backdrop-blur-xl border border-green-500/50 rounded-2xl p-4 w-80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(34,197,94,0.15)] animate-[fadeIn_0.3s_ease-out] transition-all duration-500';
                    successToast.innerHTML = `
                        <div class="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-sm shrink-0">
                            <span>🏅</span>
                        </div>
                        <div class="min-w-0 flex-grow font-mono text-[11px]">
                            <p class="font-bold text-green-500 uppercase tracking-widest text-[9px] mb-0.5">Sucesso</p>
                            <p class="text-white font-serif font-bold text-[12px] truncate leading-tight">E-mail verificado! Insígnia liberada! 🎉</p>
                        </div>
                    `;
                    document.body.appendChild(successToast);
                    setTimeout(() => {
                        successToast.style.opacity = '0';
                        successToast.style.transform = 'translateY(-10px)';
                        setTimeout(() => successToast.remove(), 500);
                    }, 4000);
                }, 1000);

            }, 1200);
        });
    }
}

// --- PROFILE EDITOR MODAL AND CUSTOM THEME STYLES ---

function applyUserThemeColor(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--brand', color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}40`);
}

// ── TITLE PICKER: visual card selector for Felipe's active title ──────────
window.selectAdminTitle = function(title) {
    const hiddenInput = document.getElementById('edit-profile-active-title');
    if (hiddenInput) hiddenInput.value = title;

    const cards = document.querySelectorAll('.title-picker-card');
    cards.forEach(card => {
        const isActive = card.dataset.title === title;
        const checkMark = card.querySelector('.check-mark');
        const checkCircle = card.querySelector('.title-check-icon');

        if (isActive) {
            card.style.transform = 'scale(1.02)';
            card.style.boxShadow = '0 0 20px rgba(255,100,0,0.15), 0 4px 16px rgba(0,0,0,0.4)';
            card.style.opacity = '1';
            if (checkMark) checkMark.classList.remove('hidden');
            if (checkCircle) {
                checkCircle.style.background = 'rgba(255,100,0,0.15)';
                checkCircle.style.borderColor = 'rgba(255,100,0,0.7)';
            }
        } else {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = 'none';
            card.style.opacity = '0.55';
            if (checkMark) checkMark.classList.add('hidden');
            if (checkCircle) {
                checkCircle.style.background = 'transparent';
                checkCircle.style.borderColor = '';
            }
        }
    });
};

function setupEditProfileModal() {

    const openBtn = document.getElementById('open-edit-profile');
    const closeBtn = document.getElementById('close-edit-profile');
    const cancelBtn = document.getElementById('cancel-edit-profile');
    const modal = document.getElementById('edit-profile-modal');
    const form = document.getElementById('edit-profile-form');
    
    const nameInput = document.getElementById('edit-profile-name');
    const emailInput = document.getElementById('edit-profile-email');
    const colorInput = document.getElementById('edit-profile-color');
    
    const avatarInput = document.getElementById('edit-profile-avatar');
    const avatarTrigger = document.getElementById('edit-profile-avatar-trigger');
    const avatarUploadBtn = document.getElementById('edit-profile-avatar-upload-btn');
    const avatarFileInput = document.getElementById('edit-profile-avatar-file');

    if (!modal || !form) return;

    if (avatarTrigger && avatarFileInput) {
        avatarTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarFileInput.click();
        });
    }

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
                    if (avatarInput) avatarInput.value = base64Url;
                    if (avatarTrigger) {
                        avatarTrigger.innerHTML = `<img src="${base64Url}" class="w-8 h-8 rounded-full object-cover mx-auto border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.4)]" alt="avatar">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Open modal
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close the dropdown list first
            const friendsDropdown = document.getElementById('friends-dropdown');
            if (friendsDropdown) {
                friendsDropdown.classList.add('hidden');
                friendsDropdown.classList.remove('flex');
            }

            const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
            let registeredUsers = [];
            try {
                registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
            } catch (err) {}
            
            const user = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
            if (!user) return;

            if (nameInput) {
                nameInput.value = user.username;
                nameInput.disabled = true;
                nameInput.style.cursor = 'not-allowed';
                nameInput.classList.add('opacity-50');
            }
            if (emailInput) emailInput.value = user.email || '';
            if (colorInput) colorInput.value = user.color || '#FF4500';
            if (avatarInput) avatarInput.value = user.avatar || '😎';

            const editTitleContainer = document.getElementById('edit-profile-title-container');
            const isFelipe = user.username && user.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
            if (isFelipe && editTitleContainer) {
                editTitleContainer.classList.remove('hidden');
                // Sync the visual card picker to the saved title
                selectAdminTitle(user.activeTitle || 'admin');
            } else if (editTitleContainer) {
                editTitleContainer.classList.add('hidden');
            }

            // Show current avatar in trigger
            if (avatarTrigger) {
                if (user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))) {
                    avatarTrigger.innerHTML = `<img src="${user.avatar}" class="w-8 h-8 rounded-full object-cover mx-auto border border-white/20" alt="avatar">`;
                } else {
                    avatarTrigger.textContent = user.avatar || '😎';
                }
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
        });
    }

    // Close modal
    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmail = emailInput.value.trim();
        const newColor = colorInput.value;
        const newAvatar = avatarInput.value;

        const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
        let registeredUsers = [];
        try {
            registeredUsers = JSON.parse(localStorage.getItem('anivoid_registered_users')) || [];
        } catch (err) {}
        
        const userRecord = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === loggedInUsername.toLowerCase());
        if (userRecord) {
            userRecord.email = newEmail;
            userRecord.color = newColor;
            userRecord.avatar = newAvatar;
            
            const editTitleSelect = document.getElementById('edit-profile-active-title');
            const isFelipe = userRecord.username && userRecord.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
            if (isFelipe && editTitleSelect) {
                userRecord.activeTitle = editTitleSelect.value;
            }
            
            storeRegisteredUsers(registeredUsers);
        }

        // Reconstruct friends and save/sync
        state.loadLocalSession();
        state.save();
        
        applyUserThemeColor(newColor);
        closeModal();

        // Refresh UI
        initUI();

        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-[#0a0a0a]/95 backdrop-blur-xl border border-brand/50 rounded-2xl p-4 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(255,69,0,0.15)] animate-[fadeIn_0.3s_ease-out] transition-all duration-500';
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand text-sm shrink-0">
                <span>🎨</span>
            </div>
            <div class="min-w-0 flex-grow font-mono text-[11px]">
                <p class="font-bold text-brand uppercase tracking-widest text-[9px] mb-0.5">Sucesso</p>
                <p class="text-white font-serif font-bold text-[12px] truncate leading-tight">Perfil atualizado com sucesso!</p>
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
    if (!searchInput) return;

    // Search query listener
    searchInput.addEventListener('input', () => {
        renderRegisteredUsersSuggestions();
        refreshRegisteredUsersFromServer().then((refreshed) => {
            if (refreshed) renderRegisteredUsersSuggestions();
        });
    });

    // Reset suggestion list on click-outside search input
    document.addEventListener('click', (e) => {
        const listContainer = document.getElementById('registered-users-list');
        if (listContainer && !listContainer.contains(e.target) && e.target !== searchInput) {
            listContainer.classList.add('hidden');
        }
    });
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

        const fetchAnimeMAL = async (query) => {
            const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`);
            if (!response.ok) throw new Error('API request failed');
            const json = await response.json();
            return json.data || [];
        };

        const fetchAnimeMALById = async (malId) => {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
            if (!response.ok) throw new Error('API request failed');
            const json = await response.json();
            return json.data || null;
        };

        // Fetch anime data from Jikan with a few smart aliases for titles MAL stores differently.
        const searchAnimeMAL = async (query) => {
            try {
                const seen = new Set();
                const mergedResults = [];
                const queries = buildAnimeSearchQueries(query);
                const pinnedIds = getPinnedAnimeIdsForSearch(query);
                const addResult = (anime) => {
                    if (!anime) return;
                    const key = anime.mal_id || `${anime.title}-${anime.url}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        mergedResults.push(anime);
                    }
                };

                for (const malId of pinnedIds) {
                    try {
                        addResult(await fetchAnimeMALById(malId));
                    } catch (pinError) {
                        console.warn('MAL pinned anime lookup failed:', malId, pinError);
                    }
                }

                for (const searchQuery of queries) {
                    let results = [];
                    try {
                        results = await fetchAnimeMAL(searchQuery);
                    } catch (queryError) {
                        console.warn('MAL search fallback failed:', searchQuery, queryError);
                        continue;
                    }
                    results.forEach(addResult);
                    if (mergedResults.length >= 10) break;
                }

                return mergedResults.slice(0, 10);
            } catch (e) {
                console.error('Error fetching from MAL:', e);
                return [];
            }
        };

        // Render search results dropdown
        const renderSuggestions = (results) => {
            suggestionsBox.innerHTML = '';
            if (results.length === 0) {
                suggestionsBox.innerHTML = `
                    <div class="p-4 text-center text-white/50 italic select-none">
                        Nenhum anime encontrado.
                    </div>
                `;
                return;
            }

            results.forEach(anime => {
                const title = anime.title_english || anime.title;
                const jpTitle = anime.title_japanese || '';
                const image = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '';
                const type = anime.type || 'TV';
                const eps = anime.episodes ? `${anime.episodes} eps` : '? eps';
                const year = anime.year || (anime.aired?.prop?.from?.year) || '';
                const subtext = [type, eps, year].filter(Boolean).join(' • ');

                const item = document.createElement('div');
                item.className = 'flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer text-left';
                item.innerHTML = `
                    <img src="${image}" class="w-8 h-12 object-cover rounded border border-white/10 shrink-0" alt="">
                    <div class="overflow-hidden">
                        <p class="font-serif font-bold text-white text-xs truncate">${title}</p>
                        <p class="text-[10px] text-gray-500 font-mono mt-0.5 truncate">${subtext}</p>
                    </div>
                `;

                // Handle click on suggestion
                item.addEventListener('click', () => {
                    // Populate inputs
                    document.getElementById('form-anime-title').value = title;
                    document.getElementById('form-anime-jp-title').value = jpTitle;
                    
                    const studioInput = document.getElementById('form-anime-studio');
                    const studioName = anime.studios?.[0]?.name || '';
                    if (studioInput) studioInput.value = studioName;

                    const studioLogoInput = document.getElementById('form-studio-logo');
                    if (studioLogoInput) {
                        studioLogoInput.value = getStudioLogo(studioName) || '';
                        if (!studioLogoInput.value && studioName) {
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

                    // Hide dropdown
                    suggestionsBox.classList.add('hidden');

                    // Visual feedback: brief border pulse on all inputs
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
                        input.style.borderColor = 'rgba(255, 69, 0, 0.6)';
                        input.style.boxShadow = '0 0 10px rgba(255, 69, 0, 0.2)';
                        setTimeout(() => {
                            input.style.borderColor = '';
                            input.style.boxShadow = '';
                        }, 800);
                    });
                });

                suggestionsBox.appendChild(item);
            });
        };

        // Listen for input changes
        animeTitleInput.addEventListener('input', () => {
            const query = animeTitleInput.value.trim();
            clearTimeout(searchDebounceTimeout);

            if (query.length < 3) {
                suggestionsBox.classList.add('hidden');
                return;
            }

            suggestionsBox.classList.remove('hidden');
            suggestionsBox.innerHTML = `
                <div class="p-4 text-center text-white/50 font-mono text-[10px] select-none flex items-center justify-center gap-2">
                    <iconify-icon icon="lucide:loader-2" class="animate-spin text-brand"></iconify-icon>
                    Buscando no MyAnimeList...
                </div>
            `;

            searchDebounceTimeout = setTimeout(async () => {
                const results = await searchAnimeMAL(query);
                renderSuggestions(results);
            }, 450);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!animeTitleInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
            }
        });

        // Handle Escape key to close suggestions
        animeTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                suggestionsBox.classList.add('hidden');
            }
        });
    }

function renderCentralDeAmigos() {
    renderRegisteredUsersSuggestions();
    renderPendingRequests();
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
        listContainer.innerHTML = `<p class="text-gray-500 italic text-[11px] py-2 text-center w-full">Nenhum usuário correspondente encontrado.</p>`;
        return;
    }

    matched.forEach(user => {
        const item = document.createElement('div');
        const isUserAdmin = user.username && user.username.toLowerCase().replace(/[^a-z0-9]/g, '') === 'felipe';
        const adminBadge = getUserBadgesHtml(user);
        item.className = `flex items-center justify-between p-2 rounded-xl gap-3 animate-[fadeIn_0.2s_ease-out] ${isUserAdmin ? 'bg-brand/[0.03] border border-brand/35 shadow-[0_0_12px_rgba(255,69,0,0.08)]' : 'bg-white/5 border border-white/10'}`;
        
        const avatarHtml = user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))
            ? `<img src="${user.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
            : `<span class="text-xl shrink-0">${user.avatar || '👤'}</span>`;

        // Determine status and button
        let actionBtnHtml = '';
        const isFriend = curUser.friends && curUser.friends.some(f => user && user.username && f.toLowerCase() === user.username.toLowerCase());
        const hasSentRequest = user && user.friendRequests && user.friendRequests.some(r => r.from && r.from.toLowerCase() === loggedInUsername.toLowerCase());
        const hasReceivedRequest = curUser.friendRequests && curUser.friendRequests.some(r => r.from && user && user.username && r.from.toLowerCase() === user.username.toLowerCase());

        if (isFriend) {
            actionBtnHtml = `<span class="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">Amigos</span>`;
        } else if (hasReceivedRequest) {
            actionBtnHtml = `
                <button type="button" class="btn-accept px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-mono font-semibold flex items-center justify-center transition-all shrink-0">
                    Aceitar
                </button>
            `;
        } else if (hasSentRequest) {
            actionBtnHtml = `<span class="text-[10px] text-amber-500/70 font-mono uppercase tracking-wider font-semibold flex items-center gap-1"><iconify-icon icon="lucide:clock" class="text-xs"></iconify-icon> Pendente</span>`;
        } else {
            actionBtnHtml = `
                <button type="button" class="btn-add px-2.5 py-1 bg-brand text-white hover:bg-brand/80 rounded-lg text-[10px] font-mono font-semibold flex items-center gap-1 transition-all shrink-0">
                    <iconify-icon icon="lucide:plus" class="text-xs"></iconify-icon>
                    <span>Adicionar</span>
                </button>
            `;
        }

        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                ${avatarHtml}
                <div class="min-w-0 flex-grow">
                    <p class="font-bold text-white text-[11.5px] truncate leading-tight">${user.username}${adminBadge}</p>
                    <p class="text-[9px] text-gray-500 font-mono truncate">${user.email || 'Sem e-mail'}</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
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
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';

    curUser.friendRequests.forEach(req => {
        const sender = registeredUsers.find(u => u && u.username && u.username.toLowerCase() === req.from.toLowerCase()) || {
            username: req.from,
            avatar: '👤',
            color: '#FF4500'
        };

        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-2xl gap-3 animate-[fadeIn_0.2s_ease-out]';
        
        const avatarHtml = sender.avatar && (sender.avatar.startsWith('data:') || sender.avatar.startsWith('http'))
            ? `<img src="${sender.avatar}" class="w-8 h-8 rounded-full object-cover shrink-0" alt="">`
            : `<span class="text-xl shrink-0">${sender.avatar || '👤'}</span>`;

        item.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-grow">
                ${avatarHtml}
                <div class="min-w-0">
                    <p class="font-bold text-white text-[11.5px] truncate leading-tight">${sender.username}</p>
                    <p class="text-[9px] text-gray-500 font-mono font-semibold text-brand/90">Quer ser seu amigo!</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" class="btn-accept w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center transition-colors" title="Aceitar Solicitação">
                    <iconify-icon icon="lucide:check" class="text-sm"></iconify-icon>
                </button>
                <button type="button" class="btn-decline w-8 h-8 bg-red-600/25 hover:bg-red-600/50 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-colors" title="Recusar Solicitação">
                    <iconify-icon icon="lucide:x" class="text-sm"></iconify-icon>
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
    if (type === 'progress' || details.includes('episodio') || details.includes('episÃ³dio')) return { icon: 'lucide:play-circle', emoji: '&#9654;', label: 'Episodio', color: '#38bdf8' };
    if (type === 'comment_add' || details.includes('critica') || details.includes('crÃ­tica')) return { icon: 'lucide:message-circle', emoji: '&#128172;', label: 'Critica', color: '#c084fc' };
    if (type === 'comment_edit') return { icon: 'lucide:pencil', emoji: '&#9999;', label: 'Editou', color: '#fb923c' };
    if (type === 'comment_delete') return { icon: 'lucide:trash-2', emoji: '&#128465;', label: 'Removeu', color: '#f87171' };
    if (type === 'reply_add' || details.includes('respondeu')) return { icon: 'lucide:reply', emoji: '&#8617;', label: 'Resposta', color: '#a78bfa' };
    if (details.includes('concluiu')) return { icon: 'lucide:trophy', emoji: '&#127942;', label: 'Concluiu', color: '#22c55e' };
    if (details.includes('lista')) return { icon: 'lucide:bookmark-plus', emoji: '&#128278;', label: 'Lista', color: '#fb7185' };
    if (details.includes('espera')) return { icon: 'lucide:pause-circle', emoji: '&#9208;', label: 'Espera', color: '#f59e0b' };
    if (details.includes('abandonou')) return { icon: 'lucide:x-circle', emoji: '&#10060;', label: 'Dropou', color: '#ef4444' };
    if (type === 'catalog' || details.includes('catalogo') || details.includes('catÃ¡logo')) return { icon: 'lucide:sparkles', emoji: '&#10024;', label: 'Catalogo', color: '#2dd4bf' };
    return { icon: 'lucide:zap', emoji: '&#9889;', label: 'Acao', color: '#22d3ee' };
}

function renderActivitiesFeed() {
    const list = document.getElementById('activities-feed-list');
    if (!list) return;

    const normalizeActivityUser = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const visibleUserIds = new Set((state.friends || []).map(friend => friend && friend.id).filter(Boolean));
    const loggedInUsername = localStorage.getItem('anivoid_logged_in_username') || '';
    if (loggedInUsername) visibleUserIds.add(normalizeActivityUser(loggedInUsername));

    const seen = new Set();
    const filteredActivities = (state.activities || []).filter(act => {
        if (!act.username) return false;
        const actUserId = normalizeActivityUser(act.username);
        if (!visibleUserIds.has(actUserId)) return false;
        const key = act.id || `${act.username}|${act.type}|${act.animeId}|${act.details}|${act.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const activities = filteredActivities.slice(0, 6);
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
        
        const avatarHtml = act.userAvatar && (act.userAvatar.startsWith('data:') || act.userAvatar.startsWith('http'))
            ? `<img src="${act.userAvatar}" class="w-5 h-5 rounded-full object-cover border border-black/70" alt="">`
            : `<div class="w-5 h-5 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-[10px]">${act.userAvatar || '&#128100;'}</div>`;

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
                    <span class="font-bold truncate" style="color: ${act.userColor}">${act.username}${adminBadgeHtml}</span>
                    <span class="text-[8px] text-gray-500 font-mono shrink-0">${timeText}</span>
                </div>
                <p class="text-gray-400 font-light mt-0.5 leading-relaxed">
                    ${activityPillHtml}
                    <span>${act.details}</span> em 
                    <a href="#anime-grid-section" class="font-mono text-white/90 hover:text-brand font-semibold select-anime-trigger border-b border-dashed border-white/20 hover:border-brand/40 transition-colors" data-id="${act.animeId}">
                        ${act.animeTitle}
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
    initSoftTiltCards(list);
    markViewEntered(list);
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
            statMarName.style.color = maratonista.color;
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
            statRigName.style.color = rigoroso.color;
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
            statEmpName.style.color = empolgado.color;
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
            statEscName.style.color = escritor.color;
        }
        if (statEscVal) statEscVal.innerText = `${escritor.commentsCount} reviews escritas`;
    } else {
        if (statEscName) statEscName.innerText = 'Sem dados';
        if (statEscVal) statEscVal.innerText = '0 reviews';
    }

    // 3. Render Rankings List
    const rankingContainer = document.getElementById('stats-ranking-container');
    if (rankingContainer) {
        rankingContainer.innerHTML = '';
        const sortedRanking = [...userStats].sort((a, b) => b.avgScore - a.avgScore);
        sortedRanking.forEach((u, i) => {
            const row = document.createElement('div');
            row.className = 'space-y-1';
            
            const avatarHtml = u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http'))
                ? `<img src="${u.avatar}" class="w-6 h-6 rounded-full object-cover shrink-0" alt="">`
                : `<span class="text-base shrink-0">${u.avatar || '👤'}</span>`;
                
            const pct = u.avgScore * 10; // Out of 100 for width

            const adminBadgeHtml = getUserBadgesHtml({ username: u.username });
            row.innerHTML = `
                <div class="flex justify-between items-center text-[10.5px]">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="text-[9px] font-mono text-gray-500 w-3">${i + 1}.</span>
                        ${avatarHtml}
                        <span class="font-bold truncate" style="color: ${u.color}">${u.username}${adminBadgeHtml}</span>
                    </div>
                    <span class="font-mono font-bold text-white">${u.avgScore > 0 ? u.avgScore.toFixed(1) : '-'} / 10</span>
                </div>
                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${u.color || '#FF4500'}"></div>
                </div>
            `;
            rankingContainer.appendChild(row);
        });
    }

    // 4. Render Genres Distribution
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
            genresContainer.innerHTML = `<p class="text-gray-500 italic text-[10px] py-4 text-center w-full">Nenhum anime avaliado no grupo ainda.</p>`;
        } else {
            sortedGenres.forEach(([genre, count]) => {
                const row = document.createElement('div');
                row.className = 'space-y-1';
                const pct = (count / maxCount) * 100;

                row.innerHTML = `
                    <div class="flex justify-between items-center text-[10.5px]">
                        <span class="font-mono text-gray-300 font-medium">${genre}</span>
                        <span class="text-[9px] text-gray-500 font-mono">${count} visualizações</span>
                    </div>
                    <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full bg-brand/50 transition-all duration-500" style="width: ${pct}%;"></div>
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
    if (bestConsensus) {
        if (recConsTitle) recConsTitle.innerText = bestConsensus.anime.title;
        if (recConsVal) recConsVal.innerText = `${bestConsensus.avg.toFixed(1)} / 10`;
    } else {
        if (recConsTitle) recConsTitle.innerText = 'Sem consenso ainda';
        if (recConsVal) recConsVal.innerText = '- / 10';
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
            recList.innerHTML = `<p class="text-gray-500 italic text-[10px] py-4 text-center col-span-full">Nenhuma recomendação disponível. Seus amigos precisam dar mais notas!</p>`;
        } else {
            topRecs.forEach(rec => {
                const card = document.createElement('div');
                card.className = 'p-3 bg-white/5 border border-white/5 hover:border-brand/30 hover:bg-white/10 rounded-xl transition-all duration-300 cursor-pointer flex justify-between items-center gap-3 select-none';
                
                card.innerHTML = `
                    <div class="min-w-0 flex-grow">
                        <h5 class="text-[11.5px] font-bold text-white truncate">${rec.anime.title}</h5>
                        <p class="text-[9px] text-gray-500 truncate mt-0.5">Média dos amigos: <b class="text-brand font-mono font-semibold">${rec.avg.toFixed(1)}</b></p>
                    </div>
                    <iconify-icon icon="lucide:chevron-right" class="text-gray-500 text-xs shrink-0"></iconify-icon>
                `;

                card.addEventListener('click', () => {
                    const statsModal = document.getElementById('group-stats-modal');
                    if (statsModal) {
                        statsModal.classList.add('hidden');
                        statsModal.classList.remove('flex');
                        document.body.classList.remove('overflow-hidden');
                    }
                    
                    state.activeDetailAnimeId = rec.anime.id;
                    const banner = document.getElementById('featured-banner-wrapper');
                    const grid = document.getElementById('anime-grid-section');
                    const detailPage = document.getElementById('anime-detail-page');

                    if (banner) banner.style.display = 'none';
                    if (grid) grid.style.display = 'none';
                    if (detailPage) {
                        detailPage.classList.remove('hidden');
                        setTimeout(() => {
                            detailPage.classList.add('page-transition-active');
                        }, 50);
                    }

                    renderAnimeDetail(rec.anime);
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
