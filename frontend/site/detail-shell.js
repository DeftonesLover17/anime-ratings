const { arrow } = require('../shared/dom');

function mountDetailShell(host, finishScene) {
    host.innerHTML = `<div class="av-wrap">
        <div class="av-detail-nav"><button type="button" id="back-to-home-btn" class="av-text-link">${arrow('left')} <span>Voltar ao acervo</span></button><div aria-label="Seções da obra"><a href="#av-about">Sobre</a><a href="#av-notes">Notas</a><a href="#av-community">Reviews</a></div></div>
        <header class="av-detail-header"><div class="av-detail-cover"><img id="detail-poster" src="" width="400" height="600" alt="Capa da obra"></div><div class="av-detail-title-block"><div class="av-eyebrow"><span id="detail-season"></span><span id="detail-episodes"></span></div><h1 id="detail-title"></h1><p id="detail-japanese-title"></p><div class="av-detail-totals"><div><small>Sua nota / perfil selecionado</small><div id="my-rating-overall-container"></div></div><div><small>Média do grupo</small><div id="group-rating-avg-container"></div></div></div><div class="av-detail-utilities"><button type="button" id="detail-set-featured-btn">Fixar no destaque</button><div id="detail-admin-actions" class="hidden"><button type="button" id="detail-edit-anime-btn">Editar obra</button><button type="button" id="detail-delete-anime-btn">Excluir obra</button></div></div></div><button type="button" id="detail-studio" class="av-studio-credit"></button></header>
        <section id="av-about" class="av-detail-synopsis" aria-label="Sinopse"><p class="av-eyebrow">Dentro<br>desta história</p><div><p id="detail-synopsis"></p><div id="detail-genres"></div></div></section>
        <section id="av-notes" aria-labelledby="av-notes-heading"><div class="av-section-title"><div><p class="av-eyebrow">A sua leitura / Notas</p><h2 id="av-notes-heading">O episódio termina.<br>A sua leitura começa.</h2></div><p>Uma nota por episódio. Um registro do que ficou com você.</p></div><div class="av-viewer-row"><div>Avaliando como<div id="active-friend-name-label"></div></div><div id="status-select-container"></div></div><div id="detail-progress-container"><div class="av-progress-meta"><span>Seu percurso</span><span><b id="detail-ep-watched-label">0</b> / <span id="detail-ep-total-label">0</span> episódios</span></div><div class="av-progress-track"><div id="detail-progress-bar"></div></div></div><div id="av-rating-workbench"></div></section>
        <details class="av-group-details"><summary>Notas do grupo e histórico da obra</summary><div><div class="av-group-stats"><div>Assistindo<b id="group-stat-watching">0</b></div><div>Completos<b id="group-stat-completed">0</b></div><div>Em espera<b id="group-stat-onhold">0</b></div><div>Abandonados<b id="group-stat-dropped">0</b></div><div>Planejam assistir<b id="group-stat-plantowatch">0</b></div></div><div id="detail-ratings-breakdown"></div><section id="detail-history-section"><h3 class="av-eyebrow">Histórico da obra</h3><div id="detail-history-list"></div></section></div></details>
        <section id="av-community" class="av-community" aria-labelledby="av-community-title"><div class="av-section-title"><div><p class="av-eyebrow">Leituras / Conversa</p><h2 id="av-community-title">A nota é o começo.<br>O que ficou com você?</h2></div><p>Reviews da obra e comentários sobre os episódios. Com contexto e espaço para conversar.</p></div><div id="av-conversation"></div></section>
        <section id="detail-related-seasons-section" class="hidden"><h3>Continue nesse universo.</h3><div id="detail-related-seasons-list"></div></section>
    </div>`;
    host.querySelectorAll('.av-detail-nav a').forEach((link) =>
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            await finishScene?.();
            document.querySelector(link.getAttribute('href'))?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
                    ? 'instant'
                    : 'smooth',
                block: 'start',
            });
        }),
    );
}

module.exports = { mountDetailShell };
