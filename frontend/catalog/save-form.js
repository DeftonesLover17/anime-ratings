const controllers = new WeakMap();

function bindCatalogSaveForm(browser, { session, canEdit, readFields, onSaved, onError, baseUrl = '', timeoutMs = 20000 }) {
    const document = browser.document, form = document.getElementById('add-anime-form');
    if (!form) return null;
    if (controllers.has(form)) return controllers.get(form);
    const button = document.getElementById('anime-form-submit');
    let busy = false, generation = 0, owner = '', disabled = [];

    function setBusy(value) {
        busy = value;
        form.setAttribute('aria-busy', String(value));
        if (value) {
            disabled = [...form.querySelectorAll('input, textarea, select, button'), document.getElementById('close-add-anime')]
                .filter(Boolean).map(node => [node, node.disabled]);
            disabled.forEach(([node]) => { node.disabled = true; });
        } else { disabled.forEach(([node, wasDisabled]) => { node.disabled = wasDisabled; }); disabled = []; }
    }

    async function submit(event) {
        event?.preventDefault();
        if (busy) return;
        if (!canEdit() || !owner || owner !== session.username()) {
            onError(new Error('Sua sessão mudou. Feche esta janela e entre novamente antes de salvar.'));
            return;
        }
        const anime = readFields();
        if (!anime) return;
        if (!anime.title?.trim()) { onError(new Error('Informe o título da obra antes de salvar.')); return; }
        session.invalidatePending?.();
        const version = generation, authVersion = session.version(), label = button?.innerHTML;
        const current = () => generation === version && owner === session.username() && session.isCurrent(authVersion);
        const controller = new AbortController();
        let timer, result, failure;
        setBusy(true);
        if (button) button.textContent = anime.id ? 'Salvando alterações…' : 'Adicionando anime…';
        try {
            result = await Promise.race([
                (async () => {
                    const response = await browser.fetch(baseUrl + '/api/admin/animes', {
                        method: 'POST', credentials: 'include', signal: controller.signal,
                        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anime })
                    });
                    const payload = await response.json().catch(() => null);
                    if (!response.ok) throw new Error(payload?.error || 'Não foi possível salvar o anime.');
                    if (!payload?.anime?.id || typeof payload.anime.title !== 'string') throw new Error('Não foi possível confirmar o salvamento. Atualize o acervo antes de tentar novamente.');
                    return payload;
                })(),
                new Promise((_, reject) => { timer = browser.setTimeout(() => {
                    reject(new Error('A conexão demorou. Atualize o acervo para conferir se a obra foi salva antes de tentar novamente.'));
                    controller.abort();
                }, timeoutMs); })
            ]);
        } catch (error) { failure = error; }
        finally {
            browser.clearTimeout(timer);
            setBusy(false);
            if (button) button.innerHTML = label;
        }
        if (!current()) return;
        if (failure) onError(failure);
        else {
            session.invalidatePending?.();
            try { await onSaved(result, anime); }
            catch { onError(new Error('A obra foi salva, mas a tela não pôde ser atualizada. Recarregue o acervo antes de continuar.')); }
        }
    }

    const api = {
        get busy() { return busy; },
        begin() { if (busy) return false; generation++; owner = session.username(); return true; },
        close() { if (busy) return false; generation++; owner = ''; return true; },
        submit
    };
    form.addEventListener('submit', submit);
    controllers.set(form, api);
    return api;
}

function getCatalogSaveForm(document) { return controllers.get(document.getElementById('add-anime-form')); }
module.exports = { bindCatalogSaveForm, getCatalogSaveForm };
