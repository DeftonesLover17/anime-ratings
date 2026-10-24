const {
    escapeHtml: e,
    element,
    imageUrl,
    scoreMarkup,
    arrow,
} = require('../shared/dom');

function createConversation(host, initialModel, drafts) {
    let model = initialModel;
    let kind = 'review';
    let filter = 'all';
    let order = 'new';
    let visibleCount = 20;
    let busy = false;
    let disposed = false;
    const expandedSpoilers = new Set();
    const identity = model.animeId + ':' + model.authorId;
    const replyKey = (id) => identity + ':reply:' + id;
    const replyDrafts = {
        get: (id) => drafts.get(replyKey(id)),
        set(id, draft) {
            if (draft.text) drafts.set(replyKey(id), draft);
            else drafts.delete(replyKey(id));
        },
        delete: (id) => drafts.delete(replyKey(id)),
    };
    const key = () => identity + ':' + kind + ':' + scope.value;
    const root = element(
        `<div class="av-conversation-grid"><div class="av-composer"><div class="av-composer-heading"><h3>Escreva sua leitura.</h3><span>${e(model.authorName)}</span></div><form class="av-review-form"><fieldset><legend>Tipo de publicação</legend><div class="av-segment"><label><input type="radio" name="publicationKind" value="review" checked><span>Review da obra</span></label><label><input type="radio" name="publicationKind" value="comment"><span>Comentário</span></label></div></fieldset><label class="av-scope-label">Sobre<select name="scope" aria-label="Contexto da publicação"><option value="work">A obra completa</option></select></label><label class="av-review-title-label">Título <span>opcional</span><input name="title" maxlength="160" autocomplete="off" placeholder="Uma ideia que resume sua leitura…"></label><label for="av-review-body" class="av-body-label">Sua review</label><textarea id="av-review-body" name="body" maxlength="5000" rows="7" placeholder="O que essa história deixou com você?" required></textarea><div class="av-review-options"><label><input type="checkbox" name="spoiler"> Contém spoilers</label><span data-count>0 / 5000</span></div><p class="av-quiet">Spoilers ficam ocultos até a pessoa escolher abrir.</p><button type="submit" class="av-button av-button-solid">Publicar review ${arrow()}</button><p class="av-composer-feedback" role="status" aria-live="polite">Sua publicação fica vinculada à sua conta.</p><button type="button" class="av-text-link" data-retry hidden>Tentar sincronizar novamente</button></form></div><div class="av-reading"><div class="av-feed-header"><h3>Reviews e comentários <span data-total></span></h3><label>Ordenar<select name="order" aria-label="Ordenar publicações"><option value="new">Mais recentes</option><option value="old">Mais antigos</option></select></label></div><div class="av-feed-filters" role="group" aria-label="Filtrar publicações"><button type="button" data-filter="all" aria-pressed="true">Tudo <span></span></button><button type="button" data-filter="review" aria-pressed="false">Reviews <span></span></button><button type="button" data-filter="comment" aria-pressed="false">Comentários <span></span></button></div><div class="av-text-feed"></div></div></div>`,
    );
    host.replaceChildren(root);
    const $ = (selector) => root.querySelector(selector);
    const form = $('.av-review-form');
    const scope = $('[name=scope]');
    const title = $('[name=title]');
    const body = $('[name=body]');
    const spoiler = $('[name=spoiler]');
    const submit = form.querySelector('[type=submit]');
    const status = $('.av-composer-feedback');
    const retry = $('[data-retry]');
    const feed = $('.av-text-feed');

    function dateLabel(value) {
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'medium',
            }).format(new Date(value));
        } catch (_) {
            return '';
        }
    }
    function readDraft() {
        return {
            title: title.value,
            body: body.value,
            spoiler: spoiler.checked,
        };
    }
    function saveDraft() {
        const draft = readDraft();
        if (draft.title || draft.body || draft.spoiler)
            drafts.set(key(), draft);
        else drafts.delete(key());
        $('[data-count]').textContent = body.value.length + ' / 5000';
    }
    function restoreDraft() {
        const saved = drafts.get(key()) || {};
        title.value = saved.title || '';
        body.value = saved.body || '';
        spoiler.checked = !!saved.spoiler;
        $('[data-count]').textContent = body.value.length + ' / 5000';
    }
    function controls() {
        $('.av-review-title-label').hidden = kind !== 'review';
        $('.av-body-label').textContent =
            kind === 'review' ? 'Sua review' : 'Seu comentário';
        submit.innerHTML = busy
            ? 'Publicando…'
            : `Publicar ${kind === 'review' ? 'review' : 'comentário'} ${arrow()}`;
        submit.disabled = busy || !model.authorId;
    }
    function updateScope() {
        const previous = scope.value;
        const episode = Number(model.selectedEpisode) || 1;
        const existing = [...scope.options].find(
            (option) => option.value !== 'work',
        );
        if (existing) existing.remove();
        if (model.episodeCount > 1) {
            const option = document.createElement('option');
            option.value = String(episode);
            option.textContent = `Episódio ${String(episode).padStart(2, '0')} · selecionado nas notas`;
            scope.append(option);
        }
        scope.value = previous === 'work' ? 'work' : String(episode);
    }

    function publication(post) {
        const author = model.author(post.friendId, post.friendName);
        const own = post.friendId === model.authorId;
        const hidden = !!post.spoiler && !expandedSpoilers.has(post.id);
        const label =
            post.kind === 'review'
                ? 'Review'
                : post.kind === 'comment'
                  ? 'Comentário'
                  : 'Publicação';
        // Replies can discuss the same reveal. Keep their text behind the parent spoiler.
        const replies = hidden ? [] : post.replies || [];
        const liked = (post.likes || []).includes(model.authorId);
        const avatar = imageUrl(author.avatar);
        const node = element(
            `<article class="av-publication" data-post-id="${e(post.id)}"><header><div class="av-author-avatar">${avatar ? `<img src="${e(avatar)}" width="40" height="40" loading="lazy" alt="">` : `<span aria-hidden="true">${e((author.name || '?').slice(0, 1).toUpperCase())}</span>`}</div><div><b>${e(author.name)}</b><p>${label} · ${post.episode ? 'Episódio ' + String(post.episode).padStart(2, '0') : 'A obra'} <span>· ${e(dateLabel(post.timestamp))}</span></p></div>${scoreMarkup(author.score)}</header><div class="av-publication-content">${hidden ? '<button type="button" class="av-spoiler-button">Esta leitura contém spoilers <span>Revelar texto ↗</span></button>' : `${post.title ? '<h4>' + e(post.title) + '</h4>' : ''}<p class="av-publication-body">${e(post.comment)}</p>`}</div><div class="av-publication-actions"><button type="button" data-like aria-pressed="${liked}">${liked ? 'Curtido' : 'Curtir'} <span>${(post.likes || []).length}</span></button><button type="button" data-reply>Responder <span>${replies.length || ''}</span></button>${own ? '<button type="button" data-edit>Editar</button><button type="button" data-delete>Apagar</button>' : ''}</div><div class="av-inline-edit" hidden></div><details class="av-replies" ${replies.length ? '' : 'hidden'}><summary>${replies.length} ${replies.length === 1 ? 'resposta' : 'respostas'}</summary><div>${replies.map((reply) => `<article><b>${e(model.author(reply.friendId, reply.friendName).name)}</b><p>${e(reply.reply)}</p></article>`).join('')}</div></details><form class="av-reply-form" hidden><label>Responder a ${e(author.name)}<textarea name="reply" maxlength="3000" rows="3" required></textarea></label><div><button type="button" data-cancel-reply>Cancelar</button><button type="submit" class="av-button av-button-outline">Enviar resposta ${arrow()}</button></div><p role="status"></p></form></article>`,
        );
        node.querySelector('.av-spoiler-button')?.addEventListener(
            'click',
            () => {
                expandedSpoilers.add(post.id);
                renderFeed();
            },
        );
        node.querySelector('[data-like]').addEventListener('click', (event) => {
            model.like(post.id);
            renderFeed();
            if (event.detail === 0)
                [...feed.querySelectorAll('[data-post-id]')]
                    .find((item) => item.dataset.postId === post.id)
                    ?.querySelector('[data-like]')
                    ?.focus({ preventScroll: true });
        });
        const replyForm = node.querySelector('.av-reply-form');
        const savedReply = replyDrafts.get(post.id);
        if (savedReply) {
            replyForm.hidden = !savedReply.open;
            replyForm.querySelector('textarea').value = savedReply.text;
        }
        replyForm.querySelector('textarea').addEventListener('input', () =>
            replyDrafts.set(post.id, {
                text: replyForm.querySelector('textarea').value,
                open: true,
            }),
        );
        node.querySelector('[data-reply]').addEventListener('click', () => {
            replyForm.hidden = !replyForm.hidden;
            replyDrafts.set(post.id, {
                text: replyForm.querySelector('textarea').value,
                open: !replyForm.hidden,
            });
            if (!replyForm.hidden) replyForm.querySelector('textarea').focus();
        });
        node.querySelector('[data-cancel-reply]').addEventListener(
            'click',
            () => {
                replyForm.hidden = true;
                replyDrafts.set(post.id, {
                    text: replyForm.querySelector('textarea').value,
                    open: false,
                });
            },
        );
        replyForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const input = replyForm.querySelector('textarea');
            const text = input.value.trim();
            if (!text) return;
            const button = replyForm.querySelector('[type=submit]');
            button.disabled = true;
            try {
                const result = await model.reply(post.id, text);
                if (disposed) return;
                if (replyDrafts.get(post.id)?.text.trim() === text)
                    replyDrafts.delete(post.id);
                renderFeed();
                status.textContent =
                    result?.synced === false
                        ? 'Resposta salva neste dispositivo. A sincronização será retomada.'
                        : 'Resposta publicada.';
            } catch (_) {
                if (!disposed) {
                    replyForm.querySelector('[role=status]').textContent =
                        'Não foi possível enviar. Seu texto foi mantido.';
                    button.disabled = false;
                }
            }
        });
        node.querySelector('[data-delete]')?.addEventListener(
            'click',
            async () => {
                if (
                    window.confirm('Apagar esta publicação e suas respostas?')
                ) {
                    await model.remove(post.id);
                    if (!disposed) renderFeed();
                }
            },
        );
        node.querySelector('[data-edit]')?.addEventListener('click', () => {
            const target = node.querySelector('.av-inline-edit');
            target.hidden = false;
            const editor = element(
                `<form><label>Título<input name="title" maxlength="160" value="${e(post.title || '')}"></label><label>Texto<textarea name="body" rows="5" maxlength="5000" required>${e(post.comment)}</textarea></label><label><input type="checkbox" name="spoiler" ${post.spoiler ? 'checked' : ''}> Contém spoilers</label><div><button type="button">Cancelar</button><button type="submit" class="av-button av-button-outline">Salvar edição</button></div><p role="status"></p></form>`,
            );
            target.replaceChildren(editor);
            editor
                .querySelector('[type=button]')
                .addEventListener('click', () => {
                    target.hidden = true;
                });
            editor.addEventListener('submit', async (event) => {
                event.preventDefault();
                const text = editor.querySelector('textarea').value.trim();
                if (!text) return;
                const button = editor.querySelector('[type=submit]');
                button.disabled = true;
                try {
                    await model.edit(post.id, {
                        comment: text,
                        title: editor
                            .querySelector('[name=title]')
                            .value.trim(),
                        spoiler: editor.querySelector('[name=spoiler]').checked,
                    });
                    if (!disposed) renderFeed();
                } catch (_) {
                    if (!disposed) {
                        editor.querySelector('[role=status]').textContent =
                            'Edição não salva. Tente novamente.';
                        button.disabled = false;
                    }
                }
            });
        });
        return node;
    }

    function renderFeed() {
        const posts = model.getComments() || [];
        $('[data-total]').textContent = String(posts.length).padStart(2, '0');
        root.querySelectorAll('[data-filter]').forEach((button) => {
            const type = button.dataset.filter;
            button.setAttribute('aria-pressed', String(type === filter));
            button.querySelector('span').textContent =
                type === 'all'
                    ? posts.length
                    : posts.filter((post) => post.kind === type).length;
        });
        const visible = posts
            .filter((post) => filter === 'all' || post.kind === filter)
            .slice()
            .sort(
                (a, b) =>
                    (new Date(a.timestamp) - new Date(b.timestamp)) *
                    (order === 'old' ? 1 : -1),
            );
        if (!visible.length) {
            feed.innerHTML = `<div class="av-feed-empty"><span>↗</span><h4>${posts.length ? 'Nenhuma leitura neste filtro.' : 'Toda conversa começa com uma leitura.'}</h4><p>${posts.length ? 'Escolha Tudo para ver as outras publicações.' : 'Escreva sobre uma cena, uma ideia ou o que essa história deixou em você.'}</p></div>`;
            return;
        }
        const fragment = document.createDocumentFragment();
        visible
            .slice(0, visibleCount)
            .forEach((post) => fragment.append(publication(post)));
        if (visibleCount < visible.length) {
            const more = element(
                '<button type="button" class="av-text-link">Ler mais publicações ' +
                    arrow('right') +
                    '</button>',
            );
            more.addEventListener('click', () => {
                visibleCount += 20;
                renderFeed();
            });
            fragment.append(more);
        }
        feed.replaceChildren(fragment);
    }

    form.querySelectorAll('[name=publicationKind]').forEach((input) =>
        input.addEventListener('change', () => {
            saveDraft();
            kind = input.value;
            restoreDraft();
            controls();
        }),
    );
    let previousScope = 'work';
    scope.addEventListener('change', () => {
        const next = scope.value;
        scope.value = previousScope;
        saveDraft();
        scope.value = next;
        previousScope = next;
        restoreDraft();
    });
    [title, body, spoiler].forEach((input) =>
        input.addEventListener('input', saveDraft),
    );
    root.querySelectorAll('[data-filter]').forEach((button) =>
        button.addEventListener('click', () => {
            filter = button.dataset.filter;
            visibleCount = 20;
            renderFeed();
        }),
    );
    $('[name=order]').addEventListener('change', (event) => {
        order = event.target.value;
        visibleCount = 20;
        renderFeed();
    });
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = body.value.trim();
        if (busy || !text || !model.authorId) return;
        saveDraft();
        const captured = readDraft();
        const capturedKey = key();
        const payload = {
            comment: text,
            kind,
            title: kind === 'review' ? title.value.trim() : '',
            episode: scope.value === 'work' ? null : Number(scope.value),
            spoiler: spoiler.checked,
        };
        busy = true;
        controls();
        status.textContent = 'Publicando sua leitura…';
        retry.hidden = true;
        try {
            const result = await model.publish(payload);
            if (disposed) return;
            const latest = drafts.get(capturedKey);
            if (JSON.stringify(latest) === JSON.stringify(captured)) {
                drafts.delete(capturedKey);
                if (key() === capturedKey) restoreDraft();
            }
            status.textContent =
                result?.synced === false
                    ? 'Publicação salva neste dispositivo. A sincronização falhou.'
                    : 'Sua leitura foi publicada.';
            retry.hidden = result?.synced !== false;
            renderFeed();
        } catch (_) {
            if (!disposed)
                status.textContent =
                    'Não foi possível publicar. Seu rascunho foi mantido.';
        } finally {
            busy = false;
            if (!disposed) controls();
        }
    });
    retry.addEventListener('click', async () => {
        retry.disabled = true;
        try {
            const result = await model.retry();
            if (disposed) return;
            retry.hidden = result?.synced !== false;
            status.textContent = retry.hidden
                ? 'Publicação sincronizada.'
                : 'Ainda sem conexão. Seu texto continua salvo neste dispositivo.';
        } finally {
            if (!disposed) retry.disabled = false;
        }
    });
    updateScope();
    restoreDraft();
    controls();
    renderFeed();
    return {
        identity,
        update(nextModel) {
            const previousKey = key();
            saveDraft();
            model = nextModel;
            updateScope();
            previousScope = scope.value;
            if (key() !== previousKey) restoreDraft();
            if (!feed.contains(document.activeElement)) renderFeed();
        },
        destroy() {
            saveDraft();
            disposed = true;
        },
    };
}

module.exports = { createConversation };
