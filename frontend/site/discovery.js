const {
    escapeHtml: e,
    element,
    imageUrl,
    scoreMarkup,
    arrow,
    attachImageFallbacks,
} = require('../shared/dom');

function resolveStatusKind(rawKey, rawLabel) {
    const text = String(rawKey || rawLabel || '').toLowerCase().trim();
    if (text.includes('complet') || text === 'completed') return 'completed';
    if (text.includes('assist') || text.includes('watch')) return 'watching';
    if (text.includes('espera') || text.includes('hold') || text.includes('paus')) return 'onhold';
    if (text.includes('abandon') || text.includes('drop')) return 'dropped';
    return 'plantowatch';
}

const {
    preloadAnimeLogo,
    scheduleAnimeLogoWarmup,
} = require('./anime-logo-presentation');
const { createAnimeTitleRenderer } = require('./anime-title');

const featuredTitleRenderer = createAnimeTitleRenderer();
let activeFeaturedTitleEl = null;

function bindLogoPreload(target, anime, eagerWarmup = false) {
    if (!target || !anime) return;
    if (eagerWarmup) {
        scheduleAnimeLogoWarmup(anime);
    }
    const trigger = () => preloadAnimeLogo(anime, 'high');
    target.addEventListener('pointerenter', trigger, { once: true, passive: true });
    target.addEventListener('pointerdown', trigger, { once: true, passive: true });
    target.addEventListener('touchstart', trigger, { once: true, passive: true });
    target.addEventListener('focusin', trigger, { once: true, passive: true });
}

function statusFallbackLabel(kind) {
    switch (kind) {
        case 'completed': return 'Completo';
        case 'watching': return 'Assistindo';
        case 'onhold': return 'Em Espera';
        case 'dropped': return 'Abandonado';
        case 'plantowatch':
        default: return 'Planejo assistir';
    }
}


function renderFeatured(container, model, actions) {
    const {
        anime,
        rating,
        groupScore,
        statusLabel,
        collectionSize,
        nextAnime,
    } = model;
    const watched = Number(rating?.episodesWatched) || 0;
    const total = Number(anime.episodes) || 0;
    const heroStatusKey = resolveStatusKind(rating?.status, statusLabel);
    const heroDisplayStatus = statusLabel || statusFallbackLabel(heroStatusKey);
    const root = element(`<div class="av-hero av-wrap">
        <div class="av-hero-topline"><span>Anime. Visto de outro jeito.</span><span>Seu acervo em movimento <i aria-hidden="true"></i></span></div>
        <div class="av-hero-copy">
            <p class="av-eyebrow"><span class="av-index">01</span> Em destaque <span class="av-mini-rule"></span> ${e(anime.season || '')}</p>
            <h1 class="av-hero-title${anime.title.length > 34 ? ' av-hero-title-long' : ''}" data-av-reveal>${e(anime.title)}</h1>
            <div class="av-hero-subline"><span>${e(anime.studio || 'Estúdio não informado')}</span><span>${total === 1 ? 'Filme' : total ? total + ' episódios' : 'Em lançamento'}</span></div>
            <p class="av-hero-synopsis">${e(anime.synopsis || '')}</p>
            <div class="av-hero-actions"><a class="av-button av-button-solid" href="#obra/${encodeURIComponent(anime.id)}" data-open>Entrar na obra ${arrow()}</a><a class="av-text-link" href="#anime-grid-section" data-catalog>Explorar acervo <span>↓</span></a></div>
            <div class="av-hero-rating"><div>${scoreMarkup(rating?.overall)}<span>${e(model.ratingLabel || 'Sua nota')}</span></div><span class="av-vertical-line"></span><div>${scoreMarkup(groupScore)}<span>Média do grupo</span></div><p><span class="av-card-status-badge av-status-${heroStatusKey}"><span class="av-status-dot${heroStatusKey === 'watching' ? ' av-status-dot-pulse' : ''}" aria-hidden="true"></span><span class="av-status-text">${e(heroDisplayStatus)}</span></span><span>${watched} de ${total || '?'} ${total === 1 ? 'filme' : 'episódios'}</span></p></div>
        </div>
        <div class="av-hero-art">
            <div class="av-art-frame" data-av-reveal><span class="av-art-corner" aria-hidden="true">↗</span><a href="#obra/${encodeURIComponent(anime.id)}" data-open aria-label="Abrir ${e(anime.title)}"><img data-av-cover="${e(anime.id)}" src="${e(imageUrl(anime.coverUrl))}" width="600" height="900" fetchpriority="high" alt="Capa de ${e(anime.title)}"></a><span class="av-art-index" aria-hidden="true">01 — ANIVØID</span></div>

        </div>
        <div class="av-hero-bottom"><span>Obras que ficam.<br>Notas que contam.</span><a href="#anime-grid-section" data-catalog><span>${String(collectionSize).padStart(2, '0')} obras no acervo</span><span aria-hidden="true">↓</span></a></div>
    </div>`);
    preloadAnimeLogo(anime, 'high');
    if (nextAnime) scheduleAnimeLogoWarmup(nextAnime);
    const heroTitleEl = root.querySelector('.av-hero-title');
    if (activeFeaturedTitleEl && activeFeaturedTitleEl !== heroTitleEl) {
        featuredTitleRenderer.cancel(activeFeaturedTitleEl);
    }
    activeFeaturedTitleEl = heroTitleEl;
    if (heroTitleEl) {
        featuredTitleRenderer.render(heroTitleEl, anime, {
            isCurrent: () => !root.parentElement || root.parentElement === container,
        });
    }
    root.querySelectorAll('[data-open]').forEach((link) => {
        bindLogoPreload(link, anime, false);
        link.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            actions.open(anime.id, event.detail > 0);
        });
    });
    root.querySelectorAll('[data-catalog]').forEach((link) =>
        link.addEventListener('click', (event) => {
            event.preventDefault();
            actions.catalog();
        }),
    );
    attachImageFallbacks(root);
    container.replaceChildren(root);
}

function createCatalogCard(model, actions, index) {
    const { anime, rating, groupScore, statusLabel } = model;
    const statusKey = resolveStatusKind(model.statusKey || rating?.status, statusLabel);
    const displayStatus = statusLabel || statusFallbackLabel(statusKey);
    const root =
        element(`<article class="av-anime-card" data-anime-id="${e(anime.id)}" data-av-reveal>
        <a class="av-card-poster av-poster-surface" href="#obra/${encodeURIComponent(anime.id)}" aria-label="Abrir ${e(anime.title)}">
            <img data-av-cover="${e(anime.id)}" src="${e(imageUrl(anime.coverUrl))}" width="400" height="600" loading="lazy" decoding="async" alt="Capa de ${e(anime.title)}">
            <span class="av-card-invitation">Entrar na obra ${arrow()}</span>
        </a>
        <div class="av-card-meta"><span>${e(anime.season || 'Sem temporada')}</span>${scoreMarkup(groupScore)}</div>
        <h3><a href="#obra/${encodeURIComponent(anime.id)}">${e(anime.title)}</a></h3>
        <button class="av-card-studio" aria-label="Explorar estúdio ${e(anime.studio || 'Desconhecido')}">${e(anime.studio || 'Estúdio não informado')} <span aria-hidden="true">↗</span></button>
        <p class="av-card-synopsis">${e(anime.synopsis || '')}</p>
        <div class="av-card-personal" data-status="${statusKey}">
            <div class="av-card-status-badge av-status-${statusKey}">
                <span class="av-status-dot${statusKey === 'watching' ? ' av-status-dot-pulse' : ''}" aria-hidden="true"></span>
                <span class="av-status-text">${e(displayStatus)}</span>
            </div>
            <div class="av-card-score-chip" title="${e(model.ratingLabel || 'Sua nota')}">
                <span class="av-card-score-label">${e(model.ratingLabel || 'Sua nota')}</span>
                <span class="av-card-score-value">${scoreMarkup(rating?.overall)}</span>
            </div>
        </div>${model.ownRating ? `<div class="av-card-comparison"><span class="av-card-comparison-label">Sua nota</span><span class="av-card-score-value">${scoreMarkup(model.ownRating.overall)}</span></div>` : ''}
    </article>`);
    bindLogoPreload(root, anime, typeof index === 'number' && index < 24);
    root.querySelectorAll('a').forEach((link) =>
        link.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            actions.open(anime.id, event.detail > 0);
        }),
    );
    root.querySelector('.av-card-studio').addEventListener('click', (event) =>
        actions.studio(anime.studio, event.detail > 0),
    );
    attachImageFallbacks(root);
    return root;
}

function renderRecommendations(container, recommendations, actions) {
    const fragment = document.createDocumentFragment();
    recommendations.forEach((item, index) => {
        const card = element(
            `<a class="av-recommendation" href="#obra/${encodeURIComponent(item.anime.id)}"><span class="av-recommendation-index">0${index + 1}</span><img src="${e(imageUrl(item.anime.coverUrl))}" width="96" height="144" loading="lazy" alt=""><div><span class="av-eyebrow">${e(item.anime.studio || '')}</span><h4>${e(item.anime.title)}</h4><p>${e(item.reason)}</p></div>${arrow()}</a>`,
        );
        bindLogoPreload(card, item.anime, true);
        card.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            actions.open(item.anime.id, event.detail > 0);
        });
        attachImageFallbacks(card);
        fragment.append(card);
    });
    container.replaceChildren(fragment);
}

module.exports = { renderFeatured, createCatalogCard, renderRecommendations };
