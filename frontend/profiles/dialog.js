function createProfileDialogs(win) {
    const controllers = new WeakMap();
    const doc = win.document;
    function controller(modal) {
        if (controllers.has(modal)) return controllers.get(modal);
        let timer, opener;
        const focusables = () => [...modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
            .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
        const othersOpen = () => [...doc.querySelectorAll('[id$="-modal"], dialog[open]')]
            .some(node => node !== modal && !node.classList.contains('hidden') && win.getComputedStyle(node).display !== 'none');
        const finish = (restoreFocus = true) => {
            win.clearTimeout(timer); timer = undefined;
            modal.classList.add('hidden'); modal.classList.remove('flex', 'is-closing');
            if (win.updateModalScrollLock) win.updateModalScrollLock(); else if (!othersOpen()) { doc.body.classList.remove('overflow-hidden'); win.lenisStart?.(); }
            if (restoreFocus) {
                const destination = opener?.isConnected && !opener.closest('.hidden') ? opener : doc.getElementById?.('profile-indicator');
                destination?.focus();
            }
        };
        const api = {
            open() {
                win.clearTimeout(timer); timer = undefined;
                if (modal.classList.contains('hidden')) opener = doc.activeElement;
                modal.classList.remove('hidden', 'is-closing'); modal.classList.add('flex');
                modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
                modal.setAttribute('aria-label', modal.id === 'player-profile-modal' ? 'Perfil do membro' : 'Central de amigos');
                if (win.updateModalScrollLock) win.updateModalScrollLock(); else { doc.body.classList.add('overflow-hidden'); win.lenisStop?.(); }
                const shell = modal.querySelector('.av-player-modal-shell, .av-friends-shell');
                if (shell) shell.scrollTop = 0;
                modal.tabIndex = -1; (focusables()[0] || modal).focus({ preventScroll: true });
            },
            close({ immediate = false, restoreFocus = true } = {}) {
                if (modal.classList.contains('hidden')) return;
                win.clearTimeout(timer);
                if (immediate || win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { finish(restoreFocus); return; }
                modal.classList.add('is-closing'); timer = win.setTimeout(() => finish(restoreFocus), 220);
            }
        };
        modal.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); api.close(); }
            if (event.key !== 'Tab') return;
            const nodes = focusables(), first = nodes[0] || modal, last = nodes.at(-1) || modal;
            if (event.shiftKey && (doc.activeElement === first || doc.activeElement === modal)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (doc.activeElement === last || doc.activeElement === modal)) { event.preventDefault(); first.focus(); }
        });
        controllers.set(modal, api); return api;
    }
    return { open: modal => controller(modal).open(), close: (modal, options) => controller(modal).close(options) };
}
module.exports = { createProfileDialogs };
