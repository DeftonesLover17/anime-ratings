const VERSION = 'design-2026-10';

function createDesignUpdate(browser, session, storage) {
    const doc = browser.document;
    let dialog, observer, frame, owner = '';
    const key = username => `anivoid_notice:${VERSION}:${encodeURIComponent(username)}`;
    const visible = element => element && !element.hidden && !element.classList.contains('hidden') && browser.getComputedStyle(element).display !== 'none';
    function stopWatching() {
        observer?.disconnect();
        observer = null;
        if (frame) browser.cancelAnimationFrame(frame);
        frame = null;
    }
    function dismiss() {
        if (!dialog?.open) return;
        if (owner === session.username()) storage.setItem(key(owner), 'seen');
        dialog.close();
        owner = '';
    }
    function mount() {
        dialog = doc.createElement('dialog');
        dialog.className = 'av-design-update';
        dialog.setAttribute('aria-labelledby', 'av-design-update-title');
        dialog.setAttribute('data-lenis-prevent', 'true');
        dialog.innerHTML = `
            <header class="av-update-top"><span>ANIVØID <span aria-hidden="true">/</span> NOVA EXPERIÊNCIA</span><button type="button" aria-label="Fechar novidades" data-update-close>×</button></header>
            <div class="av-update-body">
                <p class="av-update-kicker">O MESMO COLETIVO. UM NOVO OLHAR.</p>
                <h2 id="av-design-update-title" tabindex="-1">Seu acervo.<br>Uma nova <em>perspectiva.</em></h2>
                <p class="av-update-intro">Redesenhamos o ANIVØID para colocar as obras, as suas notas e as suas descobertas em primeiro plano.</p>
                <ol class="av-update-changes">
                    <li><span aria-hidden="true">01</span><div><h3>As obras ganham o palco.</h3><p>Um catálogo mais visual, com capas em destaque e uma nova apresentação dos títulos.</p></div></li>
                    <li><span aria-hidden="true">02</span><div><h3>Cada detalhe, no seu lugar.</h3><p>Páginas de anime reorganizadas: história, estúdio, notas e reviews com mais clareza.</p></div></li>
                    <li><span aria-hidden="true">03</span><div><h3>Seu universo, mais perto.</h3><p>Menu da conta renovado, perfis mais completos e transições que acompanham a navegação.</p></div></li>
                </ol>
            </div>
            <footer class="av-update-footer"><span>Seu próximo favorito espera por você.</span><button type="button" data-update-enter>Explorar o novo ANIVØID <span aria-hidden="true">↗</span></button></footer>`;
        dialog.querySelector('[data-update-close]').addEventListener('click', dismiss);
        dialog.querySelector('[data-update-enter]').addEventListener('click', dismiss);
        dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
        doc.body.appendChild(dialog);
    }
    function attempt() {
        frame = null;
        const username = session.username();
        if (!username || storage.getItem(key(username)) === 'seen') { stopWatching(); return; }
        const blockers = doc.querySelectorAll('#splash-screen, #registration-gate, #member-welcome-modal, [id$="-modal"], dialog[open]');
        if ([...blockers].some(visible)) return;
        stopWatching();
        if (!dialog) mount();
        owner = username;
        dialog.showModal();
        dialog.querySelector('h2').focus();
    }
    function sync() {
        if (dialog?.open && owner !== session.username()) { dialog.close(); owner = ''; }
        if (dialog?.open || !doc.body) return;
        stopWatching();
        if (!session.username() || storage.getItem(key(session.username())) === 'seen') return;
        observer = new browser.MutationObserver(() => {
            if (!frame) frame = browser.requestAnimationFrame(attempt);
        });
        observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
        frame = browser.requestAnimationFrame(attempt);
    }
    doc.addEventListener('DOMContentLoaded', sync, { once: true });
    return { sync };
}
module.exports = { createDesignUpdate };
