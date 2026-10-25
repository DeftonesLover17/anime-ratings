const {
    element,
    escapeHtml: e,
    formatScore,
    scoreMarkup,
    arrow,
} = require('../shared/dom');
const { scoreColor } = require('../ui/rating-scale');
const {
    parseScore,
    episodeWatched,
    initialEpisode,
    episodeWindow,
} = require('./model');

function createWorkbench(host, initialModel, shared) {
    let model = initialModel;
    let disposed = false;
    let busy = false;
    let undo;
    const total = Math.max(0, Number(model.anime.episodes) || 0);
    const identity = model.anime.id + ':' + model.profileId;
    let selected = Math.min(
        total || 1,
        shared.selections.get(identity) ||
            initialEpisode(model.getRating(), total),
    );
    const draftKey = (episode) => identity + ':' + episode;
    if (!total) {
        host.innerHTML =
            '<p class="av-empty">Os episódios desta obra ainda não foram cadastrados.</p>';
        return { update() {}, destroy() {} };
    }
    const root =
        element(`<div class="av-workbench ${total === 1 ? 'av-workbench-film' : ''}" data-lenis-prevent="true">
        <aside class="av-episode-index" aria-label="Selecionar episódio" data-lenis-prevent="true"><div class="av-rail-heading"><h3>Episódios</h3><span>${String(total).padStart(2, '0')}</span></div><div class="av-episode-buttons" role="group" aria-label="Índice de episódios" data-lenis-prevent="true"></div><label class="av-mobile-picker">Selecionar episódio<select aria-label="Selecionar episódio para avaliar"></select></label><div class="av-episode-pagination"><button type="button" data-page="-1" aria-label="Episódios anteriores">${arrow('left')}</button><span></span><button type="button" data-page="1" aria-label="Próximos episódios">${arrow('right')}</button></div><p class="av-quiet">Uma nota por episódio.<br>Uma leitura que é só sua.</p></aside>
        <div class="av-rating-editor"><div class="av-editor-heading"><div><p class="av-eyebrow">${total === 1 ? 'Registro de filme' : 'Registro de episódio'}</p><h3 id="av-editor-title"></h3></div><label class="av-watched"><input type="checkbox"><span>Assistido</span></label></div>
        <form class="av-rating-form" novalidate><label for="av-score-input" class="av-score-label"></label><div class="av-score-row"><div><input id="av-score-input" name="score" type="text" inputmode="decimal" autocomplete="off" maxlength="5" placeholder="—" aria-describedby="av-score-help av-score-error"><span>/ 10</span></div><div class="av-step-buttons"><button type="button" data-step="-.1" aria-label="Diminuir nota em 0,1">−</button><button type="button" data-step=".1" aria-label="Aumentar nota em 0,1">+</button></div></div><input class="av-score-range" type="range" min=".1" max="10" step=".1" aria-label="Ajustar a nota"><div class="av-scale-labels"><span>0,1</span><span>Escala / 10</span><span>10</span></div><p id="av-score-help" class="av-quiet">Digite com vírgula ou ponto. Ajustes em passos de 0,1.</p><p id="av-score-error" class="av-field-error" role="alert"></p><div class="av-editor-actions"><button type="submit" class="av-button av-button-accent">Salvar nota ${arrow()}</button><button type="button" class="av-button av-button-outline" data-next>Próximo episódio ${arrow('right')}</button></div></form>
        <div class="av-save-feedback" role="status" aria-live="polite">${model.readOnly ? 'Você está consultando as notas de ' + e(model.profileName) + '.' : 'Sua avaliação fica vinculada à sua conta.'}</div><button class="av-text-link av-retry" type="button" hidden>Tentar sincronizar novamente</button>
        <div class="av-rating-tools"><button type="button" data-revert>Reverter rascunho</button><button type="button" data-remove>Remover nota</button><button type="button" data-undo hidden>Desfazer última alteração</button></div>
        <details class="av-bulk"><summary>Aplicar uma nota a vários episódios</summary><form><label for="av-bulk-score">Nota de 1 a 10</label><div><input id="av-bulk-score" name="bulkScore" type="number" min="1" max="10" step=".1" placeholder="Ex.: 8,5"><button class="av-button av-button-outline" type="submit">Aplicar</button></div><p class="av-quiet"></p><span role="alert"></span></form></details></div>
    </div>`);
    host.replaceChildren(root);
    const $ = (selector) => root.querySelector(selector);
    const input = $('#av-score-input');
    const range = $('.av-score-range');
    const save = $('.av-rating-form [type=submit]');
    const feedback = $('.av-save-feedback');
    const checkbox = $('.av-watched input');
    const rail = $('.av-episode-buttons');
    const picker = $('.av-mobile-picker select');
    const error = $('#av-score-error');
    const next = $('[data-next]');
    const retry = $('.av-retry');
    const rating = () => model.getRating() || {};
    const committed = (episode) =>
        Number(rating().episodeRatings?.[episode]) > 0
            ? Number(rating().episodeRatings[episode])
            : null;
    const currentDraft = () =>
        shared.drafts.has(draftKey(selected))
            ? shared.drafts.get(draftKey(selected))
            : committed(selected) === null
              ? ''
              : formatScore(committed(selected));

    function paint() {
        const value = parseScore(input.value);
        root.style.setProperty('--av-rating-color', scoreColor(value).text);
        const valid = value !== undefined;
        const dirty = valid && value !== committed(selected);
        save.disabled = busy || model.readOnly || !dirty;
        $('[data-revert]').disabled =
            busy || !shared.drafts.has(draftKey(selected));
        $('[data-remove]').disabled =
            busy || model.readOnly || committed(selected) === null;
        checkbox.disabled = busy || model.readOnly;
        $('.av-bulk [type=submit]').disabled =
            busy || !Number(rating().episodesWatched);
        input.readOnly = model.readOnly;
        range.disabled = model.readOnly;
        root.querySelectorAll('[data-step]').forEach((button) => {
            button.disabled = model.readOnly;
        });
        error.textContent = valid
            ? ''
            : 'Use uma nota de 0,1 a 10, com até uma casa decimal.';
        input.setAttribute('aria-invalid', String(!valid));
        if (valid && value !== null) range.value = value;
        range.style.setProperty(
            '--av-fill',
            `${((Number(range.value) - 0.1) / 9.9) * 100}%`,
        );
        range.setAttribute(
            'aria-valuetext',
            value === null
                ? 'Sem nota'
                : valid
                  ? formatScore(value) + ' de 10'
                  : 'Nota inválida',
        );
    }

    function refreshRail() {
        const page = episodeWindow(selected, total);
        rail.innerHTML = page.episodes
            .map(
                (episode) =>
                    `<button type="button" data-episode="${episode}" aria-pressed="${episode === selected}" aria-label="Episódio ${episode}, ${committed(episode) === null ? 'sem nota' : 'nota ' + formatScore(committed(episode))}"><span>${String(episode).padStart(2, '0')}</span><span>Episódio ${String(episode).padStart(2, '0')}<small>${shared.drafts.has(draftKey(episode)) ? 'Rascunho' : episodeWatched(rating(), episode) ? 'Assistido' : 'Ainda não assistido'}</small></span>${scoreMarkup(committed(episode))}</button>`,
            )
            .join('');
        picker.innerHTML = page.episodes
            .map(
                (episode) =>
                    `<option value="${episode}" ${episode === selected ? 'selected' : ''}>Episódio ${String(episode).padStart(2, '0')} · ${formatScore(committed(episode))}</option>`,
            )
            .join('');
        $('[data-page="-1"]').disabled = page.start <= 1;
        $('[data-page="1"]').disabled = page.end >= total;
        $('.av-episode-pagination span').textContent =
            `${page.start}–${page.end} / ${total}`;
        const activeBtn = rail.querySelector(`[data-episode="${selected}"]`);
        if (activeBtn) {
            activeBtn.scrollIntoView({ block: 'nearest' });
        }
    }

    function refreshEditor() {
        $('#av-editor-title').textContent =
            total === 1
                ? 'A sua nota para o filme.'
                : `Episódio ${String(selected).padStart(2, '0')}`;
        $('.av-score-label').textContent =
            total === 1
                ? 'Como essa história ficou com você?'
                : `Sua nota para o episódio ${String(selected).padStart(2, '0')}`;
        input.value = currentDraft();
        range.value = committed(selected) || 5;
        checkbox.checked = episodeWatched(rating(), selected);
        checkbox.setAttribute(
            'aria-label',
            total === 1
                ? 'Filme assistido'
                : `Assistido até o episódio ${selected}`,
        );
        checkbox.title =
            'Marcar inclui os episódios anteriores. Desmarcar também desmarca os posteriores.';
        next.hidden = total === 1;
        next.disabled = selected >= total;
        const count = Number(rating().episodesWatched) || 0;
        $('.av-bulk').hidden = total === 1 || model.readOnly;
        $('.av-bulk p').textContent = count
            ? `Substitui as notas dos episódios 1 a ${count}.`
            : 'Marque os episódios assistidos antes de aplicar uma nota em lote.';
        $('.av-bulk [type=submit]').disabled = count === 0;
        paint();
    }

    function select(episode, animate) {
        selected = Math.max(1, Math.min(total, Number(episode) || 1));
        shared.selections.set(identity, selected);
        refreshRail();
        refreshEditor();
        model.selected?.(selected);
        if (animate)
            shared.animate(
                $('.av-rating-form'),
                [
                    { opacity: 0.45, transform: 'translateY(7px)' },
                    { opacity: 1, transform: 'none' },
                ],
                {
                    channel: 'rating-editor',
                    duration: 180,
                    easing: 'cubic-bezier(.22,1,.36,1)',
                },
            );
    }

    function draft(value) {
        input.value = value;
        if (parseScore(value) === committed(selected))
            shared.drafts.delete(draftKey(selected));
        else shared.drafts.set(draftKey(selected), value);
        paint();
    }
    function showResult(result, message) {
        const synced = result?.synced !== false;
        feedback.textContent = synced
            ? message + ' Sincronizada com sua conta.'
            : message + ' Salva neste dispositivo; a sincronização falhou.';
        retry.hidden = synced;
    }

    async function commit(value) {
        if (busy || model.readOnly || value === undefined) return;
        const episode = selected;
        const key = draftKey(episode);
        const captured = shared.drafts.get(key);
        undo = { episode, value: committed(episode) };
        busy = true;
        paint();
        feedback.textContent = 'Salvando sua avaliação…';
        retry.hidden = true;
        try {
            const result = await model.rate(episode, value);
            if (disposed) return;
            if (shared.drafts.get(key) === captured) shared.drafts.delete(key);
            showResult(
                result,
                value === null
                    ? 'Nota removida.'
                    : 'Nota ' + formatScore(value) + ' salva.',
            );
            $('[data-undo]').hidden = false;
            refreshRail();
            refreshEditor();
        } catch (_) {
            if (!disposed) {
                feedback.textContent =
                    'Não foi possível salvar. Seu rascunho foi mantido.';
                retry.hidden = false;
            }
        } finally {
            busy = false;
            if (!disposed) paint();
        }
    }

    input.addEventListener('input', () => draft(input.value));
    range.addEventListener('input', () =>
        draft(formatScore(Number(range.value))),
    );
    root.querySelectorAll('[data-step]').forEach((button) =>
        button.addEventListener('click', () =>
            draft(
                formatScore(
                    Math.max(
                        0.1,
                        Math.min(
                            10,
                            (parseScore(input.value) || 0) +
                                Number(button.dataset.step),
                        ),
                    ),
                ),
            ),
        ),
    );
    $('.av-rating-form').addEventListener('submit', (event) => {
        event.preventDefault();
        commit(parseScore(input.value));
    });
    rail.addEventListener('click', (event) => {
        const button = event.target.closest('[data-episode]');
        if (button) select(button.dataset.episode, event.detail > 0);
    });
    rail.addEventListener('wheel', (e) => {
        if (rail.scrollHeight > rail.clientHeight) {
            e.stopPropagation();
            const delta = e.deltaY;
            const atTop = rail.scrollTop <= 0 && delta < 0;
            const atBottom = Math.ceil(rail.scrollTop + rail.clientHeight) >= rail.scrollHeight && delta > 0;
            if (!atTop && !atBottom) {
                rail.scrollTop += delta;
                e.preventDefault();
            }
        }
    }, { passive: false });
    picker.addEventListener('change', () => select(picker.value, false));
    root.querySelectorAll('[data-page]').forEach((button) =>
        button.addEventListener('click', () =>
            select(selected + Number(button.dataset.page) * 40, false),
        ),
    );
    next.addEventListener('click', (event) =>
        select(selected + 1, event.detail > 0),
    );
    $('[data-revert]').addEventListener('click', () => {
        shared.drafts.delete(draftKey(selected));
        refreshEditor();
        refreshRail();
        feedback.textContent = 'Rascunho revertido.';
    });
    $('[data-remove]').addEventListener('click', () => {
        draft('');
        commit(null);
    });
    $('[data-undo]').addEventListener('click', () => {
        if (!undo) return;
        const previous = undo;
        select(previous.episode, false);
        draft(previous.value === null ? '' : formatScore(previous.value));
        commit(previous.value);
    });
    checkbox.addEventListener('change', async () => {
        const episode = selected;
        const removesNotes =
            !checkbox.checked &&
            Object.keys(rating().episodeRatings || {}).some(
                (key) => Number(key) >= episode,
            );
        if (
            removesNotes &&
            !window.confirm(
                'Desmarcar este episódio também remove suas notas e as dos episódios seguintes. Continuar?',
            )
        ) {
            checkbox.checked = true;
            return;
        }
        busy = true;
        paint();
        try {
            const result = await model.watch(episode, checkbox.checked);
            if (!disposed) {
                showResult(result, 'Progresso atualizado.');
                refreshRail();
                refreshEditor();
            }
        } catch (_) {
            if (!disposed)
                feedback.textContent =
                    'Não foi possível atualizar o progresso.';
        } finally {
            busy = false;
            if (!disposed) paint();
        }
    });
    retry.addEventListener('click', async () => {
        retry.disabled = true;
        try {
            showResult(await model.retry(), 'Dados salvos.');
        } finally {
            if (!disposed) retry.disabled = false;
        }
    });
    $('.av-bulk form').addEventListener('submit', async (event) => {
        event.preventDefault();
        if (busy || model.readOnly) return;
        const value = Number($('#av-bulk-score').value);
        const alert = $('.av-bulk [role=alert]');
        if (value < 1 || value > 10 || !Number.isFinite(value)) {
            alert.textContent = 'Use uma nota de 1 a 10.';
            return;
        }
        if (
            !window.confirm(
                'Aplicar ' +
                    formatScore(value) +
                    ' aos episódios 1 a ' +
                    rating().episodesWatched +
                    '?',
            )
        )
            return;
        busy = true;
        paint();
        alert.textContent = '';
        try {
            const result = await model.general(value);
            if (!disposed) {
                refreshRail();
                refreshEditor();
                showResult(result, 'Notas em lote atualizadas.');
            }
        } catch (_) {
            if (!disposed)
                alert.textContent =
                    'Não foi possível aplicar as notas. Tente novamente.';
        } finally {
            busy = false;
            if (!disposed) paint();
        }
    });
    refreshRail();
    refreshEditor();
    model.selected?.(selected);
    return {
        identity,
        update(nextModel) {
            model = nextModel;
            refreshRail();
            if (!root.contains(document.activeElement)) refreshEditor();
        },
        destroy() {
            disposed = true;
        },
    };
}

module.exports = { createWorkbench };
