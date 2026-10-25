const {
    escapeHtml: e,
    element,
    imageUrl,
    scoreMarkup,
    arrow,
    attachImageFallbacks,
} = require('../shared/dom');
const { createCatalogCard } = require('./discovery');

function renderDirectory(container, studios, actions) {
    const root = element(
        `<div class="av-studios"><header class="av-studios-heading"><button class="av-text-link" data-back>${arrow('left')} Voltar ao acervo</button><p class="av-eyebrow">Por trás das histórias / ${studios.length} estúdios</p><h2>O traço.<br>A assinatura.</h2><p>Explore as obras pelos estúdios que dão forma a cada universo.</p></header><div class="av-studio-grid"></div></div>`,
    );
    root.querySelector('[data-back]').addEventListener('click', () =>
        actions.back(),
    );
    const grid = root.querySelector('.av-studio-grid');
    studios.forEach((studio, index) => {
        const card = element(
            `<a class="av-studio-card" href="#estudio/${encodeURIComponent(studio.name)}" data-av-reveal style="--item-idx:${index};"><div class="av-studio-mark">${
                studio.logo
                    ? `<img src="${e(imageUrl(studio.logo))}" data-av-studio="${e(studio.name)}" width="300" height="180" loading="lazy" alt="Logo de ${e(studio.name)}">`
                    : `<span class="av-studio-fallback-monogram">${e(
                          String(studio.name || '').split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('') || '—',
                      )}</span>`
            }</div><div class="av-studio-card-body"><h3 class="av-studio-name">${e(studio.name)}</h3><div class="av-studio-card-meta"><span>${studio.animes.length} ${studio.animes.length === 1 ? 'obra' : 'obras'} no acervo</span>${scoreMarkup(studio.average)}</div></div></a>`,
        );
        card.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            actions.studio(studio.name, event.detail > 0);
        });
        attachImageFallbacks(card);
        grid.append(card);
    });
    container.replaceChildren(root);
}

function renderProfile(container, model, actions) {
    const genres = [
        ...new Set(model.animes.flatMap((anime) => anime.genres || [])),
    ].slice(0, 5);
    const root = element(
        `<div class="av-studio-profile"><button type="button" class="av-text-link av-studio-back">${arrow('left')} Todos os estúdios</button><header class="av-studio-profile-header"><div class="av-studio-profile-logo av-poster-surface">${
            model.logo
                ? `<img src="${e(imageUrl(model.logo))}" data-av-studio="${e(model.name)}" width="500" height="300" alt="Logo de ${e(model.name)}">`
                : `<span>${e(
                      String(model.name || '').split(' ').filter(Boolean).map((word) => word[0]).slice(0, 2).join('') || '—',
                  )}</span>`
        }</div><div><p class="av-eyebrow">Estúdio de animação / Arquivo ANIVØID</p><h2>${e(model.name)}</h2><div class="av-studio-facts"><div><b>${String(model.animes.length).padStart(2, '0')}</b><span>Obras no acervo</span></div><div>${scoreMarkup(model.average)}<span>Média do grupo</span></div></div></div></header><div class="av-studio-story"><p class="av-eyebrow">A assinatura<br>por trás da obra.</p><div><p>${e(model.description)}</p><div class="av-genre-line">${genres.map((genre) => '<span>' + e(genre) + '</span>').join('')}</div></div></div><div class="av-section-title"><h3>Um estúdio.<br>Outros universos.</h3><span>Produções / ${String(model.animes.length).padStart(2, '0')}</span></div><div class="av-studio-catalog"></div></div>`,
    );
    root.querySelector('.av-studio-back').addEventListener('click', () =>
        actions.allStudios(),
    );
    const grid = root.querySelector('.av-studio-catalog');
    model.animes.forEach((anime, index) =>
        grid.append(
            createCatalogCard(
                {
                    anime,
                    rating: model.rating(anime),
                    groupScore: model.averageFor(anime),
                    statusLabel: model.status(anime),
                },
                actions,
                index,
            ),
        ),
    );
    attachImageFallbacks(root);
    container.replaceChildren(root);
}

function renderCredit(button, { name, logo }, open) {
    if (!name || name === 'Desconhecido' || name === 'Estúdio não informado') {
        button.style.display = 'none';
        return;
    }
    button.style.display = '';
    button.className = 'av-studio-credit';
    button.setAttribute('aria-label', `Explorar estúdio ${name}`);
    button.setAttribute('title', `Explorar estúdio ${name}`);
    button.innerHTML = `<span class="av-credit-logo">${logo ? `<img src="${e(imageUrl(logo))}" data-av-studio="${e(name)}" width="200" height="120" decoding="async" alt="">` : '<span class="av-credit-initials" aria-hidden="true">' + e(String(name).slice(0, 2).toUpperCase()) + '</span>'}</span><strong class="av-credit-name">${e(name)}</strong>`;
    button.onclick = (event) => open(name, event.detail > 0);
    attachImageFallbacks(button);
}

module.exports = { renderDirectory, renderProfile, renderCredit };
